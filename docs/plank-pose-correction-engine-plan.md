# Real-Time Plank Pose Correction Engine

## Technical implementation plan

The recommended implementation is a hybrid feedback system: a large pixel-art avatar for occasional glances, directional audio for immediate corrections, and a deterministic client-side rule engine built on MoveNet. The screen should never require continuous attention.

> This engine provides general exercise-form guidance. It is not a medical assessment and must not diagnose injury, pain, or health conditions. When pose data is uncertain, the system should stop crediting time and report tracking uncertainty rather than guessing.

## 1. Product behavior

Use the following exercise states:

```text
SETUP
  ↓
READY
  ↓ pixel selected
3-SECOND COUNTDOWN
  ↓
VALID ←──────────────┐
  ↓ form breaks      │ form recovers
CORRECTION GRACE ────┘
  ↓ invalid for 5 s
PAUSED
  ↓ form recovers
VALID
  ↓ target reached
COMPLETE
```

Tracking loss is separate from bad form:

- Stop crediting time immediately.
- Ignore tracking gaps shorter than 500 ms in the visible interface to avoid flicker.
- After 500 ms, show `MOVE INTO FRAME`.
- Do not apply the five-second correction grace period to tracking loss.

This behavior aligns with the current Plank As One PRD.

## 2. At-a-glance pixel-art feedback

The visual feedback area should occupy approximately 30–40% of the visible screen height during the challenge. It must remain readable from roughly eight feet away.

### Primary display

Show only:

- The credited timer.
- One oversized pixel character.
- One corrective instruction.
- One oversized directional indicator.
- The shared canvas beneath it.

Avoid displaying skeletons, joint angles, confidence percentages, or several simultaneous corrections during a real session.

### State presentation

| State | Character | Color | Instruction |
|---|---|---|---|
| Ready | Kneeling pose | Muted coral | `GET READY` |
| Valid | Perfect plank | Coral with green outline | `FORM VALIDATED` |
| Hips too low | Bad plank | Amber/red hip zone | `HIPS UP ↑` |
| Hips too high | Bad plank | Amber/red hip zone | `HIPS DOWN ↓` |
| Shoulder position | Bad plank | Highlight shoulder | `SHIFT FORWARD →` |
| Elbow position | Bad plank | Highlight arm | `ELBOWS UNDER SHOULDERS` |
| Tracking lost | Faded silhouette | Muted coral | `MOVE INTO FRAME` |
| Complete | Celebrating pose | Coral/green pulse | `PIXEL LOCKED` |
| Failed or ended | Exhausted pose | Muted coral | `PIXEL RELEASED` |

### Corrective indicators

Combine three signals:

1. Highlight the affected body region.
2. Show an oversized arrow indicating the corrective direction.
3. Show a maximum of three words whenever possible.

Example:

```text
       HIPS UP
          ↑
    [pixel character]
```

Recommended responsive sizes:

```css
.feedback-arrow {
  font-size: clamp(64px, 14vh, 150px);
}

.feedback-label {
  font-size: clamp(22px, 5vw, 54px);
}

.pose-avatar {
  max-height: clamp(160px, 32vh, 340px);
}
```

Do not rely solely on color. Each error must have a distinct arrow, label, and optional audio signature.

### Correction arbitration

Never show several errors at once. Select one correction according to this priority:

1. Tracking loss.
2. Hips and back alignment.
3. Shoulder-over-elbow alignment.
4. Elbow angle.
5. Knee extension.
6. Neck alignment.

Keep the selected correction visible for at least 750 ms unless tracking is lost. This prevents rapid switching between instructions such as `HIPS UP` and `ELBOWS BACK`.

## 3. Audio design

Use a hybrid design rather than purely continuous or purely verbal feedback:

- A quiet, stable 8-bit pulse indicates valid form.
- A short directional earcon plays when an error begins.
- A spoken instruction plays only if the error persists.
- Repeated prompts have a cooldown of at least three seconds.
- Audio can be muted independently of visual feedback.

### Directional earcons

Use pitch direction to mirror the required movement:

| Correction | Earcon |
|---|---|
| Hips up | Two ascending notes |
| Hips down | Two descending notes |
| Shift forward | Quick low-to-high tonal sweep |
| Shift back | Quick high-to-low tonal sweep |
| Tracking lost | Three descending square-wave notes |
| Valid again | Soft major two-note confirmation |
| Complete | Short celebratory 8-bit sequence |

After approximately 1–1.5 seconds of continued error, add one concise voice prompt:

- “Hips up.”
- “Hips down.”
- “Shift forward.”
- “Move into frame.”

Avoid a continuously harsh or dissonant error sound. It can become fatiguing, increase stress, and obscure spoken instructions. If using an ambient layer, change it subtly—such as slight detuning or loss of rhythm—while keeping the earcon as the primary signal.

The Web Audio API can provide low-latency synthesis. `AudioWorklet` is available for custom processing on a separate audio thread and generally requires HTTPS. Initialize the audio context following a user action such as `I UNDERSTAND`, because browsers restrict autoplay.

References: [Using the Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Using_Web_Audio_API) and [AudioWorklet](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorklet).

## 4. Safe setup flow

### Step 1: Preparation

Show:

```text
PLACE YOUR LAPTOP ON A STABLE SURFACE

Use a clear exercise area.
Position the camera from the side.
Make sure your full body can be seen.
```

Camera access must begin only after the participant chooses Camera mode. Deployed camera access requires HTTPS. See [MDN: `getUserMedia()`](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia).

### Step 2: Camera permission

Request a moderate resolution:

```ts
navigator.mediaDevices.getUserMedia({
  audio: false,
  video: {
    width: { ideal: 960 },
    height: { ideal: 540 },
    frameRate: { ideal: 30, max: 30 },
    facingMode: 'user'
  }
});
```

Avoid requesting 1080p by default. Pose inference does not need it, and it increases camera, GPU, memory, and battery costs.

### Step 3: Framing guide

Display a large horizontal pixel silhouette over the camera preview.

Require:

- One person only.
- Shoulder, elbow, wrist, hip, knee, and ankle visible on at least one side.
- Body bounding box reasonably centered.
- At least 8% margin around the estimated body.
- Horizontal body occupancy of approximately 55–90% of the frame.
- Stable keypoints for 800 ms.
- No required landmark below the configured confidence threshold.

Possible instructions:

```text
MOVE BACK
MOVE CLOSER
TURN SIDEWAYS
MOVE LEFT
SHOW YOUR FEET
CAMERA TOO LOW
```

### Step 4: Side selection

Calculate the mean confidence for each side:

```ts
leftScore = mean(
  leftShoulder,
  leftElbow,
  leftWrist,
  leftHip,
  leftKnee,
  leftAnkle
);

rightScore = mean(
  rightShoulder,
  rightElbow,
  rightWrist,
  rightHip,
  rightKnee,
  rightAnkle
);
```

Use the side with the higher stable score. Do not switch sides unless the alternative is better for at least one second.

### Step 5: Audio check

Show:

```text
AUDIO FEEDBACK ON

[ PLAY TEST SOUND ]   [ MUTE ]
```

Initialize `AudioContext` here while the action is associated with a user gesture.

### Step 6: Ready detection

Show the kneeling pose. Once the body is fully visible and stable:

```text
READY
SELECT A PIXEL TO BEGIN
```

Pixel selection reserves the pixel and starts the existing three-second countdown.

## 5. Pose-detection architecture

### Recommended model

Use MoveNet SinglePose Lightning as the MVP default:

```text
@tensorflow-models/pose-detection
@tensorflow/tfjs-core
@tensorflow/tfjs-converter
@tensorflow/tfjs-backend-webgl
@tensorflow/tfjs-backend-wasm
```

MoveNet returns 17 keypoints. Lightning prioritizes latency; Thunder prioritizes accuracy. Official benchmarks report real-time performance on many modern devices, although this project must benchmark its own browser and device matrix. See the [official MoveNet documentation](https://github.com/tensorflow/tfjs-models/blob/master/pose-detection/src/movenet/README.md).

```ts
const detector = await poseDetection.createDetector(
  poseDetection.SupportedModels.MoveNet,
  {
    modelType:
      poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
    enableSmoothing: true
  }
);
```

MoveNet is a good fit because:

- The application expects one participant.
- Its 17 points include every joint needed for a side-view plank.
- The existing PRD already selects TensorFlow.js and MoveNet.
- Lightning is optimized for latency-sensitive browser use.

BlazePose is a reasonable later experiment because it supplies 33 landmarks and 3D landmarks, but it increases processing and integration complexity. The TensorFlow pose API supports MoveNet, BlazePose, and PoseNet. See the [official pose-detection API](https://github.com/tensorflow/tfjs-models/blob/master/pose-detection/README.md).

### Runtime pipeline

```text
Webcam video
    ↓
Frame scheduler
    ↓
MoveNet adapter
    ↓
Landmark quality gate
    ↓
Temporal smoother
    ↓
Side selector
    ↓
Feature extractor
    ↓
Rule evaluator
    ↓
Correction arbitrator
    ↓
Session state machine
    ├── Timer
    ├── Pixel avatar
    └── Audio feedback
```

### Frame scheduling

Use `requestVideoFrameCallback` when available, with an in-flight guard:

```ts
let inferenceRunning = false;

async function processFrame(now: number) {
  if (!inferenceRunning && shouldInfer(now)) {
    inferenceRunning = true;

    try {
      const poses = await detector.estimatePoses(video);
      poseController.accept(poses, now);
    } finally {
      inferenceRunning = false;
    }
  }

  video.requestVideoFrameCallback(processFrame);
}
```

Start at 20–30 inferences per second. Adapt downward if:

- p95 inference time exceeds 40 ms.
- Several frames are skipped.
- UI frame rate falls below the acceptance threshold.
- The shared canvas and TensorFlow compete for GPU resources.

Do not queue inference calls. If one is running, skip the frame.

### Lazy loading

Load TensorFlow.js and the model only when Camera mode begins:

```ts
const [poseDetection, tf] = await Promise.all([
  import('@tensorflow-models/pose-detection'),
  import('@tensorflow/tfjs-core')
]);
```

Dispose of the detector and stop all camera tracks when the session ends.

## 6. Landmark normalization

Let each landmark be:

```ts
type Landmark = {
  x: number;
  y: number;
  score: number;
};
```

Normalize coordinates to the video dimensions:

$$
p_i = \left(\frac{x_i}{W}, \frac{y_i}{H}\right)
$$

This makes the logic independent of camera resolution.

Use body proportions rather than raw pixels as the scale:

$$
L = \operatorname{median}
\left(
\|S-H\|,
\|H-K\|,
\|K-A\|
\right)
$$

Where:

- $S$ = shoulder.
- $H$ = hip.
- $K$ = knee.
- $A$ = ankle.

Every distance metric should be divided by $L$.

## 7. Temporal smoothing

MoveNet supports built-in smoothing, but rule-level smoothing is still useful.

For landmark $p_t$:

$$
\alpha = 1-e^{-\Delta t/\tau}
$$

$$
\hat p_t = \alpha p_t+(1-\alpha)\hat p_{t-1}
$$

Starting value:

```ts
const smoothingTimeConstantMs = 80;
```

Rules:

- Do not smooth across long tracking gaps.
- Do not manufacture positions for missing landmarks.
- Allow at most 150–200 ms of short-term landmark continuity.
- Treat prolonged low confidence as tracking loss.

Confidence values differ between models and are not calibrated across them, so thresholds require project-specific testing. The official API recommends application-specific confidence calibration. See the [TensorFlow pose API](https://github.com/tensorflow/tfjs-models/blob/master/pose-detection/README.md).

## 8. Mathematical correction logic

The values below are initial calibration hypotheses, not production-certified exercise thresholds. They require testing with consenting participants and review by a qualified exercise professional.

### Joint-angle function

For joints $A$, $B$, and $C$, with $B$ as the vertex:

$$
\theta =
\cos^{-1}
\left(
\frac{(A-B)\cdot(C-B)}
{\|A-B\|\|C-B\|}
\right)
$$

```ts
function angle(a: Point, b: Point, c: Point): number {
  const ba = { x: a.x - b.x, y: a.y - b.y };
  const bc = { x: c.x - b.x, y: c.y - b.y };

  const cosine =
    dot(ba, bc) /
    (magnitude(ba) * magnitude(bc));

  return Math.acos(clamp(cosine, -1, 1)) * 180 / Math.PI;
}
```

### Hip alignment

Project the hip onto the shoulder-to-knee line:

$$
t =
\frac{(H-S)\cdot(K-S)}
{\|K-S\|^2}
$$

$$
P = S+t(K-S)
$$

$$
d_h = \frac{\|H-P\|}{L}
$$

Use the direction of $H-P$ to distinguish:

- Hip below the shoulder–knee line: hips sagging.
- Hip above the line: hips too high.

Initial bands:

```text
Good:      dₕ ≤ 0.06
Warning:   0.06 < dₕ ≤ 0.10
Incorrect: dₕ > 0.10
```

Also calculate:

$$
\theta_{hip} = \angle(S,H,K)
$$

Initial secondary check:

```text
Good:      θhip ≥ 165°
Warning:   155°–165°
Incorrect: θhip < 155°
```

The signed line offset should determine `HIPS UP` versus `HIPS DOWN`; the joint angle is supporting evidence.

### Shoulder over elbow

Approximate the floor axis from elbow to ankle:

$$
f = \frac{A-E}{\|A-E\|}
$$

Measure shoulder displacement along that axis:

$$
d_s = \frac{(S-E)\cdot f}{L}
$$

Initial bands:

```text
Good:      |dₛ| ≤ 0.10
Warning:   0.10 < |dₛ| ≤ 0.16
Incorrect: |dₛ| > 0.16
```

The sign indicates whether the shoulder is shifted toward the feet or beyond the elbow toward the head.

This supports the common forearm-plank instruction to keep the elbows beneath the shoulders and the body in a straight line. See [ACE forearm-plank guidance](https://www.acefitness.org/resources/pros/expert-articles/6073/5-yoga-poses-to-strengthen-the-shoulders/).

### Elbow angle

$$
\theta_{elbow} = \angle(S,E,W)
$$

Initial bands:

```text
Good:      75°–110°
Warning:   65°–75° or 110°–120°
Incorrect: <65° or >120°
```

### Knee extension

$$
\theta_{knee} = \angle(H,K,A)
$$

Initial bands:

```text
Good:      ≥160°
Warning:   150°–160°
Incorrect: <150°
```

### Neck alignment

When the ear landmark is reliable:

$$
\theta_{neck} = \angle(Ear,S,H)
$$

Initial bands:

```text
Good:      ≥155°
Warning:   145°–155°
Incorrect: <145°
```

Neck feedback should have lower priority and be disabled whenever ear confidence is insufficient. Neutral head and neck alignment is consistent with clinical exercise guidance, but 2D webcam detection cannot assess discomfort or injury. See [Mayo Clinic core-exercise guidance](https://www.mayoclinic.org/healthy-lifestyle/fitness/in-depth/core-strength/art-20546851).

## 9. Hysteresis and timing

A raw threshold must never directly control the timer.

For every rule, define:

```ts
type RuleThreshold = {
  enterError: number;
  leaveError: number;
  enterDurationMs: number;
  recoveryDurationMs: number;
};
```

Example:

```ts
const hipOffsetRule = {
  enterError: 0.10,
  leaveError: 0.06,
  enterDurationMs: 200,
  recoveryDurationMs: 300
};
```

Behavior:

- Enter the invalid state only after 200 ms beyond the bad threshold.
- Stay invalid until the metric is inside the recovery threshold for 300 ms.
- Do not repeatedly cross one boundary.
- Stop crediting time from the first confirmed invalid instant.
- Show the five-second correction grace countdown.
- Pause visibly if the error remains after five seconds.

## 10. Error severity and arbitration

Normalize every failed rule:

$$
severity_i =
\operatorname{clamp}
\left(
\frac{measurement_i-warning_i}
{invalid_i-warning_i},
0,1
\right)
$$

Then select one correction:

```ts
const activeCorrection = errors
  .filter((error) => error.confirmed)
  .sort((a, b) =>
    b.priority - a.priority ||
    b.severity - a.severity
  )[0];
```

Do not change the selected correction until:

- It is resolved.
- Tracking is lost.
- Another error remains substantially more severe for at least 750 ms.

## 11. Latency budget

| Stage | Budget |
|---|---:|
| Camera acquisition | 0–33 ms |
| Pose inference | 15–40 ms |
| Landmark smoothing | 80–120 ms |
| Error confirmation | 150–200 ms |
| Visual update | ≤16 ms |
| Audio scheduling | ≤30 ms |
| Total correction response | Approximately 300–440 ms |

The system may technically react faster, but sub-100 ms rule changes would make it sensitive to pose jitter. The goal is reliable feedback within 500 ms, not merely the fastest possible feedback.

## 12. Suggested implementation modules

```text
apps/web/src/lib/pose/
├── detector.ts
├── frame-scheduler.ts
├── landmarks.ts
├── side-selector.ts
├── smoothing.ts
├── geometry.ts
├── features.ts
├── rules.ts
├── correction-arbiter.ts
├── setup-machine.ts
├── session-machine.ts
├── audio-feedback.ts
├── visual-feedback.ts
├── config.ts
└── types.ts
```

Keep every threshold in one versioned configuration:

```ts
export const POSE_RULE_CONFIG = {
  version: 'movenet-plank-v1',
  minRequiredConfidence: 0.4,
  trackingDebounceMs: 500,
  correctionGraceMs: 5000,
  correctionLockMs: 750,
  rules: {
    hipOffset: { /* calibrated values */ },
    hipAngle: { /* calibrated values */ },
    shoulderStack: { /* calibrated values */ },
    elbowAngle: { /* calibrated values */ },
    kneeAngle: { /* calibrated values */ },
    neckAngle: { /* calibrated values */ }
  }
};
```

## 13. Validation plan

Before enabling real camera validation:

- Unit-test all geometric functions.
- Verify scale, translation, camera mirroring, and modest roll invariance.
- Test missing and low-confidence landmarks.
- Record consented landmark-only fixtures for valid and invalid poses.
- Never retain camera frames unless separate explicit research consent covers them.
- Run setup tests at approximately four, six, and eight feet.
- Test bright, dim, and backlit environments.
- Test both body directions.
- Test loose and dark clothing.
- Measure inference p50 and p95 on the required browser/device matrix.
- Have exercise-form thresholds reviewed by a qualified professional.
- Verify participants can identify the correction after a glance shorter than 500 ms.
- Verify audio-only participants can correct the intended error without seeing the screen.

## 14. Recommended implementation order

1. Build and unit-test the geometry functions.
2. Add MoveNet behind a lazy-loaded detector adapter.
3. Implement camera setup and landmark-quality gating.
4. Add smoothing and stable side selection.
5. Implement the versioned rule configuration and evaluator.
6. Connect the evaluator to the existing timer state machine.
7. Add single-correction arbitration.
8. Connect the existing pixel-art poses and oversized arrows.
9. Add earcons, voice prompts, mute controls, and cooldowns.
10. Add deterministic landmark fixtures and end-to-end guided-demo scenarios.
11. Measure performance and degrade inference frequency where required.
12. Conduct exercise-professional review and small consenting-participant testing before release.

## 15. Key references

- [TensorFlow.js pose-detection models](https://github.com/tensorflow/tfjs-models/blob/master/pose-detection/README.md)
- [MoveNet model configuration and browser performance](https://github.com/tensorflow/tfjs-models/blob/master/pose-detection/src/movenet/README.md)
- [MDN: `getUserMedia()`](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
- [MDN: Using the Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Using_Web_Audio_API)
- [MDN: AudioWorklet](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorklet)
- [ACE forearm-plank guidance](https://www.acefitness.org/resources/pros/expert-articles/6073/5-yoga-poses-to-strengthen-the-shoulders/)
- [Mayo Clinic core-exercise guidance](https://www.mayoclinic.org/healthy-lifestyle/fitness/in-depth/core-strength/art-20546851)

