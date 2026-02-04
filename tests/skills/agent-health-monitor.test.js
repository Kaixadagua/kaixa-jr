/**
 * Tests for Agent Health Monitor skill
 * 
 * @module tests/skills/agent-health-monitor.test
 */

const { 
  getActiveSessions, 
  calculateHealth, 
  generateReport,
  generateRecommendations 
} = require('../../skills/agent-health-monitor');

describe('AgentHealthMonitor', () => {
  describe('getActiveSessions', () => {
    it('should return array', () => {
      const sessions = getActiveSessions();
      expect(Array.isArray(sessions)).toBe(true);
    });
  });
  
  describe('calculateHealth', () => {
    it('should calculate metrics for empty sessions', () => {
      const health = calculateHealth([]);
      expect(health.total).toBe(0);
      expect(health.active).toBe(0);
      expect(health.inactive).toBe(0);
      expect(health.status).toBe('healthy');
    });
    
    it('should identify active sessions', () => {
      const now = new Date().toISOString();
      const sessions = [
        { lastActive: now, tokens: 1000 },
        { lastActive: now, tokens: 2000 }
      ];
      const health = calculateHealth(sessions);
      expect(health.active).toBe(2);
      expect(health.totalTokens).toBe(3000);
    });
  });
  
  describe('generateRecommendations', () => {
    it('should recommend cleanup for inactive sessions', () => {
      const health = {
        inactive: 2,
        totalTokens: 100000,
        total: 3
      };
      const recs = generateRecommendations(health);
      expect(recs.length).toBeGreaterThan(0);
      expect(recs[0].type).toBe('cleanup');
    });
    
    it('should recommend memory flush for high tokens', () => {
      const health = {
        inactive: 0,
        totalTokens: 350000,
        total: 1
      };
      const recs = generateRecommendations(health);
      const memoryRec = recs.find(r => r.type === 'memory');
      expect(memoryRec).toBeDefined();
    });
  });
  
  describe('generateReport', () => {
    it('should return complete report', () => {
      const report = generateReport();
      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('sessions');
      expect(report).toHaveProperty('metrics');
      expect(report).toHaveProperty('recommendations');
    });
  });
});
