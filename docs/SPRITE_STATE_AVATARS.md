# Sprite-state avatars

The unchanged `hf-chara.png` atlas is the source of truth for annotation. The workout avatar renders the 21 aligned, transparent PNGs in `apps/web/static/poses/hf-chara/`; frame bounds, asset paths, and reference keypoints live in `apps/web/src/lib/pose/sprite-states.json`.

To regenerate every transparent frame from the atlas, run:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tools\split-sprite-atlas.ps1
```

The exporter removes white matte regions connected to a crop boundary, clears substantial enclosed background gaps between limbs, and preserves the original sprite pixels. Every output is bottom-centred on the same 480×480 transparent canvas so frame changes do not shift the avatar anchor.

## Annotate the atlas

1. Serve the repository over HTTP and open `pose-annotator.html`.
2. Choose **Open sprite sample**. If the tool is opened directly from disk instead, select both `apps/web/static/poses/hf-chara.png` and `apps/web/src/lib/pose/sprite-states.json` using the file inputs.
3. Select a frame and place the six visible-side points: shoulder, elbow, wrist, hip, knee, and ankle.
4. Use **Previous** and **Next** to annotate the remaining matchable frames. Celebration frames are display-only.
5. Choose **Download JSON** and replace `apps/web/src/lib/pose/sprite-states.json` with the exported file.
6. Run `npm test`, `npm run check`, and `npm run build` from `apps/web`.

Coordinates are stored relative to each cropped frame. The runtime translates, scales, and horizontally mirrors both live and reference skeletons before comparison. It selects the nearest role-compatible frame and requires a stable, meaningfully better candidate before switching, which reduces avatar jitter.

Frames without all six required points are ignored automatically. Until annotations exist, the interface renders deterministic atlas fallbacks for ready, valid plank, corrections, failure, and completion states.

Camera frames and live landmarks remain in the browser. Sprite matching does not upload pose data or change the form-validation rules that control credited time.
