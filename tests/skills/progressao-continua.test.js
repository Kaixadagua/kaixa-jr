/**
 * Tests for Progressao Continua skill
 * 
 * @module tests/skills/progressao-continua.test
 */

const {
  getImprovementStats,
  calculateCadence,
  shouldImprove,
  getNextSuggestion
} = require('../../skills/progressao-continua');

describe('ProgressaoContinua', () => {
  describe('getImprovementStats', () => {
    it('should return stats object', () => {
      const stats = getImprovementStats();
      expect(stats).toHaveProperty('count');
      expect(stats).toHaveProperty('files');
      expect(stats).toHaveProperty('byDate');
      expect(stats).toHaveProperty('byType');
    });
    
    it('should have type breakdown', () => {
      const stats = getImprovementStats();
      expect(stats.byType).toHaveProperty('code');
      expect(stats.byType).toHaveProperty('docs');
      expect(stats.byType).toHaveProperty('config');
    });
  });
  
  describe('calculateCadence', () => {
    it('should calculate for single improvement', () => {
      const stats = { byDate: { '2026-02-04': ['file1.md'] } };
      const cadence = calculateCadence(stats);
      expect(cadence.averagePerDay).toBe('1.00');
      expect(cadence.trend).toBe('stable');
    });
    
    it('should calculate trend', () => {
      const stats = {
        byDate: {
          '2026-02-01': ['1'],
          '2026-02-02': ['2'],
          '2026-02-03': ['3', '4', '5', '6']
        }
      };
      const cadence = calculateCadence(stats);
      expect(cadence.totalDays).toBeGreaterThan(0);
    });
  });
  
  describe('shouldImprove', () => {
    it('should return recommendation', () => {
      const result = shouldImprove();
      expect(result).toHaveProperty('shouldImprove');
      expect(result).toHaveProperty('todayCount');
      expect(result).toHaveProperty('target');
      expect(result).toHaveProperty('remaining');
      expect(result).toHaveProperty('message');
    });
  });
  
  describe('getNextSuggestion', () => {
    it('should return suggestion', () => {
      const suggestion = getNextSuggestion();
      expect(suggestion).toHaveProperty('type');
      expect(suggestion).toHaveProperty('count');
      expect(suggestion).toHaveProperty('suggestion');
    });
  });
});
