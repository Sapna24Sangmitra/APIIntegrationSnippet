import { useState } from 'react'
import { Github, Package, Globe, FileText, Loader2, Download, Copy, Search, Code, Zap, PenTool } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { generateSnippet, saveToMarketplace as apiSaveToMarketplace } from '../services/api'
import type { GenerateSnippetRequest } from '../types'

export default function LandingPage() {
  const [packageUrl, setPackageUrl] = useState('')
  const [generatedSnippet, setGeneratedSnippet] = useState<string | null>(null)
  const [analysisSteps, setAnalysisSteps] = useState<any[]>([])
  const [fullSnippetData, setFullSnippetData] = useState<any>(null)
  const [analysisStatus, setAnalysisStatus] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'markdown' | 'json'>('markdown')

  const generateMutation = useMutation({
    mutationFn: (request: GenerateSnippetRequest) => {
      // Start polling for status updates
      setAnalysisStatus([])
      startStatusPolling()
      return generateSnippet(request)
    },
    onSuccess: (data) => {
      if (data.status === 'success') {
        setGeneratedSnippet(data.snippet.markdown)
        setAnalysisSteps(data.snippet.analysisSteps || [])
        setFullSnippetData(data.snippet)
        setAnalysisStatus(prev => [...prev, '✅ Snippet generated successfully!'])
      }
    },
    onError: () => {
      setAnalysisStatus(prev => [...prev, '❌ Generation failed'])
    }
  })

  // Mock status polling (in real implementation, you'd use WebSocket or Server-Sent Events)
  const startStatusPolling = () => {
    const statuses = [
      '🔍 Starting analysis...',
      '📦 Analyzing package metadata...',
      '🐙 Fetching repository structure...',
      '📁 Step 1: Repository Structure Discovery...',
      '🔍 Step 2: Code Pattern Extraction...',
      '⚡ Step 3: API Surface Analysis...',
      '📝 Step 4: Documentation Synthesis...',
      '🧠 Running AI powered analysis...'
    ]

    let currentIndex = 0
    const interval = setInterval(() => {
      if (currentIndex < statuses.length) {
        setAnalysisStatus(prev => [...prev, statuses[currentIndex]])
        currentIndex++
      } else {
        clearInterval(interval)
      }
    }, 3000) // Add new status every 3 seconds

    // Clear interval when mutation completes
    setTimeout(() => clearInterval(interval), 30000)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!packageUrl.trim()) return

    let packageType: GenerateSnippetRequest['packageType'] = 'npm'
    
    if (packageUrl.includes('github.com')) {
      packageType = 'github'
    } else if (packageUrl.includes('pypi.org')) {
      packageType = 'pypi'
    } else if (packageUrl.includes('swagger') || packageUrl.includes('openapi')) {
      packageType = 'openapi'
    }

    generateMutation.mutate({ packageUrl, packageType })
  }

  const copyToClipboard = () => {
    if (generatedSnippet) {
      navigator.clipboard.writeText(generatedSnippet)
    }
  }

  const downloadSnippet = () => {
    if (generatedSnippet) {
      const blob = new Blob([generatedSnippet], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'api-snippet.md'
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const downloadJson = () => {
    if (fullSnippetData) {
      const jsonData = {
        vendorName: fullSnippetData.vendorName,
        language: fullSnippetData.language,
        topics: fullSnippetData.topics,
        lastUpdated: fullSnippetData.lastUpdated,
        description: fullSnippetData.description
      }
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'metadata.json'
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const saveToMarketplace = async () => {
    if (!fullSnippetData) return
    
    try {
      console.log('Saving to marketplace:', fullSnippetData.vendorName)
      await apiSaveToMarketplace(fullSnippetData)
      alert('Snippet saved to marketplace successfully!')
    } catch (error) {
      console.error('Error saving to marketplace:', error)
      console.error('Full error details:', error.response?.data || error.message)
      alert(`Failed to save to marketplace: ${error.response?.data?.error || error.message}`)
    }
  }

  return (
    <div className="bg-gray-50 dark:bg-black">
      <div className="w-full px-6 py-6">
        <div className="grid lg:grid-cols-4 gap-8 items-start">
          {/* Left Sidebar - Input Form & Analysis Steps */}
          <div className="lg:col-span-1">
            <div className="space-y-4" style={{ height: '80vh', overflow: 'auto' }}>
            <div className="bg-white dark:bg-gray-950 rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Generate Snippet</h2>
              
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label htmlFor="packageUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Package URL or Name
                  </label>
                  <input
                    type="text"
                    id="packageUrl"
                    value={packageUrl}
                    onChange={(e) => setPackageUrl(e.target.value)}
                    placeholder="https://github.com/user/repo or package-name"
                    className="input-field"
                    disabled={generateMutation.isPending}
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={generateMutation.isPending || !packageUrl.trim()}
                  className="btn-primary w-full flex items-center justify-center space-x-2"
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <span>Generate Snippet</span>
                  )}
                </button>
              </form>

              {generateMutation.error && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">
                    Error generating snippet. Please try again.
                  </p>
                </div>
              )}
            </div>

            {/* 4-Step Analysis Process */}
            <div className="bg-white dark:bg-gray-950 rounded-lg shadow p-4">
              <h3 className="font-semibold text-base mb-3 text-gray-900 dark:text-white">4-Step Analysis Process</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                    <Search className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Repository Discovery</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Extract metadata, structure, and key files</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                    <Code className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Code Pattern Extraction</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Analyze examples and identify usage patterns</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                    <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">API Surface Analysis</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Map out functions, methods, and configurations</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                    <PenTool className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Documentation Synthesis</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Generate LLM-optimized markdown snippet</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Supported Sources */}
            <div className="bg-white dark:bg-gray-950 rounded-lg shadow p-4">
              <h3 className="font-semibold text-base mb-3 text-gray-900 dark:text-white">Supported Sources</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center space-x-2">
                  <Github className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">GitHub ✅</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">NPM ✅</span>
                </div>
                <div className="flex items-center space-x-2 opacity-50">
                  <FileText className="h-4 w-4 text-gray-400 dark:text-gray-600" />
                  <span className="text-sm text-gray-500 dark:text-gray-500">PyPI</span>
                  <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-1 py-0.5 rounded">WIP</span>
                </div>
                <div className="flex items-center space-x-2 opacity-50">
                  <Globe className="h-4 w-4 text-gray-400 dark:text-gray-600" />
                  <span className="text-sm text-gray-500 dark:text-gray-500">API Docs</span>
                  <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-1 py-0.5 rounded">WIP</span>
                </div>
              </div>
            </div>

            </div>
          </div>

          {/* Right Side - Generated Results (Takes 3/4 of space) */}
          <div className="lg:col-span-3">
            {generatedSnippet ? (
              <div className="bg-white dark:bg-gray-950 rounded-lg shadow" style={{ height: '80vh', display: 'flex', flexDirection: 'column' }}>
                {/* Header with controls */}
                <div className="flex items-center justify-between p-4 flex-shrink-0">
                  <div className="flex items-center space-x-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Generated Results</h3>
                    <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setViewMode('markdown')}
                        className={`px-3 py-1 text-sm ${
                          viewMode === 'markdown' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Markdown
                      </button>
                      <button
                        onClick={() => setViewMode('json')}
                        className={`px-3 py-1 text-sm ${
                          viewMode === 'json' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Analysis JSON
                      </button>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={saveToMarketplace}
                      className="btn-primary flex items-center space-x-1 text-sm px-3 py-2"
                    >
                      <Package className="h-4 w-4" />
                      <span>Save</span>
                    </button>
                    <button
                      onClick={copyToClipboard}
                      className="btn-secondary flex items-center space-x-1 text-sm px-3 py-2"
                    >
                      <Copy className="h-4 w-4" />
                      <span>Copy</span>
                    </button>
                    <button
                      onClick={viewMode === 'markdown' ? downloadSnippet : downloadJson}
                      className="btn-secondary flex items-center space-x-1 text-sm px-3 py-2"
                    >
                      <Download className="h-4 w-4" />
                      <span>{viewMode === 'markdown' ? 'MD' : 'JSON'}</span>
                    </button>
                  </div>
                </div>
                
                {/* Content Area - Fills remaining space */}
                <div className="flex-1 p-6 overflow-hidden">
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 h-full overflow-auto">
                    {viewMode === 'markdown' ? (
                      <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono leading-relaxed">
                        {generatedSnippet}
                      </pre>
                    ) : (
                      <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono leading-relaxed">
                        {JSON.stringify({
                          vendorName: fullSnippetData?.vendorName,
                          language: fullSnippetData?.language,
                          topics: fullSnippetData?.topics,
                          lastUpdated: fullSnippetData?.lastUpdated,
                          description: fullSnippetData?.description
                        }, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            ) : generateMutation.isPending ? (
              <div className="bg-white dark:bg-gray-950 rounded-lg shadow" style={{ height: '80vh', display: 'flex', flexDirection: 'column' }}>
                <div className="p-6 flex-shrink-0">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Analysis Progress</h3>
                </div>
                <div className="flex-1 p-6">
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 h-full overflow-auto">
                    <div className="space-y-3">
                      {analysisStatus.filter(status => status && typeof status === 'string').map((status, index, filteredArray) => (
                        <div key={index} className="flex items-center space-x-3">
                          {index === filteredArray.length - 1 && !status.includes('✅') && !status.includes('❌') ? (
                            <Loader2 className="h-5 w-5 animate-spin text-blue-500 flex-shrink-0" />
                          ) : (
                            <div className="h-5 w-5 rounded-full bg-gray-300 flex-shrink-0"></div>
                          )}
                          <span className={`text-base ${
                            status.includes('✅') ? 'text-green-600 font-semibold' :
                            status.includes('❌') ? 'text-red-600 font-semibold' :
                            index === filteredArray.length - 1 ? 'text-blue-600 font-semibold' :
                            'text-gray-500'
                          }`}>
                            {status}
                          </span>
                        </div>
                      ))}
                      {analysisStatus.length === 0 && (
                        <div className="text-center text-gray-500">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3" />
                          <p className="text-lg">Initializing analysis...</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-950 rounded-lg shadow" style={{ height: '80vh', display: 'flex', flexDirection: 'column' }}>
                <div className="p-6 flex-shrink-0">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Generated Documentation Preview</h3>
                </div>
                <div className="flex-1 p-6">
                  <div className="bg-gray-50 dark:bg-black rounded-lg h-full flex items-center justify-center text-center">
                    <div>
                      <FileText className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400 text-lg">
                        Generated snippet will appear here
                      </p>
                      <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                        Enter a package URL or name to get started
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}