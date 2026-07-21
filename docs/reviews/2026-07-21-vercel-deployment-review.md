# Vercel deployment review — 2026-07-21

Review type: release-candidate deployment and shared-canvas review

Review date/time/timezone: 2026-07-21 23:20 CEST (Europe/Brussels)

Rules checked date/time/timezone: 2026-07-21 CEST

Reviewer(s): Codex technical verification

Commit SHA/tag: current working tree based on `3f1d556`; release commit still required

Deployment URL: https://plank-as-one.vercel.app

Vercel deployment ID: `dpl_AQPRQcvM9YrDNEDTjw4LRg4YDzAe`

## Result

P0 PASS:

- The stable public URL returns HTTP 200 for the main journey and guided-demo route.
- Required public Supabase configuration is present in Vercel's production environment without exposing secret or service-role credentials.
- Production HTML contains the expected application title and configured public Supabase endpoint; production-only output does not render pose-development controls.
- The favicon, sprite PNG, and adjacent sprite annotation JSON are publicly reachable.
- The configured shared canvas returned 247 authoritative cells.
- A reproducible smoke test created two independent anonymous clients, verified one atomic reservation winner and one collision, observed the pending reservation through realtime, released it, and observed the available state. Final result: `PASS ... for cell 31`.
- `npm test` passed 37 tests; `npm run check` reported zero errors and warnings; `npm run build` completed with `@sveltejs/adapter-vercel` 6.3.4 and Node.js 22 runtime.

P0 FAIL: none in the automated deployment and shared-backend scope.

P0 BLOCKED:

- A visual end-to-end check in two independent browser profiles could not be performed in this review environment because no interactive browser instance was available.

P1 findings:

- GitHub automatic deployment is not connected because the Vercel account has no GitHub login connection. Production deployment through the authenticated Vercel CLI is working; reconnect GitHub if automatic deploys are desired.
- The current deployment originates from an uncommitted working tree. Create and record the final release commit before submission.

Evidence reviewed:

- Vercel production deployment inspection: ready, production target, three generated functions in `iad1`.
- HTTP checks for `/`, `/?demo=1`, `/favicon.svg`, a sprite PNG, and its adjacent annotation JSON.
- Production bundle inspection for injected public Supabase configuration and absence of development-only pose controls.
- `npm test`, `npm run check`, `npm run build`, and `npm run stage:vercel-output`.
- `npm run verify:shared` against the production Supabase project.

Required actions, owner, deadline:

- Project team, before submission: open the stable URL in a normal and private/different browser profile; reserve in one, confirm pending in the other, release and confirm available, then complete the representative guided or honor journey.
- Project team, before submission: create the final release commit and record its SHA with the deployment and video.
- Project team, through 2026-08-05 17:00 PDT: keep the Vercel URL and Supabase project freely accessible.

Decision: **GO for the public deployment and automated shared-canvas behavior, conditional on the manual visual cross-browser check.** This is not an overall final-submission GO; the video, Session ID, release commit, and entrant-owned gates remain separate.

Representative approval: pending final release approval.
