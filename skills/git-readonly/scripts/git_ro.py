#!/usr/bin/env python3
"""Git read-only helper. Usage: git_ro.py <command> [args]"""
import subprocess, sys, argparse

ALLOWED = {'log', 'show', 'diff', 'status', 'branch', 'tag', 'remote', 'rev-parse'}
BLOCKED = {'push', 'pull', 'fetch', 'commit', 'merge', 'rebase', 'cherry-pick', 'reset', 'checkout', 'switch', 'clone', 'init'}

def run(args):
    cmd = args[0] if args else ''
    if cmd in BLOCKED:
        print(f"ERROR: '{cmd}' is blocked (write operation)", file=sys.stderr)
        sys.exit(1)
    if cmd not in ALLOWED:
        print(f"WARNING: '{cmd}' not in allowed list. Use with caution.", file=sys.stderr)
    
    result = subprocess.run(['git', '--no-pager'] + args, capture_output=True, text=True)
    print(result.stdout, end='')
    if result.stderr:
        print(result.stderr, file=sys.stderr, end='')
    sys.exit(result.returncode)

if __name__ == '__main__':
    run(sys.argv[1:])
