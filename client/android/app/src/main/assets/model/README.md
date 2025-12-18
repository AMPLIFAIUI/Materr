# Model Assets

This directory is packaged with the Android application. Place the `DeepSeek-R1-Distill-Qwen-1.5B-Q4_0.gguf` weights file in this folder so the native llama runtime can load it at runtime. 

**Important:** Large model files (*.gguf) are now excluded from version control via .gitignore to prevent Git LFS issues. 

## Setup Instructions

1. Download the model file separately from your model source
2. Place it in this directory: `client/android/app/src/main/assets/model/`
3. The file should be named: `DeepSeek-R1-Distill-Qwen-1.5B-Q4_0.gguf`
4. Build the app - the model will be packaged with the APK

The `.gitkeep` file ensures this directory structure is maintained in version control.