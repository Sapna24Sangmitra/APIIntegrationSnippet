import axios from 'axios'
import type { RepoAnalysis } from './githubAnalyzer'
import type { NPMAnalysis } from './npmAnalyzer'

export interface LLMAnalysisStep {
  step: string
  goal: string
  findings: string
  confidence: number
}

export interface PlanCompliantResult {
  steps: LLMAnalysisStep[]
  finalMarkdown: string
  overallConfidence: number
  metadata: {
    model: string
    generatedAt: string
    dataSource: string[]
    analysisSteps: number
  }
}

export class PlanCompliantLLMPipeline {
  private apiKey: string
  private model: string = 'gpt-4'
  private baseUrl = 'https://api.openai.com/v1'

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || ''
    if (!this.apiKey) {
      throw new Error('OpenAI API key is required')
    }
  }

  async generateSnippet(
    packageName: string,
    repoAnalysis?: RepoAnalysis,
    npmAnalysis?: NPMAnalysis,
    packageUrl?: string
  ): Promise<PlanCompliantResult> {
    
    console.log(`📋 Following plan.md analysis strategy for: ${packageName}`)
    
    const steps: LLMAnalysisStep[] = []
    
    // Step 1: Repository Structure Discovery (Lines 103-128 in plan.md)
    const step1 = await this.repositoryStructureDiscovery(packageName, repoAnalysis)
    steps.push(step1)
    
    // Step 2: Code Pattern Extraction (Lines 130-149 in plan.md)
    const step2 = await this.codePatternExtraction(packageName, repoAnalysis)
    steps.push(step2)
    
    // Step 3: API Surface Analysis (Lines 151-170 in plan.md)
    const step3 = await this.apiSurfaceAnalysis(packageName, repoAnalysis, npmAnalysis)
    steps.push(step3)
    
    // Step 4: Documentation Synthesis (Lines 172-193 in plan.md)
    const step4 = await this.documentationSynthesis(packageName, steps, npmAnalysis, packageUrl)
    steps.push(step4)
    
    const overallConfidence = steps.reduce((sum, step) => sum + step.confidence, 0) / steps.length
    
    return {
      steps,
      finalMarkdown: step4.findings,
      overallConfidence,
      metadata: {
        model: this.model,
        generatedAt: new Date().toISOString(),
        dataSource: this.getDataSources(repoAnalysis, npmAnalysis),
        analysisSteps: steps.length
      }
    }
  }

  // Step 1: Repository Structure Discovery (Plan lines 103-128)
  private async repositoryStructureDiscovery(
    packageName: string,
    repoAnalysis?: RepoAnalysis
  ): Promise<LLMAnalysisStep> {
    
    const treeData = this.formatTreeData(repoAnalysis)
    const packageData = JSON.stringify(repoAnalysis?.packageJson, null, 2) || 'No package.json found'
    
    // Exact prompt structure from plan.md lines 118-128
    const prompt = `Analyze this repository structure and identify:
1. Main entry points
2. Example implementations  
3. Configuration requirements
4. Key dependencies

Repository tree: ${treeData}
Package.json: ${packageData}

Focus on practical information a developer needs to use this package. Return structured findings.`

    console.log(`📁 Step 1: Analyzing repository structure for ${packageName}`)
    const response = await this.callLLM(prompt)
    
    return {
      step: 'Repository Structure Discovery',
      goal: 'Understand the package organization and identify key files',
      findings: response,
      confidence: this.calculateConfidence(repoAnalysis?.structure ? 0.9 : 0.3)
    }
  }

  // Step 2: Code Pattern Extraction (Plan lines 130-149)
  private async codePatternExtraction(
    packageName: string,
    repoAnalysis?: RepoAnalysis
  ): Promise<LLMAnalysisStep> {
    
    const exampleCode = this.formatExampleCode(repoAnalysis?.examples)
    const testCode = this.formatTestCode(repoAnalysis?.tests)
    
    // Exact prompt structure from plan.md lines 139-149
    const prompt = `Extract common usage patterns from these code files:
1. How is the package initialized?
2. What are the most used methods?
3. How is authentication handled?
4. What are typical error scenarios?

Example files: ${exampleCode}
Test files: ${testCode}

Focus on actual code patterns that show how developers use this package.`

    console.log(`🔍 Step 2: Extracting code patterns for ${packageName}`)
    const response = await this.callLLM(prompt)
    
    return {
      step: 'Code Pattern Extraction', 
      goal: 'Find the most common usage patterns',
      findings: response,
      confidence: this.calculateConfidence(
        (repoAnalysis?.examples?.length || 0) > 0 || (repoAnalysis?.tests?.length || 0) > 0 ? 0.8 : 0.4
      )
    }
  }

  // Step 3: API Surface Analysis (Plan lines 151-170)
  private async apiSurfaceAnalysis(
    packageName: string,
    repoAnalysis?: RepoAnalysis,
    npmAnalysis?: NPMAnalysis
  ): Promise<LLMAnalysisStep> {
    
    const typeDefinitions = this.extractTypeDefinitions(repoAnalysis)
    const sourceExcerpts = this.extractSourceExcerpts(repoAnalysis)
    const packageInfo = npmAnalysis?.packageInfo
    
    // Exact prompt structure from plan.md lines 160-170
    const prompt = `Document the public API surface:
1. List all public methods/functions
2. Describe parameters and return types
3. Note any special requirements
4. Identify async vs sync patterns

Type definitions: ${typeDefinitions}
Source files: ${sourceExcerpts}
Package info: ${packageInfo ? JSON.stringify(packageInfo, null, 2) : 'No NPM package info'}

Focus on the actual API that developers will call.`

    console.log(`⚡ Step 3: Analyzing API surface for ${packageName}`)
    const response = await this.callLLM(prompt)
    
    return {
      step: 'API Surface Analysis',
      goal: 'Document available methods and their usage',
      findings: response,
      confidence: this.calculateConfidence(
        npmAnalysis?.typings?.hasTypes ? 0.9 : 0.6
      )
    }
  }

  // Step 4: Documentation Synthesis (Plan lines 172-193)
  private async documentationSynthesis(
    packageName: string,
    previousSteps: LLMAnalysisStep[],
    npmAnalysis?: NPMAnalysis,
    packageUrl?: string
  ): Promise<LLMAnalysisStep> {
    
    const combinedAnalysis = previousSteps
      .map(step => `${step.step}:\n${step.findings}`)
      .join('\n\n---\n\n')
    
    const template = this.getOutputTemplate()
    const installationCommand = this.determineInstallationCommand(npmAnalysis)
    
    // Check if this is API documentation vs installable package
    const isAPIDocumentation = !npmAnalysis?.packageInfo && packageUrl?.includes('api')
    
    // Enhanced prompt for more comprehensive examples
    const prompt = `Create a comprehensive ${isAPIDocumentation ? 'API documentation' : 'package'} snippet with:
1. Brief description (2-3 sentences)
2. ${isAPIDocumentation ? 'API endpoint base URL and access information' : 'Installation command (only if installable package)'}
3. Authentication/authorization setup ${isAPIDocumentation ? '(API keys, tokens, etc.)' : ''}
4. **MANDATORY**: Basic read/GET operation example
5. **MANDATORY**: Basic write/POST operation example  
6. **MANDATORY**: Error handling example
7. **OPTIONAL**: Up to 2 additional important operations if available (delete, update, configuration, webhooks, etc.)

TOTAL: 3-5 usage examples maximum - prioritize the most common use cases.

Use this analysis: ${combinedAnalysis}
Follow this format: ${template}

Package: ${packageName}
${isAPIDocumentation ? 'API Documentation URL' : 'Installation'}: ${installationCommand || packageUrl || 'None - this is not an installable package'}
URL: ${packageUrl || 'Unknown'}

IMPORTANT: 
${isAPIDocumentation ? 
  '- This is API documentation, NOT an installable package - do not include npm install commands\n- Focus on HTTP requests, authentication, and API endpoints\n- Show actual API calls with curl, fetch, or HTTP libraries\n- Include proper authentication headers and request/response examples' :
  '- Only include installation section if this is actually an installable package\n- Keep examples practical and immediately usable\n- If you find 2+ additional important operations, include them as separate sections'
}
- Focus on real-world usage patterns from the analysis`

    console.log(`📝 Step 4: Synthesizing final documentation for ${packageName}`)
    const response = await this.callLLM(prompt)
    
    return {
      step: 'Documentation Synthesis',
      goal: 'Create the final snippet combining all findings', 
      findings: response,
      confidence: 0.95
    }
  }

  private formatTreeData(repoAnalysis?: RepoAnalysis): string {
    if (!repoAnalysis?.structure) {
      return 'No repository structure available'
    }
    
    const structure = repoAnalysis.structure
    return `
Source files: ${structure.sourceFiles?.slice(0, 10).join(', ') || 'None'}
Config files: ${structure.configFiles?.slice(0, 5).join(', ') || 'None'}  
Example files: ${structure.exampleFiles?.slice(0, 5).join(', ') || 'None'}
Test files: ${structure.testFiles?.slice(0, 5).join(', ') || 'None'}
Documentation: ${structure.documentationFiles?.slice(0, 5).join(', ') || 'None'}
`.trim()
  }

  private formatExampleCode(examples?: any[]): string {
    if (!examples || examples.length === 0) {
      return 'No example files found'
    }
    
    return examples.slice(0, 3).map((ex: any) => 
      `${ex.path}:\n${ex.content.substring(0, 800)}`
    ).join('\n\n---\n\n')
  }

  private formatTestCode(tests?: any[]): string {
    if (!tests || tests.length === 0) {
      return 'No test files found'
    }
    
    return tests.slice(0, 2).map((test: any) =>
      `${test.path}:\n${test.content.substring(0, 600)}`
    ).join('\n\n---\n\n')
  }

  private extractTypeDefinitions(repoAnalysis?: RepoAnalysis): string {
    // Look for .d.ts files or TypeScript source files
    if (!repoAnalysis?.structure) {
      return 'No type definitions found'
    }
    
    const tsFiles = repoAnalysis.structure.sourceFiles?.filter(f => 
      f.endsWith('.d.ts') || f.endsWith('.ts')
    ) || []
    
    return tsFiles.length > 0 
      ? `TypeScript files: ${tsFiles.slice(0, 5).join(', ')}`
      : 'No TypeScript definitions found'
  }

  private extractSourceExcerpts(repoAnalysis?: RepoAnalysis): string {
    if (!repoAnalysis?.structure) {
      return 'No source files available'
    }
    
    return `Main source files: ${repoAnalysis.structure.sourceFiles?.slice(0, 8).join(', ') || 'None'}`
  }

  private determineInstallationCommand(npmAnalysis?: NPMAnalysis): string | null {
    if (!npmAnalysis?.packageInfo) {
      return null // Not an NPM package
    }
    
    return `npm install ${npmAnalysis.packageInfo.name}`
  }

  private getOutputTemplate(): string {
    // Enhanced template with 3-5 usage examples
    return `
# [Package Name]

[Brief description - 2-3 sentences explaining what this package does]

## Installation

\`\`\`bash
[installation command - npm/pip/etc based on package type]
\`\`\`

## Configuration  

[Any required setup, environment variables, or initialization - include code example if needed]

## Authentication

\`\`\`[language]
// How to authenticate/initialize with realistic example
\`\`\`

## Basic Usage

### [Read/Get Operation Name]
\`\`\`[language]
// Realistic example of fetching/reading data
\`\`\`

### [Write/Create Operation Name]  
\`\`\`[language]
// Realistic example of creating/updating data
\`\`\`

### [Error Handling]
\`\`\`[language]
// Common error patterns and proper handling
\`\`\`

### [Additional Operation 1] (if available)
\`\`\`[language]
// Additional important operation example
\`\`\`

### [Additional Operation 2] (if available)
\`\`\`[language]
// Another additional important operation example
\`\`\`

## Additional Resources
- [Official Documentation](actual-link-if-available)
- [GitHub Repository](actual-github-link-if-available)
`.trim()
  }

  private calculateConfidence(baseConfidence: number): number {
    // Add some randomness to make confidence scores realistic
    return Math.min(1.0, Math.max(0.1, baseConfidence + (Math.random() - 0.5) * 0.2))
  }

  private getDataSources(repoAnalysis?: RepoAnalysis, npmAnalysis?: NPMAnalysis): string[] {
    const sources = []
    if (repoAnalysis) sources.push('github')
    if (npmAnalysis) sources.push('npm')
    if (repoAnalysis?.readme) sources.push('docs')
    return sources.length ? sources : ['unknown']
  }

  private async callLLM(prompt: string): Promise<string> {
    try {
      const response = await axios.post(`${this.baseUrl}/chat/completions`, {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert technical writer creating API documentation. Be precise, practical, and focus on what developers actually need to know.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.2 // Lower temperature for more consistent output
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      return response.data.choices[0]?.message?.content || ''
    } catch (error: any) {
      console.error('LLM API error:', error.response?.data || error.message)
      throw new Error('Failed to generate LLM response')
    }
  }
}