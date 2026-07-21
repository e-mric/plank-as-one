# Asset ledger review — 2026-07-21

Review type: release-candidate asset and dependency review

Review date/time/timezone: 2026-07-21 22:48 CEST (Europe/Brussels)

Rules checked date/time/timezone: 2026-07-21 CEST

Reviewer(s): Codex technical inventory; project-team requester approval instruction

Commit SHA reviewed: `3f1d556` plus the documented working-tree ledger updates

Repository scope: tracked source repository and runnable SvelteKit application

## Result

P0 PASS:

- Rechecked the [OpenAI Build Week Official Rules](https://openai.devpost.com/rules), including third-party integrations, submission ownership, open-source compliance, and prohibited unlicensed demo material.
- Rechecked [Higgsfield's Terms of Use](https://higgsfield.ai/terms-of-use-agreement), including section 4.4 output use and the user's responsibility for inputs and third-party rights.
- Recorded the project team's confirmation that generated visuals used no uploaded third-party reference image or named protected character, film, celebrity, or brand.
- Reviewed all 28 tracked PNG files and the one tracked SVG by inventory; re-reviewed the current Higgsfield sprite sheet and the higher-risk unused legacy character asset.
- Confirmed the application ships no recorded audio, music, or video and uses project-authored Web Audio/speech-synthesis behavior.

P0 FAIL: none within the current repository/application asset scope.

P0 BLOCKED: none within the current repository/application asset scope.

P1 PASS:

- `package-lock.json` resolves 212 direct/transitive package entries; all contain license metadata from the families MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC, 0BSD, BlueOak-1.0.0, and OFL-1.1.
- Direct dependency names, versions, sources, licenses, notices, usage locations, and review status are recorded in `ASSET_LICENSES.md`.
- Current runtime provenance now covers the `hf-chara.png` source sheet, 21 extracted frames, 21 manual annotation JSON files, sprite manifest, and project-authored favicon/logo.

Residual conditions:

- Do not use `charaplanko-pixel.png` in the submission video or promotional material.
- Do not describe any generated scene or sprite using a third-party film, game, actor, or character comparison.
- Re-open the ledger if any dependency or asset changes.
- Review the locked YouTube video separately for music, footage, logos, marks, personal data, and browser chrome before submission.

Evidence reviewed:

- `ASSET_LICENSES.md`, `package-lock.json`, installed package metadata, tracked-file inventory, asset Git history, and current application imports.
- `npm audit --json` on 2026-07-21 after the Vercel adapter upgrade: four low-severity findings; no moderate, high, or critical finding. The upgrade from adapter 5.10.3 to 6.3.4 resolved the moderate `GHSA-9pq4-5hcf-288c` finding detected during deployment.
- Registry check on 2026-07-21: installed SvelteKit `2.70.1` is the current release; npm's suggested downgrade is not accepted.

Decision: **GO for the current repository/application asset scope.** This is not an overall final-submission GO; deployment, video/media, Session ID, and the remaining Build Week gates are reviewed separately.

Representative approval: approval instruction recorded from the project-team requester in the Codex thread on 2026-07-21.
