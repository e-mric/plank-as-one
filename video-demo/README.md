# Build Week demo video

This folder produces the canonical narrated demo without modifying participant progress. The capture uses the application's isolated guided-demo route and Playwright video recording.

## 1. Generate the Eleven v3 narration

Give [`narration-eleven-v3.txt`](./narration-eleven-v3.txt) to Eleven v3 in Higgsfield. Export clean speech with no music as WAV or a high-quality MP3. Do not include the voice-direction lines or bracketed delivery cues in the spoken text. Listen for the exact product name, `TensorFlow.js`, `MoveNet`, `SvelteKit`, `Supabase`, `Codex`, and `GPT-5.6`.

The approved clean take is `input/narration-final.mp3`: 2:40.84, 44.1 kHz mono MP3. It is used directly; do not run the legacy pause-removal/tempo preparation step on this take.

The final asset ledger must record the generated narration platform, generation date, voice/preset, permission, and confirmation that no unauthorized cloned voice was used.

## 2. Capture the guided demo with Playwright

From the repository root, start the latest local application:

```powershell
npm.cmd run dev -- --host 127.0.0.1
```

In another terminal:

```powershell
Set-Location video-demo
npm.cmd install
npx.cmd playwright install chromium
npm.cmd run capture
```

Override `DEMO_URL` when capturing another approved deployment. The default is `http://127.0.0.1:5173/?demo=1`. The result is `work/guided-demo-capture.webm`.

The approved capture contained a redundant hold on the first guided tip while the page finished hydrating. Remove only that duplicate interval while preserving every demonstrated state and editorial card:

```powershell
npm.cmd run conform -- work/guided-demo-capture.webm work/guided-demo-conformed.mp4 25 58
npm.cmd run conform -- work/guided-demo-conformed.mp4 work/guided-demo-final-audio.mp4 144 157
```

## 3. Assemble the canonical MP4

Set `FFMPEG_PATH` and `FFPROBE_PATH` when the binaries are not on `PATH`, then run:

```powershell
npm.cmd run assemble -- work/guided-demo-final-audio.mp4 input/narration-final.mp3 dist/plank-as-one-build-week-demo.mp4
```

The assembler normalizes speech to approximately -16 LUFS, produces 1920×1080 H.264 video and 48 kHz stereo AAC audio, adds fast-start metadata, and refuses a capture shorter than the narration.

For timing experiments only, `scripts/generate-placeholder-tts.ps1` creates a local Windows synthetic WAV. Do not publish that placeholder as the approved Eleven narration.

## 4. Run QA

```powershell
npm.cmd run qa -- dist/plank-as-one-build-week-demo.mp4
```

QA writes `qa/ffprobe.json`, `qa/report.json`, ten-second sampled frames, and `qa/contact-sheet.jpg`. It checks duration, resolution, codecs, audio presence, sample rate, and black segments. A human must still review narration alignment, visual quality, dead air, repeated scenes, unsupported claims, privacy, and media rights.

The official Build Week rules require a clear English demo with audio, under three minutes, publicly visible on YouTube. Upload and public-link verification remain an entrant action. The official submission deadline shown on 2026-07-22 was July 21, 2026 at 5:00 p.m. PDT; post-deadline replacement is only possible if Devpost/OpenAI permits it.
