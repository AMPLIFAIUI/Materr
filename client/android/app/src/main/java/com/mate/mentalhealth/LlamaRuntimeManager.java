package com.mate.mentalhealth;

import android.content.Context;
import android.content.res.AssetManager;
import android.text.TextUtils;
import android.util.Log;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;

/**
 * Coordinates loading GGUF models from the application assets and delegating inference to the
 * native llama runtime.
 */
public class LlamaRuntimeManager {
    private static final String TAG = "LlamaRuntimeManager";
    public static final String MODEL_FILE_NAME = "DeepSeek-R1-Distill-Qwen-1.5B-Q4_0.gguf";
    private static final String MODEL_ASSET_PATH = "model/" + MODEL_FILE_NAME;

    private static LlamaRuntimeManager instance;

    private final Context applicationContext;
    private final NativeLlamaBridge llamaBridge;

    private boolean initialized = false;
    private File modelFile;

    public static synchronized LlamaRuntimeManager getInstance(Context context) {
        if (instance == null) {
            instance = new LlamaRuntimeManager(context.getApplicationContext());
        }
        return instance;
    }

    private LlamaRuntimeManager(Context context) {
        this.applicationContext = context;
        this.llamaBridge = new NativeLlamaBridge();
    }

    public synchronized boolean isInitialized() {
        return initialized && llamaBridge.isModelLoaded();
    }

    public synchronized InitResult initializeModel(boolean forceReload) {
        if (!llamaBridge.isNativeLibAvailable()) {
            return new InitResult(false, "Native llama runtime not bundled with the app", null);
        }

        try {
            modelFile = copyModelToInternalStorage(forceReload);
        } catch (IOException exception) {
            Log.e(TAG, "Unable to copy llama model from assets", exception);
            return new InitResult(false, "Failed to copy GGUF model to internal storage", null);
        }

        if (modelFile == null || !modelFile.exists()) {
            return new InitResult(false, "Model file missing after copy", null);
        }

        if (forceReload) {
            llamaBridge.unload();
            initialized = false;
        }

        if (!llamaBridge.isModelLoaded()) {
            boolean loaded = llamaBridge.loadModel(modelFile);
            if (!loaded) {
                return new InitResult(false, "Failed to load GGUF model with native llama runtime", modelFile);
            }
        }

        initialized = true;
        return new InitResult(true, "Model initialized", modelFile);
    }

    public synchronized GenerationResult generateResponse(String prompt) {
        if (TextUtils.isEmpty(prompt)) {
            return new GenerationResult(false, "Prompt is empty", null);
        }

        if (!isInitialized()) {
            return new GenerationResult(false, "Model has not been initialized", null);
        }

        try {
            String response = llamaBridge.generateResponse(prompt);
            return new GenerationResult(true, "ok", response);
        } catch (IllegalStateException exception) {
            Log.e(TAG, "Native llama runtime failed to generate response", exception);
            initialized = false;
            return new GenerationResult(false, exception.getMessage(), null);
        }
    }

    private File copyModelToInternalStorage(boolean forceReload) throws IOException {
        File modelsDirectory = new File(applicationContext.getFilesDir(), "models");
        if (!modelsDirectory.exists() && !modelsDirectory.mkdirs()) {
            throw new IOException("Unable to create models directory");
        }

        File destinationFile = new File(modelsDirectory, MODEL_FILE_NAME);
        if (!destinationFile.exists() || destinationFile.length() == 0 || forceReload) {
            copyAssetFile(MODEL_ASSET_PATH, destinationFile);
        }
        return destinationFile;
    }

    private void copyAssetFile(String assetPath, File destination) throws IOException {
        AssetManager assetManager = applicationContext.getAssets();
        try (InputStream inputStream = assetManager.open(assetPath);
             FileOutputStream outputStream = new FileOutputStream(destination)) {
            byte[] buffer = new byte[8 * 1024];
            int read;
            while ((read = inputStream.read(buffer)) != -1) {
                outputStream.write(buffer, 0, read);
            }
            outputStream.flush();
        }
    }

    public static class InitResult {
        private final boolean success;
        private final String message;
        private final File modelFile;

        InitResult(boolean success, String message, File modelFile) {
            this.success = success;
            this.message = message;
            this.modelFile = modelFile;
        }

        public boolean isSuccess() {
            return success;
        }

        public String getMessage() {
            return message;
        }

        public File getModelFile() {
            return modelFile;
        }
    }

    public static class GenerationResult {
        private final boolean success;
        private final String message;
        private final String response;

        GenerationResult(boolean success, String message, String response) {
            this.success = success;
            this.message = message;
            this.response = response;
        }

        public boolean isSuccess() {
            return success;
        }

        public String getMessage() {
            return message;
        }

        public String getResponse() {
            return response;
        }
    }
}
