# Dependency and Asset License Ledger

Review date: 2026-07-20  
Technical inventory reviewer: Codex  
Entrant approval: pending
Input provenance confirmation: project team, 2026-07-20

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

`npm audit` on 2026-07-20 reports three low-severity entries that trace to one advisory, `GHSA-pxg6-pf52-xh8x`, in SvelteKit's `cookie@0.6.0` dependency. The installed SvelteKit `2.70.1` is the current registry release and still declares `cookie@^0.6.0`; npm's proposed “fix” is an invalid major downgrade. This application does not construct cookie names, paths, or domains from participant input. Recheck for an upstream patched SvelteKit release before final deployment rather than forcing an unsupported override.

## Runtime visual assets

These files are shipped to participants by the web application.

The entrant identified Higgsfield as the generation source on 2026-07-20 and confirmed that the assets were generated without uploaded third-party reference images or named third-party characters, films, celebrities, or brands. [Higgsfield's Terms of Use](https://higgsfield.ai/terms-of-use-agreement), last updated 2025-08-30 and rechecked 2026-07-20, state in section 4.4 that Higgsfield does not claim ownership of user inputs or outputs and does not restrict commercial use of outputs. The same terms make the user responsible for having sufficient rights to inputs and for avoiding infringement or other prohibited content. Higgsfield also retains broad rights to use inputs and outputs. This platform permission does not establish copyrightability, exclusivity, or clearance of third-party rights in a particular output.

| Asset group | Repository provenance | Creator/source | Permission or license | Required action | Status |
| --- | --- | --- | --- | --- | --- |
| Ready, perfect, bad, hips-low, hips-high, and exhausted pose images | Added in commits `ed432c7`, `bb1e6cc`, and `f014b84` on 2026-07-16/17 | Higgsfield output generated by the project team without third-party reference images or named protected subjects; exact model/preset and prompts are not retained in the repository | Higgsfield does not restrict commercial use of outputs; images are excluded from the MIT software grant and no separate reuse license is granted | Preserve available Higgsfield project/history evidence and the completed resemblance review below | PASS |
| Celebration source, composite, and 15 animation frames | Added in commits `b35e33f` and later pose updates on 2026-07-17/18 | Higgsfield output generated without third-party reference images or named protected subjects, followed by project animation/export edits; exact generation and editing chain is not retained in the repository | Higgsfield does not restrict commercial use of outputs; images are excluded from the MIT software grant and no separate reuse license is granted | Preserve available generation/export evidence and the completed resemblance review below | PASS |
| `charaplanko-pixel.png` | Added in commit `ed432c7` on 2026-07-16 | Higgsfield output generated without third-party reference images or named protected subjects; exact model/preset and prompt are not retained in the repository | Higgsfield does not restrict commercial use of outputs; image is excluded from the MIT software grant and no separate reuse license is granted | File is not referenced by the current application; exclude it from submission materials or retain this provenance record if it stays public | PASS |

Covered paths:

- `apps/web/static/poses/*.png`
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

Review performed from the checked-in PNGs on 2026-07-20. This is a practical submission screen, not a legal clearance opinion or reverse-image search.

| Finding | Assessment | Required action |
| --- | --- | --- |
| Runtime pose character uses a highly muscular anime/fighting-game presentation, including red wrist wraps and a red headband in some states | No exact protected character was established. The team confirmed that generation did not use third-party reference images or named protected subjects. A residual stylistic resemblance risk remains. | Accepted for the prototype with provenance recorded; replacing it with a more neutral participant remains the lower-risk option for a later release |
| `intro-story.png` shows a lone television runner becoming a group of runners | The image contains no visible film logo or named character. The team confirmed that generation did not use a film title, actor, character, screenshot, or other third-party reference. | Do not describe the scene with a film comparison in the app, video, or submission |
| `intro-collective.png` shows varied participants beneath a pixel field | No obvious third-party logo or specific character was observed | Confirm reference-image rights and retain the project-generation record if available |
| UI concept images show Plank As One interface compositions | No obvious external interface or brand was observed in the reviewed files | Keep the source HTML/export workflow and ensure the final video uses the implemented product rather than presenting concepts as working screens |

## Application-generated audio

The current application does not ship music or recorded speech. Correction tones are synthesized at runtime with the Web Audio API, and spoken prompts use the participant's browser speech-synthesis voice. No audio recording is stored in the repository.

Status: **PASS for the current application**, subject to ensuring the demo video does not add unlicensed music, recordings, or sound effects.

## Entrant approval required

Before final submission, the authorized entrant or Team Representative must:

- [x] Confirm the creator/source and rights basis for every runtime pose image.
- [x] Confirm the creator/source and rights basis for every slide/design PNG used in the repository, screenshots, or video.
- [x] Confirm that generation did not use uploaded third-party reference images or named third-party characters, films, celebrities, or brands.
- [ ] Record the Higgsfield account holder and preserve screenshots/exports from available Higgsfield project history where prompts are no longer available.
- [ ] Retain prompts, source files, export files, or written permissions where applicable.
- [x] Review generated assets for accidental resemblance to protected characters, brands, costumes, or recognizable scenes.
- [x] Remove or exclude from submission any asset whose source or permission cannot be established. No unresolved source remains after the 2026-07-20 team confirmation.
- [ ] Confirm that no unlicensed music, footage, logos, or third-party marks appear in the public demo.
- [ ] Approve this ledger and replace `Entrant approval: pending` with the approver and date.
