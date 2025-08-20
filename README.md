# API Snippet Generator

An AI-powered platform that automatically generates standardized documentation snippets by analyzing software packages from GitHub, NPM, and other sources. Features a community marketplace for browsing, sharing, and downloading generated API documentation.

## What This Does

- **🤖 Smart Analysis**: Uses AI (OpenAI GPT-4 or Anthropic Claude) to analyze GitHub repositories, NPM packages, and API specifications
- **📚 Auto Documentation**: Generates consistent, practical documentation focused on real-world usage
- **🏪 Community Marketplace**: Browse, search, and download community-generated snippets
- **⚡ Multiple Sources**: Supports GitHub repos, NPM packages, and API documentation (PyPI coming soon)

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + TanStack Query
- **Backend**: Node.js + Express + TypeScript + AI APIs (OpenAI/Anthropic)
- **Development**: Turbo monorepo with hot reload

## Prerequisites

- **Node.js 18+**
- **AI API Key** (required) - [OpenAI](https://platform.openai.com) or [Anthropic](https://console.anthropic.com)
- **GitHub Token** (optional but recommended) - [Generate here](https://github.com/settings/tokens)

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create `.env` file in `/apps/api/` directory:
```bash
# Choose ONE AI provider
OPENAI_API_KEY=your_openai_api_key_here        # For OpenAI GPT-4
# OR
ANTHROPIC_API_KEY=your_anthropic_api_key_here  # For Anthropic Claude

GITHUB_TOKEN=your_github_token_here  # Optional but recommended
```

### 3. Start Development Servers

**Option A: All-in-one (if monorepo works):**
```bash
npm run dev
```

**Option B: Separate terminals (recommended if Option A fails):**
```bash
# Terminal 1 - Start Backend API
npm run dev:api

# Terminal 2 - Start Frontend (in a new terminal)
npm run dev:web
```

Both methods result in:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001

## Usage

### Generate Snippets
Enter any of these formats in the generator:

```
axios                                           # NPM package name
@tanstack/react-query                           # Scoped NPM package
https://github.com/axios/axios                 # GitHub repository URL
https://npmjs.com/package/express               # NPM package URL
https://github.com/github/rest-api-description  # API documentation repo
```

**Note**: PyPI support is planned but not yet implemented.

### What You Get
Each generated snippet includes:
- Brief description and setup instructions
- Authentication/configuration (API keys, tokens, etc.)
- Basic read and write operation examples
- Comprehensive error handling
- Additional important operations (up to 5 total examples)
- Links to official documentation

**For API Documentation**: Generates HTTP request examples with proper authentication headers instead of installation commands.

### Marketplace Features
- **Browse & Search**: Filter by language, popularity, date
- **Download**: Markdown files + JSON metadata
- **Save & Share**: Community contributions
- **Source Attribution**: GitHub, NPM, or other source badges

## Development Commands

```bash
# Start both services (if monorepo works)
npm run dev          # Starts both frontend and backend together

# Start services separately (if monorepo fails)
npm run dev:api      # Backend API server only (port 3001)
npm run dev:web      # Frontend React app only (port 3000)

# Other commands
npm run build        # Production builds for both apps
npm run lint         # Code linting for both apps
```

**Note:** If `npm run dev` doesn't work or shows errors, use the separate commands in two terminals.

## API Endpoints

- `POST /api/snippets/generate` - Generate snippet from package URL/name
- `GET /api/marketplace` - Browse saved snippets
- `POST /api/marketplace/save` - Save snippet to marketplace
- `GET /api/marketplace/:id` - Get specific snippet
- `GET /api/marketplace/stats/overview` - Marketplace statistics
- `GET /api/health` - Health check
- `GET /api/download-mcp` - Download MCP setup script
- `GET /mcp/*` - Serve static MCP files (server.ts, package.json, config.json, etc.)

## Architecture

### AI Analysis Pipeline (4-Step Process)
1. **Structure Discovery** - Analyze repository organization
2. **Pattern Extraction** - Find usage patterns from examples/tests  
3. **API Analysis** - Document public methods and parameters
4. **Documentation Synthesis** - Generate final markdown with AI

### Data Flow
```
User Input → Package Detection → Source Analysis → AI Processing → Markdown + JSON Output
```

### Storage
- **Current**: File-based JSON storage in `/apps/api/data/marketplace.json`
- **Future**: Designed for PostgreSQL/MongoDB migration (not yet implemented)

## Configuration

### Environment Variables
```bash
# Required - Choose ONE AI provider
OPENAI_API_KEY=sk-...           # OpenAI API key for GPT-4
# OR
ANTHROPIC_API_KEY=sk-ant-...    # Anthropic API key for Claude

# Optional but recommended  
GITHUB_TOKEN=ghp_...            # GitHub personal access token
NODE_ENV=development            # Environment mode
PORT=3001                       # Backend port (default: 3001)
```

### Switching AI Models
To switch between OpenAI and Anthropic:

1. Open `/apps/api/src/services/llmPipeline.ts`
2. Find and change: `const ModeToUse: 'openai' | 'anthropic' = 'openai'`
3. Set to `'anthropic'` for Claude or `'openai'` for GPT-4
4. Ensure you have the corresponding API key in your `.env` file
5. Restart the backend server

### Rate Limits
- **GitHub API**: 60 req/hr (unauthenticated) → 5,000 req/hr (with token)
- **AI API**: Based on your OpenAI or Anthropic plan limits
- **Development**: No internal rate limiting for testing

## Production Deployment

### Build for Production
```bash
npm run build
npm run start
```

### Environment Setup
1. Set `NODE_ENV=production`
2. Configure secure API keys
3. Configure CORS for your domain in `/apps/api/src/index.ts`
4. Set up reverse proxy (nginx recommended)
5. Database integration not yet implemented (currently uses file storage)

## Troubleshooting

### Common Issues

**"API key required"**
- Ensure either `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` is set in `.env`
- Verify the key is valid and has billing enabled

**"Rate limit exceeded"**
- Add GitHub token to increase limits
- Wait for rate limit reset (shown in error message)

**"Package not found"**
- Verify package exists on NPM or GitHub
- Check URL format is correct
- Try with different package name

**"npm run dev" fails or doesn't start both services**
- Monorepo setup may not work on all systems
- Use separate terminals: `npm run dev:api` and `npm run dev:web`
- Check that both package.json files exist in apps/api and apps/web

**Frontend not connecting to backend**
- Ensure both servers are running (either `npm run dev` or separate terminals)
- Check backend is accessible at http://localhost:3001/health
- Frontend should be at http://localhost:3000, backend at http://localhost:3001

### Debug Mode
Set environment variable for detailed logging:
```bash
DEBUG=true npm run dev:api
```

## Contributing

### Project Structure
```
/apps/web/          # React frontend
/apps/api/          # Express backend  
/apps/api/data/     # JSON file storage
/scripts/           # Setup and utility scripts
```

### Key Files
- `/apps/web/src/pages/LandingPage.tsx` - Main generator interface
- `/apps/api/src/services/planCompliantLLMPipeline.ts` - AI analysis logic
- `/apps/api/src/routes/` - API route handlers

## License

MIT License - see LICENSE file for details