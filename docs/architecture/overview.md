# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Kaixa Jr Agent                        │
├─────────────────────────────────────────────────────────┤
│  Core Layer                                             │
│  ├── Session Manager                                    │
│  ├── Task Executor                                      │
│  └── Decision Engine                                    │
├─────────────────────────────────────────────────────────┤
│  Systems Layer                                          │
│  ├── 🛡️ Guardian (Health Monitoring)                   │
│  ├── 📊 Reporter (Metrics & Reporting)                  │
│  ├── 🔄 Sync (Git & Repository)                         │
│  └── 📈 Tracker (Improvement Tracking)                  │
├─────────────────────────────────────────────────────────┤
│  Integration Layer                                      │
│  ├── OpenClaw Gateway                                   │
│  ├── GitHub API                                         │
│  └── Notification Channels                              │
└─────────────────────────────────────────────────────────┘
```

## Data Flow

1. **Cron Trigger** → Every 5/10/35 minutes
2. **Health Check** → Guardian validates system state
3. **Decision** → Core decides next action
4. **Execution** → Task is performed
5. **Tracking** → Improvement is logged
6. **Report** → Status is communicated

## Key Components

### Guardian System
Monitors:
- Memory usage (alert at >400k tokens)
- Session health
- State backups
- Log rotation

### Reporter System
Generates:
- Health reports every 35 minutes
- Improvement summaries
- Backpressure status
- Performance metrics

### Sync System
Manages:
- Git operations
- Branch cleanup
- Repository sync
- Conflict resolution

---

*Architecture version: 1.0.0*
