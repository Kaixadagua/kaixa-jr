/**
 * Integration tests for Kaixa Jr
 * 
 * @module tests/integration/kaixa.test
 */

const { getConfig } = require('../../src/core/config');
const { getLogger } = require('../../src/core/logger');

describe('Kaixa Jr Integration', () => {
  describe('Core Systems Integration', () => {
    it('should load configuration', () => {
      const config = getConfig();
      expect(config).toBeDefined();
      expect(config.get('agentName')).toBe('Kaixa Jr');
    });
    
    it('should validate configuration', () => {
      const config = getConfig();
      const validation = config.validate();
      expect(validation).toHaveProperty('valid');
      expect(validation).toHaveProperty('missing');
    });
    
    it('should create logger', () => {
      const logger = getLogger();
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
    });
  });
  
  describe('CLI Integration', () => {
    const { main, COMMANDS } = require('../../bin/kaixa');
    
    it('should have all commands defined', () => {
      expect(COMMANDS).toHaveProperty('status');
      expect(COMMANDS).toHaveProperty('health');
      expect(COMMANDS).toHaveProperty('config');
      expect(COMMANDS).toHaveProperty('skill');
    });
    
    it('should export main function', () => {
      expect(typeof main).toBe('function');
    });
  });
  
  describe('Utils Integration', () => {
    it('should load code generator', () => {
      const { CodeGenerator } = require('../../src/utils/codeGenerator');
      expect(CodeGenerator).toBeDefined();
    });
    
    it('should load doc generator', () => {
      const { DocGenerator } = require('../../src/utils/docGenerator');
      expect(DocGenerator).toBeDefined();
    });
  });
  
  describe('Skills Integration', () => {
    it('should load agent health monitor skill', () => {
      const skill = require('../../skills/agent-health-monitor');
      expect(skill).toHaveProperty('run');
      expect(typeof skill.run).toBe('function');
    });
    
    it('should load git readonly skill', () => {
      const skill = require('../../skills/git-readonly');
      expect(skill).toHaveProperty('run');
      expect(typeof skill.run).toBe('function');
    });
    
    it('should load progressao skill', () => {
      const skill = require('../../skills/progressao-continua');
      expect(skill).toHaveProperty('run');
      expect(typeof skill.run).toBe('function');
    });
  });
});
