<script lang="ts">
  import { onMount, tick as svelteTick } from 'svelte';
  import { dev } from '$app/environment';
  import { env } from '$env/dynamic/public';
  import { applySharedCanvasSnapshot, createGuidedDemoState, createInitialState, reduce, GRID_WIDTH } from '$lib/state.js';
  import { createSharedCanvasService, getSharedCanvasConfig } from '$lib/shared-canvas.js';
  import { createMoveNetDetector } from '$lib/pose/detector.js';
  import { startPoseInference } from '$lib/pose/frame-scheduler.js';
  import { CAMERA_CONSTRAINTS, describeFraming, getCameraErrorMessage } from '$lib/pose/setup-machine.js';
  import { createAudioFeedback } from '$lib/pose/audio-feedback.js';
  import { analyzePoseFrame, resetPoseAnalyzer } from '$lib/pose/engine.js';
  import { createSpriteStateMatcher } from '$lib/pose/sprite-matcher.js';
  import spriteStateData from '$lib/pose/sprite-states.json';
  import SpriteAvatar from '$lib/SpriteAvatar.svelte';
  import { addCompletionDay, calculateStreak, COMPLETION_DAYS_STORAGE_KEY, formatResetCountdown, normalizeCompletionDays } from '$lib/live-status.js';

  type Pixel = { id: number; status: string };
  type Action = { type: string; mode?: string; cellId?: number; form?: string; ms?: number; correction?: any; ready?: boolean };
  type DemoTipId = 'welcome' | 'positioning' | 'countdown' | 'active' | 'correction' | 'recovery' | 'complete';

  const spriteManifest: any = spriteStateData;
  const spriteFramesById: Map<string, any> = new Map<string, any>(spriteManifest.frames.map((frame: any) => [frame.id, frame]));
  const spriteMatcher = createSpriteStateMatcher(spriteManifest);
  const CELEBRATION_FRAME_SECONDS = 0.16;
  const celebrationFrames = ['celebrate-01', 'celebrate-02', 'celebrate-03'].map((id, index) => ({
    frame: spriteFramesById.get(id),
    alt: index === 2 ? 'Pixel-art athlete celebrating with both fists raised' : 'Pixel-art athlete celebrating after completing the plank',
  }));
  const DEMO_TIPS: Record<DemoTipId, { step: string; title: string; copy: string; action: string }> = {
    welcome: { step: 'TIP 1 OF 6', title: 'CHOOSE A PIXEL', copy: 'Select any outlined pixel in the shared artwork. The guided demo uses an isolated copy, so your choice will not reserve a real pixel.', action: 'LET ME CHOOSE' },
    positioning: { step: 'TIP 2 OF 6', title: 'GET INTO POSITION', copy: 'Camera mode normally waits until your full body is visible and stable. For this walkthrough, use the button below to simulate a ready plank.', action: 'SIMULATE READY POSITION' },
    countdown: { step: 'TIP 3 OF 6', title: 'HOLD READY', copy: 'The three-second countdown has started. Keep holding your position; the walkthrough will pause again when credited time begins.', action: 'CONTINUE COUNTDOWN' },
    active: { step: 'TIP 4 OF 6', title: 'WATCH LIVE FORM', copy: 'The timer advances only while form is valid. Try a simulated mistake to see the correction and five-cell grace period.', action: 'SIMULATE HIPS TOO LOW' },
    correction: { step: 'TIP 5 OF 6', title: 'FOLLOW THE CORRECTION', copy: 'The timer stops crediting time while the grace cells run down. Correct the highlighted form issue to resume.', action: 'CORRECT MY FORM' },
    recovery: { step: 'TIP 6 OF 6', title: 'COMPLETE THE PLANK', copy: 'Valid form restores the timer. Finish the isolated walkthrough to see the selected pixel lock into the canvas.', action: 'COMPLETE DEMO' },
    complete: { step: 'COMPLETE', title: 'YOUR DEMO PIXEL IS LIVE', copy: 'That was a simulation. No real progress, streak, daily count, or shared pixel was changed.', action: 'EXIT GUIDED DEMO' },
  };
  const PIXEL_LOGO_GLYPHS: Record<string, string[]> = {
    A: ['0011100', '0111110', '1100011', '1100011', '1111111', '1111111', '1100011', '1100011', '1100011'],
    E: ['1111111', '1111111', '1100000', '1100000', '1111110', '1111110', '1100000', '1111111', '1111111'],
    K: ['1100011', '1100110', '1101100', '1111000', '1110000', '1111000', '1101100', '1100110', '1100011'],
    L: ['1100000', '1100000', '1100000', '1100000', '1100000', '1100000', '1100000', '1111111', '1111111'],
    N: ['1100011', '1110011', '1110011', '1111011', '1101111', '1101111', '1100111', '1100111', '1100011'],
    O: ['0011100', '0111110', '1100011', '1100011', '1100011', '1100011', '1100011', '0111110', '0011100'],
    P: ['1111110', '1111111', '1100011', '1100011', '1111111', '1111110', '1100000', '1100000', '1100000'],
    S: ['0111111', '1111111', '1100000', '1100000', '0111110', '0011111', '0000011', '1111111', '1111110'],
  };
  const PIXEL_LOGO_SOLID_WORDS = ['PLANK', 'AS'];
  const PIXEL_LOGO_O_INTERIOR = Array.from({ length: 15 }, (_, index) => ({
    row: Math.floor(index / 3) + 3,
    column: (index % 3) + 3,
  }));

  let state: any = createInitialState();
  let interval: ReturnType<typeof setInterval>;
  let logoFillInterval: ReturnType<typeof setInterval>;
  let logoFillOrder = Array.from({ length: PIXEL_LOGO_O_INTERIOR.length }, (_, index) => index);
  let logoFilledCount = 0;
  let logoFillHoldTicks = 0;
  let videoEl: HTMLVideoElement;
  let cameraStream: MediaStream | null = null;
  let detector: { estimatePoses: (video: HTMLVideoElement) => Promise<any[]>; dispose: () => void } | null = null;
  let stopInference: (() => void) | null = null;
  let cameraStarting = false;
  let cameraRequestId = 0;
  let cameraStatus = 'idle';
  let cameraMessage = 'CAMERA STARTS AFTER PIXEL SELECTION';
  let matchedSpriteFrameId: string | null = null;
  let audioMuted = false;
  const audio = createAudioFeedback();
  let lastAudioCorrection = '';
  let guidedDemo = false;
  let demoReturnState: any = null;
  let demoTip: DemoTipId = 'welcome';
  let demoTipOpen = false;
  let sharedService: any = null;
  let sharedReady = false;
  let sharedActionPending = false;
  let sharedOwnedCellId: number | null = null;
  let sharedStatus = 'local';
  let canvasNotice = '';
  let heartbeatInterval: ReturnType<typeof setInterval>;
  let resetInterval: ReturnType<typeof setInterval>;
  let liveResetLabel = '--:--:--';
  let demoResetLabel = '--:--:--';
  let poseDebugSession: any = null;
  let poseDebugStatus: any = { active: false, captureCount: 0, outputMode: '', lastDiagnostic: '', lastFile: '', error: '' };

  $: active = ['positioning', 'countdown', 'active', 'grace', 'paused'].includes(state.stage);
  $: sessionComplete = Boolean(state.dailyCompleted || state.stage === 'complete');
  $: selectionLabel = state.existingDailyCompletion
    ? 'YOUR PIXEL IS ALREADY LIVE 🔥'
    : sessionComplete
      ? 'YOUR PIXEL IS LIVE 🔥'
      : state.lastOutcome === 'failed'
        ? 'SELECT YOUR PIXEL AGAIN'
        : 'SELECT YOUR PIXEL';
  $: resetLabel = guidedDemo ? demoResetLabel : liveResetLabel;
  $: activeDemoTip = DEMO_TIPS[demoTip];
  $: locked = state.stage !== 'ready' || sessionComplete;
  $: timerLabel = state.stage === 'countdown' ? String(Math.ceil(state.countdown)) : String(Math.floor(state.creditedMs / 1000)).padStart(2, '0');
  $: trackingVisible = state.form === 'tracking' && (state.trackingMs >= 500 || state.stage === 'paused');
  $: showFormFeedback = state.mode === 'camera' && ['positioning', 'countdown', 'active', 'grace', 'paused', 'complete'].includes(state.stage);
  $: formFeedbackLabel = state.lastOutcome === 'complete'
    ? state.demo ? 'DEMO COMPLETE' : 'POWER UP +2'
    : state.lastOutcome === 'failed'
      ? 'TOO BAD!'
      : state.stage === 'positioning'
        ? 'GET IN POSITION'
      : state.stage === 'countdown'
          ? 'HOLD READY'
      : trackingVisible
        ? 'HEY, COME BACK!'
        : state.correction?.label
          ? state.correction.label
          : state.form === 'hips-low'
            ? 'HIPS UP'
          : state.form === 'hips-high'
            ? 'HIPS DOWN'
            : state.stage === 'active'
              ? 'PERFECT FORM 🔥'
              : 'READY ?';
  $: graceSlots = state.lastOutcome === 'complete'
    ? 5
      : state.lastOutcome === 'failed' || ['ready', 'positioning', 'countdown', 'paused'].includes(state.stage) || trackingVisible
      ? 0
      : state.stage === 'grace'
        ? Math.max(0, 5 - Math.floor(state.graceMs / 1000))
        : 5;
  $: fallbackPose = state.lastOutcome === 'complete'
    ? { kind: 'celebrate', frameId: null, alt: 'Pixel-art athlete celebrating a completed plank' }
    : state.lastOutcome === 'failed'
      ? { kind: 'exhausted', frameId: 'celebrate-01', alt: 'Pixel-art athlete recovering after an incomplete plank' }
      : (state.stage === 'active' || state.stage === 'complete') && (state.form === 'valid' || (state.form === 'tracking' && !trackingVisible))
        ? { kind: 'perfect', frameId: 'forearm-plank-01', alt: 'Pixel-art athlete holding a forearm plank' }
    : state.form === 'hips-low' && (state.stage === 'grace' || state.stage === 'paused')
      ? { kind: 'hips-low', frameId: 'forearm-plank-knees-02', alt: 'Pixel-art athlete planking with hips too low' }
    : state.form === 'hips-high' && (state.stage === 'grace' || state.stage === 'paused')
      ? { kind: 'hips-high', frameId: 'forearm-plank-high', alt: 'Pixel-art athlete planking with hips too high' }
    : state.stage === 'grace' || state.stage === 'paused' || state.form !== 'valid'
      ? { kind: 'bad', frameId: 'lowering-02', alt: 'Pixel-art athlete with incorrect plank form' }
      : { kind: 'ready', frameId: 'kneel-02', alt: 'Pixel-art athlete getting into position' };
  $: pose = fallbackPose.kind === 'celebrate' || fallbackPose.kind === 'exhausted' || !matchedSpriteFrameId
    ? fallbackPose
    : { ...fallbackPose, frameId: matchedSpriteFrameId, alt: `Pixel-art athlete matching live pose state ${matchedSpriteFrameId}` };
  $: poseFrame = pose.frameId ? spriteFramesById.get(pose.frameId) : null;

  $: showCameraSetup = !guidedDemo && state.mode === 'camera' && state.stage === 'positioning';
  $: sharedStatusLabel = sharedStatus === 'live'
    ? ''
    : sharedStatus === 'connecting'
      ? 'SHARED CANVAS CONNECTING'
      : sharedStatus === 'error' || sharedStatus === 'offline'
        ? sharedReady ? '' : 'SHARED OFFLINE · LOCAL FALLBACK'
        : 'LOCAL MOCK DATA';

  function dispatch(action: Action) {
    const previous = state;
    state = reduce(state, action);
    if (!guidedDemo && previous.stage !== state.stage && state.stage === 'positioning') void startCamera();
    if (previous.mode === 'camera' && activeStage(previous.stage) && !activeStage(state.stage)) {
      stopCamera();
      if (dev && poseDebugSession?.active) void stopPoseDebugLogging(state.stage === 'complete' ? 'workout-complete' : 'session-ended');
    }
    if (state.stage === 'complete' && previous.stage !== 'complete') {
      stopCamera();
      if (!state.demo) recordLocalCompletion();
      void initializeAudio().then(() => audio.complete());
      if (!guidedDemo && sharedReady && sharedService && state.selectedCell !== null) {
        void commitSharedPixel(state.selectedCell, state.completionMethod);
      }
      if (guidedDemo) {
        demoTip = 'complete';
        demoTipOpen = true;
      }
    }
    if (guidedDemo && previous.stage === 'countdown' && state.stage === 'active') {
      demoTip = 'active';
      demoTipOpen = true;
    }
    const nextCorrectionKind = state.correction?.kind || '';
    if (nextCorrectionKind && nextCorrectionKind !== lastAudioCorrection) {
      lastAudioCorrection = nextCorrectionKind;
      void initializeAudio().then(() => audio.correction(state.correction));
    }
    if (!state.correction) lastAudioCorrection = '';
  }

  function activeStage(stage: string) {
    return ['positioning', 'countdown', 'active', 'grace', 'paused'].includes(stage);
  }

  function readCompletionDays() {
    try {
      return normalizeCompletionDays(JSON.parse(localStorage.getItem(COMPLETION_DAYS_STORAGE_KEY) || '[]'));
    } catch {
      return [];
    }
  }

  function syncLocalStreak() {
    state = { ...state, streak: calculateStreak(readCompletionDays()) };
  }

  function recordLocalCompletion() {
    const completionDays = addCompletionDay(readCompletionDays());
    try {
      localStorage.setItem(COMPLETION_DAYS_STORAGE_KEY, JSON.stringify(completionDays));
    } catch {
      // Streak persistence is best-effort when browser storage is unavailable.
    }
    state = { ...state, streak: calculateStreak(completionDays) };
  }

  async function ensurePoseDebugSession() {
    if (!dev) return null;
    if (!poseDebugSession) {
      const { createPoseDebugSession } = await import('$lib/pose/debug-session.js');
      poseDebugSession = createPoseDebugSession({
        minIntervalMs: 2500,
        stateChangeDwellMs: 400,
        maxCaptures: 240,
        onUpdate: (status: any = {}) => { poseDebugStatus = { ...status }; },
      });
      poseDebugStatus = { ...poseDebugSession.status };
    }
    return poseDebugSession;
  }

  async function startPoseDebugLogging() {
    try {
      const session = await ensurePoseDebugSession();
      if (session) await session.start();
    } catch (error: any) {
      poseDebugStatus = { ...poseDebugStatus, active: false, error: error?.message || 'Unable to start visual logging' };
    }
  }

  async function stopPoseDebugLogging(reason = 'manual') {
    if (!poseDebugSession?.active) return;
    await poseDebugSession.stop(reason);
  }

  async function capturePoseDebugNow() {
    if (!poseDebugSession?.active) return;
    await poseDebugSession.captureNow();
  }

  function describeSharedFailure(reason = '') {
    const labels: Record<string, string> = {
      'active-reservation': 'YOU ALREADY HAVE AN ACTIVE PIXEL',
      'cell-unavailable': 'THAT PIXEL WAS JUST TAKEN · CHOOSE ANOTHER',
      'reservation-conflict': 'RESERVATION COLLISION · CHOOSE ANOTHER',
      'reservation-lost': 'SHARED RESERVATION EXPIRED · TRY AGAIN',
      'completion-conflict': 'SHARED COMPLETION COULD NOT BE COMMITTED',
    };
    return labels[reason] || 'SHARED CANVAS UNAVAILABLE · USING LOCAL STATE';
  }

  function handleSharedSnapshot(rows: any[]) {
    sharedReady = true;
    const ownedCellId = sharedOwnedCellId ?? state.selectedCell;
    if (guidedDemo && demoReturnState) {
      demoReturnState = applySharedCanvasSnapshot(demoReturnState, rows, { ownedCellId });
      return;
    }
    let next = applySharedCanvasSnapshot(state, rows, { ownedCellId });
    if (!sharedActionPending && activeStage(state.stage) && state.selectedCell !== null) {
      const remoteStatus = rows.find((row) => row.cell_id === state.selectedCell)?.status;
      if (remoteStatus !== 'pending' && remoteStatus !== 'locked') {
        next = reduce(next, { type: 'end-session' });
        canvasNotice = 'SHARED RESERVATION EXPIRED · PICK A NEW PIXEL';
        sharedOwnedCellId = null;
        stopCamera();
      }
    }
    state = next;
  }

  async function selectSharedCell(cellId: number) {
    if (sharedActionPending || state.stage !== 'ready') return;
    canvasNotice = '';
    if (guidedDemo) {
      dispatch({ type: 'select-cell', cellId });
      if (state.stage === 'positioning') {
        demoTip = 'positioning';
        demoTipOpen = true;
      }
      return;
    }
    if (!sharedReady || !sharedService) {
      dispatch({ type: 'select-cell', cellId });
      return;
    }
    sharedActionPending = true;
    sharedOwnedCellId = cellId;
    try {
      const result = await sharedService.reserve(cellId);
      if (!result.ok) {
        sharedOwnedCellId = null;
        if (result.reason === 'already-completed') {
          dispatch({ type: 'mark-daily-completed' });
          await sharedService.refresh();
          return;
        }
        canvasNotice = describeSharedFailure(result.reason);
        await sharedService.refresh();
        return;
      }
      state = {
        ...state,
        cells: state.cells.map((cell: Pixel) => cell.id === cellId ? { ...cell, status: 'available' } : cell),
      };
      dispatch({ type: 'select-cell', cellId });
      await sharedService.refresh();
    } catch {
      sharedOwnedCellId = null;
      sharedStatus = 'error';
      canvasNotice = describeSharedFailure();
    } finally {
      sharedActionPending = false;
    }
  }

  async function endSharedSession() {
    const cellId = state.selectedCell;
    dispatch({ type: 'end-session' });
    sharedOwnedCellId = null;
    if (!sharedReady || !sharedService || cellId === null) return;
    try {
      await sharedService.release(cellId);
    } catch {
      sharedStatus = 'error';
    }
  }

  async function commitSharedPixel(cellId: number, completionMethod: string) {
    try {
      const result = await sharedService.commit(cellId, completionMethod);
      if (!result.ok) canvasNotice = describeSharedFailure(result.reason);
      else { sharedOwnedCellId = null; canvasNotice = ''; }
    } catch {
      sharedStatus = 'error';
      canvasNotice = 'WORKOUT COMPLETE · SHARED PIXEL COMMIT NEEDS RETRY';
    }
  }

  async function startCamera() {
    if (guidedDemo || cameraStarting || cameraStream || state.mode !== 'camera' || state.stage !== 'positioning') return;
    const requestId = ++cameraRequestId;
    cameraStarting = true;
    cameraStatus = 'requesting';
    cameraMessage = 'ALLOW CAMERA ACCESS';
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera API unavailable');
      cameraStream = await navigator.mediaDevices.getUserMedia(CAMERA_CONSTRAINTS);
      if (requestId !== cameraRequestId || state.stage !== 'positioning') {
        cameraStream.getTracks().forEach((track) => track.stop());
        cameraStream = null;
        return;
      }
      await svelteTick();
      if (!videoEl) throw new Error('Camera preview unavailable');
      videoEl.srcObject = cameraStream;
      await videoEl.play();
      detector = await createMoveNetDetector({ onStatus: (status: string) => { cameraStatus = status; } });
      const inferenceVideo = videoEl;
      stopInference = startPoseInference({
        video: inferenceVideo,
        detector,
        onPose: (poses: any[], now: number) => handlePose(poses, now, inferenceVideo),
        onError: () => {
          cameraStatus = 'error';
          cameraMessage = 'POSE TRACKING UNAVAILABLE';
          if (dev && poseDebugSession?.active) void stopPoseDebugLogging('inference-error');
        },
      });
      cameraStatus = 'ready';
    } catch (error) {
      cameraStatus = 'error';
      cameraMessage = getCameraErrorMessage(error);
      if (dev && poseDebugSession?.active) void stopPoseDebugLogging('camera-error');
      stopCamera(false);
    } finally {
      cameraStarting = false;
    }
  }

  function handlePose(poses: any[], now: number, inferenceVideo: HTMLVideoElement) {
    const poseResult = poses?.[0];
    const result = analyzePoseFrame(poseResult, {
      width: inferenceVideo.videoWidth || 1,
      height: inferenceVideo.videoHeight || 1,
      now,
    });
    if (dev && poseDebugSession?.active) {
      void poseDebugSession.observe({
        video: inferenceVideo,
        pose: poseResult,
        result,
        stage: state.stage,
        frameTimeMs: now,
      });
    }
    cameraMessage = result.setupMessage || describeFraming(result.quality);
    if (result.quality?.tracked && result.setupReady) cameraStatus = 'ready';
    if (result.tracking) {
      const spriteMatch = spriteMatcher.update(poseResult, {
        width: inferenceVideo.videoWidth || 1,
        height: inferenceVideo.videoHeight || 1,
        side: result.quality?.side || 'left',
        roles: state.stage === 'positioning' ? ['setup', 'plank'] : ['plank'],
        now,
      });
      if (spriteMatch?.id) matchedSpriteFrameId = spriteMatch.id;
    }
    if (state.stage === 'positioning') {
      if (result.setupReady) dispatch({ type: 'pose-update', ready: true, form: 'valid' });
      return;
    }
    if (!['countdown', 'active', 'grace', 'paused'].includes(state.stage)) return;
    const form = result.tracking ? result.form : 'tracking';
    const nextCorrection = result.correction || null;
    const currentKind = state.correction?.kind || '';
    if (form !== state.form || (nextCorrection?.kind || '') !== currentKind) {
      dispatch({ type: 'pose-update', form, correction: nextCorrection });
    }
  }

  function stopCamera(resetStatus = true) {
    cameraRequestId += 1;
    stopInference?.();
    stopInference = null;
    detector?.dispose();
    detector = null;
    cameraStream?.getTracks().forEach((track) => track.stop());
    cameraStream = null;
    resetPoseAnalyzer();
    spriteMatcher.reset();
    matchedSpriteFrameId = null;
    if (videoEl) videoEl.srcObject = null;
    if (resetStatus) {
      cameraStatus = 'idle';
      cameraMessage = 'CAMERA STARTS AFTER PIXEL SELECTION';
    }
  }

  async function initializeAudio() {
    try {
      return await audio.initialize();
    } catch {
      return false;
    }
  }

  function toggleMute() {
    audioMuted = !audioMuted;
    audio.setMuted(audioMuted);
  }

  function playTestSound() {
    void initializeAudio().then(() => audio.test());
  }
  function chooseMode(mode: string) { dispatch({ type: 'choose-mode', mode }); }
  function skipToCelebration() {
    let next = state;
    if (next.stage === 'positioning') next = reduce(next, { type: 'confirm-ready-position' });
    if (next.stage === 'countdown') next = reduce(next, { type: 'tick', ms: 3000 });
    if (['active', 'grace', 'paused'].includes(next.stage)) {
      if (next.mode === 'camera') next = reduce(next, { type: 'set-form', form: 'valid' });
      next = reduce(next, { type: 'tick', ms: next.target * 1000 });
    }
    state = next;
  }
  function handleDemoTipAction() {
    if (demoTip === 'welcome') {
      demoTipOpen = false;
      return;
    }
    if (demoTip === 'positioning') {
      dispatch({ type: 'confirm-ready-position' });
      demoTip = 'countdown';
      demoTipOpen = true;
      return;
    }
    if (demoTip === 'countdown') {
      demoTipOpen = false;
      return;
    }
    if (demoTip === 'active') {
      dispatch({ type: 'set-form', form: 'hips-low', correction: { kind: 'hips-low', label: 'HIPS UP', voice: 'Hips up.' } });
      demoTip = 'correction';
      demoTipOpen = true;
      return;
    }
    if (demoTip === 'correction') {
      dispatch({ type: 'set-form', form: 'valid' });
      demoTip = 'recovery';
      demoTipOpen = true;
      return;
    }
    if (demoTip === 'recovery') {
      demoTipOpen = false;
      dispatch({ type: 'tick', ms: Math.max(1, state.target * 1000 - state.creditedMs) });
      return;
    }
    exitGuidedDemo();
  }

  function launchGuidedDemo(withAudio: boolean) {
    const source = guidedDemo && demoReturnState ? demoReturnState : state;
    if (!guidedDemo) demoReturnState = state;
    if (dev && poseDebugSession?.active) void stopPoseDebugLogging('guided-demo-started');
    stopCamera();
    if (withAudio) void initializeAudio();
    demoResetLabel = liveResetLabel;
    guidedDemo = true;
    state = createGuidedDemoState(source, { autoStart: false });
    demoTip = 'welcome';
    demoTipOpen = true;
    if (!state.cells.some((cell: Pixel) => cell.status === 'available')) {
      demoTipOpen = false;
      return;
    }
  }

  function startGuidedDemo() {
    launchGuidedDemo(true);
  }

  function exitGuidedDemo() {
    stopCamera();
    if (demoReturnState) state = demoReturnState;
    const restartCamera = state.mode === 'camera' && state.stage === 'positioning';
    demoReturnState = null;
    guidedDemo = false;
    demoTip = 'welcome';
    demoTipOpen = false;
    demoResetLabel = '--:--:--';
    if (restartCamera) void startCamera();
  }

  function shuffleLogoFillOrder() {
    const next = Array.from({ length: PIXEL_LOGO_O_INTERIOR.length }, (_, index) => index);
    for (let index = next.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
    }
    return next;
  }

  onMount(() => {
    syncLocalStreak();
    liveResetLabel = formatResetCountdown();
    resetInterval = setInterval(() => { liveResetLabel = formatResetCountdown(); }, 1000);
    if (dev) void ensurePoseDebugSession().catch((error: any) => {
      poseDebugStatus = { ...poseDebugStatus, error: error?.message || 'Visual logger failed to load' };
    });
    const sharedConfig = getSharedCanvasConfig(env);
    if (sharedConfig) {
      sharedService = createSharedCanvasService(sharedConfig);
      void sharedService.connect({
        onSnapshot: handleSharedSnapshot,
        onStatus: (status: string) => { sharedStatus = status; },
      }).catch(() => {
        sharedReady = false;
        sharedStatus = 'error';
      });
    }
    interval = setInterval(() => {
      if ((!guidedDemo || !demoTipOpen) && ['countdown', 'active', 'grace'].includes(state.stage)) dispatch({ type: 'tick', ms: 250 });
    }, 250);
    heartbeatInterval = setInterval(() => {
      if (!guidedDemo && sharedReady && sharedService && activeStage(state.stage) && state.selectedCell !== null) {
        void sharedService.renew(state.selectedCell).then((result: any) => {
          if (!result.ok) void sharedService.refresh();
        }).catch(() => { sharedStatus = 'error'; });
      }
    }, 10000);
    const abandonHonor = () => {
      if (document.visibilityState === 'hidden' && state.mode === 'honor' && active) void endSharedSession();
    };
    document.addEventListener('visibilitychange', abandonHonor);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      logoFilledCount = PIXEL_LOGO_O_INTERIOR.length;
    } else {
      logoFillOrder = shuffleLogoFillOrder();
      logoFillInterval = setInterval(() => {
        if (logoFilledCount < PIXEL_LOGO_O_INTERIOR.length) {
          logoFilledCount += 1;
          return;
        }
        logoFillHoldTicks += 1;
        if (logoFillHoldTicks < 7) return;
        logoFillOrder = shuffleLogoFillOrder();
        logoFilledCount = 0;
        logoFillHoldTicks = 0;
      }, 120);
    }
    if (new URL(window.location.href).searchParams.get('demo') === '1') launchGuidedDemo(false);
    return () => { clearInterval(interval); clearInterval(heartbeatInterval); clearInterval(resetInterval); clearInterval(logoFillInterval); document.removeEventListener('visibilitychange', abandonHonor); if (dev && poseDebugSession?.active) void poseDebugSession.stop('page-unload'); stopCamera(); audio.dispose(); void sharedService?.disconnect(); };
  });
</script>

<svelte:head>
  <title>Plank As One · shared daily challenge</title>
  <meta name="description" content="One plank. One pixel. One shared canvas." />
</svelte:head>

<main class="page" aria-label="Plank As One active main page">
  {#if guidedDemo && demoTipOpen}
    <section
      class:canvas-tip={demoTip === 'welcome' || demoTip === 'complete'}
      class="panel demo-tip"
      aria-labelledby="demo-tip-title"
    >
      <span class="demo-tip-progress">{activeDemoTip.step}</span>
      <h2 id="demo-tip-title">{activeDemoTip.title}</h2>
      <p>{activeDemoTip.copy}</p>
      <div class="safety-actions">
        {#if demoTip !== 'complete'}<button class="btn" on:click={exitGuidedDemo}>EXIT DEMO</button>{/if}
        <button class="btn primary" on:click={handleDemoTipAction}>{activeDemoTip.action}</button>
      </div>
    </section>
  {/if}
  <header class="status-row">
    <div class="mode-selector" role="group" aria-label="Challenge mode">
      <button
        class="chip mode-chip"
        class:selected={state.mode === 'camera'}
        aria-pressed={state.mode === 'camera'}
        disabled={guidedDemo || state.modeLocked || state.stage === 'safety' || sessionComplete}
        on:click={() => chooseMode('camera')}
      >Camera mode</button>
      <button
        class="chip mode-chip"
        class:selected={state.mode === 'honor'}
        aria-pressed={state.mode === 'honor'}
        disabled={guidedDemo || state.modeLocked || state.stage === 'safety' || sessionComplete}
        on:click={() => chooseMode('honor')}
      >Honor mode</button>
    </div>
    <div class="status-group"><span class="chip"><b>{state.todayCount}</b>&nbsp; TODAY</span><span class="chip">RESET&nbsp; {resetLabel}</span><span class="chip">STREAK&nbsp; <b>{state.streak}</b>&nbsp; DAYS</span></div>
  </header>

  <section class="hero" aria-label="Daily plank challenge">
    <h2 class="brand-logo" aria-label="Plank As One">
      <span class="brand-logo-lockup" aria-hidden="true">
        <span class="brand-logo-solid-group">
          {#each PIXEL_LOGO_SOLID_WORDS as word, wordIndex}
            <span class="brand-logo-word">
              {#each word.split('') as letter, letterIndex}
                <span class="brand-logo-letter solid">
                  {#each PIXEL_LOGO_GLYPHS[letter].join('') as pixel, pixelIndex}
                    <i
                      class:on={pixel === '1'}
                      style={`--logo-phase:${((wordIndex + 1) * 37 + (letterIndex + 1) * 19 + pixelIndex * 23) % 79}`}
                    ></i>
                  {/each}
                </span>
              {/each}
            </span>
          {/each}
        </span>
        <span class="brand-logo-word">
          {#each 'ONE'.split('') as letter, letterIndex}
            <span class:logo-o={letter === 'O'} class="brand-logo-letter outline">
              {#each PIXEL_LOGO_GLYPHS[letter].join('') as pixel, pixelIndex}
                <i
                  class:on={pixel === '1'}
                  style={`--logo-phase:${(53 + (letterIndex + 1) * 29 + pixelIndex * 31) % 79}`}
                ></i>
              {/each}
              {#if letter === 'O'}
                <span class="logo-o-random-fill">
                  {#each PIXEL_LOGO_O_INTERIOR as pixel, pixelIndex}
                    <i
                      class:filled={logoFillOrder.slice(0, logoFilledCount).includes(pixelIndex)}
                      style={`grid-row:${pixel.row};grid-column:${pixel.column}`}
                    ></i>
                  {/each}
                </span>
              {/if}
            </span>
          {/each}
        </span>
      </span>
    </h2>
    <h1 class="timer" aria-live="polite">{timerLabel}<small>/ {state.target}s</small></h1>
  </section>

  <div class="pose-stage">
    {#if !guidedDemo && state.mode === 'camera' && active}
      <section class:camera-runtime-hidden={!showCameraSetup} class="camera-setup" aria-label="Camera setup" aria-hidden={!showCameraSetup}>
        <div class="camera-preview-wrap">
          <video bind:this={videoEl} class="camera-preview" autoplay playsinline muted aria-label="Mirrored camera preview"></video>
          <div class="framing-guide" aria-hidden="true"><span></span></div>
          {#if cameraStatus === 'requesting' || cameraStatus === 'loading'}<div class="camera-loading">{cameraStatus === 'requesting' ? 'REQUESTING CAMERA' : 'LOADING POSE MODEL'}</div>{/if}
        </div>
        {#if showCameraSetup}
          <div class="camera-copy">
            <strong>{cameraMessage}</strong>
            <span>ONE PERSON · SIDE VIEW · FULL BODY VISIBLE</span>
            {#if cameraStatus === 'error'}<button class="btn" on:click={() => void startCamera()}>TRY CAMERA AGAIN</button>{/if}
            <button class="btn" on:click={startGuidedDemo}>VIEW GUIDED DEMO</button>
            <div class="audio-check">
              <span>AUDIO FEEDBACK {audioMuted ? 'MUTED' : 'ON'}</span>
              <button class="btn" on:click={playTestSound}>PLAY TEST SOUND</button>
              <button class="btn" on:click={toggleMute}>{audioMuted ? 'UNMUTE' : 'MUTE'}</button>
            </div>
          </div>
        {/if}
      </section>
    {/if}
    <section class="pose-slot" aria-label="Pixel person holding a plank">
      {#if pose.kind === 'celebrate'}
        <div class="celebration-sequence" role="img" aria-label={pose.alt}>
          {#each celebrationFrames as frame, index}
            <div
              class:celebration-final={index === celebrationFrames.length - 1}
              class="celebration-frame"
              style={`--celebration-delay:${index * CELEBRATION_FRAME_SECONDS}s;--celebration-duration:${celebrationFrames.length * CELEBRATION_FRAME_SECONDS}s`}
            >
              <SpriteAvatar atlas={spriteManifest.atlas} frame={frame.frame} alt={frame.alt} decorative={index < celebrationFrames.length - 1} />
            </div>
          {/each}
        </div>
      {:else if poseFrame}
        <div class="pose-visual">
          <div class={`sprite-avatar-shell ${pose.kind}`}><SpriteAvatar atlas={spriteManifest.atlas} frame={poseFrame} alt={pose.alt} /></div>
          {#if pose.kind === 'hips-low' || pose.kind === 'hips-high'}
            <span class="body-region-highlight" aria-hidden="true"></span>
          {/if}
        </div>
      {/if}
    </section>
    {#if dev && !guidedDemo && active && state.mode === 'camera' && state.stage !== 'countdown'}
      <aside class="dev-tools" aria-label="Developer form testing controls">
        <strong>POSE VISUAL LOG</strong>
        {#if poseDebugStatus.active}
          <span class="dev-log-status">REC {poseDebugStatus.captureCount} · {poseDebugStatus.outputMode === 'directory' ? 'LOCAL FOLDER' : 'DOWNLOADS'}</span>
          {#if poseDebugStatus.lastDiagnostic}<span class="dev-log-detail">{poseDebugStatus.lastDiagnostic}</span>{/if}
          <button class="btn" on:click={() => void capturePoseDebugNow()}>CAPTURE NOW</button>
          <button class="btn" on:click={() => void stopPoseDebugLogging('manual')}>STOP + MANIFEST</button>
        {:else}
          <button class="btn primary" on:click={() => void startPoseDebugLogging()}>START VISUAL LOG</button>
          <span class="dev-log-detail">SELECT A LOCAL FOLDER · CAMERA FRAMES NEVER UPLOAD</span>
        {/if}
        {#if poseDebugStatus.error}<span class="dev-log-error">{poseDebugStatus.error}</span>{/if}
        <hr />
        <strong>STATE SIMULATOR</strong>
        {#if state.stage === 'positioning'}
          <button class="btn" on:click={() => dispatch({ type: 'confirm-ready-position' })}>READY POSITION</button>
        {:else}
          <button class="btn" on:click={() => dispatch({ type: 'set-form', form: 'valid' })}>VALID FORM</button>
          <button class="btn" on:click={() => dispatch({ type: 'set-form', form: 'hips-low' })}>HIPS TOO LOW</button>
          <button class="btn" on:click={() => dispatch({ type: 'set-form', form: 'hips-high' })}>HIPS TOO HIGH</button>
          <button class="btn" on:click={() => dispatch({ type: 'set-form', form: 'tracking' })}>MOVE OUT OF FRAME</button>
        {/if}
        <button class="btn" on:click={skipToCelebration}>SKIP TO CELEBRATION</button>
      </aside>
    {/if}
  </div>
  {#if showFormFeedback}
    <section class="form-feedback" aria-live="polite" aria-label="Camera form feedback">
      <div class="correction-arrow-slot" aria-hidden="true">
        {#if state.correction && (state.stage === 'grace' || state.stage === 'paused')}
          <span class:down={state.correction.kind === 'hips-high'} class:sideways={state.correction.kind === 'shoulder-forward' || state.correction.kind === 'shoulder-back'} class:back={state.correction.kind === 'shoulder-back'} class="pixel-correction-arrow"></span>
        {/if}
      </div>
      <div class="form-feedback-label">{formFeedbackLabel}</div>
      <div class="grace-cells" aria-label={`${graceSlots} of 5 form grace cells remaining`}>
        {#each Array(5) as _, index}
          <span class:filled={index < graceSlots} class="grace-cell" aria-hidden="true"></span>
        {/each}
      </div>
    </section>
  {/if}
  {#if state.stage === 'safety'}
    <div class="modal-backdrop">
      <div class="panel modal safety" role="dialog" aria-modal="true" aria-labelledby="safety-dialog-title" tabindex="-1">
        <h2 id="safety-dialog-title">BEFORE YOU START</h2>
        <p>Use a clear, stable exercise space. This application provides general fitness guidance, not medical advice.</p>
        <p><strong>Stop immediately</strong> if you experience concerning pain, chest pain or pressure, dizziness or faintness, unusual shortness of breath, or a pounding or irregular heartbeat.</p>
        <p>If you have a health condition, injury, or concerns about starting or increasing exercise, seek guidance from a qualified health professional.</p>
        <p><strong>Camera privacy:</strong> Camera frames and pose calculations stay on this device and are not uploaded.</p>
        <div class="safety-actions">
          <button class="btn" on:click={startGuidedDemo}>VIEW GUIDED DEMO</button>
          <button class="btn primary" on:click={() => { void initializeAudio(); dispatch({ type: 'acknowledge-safety' }); }}>I UNDERSTAND</button>
        </div>
      </div>
    </div>
  {/if}

  <section class="canvas-wrap" aria-label="Shared canvas">
    <div class="canvas-meta">{#if sharedStatusLabel}<span>{sharedStatusLabel}</span>{/if}<span class="canvas-count">{state.cells.filter((c: Pixel) => c.status === 'locked').length} PIXELS LIVE · {state.liveCount} ACTIVE</span></div>
    {#if canvasNotice}<div class="state-notice" aria-live="polite">{canvasNotice}</div>{/if}

    <div class="canvas" style={`--art-width:${GRID_WIDTH}`} role="grid" aria-label="OPENAI BUILD WEEK shared pixel artwork. Select an outlined target pixel.">
      {#each state.cells as cell (cell.id)}
        <button class:target={cell.target} class:empty={!cell.target} class:locked={cell.status === 'locked'} class:pending={cell.status === 'pending'} class:other={cell.status === 'other'} class="cell" disabled={cell.status !== 'available' || locked || sharedActionPending} on:click={() => void selectSharedCell(cell.id)} aria-label={cell.target ? `Artwork pixel ${cell.id + 1}, ${cell.status}` : 'Artwork background'} aria-pressed={cell.status === 'pending'}></button>
      {/each}
    </div>
    {#if state.stage === 'ready' || state.stage === 'complete'}
      <div class="validation selection-chip">{selectionLabel}</div>
    {/if}
  </section>

  <div class="controls">
    {#if guidedDemo}
      <span class="chip">ISOLATED DEMO · NO PROGRESS SAVED</span>
    {:else if active}<button class="btn" on:click={() => void endSharedSession()}>END SESSION · RELEASE PIXEL</button>{/if}
  </div>

</main>

<style>
  .page { width:min(980px,100%); min-height:100vh; margin:auto; padding:32px 28px 44px; }
  .status-row { display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; }.status-group { display:flex; gap:10px; flex-wrap:wrap; justify-content:flex-end; }
  .chip { display:inline-flex; align-items:center; min-height:38px; padding:9px 13px; border:1px solid var(--line); border-radius:999px; background:rgba(255,250,245,.88); color:var(--muted); font:700 11px/1 var(--mono); letter-spacing:.02em; }
  .hero { width:min(800px,100%); margin:58px auto 0; text-align:center; }.brand-logo { --logo-pixel:clamp(3px,.82vw,7px); display:flex; justify-content:center; margin:0 0 16px; }.brand-logo-lockup,.brand-logo-solid-group,.brand-logo-word { display:flex; align-items:center; }.brand-logo-lockup { justify-content:center; gap:calc(var(--logo-pixel) * 2); max-width:100%; filter:drop-shadow(1px 0 0 var(--coral-dark)) drop-shadow(-1px 0 0 var(--coral-dark)) drop-shadow(0 1px 0 var(--coral-dark)) drop-shadow(0 -1px 0 var(--coral-dark)) drop-shadow(calc(var(--logo-pixel) * .62) calc(var(--logo-pixel) * .72) 0 rgba(53,34,29,.28)); }.brand-logo-solid-group { gap:calc(var(--logo-pixel) * 2.2); }.brand-logo-word { gap:calc(var(--logo-pixel) * .72); }.brand-logo-letter { position:relative; display:grid; grid-template-columns:repeat(7,var(--logo-pixel)); grid-template-rows:repeat(9,var(--logo-pixel)); }.brand-logo-letter > i { position:relative; z-index:1; display:block; width:var(--logo-pixel); height:var(--logo-pixel); }.brand-logo-letter > i.on { transform-origin:center; animation:logo-title-pixel-shimmer 5.25s steps(1,end) infinite; animation-delay:calc(var(--logo-phase) * -67ms); }.brand-logo-letter.solid > i.on,.brand-logo-letter.outline > i.on { background:var(--coral); }.brand-logo-letter.solid > i.on { box-shadow:inset 0 calc(var(--logo-pixel) * -.12) 0 rgba(120,37,25,.18); }.logo-o-random-fill { position:absolute; z-index:0; inset:0; display:grid; grid-template-columns:repeat(7,var(--logo-pixel)); grid-template-rows:repeat(9,var(--logo-pixel)); }.logo-o-random-fill i { width:var(--logo-pixel); height:var(--logo-pixel); background:var(--coral); opacity:0; transform:scale(.35); }.logo-o-random-fill i.filled { opacity:1; transform:scale(1); animation:logo-o-pixel-pop .18s steps(2,end); }.mode-selector { display:flex; justify-content:center; gap:10px; }.mode-chip { min-height:34px; background:transparent; cursor:pointer; }.mode-chip.selected { border-color:var(--coral); color:var(--coral-dark); box-shadow:0 0 0 2px rgba(255,90,54,.12); }.mode-chip:disabled { cursor:not-allowed; opacity:.6; }.mode-chip.selected:disabled { opacity:1; }.timer { margin:0; font:700 clamp(52px,11vw,108px)/.9 var(--mono); letter-spacing:-.08em; }.timer small { font-size:.22em; letter-spacing:0; margin-left:8px; color:var(--muted); }.validation { display:inline-flex; align-items:center; gap:8px; margin-top:16px; padding:9px 13px; border:1px solid var(--line); border-radius:999px; color:var(--muted); background:rgba(255,250,245,.85); font:700 10px var(--mono); }.selection-chip { display:flex; width:max-content; margin:16px auto 0; background:transparent; }
  .pose-stage { position:relative; display:grid; align-items:center; width:min(900px,100%); min-height:210px; margin:22px auto 0; }.pose-slot { width:min(560px,100%); margin:0 auto; text-align:center; }.sprite-avatar-shell { width:100%; height:180px; }.celebration-sequence { position:relative; width:100%; height:180px; }.celebration-frame { position:absolute; inset:0; width:100%; height:100%; opacity:0; animation:celebration-frame-slot var(--celebration-duration) steps(1,end) forwards; animation-delay:var(--celebration-delay); }.celebration-frame.celebration-final { animation:celebration-final-frame 1ms linear forwards; animation-delay:var(--celebration-delay); }.form-feedback { margin:10px auto 0; text-align:center; }.form-feedback-label { color:var(--ink); font:700 12px/1 var(--mono); letter-spacing:.04em; }.grace-cells { display:flex; justify-content:center; gap:12px; margin-top:12px; }.grace-cell { width:27px; height:27px; border:2px solid var(--coral); border-radius:5px; background:transparent; box-sizing:border-box; }.grace-cell.filled { background:var(--coral); box-shadow:inset 0 0 0 1px rgba(255,255,255,.2); }
  .camera-setup { display:grid; grid-template-columns:minmax(240px,360px) minmax(220px,1fr); gap:18px; align-items:center; width:min(760px,100%); margin:0 auto 18px; padding:14px; border:1px solid var(--line); border-radius:14px; background:rgba(255,250,245,.82); }.camera-preview-wrap { position:relative; overflow:hidden; aspect-ratio:16/9; border:1px solid var(--line); border-radius:9px; background:#2d2421; }.camera-preview { display:block; width:100%; height:100%; object-fit:cover; transform:scaleX(-1); }.framing-guide { position:absolute; inset:14% 7%; display:grid; place-items:center; border:2px dashed rgba(255,250,245,.82); border-radius:42%; pointer-events:none; }.framing-guide span { width:45%; height:2px; background:rgba(255,250,245,.6); }.camera-loading { position:absolute; inset:0; display:grid; place-items:center; padding:10px; background:rgba(36,25,22,.62); color:#fffaf5; text-align:center; font:700 12px var(--mono); }.camera-copy { display:flex; flex-direction:column; gap:8px; color:var(--muted); font:700 11px/1.35 var(--mono); }.camera-copy strong { color:var(--coral-dark); font-size:16px; }.audio-check { display:flex; flex-wrap:wrap; align-items:center; gap:7px; margin-top:5px; }.audio-check span { width:100%; color:var(--ink); }.audio-check .btn,.camera-copy > .btn { padding:8px 10px; font-size:9px; }
  .pose-visual { position:relative; width:100%; height:180px; }.body-region-highlight { position:absolute; z-index:2; top:54%; left:48%; width:52px; height:52px; transform:translate(-50%,-50%); border:3px solid var(--coral); border-radius:50%; background:rgba(255,90,54,.24); box-shadow:0 0 0 8px rgba(255,90,54,.12); animation:region-pulse .8s steps(2,end) infinite; pointer-events:none; }.correction-arrow-slot { display:flex; align-items:center; justify-content:center; height:54px; }.pixel-correction-arrow { position:relative; display:block; width:48px; height:36px; transform:rotate(-90deg); transform-origin:center; filter:drop-shadow(2px 2px 0 rgba(255,90,54,.22)); image-rendering:pixelated; }.pixel-correction-arrow::before,.pixel-correction-arrow::after { content:""; position:absolute; display:block; }.pixel-correction-arrow::before { inset:0; background:var(--coral-dark); clip-path:polygon(0 22%,50% 22%,50% 0,67% 0,67% 11%,75% 11%,75% 22%,83% 22%,83% 33%,92% 33%,92% 44%,100% 44%,100% 56%,92% 56%,92% 67%,83% 67%,83% 78%,75% 78%,75% 89%,67% 89%,67% 100%,50% 100%,50% 78%,0 78%); }.pixel-correction-arrow::after { inset:4px; background:linear-gradient(180deg,var(--peach) 0 34%,#ff9c68 34% 64%,var(--coral) 64% 82%,var(--coral-dark) 82% 100%); clip-path:polygon(0 21%,50% 21%,50% 0,65% 0,65% 11%,73% 11%,73% 21%,81% 21%,81% 32%,89% 32%,89% 43%,100% 43%,100% 57%,89% 57%,89% 68%,81% 68%,81% 79%,73% 79%,73% 89%,65% 89%,65% 100%,50% 100%,50% 79%,0 79%); }.pixel-correction-arrow.down { transform:rotate(90deg); }
  .modal-backdrop { position:fixed; inset:0; z-index:20; display:grid; place-items:center; padding:24px; overflow-y:auto; background:rgba(255,244,234,.72); backdrop-filter:blur(5px); }.panel { margin:26px auto 0; width:min(660px,100%); border:1px solid var(--line); border-radius:16px; background:rgba(255,250,245,.96); padding:18px; box-shadow:0 18px 60px rgba(120,61,35,.18); }.panel.modal { width:min(620px,calc(100vw - 48px)); max-height:calc(100vh - 48px); margin:0; overflow-y:auto; }.panel h2 { margin:0 0 8px; font-size:18px; }.panel p { margin:7px 0; color:var(--muted); line-height:1.45; font-size:14px; }.btn { border:1px solid var(--coral); border-radius:999px; padding:10px 15px; background:transparent; color:var(--coral-dark); font:700 11px var(--mono); letter-spacing:.02em; }.btn:hover,.btn.primary { background:var(--coral); color:#fff; }.safety { text-align:left; }.safety h2 { font:700 14px var(--mono); letter-spacing:.06em; }.safety strong { color:var(--coral-dark); }.safety-actions { display:flex; justify-content:flex-end; gap:10px; margin-top:14px; }
  .canvas-wrap { position:relative; width:min(760px,100%); margin:38px auto 0; }.canvas-meta { display:flex; justify-content:space-between; align-items:baseline; gap:10px; margin-bottom:4px; }.canvas-meta span { color:var(--muted); font:700 10px var(--mono); }.canvas-meta .canvas-count { margin-left:auto; }.state-notice { margin:7px 0 10px; color:var(--coral-dark); font:700 10px/1.3 var(--mono); text-align:center; }
  .canvas { display:grid; grid-template-columns:repeat(var(--art-width),1fr); gap:2px; width:min(720px,100%); margin:0 auto; padding:18px; border:0; background:transparent; }.cell { aspect-ratio:1; min-width:0; border:0; border-radius:1px; background:transparent; padding:0; transition:transform .1s ease,filter .1s; }.cell.target { border:1px solid rgba(255,164,127,.68); background:rgba(255,228,210,.48); }.cell.target:not(:disabled):hover,.cell.target:not(:disabled):focus-visible { transform:scale(1.16); filter:brightness(.96); outline:2px solid var(--coral); outline-offset:1px; }.cell.locked { border-color:var(--coral); background:var(--coral); }.cell.pending,.cell.other { border-color:var(--coral); background:var(--coral); animation:pulse 1.25s ease-in-out infinite; box-shadow:0 0 0 4px rgba(255,90,54,.16); }.cell.other { opacity:.65; animation-delay:-.45s; transform:scale(.72); }.cell.empty { pointer-events:none; }
  @keyframes pulse { 50% { transform:scale(1.12); box-shadow:0 0 0 10px rgba(255,90,54,0); } }.controls { display:flex; justify-content:center; gap:10px; flex-wrap:wrap; margin-top:18px; }.dev-tools { position:absolute; top:50%; right:-30px; transform:translateY(-50%); display:flex; width:190px; max-height:440px; overflow:auto; flex-direction:column; gap:8px; padding:12px; border:1px dashed var(--coral); border-radius:12px; background:rgba(255,250,245,.97); box-shadow:0 10px 30px rgba(120,61,35,.12); }.dev-tools strong { color:var(--muted); font:700 10px var(--mono); text-align:center; letter-spacing:.08em; }.dev-tools .btn { padding:8px 9px; font-size:9px; }.dev-tools hr { width:100%; margin:2px 0; border:0; border-top:1px dashed var(--line); }.dev-log-status { color:#267a45; font:800 10px/1.2 var(--mono); text-align:center; }.dev-log-detail,.dev-log-error { color:var(--muted); font:700 8px/1.35 var(--mono); text-align:center; }.dev-log-error { color:var(--coral-dark); }
  .camera-setup.camera-runtime-hidden { position:fixed; top:0; left:-10000px; width:2px; height:2px; min-height:0; margin:0; padding:0; overflow:hidden; border:0; opacity:0; pointer-events:none; }
  .demo-tip { position:fixed; z-index:30; top:150px; right:max(18px,calc((100vw - 1120px)/2)); width:min(390px,calc(100vw - 36px)); margin:0; border:2px solid var(--coral); background:rgba(255,250,245,.96); box-shadow:0 16px 45px rgba(120,61,35,.2); text-align:left; }.demo-tip.canvas-tip { top:auto; bottom:24px; }.demo-tip h2 { margin-top:10px; color:var(--coral-dark); font:700 20px/1.1 var(--mono); letter-spacing:.04em; }.demo-tip-progress { color:var(--coral); font:800 10px/1 var(--mono); letter-spacing:.1em; }.demo-tip .safety-actions { margin-top:20px; }
  @media(max-width:900px){.pose-stage{display:block;min-height:0}.camera-setup{grid-template-columns:1fr;width:min(560px,100%)}.camera-setup.camera-runtime-hidden{width:2px}.dev-tools{position:static;transform:none;width:min(560px,100%);margin:14px auto 0;flex-direction:row;flex-wrap:wrap;justify-content:center}.dev-tools strong{width:100%}}
  @media(max-width:600px){.page{padding:20px 15px 32px}.status-row{align-items:flex-start}.status-row .mode-selector{gap:5px}.chip{font-size:9px;min-height:32px;padding:8px 9px}.hero{margin-top:44px}.modal-backdrop{padding:15px}.panel{padding:15px}.panel.modal{width:min(620px,calc(100vw - 30px));max-height:calc(100vh - 30px)}.demo-tip,.demo-tip.canvas-tip{top:auto;right:15px;bottom:15px;width:calc(100vw - 30px);max-height:46vh;overflow-y:auto}.canvas{gap:1px;padding:8px}.grace-cells{gap:8px}.grace-cell{width:24px;height:24px}}
  @media(prefers-reduced-motion:reduce){.cell.pending,.cell.other{animation:none;box-shadow:0 0 0 7px rgba(255,90,54,.16)}.body-region-highlight{animation:none}.celebration-frame{display:none;animation:none}.celebration-frame:last-child{display:block;opacity:1}.brand-logo-letter>i.on,.logo-o-random-fill i.filled{animation:none}}
  .pixel-correction-arrow.sideways { transform:rotate(0deg); }.pixel-correction-arrow.sideways.back { transform:rotate(180deg); }
  @keyframes region-pulse { 50% { transform:translate(-50%,-50%) scale(1.18); box-shadow:0 0 0 14px rgba(255,90,54,0); } }
  @keyframes logo-title-pixel-shimmer { 0%,72%,100% { opacity:1; transform:scale(1); filter:none; } 73%,76% { opacity:.32; transform:scale(.48); filter:brightness(.9); } 77%,82% { opacity:1; transform:scale(1.3); filter:brightness(1.35); } 83%,88% { opacity:1; transform:scale(1); filter:none; } }
  @keyframes logo-o-pixel-pop { 0% { opacity:.25; transform:scale(.25); } 55% { opacity:1; transform:scale(1.35); } 100% { opacity:1; transform:scale(1); } }
  @keyframes celebration-frame-slot { 0%,33.332% { opacity:1; } 33.333%,100% { opacity:0; } }
  @keyframes celebration-final-frame { to { opacity:1; } }
</style>
