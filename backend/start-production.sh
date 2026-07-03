#!/bin/bash

# NBA LITIGMUS Production Startup Script
# This script starts the application in production mode with all optimizations

echo "🏛️  NBA LITIGMUS - Production Startup"
echo "======================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "📦 PM2 not found. Installing PM2..."
    npm install -g pm2
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "⚠️  Please update .env with your actual configuration!"
    echo "Press Enter to continue or Ctrl+C to exit and configure..."
    read
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install --production
fi

# Create logs directory
mkdir -p logs

# Stop existing PM2 processes
echo "🛑 Stopping existing processes..."
pm2 stop ecosystem.config.js 2>/dev/null || true
pm2 delete ecosystem.config.js 2>/dev/null || true

# Start the application
echo "🚀 Starting NBA LITIGMUS in production mode..."
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
echo "⚙️  Setting up PM2 startup script..."
pm2 startup

echo ""
echo "✅ NBA LITIGMUS is now running in production mode!"
echo ""
echo "📊 Useful commands:"
echo "   pm2 monit              - Monitor in real-time"
echo "   pm2 logs               - View logs"
echo "   pm2 restart all        - Restart application"
echo "   pm2 stop all           - Stop application"
echo ""
echo "🌐 Application running on: http://localhost:5000"
echo "🏥 Health check: http://localhost:5000/api/health"
echo ""
