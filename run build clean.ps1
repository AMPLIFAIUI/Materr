
Step 1: Navigate to the client directory
cd c:\Users\User\Desktop\Mate\client

# Step 2: Create the right package directory structure
$packagePath = "android\app\src\main\java\com\mate\mentalhealth"
New-Item -ItemType Directory -Path $packagePath -Force

# Step 3: Copy the MainActivity.java file to the new location with the correct package
$mainActivityContent = (Get-Content "android\app\src\main\java\com\oldmate\mentalhealth\MainActivity.java") -replace "com.oldmate.mentalhealth", "com.mate.mentalhealth"
$mainActivityContent | Out-File "$packagePath\MainActivity.java" -Encoding utf8

# Step 4: Clean the project
cd android
./gradlew clean

# Step 5: Build the project again
./gradlew assembleDebug --stacktrace

# Step 6: Output the location of the new APK
Write-Host "APK file is located at: $(Resolve-Path app\build\outputs\apk\debug\app-debug.apk)"