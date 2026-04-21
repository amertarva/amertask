# Force Restart Next.js with Cache Clear
Write-Host "🔥 Force Restarting Next.js..." -ForegroundColor Yellow

# Stop any running process on port 3001
Write-Host "⏹️  Stopping processes on port 3001..." -ForegroundColor Cyan
$processes = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
foreach ($proc in $processes) {
    Stop-Process -Id $proc -Force -ErrorAction SilentlyContinue
}

# Delete .next folder
Write-Host "🗑️  Deleting .next folder..." -ForegroundColor Cyan
if (Test-Path ".next") {
    Remove-Item -Recurse -Force .next
    Write-Host "✅ .next folder deleted" -ForegroundColor Green
}

# Delete node_modules cache
Write-Host "🗑️  Deleting node_modules cache..." -ForegroundColor Cyan
if (Test-Path "node_modules/.cache") {
    Remove-Item -Recurse -Force node_modules/.cache -ErrorAction SilentlyContinue
    Write-Host "✅ Cache deleted" -ForegroundColor Green
}

# Wait a moment
Start-Sleep -Seconds 1

# Start dev server
Write-Host "🚀 Starting dev server..." -ForegroundColor Green
Write-Host ""
Write-Host "After server starts:" -ForegroundColor Yellow
Write-Host "1. Open http://localhost:3001/auth/register" -ForegroundColor White
Write-Host "2. Press Ctrl+Shift+R to hard refresh browser" -ForegroundColor White
Write-Host "3. Check console for: 🔧 BASE_URL configured: /api" -ForegroundColor White
Write-Host ""

bun run dev
