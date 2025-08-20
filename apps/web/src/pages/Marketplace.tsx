import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Search, Filter, Calendar, Star, Package, TrendingUp, Download, RotateCw, Eye, Github, Globe } from 'lucide-react'
import { getMarketplaceSnippets, removeFromMarketplace } from '../services/api'

export default function Marketplace() {
  const [search, setSearch] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('')
  const [sortBy, setSortBy] = useState<'popularity' | 'recent' | 'name'>('popularity')

  const { data, isLoading } = useQuery({
    queryKey: ['marketplace-snippets', search, selectedLanguage, sortBy],
    queryFn: () => getMarketplaceSnippets({
      search: search || undefined,
      language: selectedLanguage || undefined,
      limit: 50,
    }),
  })

  const snippets = data?.snippets || []
  const languages = ['javascript', 'typescript', 'python', 'java', 'go', 'rust', 'php']

  const downloadMarkdown = (snippet: any) => {
    const blob = new Blob([snippet.markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${snippet.vendorName}-snippet.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadJson = (snippet: any) => {
    const jsonData = {
      analysisSteps: snippet.analysisSteps || [],
      metadata: snippet.generationMetadata,
      packageInfo: {
        name: snippet.packageIdentifier,
        version: snippet.version,
        description: snippet.description,
        languages: snippet.language,
        topics: snippet.topics
      }
    }
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${snippet.vendorName}-analysis.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const sortedSnippets = [...snippets].sort((a, b) => {
    switch (sortBy) {
      case 'popularity':
        const aPopularity = (a.popularity.githubStars || 0) + (a.popularity.npmDownloads || 0) / 1000
        const bPopularity = (b.popularity.githubStars || 0) + (b.popularity.npmDownloads || 0) / 1000
        return bPopularity - aPopularity
      case 'recent':
        return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
      case 'name':
        return a.vendorName.localeCompare(b.vendorName)
      default:
        return 0
    }
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Snippet Marketplace</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Browse and download community-generated API snippets
        </p>
      </div>

      <div className="card dark:bg-gray-800 mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search packages, APIs, or technologies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 input-field dark:placeholder-gray-400"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="input-field min-w-[150px]"
            >
              <option value="">All Languages</option>
              {languages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang.charAt(0).toUpperCase() + lang.slice(1)}
                </option>
              ))}
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'popularity' | 'recent' | 'name')}
              className="input-field min-w-[150px]"
            >
              <option value="popularity">Most Popular</option>
              <option value="recent">Recently Updated</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded mb-4"></div>
              <div className="flex gap-2 mb-4">
                <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
                <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {snippets.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No snippets found</h3>
              <p className="text-gray-600">
                {search || selectedLanguage
                  ? 'Try adjusting your search or filters'
                  : 'Be the first to generate a snippet!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedSnippets.map((snippet) => (
                <div
                  key={snippet.id}
                  className="card hover:shadow-md transition-shadow flex flex-col"
                >
                  <div className="flex-grow">
                    <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">{snippet.vendorName}</h3>
                      {/* Show data source */}
                      {snippet.generationMetadata?.dataSource?.includes('github') && (
                        <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-xs font-medium">
                          <Github className="h-3 w-3" />
                          <span>GitHub</span>
                        </div>
                      )}
                      {snippet.generationMetadata?.dataSource?.includes('npm') && (
                        <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-xs font-medium">
                          <Package className="h-3 w-3" />
                          <span>NPM</span>
                        </div>
                      )}
                      {!snippet.generationMetadata?.dataSource?.some(s => ['github', 'npm'].includes(s)) && (
                        <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-xs font-medium">
                          <Globe className="h-3 w-3" />
                          <span>Other</span>
                        </div>
                      )}
                    </div>
                    {snippet.popularity.githubStars && snippet.popularity.githubStars > 1000 && (
                      <TrendingUp className="h-4 w-4 text-green-500 flex-shrink-0 ml-2" />
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{snippet.description}</p>
                  
                  <div className="flex flex-wrap gap-1 mb-4">
                    {snippet.language.slice(0, 2).map((lang) => (
                      <span
                        key={lang}
                        className="px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full text-xs font-medium"
                      >
                        {lang}
                      </span>
                    ))}
                    {snippet.topics.slice(0, 2).map((topic) => (
                      <span
                        key={topic}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-full text-xs font-medium"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <div className="flex items-center space-x-4">
                      {snippet.popularity.githubStars && (
                        <div className="flex items-center space-x-1">
                          <Star className="h-3 w-3" />
                          <span>{snippet.popularity.githubStars.toLocaleString()}</span>
                        </div>
                      )}
                      {snippet.popularity.npmDownloads && (
                        <div className="flex items-center space-x-1">
                          <Package className="h-3 w-3" />
                          <span>{snippet.popularity.npmDownloads.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(snippet.lastUpdated).toLocaleDateString()}</span>
                    </div>
                  </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100 dark:border-gray-800 mt-auto">
                    <Link
                      to={`/snippet/${snippet.id}`}
                      className="btn-secondary flex items-center space-x-1 text-xs"
                    >
                      <Eye className="h-3 w-3" />
                      <span>View</span>
                    </Link>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        downloadMarkdown(snippet)
                      }}
                      className="btn-secondary flex items-center space-x-1 text-xs"
                    >
                      <Download className="h-3 w-3" />
                      <span>MD</span>
                    </button>
                    
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        alert('Update functionality coming soon!')
                      }}
                      className="btn-secondary flex items-center space-x-1 text-xs opacity-60"
                      disabled
                    >
                      <RotateCw className="h-3 w-3" />
                      <span>UPDATE (WIP)</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {snippets.length > 0 && (
            <div className="mt-12 text-center">
              <p className="text-gray-600">
                Showing {snippets.length} snippet{snippets.length !== 1 ? 's' : ''}
                {data?.total && data.total > snippets.length && (
                  <span> of {data.total} total</span>
                )}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}