import axios from 'axios'

export interface GitHubRepo {
  owner: string
  repo: string
  branch: string
  description?: string
  language?: string
  stars: number
  license?: string
}

export interface RepoAnalysis {
  structure: any
  packageJson?: any
  readme?: string
  examples: string[]
  tests: string[]
  docs: string[]
}

export class GitHubAnalyzer {
  private token: string
  private baseUrl = 'https://api.github.com'

  constructor() {
    this.token = process.env.GITHUB_TOKEN || ''
    if (!this.token) {
      console.warn('GitHub token not provided. API rate limits will be lower.')
    }
  }

  private get headers() {
    return {
      'Authorization': this.token ? `Bearer ${this.token}` : '',
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'API-Snippet-Generator/1.0'
    }
  }

  async parseRepoUrl(url: string): Promise<GitHubRepo | null> {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/)
    if (!match) return null

    const [, owner, repo] = match
    
    try {
      const response = await axios.get(`${this.baseUrl}/repos/${owner}/${repo}`, {
        headers: this.headers
      })

      return {
        owner,
        repo,
        branch: response.data.default_branch || 'main',
        description: response.data.description,
        language: response.data.language,
        stars: response.data.stargazers_count,
        license: response.data.license?.name
      }
    } catch (error) {
      console.error('Error fetching repo info:', error)
      return null
    }
  }

  async analyzeRepository(repoInfo: GitHubRepo): Promise<RepoAnalysis> {
    const { owner, repo, branch } = repoInfo

    try {
      // Get repository tree structure
      const treeResponse = await axios.get(
        `${this.baseUrl}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
        { headers: this.headers }
      )

      const files = treeResponse.data.tree || []
      
      // Analyze structure and categorize files
      const structure = this.categorizeFiles(files)
      
      // Get package.json if it exists
      const packageJson = await this.getPackageJson(owner, repo, branch)
      
      // Get README content
      const readme = await this.getReadme(owner, repo, branch)
      
      // Find example files
      const examples = await this.getExampleFiles(owner, repo, branch, files)
      
      // Find test files  
      const tests = await this.getTestFiles(owner, repo, branch, files)
      
      // Find documentation files
      const docs = await this.getDocsFiles(owner, repo, branch, files)

      return {
        structure,
        packageJson,
        readme,
        examples,
        tests,
        docs
      }
    } catch (error) {
      console.error('Error analyzing repository:', error)
      throw new Error('Failed to analyze repository')
    }
  }

  private categorizeFiles(files: any[]) {
    const structure = {
      sourceFiles: [],
      configFiles: [],
      documentationFiles: [],
      testFiles: [],
      exampleFiles: []
    }

    for (const file of files) {
      if (file.type !== 'blob') continue

      const path = file.path.toLowerCase()
      
      if (path.includes('src/') || path.includes('lib/')) {
        structure.sourceFiles.push(file.path)
      } else if (path.includes('test') || path.includes('spec')) {
        structure.testFiles.push(file.path)
      } else if (path.includes('example') || path.includes('demo')) {
        structure.exampleFiles.push(file.path)
      } else if (path.includes('doc') || path.endsWith('.md')) {
        structure.documentationFiles.push(file.path)
      } else if (path.includes('config') || path.endsWith('.json') || path.endsWith('.js')) {
        structure.configFiles.push(file.path)
      }
    }

    return structure
  }

  private async getPackageJson(owner: string, repo: string, branch: string) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/repos/${owner}/${repo}/contents/package.json?ref=${branch}`,
        { headers: this.headers }
      )
      
      const content = Buffer.from(response.data.content, 'base64').toString()
      return JSON.parse(content)
    } catch (error) {
      return null
    }
  }

  private async getReadme(owner: string, repo: string, branch: string) {
    const readmeFiles = ['README.md', 'readme.md', 'README.txt', 'readme.txt']
    
    for (const filename of readmeFiles) {
      try {
        const response = await axios.get(
          `${this.baseUrl}/repos/${owner}/${repo}/contents/${filename}?ref=${branch}`,
          { headers: this.headers }
        )
        
        return Buffer.from(response.data.content, 'base64').toString()
      } catch (error) {
        continue
      }
    }
    
    return null
  }

  private async getExampleFiles(owner: string, repo: string, branch: string, files: any[]) {
    const exampleFiles = files.filter(f => 
      f.path.toLowerCase().includes('example') || 
      f.path.toLowerCase().includes('demo')
    ).slice(0, 5) // Limit to 5 files

    const contents = []
    for (const file of exampleFiles) {
      try {
        const response = await axios.get(
          `${this.baseUrl}/repos/${owner}/${repo}/contents/${file.path}?ref=${branch}`,
          { headers: this.headers }
        )
        
        const content = Buffer.from(response.data.content, 'base64').toString()
        contents.push({
          path: file.path,
          content: content.substring(0, 2000) // Limit content size
        })
      } catch (error) {
        continue
      }
    }

    return contents
  }

  private async getTestFiles(owner: string, repo: string, branch: string, files: any[]) {
    const testFiles = files.filter(f => 
      f.path.toLowerCase().includes('test') || 
      f.path.toLowerCase().includes('spec')
    ).slice(0, 3) // Limit to 3 files

    const contents = []
    for (const file of testFiles) {
      try {
        const response = await axios.get(
          `${this.baseUrl}/repos/${owner}/${repo}/contents/${file.path}?ref=${branch}`,
          { headers: this.headers }
        )
        
        const content = Buffer.from(response.data.content, 'base64').toString()
        contents.push({
          path: file.path,
          content: content.substring(0, 1500) // Limit content size
        })
      } catch (error) {
        continue
      }
    }

    return contents
  }

  private async getDocsFiles(owner: string, repo: string, branch: string, files: any[]) {
    const docFiles = files.filter(f => 
      f.path.toLowerCase().includes('doc') && 
      f.path.endsWith('.md')
    ).slice(0, 3) // Limit to 3 files

    const contents = []
    for (const file of docFiles) {
      try {
        const response = await axios.get(
          `${this.baseUrl}/repos/${owner}/${repo}/contents/${file.path}?ref=${branch}`,
          { headers: this.headers }
        )
        
        const content = Buffer.from(response.data.content, 'base64').toString()
        contents.push({
          path: file.path,
          content: content.substring(0, 1500) // Limit content size
        })
      } catch (error) {
        continue
      }
    }

    return contents
  }
}