/**
 * Kaixa Jr Documentation Generator
 * Auto-generates documentation from JSDoc comments
 * 
 * @module src/utils/docGenerator
 */

const fs = require('fs');
const path = require('path');

/**
 * Documentation Generator
 * @class DocGenerator
 */
class DocGenerator {
  constructor(options = {}) {
    this.srcDir = options.srcDir || path.join(process.cwd(), 'src');
    this.outputDir = options.outputDir || path.join(process.cwd(), 'docs', 'auto-generated');
    this.extensions = options.extensions || ['.js'];
  }
  
  /**
   * Generate documentation for all files
   * @method generateAll
   */
  generateAll() {
    console.log('📚 DocGenerator: Starting documentation generation...\n');
    
    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
    
    // Find all source files
    const files = this.findSourceFiles(this.srcDir);
    console.log(`Found ${files.length} source files\n`);
    
    // Generate docs for each file
    const docs = files.map(file => this.generateFileDoc(file));
    
    // Generate index
    this.generateIndex(docs);
    
    // Generate summary
    this.generateSummary(docs);
    
    console.log(`✅ Documentation generated in ${this.outputDir}\n`);
  }
  
  /**
   * Find all source files recursively
   * @method findSourceFiles
   */
  findSourceFiles(dir, files = []) {
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        this.findSourceFiles(fullPath, files);
      } else if (this.extensions.includes(path.extname(item))) {
        files.push(fullPath);
      }
    });
    
    return files;
  }
  
  /**
   * Generate documentation for a single file
   * @method generateFileDoc
   */
  generateFileDoc(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(process.cwd(), filePath);
    
    // Extract JSDoc comments
    const jsdocPattern = /\/\*\*[\s\S]*?\*\//g;
    const comments = content.match(jsdocPattern) || [];
    
    // Parse comments
    const parsed = comments.map(comment => this.parseComment(comment));
    
    // Generate markdown
    const markdown = this.generateMarkdown(relativePath, parsed);
    
    // Write to file
    const outputFileName = relativePath.replace(/[\\\/]/g, '-').replace('.js', '.md');
    const outputPath = path.join(this.outputDir, outputFileName);
    fs.writeFileSync(outputPath, markdown);
    
    console.log(`  ✓ ${relativePath} → ${outputFileName}`);
    
    return {
      file: relativePath,
      output: outputFileName,
      comments: parsed.length
    };
  }
  
  /**
   * Parse JSDoc comment
   * @method parseComment
   */
  parseComment(comment) {
    // Remove /** and */
    const clean = comment.replace(/^\/\*\*/, '').replace(\/\*\/$/, '');
    
    const lines = clean.split('\n').map(line => 
      line.replace(/^\s*\*\s?/, '').trim()
    ).filter(line => line);
    
    const result = {
      description: [],
      module: null,
      class: null,
      method: null,
      param: [],
      returns: null,
      example: []
    };
    
    let current = 'description';
    
    lines.forEach(line => {
      if (line.startsWith('@module')) {
        result.module = line.replace('@module', '').trim();
      } else if (line.startsWith('@class')) {
        result.class = line.replace('@class', '').trim();
        current = 'description';
      } else if (line.startsWith('@method')) {
        result.method = line.replace('@method', '').trim();
        current = 'description';
      } else if (line.startsWith('@param')) {
        result.param.push(this.parseParam(line));
      } else if (line.startsWith('@returns')) {
        result.returns = line.replace('@returns', '').trim();
      } else if (line.startsWith('@example')) {
        current = 'example';
      } else if (current === 'example') {
        result.example.push(line);
      } else {
        result.description.push(line);
      }
    });
    
    return result;
  }
  
  /**
   * Parse @param tag
   * @method parseParam
   */
  parseParam(line) {
    const match = line.match(/@param\s+\{([^}]+)\}\s+(\w+)\s*-?\s*(.*)/);
    if (match) {
      return {
        type: match[1],
        name: match[2],
        description: match[3] || ''
      };
    }
    return { type: 'any', name: 'unknown', description: line };
  }
  
  /**
   * Generate markdown from parsed comments
   * @method generateMarkdown
   */
  generateMarkdown(filePath, comments) {
    let md = `# ${path.basename(filePath)}\n\n`;
    md += `**Source:** \`${filePath}\`\n\n`;
    md += `---\n\n`;
    
    comments.forEach(comment => {
      // Module
      if (comment.module) {
        md += `## Module: ${comment.module}\n\n`;
      }
      
      // Class
      if (comment.class) {
        md += `### Class: ${comment.class}\n\n`;
      }
      
      // Method
      if (comment.method) {
        md += `#### ${comment.method}()\n\n`;
      }
      
      // Description
      if (comment.description.length > 0) {
        md += `${comment.description.join(' ')}\n\n`;
      }
      
      // Parameters
      if (comment.param.length > 0) {
        md += `**Parameters:**\n\n`;
        md += `| Name | Type | Description |\n`;
        md += `|------|------|-------------|\n`;
        comment.param.forEach(p => {
          md += `| ${p.name} | \`${p.type}\` | ${p.description} |\n`;
        });
        md += '\n';
      }
      
      // Returns
      if (comment.returns) {
        md += `**Returns:** ${comment.returns}\n\n`;
      }
      
      // Example
      if (comment.example.length > 0) {
        md += `**Example:**\n\n`;
        md += '```javascript\n';
        md += comment.example.join('\n') + '\n';
        md += '```\n\n';
      }
      
      md += '---\n\n';
    });
    
    return md;
  }
  
  /**
   * Generate index file
   * @method generateIndex
   */
  generateIndex(docs) {
    let md = '# Auto-Generated Documentation\n\n';
    md += `Generated: ${new Date().toISOString()}\n\n`;
    md += `## Files\n\n`;
    
    docs.forEach(doc => {
      md += `- [${doc.file}](./${doc.output}) (${doc.comments} docs)\n`;
    });
    
    fs.writeFileSync(path.join(this.outputDir, 'README.md'), md);
    console.log('\n  ✓ Generated index: README.md');
  }
  
  /**
   * Generate summary report
   * @method generateSummary
   */
  generateSummary(docs) {
    const totalFiles = docs.length;
    const totalComments = docs.reduce((sum, d) => sum + d.comments, 0);
    
    console.log('\n📊 Summary:');
    console.log(`  Files documented: ${totalFiles}`);
    console.log(`  Total JSDoc blocks: ${totalComments}`);
    console.log(`  Average docs per file: ${(totalComments / totalFiles).toFixed(1)}`);
  }
}

// Run if called directly
if (require.main === module) {
  const generator = new DocGenerator();
  generator.generateAll();
}

module.exports = { DocGenerator };
