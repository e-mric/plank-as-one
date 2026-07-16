<script lang="ts">
  import { onMount } from 'svelte';
  import { createInitialState, reduce, GRID_WIDTH } from '$lib/state.js';

  type Pixel = { id: number; status: string };
  type Action = { type: string; mode?: string; cellId?: number; form?: string; ms?: number };

  let state: any = createInitialState();
  let interval: ReturnType<typeof setInterval>;

  $: active = ['countdown', 'active', 'grace', 'paused'].includes(state.stage);
  $: locked = state.stage !== 'ready';
  $: status = state.stage === 'countdown'
    ? `STARTING IN ${Math.ceil(state.countdown)}…`
    : state.stage === 'complete'
      ? 'PIXEL COMMITTED · NICE WORK'
      : state.notice || (state.mode === 'honor' ? 'FORM NOT CAMERA-VALIDATED' : 'CHOOSE A ROUTE TO BEGIN');
  $: timerLabel = state.stage === 'countdown' ? String(Math.ceil(state.countdown)) : String(Math.floor(state.creditedMs / 1000)).padStart(2, '0');
  $: pose = (state.stage === 'active' || state.stage === 'complete') && state.form === 'valid'
    ? { src: '/poses/pose-perfect.png', alt: 'Pixel-art person holding a perfect plank' }
    : state.stage === 'grace' || state.stage === 'paused' || state.form !== 'valid'
      ? { src: '/poses/pose-bad.png', alt: 'Pixel-art person holding a bad plank form' }
      : { src: '/poses/pose-ready.png', alt: 'Pixel-art person in the ready position' };

  function dispatch(action: Action) { state = reduce(state, action); }
  function chooseMode(mode: string) { dispatch({ type: 'choose-mode', mode }); }
  function resetToRoutes() { state = createInitialState({ ...state, mode: null, stage: 'idle' }); }

  onMount(() => {
    interval = setInterval(() => {
      if (['countdown', 'active', 'grace'].includes(state.stage)) dispatch({ type: 'tick', ms: 250 });
    }, 250);
    const abandonHonor = () => {
      if (document.visibilityState === 'hidden' && state.mode === 'honor' && active) dispatch({ type: 'end-session' });
    };
    document.addEventListener('visibilitychange', abandonHonor);
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', abandonHonor); };
  });
</script>

<svelte:head>
  <title>Plank As One · shared daily challenge</title>
  <meta name="description" content="One plank. One pixel. One shared canvas." />
</svelte:head>

<main class="page" aria-label="Plank As One active main page">
  <header class="status-row">
    <span class="chip live"><i class="live-dot" aria-hidden="true"></i><b>{state.liveCount}</b>&nbsp; PLANKING NOW</span>
    <div class="status-group"><span class="chip"><b>{state.todayCount}</b>&nbsp; TODAY</span><span class="chip">RESET&nbsp; 05:42</span><span class="chip">STREAK&nbsp; <b>{state.streak}</b>&nbsp; DAYS</span></div>
  </header>

  <section class="hero" aria-label="Daily plank challenge">
    <h2 class="brand-title">PLANK AS ONE</h2>
    {#if state.mode}<span class="chip mode-chip">{state.mode === 'camera' ? 'Camera mode' : 'Honor mode'}</span>{/if}
    <h1 class="timer" aria-live="polite">{timerLabel}<small>/ {state.target}s</small></h1>
    <div class="validation">{#if state.mode}<i aria-hidden="true"></i>{/if}{status}</div>
    {#if active && state.mode === 'camera' && state.stage !== 'countdown'}
      <div class="form-controls" aria-label="Mock camera form states">
        <button class="btn" on:click={() => dispatch({ type: 'set-form', form: 'valid' })}>VALID FORM</button>
        <button class="btn" on:click={() => dispatch({ type: 'set-form', form: 'invalid' })}>CORRECT ME</button>
        <button class="btn" on:click={() => dispatch({ type: 'set-form', form: 'tracking' })}>MOVE OUT OF FRAME</button>
      </div>
    {/if}
  </section>

  <section class="pose-slot" aria-label="Pixel person holding a plank">
    <img src={pose.src} alt={pose.alt} />
  </section>
  <div class="privacy-note">CAMERA AND FORM VALIDATION STAY ON THIS DEVICE</div>

  {#if state.stage === 'idle'}
    <section class="panel"><h2>Choose how you’ll plank today</h2><p>Camera validation gives live form cues. Honor mode skips the camera while keeping the same safety guidance and daily pixel.</p><div class="routes"><button class="btn primary" on:click={() => chooseMode('camera')}>USE CAMERA · MOCK READY</button><button class="btn" on:click={() => chooseMode('honor')}>CONTINUE WITHOUT CAMERA</button></div></section>
  {:else if state.stage === 'safety'}
    <section class="panel safety"><h2>BEFORE YOU START</h2><p>Use a clear, stable exercise space. This application provides general fitness guidance, not medical advice.</p><p><strong>Stop immediately</strong> if you experience concerning pain, chest pain or pressure, dizziness or faintness, unusual shortness of breath, or a pounding or irregular heartbeat.</p><p>If you have a health condition, injury, or concerns about starting or increasing exercise, seek guidance from a qualified health professional.</p><div class="safety-actions"><button class="btn" on:click={resetToRoutes}>GO BACK</button><button class="btn primary" on:click={() => dispatch({ type: 'acknowledge-safety' })}>I UNDERSTAND</button></div></section>
  {/if}

  <section class="canvas-wrap" aria-label="Shared canvas">
    <div class="canvas-meta"><span>{state.cells.filter((c: Pixel) => c.status === 'locked').length} PIXELS LIVE · {state.liveCount} ACTIVE</span></div>

    <div class="canvas" style={`--art-width:${GRID_WIDTH}`} role="grid" aria-label="PLANK AS ONE shared pixel artwork. Select an outlined target pixel.">
      {#each state.cells as cell (cell.id)}
        <button class:target={cell.target} class:empty={!cell.target} class:locked={cell.status === 'locked'} class:pending={cell.status === 'pending'} class:other={cell.status === 'other'} class="cell" disabled={cell.status !== 'available' || locked} on:click={() => dispatch({ type: 'select-cell', cellId: cell.id })} aria-label={cell.target ? `Artwork pixel ${cell.id + 1}, ${cell.status}` : 'Artwork background'} aria-pressed={cell.status === 'pending'}></button>
      {/each}
    </div>
  </section>

  <div class="controls">
    {#if active}<button class="btn" on:click={() => dispatch({ type: 'end-session' })}>END SESSION · RELEASE PIXEL</button>{:else if state.stage === 'complete'}<span class="chip">YOUR PIXEL IS LIVE · COME BACK TOMORROW</span>{:else if state.stage === 'ready'}<span class="chip">SELECT A GLOWING CELL TO START</span>{/if}
  </div>
</main>

<style>
  .page { width:min(980px,100%); min-height:100vh; margin:auto; padding:32px 28px 44px; }
  .status-row { display:flex; align-items:center; justify-content:space-between; gap:12px; }.status-group { display:flex; gap:10px; flex-wrap:wrap; justify-content:flex-end; }
  .chip { display:inline-flex; align-items:center; min-height:38px; padding:9px 13px; border:1px solid var(--line); border-radius:999px; background:rgba(255,250,245,.88); color:var(--muted); font:700 11px/1 var(--mono); letter-spacing:.02em; }.chip.live { gap:9px; }.live-dot { width:10px;height:10px;border-radius:50%;background:var(--green);box-shadow:0 0 0 5px rgba(76,167,106,.14); }
  .hero { width:min(650px,100%); margin:58px auto 0; text-align:center; }.brand-title { margin:0 0 8px; color:var(--coral); font:700 clamp(30px,6vw,52px)/.95 var(--mono); letter-spacing:.04em; }.mode-chip { margin-bottom:8px; }.timer { margin:0; font:700 clamp(52px,11vw,108px)/.9 var(--mono); letter-spacing:-.08em; }.timer small { font-size:.22em; letter-spacing:0; margin-left:8px; color:var(--muted); }.validation { display:inline-flex; align-items:center; gap:8px; margin-top:16px; padding:9px 13px; border:1px solid var(--line); border-radius:999px; color:var(--muted); background:rgba(255,250,245,.85); font:700 10px var(--mono); }.validation i { width:8px;height:8px;border-radius:50%;background:var(--green);box-shadow:0 0 0 4px rgba(76,167,106,.14); }
  .pose-slot { width:min(560px,100%); margin:22px auto 0; text-align:center; }.pose-slot img { display:block; width:100%; height:auto; max-height:180px; object-fit:contain; image-rendering:pixelated; }.privacy-note { margin:10px auto 0; color:var(--muted); font:700 10px var(--mono); text-align:center; }
  .panel { margin:26px auto 0; width:min(660px,100%); border:1px solid var(--line); border-radius:16px; background:rgba(255,250,245,.78); padding:18px; box-shadow:0 8px 30px rgba(120,61,35,.06); }.panel h2 { margin:0 0 8px; font-size:18px; }.panel p { margin:7px 0; color:var(--muted); line-height:1.45; font-size:14px; }.routes { display:flex; gap:10px; justify-content:center; flex-wrap:wrap; margin-top:15px; }.btn { border:1px solid var(--coral); border-radius:999px; padding:10px 15px; background:transparent; color:var(--coral-dark); font:700 11px var(--mono); letter-spacing:.02em; }.btn:hover,.btn.primary { background:var(--coral); color:#fff; }.safety { text-align:left; }.safety h2 { font:700 14px var(--mono); letter-spacing:.06em; }.safety strong { color:var(--coral-dark); }.safety-actions { display:flex; justify-content:flex-end; gap:10px; margin-top:14px; }
  .canvas-wrap { position:relative; width:min(760px,100%); margin:38px auto 0; }.canvas-meta { display:flex; justify-content:flex-end; align-items:baseline; margin-bottom:4px; }.canvas-meta span { color:var(--muted); font:700 10px var(--mono); }
  .canvas { display:grid; grid-template-columns:repeat(var(--art-width),1fr); gap:2px; width:min(720px,100%); margin:0 auto; padding:18px; border:0; background:transparent; }.cell { aspect-ratio:1; min-width:0; border:0; border-radius:1px; background:transparent; padding:0; transition:transform .1s ease,filter .1s; }.cell.target { border:1px solid rgba(255,164,127,.68); background:rgba(255,228,210,.48); }.cell.target:not(:disabled):hover,.cell.target:not(:disabled):focus-visible { transform:scale(1.16); filter:brightness(.96); outline:2px solid var(--coral); outline-offset:1px; }.cell.locked { border-color:var(--coral); background:var(--coral); }.cell.pending,.cell.other { border-color:var(--coral); background:var(--coral); animation:pulse 1.25s ease-in-out infinite; box-shadow:0 0 0 4px rgba(255,90,54,.16); }.cell.other { opacity:.65; animation-delay:-.45s; transform:scale(.72); }.cell.empty { pointer-events:none; }
  @keyframes pulse { 50% { transform:scale(1.12); box-shadow:0 0 0 10px rgba(255,90,54,0); } }.controls { display:flex; justify-content:center; gap:10px; flex-wrap:wrap; margin-top:18px; }.form-controls { display:flex; justify-content:center; gap:8px; margin-top:12px; }.form-controls .btn { padding:7px 10px; font-size:10px; }
  @media(max-width:600px){.page{padding:20px 15px 32px}.status-row{align-items:flex-start}.chip{font-size:9px;min-height:32px;padding:8px 9px}.hero{margin-top:44px}.panel{padding:15px}.canvas{gap:1px;padding:8px}.privacy-note{font-size:8px}}
  @media(prefers-reduced-motion:reduce){.cell.pending,.cell.other{animation:none;box-shadow:0 0 0 7px rgba(255,90,54,.16)}}
</style>
