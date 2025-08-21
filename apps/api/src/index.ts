import dotenv from 'dotenv'
import path from 'path'

// Load environment variables first
dotenv.config()

// Debug environment variables
console.log('🔍 Environment check:')
console.log('GITHUB_TOKEN:', process.env.GITHUB_TOKEN ? 'Found ✅' : 'Not found ❌')
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Found ✅' : 'Not found ❌')
console.log('ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? 'Found ✅' : 'Not found ❌')

// Import and check AI model configuration from the ACTIVE pipeline
import fs from 'fs'
import path from 'path'
const llmPipelinePath = path.join(__dirname, 'services/planCompliantLLMPipeline.ts')
const llmPipelineContent = fs.readFileSync(llmPipelinePath, 'utf8')
const modeMatch = llmPipelineContent.match(/export const ModeToUse.*?=.*?['"`](\w+)['"`]/)
const ModeToUse = modeMatch?.[1] as 'openai' | 'anthropic' || 'openai'

console.log(`🤖 AI Model: Using ${ModeToUse.toUpperCase()} ${ModeToUse === 'openai' ? '(GPT-4)' : '(Claude)'}`)

// Validate required API key for selected model
const requiredKey = ModeToUse === 'openai' ? 'OPENAI_API_KEY' : 'ANTHROPIC_API_KEY'
const hasRequiredKey = ModeToUse === 'openai' ? process.env.OPENAI_API_KEY : process.env.ANTHROPIC_API_KEY

if (!hasRequiredKey) {
  console.error('')
  console.error('❌ ERROR: Missing required API key!')
  console.error(`Current AI model: ${ModeToUse.toUpperCase()}`)
  console.error(`Required API key: ${requiredKey}`)
  console.error('')
  console.error('💡 To fix this:')
  console.error(`   1. Get API key from: ${ModeToUse === 'openai' ? 'https://platform.openai.com' : 'https://console.anthropic.com'}`)
  console.error(`   2. Add to .env file: ${requiredKey}=your_api_key_here`)
  console.error(`   3. Or switch AI model in: /apps/api/src/services/planCompliantLLMPipeline.ts (line 7)`)
  console.error('')
  process.exit(1)
}

console.log(`✅ ${requiredKey} is configured and ready!`)

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import snippetsRouter from './routes/snippets'
import marketplaceRouter from './routes/marketplace'

const app = express()
const PORT = process.env.API_PORT || 3001

// Security middleware
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))

// No rate limiting for POC

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
})

// API routes
app.use('/api/snippets', snippetsRouter)
app.use('/api/marketplace', marketplaceRouter)

// MCP server download endpoints
app.get('/api/download-mcp', (req, res) => {
  const mcpPath = path.join(__dirname, '../../../mcp')
  res.download(path.join(mcpPath, 'setup.sh'), 'mcp-setup.sh')
})

// Serve static MCP files
app.use('/mcp', express.static(path.join(__dirname, '../../../mcp')))

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path
  })
})

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err)
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  })
})

app.listen(PORT, () => {
  console.log(`🚀 API server running at http://localhost:${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/health`)
  console.log(`📝 API endpoints: http://localhost:${PORT}/api`)
})