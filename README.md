# Plank As One

Plank As One turns a short plank into a shared daily ritual: complete one challenge, earn one pixel, and help reveal a collective artwork. The Build Week prototype combines a focused SvelteKit experience with browser-only MoveNet pose estimation, deterministic form rules, safety guidance, audio cues, and a pixel-reservation state machine.

The current shared artwork spells **OPENAI BUILD WEEK**. With Supabase configured, the shared contribution and active-participant counts update from authoritative snapshots and realtime events. The reset countdown is clock-driven, while streak history is stored in the current browser profile.

**Naming:** **Plank As One** is the product. **OPENAI BUILD WEEK** is the limited-edition artwork currently being revealed on its canvas, not a second product name.

## Who it is for

Plank As One is designed for people who want to build a small daily fitness habit but find solo routines isolating or struggle to judge their form. It combines three forms of motivation:

- A short challenge that can be completed on the participant's schedule.
- Immediate, privacy-conscious form feedback from the participant's own browser.
- A visible contribution to a larger artwork instead of another private badge.

This is general fitness guidance, not medical advice or a guarantee of safe or correct form. The prototype includes a safety notice and pauses camera-validated timing when tracking is lost or a detected correction persists.

## What works today

- Camera mode requests a side-view camera feed only after pixel selection.
- TensorFlow.js MoveNet runs pose estimation in the browser.
- A deterministic rule engine evaluates framing, tracking confidence, hip alignment, shoulder position, elbow angle, knee extension, and neck alignment.
- Temporal smoothing, hysteresis, correction prioritization, and grace timing reduce rapid feedback changes.
- Visual and audio cues communicate corrections without requiring continuous screen attention.
- Honor mode provides a camera-free completion path that is explicitly not camera-validated.
- A production guided demo uses an interactive six-tip walkthrough and deterministic simulated pose states to teach pixel selection, readiness, countdown, correction, recovery, and completion without requesting camera access or changing real progress.
- Safety acknowledgement, pixel reservation, countdown, completion, release, daily progression, and one-completion state are represented by a tested local state machine.
- Successful completion locks the selected pixel for the current browser session and shows a celebration sequence.
- When Supabase is configured, anonymous identity, atomic reservation/renewal/release/commit functions, five-minute reservation expiry, persistent pixels, collision handling, and realtime multi-browser reconciliation replace the local canvas mock. The interface visibly reports `SHARED CANVAS LIVE`.

## Prototype limitations

- Without the two public Supabase environment variables, the canvas runs locally. Browser streak history persists across refreshes in that browser profile but does not synchronize across devices.
- The repository includes the shared-canvas backend migration and client integration, but a deployment cannot claim `SHARED LIVE` until a Supabase project is provisioned and the two-browser verification in `supabase/README.md` passes.
- Streak and progressive target duration remain local prototype values even when the canvas itself is shared. There is no archive or Leader workflow yet.
- The production guided demo is intentionally simulated and does not validate a participant's real pose.
- Pose thresholds have deterministic unit coverage but have not completed broad calibration across people, devices, camera positions, clothing, and lighting conditions.
- The application currently has one participant-facing route rather than the complete introduction, archive, and administration experience described in the product roadmap.

These constraints should remain explicit in the repository, demo video, and Devpost description until the corresponding functionality is implemented and verified.

## Run locally

Requirements:

- Node.js 18 or newer
- npm
- A current desktop or mobile browser
- `localhost` or HTTPS for camera access

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

Camera mode requires `getUserMedia`, WebGL or WebAssembly support, and enough room to show one person's full body from the side. Honor mode remains available when a participant does not want to use a camera.

To run the persistent shared canvas, follow [`supabase/README.md`](./supabase/README.md). The app needs only `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_PUBLISHABLE_KEY`; never place a secret or service-role key in the web environment. When those variables are absent or initial connection fails, the UI states that it is using local mock data.

## Try the journey

1. Read the safety notice and choose whether to continue.
2. Keep **Camera mode** selected or switch to **Honor mode**.
3. Select an outlined pixel in the shared artwork.
4. In Camera mode, allow camera access and follow the framing guidance. The countdown begins only after a stable ready position is detected.
5. Hold the plank for the displayed credited duration. Detected corrections stop credited time and receive a five-second grace period before the session pauses; tracking loss pauses after a 500 ms UI debounce.
6. Complete the challenge to lock the selected pixel for this session, or end the session to release it and retry.

In a development build, **DEV TOOLS** can simulate readiness, valid form, low hips, high hips, tracking loss, and completion. **POSE VISUAL LOG** can also save consented, annotated camera frames and paired JSON diagnostics to a local folder for camera reliability testing. Those controls are intentionally excluded from production builds. See [`docs/POSE_DEBUG_MODE.md`](./docs/POSE_DEBUG_MODE.md) for the capture workflow and privacy requirements.

For a camera-free product walkthrough, choose **VIEW GUIDED DEMO** from the initial safety notice or camera setup, or open `http://localhost:5173/?demo=1` after starting the app. Follow the floating tips to choose an isolated pixel and interact with each simulated workout state. Each tip identifies the walkthrough as a simulation, and exiting restores the participant's prior local state.

## Architecture and privacy

The prototype is a client-side SvelteKit application:

```text
Camera video
    -> TensorFlow.js MoveNet in the browser
    -> normalized landmarks and quality gate
    -> smoothing, feature extraction, and deterministic rules
    -> challenge state machine
    -> visual/audio feedback and local pixel state
```

Application code does not upload or store camera frames or pose keypoints. The camera stream is attached directly to the local video element, processed by MoveNet in the browser, and stopped when the active camera journey ends. Loading TensorFlow.js and its model assets still requires ordinary network requests when they are not already cached.

The optional shared mode uses owner-free public canvas rows plus private reservation/completion rows. Authenticated database functions serialize reservation, renewal, release, expiry, and completion; clients refetch the authoritative snapshot after changes and subscribe to owner-free Postgres updates. No participant identifier, camera state, pose result, or personal timer is present in the public canvas payload. Local mock mode remains the no-configuration fallback.

## Verification

```bash
npm test          # State-machine and pose-engine unit tests
npm run check     # Svelte and TypeScript diagnostics
npm run build     # Production build
npm run preview   # Preview the production build locally
```

The automated suite covers geometry invariants, landmark quality, smoothing continuity, stable side selection, readiness, hip correction, safety ordering, mode locking, countdowns, grace timing, tracking loss, release, completion, and daily progression. Real camera/device testing remains required because synthetic landmarks cannot establish pose-estimation accuracy in real environments.

## How we collaborated with Codex

Codex was used as an active product and engineering collaborator during the Build Week development period. Repository history records the work from product definition through the runnable prototype, including a dedicated `codex/ddev` implementation branch.

Codex accelerated:

- Turning the initial concept into a detailed PRD, user journey, architecture, risk register, and release checklist.
- Challenging ambiguous product rules and making pixel reservation, honor mode, progression, safety, privacy, and tracking-loss behavior explicit.
- Implementing and iterating on the SvelteKit state machine and interactive journey.
- Designing the browser-only MoveNet pipeline, deterministic pose features, smoothing, hysteresis, correction arbitration, and audio feedback.
- Adding focused state and pose-engine tests, running build diagnostics, and reviewing gaps between the product claims and the implemented code.

Human decisions remained decisive:

- The core idea of turning daily plank completions into collective artwork.
- The target audience, Apps for Your Life positioning, visual direction, and pixel-art experience.
- The pixel-first interaction, Camera and Honor modes, two-second progression, and 120-second ceiling.
- Safety posture, health-claim boundaries, privacy requirements, and the decision to keep camera processing on-device.
- Which recommendations to accept, how generated implementation was revised, and whether the final experience is ready to submit or release.

### Required Build Week evidence

Before submission, the team must verify rather than infer the model and session evidence:

- [ ] Confirm that the primary core-implementation thread used GPT-5.6.
- [ ] Run `/feedback` inside that original Codex thread and choose to share the existing session.
- [ ] Copy the returned Session ID into the Devpost submission.
- [ ] Ensure the demo video explains both Codex's contribution and the team's human decisions.
- [ ] Preserve the submitted commit SHA and dated Git/Codex evidence.

Do not replace the required `/feedback` Session ID with a Git commit, pull request, or technical thread URL.

## Project layout

- `apps/web/src/routes/+page.svelte` — participant journey and responsive interface
- `apps/web/src/lib/state.js` — challenge state machine and local pixel rules
- `apps/web/src/lib/pose/` — MoveNet detector, frame scheduler, normalized geometry, smoothing, rules, correction arbitration, framing, and audio feedback
- `apps/web/src/lib/pose/debug-*.js` — development-only annotated pose screenshots, local session export, and capture policy
- `apps/web/src/lib/artwork.js` — OPENAI BUILD WEEK pixel-art mask
- `apps/web/src/lib/shared-canvas.js` — anonymous Supabase client, RPC calls, snapshot loading, and realtime reconciliation
- `apps/web/static/poses/` — ready, correction, celebration, and exhausted character assets
- `apps/web/test/state.test.mjs` — state-machine tests
- `apps/web/test/pose-engine.test.mjs` — deterministic geometry and pose-rule tests
- `docs/PRD.md` — product requirements, architecture, safety constraints, and roadmap
- `docs/BUILD_WEEK_REVIEW_CHECKLIST.md` — submission and compliance review checklist
- `docs/POSE_DEBUG_MODE.md` — consent, capture, output, and visual evidence-review workflow
- `supabase/migrations/` — RLS-protected persistent canvas schema and atomic lifecycle functions
- `ASSET_LICENSES.md` — dependency licenses and visual-asset provenance status

## License

Original project source code and documentation are available under the [MIT License](./LICENSE). Third-party packages, fonts, models, and visual assets remain subject to their own licenses or permissions as recorded in [ASSET_LICENSES.md](./ASSET_LICENSES.md). The MIT software license does not grant rights to unresolved visual assets.

## Submission status

The repository contains a runnable local prototype, an optional persistent/realtime canvas implementation, an MIT software license, and a dependency/asset ledger. A Supabase-backed public judging deployment with two-browser evidence, public YouTube demonstration, verified `/feedback` Session ID, and final entrant asset sign-off are still required before final submission.
