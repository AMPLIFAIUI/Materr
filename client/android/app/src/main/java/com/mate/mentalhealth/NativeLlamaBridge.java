package com.mate.mentalhealth;

import android.util.Log;

import java.io.File;

/**
 * Wrapper around the native llama.cpp runtime. The native implementation is expected to provide
 * JNI bindings for loading a GGUF model and generating responses. When the native library is not
 * available we fail gracefully so the JavaScript layer can fall back to a different strategy.
 */
public class NativeLlamaBridge {
    private static final String TAG = "NativeLlamaBridge";

    private final boolean nativeLibAvailable;
    private long nativeContextHandle = 0L;
    private boolean modelLoaded = false;

    public NativeLlamaBridge() {
        boolean loaded = false;
        try {
            System.loadLibrary("llama");
            loaded = true;
            Log.i(TAG, "Successfully loaded native llama runtime library");
        } catch (UnsatisfiedLinkError | SecurityException exception) {
            Log.w(TAG, "Failed to load native llama runtime", exception);
        }
        nativeLibAvailable = loaded;
    }

    public boolean isNativeLibAvailable() {
        return nativeLibAvailable;
    }

    public synchronized boolean isModelLoaded() {
        return modelLoaded && nativeContextHandle != 0L;
    }

    public synchronized boolean loadModel(File modelFile) {
        if (!nativeLibAvailable) {
            Log.w(TAG, "Native llama runtime not available; cannot load model");
            return false;
        }

        if (modelFile == null || !modelFile.exists()) {
            Log.e(TAG, "Model file missing: " + modelFile);
            return false;
        }

        try {
            unload();
            nativeContextHandle = nativeInit(modelFile.getAbsolutePath());
            modelLoaded = nativeContextHandle != 0L;
            if (modelLoaded) {
                Log.i(TAG, "Llama model loaded successfully");
            } else {
                Log.e(TAG, "Native llama runtime returned null context handle");
            }
        } catch (UnsatisfiedLinkError error) {
            Log.e(TAG, "Native llama runtime symbols missing", error);
            modelLoaded = false;
            nativeContextHandle = 0L;
        } catch (Throwable throwable) {
            Log.e(TAG, "Unexpected error while loading llama model", throwable);
            modelLoaded = false;
            nativeContextHandle = 0L;
        }

        return modelLoaded;
    }

    public synchronized String generateResponse(String prompt) {
        if (!isModelLoaded()) {
            throw new IllegalStateException("Model is not loaded");
        }

        try {
            return nativeGenerate(nativeContextHandle, prompt);
        } catch (UnsatisfiedLinkError error) {
            Log.e(TAG, "Native llama runtime symbols missing during generation", error);
            throw new IllegalStateException("Native llama runtime not linked", error);
        } catch (Throwable throwable) {
            Log.e(TAG, "Native llama runtime failed to generate response", throwable);
            throw new IllegalStateException("Native llama runtime error", throwable);
        }
    }

    public synchronized void unload() {
        if (nativeContextHandle != 0L) {
            try {
                nativeRelease(nativeContextHandle);
            } catch (Throwable throwable) {
                Log.w(TAG, "Failed to release native llama context", throwable);
            }
        }
        nativeContextHandle = 0L;
        modelLoaded = false;
    }

    private native long nativeInit(String modelPath);

    private native String nativeGenerate(long contextHandle, String prompt);

    private native void nativeRelease(long contextHandle);
}
