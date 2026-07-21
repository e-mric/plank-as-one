# Video demo final-media review — 2026-07-22

Review type: canonical demo media

Review date/time/timezone: 2026-07-22 CEST (Europe/Brussels)

Application commit shown: `1766e6f2e6e2f1b033e14205b5a583de06594519`

Deployment URL: https://plank-as-one.vercel.app

YouTube URL: pending

Canonical file: `video-demo/dist/plank-as-one-build-week-demo.mp4`

SHA-256: `CA41167CF4194B93CA6CB87744CB46D78009902108DFC08FFF6F35454BB81328`

## Result

P0 PASS:

- The final Playwright capture demonstrates the isolated eight-tip guided demo: pixel selection, framing, countdown, valid form, hips-low correction, hips-high correction, out-of-frame pause, recovery, and completion.
- Redundant holds on the first tip and Codex card were removed without deleting or reordering any demonstrated state. Both conforms are reproducible with `video-demo/scripts/conform-capture.mjs`.
- The final narration covers the product and audience, Codex and GPT-5.6 use, implementation decisions, impact, and differentiation. Technical and privacy claims match the reviewed application and repository evidence.
- The clean Eleven take omits the voice-direction text and bracketed delivery cues that were spoken by the superseded take.
- The canonical MP4 is 161.636 seconds, 1920×1080, 30 fps H.264 High, with stereo 48 kHz AAC audio. It is below the three-minute limit and includes fast-start metadata.
- Final speech measures approximately -15.6 LUFS integrated, 2.9 LU loudness range, and -2.2 dBFS true peak.
- Automated QA detected no black segment and no silence longer than 1.5 seconds.
- The complete 16-frame contact sheet and selected full-resolution frames were visually reviewed. Text and sprites are sharp; the UI is correctly framed; every editorial card appears; the ending remains on-screen through the final narration; no browser chrome, notifications, camera footage, or personal data appears.
- No accidental repeated scene remains after conforming. Intentional card holds support the corresponding narration sections.
- No third-party music, footage, logo, or mark is visible. The application sprite rights basis remains recorded separately in `ASSET_LICENSES.md`.

P0 FAIL: none in the canonical local media.

P0 BLOCKED:

- The project team must listen to the exact canonical MP4 and approve pronunciation, pacing, and narration-to-picture alignment; visual timing was checked against the approved script and shot plan, but this environment cannot perform a human listening judgment.
- The team must record the Eleven voice/preset and confirm that no unauthorized cloned voice was used.
- No public YouTube URL has been supplied or verified signed out.
- The official page rechecked on 2026-07-22 listed the submission deadline as 2026-07-21 17:00 PDT. The team must confirm whether a post-deadline video replacement is accepted.

Evidence reviewed:

- `video-demo/dist/plank-as-one-build-week-demo.mp4`
- `video-demo/qa/ffprobe.json`
- `video-demo/qa/report.json`
- `video-demo/qa/contact-sheet.jpg`
- `video-demo/qa/frames/sample-*.jpg`
- `video-demo/narration-eleven-v3.txt`
- `video-demo/shot-plan.md`
- Capture, conform, narration preparation, assembly, and QA scripts
- Application source, tests, README, Supabase migration, deployment review, and asset ledger

Decision: **GO for team listening review and YouTube upload. Publication approval remains conditional on voice-rights confirmation, human audio approval, signed-out public-link verification, and any required post-deadline permission.**

Representative approval: pending.
