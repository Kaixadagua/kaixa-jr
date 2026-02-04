/**
 * Tests for Git Readonly skill
 * 
 * @module tests/skills/git-readonly.test
 */

const {
  getStatus,
  getRecentCommits,
  getBranchInfo,
  isClean,
  getChanges
} = require('../../skills/git-readonly');

describe('GitReadonly', () => {
  describe('getStatus', () => {
    it('should return status object', () => {
      const status = getStatus();
      expect(status).toHaveProperty('branch');
      expect(status).toHaveProperty('clean');
      expect(status).toHaveProperty('changes');
    });
  });
  
  describe('getRecentCommits', () => {
    it('should return array of commits', () => {
      const commits = getRecentCommits(3);
      expect(Array.isArray(commits)).toBe(true);
      expect(commits.length).toBeLessThanOrEqual(3);
    });
    
    it('should have hash and message', () => {
      const commits = getRecentCommits(1);
      if (commits.length > 0) {
        expect(commits[0]).toHaveProperty('hash');
        expect(commits[0]).toHaveProperty('message');
      }
    });
  });
  
  describe('getBranchInfo', () => {
    it('should return branch info', () => {
      const info = getBranchInfo();
      expect(info).toHaveProperty('current');
      expect(info).toHaveProperty('all');
      expect(info).toHaveProperty('local');
      expect(info).toHaveProperty('remote');
    });
  });
  
  describe('isClean', () => {
    it('should return boolean', () => {
      const clean = isClean();
      expect(typeof clean).toBe('boolean');
    });
  });
  
  describe('getChanges', () => {
    it('should return array', () => {
      const changes = getChanges();
      expect(Array.isArray(changes)).toBe(true);
    });
  });
});
