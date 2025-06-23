package com.oldmate.mentalhealth;

import android.content.Context;
import android.content.res.AssetManager;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.*;

@CapacitorPlugin(name = "LlamaChat")
public class LlamaChatPlugin extends Plugin {
    
    private String modelPath;
    
    @Override
    public void load() {
        super.load();
        // Copy model from assets to internal storage
        copyModelToStorage();
    }
    
    private void copyModelToStorage() {
        try {
            Context context = getContext();
            AssetManager assetManager = context.getAssets();
            
            // Create internal directory for model
            File modelDir = new File(context.getFilesDir(), "models");
            if (!modelDir.exists()) {
                modelDir.mkdirs();
            }
            
            File modelFile = new File(modelDir, "DeepSeek-R1-Distill-Qwen-1.5B-Q4_0.gguf");
            
            if (!modelFile.exists()) {
                // Copy model from assets
                InputStream inputStream = assetManager.open("models/DeepSeek-R1-Distill-Qwen-1.5B-Q4_0.gguf");
                FileOutputStream outputStream = new FileOutputStream(modelFile);
                
                byte[] buffer = new byte[8192];
                int bytesRead;
                while ((bytesRead = inputStream.read(buffer)) != -1) {
                    outputStream.write(buffer, 0, bytesRead);
                }
                
                inputStream.close();
                outputStream.close();
            }
            
            modelPath = modelFile.getAbsolutePath();
            
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
    
    @PluginMethod
    public void initializeModel(PluginCall call) {
        JSObject ret = new JSObject();
        if (modelPath != null && new File(modelPath).exists()) {
            ret.put("success", true);
            ret.put("modelPath", modelPath);
            ret.put("message", "Model initialized successfully");
        } else {
            ret.put("success", false);
            ret.put("message", "Failed to initialize model");
        }
        call.resolve(ret);
    }
    
    @PluginMethod
    public void sendMessage(PluginCall call) {
        String message = call.getString("message");
        
        JSObject ret = new JSObject();
        
        if (message == null || message.isEmpty()) {
            ret.put("success", false);
            ret.put("message", "No message provided");
            call.resolve(ret);
            return;
        }
        
        // TODO: Integrate with llama.cpp native library
        // For now, return a placeholder response
        ret.put("success", true);
        ret.put("response", "AI: I received your message: " + message + " (Note: Full AI integration pending)");
        
        call.resolve(ret);
    }
}
