#!/bin/bash
# Start Lock PC Server with Docker

echo "════════════════════════════════════════════════════════════════"
echo "🐳 Starting Lock PC Server (Docker)"
echo "════════════════════════════════════════════════════════════════"
echo ""

cd "$(dirname "$0")"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running!"
    echo "   Please start Docker Desktop first."
    exit 1
fi

# Build and start containers
echo "📦 Building and starting containers..."
docker-compose up -d --build

# Wait for services to be ready
echo ""
echo "⏳ Waiting for services to be ready..."
sleep 5

# Check if containers are running
if docker ps | grep -q "lockpc-server"; then
    echo ""
    echo "════════════════════════════════════════════════════════════════"
    echo "✅ Server is running!"
    echo "════════════════════════════════════════════════════════════════"
    echo ""
    echo "📍 Local Access:"
    echo "   http://localhost:3000"
    echo ""
    echo "🔧 Useful Commands:"
    echo "   View logs:        docker-compose logs -f"
    echo "   Stop server:      docker-compose down"
    echo "   Restart:          docker-compose restart"
    echo "   Database backup:  docker exec lockpc-postgres pg_dump -U lockpc_user lockpc_db > backup.sql"
    echo ""
    echo "📱 For remote access from Android app:"
    echo "   1. Start tunnel:  lt --port 3000 --subdomain lockpc"
    echo "   2. Update Android app URL to tunnel address"
    echo ""
    echo "════════════════════════════════════════════════════════════════"
else
    echo ""
    echo "❌ Server failed to start!"
    echo "   Check logs: docker-compose logs"
    exit 1
fi
