# Session Start Protocol

This is the most important file in `/docs`. Every new Claude Code session should begin here.

## Startup checklist

Before editing any files, complete these steps:

1. **Read the docs** (in order):
   - `/docs/architecture.md`
   - `/docs/dev-rules.md`
   - `/docs/current-status.md`
   - `/docs/decision-log.md`
   - `/docs/open-questions.md`
   - The relevant `/docs/feature-specs/*.md` file(s) for the requested work

2. **Read relevant code areas** for the requested task (routes, features, schema, lib files)

3. **Summarize your understanding** before editing:
   - Current architecture relevant to the task
   - Current status of the feature area
   - What the task is asking for
   - What files you expect to touch

4. **Check for conflicts** between the requested work and documented architecture, patterns, or decisions

5. **Confirm scope** with the user before making code changes

6. **Ask before broad changes** — if the task would affect architecture, schema, permissions, or multiple features, flag it first

7. **Do not code until context is confirmed**

## Copy/paste startup prompt

Use this prompt at the start of any Claude Code session:

```
Read /docs/session-start.md first and follow its protocol. Do not edit files until you summarize the current architecture, current status, relevant feature specs, and proposed scope for this session. Also identify any possible conflicts between the requested work and the documented architecture. Then wait for confirmation before making code changes.

Before stopping, update the relevant project docs to reflect this session's work, including what changed, what was tested, what remains incomplete, and any new risks or open questions.
```

## Session closeout

Before ending any development session, update the relevant docs. See the Required Session Closeout section in `/docs/dev-rules.md` for the full closeout workflow.

Required closeout updates:

- `/docs/current-status.md` — what changed, what remains
- The relevant `/docs/feature-specs/*.md` file — updated status, test results, new edge cases
- `/docs/decision-log.md` — if any durable decisions were made
- `/docs/open-questions.md` — if any new risks, bugs, or questions emerged
- Root `README.md` — only if setup instructions, scripts, or environment variables changed
