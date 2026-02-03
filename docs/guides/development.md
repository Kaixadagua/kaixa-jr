# Development Guide

## Getting Started

### Environment Setup

1. **Install Node.js** (>= 18)
2. **Clone repository**
3. **Install dependencies**: `npm install`
4. **Configure environment**: Copy `.env.example` to `.env`

### Project Structure

```
workspace/
├── docs/           # Documentation
├── src/            # Source code
│   ├── core/       # Core agent logic
│   ├── systems/    # Sub-systems
│   └── utils/      # Utilities
├── scripts/        # Automation scripts
│   ├── health/     # Health checks
│   ├── reports/    # Reporting
│   └── sync/       # Git operations
├── config/         # Configuration
├── memory/         # Persistent data
├── skills/         # Agent skills
└── tests/          # Tests
```

## Development Workflow

### Adding a New System

1. Create file in `src/systems/`
2. Export class with initialization method
3. Add to main initialization in `src/core/agent.js`
4. Write tests in `tests/systems/`
5. Update documentation

### Writing Scripts

Scripts should:
- Be placed in appropriate `scripts/` subdirectory
- Have JSDoc documentation
- Return exit codes (0 = success)
- Log to console with timestamps

Example:
```javascript
/**
 * Script description
 * @module scripts/category/script-name
 */

function main() {
  console.log(`[${new Date().toISOString()}] Starting...`);
  // Implementation
  console.log(`[${new Date().toISOString()}] Complete`);
  process.exit(0);
}

if (require.main === module) {
  main();
}
```

### Adding Documentation

- Architecture docs → `docs/architecture/`
- Guides → `docs/guides/`
- Decisions → `docs/decisions/` (ADRs)

## Testing

```bash
# Run all tests
npm test

# Run specific test
npm test -- systems/guardian

# Run with coverage
npm run test:coverage
```

## Commit Convention

Format: `[kaixa-YYYYMMDD] Description`

Examples:
- `[kaixa-20260203] Add guardian health checks`
- `[kaixa-20260203] Fix session cleanup bug`

## Code Style

- Use JSDoc for all functions
- Prefer async/await over callbacks
- Use meaningful variable names
- Add error handling

---

*Last updated: 2026-02-03*
