import { useState } from 'react'
import { Code, Download, Copy, ExternalLink, Plug, Zap, Bot, Settings, Terminal, CheckCircle, ArrowRight } from 'lucide-react'

export default function MCPIntegration() {
  const [copiedConfig, setCopiedConfig] = useState<string | null>(null)
  
  const downloadFile = async (filename: string) => {
    try {
      const response = await fetch(`http://localhost:3001/mcp/${filename}`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
      // Fallback to direct link
      window.open(`http://localhost:3001/mcp/${filename}`, '_blank')
    }
  }
  
  const claudeConfig = `{
  "mcpServers": {
    "api-snippet-generator": {
      "command": "node",
      "args": ["/absolute/path/to/mcp/dist/server.js"],
      "env": {
        "API_BASE_URL": "http://localhost:3001/api"
      }
    }
  }
}`

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopiedConfig(type)
    setTimeout(() => setCopiedConfig(null), 2000)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <div className="flex items-center justify-center mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-2xl">
            <Plug className="h-12 w-12 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          MCP Integration
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Connect our API Snippet Generator directly to Claude, IDEs, and AI agents using the Model Context Protocol
        </p>
      </div>

      {/* What is MCP */}
      <div className="card dark:bg-gray-900 dark:border-gray-800 mb-12">
        <div className="flex items-start space-x-4">
          <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
            <Bot className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">What is MCP?</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              The <a href="https://modelcontextprotocol.io/" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                Model Context Protocol (MCP)
              </a> is an open standard that enables AI assistants to securely connect to external data sources and tools. 
              Our MCP server makes API snippet generation available directly within your AI workflows.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm">Direct tool access</span>
              </div>
              <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm">Real-time generation</span>
              </div>
              <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm">Marketplace browsing</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Available Tools */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Available Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card dark:bg-gray-900 dark:border-gray-800">
            <div className="flex items-center space-x-3 mb-3">
              <Zap className="h-6 w-6 text-yellow-500" />
              <h3 className="font-semibold text-gray-900 dark:text-white">generate_api_snippet</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-3">
              Generate documentation from GitHub repositories or NPM packages
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 rounded p-3 text-sm">
              <span className="text-green-600 dark:text-green-400">Input:</span> Package URL or name<br/>
              <span className="text-blue-600 dark:text-blue-400">Output:</span> Markdown + JSON metadata
            </div>
          </div>

          <div className="card dark:bg-gray-900 dark:border-gray-800">
            <div className="flex items-center space-x-3 mb-3">
              <Settings className="h-6 w-6 text-purple-500" />
              <h3 className="font-semibold text-gray-900 dark:text-white">browse_marketplace</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-3">
              Search and browse community-generated snippets
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 rounded p-3 text-sm">
              <span className="text-green-600 dark:text-green-400">Input:</span> Search terms, filters<br/>
              <span className="text-blue-600 dark:text-blue-400">Output:</span> Matching snippets list
            </div>
          </div>

          <div className="card dark:bg-gray-900 dark:border-gray-800">
            <div className="flex items-center space-x-3 mb-3">
              <Code className="h-6 w-6 text-green-500" />
              <h3 className="font-semibold text-gray-900 dark:text-white">get_snippet</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-3">
              Retrieve complete snippet documentation by ID
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 rounded p-3 text-sm">
              <span className="text-green-600 dark:text-green-400">Input:</span> Snippet ID<br/>
              <span className="text-blue-600 dark:text-blue-400">Output:</span> Full documentation
            </div>
          </div>

          <div className="card dark:bg-gray-900 dark:border-gray-800">
            <div className="flex items-center space-x-3 mb-3">
              <Download className="h-6 w-6 text-blue-500" />
              <h3 className="font-semibold text-gray-900 dark:text-white">save_to_marketplace</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-3">
              Save generated snippets to community marketplace
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 rounded p-3 text-sm">
              <span className="text-green-600 dark:text-green-400">Input:</span> Snippet object<br/>
              <span className="text-blue-600 dark:text-blue-400">Output:</span> Save confirmation
            </div>
          </div>
        </div>
      </div>

      {/* Installation Steps */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Installation</h2>
        
        <div className="space-y-6">
          <div className="card dark:bg-gray-900 dark:border-gray-800">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full w-8 h-8 flex items-center justify-center font-semibold">
                1
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Download & Setup MCP Server</h3>
            </div>
            <div className="ml-11">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Download the MCP server files and run the setup script:
              </p>
              <div className="bg-gray-900 dark:bg-black rounded-lg p-4 mb-4">
                <code className="text-green-400 text-sm">
                  # Download the project<br/>
                  # Navigate to the mcp directory<br/>
                  cd mcp<br/>
                  <br/>
                  # Run setup script<br/>
                  chmod +x setup.sh<br/>
                  ./setup.sh
                </code>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => downloadFile('setup.sh')}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Setup Script</span>
                </button>
                <a
                  href="https://github.com/your-org/api-snippet-generator/tree/main/mcp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary flex items-center space-x-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>View on GitHub</span>
                </a>
              </div>
            </div>
          </div>

          <div className="card dark:bg-gray-900 dark:border-gray-800">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full w-8 h-8 flex items-center justify-center font-semibold">
                2
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Start API Service</h3>
            </div>
            <div className="ml-11">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Ensure your API Snippet Generator service is running:
              </p>
              <div className="bg-gray-900 dark:bg-black rounded-lg p-4">
                <code className="text-green-400 text-sm">
                  # From the main project directory<br/>
                  npm run dev
                </code>
              </div>
            </div>
          </div>

          <div className="card dark:bg-gray-900 dark:border-gray-800">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full w-8 h-8 flex items-center justify-center font-semibold">
                3
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Configure Your AI Client</h3>
            </div>
            <div className="ml-11">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Add the MCP server to your AI client configuration:
              </p>
              
              {/* Claude Desktop Config */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Claude Desktop</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Add to <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">claude_desktop_config.json</code>:
                </p>
                <div className="bg-gray-900 dark:bg-black rounded-lg p-4 relative">
                  <button
                    onClick={() => copyToClipboard(claudeConfig, 'claude')}
                    className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white transition-colors"
                  >
                    {copiedConfig === 'claude' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                  <pre className="text-green-400 text-sm overflow-x-auto">
                    {claudeConfig}
                  </pre>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  <strong>Config locations:</strong><br/>
                  • macOS: <code>~/Library/Application Support/Claude/claude_desktop_config.json</code><br/>
                  • Windows: <code>%APPDATA%\Claude\claude_desktop_config.json</code><br/>
                  • Linux: <code>~/.config/Claude/claude_desktop_config.json</code>
                </p>
              </div>

              {/* VSCode Config */}
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">VSCode (with MCP extension)</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Add to your VSCode settings or MCP extension config:
                </p>
                <div className="bg-gray-900 dark:bg-black rounded-lg p-4">
                  <pre className="text-green-400 text-sm overflow-x-auto">
{`{
  "mcp.servers": [
    {
      "name": "api-snippet-generator",
      "path": "/absolute/path/to/mcp/dist/server.js",
      "env": {
        "API_BASE_URL": "http://localhost:3001/api"
      }
    }
  ]
}`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Examples */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Usage Examples</h2>
        
        <div className="space-y-6">
          <div className="card dark:bg-gray-900 dark:border-gray-800">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Generate Documentation</h3>
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-600 text-white rounded-full p-1 mt-1">
                  <span className="text-xs font-bold px-1">You</span>
                </div>
                <p className="text-gray-700 dark:text-gray-300">Generate documentation for the axios package</p>
              </div>
              <div className="flex items-center space-x-2 my-3 text-gray-500 dark:text-gray-400">
                <ArrowRight className="h-4 w-4" />
                <span className="text-sm">Claude uses generate_api_snippet tool</span>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-purple-600 text-white rounded-full p-1 mt-1">
                  <span className="text-xs font-bold px-1">AI</span>
                </div>
                <p className="text-gray-700 dark:text-gray-300">I've generated comprehensive documentation for axios including installation, authentication, CRUD operations, and error handling examples.</p>
              </div>
            </div>
          </div>

          <div className="card dark:bg-gray-900 dark:border-gray-800">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Repository Documentation</h3>
            <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-600 text-white rounded-full p-1 mt-1">
                  <span className="text-xs font-bold px-1">You</span>
                </div>
                <p className="text-gray-700 dark:text-gray-300">Create API documentation for this repository and save it as api-docs.md</p>
              </div>
              <div className="flex items-center space-x-2 my-3 text-gray-500 dark:text-gray-400">
                <ArrowRight className="h-4 w-4" />
                <span className="text-sm">AI analyzes repo, generates docs, creates file</span>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-purple-600 text-white rounded-full p-1 mt-1">
                  <span className="text-xs font-bold px-1">AI</span>
                </div>
                <p className="text-gray-700 dark:text-gray-300">I've analyzed your repository, generated comprehensive API documentation, and created api-docs.md with installation instructions, usage examples, and API references.</p>
              </div>
            </div>
          </div>

          <div className="card dark:bg-gray-900 dark:border-gray-800">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Browse Marketplace</h3>
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-600 text-white rounded-full p-1 mt-1">
                  <span className="text-xs font-bold px-1">You</span>
                </div>
                <p className="text-gray-700 dark:text-gray-300">Show me JavaScript snippets related to databases</p>
              </div>
              <div className="flex items-center space-x-2 my-3 text-gray-500 dark:text-gray-400">
                <ArrowRight className="h-4 w-4" />
                <span className="text-sm">Claude uses browse_marketplace tool</span>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-purple-600 text-white rounded-full p-1 mt-1">
                  <span className="text-xs font-bold px-1">AI</span>
                </div>
                <p className="text-gray-700 dark:text-gray-300">I found 5 JavaScript database-related snippets: mongoose (MongoDB), prisma (ORM), mysql2 (MySQL), redis (caching), and sequelize (SQL ORM). Would you like to see the full documentation for any of these?</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Troubleshooting */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Troubleshooting</h2>
        
        <div className="space-y-4">
          <details className="card dark:bg-gray-900 dark:border-gray-800">
            <summary className="font-medium text-gray-900 dark:text-white cursor-pointer flex items-center space-x-2">
              <Terminal className="h-5 w-5" />
              <span>"Connection refused" error</span>
            </summary>
            <div className="mt-4 pl-7 text-gray-600 dark:text-gray-400">
              <p className="mb-2">This usually means the API service isn't running. Check:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>API service is running at <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">http://localhost:3001</code></li>
                <li>No firewall blocking the connection</li>
                <li>Correct <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">API_BASE_URL</code> in MCP config</li>
              </ul>
            </div>
          </details>

          <details className="card dark:bg-gray-900 dark:border-gray-800">
            <summary className="font-medium text-gray-900 dark:text-white cursor-pointer flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>"Tool not found" error</span>
            </summary>
            <div className="mt-4 pl-7 text-gray-600 dark:text-gray-400">
              <p className="mb-2">The AI client can't see the MCP tools. Try:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Restart your AI client after configuration changes</li>
                <li>Verify MCP server is built: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">npm run build</code> in mcp folder</li>
                <li>Check absolute paths in configuration are correct</li>
                <li>Look at client debug logs for connection errors</li>
              </ul>
            </div>
          </details>

          <details className="card dark:bg-gray-900 dark:border-gray-800">
            <summary className="font-medium text-gray-900 dark:text-white cursor-pointer flex items-center space-x-2">
              <Code className="h-5 w-5" />
              <span>"Invalid response" error</span>
            </summary>
            <div className="mt-4 pl-7 text-gray-600 dark:text-gray-400">
              <p className="mb-2">The API is returning unexpected data. Check:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>API health: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">curl http://localhost:3001/health</code></li>
                <li>API endpoints are responding correctly</li>
                <li>Check API service console for errors</li>
                <li>Verify environment variables in API service</li>
              </ul>
            </div>
          </details>
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center">
        <div className="card dark:bg-gray-900 dark:border-gray-800 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Ready to Get Started?</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Install the MCP server and start generating API documentation directly in your AI workflows
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => downloadFile('setup.sh')}
              className="btn-primary flex items-center space-x-2"
            >
              <Download className="h-5 w-5" />
              <span>Download Setup Script</span>
            </button>
            <div className="flex gap-2">
              <button 
                onClick={() => window.open('http://localhost:3001/mcp/server.ts', '_blank')}
                className="btn-secondary flex items-center space-x-1 text-sm"
              >
                <Code className="h-4 w-4" />
                <span>Server</span>
              </button>
              <button 
                onClick={() => window.open('http://localhost:3001/mcp/package.json', '_blank')}
                className="btn-secondary flex items-center space-x-1 text-sm"
              >
                <Settings className="h-4 w-4" />
                <span>Package</span>
              </button>
              <button 
                onClick={() => window.open('http://localhost:3001/mcp/config.json', '_blank')}
                className="btn-secondary flex items-center space-x-1 text-sm"
              >
                <Settings className="h-4 w-4" />
                <span>Config</span>
              </button>
            </div>
            <a 
              href="https://modelcontextprotocol.io/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-secondary flex items-center space-x-2"
            >
              <ExternalLink className="h-5 w-5" />
              <span>Learn More About MCP</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}