# Kaixa Jr CLI

Command line interface for Kaixa Jr operations.

## Installation

```bash
npm install -g .
# or
npm link
```

## Usage

```bash
kaixa <command> [options]
```

## Commands

### `kaixa status` (or `kaixa s`)

Show system status including:
- Agent information
- Improvement count
- Configuration status
- Repository paths

```bash
kaixa status
```

### `kaixa health` (or `kaixa h`)

Run health check (same as `npm run health`).

```bash
kaixa health
```

### `kaixa report` (or `kaixa r`)

Generate status report (same as `npm run report`).

```bash
kaixa report
```

### `kaixa improvements` (or `kaixa i`)

Show improvement statistics grouped by date.

```bash
kaixa improvements
```

### `kaixa config [key]` (or `kaixa c`)

Show configuration. If key is provided, shows only that value.

```bash
kaixa config              # Show all config
kaixa config agentName    # Show specific value
```

### `kaixa validate` (or `kaixa v`)

Validate that all required configuration is present.

```bash
kaixa validate
```

### `kaixa generate` (or `kaixa g`)

Generate code from templates.

```bash
# Generate new system module
kaixa generate system MySystem "My system description"

# Generate test file
kaixa generate test MySystem src/systems

# Generate new skill
kaixa generate skill MySkill "My skill description"
```

### `kaixa docs` (or `kaixa d`)

Generate documentation from JSDoc comments.

```bash
kaixa docs
```

### `kaixa version` (or `kaixa -v`)

Show version information.

```bash
kaixa version
```

### `kaixa help` (or `kaixa -h`)

Show help information.

```bash
kaixa help              # Show all commands
kaixa help status       # Show help for specific command
```

## Examples

```bash
# Quick status check
kaixa s

# Run health check
kaixa h

# Show improvements
kaixa i

# Validate config
kaixa v
```

## Exit Codes

- `0` - Success
- `1` - Error or validation failure
