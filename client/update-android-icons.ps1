# Update Android app icons with Mate logo

# Define source icon paths
$IconSource = "C:\Users\User\Desktop\Mate\MATE"

# Define destination paths for different icon densities
$MipmapPaths = @(
    "C:\Users\User\Desktop\Mate\client\android\app\src\main\res\mipmap-mdpi",
    "C:\Users\User\Desktop\Mate\client\android\app\src\main\res\mipmap-hdpi",
    "C:\Users\User\Desktop\Mate\client\android\app\src\main\res\mipmap-xhdpi",
    "C:\Users\User\Desktop\Mate\client\android\app\src\main\res\mipmap-xxhdpi",
    "C:\Users\User\Desktop\Mate\client\android\app\src\main\res\mipmap-xxxhdpi"
)

# Map source icons to correct sizes for each density
$IconMap = @{
    "mipmap-mdpi" = "Mate48x48.png"
    "mipmap-hdpi" = "Mate72x72.png"
    "mipmap-xhdpi" = "Mate96x96.png"
    "mipmap-xxhdpi" = "Mate144x144.png"
    "mipmap-xxxhdpi" = "Mate192x192.png"
}

# Copy the icons to their respective mipmap directories
foreach ($MipmapPath in $MipmapPaths) {
    $Density = $MipmapPath.Split('\')[-1]
    $SourceIcon = Join-Path -Path $IconSource -ChildPath $IconMap[$Density]
    
    if (Test-Path $SourceIcon) {
        $DestLauncher = Join-Path -Path $MipmapPath -ChildPath "ic_launcher.png"
        $DestRound = Join-Path -Path $MipmapPath -ChildPath "ic_launcher_round.png"
        $DestForeground = Join-Path -Path $MipmapPath -ChildPath "ic_launcher_foreground.png"
        
        Write-Host "Copying $SourceIcon to $DestLauncher"
        Copy-Item -Path $SourceIcon -Destination $DestLauncher -Force
        
        Write-Host "Copying $SourceIcon to $DestRound"
        Copy-Item -Path $SourceIcon -Destination $DestRound -Force
        
        Write-Host "Copying $SourceIcon to $DestForeground"
        Copy-Item -Path $SourceIcon -Destination $DestForeground -Force
    } else {
        Write-Host "Warning: Source icon $SourceIcon not found"
    }
}

# Update the adaptive icon XML files
$AdaptiveIconPath = "C:\Users\User\Desktop\Mate\client\android\app\src\main\res\mipmap-anydpi-v26"
$IconXmlFiles = Get-ChildItem -Path $AdaptiveIconPath -Filter "*.xml"

foreach ($XmlFile in $IconXmlFiles) {
    $XmlContent = @"
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
"@
    
    $XmlFilePath = Join-Path -Path $AdaptiveIconPath -ChildPath $XmlFile.Name
    Write-Host "Updating $XmlFilePath"
    Set-Content -Path $XmlFilePath -Value $XmlContent -Force
}

# Make sure we have a color defined for the icon background
$ValuesPath = "C:\Users\User\Desktop\Mate\client\android\app\src\main\res\values"
$ColorsXmlPath = Join-Path -Path $ValuesPath -ChildPath "ic_launcher_background.xml"

if (-not (Test-Path $ColorsXmlPath)) {
    $ColorXmlContent = @"
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#2196F3</color>
</resources>
"@
    
    Write-Host "Creating $ColorsXmlPath"
    Set-Content -Path $ColorsXmlPath -Value $ColorXmlContent -Force
}

Write-Host "Android app icons updated successfully!"
