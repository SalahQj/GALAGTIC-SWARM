$bluePath = "C:\Users\Salah\.gemini\antigravity\brain\0c8e3879-22cb-4d55-908a-6d79e3763b60\ship_blue_v2_1770224383490.png"
$redPath = "C:\Users\Salah\.gemini\antigravity\brain\0c8e3879-22cb-4d55-908a-6d79e3763b60\ship_red_v3_1770224637258.png"

if (-not (Test-Path $bluePath)) { Write-Error "Blue ship image not found at $bluePath"; exit 1 }
if (-not (Test-Path $redPath)) { Write-Error "Red ship image not found at $redPath"; exit 1 }

$blueBytes = [IO.File]::ReadAllBytes($bluePath)
$redBytes = [IO.File]::ReadAllBytes($redPath)
$blueBase64 = [Convert]::ToBase64String($blueBytes)
$redBase64 = [Convert]::ToBase64String($redBytes)

# Write to JS file with explicit newlines and no wrapping
$content = "console.log('assets_embedded.js loaded');`r`nconst blueShipData = 'data:image/png;base64,$blueBase64';`r`nconst redShipData = 'data:image/png;base64,$redBase64';"
[IO.File]::WriteAllText("c:\Users\Salah\Desktop\M2_IA2_CASA_G1_2025_2026\mon propre jeux\assets_embedded.js", $content)

Write-Host "Assets generated successfully."
