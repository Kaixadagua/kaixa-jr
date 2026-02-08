// NOTE: Configuração carregada em 07/02/2026, 22:50:24
// Esta classe gerencia todas as configurações do sistema
/**
 * Kaixa Jr Configuration Loader
 * Loads configuration from environment variables
 * 
 * @module src/core/config
 */

const fs = require('fs');
const path = require('path');

/**
 * Configuration manager for Kaixa Jr
 * @class Config
 */
class Config {
  constructor() {
    this.values = {};
    this.load();
  }
  
  /**
   * Load configuration from environment and .env file
   * @method load
   */
  load() {
    // Try to load .env file if exists
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      envContent.split('\n').forEach(line => {
        const match = line.match(/^([^#=]+)=(.*)$/);
        if (match) {
          const [, key, value] = match;
          process.env[key.trim()] = value.trim();
        }
      });
    }
    
    // Set default values
    this.values = {
      // OpenClaw
      gatewayUrl: process.env.OPENCLAW_GATEWAY_URL || 'http://localhost:8080',
      gatewayToken: process.env.OPENCLAW_GATEWAY_TOKEN,
      
      // GitHub
      githubToken: process.env.GITHUB_TOKEN,
      githubUsername: process.env.GITHUB_USERNAME || 'kaixadagua',
      
      // Telegram
      telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
      telegramChatId: process.env.TELEGRAM_CHAT_ID,
      
      // Repositories
      repoWorkspace: process.env.REPO_WORKSPACE || 'C:\\Users\\joaov\\.openclaw\\workspace',
      repoAgentCorp: process.env.REPO_AGENTCORP || 'C:\\Users\\joaov\\github\\AgentCorp',
      repoAurahub: process.env.REPO_AURA_HUB || 'aura-io-saas/aurahub',
      
      // Backpressure
      backpressureRed: parseInt(process.env.BACKPRESSURE_RED) || 9,
      backpressureYellow: parseInt(process.env.BACKPRESSURE_YELLOW) || 6,
      
      // Intervals (convert to ms)
      intervalGuardian: (parseInt(process.env.INTERVAL_GUARDIAN) || 5) * 60 * 1000,
      intervalReport: (parseInt(process.env.INTERVAL_REPORT) || 35) * 60 * 1000,
      
      // Agent
      agentName: process.env.AGENT_NAME || 'Kaixa Jr',
      agentEmoji: process.env.AGENT_EMOJI || '🦊',
      agentMaxConcurrent: parseInt(process.env.AGENT_MAX_CONCURRENT) || 1,
      
      // Logging
      logLevel: process.env.LOG_LEVEL || 'info',
      logRetentionDays: parseInt(process.env.LOG_RETENTION_DAYS) || 30,
      
      // Environment
      nodeEnv: process.env.NODE_ENV || 'development',
      isDevelopment: process.env.NODE_ENV === 'development',
      isProduction: process.env.NODE_ENV === 'production'
    };
  }
  
  /**
   * Get configuration value
   * @method get
   * @param {string} key - Configuration key
   * @param {*} defaultValue - Default value if not found
   * @returns {*} Configuration value
   */
  get(key, defaultValue = null) {
    return this.values[key] !== undefined ? this.values[key] : defaultValue;
  }
  
  /**
   * Set configuration value
   * @method set
   * @param {string} key - Configuration key
   * @param {*} value - Value to set
   */
  set(key, value) {
    this.values[key] = value;
  }
  
  /**
   * Get all configuration values
   * @method getAll
   * @returns {Object} All configuration values
   */
  getAll() {
    return { ...this.values };
  }
  
  /**
   * Check if required configuration is present
   * @method validate
   * @returns {Object} Validation result
   */
  validate() {
    const required = ['gatewayToken', 'githubToken'];
    const missing = required.filter(key => !this.values[key]);
    
    return {
      valid: missing.length === 0,
      missing,
      message: missing.length > 0 
        ? `Missing required config: ${missing.join(', ')}`
        : 'All required configuration present'
    };
  }
  
  /**
   * Log current configuration (masked for sensitive values)
   * @method logConfig
   */
  logConfig() {
    const masked = { ...this.values };
    
    // Mask sensitive values
    ['gatewayToken', 'githubToken', 'telegramBotToken'].forEach(key => {
      if (masked[key]) {
        masked[key] = '***';
      }
    });
    
    console.log('⚙️ Configuration loaded:');
    Object.entries(masked).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
  }
}

// Singleton instance
let instance = null;

function getConfig() {
  if (!instance) {
    instance = new Config();
  }
  return instance;
}

module.exports = { Config, getConfig };

// If run directly, show config
if (require.main === module) {
  const config = getConfig();
  config.logConfig();
  
  const validation = config.validate();
  console.log(`\nValidation: ${validation.message}`);
  
  process.exit(validation.valid ? 0 : 1);
}
