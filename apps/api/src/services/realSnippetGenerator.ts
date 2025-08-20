import { v4 as uuidv4 } from 'uuid'
import { GitHubAnalyzer, RepoAnalysis } from './githubAnalyzer'
import { NPMAnalyzer, NPMAnalysis } from './npmAnalyzer'
import { PlanCompliantLLMPipeline } from './planCompliantLLMPipeline'
import type { GenerateSnippetRequest, PackageSnippet } from '../types'

export class RealSnippetGenerator {
  private githubAnalyzer: GitHubAnalyzer
  private npmAnalyzer: NPMAnalyzer
  private planCompliantLLM: PlanCompliantLLMPipeline

  constructor() {
    this.githubAnalyzer = new GitHubAnalyzer()
    this.npmAnalyzer = new NPMAnalyzer()
    this.planCompliantLLM = new PlanCompliantLLMPipeline()
  }

  private async analyzeAPIDocumentation(apiUrl: string) {
    console.log(`🔗 Analyzing API documentation from: ${apiUrl}`)
    
    // For GitHub API documentation, extract the API name
    let packageName = 'GitHub REST API'
    let githubUrl = apiUrl
    
    if (apiUrl.includes('github.com/github/rest-api-description')) {
      packageName = 'GitHub REST API'
    } else if (apiUrl.includes('openapi') || apiUrl.includes('swagger')) {
      // Extract API name from URL or repo name
      const match = apiUrl.match(/github\.com\/[^\/]+\/([^\/]+)/)
      packageName = match ? match[1].replace(/[-_]/g, ' ').replace(/api|openapi|swagger/gi, '').trim() + ' API' : 'REST API'
    }

    // Analyze the repository for API documentation
    const repoAnalysis = await this.githubAnalyzer.analyzeRepository(apiUrl)
    
    return {
      repoAnalysis,
      npmAnalysis: undefined, // API docs don't have NPM packages
      packageName,
      githubUrl
    }
  }

  async generateSnippet(request: GenerateSnippetRequest): Promise<PackageSnippet> {
    const { packageUrl, packageType } = request
    
    console.log(`🔍 Starting analysis for: ${packageUrl} (type: ${packageType})`)
    
    try {
      let repoAnalysis: RepoAnalysis | undefined
      let npmAnalysis: NPMAnalysis | undefined
      let packageName: string
      let githubUrl: string | undefined

      // Step 1: Determine analysis strategy based on package type
      switch (packageType) {
        case 'github':
          ({ repoAnalysis, npmAnalysis, packageName, githubUrl } = await this.analyzeGitHubPackage(packageUrl))
          break
          
        case 'npm':
          ({ repoAnalysis, npmAnalysis, packageName, githubUrl } = await this.analyzeNPMPackage(packageUrl))
          break
          
        case 'openapi':
          ({ repoAnalysis, npmAnalysis, packageName, githubUrl } = await this.analyzeAPIDocumentation(packageUrl))
          break
          
        default:
          // Auto-detect package type
          if (packageUrl.includes('github.com')) {
            ({ repoAnalysis, npmAnalysis, packageName, githubUrl } = await this.analyzeGitHubPackage(packageUrl))
          } else {
            ({ repoAnalysis, npmAnalysis, packageName, githubUrl } = await this.analyzeNPMPackage(packageUrl))
          }
      }

      console.log(`📦 Package analysis complete for: ${packageName}`)
      
      // Step 2: Generate snippet following plan.md specification
      console.log(`📋 Running plan-compliant 4-step analysis...`)
      const planResult = await this.planCompliantLLM.generateSnippet(
        packageName,
        repoAnalysis,
        npmAnalysis,
        githubUrl || packageUrl
      )

      // Step 3: Create final snippet object
      const snippet: PackageSnippet = {
        id: uuidv4(),
        vendorName: this.extractVendorName(packageName, repoAnalysis, npmAnalysis),
        packageIdentifier: npmAnalysis?.packageInfo.name || packageName,
        language: this.detectLanguages(repoAnalysis, npmAnalysis, packageType),
        topics: this.extractTopics(repoAnalysis, npmAnalysis),
        lastUpdated: new Date().toISOString(),
        version: npmAnalysis?.packageInfo.version || '1.0.0',
        description: this.extractDescription(repoAnalysis, npmAnalysis),
        popularity: {
          npmDownloads: npmAnalysis?.downloadStats.last30days,
          githubStars: this.extractGitHubStars(repoAnalysis)
        },
        generationMetadata: {
          llmModel: planResult.metadata.model,
          generatedAt: planResult.metadata.generatedAt,
          dataSource: planResult.metadata.dataSource,
          confidence: planResult.overallConfidence
        },
        markdown: planResult.finalMarkdown,
        analysisSteps: planResult.steps  // Include the JSON analysis steps
      }

      console.log(`✅ Plan-compliant snippet generated with confidence: ${planResult.overallConfidence}`)
      console.log(`📊 Completed ${planResult.metadata.analysisSteps} analysis steps as per plan.md`)
      return snippet

    } catch (error) {
      console.error(`❌ Error generating snippet:`, error)
      throw new Error(`Failed to generate snippet: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async analyzeGitHubPackage(githubUrl: string) {
    console.log(`🐙 Analyzing GitHub repository: ${githubUrl}`)
    
    // Parse and analyze GitHub repository
    const repoInfo = await this.githubAnalyzer.parseRepoUrl(githubUrl)
    if (!repoInfo) {
      throw new Error('Invalid GitHub URL format')
    }

    const repoAnalysis = await this.githubAnalyzer.analyzeRepository(repoInfo)
    const packageName = repoInfo.repo
    let npmAnalysis: NPMAnalysis | undefined

    // Try to find corresponding NPM package
    if (repoAnalysis.packageJson?.name) {
      try {
        console.log(`📦 Looking for NPM package: ${repoAnalysis.packageJson.name}`)
        npmAnalysis = await this.npmAnalyzer.analyzePackage(repoAnalysis.packageJson.name)
      } catch (error) {
        console.log(`⚠️  NPM package not found for: ${repoAnalysis.packageJson.name}`)
      }
    }

    return {
      repoAnalysis,
      npmAnalysis,
      packageName,
      githubUrl
    }
  }

  private async analyzeNPMPackage(packageIdentifier: string) {
    console.log(`📦 Analyzing NPM package: ${packageIdentifier}`)
    
    // Parse and analyze NPM package
    const packageName = await this.npmAnalyzer.parsePackageIdentifier(packageIdentifier)
    
    if (!this.npmAnalyzer.isValidPackageName(packageName)) {
      throw new Error('Invalid NPM package name format')
    }

    const npmAnalysis = await this.npmAnalyzer.analyzePackage(packageName)
    let repoAnalysis: RepoAnalysis | undefined
    let githubUrl: string | undefined

    // Try to find corresponding GitHub repository
    githubUrl = this.npmAnalyzer.extractGitHubRepo(npmAnalysis.packageInfo)
    if (githubUrl) {
      try {
        console.log(`🐙 Found GitHub repository: ${githubUrl}`)
        const repoInfo = await this.githubAnalyzer.parseRepoUrl(githubUrl)
        if (repoInfo) {
          repoAnalysis = await this.githubAnalyzer.analyzeRepository(repoInfo)
        }
      } catch (error) {
        console.log(`⚠️  Could not analyze GitHub repository: ${githubUrl}`)
      }
    }

    return {
      repoAnalysis,
      npmAnalysis,
      packageName,
      githubUrl
    }
  }

  private extractVendorName(packageName: string, repoAnalysis?: RepoAnalysis, npmAnalysis?: NPMAnalysis): string {
    // Try to get a clean display name
    if (npmAnalysis?.packageInfo.name) {
      // Remove scope prefix if present
      return npmAnalysis.packageInfo.name.replace(/^@[^\/]+\//, '')
    }
    
    return packageName.split('/').pop() || packageName
  }

  private detectLanguages(repoAnalysis?: RepoAnalysis, npmAnalysis?: NPMAnalysis, packageType?: string): string[] {
    const languages = new Set<string>()

    // Check package type
    if (packageType === 'pypi') {
      languages.add('python')
    } else {
      languages.add('javascript')
    }

    // Check NPM package info
    if (npmAnalysis?.packageInfo.keywords) {
      const keywords = npmAnalysis.packageInfo.keywords
      if (keywords.includes('typescript')) languages.add('typescript')
      if (keywords.includes('python')) languages.add('python')
      if (keywords.includes('javascript')) languages.add('javascript')
    }

    // Check TypeScript definitions
    if (npmAnalysis?.typings?.hasTypes) {
      languages.add('typescript')
    }

    // Check repository structure
    if (repoAnalysis?.structure.sourceFiles) {
      const hasTS = repoAnalysis.structure.sourceFiles.some(f => f.endsWith('.ts'))
      const hasPy = repoAnalysis.structure.sourceFiles.some(f => f.endsWith('.py'))
      
      if (hasTS) languages.add('typescript')
      if (hasPy) languages.add('python')
    }

    return Array.from(languages)
  }

  private extractTopics(repoAnalysis?: RepoAnalysis, npmAnalysis?: NPMAnalysis): string[] {
    const topics = new Set<string>()

    // From NPM keywords
    if (npmAnalysis?.packageInfo.keywords) {
      npmAnalysis.packageInfo.keywords.forEach(keyword => topics.add(keyword))
    }

    // From repository structure analysis
    if (repoAnalysis?.structure) {
      const structure = repoAnalysis.structure
      if (structure.testFiles.length > 0) topics.add('testing')
      if (structure.exampleFiles.length > 0) topics.add('examples')
      if (structure.documentationFiles.length > 5) topics.add('well-documented')
    }

    // From package dependencies (infer purpose)
    if (npmAnalysis?.packageInfo.dependencies) {
      const deps = Object.keys(npmAnalysis.packageInfo.dependencies)
      if (deps.includes('express')) topics.add('web-framework')
      if (deps.includes('react')) topics.add('react')
      if (deps.includes('axios')) topics.add('http-client')
    }

    return Array.from(topics).slice(0, 8) // Limit topics
  }

  private extractDescription(repoAnalysis?: RepoAnalysis, npmAnalysis?: NPMAnalysis): string {
    return npmAnalysis?.packageInfo.description || 
           repoAnalysis?.readme?.split('\n')[0] || 
           'A package for modern applications'
  }

  private extractGitHubStars(_repoAnalysis?: RepoAnalysis): number | undefined {
    // This would be available from the GitHub API call in GitHubAnalyzer
    // For now, return undefined as we'd need to modify the analyzer to include this
    return undefined
  }

  private getDataSources(repoAnalysis?: RepoAnalysis, npmAnalysis?: NPMAnalysis): string[] {
    const sources = []
    if (repoAnalysis) sources.push('github')
    if (npmAnalysis) sources.push('npm')
    return sources.length ? sources : ['unknown']
  }
}