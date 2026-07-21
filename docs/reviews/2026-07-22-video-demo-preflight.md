# Video demo preflight — 2026-07-22

Review type: demo preflight

Review date/time/timezone: 2026-07-22 CEST (Europe/Brussels)

Rules checked date/time/timezone: 2026-07-22 CEST

Reviewer(s): Codex technical and claims review

Commit SHA/tag: pending final media and release commit

Deployment URL: https://plank-as-one.vercel.app

YouTube URL: pending

## Result

P0 PASS:

- The planned English narration is 333 words and covers the product, audience, guided demo, Codex and GPT-5.6 use, implementation decisions, potential impact, and differentiation.
- The narration-aligned shot plan targets 2:58 and explicitly labels the guided journey as isolated simulated pose data that changes no real progress.
- The Playwright capture script uses only the production guided-demo states plus clearly separate editorial title/architecture cards.
- Spoken technical and privacy claims are supported by the application code, tests, README, Supabase migration, and deployment review. The script makes no clinical, universal-accuracy, or guaranteed-outcome claim.
- The ffmpeg assembly and QA pipeline passed a synthetic timing-voice dry run at 159.17 seconds: 1920×1080 H.264 video, stereo 48 kHz AAC audio, no black segment, and only a 1.55-second final tail silence.
- The supplied Eleven v3 MP3 was technically inspected: 206.37 seconds, 44.1 kHz mono MP3 at 128 kb/s, approximately -13.7 LUFS integrated with a -0.5 dBFS true peak. The reproducible preparation step reduces it to 177.00 seconds by tightening long pauses and applying a mild 1.085x tempo adjustment.
- The final encoding pipeline passed a second dry run using that prepared Eleven narration. The resulting 177.80-second test file passed every automated check: 1920×1080 H.264 High video, stereo 48 kHz AAC audio, duration below three minutes, no detected black segment, and no detected silence longer than 1.5 seconds. Its synthetic picture is test-only and is not the canonical demo.

P0 FAIL: none in the completed preflight scope.

P0 BLOCKED:

- No controllable browser was attached to this Codex environment, so the real Playwright guided-demo capture could not be executed or visually reviewed.
- The supplied Eleven v3 narration has not yet received a human pronunciation and pacing approval after the timing edit, and no final picture exists for alignment review.
- No canonical final MP4 or public YouTube URL exists yet.
- The official page rechecked on 2026-07-22 lists the submission deadline as 2026-07-21 17:00 PDT. A new or replacement video can affect the judged submission only if OpenAI/Devpost expressly permits it; otherwise it is a portfolio artifact.

P1 findings:

- The narration asset is recorded in the asset ledger as conditional until the team supplies the voice/preset, confirms it was not an unauthorized cloned voice, and approves the prepared master.
- The final contact sheet and sampled frames require human review for framing, legibility, repeated scenes, personal data, browser chrome, and media rights.
- The final public YouTube link must be tested signed out and the video must remain consistent with the deployed commit.

Evidence reviewed:

- `video-demo/narration-eleven-v3.txt`
- `video-demo/shot-plan.md`
- `video-demo/scripts/capture-guided-demo.mjs`
- `video-demo/scripts/assemble-video.mjs`
- `video-demo/scripts/qa-video.mjs`
- Synthetic pipeline output and generated `ffprobe.json`, QA report, sampled frames, and contact sheet (ignored working artifacts)
- OpenAI Build Week Official Rules and FAQ rechecked on 2026-07-22

Required actions, owner, deadline:

- Project team: listen to and approve `video-demo/input/narration-ready.wav`, record the Eleven voice/preset, and confirm that no unauthorized cloned voice was used.
- Project team/Codex with an attached browser: run the Playwright capture against the exact approved build.
- Codex: assemble the canonical MP4 and perform automated plus visual QA on the final assets.
- Team Representative: confirm whether post-deadline video changes are permitted and, if permitted, upload publicly to YouTube and verify the signed-out link.

Decision: **NO-GO for publication until the real capture, approved narration, canonical MP4, visual QA, and public-link checks are complete.**

Representative approval: pending.
