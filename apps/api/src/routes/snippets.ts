import { Router } from 'express'
import { RealSnippetGenerator } from '../services/realSnippetGenerator'
import { mockSnippets } from '../services/mockData'
import type { GenerateSnippetRequest } from '../types'

const router = Router()
let snippetGenerator: RealSnippetGenerator | null = null

// Lazy initialization to ensure env vars are loaded
function getSnippetGenerator() {
  if (!snippetGenerator) {
    snippetGenerator = new RealSnippetGenerator()
  }
  return snippetGenerator
}

// Generate new snippet
router.post('/generate', async (req, res) => {
  try {
    const request: GenerateSnippetRequest = req.body
    
    // Validation
    if (!request.packageUrl || typeof request.packageUrl !== 'string') {
      return res.status(400).json({
        status: 'error',
        message: 'Valid package URL is required'
      })
    }

    if (request.packageUrl.trim().length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Package URL cannot be empty'
      })
    }

    // Validate URL format for known types
    const url = request.packageUrl.trim()
    if (url.includes('github.com') && !url.match(/github\.com\/[^\/]+\/[^\/]+/)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid GitHub URL format. Expected: https://github.com/owner/repo'
      })
    }

    if (url.includes('npmjs.com') && !url.match(/npmjs\.com\/package\/[^\/]+/)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid NPM URL format. Expected: https://npmjs.com/package/name'
      })
    }

    // Set package type if not provided
    if (!request.packageType) {
      if (url.includes('github.com')) {
        // Smart detection for GitHub repos
        if (url.includes('rest-api-description') || 
            url.includes('api-description') || 
            url.includes('/docs') ||
            url.includes('openapi') ||
            url.includes('swagger')) {
          request.packageType = 'openapi'
        } else {
          request.packageType = 'github'
        }
      } else if (url.includes('npmjs.com') || !url.includes('http')) {
        request.packageType = 'npm'
      } else {
        request.packageType = 'npm' // default
      }
    }

    console.log(`🚀 Generating snippet for: ${url} (${request.packageType})`)
    
    const snippet = await getSnippetGenerator().generateSnippet(request)
    
    // Add to mock data for this session (for marketplace browsing)
    mockSnippets.unshift(snippet)
    
    res.json({
      status: 'success',
      snippet
    })
  } catch (error: any) {
    console.error('Error generating snippet:', error)
    
    // More specific error handling
    let statusCode = 500
    let message = 'Failed to generate snippet'

    if (error.message?.includes('not found') || error.message?.includes('Package not found')) {
      statusCode = 404
      message = 'Package or repository not found'
    } else if (error.message?.includes('Invalid') || error.message?.includes('format')) {
      statusCode = 400
      message = error.message
    } else if (error.message?.includes('rate limit') || error.message?.includes('API')) {
      statusCode = 429
      message = 'API rate limit exceeded. Please try again later.'
    } else if (error.message?.includes('API key')) {
      statusCode = 503
      message = 'Service temporarily unavailable'
    }

    res.status(statusCode).json({
      status: 'error',
      message,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// Get all snippets
router.get('/', (req, res) => {
  const { search, language, limit = 50, offset = 0 } = req.query
  
  let filteredSnippets = [...mockSnippets]
  
  // Apply search filter
  if (search && typeof search === 'string') {
    const searchLower = search.toLowerCase()
    filteredSnippets = filteredSnippets.filter(snippet => 
      snippet.vendorName.toLowerCase().includes(searchLower) ||
      snippet.description.toLowerCase().includes(searchLower) ||
      snippet.topics.some(topic => topic.toLowerCase().includes(searchLower))
    )
  }
  
  // Apply language filter
  if (language && typeof language === 'string') {
    filteredSnippets = filteredSnippets.filter(snippet =>
      snippet.language.includes(language)
    )
  }
  
  // Apply pagination
  const startIndex = Number(offset)
  const endIndex = startIndex + Number(limit)
  const paginatedSnippets = filteredSnippets.slice(startIndex, endIndex)
  
  res.json({
    snippets: paginatedSnippets,
    total: filteredSnippets.length
  })
})

// Get snippet by ID
router.get('/:id', (req, res) => {
  const { id } = req.params
  const snippet = mockSnippets.find(s => s.id === id)
  
  if (!snippet) {
    return res.status(404).json({
      error: 'Snippet not found'
    })
  }
  
  res.json(snippet)
})

// Request update for package
router.post('/request-update', (req, res) => {
  const { packageIdentifier } = req.body
  
  if (!packageIdentifier) {
    return res.status(400).json({
      error: 'Package identifier is required'
    })
  }
  
  // In a real implementation, this would queue an update job
  console.log(`Update requested for package: ${packageIdentifier}`)
  
  res.json({
    message: 'Update request submitted successfully'
  })
})

export default router