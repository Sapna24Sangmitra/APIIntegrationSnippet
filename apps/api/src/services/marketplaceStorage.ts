import fs from 'fs/promises'
import path from 'path'
import type { PackageSnippet } from '../types'

const MARKETPLACE_FILE = path.join(__dirname, '../../data/marketplace.json')

export interface SnippetMetadata {
  vendorName: string
  language: string[]
  topics: string[]
  lastUpdated: string
  id: string
  description?: string
}

export interface SavedSnippet {
  metadata: SnippetMetadata
  markdown: string
  originalDataSource: string[]  // Preserve original data sources
  originalGenerationMetadata?: any  // Preserve full metadata
  savedAt: string
  userId?: string
}

export class MarketplaceStorage {
  private async ensureFileExists(): Promise<void> {
    try {
      await fs.access(MARKETPLACE_FILE)
    } catch (error) {
      // File doesn't exist, create it
      await fs.writeFile(MARKETPLACE_FILE, '[]', 'utf8')
    }
  }

  async getAllSavedSnippets(): Promise<SavedSnippet[]> {
    try {
      await this.ensureFileExists()
      const data = await fs.readFile(MARKETPLACE_FILE, 'utf8')
      return JSON.parse(data) as SavedSnippet[]
    } catch (error) {
      console.error('Error reading marketplace file:', error)
      return []
    }
  }

  async saveSnippet(snippet: PackageSnippet, userId?: string): Promise<SavedSnippet> {
    try {
      const savedSnippets = await this.getAllSavedSnippets()
      
      // Check if snippet already exists
      const existingIndex = savedSnippets.findIndex(s => s.metadata.id === snippet.id)
      
      // Create clean metadata structure as per problem statement
      const metadata: SnippetMetadata = {
        vendorName: snippet.vendorName,
        language: snippet.language,
        topics: snippet.topics,
        lastUpdated: new Date().toISOString(),
        id: snippet.id,
        description: snippet.description
      }
      
      const savedSnippet: SavedSnippet = {
        metadata,
        markdown: snippet.markdown,
        originalDataSource: snippet.generationMetadata?.dataSource || [],
        originalGenerationMetadata: snippet.generationMetadata,
        savedAt: new Date().toISOString(),
        userId
      }

      if (existingIndex >= 0) {
        // Update existing snippet
        savedSnippets[existingIndex] = savedSnippet
      } else {
        // Add new snippet to beginning
        savedSnippets.unshift(savedSnippet)
      }

      await fs.writeFile(MARKETPLACE_FILE, JSON.stringify(savedSnippets, null, 2), 'utf8')
      console.log(`💾 Saved snippet to marketplace: ${snippet.vendorName}`)
      
      return savedSnippet
    } catch (error) {
      console.error('Error saving snippet to marketplace:', error)
      throw new Error('Failed to save snippet to marketplace')
    }
  }

  async removeSnippet(snippetId: string): Promise<boolean> {
    try {
      const savedSnippets = await this.getAllSavedSnippets()
      const filteredSnippets = savedSnippets.filter(s => s.metadata.id !== snippetId)
      
      if (filteredSnippets.length === savedSnippets.length) {
        return false // Snippet not found
      }

      await fs.writeFile(MARKETPLACE_FILE, JSON.stringify(filteredSnippets, null, 2), 'utf8')
      console.log(`🗑️  Removed snippet from marketplace: ${snippetId}`)
      
      return true
    } catch (error) {
      console.error('Error removing snippet from marketplace:', error)
      throw new Error('Failed to remove snippet from marketplace')
    }
  }

  async getSnippetById(snippetId: string): Promise<SavedSnippet | null> {
    try {
      const savedSnippets = await this.getAllSavedSnippets()
      return savedSnippets.find(s => s.metadata.id === snippetId) || null
    } catch (error) {
      console.error('Error getting snippet by ID:', error)
      return null
    }
  }

  async searchSnippets(query: {
    search?: string
    language?: string
    limit?: number
    offset?: number
  }): Promise<{ snippets: SavedSnippet[], total: number }> {
    try {
      let snippets = await this.getAllSavedSnippets()

      // Apply search filter
      if (query.search) {
        const searchLower = query.search.toLowerCase()
        snippets = snippets.filter(snippet => 
          snippet.metadata.vendorName.toLowerCase().includes(searchLower) ||
          snippet.metadata.description?.toLowerCase().includes(searchLower) ||
          snippet.metadata.topics.some(topic => topic.toLowerCase().includes(searchLower))
        )
      }

      // Apply language filter
      if (query.language) {
        snippets = snippets.filter(snippet =>
          snippet.metadata.language.some(lang => 
            lang.toLowerCase() === query.language!.toLowerCase()
          )
        )
      }

      const total = snippets.length
      
      // Apply pagination
      const offset = query.offset || 0
      const limit = query.limit || 50
      snippets = snippets.slice(offset, offset + limit)

      return { snippets, total }
    } catch (error) {
      console.error('Error searching snippets:', error)
      return { snippets: [], total: 0 }
    }
  }

  async getStats(): Promise<{
    totalSnippets: number
    languageBreakdown: Record<string, number>
    recentActivity: number
  }> {
    try {
      const snippets = await this.getAllSavedSnippets()
      
      const languageBreakdown: Record<string, number> = {}
      snippets.forEach(snippet => {
        snippet.metadata.language.forEach(lang => {
          languageBreakdown[lang] = (languageBreakdown[lang] || 0) + 1
        })
      })

      // Count snippets saved in last 7 days
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const recentActivity = snippets.filter(s => s.savedAt > weekAgo).length

      return {
        totalSnippets: snippets.length,
        languageBreakdown,
        recentActivity
      }
    } catch (error) {
      console.error('Error getting marketplace stats:', error)
      return {
        totalSnippets: 0,
        languageBreakdown: {},
        recentActivity: 0
      }
    }
  }
}