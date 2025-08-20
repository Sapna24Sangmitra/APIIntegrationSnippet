import axios from 'axios'
import type { GenerateSnippetRequest, GenerateSnippetResponse, PackageSnippet } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  // No timeout - let the backend handle timing naturally
})

export const generateSnippet = async (request: GenerateSnippetRequest): Promise<GenerateSnippetResponse> => {
  try {
    const response = await api.post('/snippets/generate', request)
    return response.data
  } catch (error) {
    console.error('Error generating snippet:', error)
    throw error
  }
}

export const getSnippet = async (id: string): Promise<PackageSnippet> => {
  try {
    // Try marketplace first (for saved snippets)
    const response = await api.get(`/marketplace/${id}`)
    return response.data
  } catch (error) {
    // Fall back to regular snippets API
    const response = await api.get(`/snippets/${id}`)
    return response.data
  }
}

export const getSnippets = async (params?: {
  search?: string
  language?: string
  limit?: number
  offset?: number
}): Promise<{ snippets: PackageSnippet[]; total: number }> => {
  const response = await api.get('/snippets', { params })
  return response.data
}

export const requestUpdate = async (packageIdentifier: string): Promise<void> => {
  await api.post('/snippets/request-update', { packageIdentifier })
}

// Marketplace API functions
export const saveToMarketplace = async (snippet: PackageSnippet, userId?: string): Promise<void> => {
  await api.post('/marketplace/save', { snippet, userId })
}

export const getMarketplaceSnippets = async (params?: {
  search?: string
  language?: string
  limit?: number
  offset?: number
}): Promise<{ snippets: PackageSnippet[]; total: number }> => {
  const response = await api.get('/marketplace', { params })
  return response.data
}

export const removeFromMarketplace = async (snippetId: string): Promise<void> => {
  await api.delete(`/marketplace/${snippetId}`)
}

export const getMarketplaceStats = async (): Promise<{
  totalSnippets: number
  languageBreakdown: Record<string, number>
  recentActivity: number
}> => {
  const response = await api.get('/marketplace/stats/overview')
  return response.data
}