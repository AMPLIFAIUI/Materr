package com.mate.mentalhealth;

import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "LlamaChat")
public class LlamaChatPlugin extends Plugin {
    private static final String TAG = "LlamaChatPlugin";

    @Override
    public void load() {
        Log.i(TAG, "LlamaChat plugin loaded");
    }

    @PluginMethod
    public void initializeModel(PluginCall call) {
        final boolean forceReload = call.getBoolean("forceReload", false);
        getBridge().execute(() -> {
            LlamaRuntimeManager manager = LlamaRuntimeManager.getInstance(getContext());
            LlamaRuntimeManager.InitResult initResult = manager.initializeModel(forceReload);

            JSObject result = new JSObject();
            result.put("success", initResult.isSuccess());
            result.put("message", initResult.getMessage());
            if (initResult.getModelFile() != null) {
                result.put("modelPath", initResult.getModelFile().getAbsolutePath());
            }

            call.resolve(result);
        });
    }

    @PluginMethod
    public void sendMessage(PluginCall call) {
        final String prompt = call.getString("message");
        if (prompt == null || prompt.trim().isEmpty()) {
            call.reject("Message is required");
            return;
        }

        getBridge().execute(() -> {
            LlamaRuntimeManager manager = LlamaRuntimeManager.getInstance(getContext());
            LlamaRuntimeManager.GenerationResult generationResult = manager.generateResponse(prompt);

            JSObject result = new JSObject();
            result.put("success", generationResult.isSuccess());
            result.put("message", generationResult.getMessage());
            if (generationResult.isSuccess()) {
                result.put("response", generationResult.getResponse());
            }

            call.resolve(result);
        });
    }
}
