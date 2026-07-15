# The Plank Canvas — Product Requirements Document

| Field | Value |
| --- | --- |
| Status | Reviewed MVP definition draft; unresolved release decisions remain |
| Last updated | 2026-07-15 |
| Target | MVP 1 web application released after its acceptance and safety gates pass |
| Hackathon | OpenAI Build Week, submission deadline 2026-07-21 at 5:00 p.m. PDT |
| Submission review | [Build Week compliance and submission checklist](./BUILD_WEEK_REVIEW_CHECKLIST.md) |

> **Reader guide:** The core product context is visible below. Detailed product rules, architecture, design, testing, roadmap, and appendices are grouped into collapsible panels. Resolve the release-critical decisions in section 16 before a public pilot.

<details open>
<summary><strong>Product context (sections 1–3)</strong> — summary, problem, and vision</summary>


## 1. Product summary

The Plank Canvas is a web application where people participate in a daily progressive plank challenge on their own schedule. Client-side AI camera tracking provides real-time form correction. Each completed session contributes a “pixel” that gradually reveals a shared, community-wide digital artwork.

## 2. Problem statement

Building discipline and maintaining a daily fitness habit is difficult and isolating. People often abandon solo plank routines because they lack:

- Flexible daily accountability.
- An engaging sense of community progress.
- An immediate, visible reward for participating.
- Real-time guidance that helps them exercise safely and effectively.

Today, prospective users commonly follow videos or exercise alone. These approaches provide instruction but little accountability, community connection, or proof that form is correct.

## 3. Product vision

Turn a solitary daily exercise into a flexible collective ritual: every valid plank advances both the participant’s discipline and a piece of art the community creates together.

</details>

<details>
<summary><strong>Product strategy (sections 4–7)</strong> — users, value, goals, measures, and constraints</summary>


## 4. Target users

### 4.1 Aspiring Disciplinarian — primary participant

Wants to build a daily habit but tends to give up when exercising alone. Values completing the challenge at a convenient time while still contributing to a shared outcome.

### 4.2 Form Novice — participant need-state

Needs real-time correction to hold an effective, safer plank and learn correct form.

### 4.3 Leader — community guide

Sets the daily challenge, creates the hidden pixel artwork, and provides daily inspiration to the community.

For MVP 1, the Leader is the internal project team rather than a participant-facing role. The team has sole editorial responsibility for choosing, preparing, scheduling, and publishing each challenge's pixel artwork.

> The relationship between the Aspiring Disciplinarian and Form Novice personas remains to be clarified; they may be overlapping user needs rather than mutually exclusive personas.

## 5. Value proposition

### Asynchronous community achievement

Participants are not required to attend at a fixed time. A successful session permanently reveals part of that day’s hidden artwork, turning an individual workout into collective progress.

### On-device AI form validation

The browser uses TensorFlow.js Pose Detection with MoveNet to estimate the participant’s pose entirely on-device. Browser-side TypeScript rules evaluate the returned keypoints and provide immediate form feedback. When form remains invalid beyond the grace period, the timer pauses. Camera frames and pose keypoints never leave the device.

### Post-MVP live presence

In a future release, when multiple users happen to plank simultaneously, their pixels could pulse or light up, creating spontaneous shared presence without transmitting video. Live presence is not part of MVP 1.

## 6. Goals and proposed success measures

### Product goals

- Help participants establish a consistent daily plank habit.
- Make asynchronous exercise feel communal and consequential.
- Teach participants to maintain better plank form.
- Give Leaders a lightweight way to guide and inspire the community.

### Proposed measures

- **Daily canvas completion rate:** percentage of each day’s artwork revealed by valid sessions.
- **Daily challenge completion rate:** percentage of daily active participants who finish a valid session.
- **Retention and streaks:** participant retention and distribution of consecutive-day streak lengths.
- **Form improvement:** reduction in form-break frequency over repeated sessions, subject to defining a safe and meaningful measurement.
- **Community participation:** activity around proposing or voting on future artwork, postures, or exercises; likely post-MVP.

Numeric product targets and the future public-pilot event allow-list are intentionally deferred until the pilot audience, sample size, and launch envelope are defined. Before the pilot, the team must assign a measurement owner and targets for challenge-start conversion, valid-session completion, pixel-placement completion, and day-seven retention. Those behavioral targets inform product evaluation but never override privacy, safety, or critical reliability gates. The Build Week demo uses no non-essential product analytics; its evidence comes from deterministic tests, the small consenting tester exercise, and documented observations.

## 7. Hard constraints

### Privacy

- Live video frames must never be sent to or stored on a server.
- Pose estimation and form validation must run entirely in the participant's browser.
- Any pose-derived data sent to the server must be explicitly defined, minimized, and disclosed.
- The Build Week demo uses no non-essential analytics. Required product state, security logs, and deployment diagnostics are not repurposed as behavioral analytics.
- A future public pilot may collect first-party product analytics only after explicit opt-in consent. Declining or withdrawing consent does not restrict participation.
- Raw analytics events are retained for no more than 30 days. Analytics never include camera frames, landmarks, angles, pose classifications, health information, or precise device identifiers.

### Platform

- MVP 1 is a responsive web application.
- Native iOS and Android applications are out of scope.

### Delivery and cost

- Delivery is milestone-based rather than constrained to a fixed five-day deadline.
- The Build Week submission remains date-bound. If the public-release safety and acceptance gates have not passed by the submission deadline, the team may submit a controlled demo or preview but must not treat that deadline as authorization for a public release.
- The Build Week deliverable is a controlled judging demo, not the public pilot. It must remain free and accessible to judges for the required judging period, while general public promotion waits until the public-pilot gates pass.
- Submission text and video may claim only behavior available in the judged build; mocked, scripted, degraded, or future behavior must be labelled clearly.
- AI-assisted implementation may accelerate development, but it does not waive privacy, safety, accessibility, browser-compatibility, or test requirements.
- Infrastructure and ongoing operating costs should be kept as low as practical.

### Performance and scale

- The shared canvas must efficiently represent and render potentially thousands of revealed pixels.
- The system must support users loading changing canvas state throughout the day.

</details>

<details>
<summary><strong>MVP definition (sections 8–10)</strong> — confirmed rules, functional scope, and exclusions</summary>


## 8. Confirmed MVP 1 product rules

### 8.1 Daily challenge progression

- A new browser starts with a 30-second target.
- After the participant successfully completes a daily session, their target for the next UTC challenge day increases by five seconds, up to the default 120-second cap.
- An incomplete session does not increase the next target.
- At 120 seconds, automatic progression stops and the participant's next daily target remains 120 seconds.
- The Build Week release and public pilot use 120 seconds as a hard ceiling. Progression beyond 120 seconds and its unlock control are disabled.
- A future release may enable participant-controlled progression beyond 120 seconds only after a separate safety review approves and configures a higher ceiling. If enabled, duration never increases automatically; following each successful day, the participant chooses either `KEEP MY TARGET` or `ADD 5 SECONDS` for the next UTC challenge day.
- A participant may reduce their future target without losing their current streak.
- Acknowledging guidance alone never enables advanced progression; the release must also have a safety-approved higher ceiling and the feature must be explicitly configured on.
- Unlocking, if introduced later, is an informed product choice, not medical clearance or a claim that longer holds are appropriate for every participant.
- Because MVP 1 has no portable account, progression and streak history are tied to the current browser profile.

The unlock screen uses the following approved copy:

> **ADVANCED DURATION**
>
> Longer is not always better. Targets above 120 seconds are optional and are not medical clearance.
>
> Stop immediately if you experience concerning pain, chest pain or pressure, dizziness or faintness, unusual shortness of breath, or a pounding or irregular heartbeat. Seek appropriate medical advice if symptoms persist or if you are unsure whether longer holds are suitable for you.
>
> ☐ I understand and want to unlock targets above 120 seconds.

This copy and its controls are reserved for a future safety-approved release and are not displayed while advanced progression is disabled. If enabled later, the acknowledgment must be selected before `UNLOCK ADVANCED` becomes active. `STAY AT 120 SEC` remains available as the non-primary alternative.

Participants receive unlimited retries until they succeed. Each anonymous browser identity can record exactly one successful completion, one progression increase, and one earned pixel per UTC challenge day.

### 8.2 Form validation

MVP 1 checks:

- Hips too high.
- Hips too low.
- Bent knees.
- Incorrect head position.

Poor form receives a five-second grace period before the timer pauses. Invalid time in the grace window does not count toward the required duration. Returning to valid form clears the grace countdown and resumes accumulation. Thresholds should use hysteresis or smoothing so the timer does not rapidly alternate between valid and invalid states.

Missing or low-confidence required landmarks are tracking loss, not incorrect form. Uncertain time stops counting immediately. A 500 ms debounce suppresses brief UI flicker; if tracking has not recovered when it expires, the interface shows `MOVE INTO FRAME` and the session remains paused. The five-second correction grace period does not apply to tracking loss.

MVP 1 officially supports a left or right side view, including a slight three-quarter angle, with one participant's full body visible. At least one reliable chain of ear, shoulder, hip, knee, and ankle landmarks must meet the configured visibility threshold. The timer remains blocked and the interface provides repositioning guidance for frontal, rear, partial-body, multi-person, or low-confidence views. Broader angle and partial-body support are post-MVP goals, not guarantees.

Landmark-confidence, joint-angle, hysteresis, and smoothing values live in one versioned pose-rule configuration. Each value documents its units and calibration evidence. Configuration changes require updated recorded-landmark fixtures and affected tests in the same change. A completion may include the active configuration version for diagnostics, but never landmarks, angles, per-frame classifications, or camera data.

For Build Week judging, `VIEW GUIDED DEMO` is available from camera setup and from denied, skipped, or unsupported-camera states. It is persistently labelled `DEMO MODE — SIMULATED POSE DATA` and drives the production UI and timer state machine with deterministic pose states. It demonstrates valid form, corrections, grace timing, completion, and pixel placement against an isolated demo challenge. Demo events never change the real canvas, streak, duration, entitlement, or progression, and submission materials must identify simulated segments clearly.

`CONTINUE WITHOUT CAMERA` provides a real honor-mode session for participants unable or unwilling to use a camera. It runs the participant's actual daily target without pose validation or form feedback and persistently displays `FORM NOT CAMERA-VALIDATED`. Honor-mode completion may earn the normal daily streak and pixel. Camera-validated and honor-mode sessions consume the same one-per-challenge completion and pixel entitlement, so a participant cannot complete both on the same day. The completion method is stored as `camera_validated` or `honor`, but contributed pixels look identical. Honor mode uses the same safety guidance and remains distinct from guided demo mode, which never changes real state.

An honor-mode attempt begins after the standard three-second countdown and runs continuously without `PAUSE` or `RESUME` controls. `END SESSION` abandons the attempt without progression, and retries remain unlimited. Switching tabs, backgrounding the browser, locking the device, or navigating away immediately abandons the attempt. On return, the interface shows `SESSION ENDED — KEEP THIS PAGE OPEN DURING HONOR MODE` and offers an immediate retry. The session completes automatically when accumulated active time reaches the participant's daily target. Honor mode never displays form-correction or five-second grace states.

Before entering either real completion path, the participant sees the following approved notice:

> **BEFORE YOU START**
>
> Use a clear, stable exercise space. This application provides general fitness guidance, not medical advice.
>
> Stop immediately if you experience concerning pain, chest pain or pressure, dizziness or faintness, unusual shortness of breath, or a pounding or irregular heartbeat.
>
> If you have a health condition, injury, or concerns about starting or increasing exercise, seek guidance from a qualified health professional.

The notice provides `GO BACK` and `I UNDERSTAND` actions. It applies to camera-validated and honor-mode sessions; guided demo mode does not require acknowledgment because it does not record a real completion. The browser profile stores the acknowledged UTC challenge date and safety-copy version. One acknowledgment covers both real completion modes and all retries for that challenge day. A new UTC challenge day or safety-copy version requires a new acknowledgment.

### 8.3 Browser-only identity

- No registration, email, password, or social login is required.
- MVP 1 uses an automatically created anonymous browser identity.
- Progress is not portable across browsers or devices.
- Clearing site data, using private browsing, or losing the locally stored anonymous session can reset the participant’s identity, streak, duration, and completion history.
- MVP 2 may allow the anonymous identity to be upgraded to a permanent account.

### 8.4 Canvas contribution

- A participant may place a pixel only after completing the day’s required session.
- The main-page primary action reflects the participant’s daily state:
  - Before successful completion: active `START 30 SEC`.
  - After completion but before placement: active `PLACE YOUR PIXEL`.
  - After successful placement: disabled `YOUR PIXEL IS LIVE`.
- The canvas uses an effectively unbounded coordinate space rather than a fixed participant capacity.
- The Leader’s prepared pixel-art image is displayed at low opacity as the shared target.
- Participants place earned pixels over the target artwork.
- A pixel placed over the target automatically uses the color defined by the artwork at that coordinate.
- Occupied coordinates cannot be overwritten. Pixel placement must claim an empty coordinate atomically so simultaneous participants cannot take the same position.
- Placement mode displays `SELECTING A CELL PLACES YOUR PIXEL IMMEDIATELY` before the participant interacts with the canvas. Clicking or tapping an available cell, or activating the focused cell with the keyboard, immediately submits the permanent placement; there is no confirmation dialog or second action.
- A collision or network failure returns the participant to placement mode and does not consume the earned-pixel entitlement. Only a successful atomic transaction makes the placement permanent and changes the primary action to `YOUR PIXEL IS LIVE`.
- After the target artwork has been filled, subsequent participants may place pixels elsewhere on the canvas.
- Previous daily canvases are accessible from an archive tab.

For pixels placed outside the target after its completion, MVP 1 uses one Leader-defined fallback color for the challenge, defaulting to the product accent orange. Participants cannot select or override this color. The Leader chooses it before publishing, it appears in the challenge preview, and it becomes immutable after the challenge's first pixel is placed.

### 8.5 Leader workflow

For MVP 1, the project team acts as the sole Leader and decides which prepared pixel artwork is used for each challenge. An authorized project-team administrator can:

- Choose and upload the prepared pixel-art image.
- Enter the daily challenge settings, including the post-target fallback color.
- Schedule or publish the daily challenge.
- Soft-remove a placed pixel after confirming the action and entering a moderation reason.

The Leader signs in through a Supabase magic link. Access is restricted to an allow-list of administrator email addresses.

Soft removal hides the pixel, reopens its coordinate, and records the reason, moderator, and timestamp in a private audit record. The original participant's completion and daily pixel entitlement remain consumed, preventing repeated replacement attempts that day. Participant identity and moderation metadata are never shown publicly. MVP 1 provides a simple `REPORT A CANVAS CONCERN` contact route; an automated participant-reporting workflow is out of scope.

Uploaded artwork is limited to a `64 × 64` logical pixel grid for MVP 1. Transparent source pixels are not placement targets. Larger images must be rejected or deliberately downsampled during the Leader preview rather than silently changing their meaning.

An in-app pixel-art editor is out of scope.

### 8.6 Challenge day and reset

MVP 1 uses one global challenge for the whole community, following the global daily-game model:

- A challenge day is keyed by its UTC calendar date.
- The challenge changes at `00:00 UTC` for every participant simultaneously.
- The interface displays a countdown and the reset time converted to the participant’s local timezone.
- Daylight-saving changes do not alter the UTC boundary.
- The previous challenge becomes read-only and remains available in the archive.
- Leaders should publish challenges in advance; selecting the active challenge by UTC date avoids requiring a scheduled reset job.

### 8.7 First-visit introduction

- A new browser identity sees a one-time, scroll-driven pixel-art introduction before the standard participant journey.
- The introduction is optional: `SKIP INTRO` is visible from the beginning, and `REPLAY INTRO` remains available from the menu.
- Completing or skipping the introduction stores an `intro_seen_version` flag in the current browser profile. Clearing browser data can cause it to appear again.
- The introduction never requests camera access and does not load TensorFlow.js.
- The final scene transitions into today's canvas and its normal `START 30 SEC` action.
- The television scene uses an original runner-and-followers asset for MVP and the public pilot. Film footage, film-derived characters or scenes, soundtrack audio, logos, costume replication, and actor likenesses are excluded even if a licensing opportunity becomes available during MVP development.
- Health-related captions must use evidence-reviewed, non-medical language and must not promise that one plank session treats or prevents disease.

## 9. MVP 1 functional scope

### Participant experience

Before the standard daily journey, a first-time participant can view or skip the pixel-art introduction and can replay it later from the menu.

1. View today’s challenge and current shared canvas.
2. Receive a transparent anonymous browser identity without registration.
3. See the required duration, local reset time, and basic local streak, and acknowledge the shared safety notice before entering a real camera or honor-mode session.
4. Grant camera permission and receive local-only pose detection.
5. Receive camera-placement guidance until the required landmarks are visible.
6. Optionally enter the clearly labelled guided demo without camera access; simulated results remain isolated from real participant state.
7. Alternatively choose the real honor mode without camera validation; it can consume the same daily completion and pixel entitlement as the camera flow.
8. Start the timer once a valid plank is detected.
9. See which form rule is failing and a five-second correction countdown.
10. Stop crediting time immediately when required landmarks are lost, show `MOVE INTO FRAME` after the 500 ms UI debounce, or pause after visible incorrect form continues beyond the five-second grace period.
11. Retry a failed or abandoned session.
12. Complete one qualifying daily session.
13. Return to the main canvas, where `PLACE YOUR PIXEL` replaces `START 30 SEC`.
14. Choose an available canvas coordinate and place one earned pixel.
15. See the selected cell become live and the disabled action change to `YOUR PIXEL IS LIVE`.
16. See new community pixels without reloading the page.
17. Browse previous read-only canvases.

### Responsive and browser experience

1. Use the full participant flow on phone, tablet, laptop, or desktop layouts.
2. Support current evergreen Chrome, Edge, Firefox, and Safari on desktop and mobile where the required camera, WebAssembly, and browser APIs are available.
3. Provide touch, pointer, and keyboard interaction for canvas placement and navigation.
4. Detect unsupported capabilities before the session starts and explain the exact missing requirement.
5. Preserve canvas viewing, archives, informational pages, and the isolated guided demo even when pose tracking is unavailable.
6. Require a secure HTTPS context for deployed camera use.

“Works everywhere” is treated as a broad compatibility goal, not a promise for obsolete browsers, embedded webviews, devices without usable cameras, or platforms lacking required APIs. The launch acceptance matrix must include at least Android Chrome, iOS Safari, macOS Safari/Chrome, and Windows Chrome/Edge/Firefox.

### Leader experience

1. Access a protected administration route.
2. Choose and upload a small prepared pixel-art image with transparent-background support.
3. Enter the challenge date and settings.
4. Preview the low-opacity canvas target.
5. Publish or schedule the challenge.

Live-presence animation is excluded from MVP 1. Realtime is used for completed pixel placements only.

## 10. Explicitly out of scope for MVP 1

- Native mobile applications.
- Sending, streaming, or storing camera footage.
- Additional exercises or postures unless required for the initial pilot.
- Participant artwork proposals, submissions, and community voting. The internal project team selects all MVP 1 artwork.
- Social feeds, direct messaging, and video communication.
- An in-app pixel-art editor.
- Licensed or unlicensed film clips, film-derived scenes or characters, soundtrack recordings, celebrity likenesses, recognizable costume replication, and branded movie assets in the first-visit introduction. Any licensing initiative is a separate post-MVP project.
- A long-form cinematic intro with voice-over, complex character animation, or photorealistic video. MVP 1 is a concise pixel-art sequence built from reusable sprites and transitions.
- Cross-device streak synchronization.
- Strong proof that a client-reported session was genuinely completed.
- Live pulsing or visualization of users who are currently planking.
- Scope not expressly accepted in this PRD.

</details>

<details>
<summary><strong>Architecture and risk (sections 11–13)</strong> — stack, implementation requirements, security, privacy, and early validation</summary>


## 11. Recommended technical approach

### 11.0 Confirmed production stack

- **Application:** SvelteKit with TypeScript.
- **AI/ML:** TensorFlow.js Pose Detection running in the participant’s browser.
- **Artwork renderer:** PixiJS v8 with pixi-viewport v6.
- **Backend:** Supabase Postgres, Auth, Storage, database functions, and Row Level Security.
- **Realtime:** Supabase Realtime Broadcast.
- **Hosting:** Vercel for SvelteKit and hosted Supabase for backend services.

### 11.1 Monorepo layout

```text
plank-as-one/
  apps/
    web/                 # SvelteKit participant and Leader application
  packages/
    pose-engine/         # Browser-only TensorFlow.js adapter and form rules
    canvas-engine/       # PixiJS artwork renderer and coordinate logic
  supabase/
    migrations/          # Schema, functions, triggers, and RLS policies
    seed.sql              # Local/test data
  tools/
    pose-lab/            # Optional offline fixtures/analysis; never production
  docs/
    PRD.md
```

The production system contains no Python pose service. If the AI/ML team uses Python for offline experiments, it remains under `tools/pose-lab` and operates only on explicitly consented test fixtures. Validated thresholds are implemented and tested in the TypeScript `pose-engine` package. No camera frame is sent from the web application to Python or any server.

### 11.2 Web and pose processing

- Use SvelteKit with TypeScript.
- Use `@tensorflow-models/pose-detection` with TensorFlow.js in the browser.
- Use MoveNet `SINGLEPOSE_LIGHTNING` for MVP 1 because only one participant is expected and latency is more important than multi-person detection.
- Register the TensorFlow.js WebGL backend as the default and keep the WASM backend as a compatibility fallback.
- Load TensorFlow.js, the backend, and the model only on the session route; do not include them in the main-page bundle.
- Enable MoveNet temporal smoothing and establish explicit minimum keypoint-confidence thresholds through device testing.
- Throttle inference to the rate required for stable feedback rather than processing every camera frame. Start testing around 20–30 inferences per second and reduce the rate on slower devices.
- Consider a Web Worker only after measuring the target browsers; worker transfer and camera-frame plumbing are not required for the first implementation.
- Calculate joint angles, visibility checks, smoothing, the form state machine, and the session timer entirely in the browser.
- Do not transmit raw frames, screenshots, landmarks, or per-frame angles in MVP 1.
- Send only the final business event needed to claim a completion, such as challenge ID, anonymous user ID from the access token, target duration, completion timestamp, completion method, and the active pose-rule configuration version when camera validation was used.
- Dispose of the detector and TensorFlow tensors, stop camera tracks, and release associated resources when the session route is left.
- Suspend or destroy the PixiJS renderer while the TensorFlow session is active so both systems do not compete unnecessarily for WebGL contexts, GPU memory, and battery.

### 11.3 Data, identity, and realtime updates

- Use Supabase Auth anonymous sign-ins. This requires no PII or registration while providing a stable UUID, an authenticated database role, RLS, and a future path to link a permanent identity.
- Use Postgres as the source of truth for challenges, artworks, anonymous progression, completions, and placed pixels.
- Enable Row Level Security on every exposed table.
- Enforce one completion and one pixel entitlement per anonymous user and challenge with database uniqueness constraints, not only UI checks.
- Store uploaded source artwork in Supabase Storage.
- Use database functions/RPCs for completion claims and pixel placement so entitlement consumption, collision checks, and pixel insertion occur atomically.
- Load an initial canvas snapshot over the Supabase Data API, then subscribe to a private, challenge-specific Supabase Realtime Broadcast channel for new pixel placements.
- Treat Postgres as authoritative after reconnect: refetch changes or the current viewport instead of assuming that every realtime event was received.
- Emit authoritative placement events from the database only after the atomic placement transaction succeeds. Participant clients must not be able to publish authoritative pixel events.
- Authorize private Broadcast subscriptions with RLS policies on `realtime.messages`, scoped to the challenge topic.
- Broadcast compact pixel events containing only challenge ID, integer coordinates, color, and server timestamp.
- Do not use Presence in MVP 1.

### 11.4 Artwork rendering

Use **PixiJS v8** as the artwork renderer and **pixi-viewport v6** as its 2D camera. Use PixiJS directly rather than a Svelte wrapper so lifecycle, version compatibility, and performance remain under team control.

Rationale:

- PixiJS uses GPU-accelerated WebGL/WebGL2 in production and batches simple sprites/graphics efficiently.
- pixi-viewport v6 supports PixiJS v8 and supplies mouse drag, touch drag, pinch zoom, wheel zoom, and deceleration.
- The retained scene graph supports the target outline, completed pixels, selection cursor, and short realtime animations without building a full editor.
- Konva is better suited to manipulating many independent editable shapes; that scene-graph overhead is not needed because MVP participants select one logical grid coordinate rather than edit artwork objects.
- A hand-written Canvas 2D implementation would minimize dependencies but would require the team to build and maintain zoom, pan, transforms, pointer mapping, culling, and interaction behavior before validating the core product.

Implementation requirements:

- Initialize PixiJS only in the browser from a Svelte component after mount; never initialize it during server-side rendering.
- Use PixiJS’s stable WebGL renderer for MVP 1. Do not enable WebGPU in production while its cross-browser behavior remains experimental.
- Configure `antialias: false`, align transforms to device pixels, and use integer world coordinates so square cells remain crisp.
- Use pixi-viewport for drag, pinch, wheel, and deceleration, but clamp zoom to readable and selectable cell sizes.
- Organize the scene into target-outline, completed-pixel, placement-preview, and transient-animation layers.
- Batch cells by state/color instead of creating an interactive event target for every square.
- Convert the pointer's world position mathematically into integer grid coordinates. Validate availability against local state, then submit the selected coordinate atomically to Supabase without an intermediate confirmation dialog.
- Store pixels as integer `x`, `y`, `color`, `challenge_id`, and anonymous `owner_id` values, with private soft-removal metadata for moderation.
- Enforce uniqueness for active pixels on `(challenge_id, x, y)` so overwriting is impossible while a soft-removed coordinate can be claimed again.
- Perform Leader moderation through an authorized database function that atomically soft-removes the pixel, records the moderator, reason, and timestamp, and emits an authoritative removal event. Removal never restores or creates a participant entitlement.
- Partition large canvases into logical chunks and fetch/render only chunks intersecting the current viewport.
- Enable PixiJS culling or equivalent application-level chunk culling when substantial content lies offscreen.
- Stop the PixiJS ticker and render on demand while the canvas is static. Temporarily animate only new-pixel and completion effects to reduce battery use.
- Destroy the PixiJS application, viewport listeners, textures, and subscriptions when the component unmounts.

Compatibility and accessibility:

- If WebGL initialization fails, provide a non-interactive Canvas 2D or server-generated image snapshot so the artwork and archives remain viewable. Pixel placement may be disabled with a clear capability message in this fallback.
- Canvas content is not inherently accessible. Mirror the important state in DOM text, expose completion counts and focused coordinates to assistive technology, and provide keyboard controls for moving the placement cursor and directly placing at the focused cell.

### 11.5 Hosting

- Deploy SvelteKit to Vercel using the official Vercel adapter.
- Use hosted Supabase for Postgres, Auth, Storage, and Realtime.
- Do not deploy a Python or separate AI inference service for MVP 1. It would add hosting, integration, latency, and privacy complexity without being needed in the production flow.

## 12. Security, privacy, and integrity position

- Camera access requires explicit browser permission and a clear “processed only on this device” explanation.
- The camera stream is stopped when the participant leaves or completes the session.
- No video frames or derived pose stream are persisted or transmitted.
- Client-side completion claims can be forged by a motivated user. MVP 1 treats the product as a cooperative habit experience, not a competition or source of prizes.
- Server constraints can prevent ordinary duplicate claims but cannot cryptographically prove correct form without adding a trusted execution or server-verification model.
- Anonymous sign-in endpoints require abuse protection and rate limiting before a public launch.
- Pixel owner identifiers and moderation audit records remain private to authorized Leaders and are excluded from public canvas, archive, and realtime payloads.
- Analytics collection is disabled by default. A future pilot must present a clear accept/decline choice before emitting any non-essential event, honor withdrawal prospectively, and test that declining has no functional effect.
- Future analytics use an explicit event allow-list and a maximum 30-day raw-event retention policy. Camera and pose data, health information, free text, and stable fingerprinting identifiers are prohibited fields.
- Fitness guidance must include an appropriate safety notice and avoid medical claims.

## 13. Risks requiring early validation

- Browser pose estimation may behave inconsistently across devices, lighting, clothing, camera angles, and body types.
- Incorrect form feedback can frustrate users or create false confidence; the product must avoid presenting itself as medical advice.
- Camera permission friction may sharply reduce challenge starts.
- Canvas mechanics may fail if participation and artwork size are poorly matched.
- Authentication and anti-abuse requirements may expand MVP scope substantially if not minimized.
- “Live” presence introduces real-time infrastructure and privacy questions that may not justify MVP complexity.
- Hips, knees, and head position cannot all be judged from arbitrary angles or when their required landmarks are outside the frame.
- An unbounded canvas needs collision rules and a viewport strategy even if participant capacity is unlimited.
- Progression beyond 120 seconds could expose participants to targets that are unsafe, impractical, or impossible for them; it remains disabled unless a later safety review approves a higher ceiling, validates the guidance, and authorizes release.
- Browser-only identity means streak loss is expected when site storage is cleared or a different device is used.
- TensorFlow.js and PixiJS both use GPU resources; their lifecycles must not overlap unnecessarily on constrained devices.
- A PixiJS/WebGL canvas requires a DOM accessibility layer and a view-only fallback when GPU initialization is unavailable.
- A mandatory or lengthy introduction can delay the core action and reduce first-session conversion; it must be immediately skippable and measured separately from challenge starts.
- Film-derived imagery creates intellectual-property, brand, schedule, and maintenance risk. MVP and the public pilot use only the original runner-and-followers scene; any later licensing initiative requires a separate scope and review.
- BDNF, blood-pressure, arterial-stiffness, cardiac-health, and rehabilitation statements have different evidence bases and are not all plank-specific. Overstated captions could become misleading health claims.

</details>

<details>
<summary><strong>Experience design (section 14)</strong> — visual direction, primary journey, introduction, accessibility, and health-claim treatment</summary>


## 14. Design direction

### 14.1 Visual foundation supplied by the team

The supplied concept establishes the preferred visual language:

- Warm cream-to-peach background with a soft central glow.
- Bright coral-orange as the primary action and completion color.
- Artwork made from small square cells with narrow spacing.
- Empty target cells shown as extremely light outlines.
- Large typographic artwork integrated into the canvas rather than placed in a conventional card.
- Pixel-style interface typography using **Pixelify Sans** across headings, labels, timers, buttons, and supporting copy. The production web application should load the actual font rather than approximate it.
- A minimal top-right menu control. The main page does not show a persistent “PERFECT FORM” heading; form status appears only during camera setup and the active session.
- Generous whitespace and almost no container chrome.

The design should preserve this restraint. New features should appear as light overlays, edge controls, compact status strips, or temporary bottom sheets rather than a dashboard of opaque cards.

### 14.2 Proposed adaptation A — Canvas Monument

Use the supplied composition as the home screen almost unchanged. The shared artwork remains the dominant object. Add:

- A compact top status row containing current target, streak, and local reset countdown.
- A small archive/menu control in the top-right corner.
- A bottom-centered primary action: `START 30 SEC` before completion, `PLACE YOUR PIXEL` after completion, or disabled `YOUR PIXEL IS LIVE` after placement.
- A subtle completion count beneath the canvas.

Best for emotional impact and fidelity to the supplied design. Less information is immediately visible, so secondary features live in sheets or the menu.

### 14.3 Proposed adaptation B — Ritual Split

On wide screens, place the artwork in roughly two-thirds of the viewport and a narrow ritual rail in the remaining third. The rail contains target duration, streak, reset countdown, privacy note, and the primary action. On mobile, the rail becomes a bottom sheet beneath the canvas.

Best balance of clarity and visual character. This is the recommended production direction because it scales cleanly from desktop to mobile without covering the art.

### 14.4 Proposed adaptation C — Immersive Session

During exercise, replace the canvas with the local camera view while retaining the same background, pixel vocabulary, and Pixelify Sans typography. Show:

- A large pixel timer.
- A thin landmark skeleton or joint markers.
- The current state: `GET IN FRAME`, `PERFECT FORM`, `FIX HIPS`, `STRAIGHTEN KNEES`, `LIFT HEAD`, or `PAUSED`.
- A five-cell grace indicator that empties once per invalid second.
- A persistent local-processing badge.

After completion, morph the timer cells into the participant’s earned pixel and transition directly into placement mode.

### 14.5 Supporting screens

- **Camera setup:** illustrated framing guide, permission explanation, device-local privacy promise, and readiness checks.
- **Pixel placement:** zoomed target, up-front immediate-placement notice, earned pixel attached to the pointer or focused keyboard cell, automatic target color, occupied-cell feedback, direct click/tap/keyboard placement, submitting state, and realtime celebration. No placement confirmation dialog is shown.
- **Archive:** date-grouped thumbnail grid using the same outlined-pixel treatment; selecting a day opens a read-only canvas.
- **Leader:** restrained utility layout for magic-link access, 64 × 64 upload/preview, date, challenge settings, validation errors, and publish state.
- **Unsupported device:** capability checklist with viewing/archive access preserved.

### 14.6 Accessibility requirements

- Coral and pale outline colors must meet appropriate contrast when they communicate status; color alone cannot indicate valid or invalid form.
- All form feedback must have text and optional audio/haptic equivalents where supported.
- Respect reduced-motion preferences for pixel pulses, transitions, and completion effects.
- Provide keyboard-operable pixel placement and visible focus treatment.
- Offer a mirrored camera preview without mirroring pose-coordinate calculations incorrectly.
- Keep controls reachable and labels readable at mobile sizes and high zoom.

### 14.7 Primary desktop journey

The MVP’s principal journey should read as one continuous ritual:

1. **Today’s canvas:** the participant arrives on a desktop main page dominated by the partially completed `PLANK AS ONE` artwork. Filled coral squares show community contributions and pale outlined squares show remaining targets. The page also shows a seven-day streak, local reset countdown, archive/menu access, and `START 30 SEC`. It does not show `PERFECT FORM` at the top.
2. **Ready position:** after selecting `START 30 SEC`, the participant sees the local camera area represented in the design as a pixel-art person and framing guide. The interface waits until the required landmarks are visible and the participant is ready to enter a plank.
3. **Three-second countdown:** once readiness is confirmed, the interface shows a clear `3`, `2`, `1` countdown with optional sound. The timer has not started yet.
4. **Active plank:** the participant is shown in a pixel-art plank pose with local pose landmarks and a `00:00 / 00:30` progress timer. Form states and the five-second grace indicator appear here when needed.
5. **Earned pixel on the main page:** after 30 valid seconds, the participant returns to the same main page. `START 30 SEC` has been replaced by the active `PLACE YOUR PIXEL` button. Selecting it enables placement mode and shows that choosing a cell places the pixel immediately. Clicking, tapping, or keyboard-activating an unoccupied outlined target directly submits the placement with no confirmation step. The pixel automatically takes that target coordinate's artwork color.
6. **Pixel live:** after the placement transaction succeeds, the selected cell is filled and visible on the shared canvas. The primary button becomes disabled and reads `YOUR PIXEL IS LIVE`. The participant cannot place another pixel or restart the daily session until the next UTC challenge.

Transitions should visually connect the stages: the start button becomes the countdown, the countdown becomes the timer, and the completed timer resolves into the earned pixel.

### 14.8 First-visit pixel-art introduction

#### Experience goal

The introduction explains the product emotionally before it explains it functionally: maintaining discipline alone is difficult, but a visible group can turn an individual effort into a shared ritual. It appears only on the first visit, is controlled by scrolling, targets approximately 30–45 seconds at a normal pace, and ends on today's interactive canvas. No chapter imposes a forced wait, and `SKIP INTRO` remains visible from the beginning.

#### Story sequence

1. **Struggle alone:** an original pixel-art protagonist attempts a plank in a quiet room. Their arms shake, the form indicator degrades, and they lower themselves to the floor. The scene communicates effort and frustration without mocking failure.
2. **A social spark:** while still on the ground after the first attempt, the figure looks toward a television. The screen shows an original lone runner who gradually attracts a group of runners. The scene conveys social momentum without recreating or referencing a recognizable film character, actor, costume, composition, or branded asset.
3. **Try again:** inspired by the group, the protagonist plants their elbows, resets their posture, and begins a new plank with visibly calmer form.
4. **Effort becomes company:** square pixels fall from above, gather around them, and assemble into other people holding planks. Each figure should form from the same cell language used by the shared artwork.
5. **Benefits appear:** as the camera pulls upward, short evidence-reviewed captions appear between the growing groups. Captions remain secondary to the story and never interrupt scrolling.
6. **The collective image:** the camera continues to zoom out until the protagonist and the surrounding participants resolve into the pixel letterforms `PLANK AS ONE`.
7. **Invitation:** one final empty cell pulses in the artwork. The copy reads `ONE PLANK. ONE PIXEL. ONE CANVAS.` and transitions to today's main page with `START 30 SEC`.

The sequence must remain understandable without sound and uses no voice-over. If audio is implemented, use original ambient/chiptune music with simple sound effects, muted by default, and provide a persistent sound toggle. Audio remains optional and cannot block or delay the core introduction.

The MVP protagonist is an original, gender-neutral pixel-art character with no celebrity likeness or participant customization. The surrounding group uses varied skin tones, body proportions, clothing, and silhouettes without relying on gender, cultural, fitness, or body-type stereotypes. All figures remain stylized and consistent with the shared pixel-cell visual language.

#### Health-claim treatment

The intro is motivational product storytelling, not medical education. Its benefit captions describe the intended effect of a **consistent, progressively trained habit over time**, not the result of one 30-second session. Progression means a gradual increase after successful days; it must not suggest that longer is always safer or that users should ignore pain, fatigue, recovery needs, or professional advice.

The proposed benefits must be adjusted as follows before appearing in production:

| Proposed idea | Permitted MVP wording | Limitation |
| --- | --- | --- |
| BDNF | Exclude from the intro animation. An optional evidence page may state: `RESEARCH LINKS SOME FORMS OF INTENSE EXERCISE TO TEMPORARY CHANGES IN CIRCULATING BDNF. WHETHER PLANKS HAVE THIS EFFECT HAS NOT BEEN ESTABLISHED.` | No direct study establishes that a standalone plank increases BDNF. Findings from other exercise protocols, circulating BDNF measurements, or animal models must not be presented as proof of increased BDNF in the human brain or of cognitive benefit from this product. |
| Mental resilience | `PRACTICE SHOWING UP. BUILD A RESILIENT HABIT.` | Resilience is framed as practiced persistence and adherence. Do not claim that BDNF directly creates discipline, motivation, or mental toughness. |
| Reducing blood pressure | Exclude from the intro animation. Qualified discussion may appear on an optional evidence page after clinical/content review. | Evidence concerns repeated isometric training protocols. Do not imply one session lowers blood pressure or replaces treatment. |
| Reducing arterial stiffness | Exclude from the intro animation. Qualified discussion may appear on an optional evidence page after clinical/content review. | Evidence is emerging, population-dependent, and not specific to a daily 30-second plank. |
| Improving cardiac health | Replace with `BUILD A CONSISTENT MOVEMENT HABIT`. | `Improves cardiac health` is too broad and causal for this product experience. |
| Strengthening without joint movement | `BUILD STRENGTH WHILE HOLDING STILL` | A plank is isometric but still loads joints; `joint-free` or `no joint stress` would be inaccurate. |
| Injury recovery | Exclude from the intro animation. | Suitability depends on the injury and professional guidance. The application must not prescribe rehabilitation. |
| Core benefit | `BUILD CORE MUSCULAR ENDURANCE` | Avoid guarantees about pain, posture correction, or injury prevention. |

The approved animation caption set is:

- `BUILD CORE MUSCULAR ENDURANCE`
- `BUILD STRENGTH WHILE HOLDING STILL`
- `BUILD A CONSISTENT MOVEMENT HABIT`
- `PRACTICE SHOWING UP. BUILD A RESILIENT HABIT.`

Use only these four benefit captions in the animation. Prefix or visually group them under `WITH CONSISTENT TRAINING` so they cannot be mistaken for immediate outcomes. Include a discreet `GENERAL FITNESS INFORMATION — NOT MEDICAL ADVICE` link or label and retain the safety notice before camera use.

#### Recommended implementation

- Implement a dedicated `/intro` route containing a fixed, full-viewport PixiJS canvas behind semantic scrolling chapters in the DOM.
- Use approximately seven scroll chapters. Map normalized scroll progress to a deterministic animation timeline rather than starting independent animations that can drift or become impossible to reverse.
- Build the protagonist, runner silhouettes, varied plank participants, furniture, television, and letters from a shared pixel-art sprite atlas. Reuse modular parts and deliberately approved variations rather than creating diversity only through simple tinting.
- Keep the original television runner in its own named sprite and asset bundle for maintainability, testing, and independent optimization; MVP and public-pilot code do not include a film-asset substitution path.
- Render falling squares and followers in batches. Limit particles, cap device pixel ratio on constrained devices, pause when the tab is hidden, and destroy the PixiJS scene when leaving the route.
- Keep scene captions, `SKIP INTRO`, audio controls, and the final action as DOM elements above the canvas so they remain selectable, translatable, and accessible.
- Store `intro_seen_version` locally after completion or skip. Route returning participants directly to today's canvas, while keeping `REPLAY INTRO` in the menu.
- Preload only the first scene, then fetch the remaining sprite atlas while it plays. Do not load TensorFlow.js, camera code, Supabase realtime, or the full interactive canvas during the intro.
- Target a compressed intro asset budget below 2 MB for MVP 1 and a stable 30 frames per second on the minimum supported mobile device; 60 frames per second is an enhancement.
- Build every chapter first as a static Storybook story. Add the scroll-linked timeline only after the composition, copy, and reduced-motion sequence are approved.

#### Accessibility and fallback

- `SKIP INTRO` must be keyboard-accessible and visible immediately; the sequence must never trap scrolling or focus.
- With `prefers-reduced-motion`, replace continuous scrolling animation with a short series of static pixel-art panels and a `CONTINUE` action.
- Provide meaningful chapter text outside the canvas for screen readers and hide decorative sprites from the accessibility tree.
- Preserve the narrative at narrow viewport sizes by changing composition and scale, not by cropping captions or controls.
- If PixiJS or WebGL initialization fails, show the same static-panel fallback and continue to today's canvas.

#### MVP boundary and measurement

For MVP 1, begin with limited sprite poses, crossfades, camera transforms, and batched pixel effects. Frame-by-frame character acting and bespoke original music remain optional enhancements after the core sequence is validated; voice-over and film-derived content are excluded. The Build Week demo does not emit intro analytics. A later consenting public pilot may allow-list privacy-safe events such as intro shown, skipped, completed, replayed, and challenge started after intro, then compare skip and completion rates to determine whether the sequence helps or delays participation.

</details>

<details>
<summary><strong>Quality and validation (section 15)</strong> — Storybook catalogue, automated tests, integration contracts, and release gates</summary>


## 15. Testing strategy

### 15.1 Frontend-first development with Storybook

The frontend team will begin with **Storybook for SvelteKit** and deterministic mock data before connecting screens to Supabase or TensorFlow.js. Storybook is the executable catalogue of the product states defined in this PRD: each meaningful state must be reviewable independently, without a camera, live database, network connection, or a particular challenge day.

This approach allows the two frontend developers to build and review the complete participant journey while the backend and AI/ML contracts are still being implemented. Stories must use the same production Svelte components, design tokens, Pixelify Sans font, responsive rules, and accessibility behavior as the application.

Recommended setup:

- Use `@storybook/sveltekit` inside `apps/web` and keep Storybook configuration in `apps/web/.storybook`.
- Keep reusable, typed fixtures in `apps/web/src/lib/mocks`. Fixtures must conform to the same TypeScript interfaces used by production repositories and stores.
- Put Supabase, realtime, browser identity, clock, camera, and pose detection behind small injected interfaces. Stories replace these interfaces with deterministic fakes rather than importing or mocking Supabase internals.
- Use Mock Service Worker only where a component genuinely performs an HTTP request, such as artwork loading. Prefer injected fake repositories for application state and a controllable fake realtime client for pixel events.
- Use a fake clock and fixed UTC challenge timestamps so reset countdown, streak, archive date, and midnight rollover stories do not depend on the developer's current time or timezone.
- Use a fake pose adapter that emits scripted landmark visibility and form states. TensorFlow.js and the real camera must not run in ordinary component stories.
- Add Storybook controls for useful state transitions, but keep named stories for every acceptance-critical state so they can run deterministically in CI.

### 15.2 Required story catalogue

At minimum, Storybook must expose the following desktop states before backend integration:

| Area | Required stories |
| --- | --- |
| First-visit intro | Each of the seven static chapters, first visit, returning visit bypass, skip, replay, completed transition, muted audio, reduced motion, narrow viewport, asset failure, and WebGL fallback. |
| Today's canvas | Loading, load failure with retry, partial artwork with `START 30 SEC`, completed session with `PLACE YOUR PIXEL`, placed pixel with disabled `YOUR PIXEL IS LIVE`, fully completed target with placement outside the artwork, reset imminent, and disconnected/reconnecting. |
| Camera setup | Shared safety notice, acknowledged notice, same-day retry bypass, new UTC day, changed safety-copy version, permission explanation, permission denied, unsupported camera, model loading, model failure, move into frame, insufficient visible landmarks, and ready. |
| Countdown | `3`, `2`, `1`, cancelled because the pose was lost, and transition to the active timer. |
| Active plank | Valid form, hips too high, hips too low, bent knees, incorrect head position, each second of the five-second grace period, brief tracking loss recovered inside 500 ms, persistent tracking loss with `MOVE INTO FRAME`, paused timer, recovered form, abandoned session, and completion. |
| Guided demo | Entry from camera setup, permission denied, unsupported camera, persistent simulated-data label, scripted valid and invalid form, isolated completion, isolated pixel placement, and exit to real participant state. |
| Honor mode | Shared safety notice, entry without camera, persistent `FORM NOT CAMERA-VALIDATED` label, countdown, continuous timer with no pause control, `END SESSION`, tab switch, browser background, device lock, navigation away, ended-session message, retry, automatic completion, shared-entitlement conflict, earned pixel, and return to camera setup. |
| Pixel placement | Placement available with immediate-placement notice, pointer/focused-keyboard preview, occupied target, direct selection, submitting without a confirmation dialog, collision conflict, network failure with retry and preserved entitlement, successful placement, and a remote realtime pixel arriving. |
| Archive | Loading, empty archive, populated archive, selected historical canvas, and load failure. |
| Leader | Signed out, upload idle, invalid image, valid 64 x 64 preview, challenge settings, validation failure, publishing, published, pixel selected for moderation, removal confirmation, missing reason, removal failure, and removal success. |
| Shared UI | Menu open, reduced motion, keyboard focus, long translated copy tolerance, narrow viewport, and WebGL artwork fallback. |

The six primary desktop journey stories listed in section 14.7 are the first review milestone and should match the approved presentation: today's canvas, ready position, countdown, active plank, earned pixel, and pixel live.

### 15.3 Automated frontend tests

Storybook is the primary component and screen-state harness, but it is one layer of the test strategy:

- **Static checks:** TypeScript checking, Svelte checking, formatting, and linting.
- **Unit tests:** Vitest tests for first-visit/replay routing, scroll-progress timeline mapping, countdown logic, UTC challenge-day and versioned safety-acknowledgment calculations, duration progression, honor-mode continuous timing and page-visibility abandonment, form-grace state machine, tracking-loss debounce, canvas coordinate conversion, and UI reducers/stores. If analytics are introduced for a later pilot, add consent, withdrawal, event allow-list, and prohibited-field tests before enabling collection.
- **Story tests:** Storybook's Vitest integration runs render and interaction tests against acceptance-critical stories. Test keyboard and pointer flows for starting, cancelling, retrying, and direct pixel placement, including the absence of a second confirmation action.
- **Accessibility checks:** Run Storybook accessibility checks on all primary stories. Critical violations fail CI.
- **Visual regression:** Capture stable desktop snapshots for the six primary journey states. Dynamic timestamps, animation, random pixel locations, and realtime events must be frozen for deterministic comparisons.
- **End-to-end tests:** Keep a small Playwright suite for the integrated camera happy path, the real honor-mode happy path and page-hide abandonment, the isolated guided-demo happy path, Leader soft removal, and critical failures against a local or preview Supabase environment. Assert that camera and honor modes share one entitlement, demo completion and placement never mutate real participant or canvas state, and moderation reopens the coordinate without restoring the removed participant's entitlement. Do not duplicate the entire Storybook state matrix in E2E tests.
- **Pose-engine tests:** Test form classification, the five-second grace state machine, and immediate time exclusion plus the 500 ms tracking-loss debounce separately with recorded landmark fixtures. Manual camera/device testing remains required because mocked stories cannot validate real pose-estimation accuracy.

### 15.4 Integration contracts and mock-data rules

- Frontend mocks must be derived from documented domain types, not ad hoc shapes created inside individual stories.
- Completion contracts and fixtures include `completion_method` and, for camera-validated sessions, the pose-rule configuration version, but no landmarks, angles, per-frame classifications, or camera data.
- The frontend and backend teams must agree early on challenge, artwork, completion, placement, archive, and realtime-event contracts. Contract changes update production types, fixtures, and affected stories in the same pull request.
- Fixture builders must provide sensible defaults and accept explicit overrides, making edge cases readable without duplicating large data objects.
- Story data must contain no real camera frames, personal information, Supabase credentials, or production URLs.
- Realtime stories must replay explicit events and support duplicate, delayed, conflicting, and out-of-order pixel updates.
- A story must never require a running backend unless it is clearly labelled as an integration story and excluded from the deterministic component-test job.

### 15.5 MVP 1 test gates

A frontend feature is ready for integration when its required stories exist, acceptance-critical interactions pass, keyboard operation is demonstrated, and loading, empty, failure, and success states are represented. MVP 1 is ready for the pilot when:

- The Storybook production build succeeds in CI.
- First-visit, skip, replay, reduced-motion, asset-failure, and returning-user intro stories pass.
- All primary journey stories pass interaction and accessibility checks.
- Visual baselines for the intro's key chapters and the six desktop journey states have been reviewed by the team.
- Unit tests cover UTC reset, progression, grace timing, placement entitlement, and collision handling.
- The integrated Playwright happy path passes against the preview environment.
- Manual tests cover the supported browser/device matrix, actual camera permissions, pose accuracy, WebGL fallback, reconnect behavior, and UTC rollover.
- No test or story transmits camera frames or pose streams outside the browser.
- Build Week builds emit no non-essential analytics, and future-pilot analytics tests prove that no event is emitted before opt-in or after withdrawal and that prohibited fields are rejected.

### 15.6 Build Week pose-demo acceptance

Before the Build Week demonstration is recorded, test the supported pose flow with three or four consenting adults across at least three representative device/browser combinations. Each tester covers left-side, right-side, and slight three-quarter views; typical and weaker indoor lighting; valid form; every supported form error; and tracking loss. Across the small group, include varied body proportions and clothing conditions such as loose or dark clothing.

A human reviewer labels the expected state without relying on the application's result. Any systematic failure or sustained false-valid classification blocks an unqualified demonstration claim for the affected view or environment. Camera recordings or reusable landmark fixtures are retained only under separate, explicit fixture consent. This demo exercise is not clinical validation or evidence of accuracy for every person.

The larger tester sample, device matrix, quantitative pass criteria, and diversity protocol required for a public pilot remain to be approved separately.

</details>

## 16. Open decisions

### Must resolve before a public pilot

- **Pose calibration and public-pilot acceptance:** calibrate the exact landmark-visibility and joint-angle thresholds and form-rule smoothing window from the confirmed demo protocol, then approve the larger tester sample, device matrix, quantitative pass criteria, and diversity protocol required for a public pilot.
- **Public-pilot launch envelope:** define the later pilot audience, expected concurrency, minimum supported browser/device matrix, measurable pass criteria, and approval date independently of the Build Week judging demo.
- **Release ownership:** assign deployment, rollback, incident response, and final release authorization.

### May resolve during implementation or pilot planning

- Future public-pilot analytics event allow-list, measurement owner, and numeric success targets, intentionally deferred until the pilot audience, sample size, and launch envelope are defined. Consent is opt-in and raw-event retention is capped at 30 days.

<details>
<summary><strong>Delivery roadmap (section 17)</strong> — eight dependency- and evidence-gated milestones</summary>


## 17. Implementation roadmap

Development follows dependency and evidence milestones rather than calendar days. AI assistance can implement, test, review, and iterate across the repository, while the team retains product decisions, visual approval, pose-safety judgment, credential ownership, and release authorization.

### Milestone 1 — foundations and contracts

- Scaffold the monorepo, SvelteKit application, shared packages, Supabase project structure, CI, preview deployments, and environment handling.
- Configure Storybook for SvelteKit and establish design tokens, Pixelify Sans, accessibility defaults, typed domain interfaces, fixture builders, and injected service boundaries.
- Define contracts for challenge loading, anonymous identity, progression, completions, artwork, placement, archive data, realtime events, camera state, and pose state.
- Define the Supabase schema, migrations, storage policies, database functions, uniqueness constraints, Row Level Security, and anonymous-authentication baseline.

**Exit gate:** the repository builds in CI, Storybook runs without production services, migrations apply cleanly, and frontend fixtures conform to shared contracts.

### Milestone 2 — high-risk technical prototypes

- Prove camera permission, TensorFlow.js MoveNet loading, WebGL/WASM backend selection, landmark visibility, cleanup, and one side-view plank rule on representative devices.
- Prove PixiJS initialization, crisp pixel rendering, pan/zoom, keyboard selection, coordinate mapping, culling, and graceful WebGL failure.
- Prove anonymous Supabase access, atomic completion and placement functions, RLS behavior, initial canvas loading, and compact realtime pixel events.
- Prototype the intro's scroll-to-timeline mapping, sprite batching, reduced-motion path, asset budget, and minimum-device performance.

**Exit gate:** each risky subsystem has a tested prototype and recorded evidence supporting the production approach; unresolved failures update scope or compatibility requirements before feature implementation continues.

### Milestone 3 — mock-driven product experience

- Build the seven static intro chapters and every participant, placement, archive, Leader, loading, empty, error, offline, and fallback state in Storybook.
- Approve the six primary desktop journey states and responsive adaptations before connecting production services.
- Add interaction, accessibility, and visual-regression tests for acceptance-critical stories.
- Freeze the approved component contracts so backend, pose-engine, canvas-engine, and frontend integration can proceed independently.

**Exit gate:** the complete MVP experience can be reviewed with deterministic mocks, primary interactions pass, and the team has approved the visual and content direction.

### Milestone 4 — private pose session

- Implement camera setup, required-landmark guidance, countdown, session lifecycle, timer, retries, abandonment, and completion transition.
- Implement hips-high, hips-low, bent-knee, and head-position rules with confidence thresholds, smoothing, hysteresis, the five-second form-grace state machine, and the separate 500 ms tracking-loss UI debounce.
- Add landmark-fixture tests, resource-cleanup tests, permission and model-failure handling, and manual testing across representative bodies, cameras, lighting, clothing, and supported browsers.
- Verify through instrumentation and network inspection that frames, landmarks, angles, and pose streams never leave the browser.

**Exit gate:** valid form time is accumulated correctly, invalid time never counts, privacy requirements hold, and the supported device matrix meets the agreed pose-quality threshold.

### Milestone 5 — shared canvas and daily progression

- Implement UTC challenge selection, local reset display, anonymous progression, streaks, completion claims, and pixel entitlement.
- Implement PixiJS artwork loading, target outline, completed pixels, pan/zoom, pointer and keyboard placement, fallback color, occupied-cell feedback, and accessibility mirror.
- Integrate atomic placement, collision recovery, realtime updates, reconnect reconciliation, large-canvas chunking, and render-on-demand behavior.
- Add the archive and read-only historical canvases.

**Exit gate:** one successful session produces one entitlement, one entitlement produces at most one permanent pixel, collisions cannot overwrite pixels, and all clients converge on authoritative canvas state.

### Milestone 6 — Leader workflow

- Implement allow-listed magic-link access, prepared artwork upload, 64 × 64 validation, preview, challenge settings, scheduling, publishing, and actionable error states.
- Verify Storage policies, Leader authorization, invalid-file handling, transparent-pixel behavior, and UTC challenge activation.

**Exit gate:** only allow-listed project-team Leaders can publish a valid challenge, and a published challenge appears correctly to anonymous participants and in the archive.

### Milestone 7 — first-visit introduction

- Assemble the approved static chapters into the scroll-linked PixiJS timeline.
- Add skip, replay, first-visit versioning, the original runner-and-followers television asset, muted audio controls, narrow-layout composition, reduced motion, and static WebGL fallback.
- Validate evidence-reviewed benefit wording, safety language, asset licensing status, load performance, and the transition into today's canvas.

**Exit gate:** the intro remains optional, accessible, performant, legally cleared, and does not load or request camera access before the participant starts a session.

### Milestone 8 — integration, hardening, and pilot release

- Run the full CI suite, Storybook tests, unit tests, migration tests, security checks, and focused Playwright journeys against a preview Supabase environment.
- Test representative phones and laptops, camera denial, missing landmarks, slow model loading, WebGL failure, UTC rollover, collision races, reconnects, offline recovery, cleared browser storage, and degraded performance.
- Review privacy and safety copy, accessibility, analytics minimization, rate limits, operating cost, error monitoring, backup/rollback procedures, and deployment ownership.
- Conduct a limited pilot, inspect failures and form-feedback quality, resolve launch-blocking defects, and expand availability only after the release gates pass.

**Exit gate:** every test gate in section 15.5 passes, no unresolved critical privacy or safety issue remains, and the team explicitly authorizes release.

</details>

<details>
<summary><strong>Appendices (sections 18–19)</strong> — technical references and decision log</summary>


## 18. Technical references

- [TensorFlow.js Pose Detection models](https://github.com/tensorflow/tfjs-models/tree/master/pose-detection)
- [TensorFlow.js MoveNet](https://github.com/tensorflow/tfjs-models/tree/master/pose-detection/src/movenet)
- [PixiJS v8 documentation](https://pixijs.com/8.x/guides)
- [PixiJS performance guidance](https://pixijs.com/8.x/guides/concepts/performance-tips)
- [pixi-viewport](https://github.com/pixijs-userland/pixi-viewport)
- [Supabase anonymous sign-ins](https://supabase.com/docs/guides/auth/auth-anonymous)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Realtime Broadcast](https://supabase.com/docs/guides/realtime/broadcast)
- [Supabase Realtime Authorization](https://supabase.com/docs/guides/realtime/authorization)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [SvelteKit on Vercel](https://vercel.com/docs/frameworks/full-stack/sveltekit)
- [Storybook for SvelteKit](https://storybook.js.org/docs/get-started/frameworks/sveltekit)
- [Storybook network request mocking](https://storybook.js.org/docs/writing-stories/mocking-data-and-modules/mocking-network-requests)
- [Storybook Vitest integration](https://storybook.js.org/docs/writing-tests/integrations/vitest-addon)
- [Isometric resistance training and blood pressure meta-analysis](https://pubmed.ncbi.nlm.nih.gov/36853479/)
- [Isometric exercise training, arterial stiffness, and endothelial function meta-analysis](https://pubmed.ncbi.nlm.nih.gov/42114354/)
- [Acute endurance exercise and BDNF meta-analysis](https://pubmed.ncbi.nlm.nih.gov/36671818/)
- [Whole-body isometric resistance training and plasma BDNF randomized study](https://pubmed.ncbi.nlm.nih.gov/40643371/)

## 19. Decision log

| Date | Decision | Status |
| --- | --- | --- |
| 2026-07-14 | MVP 1 will be a web application. | Confirmed |
| 2026-07-14 | Camera footage will remain entirely on the user’s device. | Confirmed |
| 2026-07-14 | Native mobile apps are excluded from MVP 1. | Confirmed |
| 2026-07-14 | MVP 1 target delivery window is five days. | Superseded on 2026-07-15 |
| 2026-07-14 | Daily duration starts at 30 seconds and increases by five seconds after success, with no hard maximum. | Superseded on 2026-07-15 |
| 2026-07-14 | Poor form has a five-second grace period before the timer pauses. | Confirmed |
| 2026-07-14 | MVP 1 requires no user registration and stores identity/progress per anonymous browser profile. | Confirmed |
| 2026-07-14 | A participant places a pixel only after successful session completion. | Confirmed |
| 2026-07-14 | The Leader uploads prepared artwork; an art editor is excluded. | Confirmed |
| 2026-07-14 | Previous canvases remain available in an archive tab. | Confirmed |
| 2026-07-14 | Use a single worldwide UTC challenge day and show reset time locally. | Confirmed |
| 2026-07-14 | Use Supabase anonymous Auth rather than a raw browser-generated identifier. | Recommended |
| 2026-07-14 | Keep Python outside the production pose-validation path. | Recommended |
| 2026-07-15 | Allow unlimited retries but only one success, progression increase, and pixel per UTC day. | Confirmed |
| 2026-07-15 | Invalid time, including the five-second grace window, does not count toward the duration. | Confirmed |
| 2026-07-15 | Target pixels automatically use the artwork’s color. | Confirmed |
| 2026-07-15 | Occupied pixels cannot be overwritten. | Confirmed |
| 2026-07-15 | MVP artwork is limited to a 64 × 64 logical grid. | Confirmed |
| 2026-07-15 | The Leader uses allow-listed Supabase magic-link authentication. | Confirmed |
| 2026-07-15 | MVP targets current major desktop and mobile browsers with graceful capability fallback. | Confirmed |
| 2026-07-15 | All product UI text uses the Pixelify Sans pixel font. | Confirmed |
| 2026-07-15 | The main page does not display “PERFECT FORM”; form status is session-only. | Confirmed |
| 2026-07-15 | The main-page CTA progresses from `START 30 SEC` to `PLACE YOUR PIXEL` to disabled `YOUR PIXEL IS LIVE`. | Confirmed |
| 2026-07-15 | Use SvelteKit and TypeScript for the web application. | Confirmed |
| 2026-07-15 | Use TensorFlow.js MoveNet for browser-only pose detection; no camera or keypoint stream is sent to the backend. | Confirmed |
| 2026-07-15 | Use PixiJS v8 with pixi-viewport v6 for the interactive artwork. | Confirmed |
| 2026-07-15 | Use Supabase for Postgres, anonymous Auth, Storage, atomic database functions, and Realtime Broadcast. | Confirmed |
| 2026-07-15 | Frontend development begins with Storybook, typed mock data, and deterministic stories for every application state before backend and real pose integration. | Confirmed |
| 2026-07-15 | New browser identities receive a skippable, replayable, scroll-driven pixel-art introduction before the daily canvas. | Confirmed |
| 2026-07-15 | The intro uses only an original runner-and-followers scene for MVP and the public pilot. Licensed or unlicensed film-derived imagery, characters, audio, brands, costumes, and likenesses are excluded; any licensing initiative is a separate post-MVP project. | Confirmed |
| 2026-07-15 | Intro health captions use conservative evidence-reviewed language and do not attribute general exercise findings directly to a 30-second plank. | Confirmed |
| 2026-07-15 | Intro benefits describe a consistent, gradually progressive plank habit over time rather than immediate effects from one session. | Confirmed |
| 2026-07-15 | Exclude BDNF from the intro benefit animation. An optional evidence page may describe temporary changes in circulating BDNF from some intense exercise only while stating that a plank-specific effect has not been established; mental resilience remains a separate habit-and-persistence claim. | Confirmed |
| 2026-07-15 | Replace the five-day deadline with a milestone-based, acceptance-gated implementation roadmap suitable for AI-assisted development. | Confirmed |
| 2026-07-15 | Use the Build Week compliance checklist as a required release and submission review gate. | Confirmed |
| 2026-07-15 | Automatic duration progression stops at 120 seconds. The Build Week release and public pilot use 120 seconds as a hard ceiling, with advanced progression disabled. Participants may still reduce their future target without losing their streak. | Confirmed |
| 2026-07-15 | Any future progression beyond 120 seconds requires a separate safety review, an approved and configured higher ceiling, and explicit release authorization; acknowledging guidance alone is insufficient. | Confirmed |
| 2026-07-15 | The advanced-duration safety message, explicit acknowledgment, `STAY AT 120 SEC`, and `UNLOCK ADVANCED` actions are approved for possible future use but remain hidden while advanced progression is disabled. | Confirmed |
| 2026-07-15 | MVP pose validation supports one full-body participant in a left or right side view, including slight three-quarter angles; unsupported or low-confidence views block the timer and show repositioning guidance. | Confirmed |
| 2026-07-15 | Missing required landmarks stop credited time immediately; a 500 ms UI debounce precedes `MOVE INTO FRAME`, and the five-second incorrect-form grace period does not apply to tracking loss. | Confirmed |
| 2026-07-15 | Pose thresholds and smoothing live in an evidence-linked, versioned configuration; changes update landmark fixtures and tests, and only the configuration version may accompany a completion event. | Confirmed |
| 2026-07-15 | Build Week pose-demo acceptance uses three or four consenting adults across at least three representative device/browser combinations; broader public-pilot validation remains to be defined. | Confirmed |
| 2026-07-15 | The Build Week deliverable is a free, judging-accessible controlled demo; public promotion and the public pilot wait for separate safety, compatibility, accessibility, and operational approval. | Confirmed |
| 2026-07-15 | Build Week includes a clearly labelled guided demo driven by simulated pose data and production UI logic; its challenge, completion, placement, and progression data are isolated from real participant state. | Confirmed |
| 2026-07-15 | Camera-free honor mode can earn the normal daily streak and pixel, shares the one-per-day entitlement with camera validation, stores its completion method, and does not visually distinguish contributed pixels. | Confirmed |
| 2026-07-15 | Honor mode starts after the standard countdown, runs continuously without pause or resume, supports abandonment and unlimited retry, and completes automatically at the daily target. | Confirmed |
| 2026-07-15 | Hiding, backgrounding, locking, or navigating away from an honor-mode session ends the attempt immediately with a keep-this-page-open message and immediate retry. | Confirmed |
| 2026-07-15 | The shared `BEFORE YOU START` safety notice and its `GO BACK` and `I UNDERSTAND` actions are approved for camera-validated and honor-mode sessions. | Confirmed |
| 2026-07-15 | The shared safety notice is acknowledged once per UTC challenge day and safety-copy version; the acknowledgment covers camera and honor modes plus same-day retries. | Confirmed |
| 2026-07-15 | The intro benefit animation uses only the four approved captions covering core muscular endurance, strength while holding still, a consistent movement habit, and a resilient habit; BDNF, blood-pressure, vascular, cardiac, and rehabilitation claims are excluded. | Confirmed |
| 2026-07-15 | Pixels placed outside a completed target use one Leader-defined challenge fallback color, defaulting to product accent orange; participants cannot change it, and it becomes immutable after the challenge's first placement. | Confirmed |
| 2026-07-15 | Pixel moderation uses Leader-only soft removal with a required reason and private audit record; the coordinate reopens, the original daily entitlement remains consumed, identities stay private, and MVP uses a simple contact route instead of a full reporting system. | Confirmed |
| 2026-07-15 | The Build Week demo uses no non-essential analytics. Any future public-pilot analytics are first-party and explicit opt-in, do not affect participation when declined, retain raw events for at most 30 days, and prohibit camera, pose, health, and precise device-identifier data. | Confirmed |
| 2026-07-15 | Defer behavioral conversion, completion, and retention targets until the public-pilot audience, sample size, and launch envelope are defined; privacy and safety failures remain release blockers regardless of product metrics. | Confirmed |
| 2026-07-15 | Target a 30–45-second first-visit introduction at a normal scrolling pace, with no forced waits and `SKIP INTRO` visible from the beginning. | Confirmed |
| 2026-07-15 | Intro audio is optional original ambient/chiptune music with simple effects, muted by default, with no voice-over and a persistent sound toggle; the story remains complete without sound. | Confirmed |
| 2026-07-15 | Use an original, gender-neutral pixel-art protagonist without celebrity likeness or MVP customization, surrounded by deliberately varied participants that avoid gender, cultural, fitness, and body-type stereotypes. | Confirmed |
| 2026-07-15 | Selecting an available canvas cell immediately submits the permanent pixel placement with no confirmation dialog or second click; the placement screen warns users in advance, and failed transactions preserve the entitlement. | Confirmed |
| 2026-07-15 | The internal project team is the sole MVP 1 Leader and has editorial responsibility for choosing, preparing, scheduling, and publishing the pixel artwork; participant submissions and community voting are post-MVP. | Confirmed |

</details>
