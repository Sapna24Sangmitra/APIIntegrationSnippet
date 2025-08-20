# API Snippet Generator MCP Server

This is a Model Context Protocol (MCP) server that exposes the API Snippet Generator service as tools for AI assistants and IDEs. It allows agents to generate API documentation, browse the marketplace, and manage snippets directly within their workflows.

## What is MCP?

[Model Context Protocol (MCP)](https://modelcontextprotocol.io/) is an open protocol that enables seamless integration between AI assistants and external data sources and tools. This MCP server makes our API snippet generation capabilities available to any MCP-compatible client.

## Features

### 🛠️ Available Tools

1. **`generate_api_snippet`** - Generate documentation from GitHub/NPM URLs
   - Input: Package URL or name (e.g., "axios", "https://github.com/axios/axios")
   - Output: Markdown documentation + JSON metadata
   - Supports: GitHub repos, NPM packages, direct package names

2. **`browse_marketplace`** - Search and browse saved snippets
   - Input: Search terms, language filters, pagination
   - Output: List of matching snippets with metadata
   - Filters: By language, keywords, topics

3. **`get_snippet`** - Retrieve specific snippet by ID
   - Input: Snippet ID
   - Output: Complete snippet with documentation and metadata

4. **`save_to_marketplace`** - Save generated snippets
   - Input: Snippet object from generation
   - Output: Confirmation and marketplace ID

### 📊 Available Resources

- **`api://health`** - API service health status
- **`api://stats`** - Marketplace statistics and analytics

## Prerequisites

1. **API Snippet Generator Service** must be running
   - Default: `http://localhost:3001`
   - See main README for setup instructions

2. **Node.js 18+** - For MCP server runtime

3. **MCP-Compatible Client** - Such as:
   - Claude Desktop App
   - VSCode with MCP extensions
   - Custom AI agents using MCP SDK

## Installation

### Option 1: Standalone Installation
```bash
# Copy MCP files to a new directory
mkdir api-snippet-mcp
cp mcp-server.ts mcp-package.json mcp-config.json MCP-README.md api-snippet-mcp/
cd api-snippet-mcp

# Rename package.json
mv mcp-package.json package.json

# Install dependencies
npm install

# Build the server
npm run build
```

### Option 2: Use from Main Project
```bash
# From the main project directory
npm install @modelcontextprotocol/sdk

# Build MCP server
npx tsc mcp-server.ts --outDir dist --target es2022 --module esnext --moduleResolution bundler --allowSyntheticDefaultImports
```

## Configuration

### 1. Environment Variables

Create `.env` file or set environment variables:
```bash
API_BASE_URL=http://localhost:3001/api  # Your API server URL
```

### 2. For Claude Desktop App

Add to your Claude Desktop configuration file:
```json
{
  "mcpServers": {
    "api-snippet-generator": {
      "command": "node",
      "args": ["/absolute/path/to/dist/mcp-server.js"],
      "env": {
        "API_BASE_URL": "http://localhost:3001/api"
      }
    }
  }
}
```

**Configuration file locations:**
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

### 3. For VSCode MCP Extensions

Install an MCP extension and add the server configuration:
```json
{
  "mcp.servers": [
    {
      "name": "api-snippet-generator",
      "path": "/absolute/path/to/dist/mcp-server.js",
      "env": {
        "API_BASE_URL": "http://localhost:3001/api"
      }
    }
  ]
}
```

## Usage Examples

Once configured with an MCP client, you can use these tools:

### Generate API Documentation
```
User: Generate documentation for the axios package
Agent: I'll use the generate_api_snippet tool to create documentation for axios.

[Tool: generate_api_snippet]
Input: {"url": "axios"}

Result: [Generated markdown documentation with installation, usage examples, and API reference]
```

### Browse Marketplace
```
User: Show me JavaScript snippets related to databases
Agent: I'll search the marketplace for JavaScript database-related snippets.

[Tool: browse_marketplace] 
Input: {"search": "database", "language": "javascript", "limit": 5}

Result: [List of matching snippets with descriptions and metadata]
```

### Get Specific Snippet
```
User: Get me the full documentation for snippet ID xyz-123
Agent: I'll retrieve the complete snippet for you.

[Tool: get_snippet]
Input: {"id": "xyz-123"}

Result: [Complete snippet with markdown documentation]
```

### Save to Marketplace
```
User: Save this generated snippet to the marketplace
Agent: I'll save the snippet to the community marketplace.

[Tool: save_to_marketplace]
Input: {"snippet": {...}, "userId": "user-123"}

Result: [Confirmation of successful save]
```

## Advanced Usage

### File Creation in Repositories

When working with repository contexts, agents can:

1. **Generate documentation** for the current repository
2. **Save the .md file** directly to the repo
3. **Update existing documentation** with fresh snippets

Example workflow:
```
User: Create API documentation for this repository and save it as api-docs.md
Agent: 
1. [Analyzes current repository]
2. [Uses generate_api_snippet with repo URL]  
3. [Creates api-docs.md with generated content]
4. [Optionally saves to marketplace for community use]
```

### Batch Operations

Agents can process multiple packages:
```
User: Generate docs for axios, lodash, and express
Agent:
[Loops through each package]
[Generates documentation for all three]
[Provides consolidated results]
```

## Development

### Testing the MCP Server
```bash
# Test tool listing
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node dist/mcp-server.js

# Test tool call  
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"generate_api_snippet","arguments":{"url":"axios"}}}' | node dist/mcp-server.js
```

### Debug Mode
```bash
# Run with debug logging
DEBUG=* node dist/mcp-server.js

# Or run development server
npm run dev
```

### Custom API URL
```bash
# Point to different API instance
API_BASE_URL=https://your-api-server.com/api node dist/mcp-server.js
```

## Troubleshooting

### Common Issues

**"Connection refused"**
- Ensure API service is running at the configured URL
- Check `API_BASE_URL` environment variable
- Verify network connectivity

**"Tool not found"**
- Restart MCP client after configuration changes
- Verify MCP server is built (`npm run build`)
- Check client logs for connection errors

**"Invalid response"**
- API service may be down or returning errors
- Check API service health: `curl http://localhost:3001/health`
- Verify API endpoints are responding correctly

### Logs and Debugging

- **MCP Server logs**: Written to stderr (visible in client debug logs)
- **API Service logs**: Check your API service console output
- **Client logs**: Check your IDE/agent's MCP connection logs

## Security Considerations

- **Local Network Only**: Default configuration assumes local API service
- **No Authentication**: Current implementation doesn't include auth (suitable for local dev)
- **Input Validation**: MCP server validates tool inputs against schemas
- **Rate Limiting**: Inherits rate limits from underlying API service

## Integration Examples

### Claude Desktop Integration
```json
{
  "mcpServers": {
    "api-snippet-generator": {
      "command": "node", 
      "args": ["/Users/youruser/api-snippet-mcp/dist/mcp-server.js"],
      "env": {
        "API_BASE_URL": "http://localhost:3001/api"
      }
    }
  }
}
```

### Custom AI Agent Integration
```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

const client = new Client({
  name: "my-agent",
  version: "1.0.0"
}, {
  capabilities: {}
});

// Connect to MCP server
await client.connect(transport);

// Use tools
const result = await client.callTool({
  name: "generate_api_snippet",
  arguments: { url: "https://github.com/axios/axios" }
});
```

## Contributing

This MCP server is part of the larger API Snippet Generator project. To contribute:

1. Fork the main repository
2. Make changes to `mcp-server.ts`
3. Test with your MCP client
4. Submit a pull request

## License

MIT License - same as the main API Snippet Generator project.