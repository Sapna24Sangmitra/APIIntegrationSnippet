#!/bin/bash

# MCP Server Setup Script for API Snippet Generator
echo "🔌 Setting up MCP Server for API Snippet Generator..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ is required. Current version: $(node -v)"
    echo "Please update Node.js from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo "📦 Installing MCP server dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Build the server
echo "🔨 Building MCP server..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Failed to build MCP server"
    exit 1
fi

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating environment configuration..."
    cat > .env << EOF
# API Snippet Generator MCP Server Configuration
API_BASE_URL=http://localhost:3001/api
EOF
    echo "✅ Created .env file with default configuration"
else
    echo "✅ Using existing .env configuration"
fi

# Test the server
echo "🧪 Testing MCP server..."
if command -v timeout &> /dev/null; then
    TIMEOUT_CMD="timeout 5"
else
    TIMEOUT_CMD="gtimeout 5"
fi

TEST_RESULT=$(echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | $TIMEOUT_CMD node dist/server.js 2>/dev/null)

if echo "$TEST_RESULT" | grep -q "generate_api_snippet"; then
    echo "✅ MCP server is working correctly"
else
    echo "⚠️  MCP server test failed - this may be expected if API service isn't running"
fi

echo ""
echo "🎉 MCP Server setup complete!"
echo ""
echo "📍 Server location: $(pwd)/dist/server.js"
echo "🔧 Configuration: $(pwd)/config.json"
echo "📚 Documentation: $(pwd)/README.md"
echo ""
echo "Next steps:"
echo "1. Ensure your API service is running (npm run dev from main project)"
echo "2. Add MCP server to your AI client configuration"
echo "3. See README.md for client-specific setup instructions"
echo ""
echo "For Claude Desktop, add this to your config:"
echo "{"
echo '  "mcpServers": {'
echo '    "api-snippet-generator": {'
echo '      "command": "node",'
echo "      \"args\": [\"$(pwd)/dist/server.js\"],"
echo '      "env": {'
echo '        "API_BASE_URL": "http://localhost:3001/api"'
echo '      }'
echo '    }'
echo '  }'
echo "}"