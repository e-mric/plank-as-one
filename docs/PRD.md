# The Plank Canvas — Product Requirements Document

**Status:** MVP definition draft  
**Last updated:** 2026-07-15
**Target:** MVP 1 web application in five days

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

## 4. Target users

### 4.1 Aspiring Disciplinarian — primary participant

Wants to build a daily habit but tends to give up when exercising alone. Values completing the challenge at a convenient time while still contributing to a shared outcome.

### 4.2 Form Novice — participant need-state

Needs real-time correction to hold an effective, safer plank and learn correct form.

### 4.3 Leader — community guide

Sets the daily challenge, creates the hidden pixel artwork, and provides daily inspiration to the community.

> The relationship between the Aspiring Disciplinarian and Form Novice personas remains to be clarified; they may be overlapping user needs rather than mutually exclusive personas.

## 5. Value proposition

### Asynchronous community achievement

Participants are not required to attend at a fixed time. A successful session permanently reveals part of that day’s hidden artwork, turning an individual workout into collective progress.

### On-device AI form validation

The browser uses TensorFlow.js Pose Detection with MoveNet to estimate the participant’s pose entirely on-device. Browser-side TypeScript rules evaluate the returned keypoints and provide immediate form feedback. When form remains invalid beyond the grace period, the timer pauses. Camera frames and pose keypoints never leave the device.

### Optional live presence

When multiple users happen to plank simultaneously, their pixels can pulse or light up, creating spontaneous shared presence without transmitting video.

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

Targets and analytics implementation remain TBD.

## 7. Hard constraints

### Privacy

- Live video frames must never be sent to or stored on a server.
- Pose estimation and form validation must run entirely in the participant’s browser.
- Any pose-derived data sent to the server must be explicitly defined, minimized, and disclosed.

### Platform

- MVP 1 is a responsive web application.
- Native iOS and Android applications are out of scope.

### Delivery and cost

- MVP 1 must be delivered in five days.
- Infrastructure and ongoing operating costs should be kept as low as practical.

### Performance and scale

- The shared canvas must efficiently represent and render potentially thousands of revealed pixels.
- The system must support users loading changing canvas state throughout the day.

## 8. Confirmed MVP 1 product rules

### 8.1 Daily challenge progression

- A new browser starts with a 30-second target.
- After the participant successfully completes a daily session, their next daily target increases by five seconds.
- An incomplete session does not increase the next target.
- The product has no hard maximum plank duration.
- Because MVP 1 has no portable account, progression and streak history are tied to the current browser profile.

Participants receive unlimited retries until they succeed. Each anonymous browser identity can record exactly one successful completion, one progression increase, and one earned pixel per UTC challenge day.

### 8.2 Form validation

MVP 1 checks:

- Hips too high.
- Hips too low.
- Bent knees.
- Incorrect head position.

Poor form receives a five-second grace period before the timer pauses. Invalid time in the grace window does not count toward the required duration. Returning to valid form clears the grace countdown and resumes accumulation. Thresholds should use hysteresis or smoothing so the timer does not rapidly alternate between valid and invalid states.

The product should accept different camera positions, but it cannot validate joints that the model cannot see reliably. MVP 1 must therefore require the landmarks needed by its checks to meet a minimum visibility threshold. A side or three-quarter view that includes at least one visible chain of ear, shoulder, hip, knee, and ankle is recommended. “Any angle” and “partial body” are goals, not guarantees.

### 8.3 Browser-only identity

- No registration, email, password, or social login is required.
- MVP 1 uses an automatically created anonymous browser identity.
- Progress is not portable across browsers or devices.
- Clearing site data, using private browsing, or losing the browser session can reset the participant’s identity, streak, duration, and completion history.
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
- After the target artwork has been filled, subsequent participants may place pixels elsewhere on the canvas.
- Previous daily canvases are accessible from an archive tab.

For pixels placed outside the target after its completion, MVP 1 should use a Leader-defined fallback color, defaulting to the product accent orange. Moderation remains to be confirmed.

### 8.5 Leader workflow

For MVP 1, an authorized administrator can:

- Upload a prepared pixel-art image.
- Enter the daily challenge settings.
- Schedule or publish the daily challenge.

The Leader signs in through a Supabase magic link. Access is restricted to an allow-list of administrator email addresses.

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

The visible Cemantle page confirms a single numbered daily puzzle and a previous-day result, but does not state its exact timezone. The UTC rule above is the recommended concrete interpretation for a shared worldwide canvas.

## 9. MVP 1 functional scope

### Participant experience

1. View today’s challenge and current shared canvas.
2. Receive a transparent anonymous browser identity without registration.
3. See the required duration, local reset time, and basic local streak.
4. Grant camera permission and receive local-only pose detection.
5. Receive camera-placement guidance until the required landmarks are visible.
6. Start the timer once a valid plank is detected.
7. See which form rule is failing and a five-second correction countdown.
8. Pause the timer if invalid form continues beyond the grace period.
9. Retry a failed or abandoned session.
10. Complete one qualifying daily session.
11. Return to the main canvas, where `PLACE YOUR PIXEL` replaces `START 30 SEC`.
12. Choose an available canvas coordinate and place one earned pixel.
13. See the selected cell become live and the disabled action change to `YOUR PIXEL IS LIVE`.
14. See new community pixels without reloading the page.
15. Browse previous read-only canvases.

### Responsive and browser experience

1. Use the full participant flow on phone, tablet, laptop, or desktop layouts.
2. Support current evergreen Chrome, Edge, Firefox, and Safari on desktop and mobile where the required camera, WebAssembly, and browser APIs are available.
3. Provide touch, pointer, and keyboard interaction for canvas placement and navigation.
4. Detect unsupported capabilities before the session starts and explain the exact missing requirement.
5. Preserve canvas viewing, archives, and informational pages even when pose tracking is unavailable.
6. Require a secure HTTPS context for deployed camera use.

“Works everywhere” is treated as a broad compatibility goal, not a promise for obsolete browsers, embedded webviews, devices without usable cameras, or platforms lacking required APIs. The launch acceptance matrix must include at least Android Chrome, iOS Safari, macOS Safari/Chrome, and Windows Chrome/Edge/Firefox.

### Leader experience

1. Access a protected administration route.
2. Upload a small prepared pixel-art image with transparent-background support.
3. Enter the challenge date and settings.
4. Preview the low-opacity canvas target.
5. Publish or schedule the challenge.

Live-presence animation is excluded from the recommended five-day MVP. Realtime is used for completed pixel placements only.

## 10. Explicitly out of scope for MVP 1

- Native mobile applications.
- Sending, streaming, or storing camera footage.
- Additional exercises or postures unless required for the initial pilot.
- Artwork proposals and community voting unless they replace a more expensive Leader workflow.
- Social feeds, direct messaging, and video communication.
- An in-app pixel-art editor.
- Cross-device streak synchronization.
- Strong proof that a client-reported session was genuinely completed.
- Live pulsing or visualization of users who are currently planking.
- Scope not expressly accepted in this PRD.

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
- Send only the final business event needed to claim a completion, such as challenge ID, anonymous user ID from the access token, target duration, and completion timestamp.
- Dispose of the detector and TensorFlow tensors, stop camera tracks, and release associated resources when the session route is left.
- Suspend or destroy the PixiJS renderer while the TensorFlow session is active so both systems do not compete unnecessarily for WebGL contexts, GPU memory, and battery.

### 11.3 Data, identity, and realtime updates

- Use Supabase Auth anonymous sign-ins. This requires no PII or registration while providing a stable UUID, an authenticated database role, RLS, and a future path to link a permanent identity.
- Use Postgres as the source of truth for challenges, artworks, anonymous progression, completions, and placed pixels.
- Enable Row Level Security on every exposed table.
- Enforce one completion and one pixel entitlement per anonymous user and challenge with database uniqueness constraints, not only UI checks.
- Store uploaded source artwork in Supabase Storage.
- Use database functions/RPCs for completion claims and pixel placement so entitlement consumption, collision checks, and pixel insertion occur atomically.
- Load an initial canvas snapshot over the Supabase Data API, then use a challenge-specific Supabase Realtime Broadcast channel for new pixel placements.
- Treat Postgres as authoritative after reconnect: refetch changes or the current viewport instead of assuming that every realtime event was received.
- Broadcast compact pixel events containing only challenge ID, integer coordinates, color, and server timestamp.
- Do not use Presence in MVP 1.

### 11.4 Artwork rendering

Use **PixiJS v8** as the artwork renderer and **pixi-viewport v6** as its 2D camera. Use PixiJS directly rather than a Svelte wrapper so lifecycle, version compatibility, and performance remain under team control.

Rationale:

- PixiJS uses GPU-accelerated WebGL/WebGL2 in production and batches simple sprites/graphics efficiently.
- pixi-viewport v6 supports PixiJS v8 and supplies mouse drag, touch drag, pinch zoom, wheel zoom, and deceleration.
- The retained scene graph supports the target outline, completed pixels, selection cursor, and short realtime animations without building a full editor.
- Konva is better suited to manipulating many independent editable shapes; that scene-graph overhead is not needed because MVP participants select one logical grid coordinate rather than edit artwork objects.
- A hand-written Canvas 2D implementation would minimize dependencies but would require the team to build zoom, pan, transforms, pointer mapping, culling, and interaction behavior during the five-day window.

Implementation requirements:

- Initialize PixiJS only in the browser from a Svelte component after mount; never initialize it during server-side rendering.
- Use PixiJS’s stable WebGL renderer for MVP 1. Do not enable WebGPU in production while its cross-browser behavior remains experimental.
- Configure `antialias: false`, align transforms to device pixels, and use integer world coordinates so square cells remain crisp.
- Use pixi-viewport for drag, pinch, wheel, and deceleration, but clamp zoom to readable and selectable cell sizes.
- Organize the scene into target-outline, completed-pixel, placement-preview, and transient-animation layers.
- Batch cells by state/color instead of creating an interactive event target for every square.
- Convert the pointer’s world position mathematically into integer grid coordinates. Validate availability against local state, then confirm atomically with Supabase.
- Store pixels as integer `x`, `y`, `color`, `challenge_id`, and anonymous `owner_id` values.
- Add a unique database constraint on `(challenge_id, x, y)` so overwriting is impossible.
- Partition large canvases into logical chunks and fetch/render only chunks intersecting the current viewport.
- Enable PixiJS culling or equivalent application-level chunk culling when substantial content lies offscreen.
- Stop the PixiJS ticker and render on demand while the canvas is static. Temporarily animate only new-pixel and completion effects to reduce battery use.
- Destroy the PixiJS application, viewport listeners, textures, and subscriptions when the component unmounts.

Compatibility and accessibility:

- If WebGL initialization fails, provide a non-interactive Canvas 2D or server-generated image snapshot so the artwork and archives remain viewable. Pixel placement may be disabled with a clear capability message in this fallback.
- Canvas content is not inherently accessible. Mirror the important state in DOM text, expose completion counts and selection coordinates to assistive technology, and provide keyboard controls for moving and confirming the placement cursor.

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
- Fitness guidance must include an appropriate safety notice and avoid medical claims.

## 13. Risks requiring early validation

- Browser pose estimation may behave inconsistently across devices, lighting, clothing, camera angles, and body types.
- Incorrect form feedback can frustrate users or create false confidence; the product must avoid presenting itself as medical advice.
- Camera permission friction may sharply reduce challenge starts.
- Canvas mechanics may fail if participation and artwork size are poorly matched.
- Authentication and anti-abuse requirements may exceed a five-day build if not minimized.
- “Live” presence introduces real-time infrastructure and privacy questions that may not justify MVP complexity.
- Hips, knees, and head position cannot all be judged from arbitrary angles or when their required landmarks are outside the frame.
- An unbounded canvas needs collision rules and a viewport strategy even if participant capacity is unlimited.
- With no duration maximum, long-term targets may eventually become unsafe, impractical, or impossible for some participants.
- Browser-only identity means streak loss is expected when site storage is cleared or a different device is used.
- TensorFlow.js and PixiJS both use GPU resources; their lifecycles must not overlap unnecessarily on constrained devices.
- A PixiJS/WebGL canvas requires a DOM accessibility layer and a view-only fallback when GPU initialization is unavailable.

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
- **Pixel placement:** zoomed target, earned pixel attached to pointer/finger, automatic target color, occupied-cell feedback, confirm action, and realtime celebration.
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
5. **Earned pixel on the main page:** after 30 valid seconds, the participant returns to the same main page. `START 30 SEC` has been replaced by the active `PLACE YOUR PIXEL` button. Selecting it enables placement mode on the artwork; the participant chooses an unoccupied outlined target and confirms the placement. The pixel automatically takes that target coordinate’s artwork color.
6. **Pixel live:** after the placement transaction succeeds, the selected cell is filled and visible on the shared canvas. The primary button becomes disabled and reads `YOUR PIXEL IS LIVE`. The participant cannot place another pixel or restart the daily session until the next UTC challenge.

Transitions should visually connect the stages: the start button becomes the countdown, the countdown becomes the timer, and the completed timer resolves into the earned pixel.

## 15. Open decisions

- Exact pose visibility and joint-angle thresholds, smoothing window, and supported orientations.
- Exact fallback-color behavior for placements outside a completed target.
- Pixel moderation and removal policy.
- MVP launch audience, expected concurrency, and supported browsers/devices.
- Required analytics and consent experience.
- Accessibility and alternatives for users unable or unwilling to use a camera.
- Five-day acceptance criteria and deployment ownership.

## 16. Five-day delivery recommendation

### Day 1 — prove the risky path

- Scaffold the monorepo and deployments.
- Prove camera permission, TensorFlow.js MoveNet loading, WebGL/WASM backend selection, landmark visibility, and one side-view plank rule on target devices.
- Prove PixiJS initialization, crisp pixel rendering, pan/zoom, and coordinate selection on one desktop and one phone.
- Define the Supabase schema, anonymous identity, and RLS baseline.

### Day 2 — complete the session loop

- Implement all four form checks, smoothing, grace countdown, timer, retry, and local progress.
- Add automated tests for the form state machine using landmark fixtures.

### Day 3 — complete the shared canvas loop

- Implement challenge loading, completion claim, pixel entitlement, placement transaction, snapshot loading, and realtime pixel updates.
- Implement the PixiJS renderer, pixi-viewport interaction, chunk model, and DOM accessibility mirror.

### Day 4 — Leader, archive, and design integration

- Implement protected artwork upload and challenge scheduling.
- Add the archive tab and UTC reset/countdown behavior.
- Apply the chosen visual design and responsive layout.

### Day 5 — validation and launch

- Test representative phones and laptops, camera denial, missing landmarks, slow model loading, midnight UTC rollover, collision races, and reconnect behavior.
- Fix only launch-blocking defects, add privacy/safety copy, deploy, and run a pilot smoke test.

The release should be treated as a pilot unless the team can test pose accuracy across a meaningful range of bodies, devices, lighting conditions, and camera placements within the five-day window.

## 17. Technical references

- [TensorFlow.js Pose Detection models](https://github.com/tensorflow/tfjs-models/tree/master/pose-detection)
- [TensorFlow.js MoveNet](https://github.com/tensorflow/tfjs-models/tree/master/pose-detection/src/movenet)
- [PixiJS v8 documentation](https://pixijs.com/8.x/guides)
- [PixiJS performance guidance](https://pixijs.com/8.x/guides/concepts/performance-tips)
- [pixi-viewport](https://github.com/pixijs-userland/pixi-viewport)
- [Supabase anonymous sign-ins](https://supabase.com/docs/guides/auth/auth-anonymous)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Realtime database changes](https://supabase.com/docs/guides/realtime/subscribing-to-database-changes)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [SvelteKit on Vercel](https://vercel.com/docs/frameworks/full-stack/sveltekit)

## 18. Decision log

| Date | Decision | Status |
| --- | --- | --- |
| 2026-07-14 | MVP 1 will be a web application. | Confirmed |
| 2026-07-14 | Camera footage will remain entirely on the user’s device. | Confirmed |
| 2026-07-14 | Native mobile apps are excluded from MVP 1. | Confirmed |
| 2026-07-14 | MVP 1 target delivery window is five days. | Confirmed |
| 2026-07-14 | Daily duration starts at 30 seconds and increases by five seconds after success, with no hard maximum. | Confirmed |
| 2026-07-14 | Poor form has a five-second grace period before the timer pauses. | Confirmed |
| 2026-07-14 | MVP 1 requires no user registration and stores identity/progress per browser session. | Confirmed |
| 2026-07-14 | A participant places a pixel only after successful session completion. | Confirmed |
| 2026-07-14 | The Leader uploads prepared artwork; an art editor is excluded. | Confirmed |
| 2026-07-14 | Previous canvases remain available in an archive tab. | Confirmed |
| 2026-07-14 | Use a single worldwide UTC challenge day and show reset time locally. | Recommended |
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
| 2026-07-15 | Use PixiJS v8 with pixi-viewport v6 for the interactive artwork. | Recommended |
| 2026-07-15 | Use Supabase for Postgres, anonymous Auth, Storage, atomic database functions, and Realtime Broadcast. | Confirmed |
