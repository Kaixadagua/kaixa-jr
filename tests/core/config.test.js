/**
 * Tests for Config module
 * 
 * @module tests/core/config.test
 */

const { Config } = require('../../src/core/config');
const fs = require('fs');
const path = require('path');

describe('Config', () => {
  let config;
  
  beforeEach(() => {
    // Reset singleton
    jest.resetModules();
    config = new Config();
  });
  
  afterEach(() => {
    // Clean up test env file if created
    const testEnvPath = path.join(process.cwd(), '.env.test');
    if (fs.existsSync(testEnvPath)) {
      fs.unlinkSync(testEnvPath);
    }
  });
  
  describe('load', () => {
    it('should load default values', () => {
      expect(config.get('agentName')).toBe('Kaixa Jr');
      expect(config.get('agentEmoji')).toBe('🦊');
      expect(config.get('logLevel')).toBe('info');
    });
    
    it('should load from environment variables', () => {
      process.env.AGENT_NAME = 'Test Agent';
      process.env.LOG_LEVEL = 'debug';
      
      config = new Config();
      
      expect(config.get('agentName')).toBe('Test Agent');
      expect(config.get('logLevel')).toBe('debug');
      
      // Cleanup
      delete process.env.AGENT_NAME;
      delete process.env.LOG_LEVEL;
    });
  });
  
  describe('get', () => {
    it('should return value for existing key', () => {
      expect(config.get('backpressureRed')).toBe(9);
      expect(config.get('backpressureYellow')).toBe(6);
    });
    
    it('should return default value for non-existing key', () => {
      expect(config.get('nonExisting', 'default')).toBe('default');
    });
    
    it('should return undefined for non-existing key without default', () => {
      expect(config.get('nonExisting')).toBeNull();
    });
  });
  
  describe('set', () => {
    it('should set a value', () => {
      config.set('testKey', 'testValue');
      expect(config.get('testKey')).toBe('testValue');
    });
    
    it('should overwrite existing value', () => {
      config.set('agentName', 'New Name');
      expect(config.get('agentName')).toBe('New Name');
    });
  });
  
  describe('getAll', () => {
    it('should return all values', () => {
      const all = config.getAll();
      expect(all).toHaveProperty('agentName');
      expect(all).toHaveProperty('logLevel');
      expect(all.agentName).toBe('Kaixa Jr');
    });
    
    it('should return a copy, not reference', () => {
      const all = config.getAll();
      all.agentName = 'Modified';
      expect(config.get('agentName')).toBe('Kaixa Jr');
    });
  });
  
  describe('validate', () => {
    it('should return valid when required keys present', () => {
      process.env.GATEWAY_TOKEN = 'test-token';
      process.env.GITHUB_TOKEN = 'test-token';
      
      config = new Config();
      const validation = config.validate();
      
      expect(validation.valid).toBe(true);
      expect(validation.missing).toHaveLength(0);
      
      delete process.env.GATEWAY_TOKEN;
      delete process.env.GITHUB_TOKEN;
    });
    
    it('should return invalid when required keys missing', () => {
      delete process.env.GATEWAY_TOKEN;
      delete process.env.GITHUB_TOKEN;
      
      config = new Config();
      const validation = config.validate();
      
      expect(validation.valid).toBe(false);
      expect(validation.missing).toContain('gatewayToken');
      expect(validation.missing).toContain('githubToken');
    });
  });
  
  describe('intervals', () => {
    it('should convert minutes to milliseconds', () => {
      process.env.INTERVAL_GUARDIAN = '5';
      process.env.INTERVAL_REPORT = '35';
      
      config = new Config();
      
      expect(config.get('intervalGuardian')).toBe(5 * 60 * 1000);
      expect(config.get('intervalReport')).toBe(35 * 60 * 1000);
      
      delete process.env.INTERVAL_GUARDIAN;
      delete process.env.INTERVAL_REPORT;
    });
  });
});
