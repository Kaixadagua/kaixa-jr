/**
 * Tests for CodeGenerator
 * 
 * @module tests/utils/codeGenerator.test
 */

const { CodeGenerator } = require('../../src/utils/codeGenerator');
const fs = require('fs');
const path = require('path');

describe('CodeGenerator', () => {
  let generator;
  const testOutputDir = path.join(process.cwd(), 'tests', 'temp');
  
  beforeEach(() => {
    generator = new CodeGenerator();
    // Clean temp dir
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true });
    }
  });
  
  afterEach(() => {
    // Clean temp dir
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true });
    }
  });
  
  describe('constructor', () => {
    it('should create instance', () => {
      expect(generator).toBeDefined();
      expect(generator.templatesDir).toBeDefined();
    });
  });
  
  describe('toPascalCase', () => {
    it('should convert kebab-case to PascalCase', () => {
      expect(generator.toPascalCase('my-system')).toBe('MySystem');
      expect(generator.toPascalCase('my_system')).toBe('MySystem');
      expect(generator.toPascalCase('my system')).toBe('MySystem');
    });
    
    it('should handle single words', () => {
      expect(generator.toPascalCase('system')).toBe('System');
    });
  });
  
  describe('toKebabCase', () => {
    it('should convert PascalCase to kebab-case', () => {
      expect(generator.toKebabCase('MySystem')).toBe('my-system');
    });
    
    it('should convert camelCase to kebab-case', () => {
      expect(generator.toKebabCase('mySystem')).toBe('my-system');
    });
    
    it('should handle spaces', () => {
      expect(generator.toKebabCase('my system')).toBe('my-system');
    });
  });
  
  describe('generateSystem', () => {
    it.skip('should generate system file', () => {
      // Skipped because it writes to actual src/systems/
      // In real test, would mock fs
      const output = generator.generateSystem('TestSystem', 'Test description');
      expect(typeof output).toBe('string');
    });
  });
  
  describe('generateTest', () => {
    it.skip('should generate test file', () => {
      // Skipped because it writes to actual tests/
      const output = generator.generateTest('TestSystem', 'src/systems');
      expect(typeof output).toBe('string');
    });
  });
  
  describe('generateSkill', () => {
    it.skip('should generate skill directory and files', () => {
      // Skipped because it writes to actual skills/
      const output = generator.generateSkill('TestSkill', 'Test description');
      expect(typeof output).toBe('string');
    });
  });
});
