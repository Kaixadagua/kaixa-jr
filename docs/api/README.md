# Kaixa Jr API Reference

## Core Modules

### Config

Configuration management system.

```javascript
const { getConfig } = require('./src/core/config');
const config = getConfig();
```

#### Methods

##### `get(key, defaultValue)`
Get configuration value.

```javascript
const agentName = config.get('agentName'); // 'Kaixa Jr'
const custom = config.get('customKey', 'default');
```

##### `set(key, value)`
Set configuration value.

```javascript
config.set('customKey', 'customValue');
```

##### `getAll()`
Get all configuration values.

```javascript
const all = config.getAll();
```

##### `validate()`
Validate required configuration.

```javascript
const validation = config.validate();
// { valid: true, missing: [], message: '...' }
```

---

### Logger

Professional logging system.

```javascript
const { getLogger } = require('./src/core/logger');
const logger = getLogger();
```

#### Methods

##### `debug(message, meta)`
Log debug message.

```javascript
logger.debug('Debug info', { context: 'test' });
```

##### `info(message, meta)`
Log info message.

```javascript
logger.info('System started');
```

##### `warn(message, meta)`
Log warning message.

```javascript
logger.warn('Low memory', { usage: '85%' });
```

##### `error(message, meta)`
Log error message.

```javascript
logger.error('Connection failed', { error: err });
```

##### `fatal(message, meta)`
Log fatal message.

```javascript
logger.fatal('System crash', { stack: err.stack });
```

##### `emoji(emoji, message, meta)`
Log with emoji prefix.

```javascript
logger.emoji('🦊', 'Kaixa Jr ready');
```

#### Log Levels

- `DEBUG` (0) - Detailed debugging
- `INFO` (1) - General information
- `WARN` (2) - Warnings
- `ERROR` (3) - Errors
- `FATAL` (4) - Critical errors

---

## Systems

### Guardian

Anti-crash protection system.

**Location:** `scripts/health/kaixa-guardian.js`

```bash
npm run health
```

Monitors:
- Memory usage
- Session health
- State backups
- Log rotation

### Reporter

Status reporting system.

**Location:** `scripts/reports/kaixa-report-35min.js`

```bash
npm run report
```

Generates reports every 35 minutes.

---

## Usage Examples

### Basic Setup

```javascript
const { getConfig, getLogger } = require('./src/core');

const config = getConfig();
const logger = getLogger();

// Validate configuration
const validation = config.validate();
if (!validation.valid) {
  logger.error('Invalid configuration', validation);
  process.exit(1);
}

logger.info(`${config.get('agentName')} started`);
```

### Configuration Override

```javascript
const { getConfig } = require('./src/core/config');

const config = getConfig();

// Override for specific operation
config.set('logLevel', 'debug');

// ... do work ...

// Restore original
config.set('logLevel', 'info');
```

### Error Handling with Logger

```javascript
const { getLogger } = require('./src/core/logger');
const logger = getLogger();

async function riskyOperation() {
  try {
    // ... operation ...
    logger.info('Operation successful');
  } catch (error) {
    logger.error('Operation failed', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}
```

---

*API Reference version: 1.0.0*
