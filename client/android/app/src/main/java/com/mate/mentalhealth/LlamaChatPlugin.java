package com.mate.mentalhealth;

import android.util.Log;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import org.json.JSONException;
import org.json.JSONObject;

@CapacitorPlugin(name = "LlamaChat")
public class LlamaChatPlugin extends Plugin {
    @Override
    public void load() {
        // Initialize model or native library here if needed
        Log.i("LlamaChatPlugin", "LlamaChat plugin loaded");
    }

    @com.getcapacitor.PluginMethod
    public void infer(PluginCall call) {
        String prompt = call.getString("prompt");
        if (prompt == null) {
            call.reject("Prompt is required");
            return;
        }
        // TODO: Add model inference logic here
        // For now, just echo the prompt
        JSONObject ret = new JSONObject();
        try {
            ret.put("result", "Echo: " + prompt);
        } catch (JSONException e) {
            call.reject("JSON error");
            return;
        }
        call.resolve(ret);
    }
}
