# Subagent Protocol

Read and follow [`SUBAGENT_ROUTING.md`](./SUBAGENT_ROUTING.md) for delegation rules.

The repository-defined agent profiles live in `.agents/`:

- `code-explorer` for broad, read-only repository discovery.
- `quick-implementer` for small, mechanical changes.
- `implementer` for multi-file changes, debugging, and tests.
- `code-reviewer` for independent review of higher-risk changes.
- `commit-pusher` only when the user explicitly requests both commit and push.

Use these exact profile names. The parent agent retains architectural decisions, integration, and final validation. Preserve unrelated user changes, and do not commit or push unless explicitly authorized.

## Build Week Reviews

For OpenAI Build Week architecture, release-candidate, demo, compliance, or final-submission reviews, read and apply [`docs/BUILD_WEEK_REVIEW_CHECKLIST.md`](./docs/BUILD_WEEK_REVIEW_CHECKLIST.md). Treat unresolved `P0` findings as release and submission blockers, recheck the official rules at review time, and record evidence using the checklist's review template.
