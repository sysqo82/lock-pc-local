#!/bin/bash
# Stop Lock PC Server

echo "🛑 Stopping Lock PC Server..."
cd "$(dirname "$0")"
docker-compose down

echo "✅ Server stopped."
echo ""
echo "💡 To remove all data (including database):"
echo "   docker-compose down -v"
