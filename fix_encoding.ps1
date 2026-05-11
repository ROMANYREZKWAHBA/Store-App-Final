# Fix the encoding by reading as Default encoding and re-writing as UTF-8 without BOM
$filePath = "c:\Users\Romany\Desktop\New folder (3)\StoreApp\src\App.jsx"

# Read all bytes
$bytes = [System.IO.File]::ReadAllBytes($filePath)

# Show first 4 bytes to check for BOM
Write-Host "First 4 bytes: $($bytes[0]) $($bytes[1]) $($bytes[2]) $($bytes[3])"
Write-Host "Total bytes: $($bytes.Length)"

# Check for BOM
if ($bytes[0] -eq 0xFF -and $bytes[1] -eq 0xFE) {
    Write-Host "Detected: UTF-16 LE BOM"
    $text = [System.Text.Encoding]::Unicode.GetString($bytes)
} elseif ($bytes[0] -eq 0xFE -and $bytes[1] -eq 0xFF) {
    Write-Host "Detected: UTF-16 BE BOM"
    $text = [System.Text.Encoding]::BigEndianUnicode.GetString($bytes)
} elseif ($bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
    Write-Host "Detected: UTF-8 with BOM"
    $text = [System.Text.Encoding]::UTF8.GetString($bytes, 3, $bytes.Length - 3)
} else {
    Write-Host "No BOM detected, reading as UTF-8"
    $text = [System.Text.Encoding]::UTF8.GetString($bytes)
}

# Write back as UTF-8 without BOM
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($filePath, $text, $utf8NoBom)
Write-Host "File re-saved as UTF-8 without BOM"

# Verify
$newBytes = [System.IO.File]::ReadAllBytes($filePath)
Write-Host "New first 4 bytes: $($newBytes[0]) $($newBytes[1]) $($newBytes[2]) $($newBytes[3])"
Write-Host "New total bytes: $($newBytes.Length)"
