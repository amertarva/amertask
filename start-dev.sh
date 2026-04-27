#!/bin/bash
# Development Startup Script
# Menjalankan backend dan frontend secara bersamaan

echo "🚀 Starting Amertask Development Servers..."
echo ""

# Check if bun is installed
if ! command -v bun &> /dev/null; then
    echo "❌ Bun tidak ditemukan. Install dulu: https://bun.sh"
    exit 1
fi

echo "📦 Checking dependencies..."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing root dependencies..."
    bun install
fi

if [ ! -d "apps/server/node_modules" ]; then
    echo "Installing backend dependencies..."
    cd apps/server
    bun install
    cd ../..
fi

if [ ! -d "apps/web/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd apps/web
    bun install
    cd ../..
fi

echo ""
echo "✅ Dependencies ready!"
echo ""

# Check if .env files exist
if [ ! -f "apps/server/.env" ]; then
    echo "⚠️  Backend .env tidak ditemukan. Copy dari .env.example"
    cp apps/server/.env.example apps/server/.env
    echo "📝 Edit apps/server/.env dan isi credentials Supabase"
    echo ""
fi

if [ ! -f "apps/web/.env.local" ]; then
    echo "⚠️  Frontend .env.local tidak ditemukan. Copy dari .env.local.example"
    cp apps/web/.env.local.example apps/web/.env.local
    echo ""
fi

echo "🔧 Configuration:"
echo "   Backend:  http://localhost:3000"
echo "   Frontend: http://localhost:3001"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend
echo "🦊 Starting Backend Server (port 3000)..."
cd apps/server
bun run dev &
BACKEND_PID=$!
cd ../..

# Wait a bit for backend to start
sleep 2

# Start frontend
echo "⚡ Starting Frontend Server (port 3001)..."
cd apps/web
bun run dev &
FRONTEND_PID=$!
cd ../..

echo ""
echo "✅ Development servers running!"
echo ""
echo "📱 Open browser: http://localhost:3001"
echo "📚 API Docs:     http://localhost:3000/docs"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for processes
wait
