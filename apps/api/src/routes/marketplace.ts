import { Router } from 'express'
import { MarketplaceStorage } from '../services/marketplaceStorage'
import type { PackageSnippet } from '../types'

const router = Router()
const marketplaceStorage = new MarketplaceStorage()

// Get all saved snippets
router.get('/', async (req, res) => {
  try {
    const { search, language, limit, offset } = req.query
    
    const result = await marketplaceStorage.searchSnippets({
      search: search as string,
      language: language as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    })

    // Convert to format expected by frontend
    const formattedSnippets = result.snippets.map(snippet => ({
      id: snippet.metadata.id,
      vendorName: snippet.metadata.vendorName,
      packageIdentifier: snippet.metadata.vendorName, // Use vendorName as identifier
      language: snippet.metadata.language,
      topics: snippet.metadata.topics,
      lastUpdated: snippet.metadata.lastUpdated,
      version: '1.0.0',
      description: snippet.metadata.description || '',
      popularity: { npmDownloads: 0, githubStars: 0 },
      generationMetadata: {
        llmModel: snippet.originalGenerationMetadata?.llmModel || 'plan-compliant',
        generatedAt: snippet.savedAt,
        dataSource: snippet.originalDataSource && snippet.originalDataSource.length > 0 
          ? snippet.originalDataSource 
          : ['marketplace'], // Fallback for old data
        confidence: snippet.originalGenerationMetadata?.confidence || 0.9
      },
      markdown: snippet.markdown,
      savedToMarketplace: true
    }))

    res.json({
      snippets: formattedSnippets,
      total: result.total
    })
  } catch (error: any) {
    console.error('Error fetching marketplace snippets:', error)
    res.status(500).json({
      error: 'Failed to fetch marketplace snippets',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// Save snippet to marketplace
router.post('/save', async (req, res) => {
  try {
    console.log('📦 Marketplace save request received')
    console.log('Request body keys:', Object.keys(req.body))
    
    const snippet: PackageSnippet = req.body.snippet
    const userId = req.body.userId || 'anonymous'

    console.log('Snippet data:', { 
      hasSnippet: !!snippet, 
      snippetId: snippet?.id,
      vendorName: snippet?.vendorName 
    })

    if (!snippet || !snippet.id) {
      console.log('❌ Invalid snippet data')
      return res.status(400).json({
        error: 'Valid snippet data is required'
      })
    }

    const savedSnippet = await marketplaceStorage.saveSnippet(snippet, userId)
    console.log('✅ Snippet saved successfully:', snippet.vendorName)
    
    res.json({
      status: 'success',
      savedSnippet,
      message: 'Snippet saved to marketplace successfully'
    })
  } catch (error: any) {
    console.error('❌ Error saving snippet to marketplace:', error)
    res.status(500).json({
      error: 'Failed to save snippet to marketplace',
      message: error.message
    })
  }
})

// Remove snippet from marketplace
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const removed = await marketplaceStorage.removeSnippet(id)
    
    if (!removed) {
      return res.status(404).json({
        error: 'Snippet not found in marketplace'
      })
    }

    res.json({
      status: 'success',
      message: 'Snippet removed from marketplace'
    })
  } catch (error: any) {
    console.error('Error removing snippet from marketplace:', error)
    res.status(500).json({
      error: 'Failed to remove snippet from marketplace',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// Get specific saved snippet
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const snippet = await marketplaceStorage.getSnippetById(id)
    
    if (!snippet) {
      return res.status(404).json({
        error: 'Snippet not found in marketplace'
      })
    }

    // Convert to format expected by frontend
    const formattedSnippet = {
      id: snippet.metadata.id,
      vendorName: snippet.metadata.vendorName,
      packageIdentifier: snippet.metadata.vendorName,
      language: snippet.metadata.language,
      topics: snippet.metadata.topics,
      lastUpdated: snippet.metadata.lastUpdated,
      version: '1.0.0',
      description: snippet.metadata.description || '',
      popularity: { npmDownloads: 0, githubStars: 0 },
      generationMetadata: {
        llmModel: snippet.originalGenerationMetadata?.llmModel || 'plan-compliant',
        generatedAt: snippet.savedAt,
        dataSource: snippet.originalDataSource && snippet.originalDataSource.length > 0 
          ? snippet.originalDataSource 
          : ['marketplace'], // Fallback for old data
        confidence: snippet.originalGenerationMetadata?.confidence || 0.9
      },
      markdown: snippet.markdown,
      savedToMarketplace: true
    }

    res.json(formattedSnippet)
  } catch (error: any) {
    console.error('Error fetching snippet from marketplace:', error)
    res.status(500).json({
      error: 'Failed to fetch snippet',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// Get marketplace statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await marketplaceStorage.getStats()
    res.json(stats)
  } catch (error: any) {
    console.error('Error fetching marketplace stats:', error)
    res.status(500).json({
      error: 'Failed to fetch marketplace statistics',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

export default router