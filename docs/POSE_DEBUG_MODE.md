# Pose estimation visual logging

Pose Visual Log and the State Simulator are optional development-only diagnostics. They are available only when SvelteKit is running in development mode and `PUBLIC_ENABLE_POSE_DEV_TOOLS=true`. They are never rendered or runnable in production builds.

## Start a logging session

1. Set `PUBLIC_ENABLE_POSE_DEV_TOOLS=true` in `apps/web/.env`.
2. Run `npm run dev` from the repository root. Restart the development server after changing the flag.
3. Open the app in a Chromium-based browser such as Edge or Chrome on `localhost` or HTTPS.
4. Acknowledge the safety notice, keep **Camera mode** selected, and choose an available pixel.
5. When camera positioning begins, find **POSE VISUAL LOG** in the developer tools panel.
6. Select **START VISUAL LOG** and choose a local parent folder. The app creates a timestamped `pose-debug-*` subfolder.
7. Complete framing and the plank attempt. Use **CAPTURE NOW** for an additional evidence frame when needed.
8. Select **STOP + MANIFEST**. Completion, release, camera failure, or switching to the guided demo also stops the session automatically.

If the browser does not support directory selection, the logger falls back to individual browser downloads. Browser download protections may require permission for multiple files; Edge or Chrome with a selected directory is the recommended workflow.

## What is captured

Automatic capture occurs:

- On the first analyzed pose frame.
- Immediately when the workout phase changes.
- When a diagnostic label remains stable for 400 ms, filtering single-frame confidence flicker.
- Every 2.5 seconds while the state remains stable.
- Up to 240 screenshots per session. Reaching the limit no longer ends the logging session, so the manifest can still be exported explicitly.

Initial-framing images distinguish `MOVE CLOSER`, `MOVE BACK`, directional positioning, `HOLD STILL`, and `FRAMING READY`. Plank-analysis images distinguish good form, tracking loss, hips high/low, knee extension, neck alignment, shoulder position, and elbow alignment.

Every PNG contains:

- The camera frame in raw camera orientation.
- MoveNet keypoints and connecting bones.
- The side selected by the pose engine highlighted in green.
- Hip, elbow, knee, and neck angles beside their corresponding joints.
- The current model diagnostic.
- Framing, confidence, occupancy, normalized hip offset, shoulder stack, model, phase, and pose-rule version.

Every PNG has a JSON file with the same basename. JSON records contain the timestamp, capture reason, keypoints, computed features, framing quality, selected correction, model name, and configuration version. `session-manifest.json` lists the complete session and stop reason.

The camera video remains mounted off-screen after positioning so the same stream and inference scheduler continue through countdown, active exercise, correction grace, and paused states. The tracking gate tolerates one marginal-confidence landmark and bridges confidence gaps up to 250 ms; longer or broader losses are still reported as tracking loss. Edge clipping is evaluated before body occupancy, preventing a cropped close-up from being mislabeled as too far away.

## Evidence review workflow

Use consented test participants and deliberately capture:

1. Too far away, too close, off-center, stable framing, and tracking loss.
2. Valid plank form from both facing directions.
3. Hips too high and too low.
4. Bent knees, neck misalignment, shoulder displacement, and elbow misalignment.
5. Correction recovery and timer resumption.

Review whether the skeleton remains aligned with the participant, displayed angles change in the expected direction, diagnostic changes are temporally stable, and the production UI matches the JSON/PNG record. Record device, browser, camera resolution, lighting, clothing, participant consent, expected label, observed label, and reviewer decision outside the captured image.

## Privacy and limitations

- Starting visual logging is always an explicit developer action.
- Files are written only to a user-selected local folder or browser downloads. The application does not upload debug screenshots or pose records.
- Captures contain identifiable camera images and body landmarks. Obtain participant consent, restrict access, define a retention period, and never commit them to the repository.
- Visual logs demonstrate what the model and rule engine observed. They do not establish medical safety, clinical validity, injury prevention, or broad pose accuracy across people and environments.
- The logger uses raw camera orientation so MoveNet coordinates align directly with saved pixels. The participant preview remains mirrored for usability.
