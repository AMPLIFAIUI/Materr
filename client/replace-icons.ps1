# PowerShell script to replace Android icons with Mate logo

# Source directories containing Mate logos
 = @(
    'C:\Users\User\Desktop\Old-Mate\MATE',
    'C:\Users\User\Desktop\Old-Mate\client\MATE',
    'C:\Users\User\Desktop\Old-Mate\client\public\MATE'
)

# Target Android icon directories
 = @{
    'mipmap-mdpi' = 48
    'mipmap-hdpi' = 72
    'mipmap-xhdpi' = 96
    'mipmap-xxhdpi' = 144
    'mipmap-xxxhdpi' = 192
}

# Find the best matching Mate logo for each size
foreach ( in .Keys) {
     = []
     = Join-Path 'C:\Users\User\Desktop\Old-Mate\client\android\app\src\main\res' 
    
    # Look for exact size match in source directories
     = 
    foreach ( in ) {
         = Join-Path  "Matex.png"
        if (Test-Path ) {
             = 
            break
        }
    }
    
    # If exact match found, copy to all icon variants
    if () {
        Write-Host "Copying  to  icons"
        Copy-Item -Path  -Destination (Join-Path  'ic_launcher.png') -Force
        Copy-Item -Path  -Destination (Join-Path  'ic_launcher_round.png') -Force
        Copy-Item -Path  -Destination (Join-Path  'ic_launcher_foreground.png') -Force
    } else {
        Write-Host "No matching icon found for size x" -ForegroundColor Yellow
    }
}

Write-Host 'Android icons replaced with Mate logo!' -ForegroundColor Green
