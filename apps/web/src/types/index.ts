export interface LLMAnalysisStep {
  step: string
  goal: string
  findings: string
  confidence: number
}

export interface PackageSnippet {
  id: string
  vendorName: string
  packageIdentifier: string
  language: string[]
  topics: string[]
  lastUpdated: string
  version: string
  description: string
  popularity: {
    npmDownloads?: number
    githubStars?: number
  }
  generationMetadata: {
    llmModel: string
    generatedAt: string
    dataSource: string[]
    confidence: number
  }
  markdown: string
  analysisSteps?: LLMAnalysisStep[]  // Add the JSON analysis data
}

export interface GenerateSnippetRequest {
  packageUrl: string
  packageType: 'npm' | 'github' | 'pypi' | 'openapi'
}

export interface GenerateSnippetResponse {
  snippet: PackageSnippet
  status: 'success' | 'error'
  message?: string
}