# Plank As One

## Elevator pitch

Plank As One turns a short plank into a shared daily ritual: each person completes one safe plank challenge, earns one pixel, and helps reveal the community-built **PLANK AS ONE** artwork. The MVP is a focused SvelteKit prototype with mock presence, camera-form states, safety guidance, and pixel reservation rules.

## Run it locally

Requirements: Node.js 18+ and npm.

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in a browser.

The app uses mock data, so no database, account, camera, or backend service is required for this prototype.

## Try the user journey

1. Choose **Camera mode** or **Honor mode**.
2. Read and acknowledge the safety guidance.
3. Select an outlined pixel in the shared artwork. Selecting it reserves the pixel and starts the countdown.
4. Hold the plank for the displayed duration. In Camera mode, the mock form controls demonstrate valid, bad-form, and tracking-loss states.
5. Complete the challenge to lock the pixel permanently for the session. Ending the session releases the pending pixel so it can be retried.

The character changes between the ready, perfect, and bad poses as the mock challenge state changes. Anonymous active participants and existing pixels are also represented with mock presence data.

## Useful commands

```bash
npm test          # Run state and interaction tests
npm run check     # Run Svelte diagnostics
npm run build     # Create a production build
npm run preview   # Preview the production build locally
```

## Project layout

- `apps/web/src/routes/+page.svelte` — main interactive page
- `apps/web/src/lib/state.js` — challenge state machine and pixel rules
- `apps/web/src/lib/artwork.js` — PLANK AS ONE pixel-art mask
- `apps/web/static/poses/` — ready, perfect, and bad character poses
- `apps/web/test/state.test.mjs` — automated state tests

