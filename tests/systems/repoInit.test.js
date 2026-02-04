/**
 * Tests for RepoInit system
 * 
 * @module tests/systems/repoInit.test
 */

const { initRepo, verifyRepo, REQUIRED_DIRS } = require('../../src/systems/repoInit');
const fs = require('fs');
const path = require('path');

describe('RepoInit', () => {
  const testDir = path.join(process.cwd(), 'tests', 'temp-repo');
  
  beforeEach(() => {
    // Mock process.cwd() for testing
    jest.spyOn(process, 'cwd').mockReturnValue(testDir);
    
    // Create temp directory
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });
  
  afterEach(() => {
    // Cleanup
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
    jest.restoreAllMocks();
  });
  
  describe('REQUIRED_DIRS', () => {
    it('should have required directories', () => {
      expect(REQUIRED_DIRS).toContain('src/core');
      expect(REQUIRED_DIRS).toContain('tests/core');
      expect(REQUIRED_DIRS).toContain('scripts/health');
      expect(REQUIRED_DIRS).toContain('docs/architecture');
    });
    
    it('should have at least 10 required directories', () => {
      expect(REQUIRED_DIRS.length).toBeGreaterThanOrEqual(10);
    });
  });
  
  describe('initRepo', () => {
    it('should create missing directories', () => {
      const results = initRepo();
      expect(results.created.length).toBeGreaterThan(0);
    });
    
    it('should report existing directories', () => {
      // Run twice - second time should report existing
      initRepo();
      const results = initRepo();
      expect(results.existing.length).toBeGreaterThan(0);
    });
    
    it('should return summary', () => {
      const results = initRepo();
      expect(results).toHaveProperty('created');
      expect(results).toHaveProperty('existing');
      expect(results).toHaveProperty('errors');
    });
  });
  
  describe('verifyRepo', () => {
    it('should return verification results', () => {
      const result = verifyRepo();
      expect(result).toHaveProperty('complete');
      expect(result).toHaveProperty('present');
      expect(result).toHaveProperty('missing');
      expect(typeof result.complete).toBe('boolean');
    });
    
    it('should detect missing directories', () => {
      const result = verifyRepo();
      if (!result.complete) {
        expect(result.missing.length).toBeGreaterThan(0);
      }
    });
    
    it('should list present directories', () => {
      const result = verifyRepo();
      expect(Array.isArray(result.present)).toBe(true);
    });
  });
});
