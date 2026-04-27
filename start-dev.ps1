# Development Startup Script
# Menjalankan backend dan frontend secara bersamaan

Write-Host "🚀 Starting Amertask Development Servers..." -ForegroundColor Cyan
Write-Host ""

# Check if bun is installed
if (-not (Get-Command bun -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Bun tidak ditemukan. Install dulu: https://bun.sh" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Checking dependencies..." -ForegroundColor Yellow

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing root dependencies..." -ForegroundColor Yellow
    bun install
}

if (-not (Test-Path "apps/server/node_modules")) {
    Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
    Set-Location apps/server
    bun install
    Set-Location ../..
}

if (-not (Test-Path "apps/web/node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    Set-Location apps/web
    bun install
    Set-Location ../..
}

Write-Host ""
Write-Host "✅ Dependencies ready!" -ForegroundColor Green
Write-Host ""

# Check if .env files exist
if (-not (Test-Path "apps/server/.env")) {
    Write-Host "⚠️  Backend .env tidak ditemukan. Copy dari .env.example" -ForegroundColor Yellow
    Copy-Item "apps/server/.env.example" "apps/server/.env"
    Write-Host "📝 Edit apps/server/.env dan isi credentials Supabase" -ForegroundColor Yellow
    Write-Host ""
}

if (-not (Test-Path "apps/web/.env.local")) {
    Write-Host "⚠️  Frontend .env.local tidak ditemukan. Copy dari .env.local.example" -ForegroundColor Yellow
    Copy-Item "apps/web/.env.local.example" "apps/web/.env.local"
    Write-Host ""
}

Write-Host "🔧 Configuration:" -ForegroundColor Cyan
Write-Host "   Backend:  http://localhost:3000" -ForegroundColor White
Write-Host "   Frontend: http://localhost:3001" -ForegroundColor White
Write-Host ""

# Start backend in new terminal
Write-Host "🦊 Starting Backend Server (port 3000)..." -ForegroundColor Magenta
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd apps/server; Write-Host '🦊 Backend Server' -ForegroundColor Magenta; bun run dev"

# Wait a bit for backend to start
Start-Sleep -Seconds 2

# Start frontend in new terminal
Write-Host "⚡ Starting Frontend Server (port 3001)..." -ForegroundColor Blue
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd apps/web; Write-Host '⚡ Frontend Server' -ForegroundColor Blue; bun run dev"

Write-Host ""
Write-Host "✅ Development servers starting..." -ForegroundColor Green
Write-Host ""
Write-Host "📱 Open browser: http://localhost:3001" -ForegroundColor Cyan
Write-Host "📚 API Docs:     http://localhost:3000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop this script (servers will keep running)" -ForegroundColor Yellow
Write-Host "To stop servers, close their terminal windows" -ForegroundColor Yellow

# Keep script running
while ($true) {
    Start-Sleep -Seconds 1
}
