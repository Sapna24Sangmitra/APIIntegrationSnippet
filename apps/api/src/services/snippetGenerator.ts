import { v4 as uuidv4 } from 'uuid'
import { GenerateSnippetRequest, PackageSnippet } from '../types'

export class SnippetGenerator {
  async generateSnippet(request: GenerateSnippetRequest): Promise<PackageSnippet> {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Extract package info from URL or name
    const packageInfo = this.parsePackageInfo(request)
    
    // Generate snippet
    return this.createSnippet(packageInfo, request.packageType)
  }

  private parsePackageInfo(request: GenerateSnippetRequest) {
    const { packageUrl } = request
    
    if (packageUrl.includes('github.com')) {
      const match = packageUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/)
      return {
        name: match ? match[2] : 'unknown-repo',
        identifier: packageUrl,
        vendor: match ? match[1] : 'unknown'
      }
    } else if (packageUrl.includes('npmjs.com')) {
      const match = packageUrl.match(/npmjs\.com\/package\/([^\/]+)/)
      return {
        name: match ? match[1] : 'unknown-package',
        identifier: match ? match[1] : packageUrl,
        vendor: match ? match[1] : 'unknown'
      }
    } else {
      // Assume it's a package name
      return {
        name: packageUrl,
        identifier: packageUrl,
        vendor: packageUrl
      }
    }
  }

  private createSnippet(packageInfo: any, packageType: string): PackageSnippet {
    const markdown = this.generateMarkdown(packageInfo.name, packageInfo.identifier, packageType)
    
    return {
      id: uuidv4(),
      vendorName: this.capitalize(packageInfo.name),
      packageIdentifier: packageInfo.identifier,
      language: packageType === 'pypi' ? ['python'] : ['javascript', 'typescript'],
      topics: this.generateTopics(packageType),
      lastUpdated: new Date().toISOString(),
      version: '1.0.0',
      description: `A powerful ${packageType} package for modern applications`,
      popularity: {
        npmDownloads: Math.floor(Math.random() * 1000000),
        githubStars: Math.floor(Math.random() * 10000)
      },
      generationMetadata: {
        llmModel: 'gpt-4',
        generatedAt: new Date().toISOString(),
        dataSource: [packageType, 'docs'],
        confidence: 0.85 + Math.random() * 0.1
      },
      markdown
    }
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  private generateTopics(packageType: string): string[] {
    const topicMap = {
      npm: ['javascript', 'node', 'library'],
      github: ['open-source', 'development', 'tools'],
      pypi: ['python', 'library', 'package'],
      openapi: ['api', 'rest', 'documentation']
    }
    return topicMap[packageType as keyof typeof topicMap] || ['general']
  }

  private generateMarkdown(packageName: string, packageIdentifier: string, packageType: string): string {
    const capitalizedName = this.capitalize(packageName)
    const codeBlock = '```'
    
    if (packageType === 'pypi') {
      return `# ${capitalizedName}

A Python library for building powerful applications.

## Installation

${codeBlock}bash
pip install ${packageIdentifier}
${codeBlock}

## Configuration

${codeBlock}python
from ${packageName} import Client

client = Client(api_key='your-api-key')
${codeBlock}

## Basic Usage

### Read Operation
${codeBlock}python
# Fetch data
data = client.get_data(id='example-id')
print(data)
${codeBlock}

### Write Operation
${codeBlock}python
# Create new resource
result = client.create({
    'name': 'Example Resource',
    'type': 'demo'
})
print(f'Created: {result.id}')
${codeBlock}

## Error Handling

${codeBlock}python
try:
    data = client.get_data(id='invalid')
except Exception as error:
    print(f'Error: {error}')
${codeBlock}

## Additional Resources
- [PyPI Package](https://pypi.org/project/${packageIdentifier}/)
- [Documentation](https://example.com/docs)`
    }

    return `# ${capitalizedName}

A modern JavaScript/TypeScript library for building powerful applications.

## Installation

${codeBlock}bash
npm install ${packageIdentifier}
${codeBlock}

## Configuration

${codeBlock}javascript
import { ${capitalizedName} } from '${packageIdentifier}'

// Initialize the library
const client = new ${capitalizedName}({
  apiKey: 'your-api-key'
})
${codeBlock}

## Basic Usage

### Read Operation
${codeBlock}javascript
// Fetch data
const data = await client.getData({
  id: 'example-id'
})

console.log(data)
${codeBlock}

### Write Operation
${codeBlock}javascript
// Create new resource
const result = await client.create({
  name: 'Example Resource',
  type: 'demo'
})

console.log('Created:', result.id)
${codeBlock}

## Error Handling

${codeBlock}javascript
try {
  const data = await client.getData({ id: 'invalid' })
} catch (error) {
  console.error('Error:', error.message)
}
${codeBlock}

## Additional Resources
- [Documentation](https://example.com/docs)
- [GitHub Repository](https://github.com/user/${packageName})`
  }
}