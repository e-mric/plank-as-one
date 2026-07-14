# The Plank Canvas — Product Requirements Document

**Status:** MVP definition draft  
**Last updated:** 2026-07-14  
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

The browser uses the device camera and on-device pose estimation, currently proposed as MediaPipe, to evaluate posture. When form breaks, the timer pauses and the interface provides immediate visual feedback.

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

Whether a participant may complete multiple successful sessions in the same challenge day remains to be confirmed. The recommended rule is one canvas contribution and one progression increase per browser identity per challenge day, with unlimited retries before success.

### 8.2 Form validation

MVP 1 checks:

- Hips too high.
- Hips too low.
- Bent knees.
- Incorrect head position.

Poor form receives a five-second grace period before the timer pauses. The recommended interpretation is five continuous seconds: returning to valid form clears the grace countdown. Thresholds should use hysteresis or smoothing so the timer does not rapidly alternate between valid and invalid states.

The product should accept different camera positions, but it cannot validate joints that the model cannot see reliably. MVP 1 must therefore require the landmarks needed by its checks to meet a minimum visibility threshold. A side or three-quarter view that includes at least one visible chain of ear, shoulder, hip, knee, and ankle is recommended. “Any angle” and “partial body” are goals, not guarantees.

### 8.3 Browser-only identity

- No registration, email, password, or social login is required.
- MVP 1 uses an automatically created anonymous browser identity.
- Progress is not portable across browsers or devices.
- Clearing site data, using private browsing, or losing the browser session can reset the participant’s identity, streak, duration, and completion history.
- MVP 2 may allow the anonymous identity to be upgraded to a permanent account.

### 8.4 Canvas contribution

- A participant may place a pixel only after completing the day’s required session.
- The canvas uses an effectively unbounded coordinate space rather than a fixed participant capacity.
- The Leader’s prepared pixel-art image is displayed at low opacity as the shared target.
- Participants place earned pixels over the target artwork.
- After the target artwork has been filled, subsequent participants may place pixels elsewhere on the canvas.
- Previous daily canvases are accessible from an archive tab.

Pixel collision behavior, color selection, and moderation remain to be confirmed.

### 8.5 Leader workflow

For MVP 1, an authorized administrator can:

- Upload a prepared pixel-art image.
- Enter the daily challenge settings.
- Schedule or publish the daily challenge.

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
11. Choose an available canvas coordinate and place one earned pixel.
12. See new community pixels without reloading the page.
13. Browse previous read-only canvases.

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

### 11.1 Monorepo layout

```text
plank-as-one/
  apps/
    web/                 # SvelteKit participant and Leader application
  services/
    pose-lab/            # Python experiments, threshold evaluation, fixtures
  supabase/
    migrations/          # Schema, functions, triggers, and RLS policies
    seed.sql              # Local/test data
  packages/
    shared/               # Shared contracts if they become necessary
  docs/
    PRD.md
```

The Python pose lab is not a production backend. It is used by the pose team to analyze recorded, consented test fixtures offline and turn validated rules into browser-side TypeScript. No camera frame is sent from the web application to Python or any server.

### 11.2 Web and pose processing

- Use SvelteKit with TypeScript.
- Use MediaPipe Pose Landmarker through `@mediapipe/tasks-vision` in the browser.
- Load MediaPipe only on the session page and run it in `VIDEO` mode.
- Move inference to a Web Worker if the MVP device tests show unacceptable interface blocking.
- Calculate joint angles, visibility checks, smoothing, the form state machine, and the session timer entirely in the browser.
- Do not transmit raw frames, screenshots, landmarks, or per-frame angles in MVP 1.
- Send only the final business event needed to claim a completion, such as challenge ID, anonymous user ID from the access token, target duration, and completion timestamp.

### 11.3 Data, identity, and realtime updates

- Use Supabase Auth anonymous sign-ins. This requires no PII or registration while providing a stable UUID, an authenticated database role, RLS, and a future path to link a permanent identity.
- Use Postgres as the source of truth for challenges, artworks, anonymous progression, completions, and placed pixels.
- Enable Row Level Security on every exposed table.
- Enforce one completion and one pixel entitlement per anonymous user and challenge with database uniqueness constraints, not only UI checks.
- Store uploaded source artwork in Supabase Storage.
- Load an initial canvas snapshot, then use a challenge-specific Supabase Realtime Broadcast channel for new pixel placements.
- Do not use Presence in MVP 1.

### 11.4 Canvas rendering

- Use an HTML Canvas 2D renderer for MVP 1; thousands of square pixels do not justify WebGL complexity yet.
- Store pixels as integer `x`, `y`, `color`, `challenge_id`, and anonymous `owner_id` values.
- Add a unique constraint on `(challenge_id, x, y)` if overwriting is not allowed.
- Query and draw only the current viewport when the coordinate space grows beyond the initial artwork.
- Add zoom and pan only if required by the supplied design; otherwise start with a bounded visible area that can expand in chunks.

### 11.5 Hosting

- Deploy SvelteKit to Vercel using the official Vercel adapter.
- Use hosted Supabase for Postgres, Auth, Storage, and Realtime.
- Do not deploy a Python service for MVP 1. It would add hosting, integration, latency, and privacy complexity without being needed in the production flow.

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

## 14. Open decisions

- Whether valid intervals accumulate toward the target or only uninterrupted valid time counts.
- Whether users get unlimited retries and exactly one successful contribution per UTC day.
- Whether a valid interval clears the five-second poor-form grace immediately or after a recovery delay.
- Exact pose visibility and joint-angle thresholds, smoothing window, and supported orientations.
- Whether canvas pixels have fixed colors from the target, user-selected colors, or a limited palette.
- Whether pixels are first-come-first-served, may overwrite existing pixels, or must be placed in empty coordinates.
- Maximum source-art dimensions and how the image maps to the integer canvas grid.
- How the Leader authenticates in MVP 1.
- MVP launch audience, expected concurrency, and supported browsers/devices.
- Required analytics and consent experience.
- Accessibility and alternatives for users unable or unwilling to use a camera.
- Five-day acceptance criteria and deployment ownership.

## 15. Five-day delivery recommendation

### Day 1 — prove the risky path

- Scaffold the monorepo and deployments.
- Prove camera permission, MediaPipe loading, landmark visibility, and one side-view plank rule on target devices.
- Define the Supabase schema, anonymous identity, and RLS baseline.

### Day 2 — complete the session loop

- Implement all four form checks, smoothing, grace countdown, timer, retry, and local progress.
- Add automated tests for the form state machine using landmark fixtures.

### Day 3 — complete the shared canvas loop

- Implement challenge loading, completion claim, pixel entitlement, placement transaction, snapshot loading, and realtime pixel updates.
- Implement the Canvas 2D renderer.

### Day 4 — Leader, archive, and design integration

- Implement protected artwork upload and challenge scheduling.
- Add the archive tab and UTC reset/countdown behavior.
- Apply the chosen visual design and responsive layout.

### Day 5 — validation and launch

- Test representative phones and laptops, camera denial, missing landmarks, slow model loading, midnight UTC rollover, collision races, and reconnect behavior.
- Fix only launch-blocking defects, add privacy/safety copy, deploy, and run a pilot smoke test.

The release should be treated as a pilot unless the team can test pose accuracy across a meaningful range of bodies, devices, lighting conditions, and camera placements within the five-day window.

## 16. Technical references

- [MediaPipe Pose Landmarker for Web](https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker/web_js)
- [Supabase anonymous sign-ins](https://supabase.com/docs/guides/auth/auth-anonymous)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Realtime database changes](https://supabase.com/docs/guides/realtime/subscribing-to-database-changes)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [SvelteKit on Vercel](https://vercel.com/docs/frameworks/full-stack/sveltekit)
- [Cemantle](https://cemantle.certitudes.org/)

## 17. Decision log

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
