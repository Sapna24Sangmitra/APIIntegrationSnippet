import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Copy, Download, ExternalLink, Calendar, Star, Package, Github, Globe } from 'lucide-react'
import { getSnippet } from '../services/api'

export default function SnippetView() {
  const { id } = useParams<{ id: string }>()
  
  const { data: snippet, isLoading, error } = useQuery({
    queryKey: ['snippet', id],
    queryFn: () => getSnippet(id!),
    enabled: !!id,
  })

  const copyToClipboard = () => {
    if (snippet?.markdown) {
      navigator.clipboard.writeText(snippet.markdown)
    }
  }

  const downloadSnippet = () => {
    if (snippet?.markdown) {
      const blob = new Blob([snippet.markdown], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${snippet.packageIdentifier}-snippet.md`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-8"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error || !snippet) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Snippet Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400">The requested snippet could not be found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{snippet.vendorName}</h1>
              {/* Show data source */}
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                {snippet.generationMetadata?.dataSource?.includes('github') && (
                  <div className="flex items-center space-x-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full">
                    <Github className="h-3 w-3" />
                    <span>GitHub</span>
                  </div>
                )}
                {snippet.generationMetadata?.dataSource?.includes('npm') && (
                  <div className="flex items-center space-x-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full">
                    <Package className="h-3 w-3" />
                    <span>NPM</span>
                  </div>
                )}
                {(!snippet.generationMetadata?.dataSource || 
                  !snippet.generationMetadata.dataSource.some(s => ['github', 'npm'].includes(s))) && (
                  <div className="flex items-center space-x-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full">
                    <Globe className="h-3 w-3" />
                    <span>Other</span>
                  </div>
                )}
              </div>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-300">{snippet.description}</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={copyToClipboard}
              className="btn-secondary flex items-center space-x-1"
            >
              <Copy className="h-4 w-4" />
              <span>Copy</span>
            </button>
            <button
              onClick={downloadSnippet}
              className="btn-primary flex items-center space-x-1"
            >
              <Download className="h-4 w-4" />
              <span>Download</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-1">
            <Package className="h-4 w-4" />
            <span>{snippet.packageIdentifier}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>Updated {new Date(snippet.lastUpdated).toLocaleDateString()}</span>
          </div>
          {snippet.popularity.githubStars && (
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4" />
              <span>{snippet.popularity.githubStars.toLocaleString()} stars</span>
            </div>
          )}
          {snippet.popularity.npmDownloads && (
            <div className="flex items-center space-x-1">
              <ExternalLink className="h-4 w-4" />
              <span>{snippet.popularity.npmDownloads.toLocaleString()} downloads</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {snippet.language.map((lang) => (
            <span
              key={lang}
              className="px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full text-xs font-medium"
            >
              {lang}
            </span>
          ))}
          {snippet.topics.map((topic) => (
            <span
              key={topic}
              className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-full text-xs font-medium"
            >
              {topic}
            </span>
          ))}
        </div>
      </div>

      <div className="card dark:bg-gray-900 dark:border-gray-800">
        <div className="bg-gray-50 dark:bg-black rounded-lg p-6">
          <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap overflow-x-auto">
            {snippet.markdown}
          </pre>
        </div>
      </div>

      <div className="mt-8">
        <div className="card dark:bg-gray-900 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">JSON</h3>
            <button
              onClick={() => {
                const jsonData = JSON.stringify({
                  vendorName: snippet.vendorName,
                  language: snippet.language,
                  topics: snippet.topics,
                  lastUpdated: snippet.lastUpdated,
                  description: snippet.description
                }, null, 2)
                navigator.clipboard.writeText(jsonData)
              }}
              className="btn-secondary flex items-center space-x-1 text-xs"
            >
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </button>
          </div>
          <div className="bg-gray-50 dark:bg-black rounded-lg p-6">
            <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap overflow-x-auto">
              {JSON.stringify({
                vendorName: snippet.vendorName,
                language: snippet.language,
                topics: snippet.topics,
                lastUpdated: snippet.lastUpdated,
                description: snippet.description
              }, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}