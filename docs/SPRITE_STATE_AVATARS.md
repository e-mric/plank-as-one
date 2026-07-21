# Sprite-state avatars

The unchanged `hf-chara.png` atlas is the source of truth for sprite extraction. The workout avatar renders the 21 aligned, transparent PNGs in `apps/web/static/poses/hf-chara/`. Frame metadata lives in `apps/web/src/lib/pose/sprite-states.json`, while each sprite keeps its own 480×480 annotation file beside the PNG as `<name>.png.json`.

To regenerate every transparent frame from the atlas, run:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tools\split-sprite-atlas.ps1
```

The exporter removes white matte regions connected to a crop boundary, clears substantial enclosed background gaps between limbs, and preserves the original sprite pixels. Every output is bottom-centred on the same 480×480 transparent canvas so frame changes do not shift the avatar anchor.

## Annotate an individual sprite

1. Open `pose-annotator.html` directly or serve the repository over HTTP.
2. Select one PNG from `apps/web/static/poses/hf-chara/`.
3. Place the landmarks on the shared 480×480 sprite canvas. Matchable frames require the visible-side shoulder, elbow, wrist, hip, knee, and ankle; the current files include the complete 17-point MoveNet set.
4. Choose **Download JSON** and save it beside the PNG as `<name>.png.json`.
5. Repeat for the remaining sprites, then run `npm test`, `npm run check`, and `npm run build` from `apps/web`.

The runtime fetches these JSON files directly and preserves their 480×480 coordinates without conversion. It translates, scales, and horizontally mirrors both live and reference skeletons before comparison, selects the nearest role-compatible frame, and requires a stable, meaningfully better candidate before switching. This reduces avatar jitter.

If the annotations cannot be loaded or validated, the interface retains deterministic sprite fallbacks for ready, valid plank, corrections, failure, and completion states.

Camera frames and live landmarks remain in the browser. Sprite matching does not upload pose data or change the form-validation rules that control credited time.
