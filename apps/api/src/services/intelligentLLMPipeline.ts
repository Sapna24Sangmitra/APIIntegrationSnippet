// import axios from 'axios'
// import type { RepoAnalysis } from './githubAnalyzer'
// import type { NPMAnalysis } from './npmAnalyzer'

// export interface ProjectClassification {
//   type: 'library' | 'cli-tool' | 'web-app' | 'documentation' | 'example-project' | 'framework' | 'unknown'
//   isPackage: boolean
//   packageManager: 'npm' | 'pip' | 'none'
//   installationMethod: string | null
//   primaryLanguage: string
//   usageContext: string
//   confidence: number
// }

// export interface StructuredAnalysis {
//   mainFeatures: string[]
//   keyMethods: { name: string; description: string; example: string }[]
//   configuration: { required: boolean; description: string; example?: string }[]
//   commonUseCases: string[]
//   authenticationRequired: boolean
//   dependencies: string[]
// }

// export interface SmartSnippetResult {
//   classification: ProjectClassification
//   analysis: StructuredAnalysis
//   markdown: string
//   confidence: number
// }

// export class IntelligentLLMPipeline {
//   private apiKey: string
//   private model: string = 'gpt-4'
//   private baseUrl = 'https://api.openai.com/v1'

//   constructor() {
//     this.apiKey = process.env.OPENAI_API_KEY || ''
//     if (!this.apiKey) {
//       throw new Error('OpenAI API key is required')
//     }
//   }

//   async generateSmartSnippet(
//     packageName: string,
//     repoAnalysis?: RepoAnalysis,
//     npmAnalysis?: NPMAnalysis,
//     packageUrl?: string
//   ): Promise<SmartSnippetResult> {
    
//     // Step 1: Classify the project intelligently
//     console.log(`🧠 Classifying project type for: ${packageName}`)
//     const classification = await this.classifyProject(packageName, repoAnalysis, npmAnalysis)
    
//     console.log(`📋 Project classified as: ${classification.type} (confidence: ${classification.confidence})`)
    
//     // Step 2: Do targeted analysis based on project type
//     const analysis = await this.analyzeByType(classification, repoAnalysis, npmAnalysis)
    
//     // Step 3: Generate appropriate documentation
//     const markdown = await this.generateTypeSpecificDocs(packageName, classification, analysis, packageUrl)
    
//     return {
//       classification,
//       analysis,
//       markdown,
//       confidence: (classification.confidence + 0.3) / 1.3 // Blend confidences
//     }
//   }

//   private async classifyProject(
//     packageName: string,
//     repoAnalysis?: RepoAnalysis,
//     npmAnalysis?: NPMAnalysis
//   ): Promise<ProjectClassification> {
    
//     const context = this.buildClassificationContext(packageName, repoAnalysis, npmAnalysis)
    
//     const prompt = `Analyze this project and classify it. Return ONLY a JSON object with this exact structure:

// {
//   "type": "library|cli-tool|web-app|documentation|example-project|framework|unknown",
//   "isPackage": boolean,
//   "packageManager": "npm|pip|none", 
//   "installationMethod": "exact command or null",
//   "primaryLanguage": "javascript|python|typescript|etc",
//   "usageContext": "brief description of how this is used",
//   "confidence": 0.0-1.0
// }

// Project context:
// ${context}

// Rules:
// - If there's no package.json or setup.py, isPackage=false and installationMethod=null
// - Only suggest npm install if it's actually an NPM package
// - Only suggest pip install if it's actually a Python package  
// - For applications/demos, don't suggest installation commands
// - Be honest about confidence level`

//     const response = await this.callLLM(prompt)
    
//     try {
//       return JSON.parse(response)
//     } catch (error) {
//       console.error('Failed to parse classification JSON:', response)
//       // Fallback classification
//       return {
//         type: 'unknown',
//         isPackage: false,
//         packageManager: 'none',
//         installationMethod: null,
//         primaryLanguage: 'javascript',
//         usageContext: 'Unknown project type',
//         confidence: 0.3
//       }
//     }
//   }

//   private async analyzeByType(
//     classification: ProjectClassification,
//     repoAnalysis?: RepoAnalysis,
//     npmAnalysis?: NPMAnalysis
//   ): Promise<StructuredAnalysis> {
    
//     const context = this.buildAnalysisContext(repoAnalysis, npmAnalysis)
    
//     let prompt = ''
    
//     if (classification.type === 'library') {
//       prompt = `Analyze this ${classification.primaryLanguage} library. Return ONLY JSON:

// {
//   "mainFeatures": ["feature1", "feature2"],
//   "keyMethods": [{"name": "methodName", "description": "what it does", "example": "code example"}],
//   "configuration": [{"required": true/false, "description": "config description", "example": "config example"}],
//   "commonUseCases": ["use case 1", "use case 2"],
//   "authenticationRequired": boolean,
//   "dependencies": ["dep1", "dep2"]
// }

// Context: ${context}`
    
//     } else if (classification.type === 'cli-tool') {
//       prompt = `Analyze this CLI tool. Return ONLY JSON:

// {
//   "mainFeatures": ["command1", "command2"],
//   "keyMethods": [{"name": "command", "description": "what it does", "example": "usage example"}],
//   "configuration": [{"required": true/false, "description": "config needed"}],
//   "commonUseCases": ["use case 1", "use case 2"], 
//   "authenticationRequired": boolean,
//   "dependencies": []
// }

// Context: ${context}`
      
//     } else if (classification.type === 'web-app' || classification.type === 'example-project') {
//       prompt = `Analyze this ${classification.type}. Return ONLY JSON:

// {
//   "mainFeatures": ["what this app/demo does"],
//   "keyMethods": [{"name": "setup", "description": "how to run", "example": "setup commands"}],
//   "configuration": [{"required": true, "description": "required setup", "example": "env vars etc"}],
//   "commonUseCases": ["what this demonstrates"],
//   "authenticationRequired": boolean,
//   "dependencies": ["node", "npm", "etc"]
// }

// Context: ${context}`
      
//     } else {
//       // Generic analysis for unknown types
//       prompt = `Analyze this project generically. Return ONLY JSON with the same structure but focus on what can be determined.

// Context: ${context}`
//     }

//     const response = await this.callLLM(prompt)
    
//     try {
//       return JSON.parse(response)
//     } catch (error) {
//       console.error('Failed to parse analysis JSON:', response)
//       return {
//         mainFeatures: [],
//         keyMethods: [],
//         configuration: [],
//         commonUseCases: [],
//         authenticationRequired: false,
//         dependencies: []
//       }
//     }
//   }

//   private async generateTypeSpecificDocs(
//     packageName: string,
//     classification: ProjectClassification,
//     analysis: StructuredAnalysis,
//     packageUrl?: string
//   ): Promise<string> {
    
//     const analysisJson = JSON.stringify(analysis, null, 2)
//     const classificationJson = JSON.stringify(classification, null, 2)
    
//     const prompt = `Create professional API documentation based on this analysis.

// PROJECT: ${packageName}
// CLASSIFICATION: ${classificationJson}
// ANALYSIS: ${analysisJson}
// URL: ${packageUrl || 'Unknown'}

// Generate markdown following this template, but ONLY include sections that make sense:

// # ${packageName}

// [Brief description based on analysis]

// ${classification.installationMethod ? `## Installation

// \`\`\`bash
// ${classification.installationMethod}
// \`\`\`` : ''}

// ${analysis.configuration.length ? '## Configuration\n\n[Configuration details from analysis]' : ''}

// ## Usage

// ${analysis.keyMethods.map(method => `### ${method.name}
// ${method.description}

// \`\`\`${classification.primaryLanguage}
// ${method.example}
// \`\`\``).join('\n\n')}

// ${analysis.commonUseCases.length ? `## Common Use Cases

// ${analysis.commonUseCases.map(useCase => `- ${useCase}`).join('\n')}` : ''}

// ## Additional Resources
// ${packageUrl ? `- [Source Code](${packageUrl})` : ''}

// RULES:
// - Don't hallucinate installation commands
// - Only include sections with real data
// - Make examples practical and realistic
// - If it's not a package, don't show installation
// - Be accurate about what this actually is`

//     return await this.callLLM(prompt)
//   }

//   private buildClassificationContext(
//     packageName: string,
//     repoAnalysis?: RepoAnalysis,
//     npmAnalysis?: NPMAnalysis
//   ): string {
//     let context = `Project: ${packageName}\n`
    
//     if (npmAnalysis?.packageInfo) {
//       context += `NPM Package: ${npmAnalysis.packageInfo.name}\n`
//       context += `Description: ${npmAnalysis.packageInfo.description}\n`
//       context += `Keywords: ${npmAnalysis.packageInfo.keywords?.join(', ')}\n`
//       context += `Dependencies: ${Object.keys(npmAnalysis.packageInfo.dependencies || {}).slice(0, 5).join(', ')}\n`
//     }
    
//     if (repoAnalysis?.readme) {
//       context += `README (first 500 chars): ${repoAnalysis.readme.substring(0, 500)}\n`
//     }
    
//     if (repoAnalysis?.packageJson) {
//       context += `Package.json scripts: ${Object.keys(repoAnalysis.packageJson.scripts || {}).join(', ')}\n`
//     }
    
//     if (repoAnalysis?.structure) {
//       context += `File structure: ${repoAnalysis.structure.sourceFiles?.slice(0, 5).join(', ')}\n`
//     }
    
//     return context
//   }

//   private buildAnalysisContext(repoAnalysis?: RepoAnalysis, npmAnalysis?: NPMAnalysis): string {
//     let context = ''
    
//     if (repoAnalysis?.examples?.length) {
//       context += 'Example files:\n'
//       repoAnalysis.examples.slice(0, 2).forEach((ex: any) => {
//         context += `${ex.path}:\n${ex.content.substring(0, 800)}\n\n`
//       })
//     }
    
//     if (repoAnalysis?.readme) {
//       context += `README:\n${repoAnalysis.readme.substring(0, 1000)}\n\n`
//     }
    
//     if (npmAnalysis?.packageInfo) {
//       context += `Package info: ${JSON.stringify(npmAnalysis.packageInfo, null, 2).substring(0, 800)}\n`
//     }
    
//     return context
//   }

//   private async callLLM(prompt: string): Promise<string> {
//     try {
//       const response = await axios.post(`${this.baseUrl}/chat/completions`, {
//         model: this.model,
//         messages: [
//           {
//             role: 'system',
//             content: 'You are a technical analyst. Follow instructions exactly. Return only the requested format.'
//           },
//           {
//             role: 'user',
//             content: prompt
//           }
//         ],
//         max_tokens: 1500,
//         temperature: 0.1 // Low temperature for consistent, structured output
//       }, {
//         headers: {
//           'Authorization': `Bearer ${this.apiKey}`,
//           'Content-Type': 'application/json'
//         }
//       })

//       return response.data.choices[0]?.message?.content || ''
//     } catch (error: any) {
//       console.error('LLM API error:', error.response?.data || error.message)
//       throw new Error('Failed to generate LLM response')
//     }
//   }
// }