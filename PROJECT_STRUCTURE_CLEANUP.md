# MATE Project Structure - Cleanup & Build Guide

**Date:** June 27, 2025  
**Purpose:** Clarify project structure and identify what's needed for APK builds

---

## 📁 CURRENT STRUCTURE ANALYSIS

### ✅ ESSENTIAL DIRECTORIES (Keep)
```
client/                    # MAIN PROJECT - React/Vite app
├── src/                  # Source code (React components, pages, logic)
├── android/              # Capacitor Android build directory
│   └── app/src/main/assets/  # Data files for APK (CRITICAL for offline)
├── local_data/           # Working data files (source)
├── public/               # Static assets (images, icons)
├── package.json          # Dependencies and scripts
└── vite.config.ts        # Build configuration
```

### 🗑️ REDUNDANT DIRECTORIES (Can Remove)
```
android/                  # OLD - Empty/unused Android folder
data/                     # OLD - Duplicate data files
local_data/               # ROOT LEVEL - Duplicate of client/local_data
server/                   # NOT NEEDED - For offline APK
MATE/                     # DUPLICATE - Images also in client/public/MATE
oldmate2/                 # OLD - Previous version
redundant/                # CLEANUP - Temporary files
DeepSeek-R1-Distill-Qwen-1.5B-Q4_0.gguf/  # AI MODEL - Not needed for APK
perplexity-ext/           # EXTENSION - Not needed for APK
```

---

## 🏗️ BUILD PROCESS FOR OFFLINE APK

### 1. **Data Preparation** (CRITICAL)
The APK build needs data files in the correct location:

**Source:** `client/local_data/`
- `specialists.json` ✅ (18 specialists)
- `conversations.json` ✅
- `messages.json` ✅
- `users.json` ✅ 
- `knowledgeBase.json` ✅

**Destination:** `client/android/app/src/main/assets/local_data/`

**Status:** ✅ Files copied successfully

### 2. **Build Commands** (In Order)
```bash
# 1. Navigate to main project
cd client

# 2. Install dependencies
npm install

# 3. Build web assets
npm run build

# 4. Sync with Capacitor
npx cap sync

# 5. Build Android APK
cd android
./gradlew assembleDebug
```

### 3. **Output Location**
APK will be generated at:
`client/android/app/build/outputs/apk/debug/app-debug.apk`

---

## 🧹 RECOMMENDED CLEANUP

### Files/Folders to Delete:
```
# Root level redundant directories
/android/
/data/
/local_data/
/server/
/MATE/
/oldmate2/
/redundant/
/DeepSeek-R1-Distill-Qwen-1.5B-Q4_0.gguf/
/perplexity-ext/

# Root level files
/capacitor.config.ts      # Empty file
/test-system.mjs          # Test file
/*.md files               # Keep only README.md
```

### Files to Keep:
```
client/                   # Entire directory
.git/                     # Version control
README.md                 # Project documentation
.gitignore               # Git ignore rules
```

---

## 📱 OFFLINE APK REQUIREMENTS

### ✅ Data Sources (Already Included)
- **Specialists:** 18 mental health specialists with full data
- **Crisis Services:** Emergency contact information
- **Knowledge Base:** Therapy techniques and responses
- **User Data:** Local storage for conversations and preferences

### ✅ Offline Features (Implemented)
- All specialists work offline
- Crisis detection and emergency contacts
- Local data storage (no internet required)
- Full UI/UX functionality

### ✅ Asset Management
- Icons and images bundled in APK
- Fonts and styles included
- No external dependencies for core functionality

---

## 🎯 NEXT STEPS

1. **Optional Cleanup:** Remove redundant directories (saves ~500MB)
2. **Build Fresh APK:** Using the corrected data files
3. **Test Installation:** Verify all specialists and data load correctly
4. **Verify Offline Mode:** Test without internet connection

---

## ⚠️ IMPORTANT NOTES

- **NEVER delete `client/` directory** - This is your main project
- **Always copy data to assets before building** - APK won't include data otherwise
- **Use `client/android/` for builds** - Not the root `/android/` folder
- **Keep backup of working APKs** - In case of build issues

---

**Last Updated:** June 27, 2025  
**Status:** ✅ Project structure clarified, data copied, ready for clean build
