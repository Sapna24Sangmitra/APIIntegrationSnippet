// import axios from 'axios'
// import Anthropic from '@anthropic-ai/sdk'
// import type { RepoAnalysis } from './githubAnalyzer'
// import type { NPMAnalysis } from './npmAnalyzer'

// // Set this to test different LLM providers
// const ModeToUse: 'openai' | 'anthropic' = 'anthropic'

// export interface LLMAnalysisStep {
//   step: string
//   prompt: string
//   response?: string
//   confidence?: number
// }

// export interface SnippetGenerationResult {
//   markdown: string
//   confidence: number
//   steps: LLMAnalysisStep[]
//   metadata: {
//     model: string
//     generatedAt: string
//     dataSource: string[]
//     analysisSteps: number
//   }
// }

// export class LLMPipeline {
//   private openaiApiKey: string
//   private anthropicApiKey: string
//   private model: string
//   private baseUrl: string
//   private anthropicClient?: Anthropic

//   constructor() {
//     this.openaiApiKey = process.env.OPENAI_API_KEY || ''
//     this.anthropicApiKey = process.env.ANTHROPIC_API_KEY || ''
    
//     if (ModeToUse === 'openai') {
//       this.model = 'gpt-4'
//       this.baseUrl = 'https://api.openai.com/v1'
//       if (!this.openaiApiKey) {
//         throw new Error('OpenAI API key is required. Please set OPENAI_API_KEY environment variable.')
//       }
//     } else if (ModeToUse === 'anthropic') {
//       this.model = 'claude-sonnet-4-20250514'
//       this.baseUrl = ''
//       if (!this.anthropicApiKey) {
//         throw new Error('Anthropic API key is required. Please set ANTHROPIC_API_KEY environment variable.')
//       }
//       this.anthropicClient = new Anthropic({
//         apiKey: this.anthropicApiKey,
//       })
//     }
//   }

//   async generateSnippet(
//     packageName: string,
//     repoAnalysis?: RepoAnalysis,
//     npmAnalysis?: NPMAnalysis,
//     packageUrl?: string
//   ): Promise<SnippetGenerationResult> {
//     const steps: LLMAnalysisStep[] = []
//     let confidence = 0.5
    
//     try {
//       // Step 1: Repository Structure Analysis
//       if (repoAnalysis) {
//         const structureStep = await this.analyzeRepositoryStructure(packageName, repoAnalysis)
//         steps.push(structureStep)
//         confidence += 0.1
//       }

//       // Step 2: Code Pattern Extraction
//       if (repoAnalysis?.examples || repoAnalysis?.tests) {
//         const patternStep = await this.extractUsagePatterns(packageName, repoAnalysis)
//         steps.push(patternStep)
//         confidence += 0.1
//       }

//       // Step 3: API Surface Analysis
//       if (npmAnalysis?.packageInfo || repoAnalysis?.packageJson) {
//         const apiStep = await this.analyzeApiSurface(packageName, npmAnalysis, repoAnalysis)
//         steps.push(apiStep)
//         confidence += 0.1
//       }

//       // Step 4: Documentation Synthesis
//       const synthesisStep = await this.synthesizeDocumentation(packageName, steps, npmAnalysis, repoAnalysis, packageUrl)
//       steps.push(synthesisStep)
//       confidence += 0.2

//       return {
//         markdown: synthesisStep.response || this.generateFallbackSnippet(packageName, npmAnalysis),
//         confidence: Math.min(confidence, 1.0),
//         steps,
//         metadata: {
//           model: this.model,
//           generatedAt: new Date().toISOString(),
//           dataSource: this.getDataSources(repoAnalysis, npmAnalysis),
//           analysisSteps: steps.length
//         }
//       }
//     } catch (error) {
//       console.error('LLM Pipeline error:', error)
      
//       // Return fallback snippet
//       return {
//         markdown: this.generateFallbackSnippet(packageName, npmAnalysis),
//         confidence: 0.3,
//         steps,
//         metadata: {
//           model: 'fallback',
//           generatedAt: new Date().toISOString(),
//           dataSource: ['fallback'],
//           analysisSteps: 0
//         }
//       }
//     }
//   }

//   private async analyzeRepositoryStructure(packageName: string, repoAnalysis: RepoAnalysis): Promise<LLMAnalysisStep> {
//     const prompt = `Analyze this repository structure and identify key information about the package:

// Package Name: ${packageName}

// Repository Structure:
// - Source files: ${repoAnalysis.structure.sourceFiles?.slice(0, 10).join(', ')}
// - Config files: ${repoAnalysis.structure.configFiles?.slice(0, 5).join(', ')}
// - Documentation: ${repoAnalysis.structure.documentationFiles?.slice(0, 5).join(', ')}

// Package.json: ${JSON.stringify(repoAnalysis.packageJson, null, 2)?.substring(0, 1000)}

// README excerpt: ${repoAnalysis.readme?.substring(0, 1500)}

// Identify:
// 1. Main entry points and module structure
// 2. Key dependencies and their purposes  
// 3. Configuration requirements
// 4. Primary use cases and target environment

// Respond with concise analysis focusing on developer usage patterns.`

//     const response = await this.callLLM(prompt)
    
//     return {
//       step: 'Repository Structure Discovery',
//       prompt,
//       response,
//       confidence: 0.8
//     }
//   }

//   private async extractUsagePatterns(packageName: string, repoAnalysis: RepoAnalysis): Promise<LLMAnalysisStep> {
//     const exampleContent = repoAnalysis.examples?.map((ex: any) => `${ex.path}:\n${ex.content}`).join('\n\n')
//     const testContent = repoAnalysis.tests?.map((test: any) => `${test.path}:\n${test.content}`).join('\n\n')

//     const prompt = `Extract common usage patterns from these code files for ${packageName}:

// EXAMPLE FILES:
// ${exampleContent || 'No examples found'}

// TEST FILES:
// ${testContent || 'No tests found'}

// Extract:
// 1. How is the package typically initialized/imported?
// 2. What are the most common method calls and patterns?
// 3. How is authentication/configuration handled?
// 4. What are typical input/output patterns?
// 5. Common error scenarios and handling

// Focus on practical usage patterns a developer would need to know.`

//     const response = await this.callLLM(prompt)
    
//     return {
//       step: 'Code Pattern Extraction',
//       prompt,
//       response,
//       confidence: 0.9
//     }
//   }

//   private async analyzeApiSurface(packageName: string, npmAnalysis?: NPMAnalysis, repoAnalysis?: RepoAnalysis): Promise<LLMAnalysisStep> {
//     const packageInfo = npmAnalysis?.packageInfo
//     const hasTypings = npmAnalysis?.typings?.hasTypes

//     const prompt = `Document the public API surface for ${packageName}:

// Package Information:
// - Name: ${packageInfo?.name}
// - Version: ${packageInfo?.version}
// - Description: ${packageInfo?.description}
// - Keywords: ${packageInfo?.keywords?.join(', ')}
// - Dependencies: ${Object.keys(packageInfo?.dependencies || {}).join(', ')}
// - Has TypeScript definitions: ${hasTypings}

// Downloads: ${npmAnalysis?.downloadStats.last30days} (last 30 days)

// Based on this information:
// 1. Identify the main API methods/functions
// 2. Determine parameter types and return values
// 3. Note any async vs sync patterns
// 4. Identify authentication requirements
// 5. List required vs optional dependencies

// Provide a technical summary of the API surface.`

//     const response = await this.callLLM(prompt)
    
//     return {
//       step: 'API Surface Analysis', 
//       prompt,
//       response,
//       confidence: 0.85
//     }
//   }

//   private async synthesizeDocumentation(
//     packageName: string, 
//     analysisSteps: LLMAnalysisStep[],
//     npmAnalysis?: NPMAnalysis,
//     _repoAnalysis?: RepoAnalysis,
//     packageUrl?: string
//   ): Promise<LLMAnalysisStep> {
//     const analysisContent = analysisSteps.map(step => `${step.step}:\n${step.response}`).join('\n\n')
//     const packageInfo = npmAnalysis?.packageInfo
    
//     const prompt = `Create a comprehensive API documentation snippet based on this analysis:

// Package: ${packageName}
// ${packageInfo?.description ? `Description: ${packageInfo.description}` : ''}
// ${packageUrl ? `URL: ${packageUrl}` : ''}

// ANALYSIS FINDINGS:
// ${analysisContent}

// Create a markdown snippet following this exact format:

// # [Package Name]

// [2-3 sentence description explaining what this package does and its main purpose]

// ## Installation

// \`\`\`bash
// [installation command - npm/pip/etc based on package type]
// \`\`\`

// ## Configuration  

// [Any required setup, environment variables, or initialization - include code example if needed]

// ## Authentication

// \`\`\`[language]
// // How to authenticate/initialize with realistic example
// \`\`\`

// ## Basic Usage

// ### [Read/Get Operation Name]
// \`\`\`[language]
// // Realistic example of fetching/reading data
// \`\`\`

// ### [Write/Create Operation Name]  
// \`\`\`[language]
// // Realistic example of creating/updating data
// \`\`\`

// ## Error Handling

// \`\`\`[language]
// // Common error patterns and proper handling
// \`\`\`

// ## Additional Resources
// - [Official Documentation](actual-link-if-available)
// - [GitHub Repository](actual-github-link-if-available)

// IMPORTANT: Use realistic method names, parameters, and examples based on the analysis. Make code examples practical and immediately usable.`

//     const response = await this.callLLM(prompt)
    
//     return {
//       step: 'Documentation Synthesis',
//       prompt,
//       response,
//       confidence: 0.95
//     }
//   }

//   private async callLLM(prompt: string): Promise<string> {
//     try {
//       if (ModeToUse === 'openai') {
//         return await this.callOpenAI(prompt)
//       } else if (ModeToUse === 'anthropic') {
//         return await this.callAnthropic(prompt)
//       }
//       throw new Error('Invalid ModeToUse configuration')
//     } catch (error: any) {
//       console.error('LLM API error:', error.response?.data || error.message)
//       throw new Error('Failed to generate LLM response')
//     }
//   }

//   private async callOpenAI(prompt: string): Promise<string> {
//     const response = await axios.post(`${this.baseUrl}/chat/completions`, {
//       model: this.model,
//       messages: [
//         {
//           role: 'system',
//           content: 'You are an expert technical writer specializing in API documentation. Create clear, accurate, and practical documentation that developers can immediately use.'
//         },
//         {
//           role: 'user', 
//           content: prompt
//         }
//       ],
//       max_tokens: 1000,
//       temperature: 0.3
//     }, {
//       headers: {
//         'Authorization': `Bearer ${this.openaiApiKey}`,
//         'Content-Type': 'application/json'
//       }
//     })

//     return response.data.choices[0]?.message?.content || ''
//   }

//   private async callAnthropic(prompt: string): Promise<string> {
//     if (!this.anthropicClient) {
//       throw new Error('Anthropic client not initialized')
//     }

//     const response = await this.anthropicClient.messages.create({
//       model: this.model,
//       max_tokens: 1000,
//       temperature: 0.3,
//       system: 'You are an expert technical writer specializing in API documentation. Create clear, accurate, and practical documentation that developers can immediately use.',
//       messages: [
//         {
//           role: 'user',
//           content: prompt
//         }
//       ]
//     })

//     return response.content[0]?.type === 'text' ? response.content[0].text : ''
//   }

//   private getDataSources(repoAnalysis?: RepoAnalysis, npmAnalysis?: NPMAnalysis): string[] {
//     const sources = []
//     if (repoAnalysis) sources.push('github')
//     if (npmAnalysis) sources.push('npm')
//     return sources.length ? sources : ['unknown']
//   }

//   private generateFallbackSnippet(packageName: string, npmAnalysis?: NPMAnalysis): string {
//     const packageInfo = npmAnalysis?.packageInfo
//     const isTypeScript = packageInfo?.keywords?.includes('typescript') || packageInfo?.name?.includes('types')
//     const language = isTypeScript ? 'typescript' : 'javascript'
    
//     return `# ${packageName}

// ${packageInfo?.description || `A ${language} package for modern applications.`}

// ## Installation

// \`\`\`bash
// npm install ${packageName}
// \`\`\`

// ## Basic Usage

// \`\`\`${language}
// import ${packageName} from '${packageName}'

// // Initialize
// const client = ${packageName}({
//   // configuration options
// })

// // Example usage
// const result = await client.someMethod()
// console.log(result)
// \`\`\`

// ## Additional Resources
// ${packageInfo?.homepage ? `- [Homepage](${packageInfo.homepage})` : ''}
// ${npmAnalysis ? `- [NPM Package](https://www.npmjs.com/package/${packageName})` : ''}
// `
//   }
// }