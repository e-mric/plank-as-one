<script lang="ts">
  import { onMount, tick as svelteTick } from 'svelte';
  import { dev } from '$app/environment';
  import { createInitialState, reduce, GRID_WIDTH } from '$lib/state.js';
  import { createMoveNetDetector } from '$lib/pose/detector.js';
  import { startPoseInference } from '$lib/pose/frame-scheduler.js';
  import { CAMERA_CONSTRAINTS, describeFraming, getCameraErrorMessage } from '$lib/pose/setup-machine.js';
  import { createAudioFeedback } from '$lib/pose/audio-feedback.js';
  import { analyzePoseFrame, resetPoseAnalyzer } from '$lib/pose/engine.js';

  type Pixel = { id: number; status: string };
  type Action = { type: string; mode?: string; cellId?: number; form?: string; ms?: number; correction?: any; ready?: boolean };

  const CELEBRATION_FRAME_SECONDS = 0.09;
  const celebrationFrames = Array.from({ length: 15 }, (_, index) => {
    const frame = String(index + 1).padStart(2, '0');
    return {
      src: `/poses/pose-celebrate-${frame}.png`,
      alt: index === 14 ? 'Pixel-art person celebrating with both fists raised' : 'Pixel-art person celebrating after completing the plank',
    };
  });

  let state: any = createInitialState();
  let interval: ReturnType<typeof setInterval>;
  let videoEl: HTMLVideoElement;
  let cameraStream: MediaStream | null = null;
  let detector: { estimatePoses: (video: HTMLVideoElement) => Promise<any[]>; dispose: () => void } | null = null;
  let stopInference: (() => void) | null = null;
  let cameraStarting = false;
  let cameraRequestId = 0;
  let cameraStatus = 'idle';
  let cameraMessage = 'CAMERA STARTS AFTER PIXEL SELECTION';
  let audioMuted = false;
  const audio = createAudioFeedback();
  let lastAudioCorrection = '';

  $: active = ['positioning', 'countdown', 'active', 'grace', 'paused'].includes(state.stage);
  $: locked = state.stage !== 'ready';
  $: timerLabel = state.stage === 'countdown' ? String(Math.ceil(state.countdown)) : String(Math.floor(state.creditedMs / 1000)).padStart(2, '0');
  $: trackingVisible = state.form === 'tracking' && (state.trackingMs >= 500 || state.stage === 'paused');
  $: showFormFeedback = state.mode === 'camera' && ['ready', 'positioning', 'countdown', 'active', 'grace', 'paused', 'complete'].includes(state.stage);
  $: formFeedbackLabel = state.lastOutcome === 'complete'
    ? 'POWER UP +2'
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
  $: pose = state.lastOutcome === 'complete'
    ? { kind: 'celebrate', alt: 'Pixel-art person celebrating a completed plank' }
    : state.lastOutcome === 'failed'
      ? { kind: 'exhausted', src: '/poses/pose-exhausted.png', alt: 'Pixel-art person exhausted after an incomplete plank' }
      : (state.stage === 'active' || state.stage === 'complete') && (state.form === 'valid' || (state.form === 'tracking' && !trackingVisible))
        ? { kind: 'perfect', src: '/poses/pose-perfect.png', alt: 'Pixel-art person holding a perfect plank' }
    : state.form === 'hips-low' && (state.stage === 'grace' || state.stage === 'paused')
      ? { kind: 'hips-low', src: '/poses/pose-hips-low.png', alt: 'Pixel-art person planking with hips too low' }
    : state.form === 'hips-high' && (state.stage === 'grace' || state.stage === 'paused')
      ? { kind: 'hips-high', src: '/poses/pose-hips-high.png', alt: 'Pixel-art person planking with hips too high' }
    : state.stage === 'grace' || state.stage === 'paused' || state.form !== 'valid'
      ? { kind: 'bad', src: '/poses/pose-bad.png', alt: 'Pixel-art person holding a bad plank form' }
      : { kind: 'ready', src: '/poses/pose-ready.png', alt: 'Pixel-art person in the ready position' };

  $: showCameraSetup = state.mode === 'camera' && state.stage === 'positioning';

  function dispatch(action: Action) {
    const previous = state;
    state = reduce(state, action);
    if (previous.stage !== state.stage && state.stage === 'positioning') void startCamera();
    if (previous.mode === 'camera' && activeStage(previous.stage) && !activeStage(state.stage)) stopCamera();
    if (state.stage === 'complete' && previous.stage !== 'complete') {
      stopCamera();
      void audio.initialize().then(() => audio.complete());
    }
    const nextCorrectionKind = state.correction?.kind || '';
    if (nextCorrectionKind && nextCorrectionKind !== lastAudioCorrection) {
      lastAudioCorrection = nextCorrectionKind;
      void audio.initialize().then(() => audio.correction(state.correction));
    }
    if (!state.correction) lastAudioCorrection = '';
  }

  function activeStage(stage: string) {
    return ['positioning', 'countdown', 'active', 'grace', 'paused'].includes(stage);
  }

  async function startCamera() {
    if (cameraStarting || cameraStream || state.mode !== 'camera' || state.stage !== 'positioning') return;
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
      stopInference = startPoseInference({
        video: videoEl,
        detector,
        onPose: handlePose,
        onError: () => { cameraStatus = 'error'; cameraMessage = 'POSE TRACKING UNAVAILABLE'; },
      });
      cameraStatus = 'ready';
    } catch (error) {
      cameraStatus = 'error';
      cameraMessage = getCameraErrorMessage(error);
      stopCamera(false);
    } finally {
      cameraStarting = false;
    }
  }

  function handlePose(poses: any[], now: number) {
    const result = analyzePoseFrame(poses?.[0], {
      width: videoEl?.videoWidth || 1,
      height: videoEl?.videoHeight || 1,
      now,
    });
    cameraMessage = result.setupMessage || describeFraming(result.quality);
    if (result.quality?.tracked && result.setupReady) cameraStatus = 'ready';
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
    if (videoEl) videoEl.srcObject = null;
    if (resetStatus) {
      cameraStatus = 'idle';
      cameraMessage = 'CAMERA STARTS AFTER PIXEL SELECTION';
    }
  }

  async function initializeAudio() {
    await audio.initialize();
  }

  function toggleMute() {
    audioMuted = !audioMuted;
    audio.setMuted(audioMuted);
  }

  function playTestSound() {
    void audio.initialize().then(() => audio.test());
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
  function cancelSafety() {
    state = { ...state, stage: 'ready', requestedCell: null, selectedCell: null, notice: '' };
  }

  onMount(() => {
    interval = setInterval(() => {
      if (['countdown', 'active', 'grace'].includes(state.stage)) dispatch({ type: 'tick', ms: 250 });
    }, 250);
    const abandonHonor = () => {
      if (document.visibilityState === 'hidden' && state.mode === 'honor' && active) dispatch({ type: 'end-session' });
    };
    document.addEventListener('visibilitychange', abandonHonor);
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', abandonHonor); stopCamera(); audio.dispose(); };
  });
</script>

<svelte:head>
  <title>Plank As One · shared daily challenge</title>
  <meta name="description" content="One plank. One pixel. One shared canvas." />
</svelte:head>

<main class="page" aria-label="Plank As One active main page">
  <header class="status-row">
    <div class="mode-selector" role="group" aria-label="Challenge mode">
      <button
        class="chip mode-chip"
        class:selected={state.mode === 'camera'}
        aria-pressed={state.mode === 'camera'}
        disabled={state.modeLocked || state.stage === 'safety'}
        on:click={() => chooseMode('camera')}
      >Camera mode</button>
      <button
        class="chip mode-chip"
        class:selected={state.mode === 'honor'}
        aria-pressed={state.mode === 'honor'}
        disabled={state.modeLocked || state.stage === 'safety'}
        on:click={() => chooseMode('honor')}
      >Honor mode</button>
    </div>
    <div class="status-group"><span class="chip"><b>{state.todayCount}</b>&nbsp; TODAY</span><span class="chip">RESET&nbsp; 05:42</span><span class="chip">STREAK&nbsp; <b>{state.streak}</b>&nbsp; DAYS</span></div>
  </header>

  <section class="hero" aria-label="Daily plank challenge">
    <h2 class="brand-title">PLANK AS ONE</h2>
    <h1 class="timer" aria-live="polite">{timerLabel}<small>/ {state.target}s</small></h1>
  </section>

  <div class="pose-stage">
    {#if showCameraSetup}
      <section class="camera-setup" aria-label="Camera setup">
        <div class="camera-preview-wrap">
          <video bind:this={videoEl} class="camera-preview" autoplay playsinline muted aria-label="Mirrored camera preview"></video>
          <div class="framing-guide" aria-hidden="true"><span></span></div>
          {#if cameraStatus === 'requesting' || cameraStatus === 'loading'}<div class="camera-loading">{cameraStatus === 'requesting' ? 'REQUESTING CAMERA' : 'LOADING POSE MODEL'}</div>{/if}
        </div>
        <div class="camera-copy">
          <strong>{cameraMessage}</strong>
          <span>ONE PERSON · SIDE VIEW · FULL BODY VISIBLE</span>
          {#if cameraStatus === 'error'}<button class="btn" on:click={() => void startCamera()}>TRY CAMERA AGAIN</button>{/if}
          <div class="audio-check">
            <span>AUDIO FEEDBACK {audioMuted ? 'MUTED' : 'ON'}</span>
            <button class="btn" on:click={playTestSound}>PLAY TEST SOUND</button>
            <button class="btn" on:click={toggleMute}>{audioMuted ? 'UNMUTE' : 'MUTE'}</button>
          </div>
        </div>
      </section>
    {/if}
    <section class="pose-slot" aria-label="Pixel person holding a plank">
      {#if pose.kind === 'celebrate'}
        <div class="celebration-sequence" role="img" aria-label={pose.alt}>
          {#each celebrationFrames as frame, index}
            <img
              class:celebration-final={index === celebrationFrames.length - 1}
              class="celebration-frame"
              src={frame.src}
              alt={frame.alt}
              aria-hidden={index < celebrationFrames.length - 1 ? 'true' : undefined}
              style={`--celebration-delay:${index * CELEBRATION_FRAME_SECONDS}s;--celebration-duration:${celebrationFrames.length * CELEBRATION_FRAME_SECONDS}s`}
            />
          {/each}
        </div>
      {:else}
        <div class="pose-visual">
          <img class={pose.kind} src={pose.src} alt={pose.alt} />
          {#if pose.kind === 'hips-low' || pose.kind === 'hips-high'}
            <span class="body-region-highlight" aria-hidden="true"></span>
          {/if}
        </div>
      {/if}
    </section>
    {#if dev && active && state.mode === 'camera' && state.stage !== 'countdown'}
      <aside class="dev-tools" aria-label="Developer form testing controls">
        <strong>DEV TOOLS</strong>
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
  <div class="privacy-note">ON-DEVICE ONLY</div>

  {#if state.stage === 'safety'}
    <div class="modal-backdrop">
      <div class="panel modal safety" role="dialog" aria-modal="true" aria-labelledby="safety-dialog-title" tabindex="-1">
        <h2 id="safety-dialog-title">BEFORE YOU START</h2>
        <p>Use a clear, stable exercise space. This application provides general fitness guidance, not medical advice.</p>
        <p><strong>Stop immediately</strong> if you experience concerning pain, chest pain or pressure, dizziness or faintness, unusual shortness of breath, or a pounding or irregular heartbeat.</p>
        <p>If you have a health condition, injury, or concerns about starting or increasing exercise, seek guidance from a qualified health professional.</p>
        <div class="safety-actions">
          <button class="btn" on:click={cancelSafety}>GO BACK</button>
          <button class="btn primary" on:click={() => { void initializeAudio(); dispatch({ type: 'acknowledge-safety' }); }}>I UNDERSTAND</button>
        </div>
      </div>
    </div>
  {/if}

  <section class="canvas-wrap" aria-label="Shared canvas">
    <div class="canvas-meta"><span>{state.cells.filter((c: Pixel) => c.status === 'locked').length} PIXELS LIVE · {state.liveCount} ACTIVE</span></div>

    <div class="canvas" style={`--art-width:${GRID_WIDTH}`} role="grid" aria-label="PLANK AS ONE shared pixel artwork. Select an outlined target pixel.">
      {#each state.cells as cell (cell.id)}
        <button class:target={cell.target} class:empty={!cell.target} class:locked={cell.status === 'locked'} class:pending={cell.status === 'pending'} class:other={cell.status === 'other'} class="cell" disabled={cell.status !== 'available' || locked} on:click={() => dispatch({ type: 'select-cell', cellId: cell.id })} aria-label={cell.target ? `Artwork pixel ${cell.id + 1}, ${cell.status}` : 'Artwork background'} aria-pressed={cell.status === 'pending'}></button>
      {/each}
    </div>
    {#if state.stage === 'ready'}
      <div class="validation selection-chip">SELECT YOUR PIXEL</div>
    {/if}
  </section>

  <div class="controls">
    {#if active}<button class="btn" on:click={() => dispatch({ type: 'end-session' })}>END SESSION · RELEASE PIXEL</button>{:else if state.stage === 'complete'}<span class="chip">YOUR PIXEL IS LIVE 🔥</span>{/if}
  </div>

</main>

<style>
  .page { width:min(980px,100%); min-height:100vh; margin:auto; padding:32px 28px 44px; }
  .status-row { display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; }.status-group { display:flex; gap:10px; flex-wrap:wrap; justify-content:flex-end; }
  .chip { display:inline-flex; align-items:center; min-height:38px; padding:9px 13px; border:1px solid var(--line); border-radius:999px; background:rgba(255,250,245,.88); color:var(--muted); font:700 11px/1 var(--mono); letter-spacing:.02em; }
  .hero { width:min(650px,100%); margin:58px auto 0; text-align:center; }.brand-title { margin:0 0 10px; color:var(--coral); font:700 clamp(30px,6vw,52px)/.95 var(--mono); letter-spacing:.04em; }.mode-selector { display:flex; justify-content:center; gap:10px; }.mode-chip { min-height:34px; background:transparent; cursor:pointer; }.mode-chip.selected { border-color:var(--coral); color:var(--coral-dark); box-shadow:0 0 0 2px rgba(255,90,54,.12); }.mode-chip:disabled { cursor:not-allowed; opacity:.6; }.mode-chip.selected:disabled { opacity:1; }.timer { margin:0; font:700 clamp(52px,11vw,108px)/.9 var(--mono); letter-spacing:-.08em; }.timer small { font-size:.22em; letter-spacing:0; margin-left:8px; color:var(--muted); }.validation { display:inline-flex; align-items:center; gap:8px; margin-top:16px; padding:9px 13px; border:1px solid var(--line); border-radius:999px; color:var(--muted); background:rgba(255,250,245,.85); font:700 10px var(--mono); }.selection-chip { display:flex; width:max-content; margin:16px auto 0; background:transparent; }
  .pose-stage { position:relative; display:grid; align-items:center; width:min(900px,100%); min-height:210px; margin:22px auto 0; }.pose-slot { width:min(560px,100%); margin:0 auto; text-align:center; }.pose-slot img { display:block; width:100%; height:auto; max-height:180px; object-fit:contain; image-rendering:pixelated; }.pose-slot img.hips-low { transform:scale(.68); transform-origin:center; }.pose-slot img.hips-high { transform:scale(.7); transform-origin:center; }.pose-slot img.exhausted { max-height:105px; }.celebration-sequence { position:relative; width:100%; height:180px; }.pose-slot img.celebration-frame { position:absolute; inset:0; width:100%; height:100%; max-height:none; object-fit:contain; opacity:0; animation:celebration-frame-slot var(--celebration-duration) steps(1,end) forwards; animation-delay:var(--celebration-delay); }.pose-slot img.celebration-frame.celebration-final { animation:celebration-final-frame 1ms linear forwards; animation-delay:var(--celebration-delay); }.form-feedback { margin:10px auto 0; text-align:center; }.form-feedback-label { color:var(--ink); font:700 12px/1 var(--mono); letter-spacing:.04em; }.grace-cells { display:flex; justify-content:center; gap:12px; margin-top:12px; }.grace-cell { width:27px; height:27px; border:2px solid var(--coral); border-radius:5px; background:transparent; box-sizing:border-box; }.grace-cell.filled { background:var(--coral); box-shadow:inset 0 0 0 1px rgba(255,255,255,.2); }.privacy-note { margin:10px auto 0; color:var(--muted); font:700 10px var(--mono); text-align:center; }
  .camera-setup { display:grid; grid-template-columns:minmax(240px,360px) minmax(220px,1fr); gap:18px; align-items:center; width:min(760px,100%); margin:0 auto 18px; padding:14px; border:1px solid var(--line); border-radius:14px; background:rgba(255,250,245,.82); }.camera-preview-wrap { position:relative; overflow:hidden; aspect-ratio:16/9; border:1px solid var(--line); border-radius:9px; background:#2d2421; }.camera-preview { display:block; width:100%; height:100%; object-fit:cover; transform:scaleX(-1); }.framing-guide { position:absolute; inset:14% 7%; display:grid; place-items:center; border:2px dashed rgba(255,250,245,.82); border-radius:42%; pointer-events:none; }.framing-guide span { width:45%; height:2px; background:rgba(255,250,245,.6); }.camera-loading { position:absolute; inset:0; display:grid; place-items:center; padding:10px; background:rgba(36,25,22,.62); color:#fffaf5; text-align:center; font:700 12px var(--mono); }.camera-copy { display:flex; flex-direction:column; gap:8px; color:var(--muted); font:700 11px/1.35 var(--mono); }.camera-copy strong { color:var(--coral-dark); font-size:16px; }.audio-check { display:flex; flex-wrap:wrap; align-items:center; gap:7px; margin-top:5px; }.audio-check span { width:100%; color:var(--ink); }.audio-check .btn,.camera-copy > .btn { padding:8px 10px; font-size:9px; }
  .pose-visual { position:relative; width:100%; height:180px; }.pose-visual > img { height:100%; max-height:none; }.body-region-highlight { position:absolute; z-index:2; top:54%; left:48%; width:52px; height:52px; transform:translate(-50%,-50%); border:3px solid var(--coral); border-radius:50%; background:rgba(255,90,54,.24); box-shadow:0 0 0 8px rgba(255,90,54,.12); animation:region-pulse .8s steps(2,end) infinite; pointer-events:none; }.correction-arrow-slot { display:flex; align-items:center; justify-content:center; height:54px; }.pixel-correction-arrow { position:relative; display:block; width:48px; height:36px; transform:rotate(-90deg); transform-origin:center; filter:drop-shadow(2px 2px 0 rgba(255,90,54,.22)); image-rendering:pixelated; }.pixel-correction-arrow::before,.pixel-correction-arrow::after { content:""; position:absolute; display:block; }.pixel-correction-arrow::before { inset:0; background:var(--coral-dark); clip-path:polygon(0 22%,50% 22%,50% 0,67% 0,67% 11%,75% 11%,75% 22%,83% 22%,83% 33%,92% 33%,92% 44%,100% 44%,100% 56%,92% 56%,92% 67%,83% 67%,83% 78%,75% 78%,75% 89%,67% 89%,67% 100%,50% 100%,50% 78%,0 78%); }.pixel-correction-arrow::after { inset:4px; background:linear-gradient(180deg,var(--peach) 0 34%,#ff9c68 34% 64%,var(--coral) 64% 82%,var(--coral-dark) 82% 100%); clip-path:polygon(0 21%,50% 21%,50% 0,65% 0,65% 11%,73% 11%,73% 21%,81% 21%,81% 32%,89% 32%,89% 43%,100% 43%,100% 57%,89% 57%,89% 68%,81% 68%,81% 79%,73% 79%,73% 89%,65% 89%,65% 100%,50% 100%,50% 79%,0 79%); }.pixel-correction-arrow.down { transform:rotate(90deg); }
  .modal-backdrop { position:fixed; inset:0; z-index:20; display:grid; place-items:center; padding:24px; overflow-y:auto; background:rgba(255,244,234,.72); backdrop-filter:blur(5px); }.panel { margin:26px auto 0; width:min(660px,100%); border:1px solid var(--line); border-radius:16px; background:rgba(255,250,245,.96); padding:18px; box-shadow:0 18px 60px rgba(120,61,35,.18); }.panel.modal { width:min(620px,calc(100vw - 48px)); max-height:calc(100vh - 48px); margin:0; overflow-y:auto; }.panel h2 { margin:0 0 8px; font-size:18px; }.panel p { margin:7px 0; color:var(--muted); line-height:1.45; font-size:14px; }.btn { border:1px solid var(--coral); border-radius:999px; padding:10px 15px; background:transparent; color:var(--coral-dark); font:700 11px var(--mono); letter-spacing:.02em; }.btn:hover,.btn.primary { background:var(--coral); color:#fff; }.safety { text-align:left; }.safety h2 { font:700 14px var(--mono); letter-spacing:.06em; }.safety strong { color:var(--coral-dark); }.safety-actions { display:flex; justify-content:flex-end; gap:10px; margin-top:14px; }
  .canvas-wrap { position:relative; width:min(760px,100%); margin:38px auto 0; }.canvas-meta { display:flex; justify-content:flex-end; align-items:baseline; margin-bottom:4px; }.canvas-meta span { color:var(--muted); font:700 10px var(--mono); }
  .canvas { display:grid; grid-template-columns:repeat(var(--art-width),1fr); gap:2px; width:min(720px,100%); margin:0 auto; padding:18px; border:0; background:transparent; }.cell { aspect-ratio:1; min-width:0; border:0; border-radius:1px; background:transparent; padding:0; transition:transform .1s ease,filter .1s; }.cell.target { border:1px solid rgba(255,164,127,.68); background:rgba(255,228,210,.48); }.cell.target:not(:disabled):hover,.cell.target:not(:disabled):focus-visible { transform:scale(1.16); filter:brightness(.96); outline:2px solid var(--coral); outline-offset:1px; }.cell.locked { border-color:var(--coral); background:var(--coral); }.cell.pending,.cell.other { border-color:var(--coral); background:var(--coral); animation:pulse 1.25s ease-in-out infinite; box-shadow:0 0 0 4px rgba(255,90,54,.16); }.cell.other { opacity:.65; animation-delay:-.45s; transform:scale(.72); }.cell.empty { pointer-events:none; }
  @keyframes pulse { 50% { transform:scale(1.12); box-shadow:0 0 0 10px rgba(255,90,54,0); } }.controls { display:flex; justify-content:center; gap:10px; flex-wrap:wrap; margin-top:18px; }.dev-tools { position:absolute; top:50%; right:0; transform:translateY(-50%); display:flex; width:150px; flex-direction:column; gap:8px; padding:12px; border:1px dashed var(--coral); border-radius:12px; background:rgba(255,250,245,.96); box-shadow:0 10px 30px rgba(120,61,35,.12); }.dev-tools strong { color:var(--muted); font:700 10px var(--mono); text-align:center; letter-spacing:.08em; }.dev-tools .btn { padding:8px 9px; font-size:9px; }
  @media(max-width:900px){.pose-stage{display:block;min-height:0}.camera-setup{grid-template-columns:1fr;width:min(560px,100%)}.dev-tools{position:static;transform:none;width:min(560px,100%);margin:14px auto 0;flex-direction:row;flex-wrap:wrap;justify-content:center}.dev-tools strong{width:100%}}
  @media(max-width:600px){.page{padding:20px 15px 32px}.status-row{align-items:flex-start}.status-row .mode-selector{gap:5px}.chip{font-size:9px;min-height:32px;padding:8px 9px}.hero{margin-top:44px}.modal-backdrop{padding:15px}.panel{padding:15px}.panel.modal{width:min(620px,calc(100vw - 30px));max-height:calc(100vh - 30px)}.canvas{gap:1px;padding:8px}.grace-cells{gap:8px}.grace-cell{width:24px;height:24px}.privacy-note{font-size:8px}}
  @media(prefers-reduced-motion:reduce){.cell.pending,.cell.other{animation:none;box-shadow:0 0 0 7px rgba(255,90,54,.16)}.body-region-highlight{animation:none}.pose-slot img.celebration-frame{display:none;animation:none}.pose-slot img.celebration-frame:last-child{display:block;opacity:1}}
  .pixel-correction-arrow.sideways { transform:rotate(0deg); }.pixel-correction-arrow.sideways.back { transform:rotate(180deg); }
  @keyframes region-pulse { 50% { transform:translate(-50%,-50%) scale(1.18); box-shadow:0 0 0 14px rgba(255,90,54,0); } }
  @keyframes celebration-frame-slot { 0%,6.666% { opacity:1; } 6.667%,100% { opacity:0; } }
  @keyframes celebration-final-frame { to { opacity:1; } }
</style>
