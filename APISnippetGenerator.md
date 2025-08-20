# API Snippet Generator - Architecture & Design Document

## 1. Design Decisions

### Repository Layout
We chose a **monorepo structure** using Turborepo:
```
sapnacs/
├── apps/api/     # Express backend
├── apps/web/     # React frontend  
└── packages/     # Shared code (ready for future use)
```

**Why:** Single repository simplifies development, shared TypeScript types between frontend/backend, and Turbo provides optimized builds.

### Metadata Format
We use a **dual-format approach**:

1. **Runtime Format** - Optimized for API responses
2. **Storage Format** - Optimized for querying and filtering

```typescript
interface PackageSnippet {
  id: string                    // UUID
  vendorName: string            // Display name
  packageIdentifier: string     // Technical ID
  language: string[]            // Detected languages
  topics: string[]              // Keywords/tags
  version: string               // Package version
  popularity: {                 // Metrics
    npmDownloads?: number
    githubStars?: number  
  }
  generationMetadata: {         // AI generation details
    llmModel: string
    dataSource: string[]
    confidence: number
  }
  markdown: string              // Generated docs
}
```

**Why:** Separates display data from generation metadata, enables future database migration, supports multiple data sources.

### LLM Pipeline
We implemented a **4-step analysis process**:
1. Repository Structure Discovery
2. Code Pattern Extraction  
3. API Surface Analysis
4. Documentation Synthesis

**Why:** Each step has a specific goal, builds on previous steps, produces confidence scores for quality tracking.

### Storage Choice
Currently using **file-based JSON storage** (`marketplace.json`).

**Why:** Zero configuration for POC, human-readable for debugging, easy migration path to database later.

## 2. Scaling to Dozens of Vendors

### Current State
- Single package input via URL
- Synchronous processing
- Manual triggering

### Scaling Approach

#### Batch Processing
Accept multiple packages in a single request:
```typescript
POST /api/snippets/batch
{
  "packages": [
    "github.com/stripe/stripe-node",
    "npm:@twilio/twilio",
    "github.com/sendgrid/sendgrid-nodejs"
  ]
}
```

#### Vendor Organization Discovery
Automatically find all packages from a vendor:
```typescript
// Find all Stripe packages
GET /api/vendors/stripe/discover
// Returns: stripe-node, stripe-ruby, stripe-python, etc.
```

#### Sequential Processing with Queue
Process multiple packages one after another to avoid rate limits:
- Process packages sequentially (one at a time)
- Add delay between requests to respect API limits
- Queue system to handle multiple user submissions
- Show progress: "Processing 3 of 12 packages..."

#### Vendor Collections
Pre-defined package groups:
```typescript
{
  "payment-apis": ["stripe", "paypal", "square"],
  "messaging-apis": ["twilio", "sendgrid", "slack"]
}
```

## 3. Potential Next Steps

### Immediate Features

#### Authentication for Private Snippets
```typescript
interface PrivateSnippet extends PackageSnippet {
  visibility: 'public' | 'private' | 'team'
  ownerId: string
  accessControl: string[]
}
```
- OAuth integration (GitHub, Google)
- JWT-based sessions
- Private snippet storage

#### Versioning System
```typescript
interface VersionedSnippet {
  packageId: string
  versions: [{
    version: string
    createdAt: string
    changelog: string
    snippet: PackageSnippet
  }]
}
```
- Track package version changes
- Show diffs between versions
- Manual update triggers

### Future Scope

#### Missing Data Sources (Priority)

**PyPI Integration for Python Packages**
- Currently we only support JavaScript/TypeScript packages through NPM
- Python is the second most popular language but Python developers can't use our tool
- Would need to integrate PyPI's JSON API to fetch package metadata, dependencies, and version info
- Many Python packages also link to their GitHub repos which we could then analyze

**OpenAPI/Swagger Documentation**
- Many REST APIs provide OpenAPI/Swagger specifications that describe all endpoints
- We currently can't process these API specification files
- Adding support would allow generating documentation for any REST API service
- Would extract endpoints, parameters, authentication methods, and response schemas

**Web Search Capability**
- Currently limited to what's available in GitHub repos and NPM registry
- Many packages have extensive documentation on separate websites we can't access
- Adding web search would let us find and include official documentation sites
- Could also search Stack Overflow for common usage patterns and issues

#### Infrastructure Improvements

**Database Migration (PostgreSQL)**
- Current JSON file storage is fine for POC but won't scale beyond a few hundred snippets
- File-based storage can't handle concurrent writes or complex queries
- PostgreSQL would enable proper search, filtering, and multiple users
- Would also support full-text search across all generated documentation

**Caching Layer (Redis)**
- We repeatedly fetch the same package data from GitHub/NPM APIs
- No caching means unnecessary API calls and slower response times
- Redis would cache API responses to reduce external calls
- Would significantly speed up re-generation and updates

**Real-time Updates (WebSockets)**
- Current progress bar is completely fake - just a timer
- Users have no idea what's actually happening during generation
- WebSockets would show real progress: "Fetching GitHub data", "Analyzing code", "Generating docs"
- Would improve user experience and help debug failures

**Background Job Queue**
- Currently all processing happens synchronously in the API request
- Long-running generations can timeout or block other users
- Queue system would process snippets in background
- Would allow batch processing and better resource management

#### Advanced AI Architecture

**Agentic Approach with LangChain/CrewAI**
- Replace current rigid 4-step pipeline with intelligent agent system
- Agents would autonomously decide what data to fetch and analyze
- Different specialized agents for different tasks (GitHub agent, NPM agent, Doc searcher agent)
- Agents could work together: one finds the package, another analyzes code, another writes docs
- Would handle edge cases better - agent can retry, search alternatives, ask for clarification
- More efficient: agents only fetch what they need instead of everything

**Benefits of Agent Architecture**
- **Smart Source Detection**: Agent automatically identifies if it's GitHub, NPM, PyPI, or API spec
- **Tool Selection**: Agent chooses right tools (GitHub API, web search, etc.) based on context  
- **Error Recovery**: If one approach fails, agent tries alternatives
- **Quality Control**: Agent can self-evaluate and improve documentation
- **Conversation Memory**: Agents remember previous analyses for better context
- **Dynamic Workflow**: Instead of fixed steps, agents adapt to each package's needs

**Implementation Example**
- Use LangChain agents with custom tools for each data source
- Or CrewAI with specialized crew members (Researcher, Analyzer, Writer)
- Each agent has specific role: URL Identifier, Code Analyzer, Doc Writer, Quality Checker
- Agents communicate to build comprehensive documentation
- More intelligent than current linear pipeline approach

## 4. MCP Integration Architecture

### Design Decision: Protocol-Based AI Integration
We implemented **Model Context Protocol (MCP)** to expose our API service as tools for AI assistants.

**Why MCP over REST/SDK:**
- **Universal compatibility** - Works with Claude, VSCode, custom agents, any MCP client
- **Structured tool schemas** - AI knows exactly what inputs/outputs to expect
- **Real-time integration** - Direct tool access without UI context switching
- **Future-proof** - Standard protocol growing across AI ecosystem

### MCP Server Architecture
```
/mcp/
├── server.ts          # MCP protocol implementation
├── package.json       # Dependencies (MCP SDK, axios)
├── config.json        # Client configuration examples
├── setup.sh          # Automated installation script
└── README.md         # Integration documentation
```

**Design Pattern:** Thin wrapper around existing API
- MCP server doesn't duplicate business logic
- Proxies requests to existing `/api/snippets/*` endpoints
- Transforms responses to MCP-compatible format
- Maintains data consistency with web interface

### Tool Definitions
We expose **4 core tools** that mirror our web functionality:

```typescript
{
  "generate_api_snippet": {
    input: { url: string, format?: 'markdown'|'json'|'both' },
    output: "Generated documentation + metadata"
  },
  "browse_marketplace": {
    input: { search?: string, language?: string, limit?: number },
    output: "List of community snippets with metadata"
  },
  "get_snippet": {
    input: { id: string },
    output: "Complete snippet documentation"
  },
  "save_to_marketplace": {
    input: { snippet: object, userId?: string },
    output: "Save confirmation and marketplace ID"
  }
}
```

**Why These 4 Tools:**
- **Complete workflow coverage** - Generation → Browse → Retrieve → Save
- **AI agent compatibility** - Each tool has single responsibility
- **Composable operations** - Tools can be chained for complex workflows

### Integration Patterns

#### Direct Documentation Generation
```
User: "Generate docs for axios package"
Agent: Uses generate_api_snippet({url: "axios"})
Result: Full markdown documentation with examples
```

#### Repository File Creation
```
User: "Create API docs file for this repo"
Agent: 1. Analyzes current repository context
       2. Uses generate_api_snippet with repo URL
       3. Creates api-docs.md with generated content
       4. Optionally saves to marketplace
```

#### Community Knowledge Discovery
```
User: "Find database integration examples"
Agent: 1. Uses browse_marketplace({search: "database"})
       2. Uses get_snippet for relevant examples
       3. Presents curated documentation
```

### Client Configuration Strategy
**Multi-client support** with standardized configuration:

```json
{
  "mcpServers": {
    "api-snippet-generator": {
      "command": "node",
      "args": ["/path/to/mcp/dist/server.js"],
      "env": {"API_BASE_URL": "http://localhost:3001/api"}
    }
  }
}
```

**Supported Clients:**
- **Claude Desktop** - Personal AI assistant integration
- **VSCode Extensions** - IDE-embedded documentation generation
- **Custom Agents** - Programmatic access via MCP SDK
- **Future clients** - Any MCP-compatible system

### Scaling Considerations

#### Current MCP Limitations
- **Single API instance** - MCP server connects to one API service
- **Local development** - Configured for localhost:3001
- **No authentication** - Inherits API service auth (currently none)

#### Production MCP Scaling
```typescript
// Multi-environment support
const API_BASE_URL = process.env.MCP_API_URL || 'https://api.example.com'

// Authentication passthrough
const apiKey = process.env.MCP_API_KEY
const headers = apiKey ? {'Authorization': `Bearer ${apiKey}`} : {}
```

#### MCP Server Farm
For enterprise deployment:
- **Load balancer** distributing MCP connections
- **Multiple API instances** for high availability
- **Client-specific routing** based on organization
- **Usage tracking** per MCP client

### Integration Benefits

#### For Development Teams
- **Consistent documentation** across all repositories automatically
- **IDE integration** without custom plugins or extensions
- **Knowledge sharing** through marketplace discovery
- **Workflow integration** - docs generation during code review

#### For AI Workflows
- **Real-time context** - Documentation generated during conversations
- **Tool composition** - Combine with other MCP tools for complex workflows
- **Quality improvement** - AI has access to high-quality, current documentation
- **Learning patterns** - Community examples improve AI suggestions

### Future MCP Enhancements

#### Advanced Tool Operations
```typescript
// Batch processing
"generate_multiple_snippets": {
  input: { packages: string[], options: object },
  output: "Array of generated documentation"
}

// Smart updates
"update_outdated_snippets": {
  input: { repositoryContext: object },
  output: "Updated documentation with changes highlighted"
}

// Custom templates
"generate_with_template": {
  input: { url: string, template: string },
  output: "Documentation following organization standards"
}
```

#### Resource Streaming
```typescript
// Real-time progress updates
"api://generation-progress": {
  stream: true,
  updates: ["Fetching repo", "Analyzing code", "Generating docs"]
}
```

#### Context Awareness
```typescript
// Repository-aware operations
"analyze_current_repository": {
  input: { context: "file_tree_and_current_changes" },
  output: "Documentation for current development context"
}
```

### What We Have vs What We Don't

**Working:**
- ✅ GitHub repository analysis
- ✅ NPM package analysis
- ✅ LLM documentation generation
- ✅ Marketplace with save/browse
- ✅ Dark mode UI
- ✅ **MCP Integration** - AI assistants can use our tools directly through Model Context Protocol

**Not Working:**
- ❌ **PyPI support** - Python packages can't be analyzed. We only support JavaScript/NPM packages currently.
- ❌ **API docs (OpenAPI/Swagger)** - Can't process API specification files that many REST APIs provide for documentation.
- ❌ **Web search capability** - Can't find documentation outside of GitHub/NPM. If docs are on a separate website, we miss them.
- ❌ **Authentication system** - No user accounts. Anyone can see all snippets. Can't save private documentation.
- ❌ **Version tracking** - When a package updates, we don't track changes. No way to see what changed between versions.
- ❌ **Real-time updates** - The progress bar is fake. Users don't see what's actually happening during generation.
- ❌ **Batch processing** - Can only process one package at a time. No way to generate docs for multiple packages together.
- ❌ **MCP authentication** - MCP server inherits API auth (none). No per-client access control or usage tracking.
- ❌ **MCP streaming** - No real-time progress updates through MCP. Agents don't see generation steps.
- ❌ **MCP batch tools** - Can't process multiple packages in single MCP tool call. Each package requires separate call.

---

## Summary

This POC demonstrates a working API documentation generator for GitHub and NPM packages with integrated AI assistant support through Model Context Protocol (MCP). The architecture supports future expansion to multiple vendors through batch processing and organization discovery. 

**Key architectural achievements:**
- **Dual interface design** - Both web UI and AI tool access to same functionality
- **Protocol-based integration** - MCP enables universal AI assistant compatibility  
- **Scalable tool composition** - 4 core tools can be combined for complex workflows
- **Zero-duplication architecture** - MCP server is thin wrapper, no business logic duplication

**Key next steps include:**
- Adding missing data sources (PyPI, OpenAPI) to both web and MCP interfaces
- Implementing authentication for private snippets with MCP client access control
- Building versioning system to track package updates with change notifications through MCP
- Adding real-time progress streaming for both web progress bars and MCP tool calls