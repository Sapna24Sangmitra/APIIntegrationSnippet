#!/usr/bin/env node

/**
 * MCP Server for API Snippet Generator
 * 
 * This MCP server exposes our API snippet generation service as tools
 * that can be used by various IDE agents and AI assistants.
 * 
 * Available Tools:
 * - generate_api_snippet: Generate documentation from GitHub/NPM URLs
 * - browse_marketplace: Search and browse saved snippets
 * - get_snippet: Retrieve specific snippet by ID
 * - save_to_marketplace: Save snippet to community marketplace
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api';
const SERVER_NAME = 'api-snippet-generator';
const SERVER_VERSION = '1.0.0';

interface GenerateSnippetParams {
  url: string;
  format?: 'markdown' | 'json' | 'both';
}

interface BrowseMarketplaceParams {
  search?: string;
  language?: string;
  limit?: number;
  offset?: number;
}

interface GetSnippetParams {
  id: string;
}

interface SaveToMarketplaceParams {
  snippet: any;
  userId?: string;
}

class APISnippetMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: SERVER_NAME,
        version: SERVER_VERSION,
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'generate_api_snippet',
          description: 'Generate API documentation snippet from GitHub repository or NPM package URL',
          inputSchema: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: 'GitHub repository URL, NPM package URL, or package name (e.g., "axios", "https://github.com/axios/axios", "https://npmjs.com/package/express")',
              },
              format: {
                type: 'string',
                enum: ['markdown', 'json', 'both'],
                description: 'Output format - markdown only, json metadata only, or both',
                default: 'both',
              },
            },
            required: ['url'],
          },
        },
        {
          name: 'browse_marketplace',
          description: 'Browse and search the community marketplace for saved API snippets',
          inputSchema: {
            type: 'object',
            properties: {
              search: {
                type: 'string',
                description: 'Search term to filter snippets by name, description, or topics',
              },
              language: {
                type: 'string',
                description: 'Filter by programming language (javascript, typescript, python, etc.)',
              },
              limit: {
                type: 'number',
                description: 'Maximum number of results to return',
                default: 10,
              },
              offset: {
                type: 'number',
                description: 'Offset for pagination',
                default: 0,
              },
            },
            required: [],
          },
        },
        {
          name: 'get_snippet',
          description: 'Retrieve a specific API snippet by its ID from the marketplace',
          inputSchema: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                description: 'Unique identifier of the snippet',
              },
            },
            required: ['id'],
          },
        },
        {
          name: 'save_to_marketplace',
          description: 'Save a generated snippet to the community marketplace',
          inputSchema: {
            type: 'object',
            properties: {
              snippet: {
                type: 'object',
                description: 'The snippet object to save (must be a previously generated snippet)',
              },
              userId: {
                type: 'string',
                description: 'Optional user identifier',
                default: 'mcp-user',
              },
            },
            required: ['snippet'],
          },
        },
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'generate_api_snippet':
            return await this.generateApiSnippet(args as GenerateSnippetParams);

          case 'browse_marketplace':
            return await this.browseMarketplace(args as BrowseMarketplaceParams);

          case 'get_snippet':
            return await this.getSnippet(args as GetSnippetParams);

          case 'save_to_marketplace':
            return await this.saveToMarketplace(args as SaveToMarketplaceParams);

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    });

    // List available resources (health check, stats, etc.)
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [
        {
          uri: 'api://health',
          mimeType: 'application/json',
          name: 'API Health Status',
          description: 'Health check for the API snippet generator service',
        },
        {
          uri: 'api://stats',
          mimeType: 'application/json',
          name: 'Marketplace Statistics',
          description: 'Statistics about the snippet marketplace',
        },
      ],
    }));

    // Handle resource reads
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      switch (uri) {
        case 'api://health':
          return await this.getHealthStatus();

        case 'api://stats':
          return await this.getMarketplaceStats();

        default:
          throw new Error(`Unknown resource: ${uri}`);
      }
    });
  }

  private async generateApiSnippet(params: GenerateSnippetParams) {
    const response = await axios.post(`${API_BASE_URL}/snippets/generate`, {
      packageUrl: params.url,
    });

    const snippet = response.data.snippet; // Fix: API returns {status, snippet}
    const format = params.format || 'both';

    let content = [];

    if (format === 'markdown' || format === 'both') {
      content.push({
        type: 'text',
        text: `## Generated Markdown Documentation\n\n${snippet.markdown}`,
      });
    }

    if (format === 'json' || format === 'both') {
      const metadata = {
        vendorName: snippet.vendorName,
        language: snippet.language,
        topics: snippet.topics,
        lastUpdated: snippet.lastUpdated,
        description: snippet.description,
        generationMetadata: snippet.generationMetadata,
      };

      content.push({
        type: 'text',
        text: `## Snippet Metadata\n\n\`\`\`json\n${JSON.stringify(metadata, null, 2)}\n\`\`\``,
      });
    }

    return {
      content,
      metadata: {
        packageName: snippet.vendorName,
        generatedAt: new Date().toISOString(),
        confidence: snippet.generationMetadata?.confidence || 0,
      },
    };
  }

  private async browseMarketplace(params: BrowseMarketplaceParams) {
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append('search', params.search);
    if (params.language) queryParams.append('language', params.language);
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());

    const response = await axios.get(`${API_BASE_URL}/marketplace?${queryParams}`);
    const data = response.data;

    const snippetList = data.snippets
      .map((snippet: any, index: number) => {
        const sources = snippet.generationMetadata?.dataSource?.join(', ') || 'Unknown';
        const languages = snippet.language?.join(', ') || 'Unknown';
        
        return `${index + 1}. **${snippet.vendorName}** (${snippet.id})
   - Description: ${snippet.description || 'No description'}
   - Languages: ${languages}
   - Sources: ${sources}
   - Last Updated: ${new Date(snippet.lastUpdated).toLocaleDateString()}
   - Topics: ${snippet.topics?.slice(0, 3).join(', ') || 'None'}`;
      })
      .join('\n\n');

    return {
      content: [
        {
          type: 'text',
          text: `# Marketplace Snippets\n\nFound ${data.total} total snippets (showing ${data.snippets.length}):\n\n${snippetList}`,
        },
      ],
      metadata: {
        total: data.total,
        returned: data.snippets.length,
        searchParams: params,
      },
    };
  }

  private async getSnippet(params: GetSnippetParams) {
    const response = await axios.get(`${API_BASE_URL}/marketplace/${params.id}`);
    const snippet = response.data;

    const sources = snippet.generationMetadata?.dataSource?.join(', ') || 'Unknown';
    const languages = snippet.language?.join(', ') || 'Unknown';

    return {
      content: [
        {
          type: 'text',
          text: `# ${snippet.vendorName}\n\n**Description:** ${snippet.description}\n**Languages:** ${languages}\n**Sources:** ${sources}\n**Last Updated:** ${new Date(snippet.lastUpdated).toLocaleDateString()}\n\n## Documentation\n\n${snippet.markdown}`,
        },
      ],
      metadata: {
        id: snippet.id,
        vendorName: snippet.vendorName,
        sources: snippet.generationMetadata?.dataSource || [],
      },
    };
  }

  private async saveToMarketplace(params: SaveToMarketplaceParams) {
    const response = await axios.post(`${API_BASE_URL}/marketplace/save`, {
      snippet: params.snippet,
      userId: params.userId || 'mcp-user',
    });

    return {
      content: [
        {
          type: 'text',
          text: `✅ Successfully saved snippet "${params.snippet.vendorName}" to marketplace!\n\nSnippet ID: ${params.snippet.id}\nStatus: ${response.data.status}`,
        },
      ],
      metadata: {
        saved: true,
        snippetId: params.snippet.id,
        vendorName: params.snippet.vendorName,
      },
    };
  }

  private async getHealthStatus() {
    try {
      const response = await axios.get(`${API_BASE_URL.replace('/api', '')}/health`);
      return {
        contents: [
          {
            uri: 'api://health',
            mimeType: 'application/json',
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        contents: [
          {
            uri: 'api://health',
            mimeType: 'application/json',
            text: JSON.stringify({ status: 'unhealthy', error: 'API not responding' }, null, 2),
          },
        ],
      };
    }
  }

  private async getMarketplaceStats() {
    try {
      const response = await axios.get(`${API_BASE_URL}/marketplace/stats/overview`);
      return {
        contents: [
          {
            uri: 'api://stats',
            mimeType: 'application/json',
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        contents: [
          {
            uri: 'api://stats',
            mimeType: 'application/json',
            text: JSON.stringify({ error: 'Stats not available' }, null, 2),
          },
        ],
      };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    console.error(`🔌 API Snippet Generator MCP server running`);
    console.error(`📡 Connected to API at: ${API_BASE_URL}`);
    console.error(`🛠️  Available tools: generate_api_snippet, browse_marketplace, get_snippet, save_to_marketplace`);
  }
}

// Start the server
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new APISnippetMCPServer();
  server.run().catch((error) => {
    console.error('Failed to run server:', error);
    process.exit(1);
  });
}

export default APISnippetMCPServer;