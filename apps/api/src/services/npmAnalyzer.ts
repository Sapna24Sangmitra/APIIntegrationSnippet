import axios from 'axios'

export interface NPMPackage {
  name: string
  version: string
  description?: string
  author?: any
  repository?: any
  homepage?: string
  keywords?: string[]
  license?: string
  dependencies?: any
  devDependencies?: any
  downloads?: number
}

export interface NPMAnalysis {
  packageInfo: NPMPackage
  typings?: any
  downloadStats: {
    last30days: number
    lastWeek: number
  }
  dependents: string[]
  repository?: any
}

export class NPMAnalyzer {
  private registryUrl = 'https://registry.npmjs.org'
  private downloadsUrl = 'https://api.npmjs.org/downloads'

  async parsePackageIdentifier(identifier: string): Promise<string> {
    // Handle different formats:
    // - package-name
    // - @scope/package-name  
    // - https://www.npmjs.com/package/package-name
    
    if (identifier.includes('npmjs.com')) {
      const match = identifier.match(/npmjs\.com\/package\/([^\/\?]+)/)
      return match ? match[1] : identifier
    }

    return identifier.trim()
  }

  async analyzePackage(packageName: string): Promise<NPMAnalysis> {
    try {
      // Get package metadata
      const packageInfo = await this.getPackageInfo(packageName)
      
      // Get download statistics
      const downloadStats = await this.getDownloadStats(packageName)
      
      // Get dependent packages (sample)
      const dependents = await this.getDependents(packageName)
      
      // Get TypeScript definitions if available
      const typings = await this.getTypings(packageName, packageInfo)

      return {
        packageInfo,
        typings,
        downloadStats,
        dependents,
        repository: packageInfo.repository
      }
    } catch (error) {
      console.error('Error analyzing NPM package:', error)
      throw new Error(`Failed to analyze package: ${packageName}`)
    }
  }

  private async getPackageInfo(packageName: string): Promise<NPMPackage> {
    try {
      const response = await axios.get(`${this.registryUrl}/${packageName}`)
      const data = response.data
      const latestVersion = data['dist-tags']?.latest || Object.keys(data.versions || {})[0]
      const versionInfo = data.versions?.[latestVersion] || {}

      return {
        name: data.name,
        version: latestVersion,
        description: versionInfo.description || data.description,
        author: versionInfo.author || data.author,
        repository: versionInfo.repository || data.repository,
        homepage: versionInfo.homepage || data.homepage,
        keywords: versionInfo.keywords || data.keywords || [],
        license: versionInfo.license || data.license,
        dependencies: versionInfo.dependencies || {},
        devDependencies: versionInfo.devDependencies || {}
      }
    } catch (error) {
      throw new Error(`Package not found: ${packageName}`)
    }
  }

  private async getDownloadStats(packageName: string) {
    try {
      // Get last 30 days downloads
      const [monthResponse, weekResponse] = await Promise.all([
        axios.get(`${this.downloadsUrl}/point/last-month/${packageName}`).catch(() => null),
        axios.get(`${this.downloadsUrl}/point/last-week/${packageName}`).catch(() => null)
      ])

      return {
        last30days: monthResponse?.data?.downloads || 0,
        lastWeek: weekResponse?.data?.downloads || 0
      }
    } catch (error) {
      return {
        last30days: 0,
        lastWeek: 0
      }
    }
  }

  private async getDependents(packageName: string): Promise<string[]> {
    try {
      // Use npms.io API to get some dependents
      const response = await axios.get(`https://api.npms.io/v2/search/suggestions?q=${packageName}`)
      const suggestions = response.data || []
      
      // Filter for packages that might depend on this one
      return suggestions
        .map((pkg: any) => pkg.package?.name)
        .filter((name: string) => name && name !== packageName)
        .slice(0, 10)
    } catch (error) {
      return []
    }
  }

  private async getTypings(packageName: string, packageInfo: NPMPackage): Promise<any> {
    // Check if package has built-in TypeScript definitions
    if (packageInfo.dependencies?.['@types/' + packageName] || 
        packageInfo.devDependencies?.['@types/' + packageName]) {
      
      try {
        const typesPackage = '@types/' + packageName
        const response = await axios.get(`${this.registryUrl}/${typesPackage}`)
        return {
          hasTypes: true,
          typesPackage,
          version: response.data['dist-tags']?.latest
        }
      } catch (error) {
        return { hasTypes: false }
      }
    }

    // Check if main field points to .d.ts or has types field
    if (packageInfo.repository?.url?.includes('typescript') || 
        packageName.includes('types')) {
      return { hasTypes: true, builtin: true }
    }

    return { hasTypes: false }
  }

  isValidPackageName(name: string): boolean {
    // NPM package name validation
    const validPattern = /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/
    return validPattern.test(name) && name.length <= 214
  }

  extractGitHubRepo(packageInfo: NPMPackage): string | null {
    const repo = packageInfo.repository
    
    if (!repo) return null
    
    if (typeof repo === 'string') {
      const match = repo.match(/github\.com[\/:]([^\/]+\/[^\/]+)/)
      return match ? `https://github.com/${match[1].replace('.git', '')}` : null
    }
    
    if (repo.url) {
      const match = repo.url.match(/github\.com[\/:]([^\/]+\/[^\/]+)/)
      return match ? `https://github.com/${match[1].replace('.git', '')}` : null
    }
    
    return null
  }
}