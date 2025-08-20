#!/bin/bash

# API Snippet Generator - Setup Script

set -e

echo "🚀 Setting up API Snippet Generator..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd apps/web && npm install && cd ../..

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd apps/api && npm install && cd ../..

# Copy environment files
echo "⚙️ Setting up environment files..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "📝 Created .env file. Please update it with your API keys."
fi

if [ ! -f apps/web/.env ]; then
    cp apps/web/.env.example apps/web/.env
    echo "📝 Created frontend .env file."
fi

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env file with your API keys"
echo "2. Run 'npm run dev' to start both frontend and backend servers"
echo "3. Or run them separately:"
echo "   - Frontend: npm run dev:web (http://localhost:3000)"
echo "   - Backend: npm run dev:api (http://localhost:3001)"
echo "4. Open http://localhost:3000 in your browser"
echo ""
echo "Happy coding! 🎉"