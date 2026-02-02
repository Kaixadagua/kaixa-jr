---
name: git-readonly
description: Safe git read-only operations. Use for log, status, diff, show, branch list. Never use for push, pull, commit, merge, rebase, or any write operation.
metadata:
  { "openclaw": { "emoji": "📜", "requires": { "bins": ["git"] } } }
---

# Git Read-Only

Read git repository state without modifying history or files.

## Allowed Commands

- `git log`: history, authors, dates
- `git show`: commit details, diffs
- `git diff`: uncommitted changes
- `git status`: working tree state
- `git branch -a`: list branches
- `git tag -l`: list tags
- `git remote -v`: list remotes

## Usage Pattern

Always use `--no-pager` to avoid interactive prompts:

```bash
git --no-pager log --oneline -20
```

## Safety Rules

1. Never run: push, pull, fetch, commit, merge, rebase, cherry-pick, reset, checkout, switch
2. Never modify .git/ directly
3. If repo path is ambiguous, ask for confirmation
