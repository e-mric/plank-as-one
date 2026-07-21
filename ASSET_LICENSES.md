# Dependency and Asset License Ledger

Review date: 2026-07-21

Technical inventory reviewer: Codex

Entrant approval: **APPROVED for the current repository and runnable application scope** by the project-team requester through the Codex thread, 2026-07-21

Input provenance confirmation: project team, 2026-07-20 and 2026-07-21

Approval evidence: [2026-07-21 asset-ledger review](./docs/reviews/2026-07-21-asset-ledger-review.md)

This ledger separates the repository's software license from third-party dependencies and visual assets. The root [MIT license](./LICENSE) applies to original project source code and documentation authored by the Plank As One contributors. It does **not** grant rights to third-party packages, fonts, models, or visual assets governed by separate terms.

This is an operational rights inventory, not legal advice. The entrant remains responsible for confirming ownership, permissions, attribution, and suitability for the Build Week submission and promotional use.

## Status legend

- **PASS** — source and license are identified from the installed package or repository evidence.
- **CONDITIONAL** — the generation platform permits the intended use, but entrant confirmation of input rights and output review is still required.
- **BLOCKED** — the repository does not contain enough provenance or permission evidence for submission.
- **N/A** — the file is not included in the runnable application or proposed submission materials; remove it from the submission or reassess if that changes.

## Direct software dependencies

Versions below are resolved by `package-lock.json`, not inferred from `latest` declarations.

| Component | Version | Source/author | License | Attribution or notice | Location used | Status |
| --- | ---: | --- | --- | --- | --- | --- |
| TensorFlow.js Pose Detection / MoveNet | 2.1.3 | [TensorFlow.js Models](https://github.com/tensorflow/tfjs-models) / Google | Apache-2.0 | Preserve upstream copyright and license notices when redistributing | `apps/web/src/lib/pose/detector.js` | PASS |
| TensorFlow.js core, converter, WebGL, and WASM backends | 4.22.0 | [TensorFlow.js](https://github.com/tensorflow/tfjs) / Google | Apache-2.0 | Preserve upstream copyright and license notices when redistributing | Browser pose runtime | PASS |
| Pixelify Sans | 5.2.7 package | [Pixelify Sans Project Authors](https://github.com/eifetx/Pixelify-Sans), distributed through [Fontsource](https://fontsource.org/fonts/pixelify-sans) | OFL-1.1 | Retain `Copyright 2021 The Pixelify Sans Project Authors` and the OFL license; do not sell the font by itself | `apps/web/src/routes/+layout.svelte` | PASS |
| Svelte | 5.56.5 | [Svelte](https://github.com/sveltejs/svelte) contributors | MIT | Preserve upstream copyright and license notice | Web application | PASS |
| SvelteKit / adapter-auto | 2.70.1 / 4.0.0 | [SvelteKit](https://github.com/sveltejs/kit) contributors | MIT | Preserve upstream copyright and license notice | Web application/build | PASS |
| Svelte Vite plugin | 5.1.1 | [Svelte Vite plugin](https://github.com/sveltejs/vite-plugin-svelte) contributors | MIT | Preserve upstream copyright and license notice | Build tooling | PASS |
| Svelte Check | 4.7.3 | [Svelte language tools](https://github.com/sveltejs/language-tools) contributors | MIT | Preserve upstream copyright and license notice | Development verification | PASS |
| Vite | 6.4.3 | [Vite](https://github.com/vitejs/vite) contributors | MIT | Preserve upstream copyright and license notice | Build tooling | PASS |
| TypeScript | 5.9.3 | [TypeScript](https://github.com/microsoft/TypeScript) / Microsoft | Apache-2.0 | Preserve upstream copyright and license notices | Development verification | PASS |
| Supabase JavaScript client | 2.110.7 | [Supabase](https://github.com/supabase/supabase-js) contributors | MIT | Preserve upstream copyright and license notice | Anonymous auth, database RPC, snapshots, and realtime canvas updates | PASS |

The lockfile currently contains 154 transitive and direct package entries. Every entry includes license metadata. Recorded license families are MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC, 0BSD, and OFL-1.1. `package-lock.json` is the version inventory; licenses shipped in the installed package distributions remain authoritative.

`npm audit` on 2026-07-21 reports three low-severity entries that trace to one advisory, `GHSA-pxg6-pf52-xh8x`, in SvelteKit's `cookie@0.6.0` dependency. The installed SvelteKit `2.70.1` was rechecked as the current registry release on 2026-07-21 and still declares `cookie@^0.6.0`; npm's proposed "fix" is an invalid major downgrade. This application does not construct cookie names, paths, or domains from participant input. Recheck for an upstream patched SvelteKit release before final deployment rather than forcing an unsupported override.

## Verified repository inventory

The 2026-07-21 tracked-file audit found 28 PNG files and one SVG. It found no committed music, recorded speech, video, font binary, or third-party logo file. Font binaries are supplied by the licensed Fontsource package at build time. The sprite set also includes 21 project-authored annotation JSON files.

## Runtime visual assets

These files are shipped to participants by the web application.

The entrant identified Higgsfield as the generation source and confirmed that the assets were generated without uploaded third-party reference images or named third-party characters, films, celebrities, or brands. The `hf-chara.png` source-sheet provenance was reconfirmed in the Codex thread on 2026-07-21. [Higgsfield's Terms of Use](https://higgsfield.ai/terms-of-use-agreement), last updated 2025-08-30 and rechecked 2026-07-21, state in section 4.4 that Higgsfield does not claim ownership of user inputs or outputs and does not restrict commercial use of outputs. The same terms make the user responsible for having sufficient rights to inputs and for avoiding infringement or other prohibited content. Higgsfield also retains broad rights to use inputs and outputs. This platform permission does not establish copyrightability, exclusivity, or clearance of third-party rights in a particular output.

| Asset group | Repository provenance | Creator/source | Permission or license | Required action | Status |
| --- | --- | --- | --- | --- | --- |
| `hf-chara.png` sprite source sheet and 21 extracted transparent PNG frames | Source sheet added in commit `dd7174c` on 2026-07-21; extracted frame set completed before the `16d6bf7` annotation commit | Higgsfield output supplied by the project team without third-party reference images or named protected subjects; frame extraction and transparent-background cleanup performed for this project; exact model/preset and prompt are not retained | Higgsfield does not restrict commercial use of outputs; images are excluded from the MIT software grant and no separate visual-asset reuse license is granted | Preserve the source sheet, extracted frames, commit history, this provenance confirmation, and the resemblance review below | PASS |
| 21 per-frame pose annotation JSON files and `sprite-states.json` metadata | Individual frame annotations added in commit `16d6bf7` on 2026-07-21 and integrated by the project team | Manual annotations and matching metadata authored by project contributors | Original project data/source under the repository MIT license; underlying PNG rights remain separate | Keep annotation files adjacent to their corresponding frame and validate them in the automated test suite | PASS |
| Pixel `O` favicon and code-rendered `PLANK AS ONE` logo/shared canvas artwork | Favicon added in commit `56700d6` on 2026-07-21; logo and canvas are authored in application code | Original project design created by the contributors with Codex assistance; no third-party logo or image incorporated | Root MIT license for the SVG and source implementation | Keep the SVG source and application implementation as provenance | PASS |
| `charaplanko-pixel.png` | Added in commit `ed432c7` on 2026-07-16 | Higgsfield output generated without third-party reference images or named protected subjects; exact model/preset and prompt are not retained in the repository | Higgsfield does not restrict commercial use of outputs; image is excluded from the MIT software grant and no separate reuse license is granted | File is not referenced by the current application; exclude it from submission materials or retain this provenance record if it stays public | PASS |

Covered paths:

- `apps/web/static/poses/hf-chara.png`
- `apps/web/static/poses/hf-chara/*.png`
- `apps/web/static/poses/hf-chara/*.png.json`
- `apps/web/src/lib/pose/sprite-states.json`
- `apps/web/static/favicon.svg`
- `apps/web/static/charaplanko-pixel.png`

## Design and presentation assets

These assets are not loaded by the current SvelteKit application, but they are included in the public repository and may appear in submission materials.

The same Higgsfield terms and limitations described for the runtime assets apply to these images.

| Asset group | Repository provenance | Creator/source | Permission or license | Required action | Status |
| --- | --- | --- | --- | --- | --- |
| `main.png`, `active.png`, and `main-page-reference.png` | Added or updated in design commits beginning with `abe7c52` on 2026-07-16 | Higgsfield outputs and/or project exports derived from Higgsfield outputs, generated without third-party reference images or named protected subjects; exact model/preset and prompts are not retained in the repository | Higgsfield does not restrict commercial use of outputs; images are excluded from the MIT software grant and no separate reuse license is granted | Retain available generation/export evidence and the completed output review below | PASS |
| `intro-story.png` and `intro-collective.png` | Added with the slide/design work beginning with `abe7c52` on 2026-07-16 | Higgsfield outputs generated without third-party reference images or named protected subjects; exact model/preset and prompts are not retained in the repository | Higgsfield does not restrict commercial use of outputs; images are excluded from the MIT software grant and no separate reuse license is granted | Retain available generation evidence and the completed output review below | PASS |
| HTML slide/design files | Authored in this repository during the submission period | Plank As One contributors | MIT under the root software/documentation license, excluding embedded images and third-party fonts | Keep embedded image rights separate as listed above | PASS |

Covered paths:

- `slides/designs/assets/*.png`
- `slides/designs/*.html`

## Visual resemblance review

Review performed from the checked-in PNGs on 2026-07-21. This is a practical submission screen, not a legal clearance opinion or reverse-image search.

| Finding | Assessment | Required action |
| --- | --- | --- |
| Current `hf-chara` runtime sprite uses a highly muscular, red-haired fighting-game-like presentation with dark red shorts and wrist wraps | No logo, name, signature costume, or exact protected character was established. The team confirmed that generation did not use third-party reference images or named protected subjects. A residual genre resemblance risk remains. | Accepted for the Build Week prototype with provenance recorded; do not compare it to or name a third-party game or character in the app, video, or submission |
| Unused `charaplanko-pixel.png` includes a red headband and stronger fighting-game styling | The file is not loaded by the application. No exact protected character was established, but its combination of traits carries a higher resemblance risk than the current sprite sheet. | Do not use it in screenshots, video, or promotional materials; removal remains the lowest-risk option if the public repository is cleaned further |
| `intro-story.png` shows a lone television runner becoming a group of runners | The image contains no visible film logo or named character. The team confirmed that generation did not use a film title, actor, character, screenshot, or other third-party reference. | Do not describe the scene with a film comparison in the app, video, or submission |
| `intro-collective.png` shows varied participants beneath a pixel field | No obvious third-party logo or specific character was observed | Confirm reference-image rights and retain the project-generation record if available |
| UI concept images show Plank As One interface compositions | No obvious external interface or brand was observed in the reviewed files | Keep the source HTML/export workflow and ensure the final video uses the implemented product rather than presenting concepts as working screens |

## Application-generated audio

The current application does not ship music or recorded speech. Correction tones are synthesized at runtime with the Web Audio API, and spoken prompts use the participant's browser speech-synthesis voice. No audio recording is stored in the repository.

Status: **PASS for the current application**, subject to ensuring the demo video does not add unlicensed music, recordings, or sound effects.

## Entrant approval and continuing conditions

Before final submission, the authorized entrant or Team Representative must:

- [x] Confirm the creator/source and rights basis for every runtime pose image.
- [x] Confirm the creator/source and rights basis for every slide/design PNG used in the repository, screenshots, or video.
- [x] Confirm that generation did not use uploaded third-party reference images or named third-party characters, films, celebrities, or brands.
- [x] Preserve the available generation evidence: source sheets/exports, extracted frames, Git history, Higgsfield terms link, and project-team provenance confirmations. The exact prompts, preset/model, account-holder record, and original Higgsfield project history are unavailable and this limitation is disclosed rather than reconstructed.
- [x] Retain all currently available source and export files. No separate written Higgsfield permission was identified as required under the reviewed output-use terms; the entrant remains responsible for third-party rights in each output.
- [x] Review generated assets for accidental resemblance to protected characters, brands, costumes, or recognizable scenes.
- [x] Remove or exclude from submission any asset whose source or permission cannot be established. No unresolved source remains after the 2026-07-20 team confirmation.
- [ ] Confirm that no unlicensed music, footage, logos, or third-party marks appear in the final public demo. This is a separate final-media gate because the video is not part of the current repository/application asset inventory.
- [x] Approve this ledger for the current repository and runnable application scope. Approval instruction was provided by the project-team requester in the Codex thread on 2026-07-21.

## Decision

**APPROVED for the current repository and runnable application scope on 2026-07-21.** Re-open this ledger if any dependency, generated image, font, audio, video, screenshot, logo, or promotional asset changes. This approval does not approve a future demo video before its final media review.
