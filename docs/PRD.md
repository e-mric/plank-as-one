# The Plank Canvas — Product Requirements Document

| Field | Value |
| --- | --- |
| Status | Reviewed MVP definition draft; unresolved release decisions remain |
| Last updated | 2026-07-17 |
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

### Anonymous live presence

MVP 1 makes simultaneous participation visible without transmitting video or identity. When a participant reserves a canvas cell and begins a real challenge, that pending pixel pulses on the shared canvas. Other active reservations pulse anonymously at the same time, allowing participants to feel that they are exercising with others even though participation remains asynchronous. A successful challenge turns the pending pixel into a permanent contribution; an incomplete, abandoned, expired, or released attempt removes it.

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
- **Live shared participation:** reservation-to-completion rate, reservation release rate, reconnect recovery, and the number of real sessions that overlap with at least one anonymous active participant.
- **Community participation:** activity around proposing or voting on future artwork, postures, or exercises; likely post-MVP.

Numeric product targets and the future public-pilot event allow-list are intentionally deferred until the pilot audience, sample size, and launch envelope are defined. Before the pilot, the team must assign a measurement owner and targets for cell-selection-to-challenge-start conversion, valid-session completion, reserved-pixel commit rate, reservation release rate, and day-seven retention. Those behavioral targets inform product evaluation but never override privacy, safety, or critical reliability gates. The Build Week demo uses no non-essential product analytics; its evidence comes from deterministic tests, the small consenting tester exercise, and documented observations.

## 7. Hard constraints

### Privacy

- Live video frames must never be sent to or stored on a server.
- Pose estimation and form validation must run entirely in the participant's browser.
- Any pose-derived data sent to the server must be explicitly defined, minimized, and disclosed.
- The Build Week demo uses no non-essential analytics. Required product state, security logs, and deployment diagnostics are not repurposed as behavioral analytics.
- A future public pilot may collect first-party product analytics only after explicit opt-in consent. Declining or withdrawing consent does not restrict participation.
- Raw analytics events are retained for no more than 30 days. Analytics never include camera frames, landmarks, angles, pose classifications, health information, or precise device identifiers.
- Public live-presence payloads contain no participant identifier, profile, camera state, exact personal timer, form error, pose result, or completion method. They expose only the minimum anonymous cell lifecycle needed to render presence: challenge, coordinate, state, and server timing.

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
- The system must synchronize active reservations, releases, and committed pixels with bounded latency while preventing stale reservations from blocking cells indefinitely.
- The initial MVP objective is for reservation, release, and commit changes to become visible to subscribed clients within two seconds at p95 under the approved concurrency envelope. This is a synchronization target, not a guarantee that every client receives every event; reconnect reconciliation remains mandatory.

</details>

<details>
<summary><strong>MVP definition (sections 8–10)</strong> — confirmed rules, functional scope, and exclusions</summary>


## 8. Confirmed MVP 1 product rules

### 8.1 Daily challenge progression

- A new browser starts with a 30-second target.
- After the participant successfully completes a daily session, their target for the next UTC challenge day increases by two seconds, up to the default 120-second cap.
- An incomplete session does not increase the next target.
- At 120 seconds, automatic progression stops and the participant's next daily target remains 120 seconds.
- The Build Week release and public pilot use 120 seconds as a hard ceiling. Progression beyond 120 seconds and its unlock control are disabled.
- A future release may enable participant-controlled progression beyond 120 seconds only after a separate safety review approves and configures a higher ceiling. If enabled, duration never increases automatically; following each successful day, the participant chooses either `KEEP MY TARGET` or `ADD 2 SECONDS` for the next UTC challenge day.
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

Missing or low-confidence required landmarks are tracking loss, not incorrect form. Uncertain time stops counting immediately. A 500 ms debounce suppresses brief UI flicker; if tracking has not recovered when it expires, the interface shows `HEY, COME BACK!` and the session remains paused. The five-second correction grace period does not apply to tracking loss.

MVP 1 officially supports a left or right side view, including a slight three-quarter angle, with one participant's full body visible. At least one reliable chain of ear, shoulder, hip, knee, and ankle landmarks must meet the configured visibility threshold. The timer remains blocked and the interface provides repositioning guidance for frontal, rear, partial-body, multi-person, or low-confidence views. Broader angle and partial-body support are post-MVP goals, not guarantees.

Landmark-confidence, joint-angle, hysteresis, and smoothing values live in one versioned pose-rule configuration. Each value documents its units and calibration evidence. Configuration changes require updated recorded-landmark fixtures and affected tests in the same change. A completion may include the active configuration version for diagnostics, but never landmarks, angles, per-frame classifications, or camera data.

For Build Week judging, `VIEW GUIDED DEMO` is available from camera setup and from denied, skipped, or unsupported-camera states. It is persistently labelled `DEMO MODE — SIMULATED POSE DATA` and drives the production UI and timer state machine with deterministic pose states. It demonstrates valid form, corrections, grace timing, isolated reservation, completion/commit, and release against a simulated challenge. Demo events never change the real canvas, presence count, streak, duration, entitlement, or progression, and submission materials must identify simulated segments clearly.

`CONTINUE WITHOUT CAMERA` provides a real honor-mode session for participants unable or unwilling to use a camera. It runs the participant's actual daily target without pose validation or form feedback and persistently displays `FORM NOT CAMERA-VALIDATED`. Honor-mode completion may earn the normal daily streak and pixel. Camera-validated and honor-mode sessions consume the same one-per-challenge completion and pixel entitlement, so a participant cannot complete both on the same day. The completion method is stored as `camera_validated` or `honor`, but contributed pixels look identical. Honor mode uses the same safety guidance and remains distinct from guided demo mode, which never changes real state.

After honor mode and safety acknowledgment are selected, reserving an available cell triggers the standard three-second countdown. The attempt then runs continuously without `PAUSE` or `RESUME` controls. `END SESSION` abandons the attempt, releases the pending cell, and records no progression; retries remain unlimited. Switching tabs, backgrounding the browser, locking the device, or navigating away immediately abandons the attempt and releases the reservation. On return, the interface shows `SESSION ENDED — KEEP THIS PAGE OPEN DURING HONOR MODE` and offers an immediate retry beginning with a new cell selection. The session completes automatically when accumulated active time reaches the participant's daily target. Honor mode never displays form-correction or five-second grace states.

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

### 8.4 Pixel-first reservation and canvas contribution

- Selecting an available canvas cell is the action that begins a real camera-validated or honor-mode challenge. There is no separate `START 30 SEC` or post-completion `PLACE YOUR PIXEL` action.
- `CAMERA MODE` and `HONOR MODE` are persistent selection chips in the header's left status position rather than a separate route modal. They replace the former `PLANKING NOW` chip; anonymous live activity remains visible beside the canvas. Camera mode is selected by default. The participant may switch modes until selecting a pixel; pixel selection locks the chosen mode only for that active attempt. `END SESSION` releases both the pending pixel and the mode lock, allowing the participant to choose either mode before retrying.
- Before cell selection is enabled, the participant must confirm the active mode, acknowledge the current safety notice, and complete any required camera permission and framing readiness steps. Guided demo uses an isolated simulated canvas and never reserves a real cell.
- The canvas uses an effectively unbounded coordinate space rather than a fixed participant capacity.
- The Leader’s prepared pixel-art image is displayed at low opacity as the shared target.
- An available target cell previews its artwork color. A cell outside a completed target previews the Leader-defined fallback color.
- Clicking or tapping an available cell, or activating the focused cell with the keyboard, atomically attempts to reserve that coordinate for the current anonymous participant and challenge attempt. The selection itself is sufficient; there is no confirmation dialog or second action.
- A successful reservation enters a `pending` state, starts the standard three-second countdown, and makes the coordinate temporarily unavailable to other participants. The participant’s pending pixel pulses on the canvas and is labelled `YOUR PIXEL · PENDING`.
- Other active reservations are rendered as smaller anonymous pulsing pixels. They never disclose identity, camera use, exact timer progress, form status, or completion method.
- The participant sees one continuous main page throughout the countdown and challenge. Live presence and daily totals remain at the top; the credited timer, validated pose visualization, grace indicator, and on-device notice sit above the shared artwork; the canvas remains centered below them; and the streak sits at the lower edge. Responsive layouts preserve this vertical order rather than moving the challenge into a separate route or side rail.
- Camera mode keeps a fixed-height five-cell feedback block visible across ready, countdown, active, failure, and completion states to prevent layout shifts. It shows `READY ?` with empty cells before the attempt, `PERFECT FORM 🔥` while valid time is credited, `HIPS TOO LOW` or `HIPS TOO HIGH` during correction, `HEY, COME BACK!` during tracking loss, `POWER UP +2` on completion, and `TOO BAD!` after an abandoned attempt. Honor mode remains labelled `FORM NOT CAMERA-VALIDATED` and does not show camera form feedback.
- Completion plays a one-shot 15-frame celebration from the supplied 5×3 sprite sheet, read left-to-right and top-to-bottom, progressing from kneeling recovery through standing and ending on the raised-fists pose. The transparent pixel-art frames advance every 160 ms and then hold the final pose; reduced-motion preferences skip directly to that final frame.
- A successful challenge atomically records the completion, progression update, and permanent pixel at the reserved coordinate. The pending pulse stops and the pixel becomes fully locked without another participant action.
- An incomplete or explicitly abandoned attempt releases the reservation and removes the pending pixel. Page exit, loss of reservation ownership, heartbeat expiry, challenge reset, or an unrecoverable session error also releases it. The participant may retry by selecting an available cell again.
- Each active reservation has a server expiry and is renewed by a lightweight heartbeat while the attempt remains eligible. MVP defaults are a heartbeat every 10 seconds and expiry 30 seconds after the latest accepted heartbeat; these values are configuration, not client authority, and require load and background-behavior validation before the public pilot.
- Heartbeats cannot extend a reservation beyond its absolute attempt deadline. The initial MVP deadline is the participant's target duration plus 180 seconds, capped at 300 seconds from reservation creation. Reaching the deadline releases the cell and ends the attempt; the public-pilot operating review may revise this configuration.
- Each anonymous participant can hold at most one active reservation per challenge, and each coordinate can have at most one active reservation or permanent pixel. Server-side constraints and database functions enforce both rules.
- If the reservation request collides with another reservation or committed pixel, the canvas refreshes that coordinate and asks the participant to select another available cell. A failed reservation does not start the countdown or consume the daily entitlement.
- If completion reaches the server after the reservation has expired or been lost, the server does not write a pixel or progression update. The interface explains that the place was released and offers a retry; the client must never show a permanent pixel without authoritative confirmation.
- After the target artwork has been filled, subsequent participants may reserve cells elsewhere on the canvas.
- Previous daily canvases are read-only and accessible from an archive tab. Pending reservations are never written into archives.

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
- The final scene transitions into today's live canvas with the invitation `SELECT A PIXEL TO BEGIN`. Route selection, safety acknowledgment, and camera readiness occur before real cell selection is enabled.
- The television scene uses an original runner-and-followers asset for MVP and the public pilot. Film footage, film-derived characters or scenes, soundtrack audio, logos, costume replication, and actor likenesses are excluded even if a licensing opportunity becomes available during MVP development.
- Health-related captions must use evidence-reviewed, non-medical language and must not promise that one plank session treats or prevents disease.

## 9. MVP 1 functional scope

### Participant experience

Before the standard daily journey, a first-time participant can view or skip the pixel-art introduction and can replay it later from the menu.

1. View today’s challenge, shared canvas, anonymous active-reservation count, and pulsing pending pixels.
2. Receive a transparent anonymous browser identity without registration.
3. See the required duration, local reset time, and basic local streak.
4. Choose camera validation or real honor mode and acknowledge the shared safety notice before entering a real challenge.
5. For camera validation, grant permission, receive local-only pose detection, and follow framing guidance until the required landmarks are visible.
6. Optionally enter the clearly labelled guided demo; simulated results and presence remain isolated from real participant state.
7. Select an available canvas coordinate to atomically reserve it and trigger the three-second countdown. A collision asks the participant to choose another cell without consuming entitlement.
8. See the selected pixel pulse as `YOUR PIXEL · PENDING` among smaller anonymous pending pixels.
9. Keep the challenge timer, form-validation visualization, grace state, shared canvas, live-presence count, and streak together on one vertically ordered main page.
10. Start crediting time after the countdown according to the selected route: valid detected form for camera mode or continuous active-page time for honor mode.
11. See which camera form rule is failing and a five-second correction countdown.
12. Stop crediting time immediately when required landmarks are lost, show `HEY, COME BACK!` after the 500 ms UI debounce, or pause after visible incorrect form continues beyond the five-second grace period.
13. Receive anonymous realtime reservation, release, and committed-pixel updates without reloading the page.
14. Complete one qualifying daily session and see the pending pixel atomically become a permanent locked contribution with no second placement action.
15. On failure, abandonment, expiry, or loss of reservation ownership, see the pending pixel disappear and retry by selecting an available cell.
16. Browse previous read-only canvases.

### Responsive and browser experience

1. Use the full participant flow on phone, tablet, laptop, or desktop layouts.
2. Support current evergreen Chrome, Edge, Firefox, and Safari on desktop and mobile where the required camera, WebAssembly, and browser APIs are available.
3. Provide touch, pointer, and keyboard interaction for canvas reservation and navigation.
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

Anonymous live-presence synchronization is included in MVP 1. It covers pending reservations, releases, committed pixels, reconnect reconciliation, and an aggregate active count. It never transmits identity, camera data, pose data, personal timers, form results, or completion method.

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
- Named participant presence, profiles, avatars, public personal timers, rankings, chat, reactions, and any sharing of individual form or camera state.
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
- Load TensorFlow.js, the backend, and the model only after the participant chooses camera validation and begins camera setup; do not include them in the initial canvas bundle.
- Enable MoveNet temporal smoothing and establish explicit minimum keypoint-confidence thresholds through device testing.
- Throttle inference to the rate required for stable feedback rather than processing every camera frame. Start testing around 20–30 inferences per second and reduce the rate on slower devices.
- Consider a Web Worker only after measuring the target browsers; worker transfer and camera-frame plumbing are not required for the first implementation.
- Calculate joint angles, visibility checks, smoothing, the form state machine, and the session timer entirely in the browser.
- Do not transmit raw frames, screenshots, landmarks, or per-frame angles in MVP 1.
- Send only the business events needed to maintain the reservation and claim completion: reservation ID, challenge ID, anonymous user ID from the access token, target duration, completion timestamp, completion method, and the active pose-rule configuration version when camera validation was used.
- Dispose of the detector and TensorFlow tensors, stop camera tracks, and release associated resources when the challenge ends or the participant leaves the active experience.
- Keep the shared PixiJS canvas visible during an active camera session, but reduce its cost: zoom out to a stable viewport, stop continuous camera motion, render only presence or pixel changes, cap animation frequency, and avoid expensive filters. Measure simultaneous TensorFlow.js and PixiJS GPU use on the supported device matrix; if the device cannot sustain both, degrade the canvas to a Canvas 2D or server-rendered snapshot while keeping the timer and form validation functional.

### 11.3 Data, identity, and realtime updates

- Use Supabase Auth anonymous sign-ins. This requires no PII or registration while providing a stable UUID, an authenticated database role, RLS, and a future path to link a permanent identity.
- Use Postgres as the source of truth for challenges, artworks, anonymous progression, completions, and placed pixels.
- Enable Row Level Security on every exposed table.
- Enforce one completion, one permanent pixel, and at most one active reservation per anonymous user and challenge with database uniqueness constraints, not only UI checks.
- Store uploaded source artwork in Supabase Storage.
- Use database functions/RPCs for reservation creation, heartbeat renewal, release, and completion. Reservation creation atomically checks the coordinate and participant constraints. Completion atomically verifies reservation ownership and expiry, records the completion and progression, and converts the reserved coordinate into a permanent pixel.
- Store active reservations separately from permanent pixels, or model them with an equivalent state machine that supports authoritative `pending`, `committed`, `released`, and `expired` transitions. Coordinate exclusivity must be enforced by a single occupancy relation or by transaction-level locking and server-side checks that cover both reservations and permanent pixels; separate client checks are insufficient.
- Use server time for reservation expiry. The initial MVP configuration sends a heartbeat every 10 seconds and extends a valid reservation to 30 seconds after the accepted heartbeat. Cleanup may be lazy during reads/writes plus a scheduled sweep; expired reservations must be treated as available even before physical deletion.
- Store an immutable server-calculated absolute deadline with every reservation. Heartbeat renewal uses the earlier of `server_now + heartbeat_ttl` and that deadline, so a connected but stalled client cannot hold a cell indefinitely.
- Load an initial canvas and active-reservation snapshot over the Supabase Data API, then subscribe to a private, challenge-specific Supabase Realtime Broadcast channel for reservation, release, expiry, and committed-pixel events.
- Treat Postgres as authoritative after reconnect: refetch changes or the current viewport instead of assuming that every realtime event was received.
- Emit authoritative reservation and pixel lifecycle events from trusted database functions or server code only after the corresponding transaction succeeds. Participant clients must not be able to publish authoritative lifecycle events directly.
- Authorize private Broadcast subscriptions with RLS policies on `realtime.messages`, scoped to the challenge topic.
- Broadcast compact lifecycle events containing only challenge ID, integer coordinates, color, anonymous state (`pending`, `committed`, or `released`), reservation expiry when applicable, and server timestamp. Do not include owner ID, reservation secret, completion method, form state, personal timer, or camera state.
- Product live presence is derived from authoritative active reservations and lifecycle Broadcast events. Supabase Presence may be used only for anonymous connection health or aggregate diagnostics; it is never authoritative for coordinate ownership, completion, or the displayed active-reservation count.
- On reconnect, refetch authoritative active reservations and permanent pixels before replaying new events. Remove locally pulsing pixels that are absent or expired in the snapshot and restore an owned reservation only when the server confirms ownership and validity.

### 11.4 Artwork rendering

Use **PixiJS v8** as the artwork renderer and **pixi-viewport v6** as its 2D camera. Use PixiJS directly rather than a Svelte wrapper so lifecycle, version compatibility, and performance remain under team control.

Rationale:

- PixiJS uses GPU-accelerated WebGL/WebGL2 in production and batches simple sprites/graphics efficiently.
- pixi-viewport v6 supports PixiJS v8 and supplies mouse drag, touch drag, pinch zoom, wheel zoom, and deceleration.
- The retained scene graph supports the target outline, completed pixels, selectable coordinates, the participant's pending pixel, anonymous pending pixels, and short realtime lifecycle animations without building a full editor.
- Konva is better suited to manipulating many independent editable shapes; that scene-graph overhead is not needed because MVP participants select one logical grid coordinate rather than edit artwork objects.
- A hand-written Canvas 2D implementation would minimize dependencies but would require the team to build and maintain zoom, pan, transforms, pointer mapping, culling, and interaction behavior before validating the core product.

Implementation requirements:

- Initialize PixiJS only in the browser from a Svelte component after mount; never initialize it during server-side rendering.
- Use PixiJS’s stable WebGL renderer for MVP 1. Do not enable WebGPU in production while its cross-browser behavior remains experimental.
- Configure `antialias: false`, align transforms to device pixels, and use integer world coordinates so square cells remain crisp.
- Use pixi-viewport for drag, pinch, wheel, and deceleration, but clamp zoom to readable and selectable cell sizes.
- Organize the scene into target-outline, completed-pixel, available-cell interaction, anonymous-pending, owned-pending, and transient-animation layers. The owned pending pixel must remain visually distinct without relying on color alone.
- Batch cells by state/color instead of creating an interactive event target for every square.
- Convert the pointer's world position mathematically into integer grid coordinates. Validate apparent availability against local state, then atomically request a reservation from Supabase without an intermediate confirmation dialog. Only server confirmation starts the countdown and pending animation.
- Store permanent pixels as integer `x`, `y`, `color`, `challenge_id`, and private anonymous `owner_id` values, with private soft-removal metadata for moderation. Store reservations with an unguessable ID, owner, coordinate, server expiry, heartbeat timestamp, and attempt state; never expose owner or reservation credentials publicly.
- Enforce coordinate exclusivity across permanent pixels and non-expired reservations on `(challenge_id, x, y)` through the authoritative occupancy transaction so overwriting is impossible while a released, expired, or soft-removed coordinate can be claimed again.
- Perform Leader moderation through an authorized database function that atomically soft-removes the pixel, records the moderator, reason, and timestamp, and emits an authoritative removal event. Removal never restores or creates a participant entitlement.
- Partition large canvases into logical chunks and fetch/render only chunks intersecting the current viewport.
- Enable PixiJS culling or equivalent application-level chunk culling when substantial content lies offscreen.
- Stop the PixiJS ticker and render on demand while the canvas is static. During live presence, animate only visible pending pixels and lifecycle transitions, cap their update rate, and stop or simplify offscreen animation to reduce battery use.
- Destroy the PixiJS application, viewport listeners, textures, and subscriptions when the component unmounts.

Compatibility and accessibility:

- If WebGL initialization fails, provide a Canvas 2D or server-generated image snapshot so the artwork and archives remain viewable. If the fallback cannot provide precise accessible coordinate selection, real reservation is disabled with a clear capability message while honor mode and guided demo availability follow their separate capability rules.
- Canvas content is not inherently accessible. Mirror the important state in DOM text, expose committed and anonymous-active counts plus the focused coordinate to assistive technology, and provide keyboard controls for moving the reservation cursor and selecting the focused cell. Announce owned reservation, completion, release, and collision outcomes; do not announce every anonymous pulse or create a stream of disruptive live-region messages.

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
- Reservation owner IDs, session secrets, heartbeat credentials, exact personal progress, form status, and completion method remain private and are excluded from public canvas and realtime payloads.
- Rate-limit reservation creation and heartbeat renewal, bind them to the authenticated anonymous participant and challenge, reject renewals for released or expired reservations, and prevent one client from reserving multiple coordinates.
- Live participant counts are approximate anonymous product state, not claims about verified people or correct form. Never use them for rankings, pressure, or prizes.
- Analytics collection is disabled by default. A future pilot must present a clear accept/decline choice before emitting any non-essential event, honor withdrawal prospectively, and test that declining has no functional effect.
- Future analytics use an explicit event allow-list and a maximum 30-day raw-event retention policy. Camera and pose data, health information, free text, and stable fingerprinting identifiers are prohibited fields.
- Fitness guidance must include an appropriate safety notice and avoid medical claims.

## 13. Risks requiring early validation

- Browser pose estimation may behave inconsistently across devices, lighting, clothing, camera angles, and body types.
- Incorrect form feedback can frustrate users or create false confidence; the product must avoid presenting itself as medical advice.
- Camera permission friction may sharply reduce challenge starts.
- Canvas mechanics may fail if participation and artwork size are poorly matched.
- Authentication and anti-abuse requirements may expand MVP scope substantially if not minimized.
- Live reservation synchronization introduces concurrency, expiry, reconnect, privacy, operating-cost, and animation-load risks. It requires an authoritative server lifecycle, load testing, bounded payloads, and graceful degradation rather than client-only presence indicators.
- Hips, knees, and head position cannot all be judged from arbitrary angles or when their required landmarks are outside the frame.
- An unbounded canvas needs collision rules and a viewport strategy even if participant capacity is unlimited.
- Progression beyond 120 seconds could expose participants to targets that are unsafe, impractical, or impossible for them; it remains disabled unless a later safety review approves a higher ceiling, validates the guidance, and authorizes release.
- Browser-only identity means streak loss is expected when site storage is cleared or a different device is used.
- TensorFlow.js and PixiJS both use GPU resources. The unified active main page intentionally overlaps them, so the canvas must render on demand, animate sparingly, and degrade to a lighter snapshot when the supported device cannot sustain both.
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

The current main-page reference is the [vertical active-canvas design](../slides/designs/main-page.html). The broader journey remains documented in the [latest HTML product journey](../slides/designs/plank-as-one-latest-journey.html).

### 14.2 Proposed adaptation A — Canvas Monument

Use the supplied composition as the home screen almost unchanged. The shared artwork remains the dominant object. Add:

- A compact top status row containing current target, streak, and local reset countdown.
- A small archive/menu control in the top-right corner.
- An up-front prompt: `SELECT A PIXEL TO BEGIN`. Available cells are pointer-, touch-, and keyboard-selectable after route, safety, and readiness requirements are satisfied.
- A subtle committed count and anonymous `PLANKING NOW` count near the canvas.

Best for emotional impact and fidelity to the supplied design. Less information is immediately visible, so secondary features live in sheets or the menu.

### 14.3 Proposed adaptation B — Ritual Split

Use one vertically composed main page at all breakpoints. The top row holds the `CAMERA MODE` and `HONOR MODE` controls, daily contribution count, reset time, and streak. During the challenge, a centered timer and validated pose visualization appear above the shared artwork, followed by the grace indicator and on-device notice. The artwork stays large and centered, with the participant's labelled pulse and smaller anonymous pulses visible within it. Responsive changes adjust scale and spacing without changing this information order.

Best balance of clarity and visual character. This is the recommended production direction because it scales cleanly from desktop to mobile without covering the art.

### 14.4 Proposed adaptation C — Shared active session

During exercise, retain the shared canvas on the same page and reveal the challenge state above it. Show:

- A large pixel timer.
- A centered privacy-preserving pose visualization with a thin landmark skeleton or joint markers.
- The current state: `GET IN FRAME`, `PERFECT FORM`, `FIX HIPS`, `STRAIGHTEN KNEES`, `LIFT HEAD`, or `PAUSED`.
- A five-cell grace indicator that empties once per invalid second.
- A persistent local-processing badge.
- The participant's labelled pending pixel and anonymous active reservations pulsing on the shared canvas.

After completion, stop the participant's pulse and lock the reserved coordinate as a permanent pixel. If the attempt ends without completion, remove the pulse and reopen the coordinate.

### 14.5 Supporting screens

- **Camera setup:** illustrated framing guide, permission explanation, device-local privacy promise, readiness checks, and transition back to an enabled canvas-selection state.
- **Pixel reservation:** available-cell focus and hover, up-front `SELECTING A CELL STARTS THE CHALLENGE` notice, artwork or fallback color preview, occupied/reserved-cell feedback, direct click/tap/keyboard reservation, collision recovery, and countdown transition. No confirmation dialog is shown.
- **Live challenge:** zoomed-out shared canvas, owned and anonymous pending pulses, anonymous active count, credited timer, form-validation status, compact on-device camera preview, reconnect state, and automatic commit or release outcome.
- **Archive:** date-grouped thumbnail grid using the same outlined-pixel treatment; selecting a day opens a read-only canvas.
- **Leader:** restrained utility layout for magic-link access, 64 × 64 upload/preview, date, challenge settings, validation errors, and publish state.
- **Unsupported device:** capability checklist with viewing/archive access preserved.

### 14.6 Accessibility requirements

- Coral and pale outline colors must meet appropriate contrast when they communicate status; color alone cannot indicate valid or invalid form.
- All form feedback must have text and optional audio/haptic equivalents where supported.
- Respect reduced-motion preferences for pixel pulses, transitions, and completion effects. Reduced motion replaces repeated pulse animation with a static pending outline and text label while preserving the state distinction.
- Provide keyboard-operable pixel reservation and visible focus treatment.
- Offer a mirrored camera preview without mirroring pose-coordinate calculations incorrectly.
- Keep controls reachable and labels readable at mobile sizes and high zoom.

### 14.7 Primary desktop journey

The MVP’s principal journey should read as one continuous ritual:

1. **Today’s live canvas:** the participant arrives on a desktop main page dominated by the partially completed `PLANK AS ONE` artwork. Filled squares show permanent contributions, pale outlined squares show available targets, and small anonymous pulses show current reservations. The page also shows the Camera/Honor selector, streak, target, local reset countdown, archive/menu access, anonymous canvas activity, and `SELECT YOUR PIXEL`. It shows `READY ?` with an empty five-cell indicator rather than claiming valid form before the attempt.
2. **Route, safety, and readiness:** the participant chooses camera validation or honor mode and acknowledges the safety notice. Camera participants grant permission and complete framing guidance before the canvas becomes selectable; honor participants receive the keep-this-page-open warning. Guided demo remains isolated.
3. **Reserve and countdown:** selecting an available cell atomically reserves it and immediately triggers the clear `3`, `2`, `1` countdown. The selected cell becomes a larger labelled `YOUR PIXEL · PENDING` pulse. A collision refreshes the cell and returns focus to canvas selection.
4. **Active shared plank:** the unified main page keeps live-presence and daily counts at the top, then shows `00:00 / 00:30`, the validated pose visualization, grace state, and on-device notice above the centered shared canvas. The streak remains visible at the lower edge. Anonymous pending pixels continue pulsing on the canvas.
5. **Automatic commit:** after the required credited time, one atomic server transaction records completion and progression and converts the owned reservation into a permanent pixel. The pulse stops, the camera closes, and the interface announces `YOUR PIXEL IS LIVE`. No placement screen or second click occurs.
6. **Automatic release:** if the attempt is abandoned, fails, expires, loses reservation ownership, or encounters an unrecoverable error, the pending pixel fades out, the coordinate becomes available, and the participant may retry by selecting a cell again.

Transitions should visually connect the stages: cell selection becomes the countdown, the pending pulse persists through the timer, success turns the pulse solid, and failure removes it.

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
7. **Invitation:** one final empty cell pulses in the artwork. The copy reads `ONE PLANK. ONE PIXEL. ONE CANVAS.` and transitions to today's main page with `SELECT A PIXEL TO BEGIN` after the participant completes the required route, safety, and readiness steps.

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
- Use Mock Service Worker only where a component genuinely performs an HTTP request, such as artwork loading. Prefer injected fake repositories for application state and a controllable fake realtime client for reservation and pixel lifecycle events.
- Use a fake clock and fixed UTC challenge timestamps so reset countdown, streak, archive date, and midnight rollover stories do not depend on the developer's current time or timezone.
- Use a fake pose adapter that emits scripted landmark visibility and form states. TensorFlow.js and the real camera must not run in ordinary component stories.
- Add Storybook controls for useful state transitions, but keep named stories for every acceptance-critical state so they can run deterministically in CI.

### 15.2 Required story catalogue

At minimum, Storybook must expose the following desktop states before backend integration:

| Area | Required stories |
| --- | --- |
| First-visit intro | Each of the seven static chapters, first visit, returning visit bypass, skip, replay, completed transition, muted audio, reduced motion, narrow viewport, asset failure, and WebGL fallback. |
| Today's canvas | Loading, load failure with retry, partial artwork with `SELECT A PIXEL TO BEGIN`, anonymous live count, multiple pending pulses, reduced-motion pending state, fully completed target with selection outside the artwork, reset imminent, disconnected/reconnecting, and authoritative snapshot reconciliation. |
| Camera setup | Shared safety notice, acknowledged notice, same-day retry bypass, new UTC day, changed safety-copy version, permission explanation, permission denied, unsupported camera, model loading, model failure, move into frame, insufficient visible landmarks, and ready. |
| Countdown | `3`, `2`, `1`, cancelled because the pose was lost, and transition to the active timer. |
| Active plank | Unified vertical main page, top live/daily/reset counts, timer and validated pose above the canvas, owned and anonymous pending pulses, streak at the lower edge, valid form with `FORM VALIDATED · TIME COUNTING`, hips too high, hips too low, bent knees, incorrect head position, each second of the five-second grace period, brief tracking loss recovered inside 500 ms, persistent tracking loss with `MOVE INTO FRAME`, paused timer, recovered form, reservation heartbeat, abandoned session, automatic release, and automatic commit. |
| Guided demo | Entry from camera setup, permission denied, unsupported camera, persistent simulated-data label, scripted valid and invalid form, isolated reservation, isolated completion or release, and exit to real participant state. |
| Honor mode | Shared safety notice, entry without camera, persistent `FORM NOT CAMERA-VALIDATED` label, cell reservation, countdown, continuous timer with no pause control, owned pending pulse, `END SESSION`, tab switch, browser background, device lock, navigation away, release message, retry, automatic commit, shared-entitlement conflict, and return to camera setup. |
| Pixel reservation and presence | Reservation available with up-front start notice, pointer/focused-keyboard preview, occupied or remotely reserved target, direct selection without confirmation, submitting, collision conflict, one-reservation-per-participant conflict, heartbeat accepted or rejected, expiry, explicit release, reconnect with owned reservation restored, reconnect after expiry, duplicate/delayed/out-of-order lifecycle events, anonymous peer join/complete/release, successful atomic commit, and remote permanent pixel arrival. |
| Archive | Loading, empty archive, populated archive, selected historical canvas, and load failure. |
| Leader | Signed out, upload idle, invalid image, valid 64 x 64 preview, challenge settings, validation failure, publishing, published, pixel selected for moderation, removal confirmation, missing reason, removal failure, and removal success. |
| Shared UI | Menu open, reduced motion, keyboard focus, long translated copy tolerance, narrow viewport, and WebGL artwork fallback. |

The six primary desktop journey stories listed in section 14.7 are the first review milestone: today's live canvas, route/safety/readiness, reserve/countdown, active shared plank, automatic commit, and automatic release.

### 15.3 Automated frontend tests

Storybook is the primary component and screen-state harness, but it is one layer of the test strategy:

- **Static checks:** TypeScript checking, Svelte checking, formatting, and linting.
- **Unit tests:** Vitest tests for first-visit/replay routing, scroll-progress timeline mapping, countdown logic, UTC challenge-day and versioned safety-acknowledgment calculations, duration progression, honor-mode continuous timing and page-visibility abandonment, form-grace state machine, tracking-loss debounce, canvas coordinate conversion, reservation lifecycle reducers, heartbeat, rolling expiry and absolute-deadline calculations, reconnect reconciliation, idempotent realtime-event handling, and UI stores. If analytics are introduced for a later pilot, add consent, withdrawal, event allow-list, and prohibited-field tests before enabling collection.
- **Story tests:** Storybook's Vitest integration runs render and interaction tests against acceptance-critical stories. Test keyboard and pointer flows for route preparation, direct cell reservation, countdown, cancellation, retry, collision recovery, automatic commit, and automatic release, including the absence of a start button, placement screen, or second confirmation action.
- **Accessibility checks:** Run Storybook accessibility checks on all primary stories. Critical violations fail CI.
- **Visual regression:** Capture stable desktop snapshots for the six primary journey states, including the vertically composed active main page. Dynamic timestamps, pulse phase, random coordinates, live counts, and realtime events must be frozen for deterministic comparisons.
- **End-to-end tests:** Keep a small Playwright suite for the integrated camera reserve-to-commit happy path, the real honor-mode reserve-to-commit path and page-hide release, collision between two anonymous participants, heartbeat expiry and reconnect, the isolated guided-demo happy path, Leader soft removal, and critical failures against a local or preview Supabase environment. Assert that camera and honor modes share one entitlement, demo reservation and completion never mutate real participant or canvas state, released or expired reservations never become permanent pixels, and moderation reopens the coordinate without restoring the removed participant's entitlement. Do not duplicate the entire Storybook state matrix in E2E tests.
- **Pose-engine tests:** Test form classification, the five-second grace state machine, and immediate time exclusion plus the 500 ms tracking-loss debounce separately with recorded landmark fixtures. Manual camera/device testing remains required because mocked stories cannot validate real pose-estimation accuracy.

### 15.4 Integration contracts and mock-data rules

- Frontend mocks must be derived from documented domain types, not ad hoc shapes created inside individual stories.
- Completion contracts and fixtures include `completion_method` and, for camera-validated sessions, the pose-rule configuration version, but no landmarks, angles, per-frame classifications, or camera data.
- The frontend and backend teams must agree early on challenge, artwork, reservation, heartbeat, release, completion/commit, archive, and realtime lifecycle contracts. Contract changes update production types, fixtures, and affected stories in the same pull request.
- Fixture builders must provide sensible defaults and accept explicit overrides, making edge cases readable without duplicating large data objects.
- Story data must contain no real camera frames, personal information, Supabase credentials, or production URLs.
- Realtime stories must replay explicit reservation, renewal, release, expiry, commit, and permanent-pixel events and support duplicate, delayed, conflicting, and out-of-order updates.
- A story must never require a running backend unless it is clearly labelled as an integration story and excluded from the deterministic component-test job.

### 15.5 MVP 1 test gates

A frontend feature is ready for integration when its required stories exist, acceptance-critical interactions pass, keyboard operation is demonstrated, and loading, empty, failure, and success states are represented. MVP 1 is ready for the pilot when:

- The Storybook production build succeeds in CI.
- First-visit, skip, replay, reduced-motion, asset-failure, and returning-user intro stories pass.
- All primary journey stories pass interaction and accessibility checks.
- Visual baselines for the intro's key chapters and the six desktop journey states have been reviewed by the team.
- Unit tests cover UTC reset, progression, grace timing, reservation ownership, heartbeat expiry, atomic completion/commit, one-reservation constraints, reconnect reconciliation, and collision handling.
- The integrated Playwright happy path passes against the preview environment.
- Manual tests cover the supported browser/device matrix, actual camera permissions, pose accuracy, simultaneous TensorFlow.js and canvas performance, lighter-canvas fallback, reduced motion, realtime reconnect behavior, reservation expiry, and UTC rollover.
- Reservation concurrency tests prove coordinate exclusivity, one-reservation-per-participant, absolute-deadline enforcement, authoritative reconnect convergence, and the two-second p95 lifecycle-visibility objective under the approved pilot load.
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
- **Live-presence operating envelope:** approve expected concurrent reservations, Broadcast message rate, heartbeat, expiry, absolute attempt-deadline configuration, reconnect tolerance, load-test pass criteria, degraded-mode behavior, and cost alert thresholds. The initial `10 s` heartbeat, `30 s` expiry, and target-plus-180-seconds deadline capped at `300 s` are implementation defaults until this evidence is accepted.
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
- Define contracts for challenge loading, anonymous identity, progression, reservations, heartbeat renewal, release, atomic completion/commit, artwork, archive data, realtime lifecycle events, camera state, and pose state.
- Define the Supabase schema, migrations, storage policies, database functions, uniqueness constraints, Row Level Security, and anonymous-authentication baseline.

**Exit gate:** the repository builds in CI, Storybook runs without production services, migrations apply cleanly, and frontend fixtures conform to shared contracts.

### Milestone 2 — high-risk technical prototypes

- Prove camera permission, TensorFlow.js MoveNet loading, WebGL/WASM backend selection, landmark visibility, cleanup, and one side-view plank rule on representative devices.
- Prove PixiJS initialization, crisp pixel rendering, pan/zoom, keyboard selection, coordinate mapping, pending-pixel animation, culling, and graceful WebGL failure.
- Prove simultaneous TensorFlow.js and render-on-demand PixiJS operation on representative devices, including the lighter Canvas 2D or snapshot fallback used when both GPU workloads cannot be sustained.
- Prove anonymous Supabase access, atomic reservation and completion/commit functions, one-coordinate and one-reservation constraints, heartbeat renewal, expiry, reconnect reconciliation, RLS behavior, initial canvas loading, and compact realtime lifecycle events.
- Prototype the intro's scroll-to-timeline mapping, sprite batching, reduced-motion path, asset budget, and minimum-device performance.

**Exit gate:** each risky subsystem has a tested prototype and recorded evidence supporting the production approach; unresolved failures update scope or compatibility requirements before feature implementation continues.

### Milestone 3 — mock-driven product experience

- Build the seven static intro chapters and every participant, reservation, live-presence, unified active main-page, commit, release, archive, Leader, loading, empty, error, offline, and fallback state in Storybook.
- Approve the six primary desktop journey states and responsive adaptations before connecting production services.
- Add interaction, accessibility, and visual-regression tests for acceptance-critical stories.
- Freeze the approved component contracts so backend, pose-engine, canvas-engine, and frontend integration can proceed independently.

**Exit gate:** the complete MVP experience can be reviewed with deterministic mocks, primary interactions pass, and the team has approved the visual and content direction.

### Milestone 4 — private pose session

- Implement camera setup, required-landmark guidance, canvas-triggered countdown, unified vertical active main page, timer, retries, abandonment, and automatic commit or release transitions.
- Implement hips-high, hips-low, bent-knee, and head-position rules with confidence thresholds, smoothing, hysteresis, the five-second form-grace state machine, and the separate 500 ms tracking-loss UI debounce.
- Add landmark-fixture tests, resource-cleanup tests, permission and model-failure handling, and manual testing across representative bodies, cameras, lighting, clothing, and supported browsers.
- Verify through instrumentation and network inspection that frames, landmarks, angles, and pose streams never leave the browser.

**Exit gate:** valid form time is accumulated correctly, invalid time never counts, privacy requirements hold, and the supported device matrix meets the agreed pose-quality threshold.

### Milestone 5 — shared canvas and daily progression

- Implement UTC challenge selection, local reset display, anonymous progression, streaks, reservation ownership, completion claims, and one-per-day pixel rules.
- Implement PixiJS artwork loading, target outline, completed pixels, available-cell selection, owned and anonymous pending layers, pan/zoom, pointer and keyboard reservation, fallback color, occupied/reserved-cell feedback, and accessibility mirror.
- Integrate atomic reservation, heartbeat renewal, expiry, release, completion/commit, collision recovery, anonymous realtime updates, aggregate active count, reconnect reconciliation, large-canvas chunking, and render-on-demand behavior.
- Add the archive and read-only historical canvases.

**Exit gate:** one eligible attempt holds at most one reservation, success converts only the owned live reservation into one permanent pixel, failure or expiry releases it, collisions cannot overwrite reservations or pixels, and all clients converge on authoritative canvas state after reconnect.

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
- Test representative phones and laptops, camera denial, missing landmarks, slow model loading, WebGL failure, simultaneous pose/canvas load, UTC rollover, reservation and completion races, heartbeat throttling, reconnects, offline recovery, cleared browser storage, and degraded performance.
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
| 2026-07-14 | A participant places a pixel only after successful session completion. | Superseded on 2026-07-16 |
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
| 2026-07-15 | The main-page CTA progresses from `START 30 SEC` to `PLACE YOUR PIXEL` to disabled `YOUR PIXEL IS LIVE`. | Superseded on 2026-07-16 |
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
| 2026-07-15 | Selecting an available canvas cell immediately submits the permanent pixel placement with no confirmation dialog or second click; the placement screen warns users in advance, and failed transactions preserve the entitlement. | Superseded on 2026-07-16 |
| 2026-07-15 | The internal project team is the sole MVP 1 Leader and has editorial responsibility for choosing, preparing, scheduling, and publishing the pixel artwork; participant submissions and community voting are post-MVP. | Confirmed |
| 2026-07-16 | MVP 1 uses a pixel-first challenge: after route, safety, and readiness requirements pass, selecting an available canvas cell atomically reserves it and triggers the three-second countdown; there is no separate start or post-completion placement action. | Confirmed |
| 2026-07-16 | The owned reservation pulses and remains labelled on the shared canvas throughout the challenge. Success atomically records completion and locks that coordinate as a permanent pixel; failure, abandonment, expiry, reset, or lost ownership removes it. | Confirmed |
| 2026-07-16 | The active challenge keeps a slightly zoomed-out shared canvas visible beside the timer, textual form-validation state, and compact local camera preview on desktop; mobile keeps the canvas above the challenge panel. | Superseded by the vertical main-page composition on 2026-07-16 |
| 2026-07-16 | The canonical active main page uses one vertical composition: live/daily/reset counts at the top; timer, validated pose, grace state, and on-device notice above the centered shared canvas; anonymous and owned pulses within the canvas; and streak at the lower edge. Responsive layouts preserve this order. | Confirmed |
| 2026-07-16 | Anonymous realtime presence is included in MVP 1: active reservations pulse, committed pixels lock, released reservations disappear, and clients show an aggregate active count without exposing identity, exact personal timers, camera state, form state, or completion method. | Confirmed |
| 2026-07-16 | Product presence is synchronized from authoritative reservation lifecycle events. Each participant and coordinate may have at most one active reservation; server expiry and heartbeat renewal prevent abandoned cells from remaining blocked. | Confirmed |
| 2026-07-16 | Initial reservation timing defaults to a heartbeat every 10 seconds, expiry 30 seconds after the latest accepted heartbeat, and an absolute deadline equal to target duration plus 180 seconds capped at 300 seconds; the public-pilot operating envelope must validate or revise these values. | Confirmed for implementation; pilot validation required |
| 2026-07-17 | Successful daily duration progression increases the next target by two seconds rather than five, while retaining the 120-second hard ceiling. | Confirmed |

</details>
