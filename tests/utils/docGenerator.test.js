/**
 * Tests for DocGenerator
 * 
 * @module tests/utils/docGenerator.test
 */

const { DocGenerator } = require('../../src/utils/docGenerator');
const fs = require('fs');
const path = require('path');

describe('DocGenerator', () => {
  let generator;
  
  beforeEach(() => {
    generator = new DocGenerator({
      srcDir: path.join(process.cwd(), 'src'),
      outputDir: path.join(process.cwd(), 'tests', 'temp-docs')
    });
  });
  
  afterEach(() => {
    // Clean temp docs
    const tempDir = path.join(process.cwd(), 'tests', 'temp-docs');
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  });
  
  describe('constructor', () => {
    it('should create instance with options', () => {
      expect(generator).toBeDefined();
      expect(generator.srcDir).toContain('src');
      expect(generator.outputDir).toContain('temp-docs');
    });
    
    it('should have default options', () => {
      const defaultGen = new DocGenerator();
      expect(defaultGen.extensions).toContain('.js');
    });
  });
  
  describe('parseComment', () => {
    it('should parse JSDoc comment', () => {
      const comment = `/**
 * Description here
 * @module test
 * @param {string} name - Name param
 * @returns {Object} Result
 */`;
      
      const parsed = generator.parseComment(comment);
      
      expect(parsed.description).toContain('Description here');
      expect(parsed.module).toBe('test');
      expect(parsed.param).toHaveLength(1);
      expect(parsed.returns).toContain('Object');
    });
    
    it('should handle empty comment', () => {
      const comment = '/** */';
      const parsed = generator.parseComment(comment);
      
      expect(parsed.description).toEqual([]);
    });
  });
  
  describe('parseParam', () => {
    it('should parse @param tag', () => {
      const line = '@param {string} name - The name';
      const param = generator.parseParam(line);
      
      expect(param.type).toBe('string');
      expect(param.name).toBe('name');
      expect(param.description).toBe('The name');
    });
    
    it('should handle malformed param', () => {
      const line = '@param name';
      const param = generator.parseParam(line);
      
      expect(param.type).toBe('any');
      expect(param.name).toBe('unknown');
    });
  });
  
  describe('formatResults', () => {
    it('should format empty results', () => {
      const formatted = generator.formatResults({ query: 'test', total: 0, results: {} });
      expect(formatted).toContain('Nenhum resultado');
    });
    
    it('should format results with items', () => {
      const results = {
        query: 'test',
        total: 2,
        results: {
          employees: [{ title: 'Test', subtitle: 'Desc' }]
        }
      };
      const formatted = generator.formatResults(results);
      expect(formatted).toContain('Resultados');
    });
  });
});
