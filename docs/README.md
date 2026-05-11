# Show Portal - Project Documentation

This folder is the **persistent memory layer** for AI-assisted development sessions.

Claude Code (and similar AI tools) do not reliably persist memory across sessions. These docs exist so future sessions can rehydrate context from the repository instead of relying on conversation history.

## Purpose

- Preserve architectural continuity between development sessions
- Document the original product intent, feature scope, and implementation patterns
- Prevent drift from established architecture and conventions
- Track decisions, status, and open questions durably

## Required reading for every new session

Before editing any code, every Claude Code session should read these files in order:

1. `/docs/session-start.md` - Startup protocol and rehydration checklist
2. `/docs/architecture.md` - System architecture, tech stack, patterns
3. `/docs/dev-rules.md` - Development rules and operating constraints
4. `/docs/current-status.md` - What is built, what is not, what is in progress
5. `/docs/decision-log.md` - Durable project decisions
6. `/docs/open-questions.md` - Unresolved issues, risks, and follow-up items
7. `/docs/feature-specs/` - Per-feature specifications and status

## When to update these docs

These docs **must** be updated whenever:

- Architecture, schema, or permissions change
- A feature is completed or partially completed
- A major product or technical decision is made
- A new risk, bug, or open question is discovered
- A development session ends (see closeout workflow in `dev-rules.md`)

## File index

| File | Purpose |
|------|---------|
| `session-start.md` | Startup protocol for new AI sessions |
| `architecture.md` | System architecture and patterns |
| `dev-rules.md` | Development rules, operating constraints, closeout workflow |
| `current-status.md` | Living status of all features and milestones |
| `ui-port-roadmap.md` | Roadmap for porting the HTML demo UI tab-by-tab onto the existing features |
| `decision-log.md` | Record of durable project decisions |
| `open-questions.md` | Unresolved questions, risks, and concerns |
| `feature-specs/` | Per-feature specifications (one file per vertical slice) |
