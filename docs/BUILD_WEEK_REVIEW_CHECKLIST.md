# OpenAI Build Week — Compliance and Submission Review

**Project:** The Plank Canvas

**Proposed track:** Apps for Your Life

**Rules source:** [OpenAI Build Week Official Rules](https://openai.devpost.com/rules)

**Rules last checked:** 2026-07-15

**Sponsor:** OpenAI OpCo, LLC

**Administrator:** Devpost, Inc.

**Submission deadline:** 2026-07-21 at 5:00 p.m. PDT — 2026-07-22 at 02:00 CEST in Brussels

**Judging access required through:** 2026-08-05 at 5:00 p.m. PDT — 2026-08-06 at 02:00 CEST in Brussels

> This is an operational review checklist, not legal advice. The Official Rules, Devpost notices, incorporated Devpost terms, and applicable law control. The rules may change; re-open the official page and record a new verification date before every release-candidate and submission review.

## 1. How to use this document

Use this checklist for architecture reviews, pull-request release reviews, demo reviews, and the final Devpost submission review. Copy the review record at the end of this document into a new dated file or pull-request comment and attach evidence for every `PASS`.

Allowed statuses:

- `PASS` — verified with linked or named evidence.
- `FAIL` — requirement is not satisfied; submission must not proceed.
- `BLOCKED` — evidence or an authorized decision is missing.
- `N/A` — reviewer documented why the requirement does not apply.

Severity:

- `P0` — eligibility or submission blocker.
- `P1` — likely judging, testing, intellectual-property, privacy, or reliability risk.
- `P2` — improvement that strengthens the submission but is not required by the rules.

No review is complete while a `P0` item is `FAIL` or `BLOCKED`.

## 2. Current project findings

These findings describe the repository as observed on 2026-07-15 and must be rechecked rather than assumed in later reviews.

| Status | Severity | Finding | Required action |
| --- | --- | --- | --- |
| PASS, conditional | P0 | The visible Git history begins on 2026-07-14, inside the submission period. | Team Representative must confirm that the submitted project was not developed outside this repository before 2026-07-13 at 9:00 a.m. PDT. Preserve dated commits and Codex session evidence. |
| BLOCKED | P0 | The rules require a project built with Codex and GPT-5.6, plus the `/feedback` Codex Session ID for the thread where most core functionality was built. | Choose and preserve the primary implementation thread, use Codex/GPT-5.6 for core work, and record the `/feedback` Session ID before submission. |
| BLOCKED | P0 | No runnable application or public judging URL has been verified yet. | Deploy a free, stable build and verify the complete demonstrated path without team assistance. |
| BLOCKED | P0 | No submission video has been verified. | Produce an English, public YouTube demo with audio, under three minutes, covering the product and how Codex/GPT-5.6 were used. |
| BLOCKED | P0 | No repository README or repository license was found. | Add the required Codex collaboration narrative, setup/test instructions, architecture summary, and dependency/license information. If the repository is public, add an appropriate project license; if private, share it with the required judging addresses. |
| BLOCKED | P0 | Team eligibility and authorized Representative are not documented. | Record every member's eligibility and designate one authorized Representative. |
| FAIL if used | P0 | A recognizable Forrest Gump/Tom Hanks depiction, film clip, soundtrack, trademark, or copied scene would create third-party IP and submission-video risk without permission. | Use the original runner placeholder or retain written rights evidence covering the application, repository assets, screenshots, video, and promotional use. |
| BLOCKED | P1 | Third-party SDK, font, model, artwork, audio, and generated-asset licenses have not been collected into a reviewable ledger. | Create and approve an asset/dependency license ledger before the demo is recorded. |
| BLOCKED | P1 | The working tree contains modified, deleted, and untracked artifacts. | Produce a clean, reproducible release commit and verify that no required presentation, asset, secret, or generated file is missing. |

## 3. Event timing and submission control

Official Rules sections 1 and 6 apply.

- [ ] `P0` Registration was completed between 2026-07-09 10:00 a.m. PDT and 2026-07-21 5:00 p.m. PDT.
- [ ] `P0` The final submission will be received before 2026-07-21 5:00 p.m. PDT. A local draft or upload attempt is not proof of receipt.
- [ ] `P0` The team has assigned an internal freeze and upload time with enough margin to recover from Devpost, YouTube, repository, or hosting failures.
- [ ] `P0` A team member will verify the submitted Devpost page, links, and receipt before the deadline.
- [ ] `P0` The judged deployment and testing access will remain free and unrestricted through 2026-08-05 5:00 p.m. PDT.
- [ ] `P1` The team understands that the submitted entry cannot normally be changed after the deadline. Post-deadline portfolio edits do not alter the judged submission.
- [ ] `P1` Any permitted post-deadline correction is limited to what OpenAI/Devpost expressly authorizes, such as removing infringing or inappropriate material without substantively changing the entry.
- [ ] `P2` If needed, optional hackathon credits are requested by 2026-07-17 at 12:00 p.m. PDT while available and subject to approval; credit use and expiry are tracked, and the team remains responsible for additional charges.
- [ ] `P2` The team has recorded the judging period and winner-announcement dates and monitors the Representative's email for verification requests.

## 4. Entrant and team eligibility

Official Rules sections 2, 3, 10–16 apply. The Representative owns this gate; a code reviewer cannot infer eligibility.

- [ ] `P0` Every participating individual is at least the age of majority where they reside, or the eligible entrant is the parent/guardian permitted by the rules.
- [ ] `P0` Every individual and any entering organization resides or is organized in a country or territory that supports OpenAI API access and is not prohibited by the rules or applicable law.
- [ ] `P0` No participant or organization falls into an excluded jurisdiction or sanctions category identified by the rules.
- [ ] `P0` No participant, household/immediate-family member, employer, affiliate, agent, Judge relationship, or other relationship creates a prohibited Promotion Entity connection or real/apparent conflict of interest.
- [ ] `P0` The four-person team has appointed one eligible and authorized Representative to act and submit on behalf of the team.
- [ ] `P0` The Representative has a current roster containing legal names, roles, countries of residence, and confirmation of eligibility.
- [ ] `P0` The project did not receive prohibited prior financial or preferential support, funding, investment, contract development, or commercial licensing from OpenAI or Devpost. Any official hackathon credits are documented separately.
- [ ] `P1` Every team member understands the rules' publicity, name/likeness/voice use, entry conditions, releases, dispute provisions, and possible tax/verification obligations.
- [ ] `P1` The Representative has reviewed the incorporated Devpost Terms of Service and Privacy Policy.

## 5. Project eligibility and required technology

Official Rules section 4, Project Requirements, applies.

- [ ] `P0` The selected category is `Apps for Your Life`, and the submission explains why a consumer fitness/habit application fits that track.
- [ ] `P0` Codex and GPT-5.6 were used materially to build the project, not only to draft the submission text.
- [ ] `P0` The repository contains non-trivial, working implementation evidence attributable to Codex-assisted work.
- [ ] `P0` The primary Codex implementation thread is identified, retained, and capable of producing the required `/feedback` Session ID.
- [ ] `P0` If any project work predates 2026-07-13 9:00 a.m. PDT, the submission clearly distinguishes pre-existing work from meaningful Codex/GPT-5.6 extensions completed during the submission period.
- [ ] `P0` Dated commits, Codex logs, review records, and other evidence establish what was built during the submission period.
- [ ] `P0` The web application runs consistently on the stated supported platform and functions exactly as depicted and described.
- [ ] `P0` The submission does not claim native, browser, camera, AI, realtime, accessibility, privacy, or health behavior that the judged build cannot demonstrate.
- [ ] `P1` OpenAI service usage and costs are monitored; the team accepts charges beyond any provided credits.
- [ ] `P1` If the team installs the optional Devpost plugin, its output is treated only as assistance and every rule statement is reverified against the official page.

## 6. Third-party services, open source, and intellectual property

Official Rules sections 4, 8, and 12 apply.

- [ ] `P0` The project is the team's original work, is owned by the entrant/team, and does not violate copyright, trademark, patent, contract, privacy, publicity, or other third-party rights.
- [ ] `P0` Every third-party SDK, API, dataset, model, font, dependency, hosted service, and asset is used under terms that permit this project and submission.
- [ ] `P0` Open-source license conditions are satisfied, including attribution, notices, source obligations, modification notices, and license compatibility where applicable.
- [ ] `P0` The project adds original functionality beyond its open-source foundations.
- [ ] `P0` All artwork, sprites, icons, fonts, music, sound effects, narration, screenshots, and video elements are original, properly licensed, or removed.
- [ ] `P0` No Forrest Gump, Tom Hanks, film-studio, broadcast, soundtrack, costume, dialogue, logo, or recognizable movie asset appears without documented permission broad enough for the submission and promotion rights granted by the rules.
- [ ] `P0` Generated assets were reviewed for accidental resemblance to protected characters, brands, or source images, and their prompts/provenance are retained.
- [ ] `P0` The public demo video contains no unauthorized trademark, copyrighted music, film footage, image, or other protected material.
- [ ] `P0` The repository and deliverables contain no malware, disabling code, hidden miners, spyware, or malicious dependencies.
- [ ] `P1` An asset and dependency ledger records name, version, source, author, license/permission, required attribution, location used, and reviewer.
- [ ] `P1` Health-benefit statements, including BDNF and cardiovascular wording, are evidence-linked, qualified, and consistent across the app, README, video, and submission page.

## 7. Repository and reproducibility

Official Rules section 4, Submission Requirements and Testing, applies.

- [ ] `P0` A repository URL is ready for the submission.
- [ ] `P0` If public, the repository includes relevant licensing and contains no secrets, private data, disallowed assets, or internal-only material.
- [ ] `P0` If private, access is granted to both `testing@devpost.com` and `build-week-event@openai.com` before submission and remains available through judging.
- [ ] `P0` The submitted commit SHA/tag is recorded and matches the deployed demo and video.
- [ ] `P0` A clean clone can install, build, test, and run using documented commands and supported versions.
- [ ] `P0` No Supabase service-role key, OpenAI key, personal token, private credential, camera recording, personal data, or production secret is committed or exposed in build artifacts.
- [ ] `P1` Lockfiles are committed and dependency versions are reproducible.
- [ ] `P1` Database migrations, seed/demo data, environment-variable names, and preview setup are documented.
- [ ] `P1` CI results, Storybook build, tests, security checks, and deployment health are linked from the review record.

### Required README content

- [ ] `P0` What The Plank Canvas does and which real audience/problem it serves.
- [ ] `P0` How to run and test the application.
- [ ] `P0` Supported platform/browser requirements and known limitations.
- [ ] `P0` Architecture and privacy explanation, especially browser-only camera processing.
- [ ] `P0` How the team collaborated with Codex throughout the project.
- [ ] `P0` Where Codex accelerated implementation or review.
- [ ] `P0` Which product, engineering, safety, and design decisions remained human/team decisions.
- [ ] `P0` How GPT-5.6 and Codex contributed to the final result.
- [ ] `P1` Third-party dependencies, licenses, acknowledgments, and asset provenance.

## 8. Working demo and judge access

Official Rules section 4, Testing, applies.

- [ ] `P0` The submission provides a working website, demo, or test build at no charge and without restrictions through the judging period.
- [ ] `P0` A judge can reach the primary journey without contacting the team.
- [ ] `P0` Any private route has explicit testing instructions and non-personal test credentials.
- [ ] `P0` Camera permission denial does not prevent judges from viewing enough of the product to understand it; provide a safe demo/mock path if necessary and label it honestly.
- [ ] `P0` The test environment contains a valid current challenge, artwork, anonymous-user path, completion demo mechanism, pixel placement, archive example, and Leader demonstration strategy.
- [ ] `P0` The deployment remains consistent with the video and text description.
- [ ] `P1` The demo survives refresh, anonymous-session creation, repeat judging, timezone differences, reconnect, and expected free-tier limits.
- [ ] `P1` Monitoring alerts the team if hosting, Supabase, assets, or the demo URL fails during judging.
- [ ] `P1` No proprietary or uncommon hardware is required; only a normal smartphone, tablet, or desktop computer and ordinary camera capability are assumed.

## 9. Devpost submission package

Official Rules section 4, Submission Requirements, applies.

- [ ] `P0` Every required field on the Devpost submission page is complete before the deadline.
- [ ] `P0` The category selected is the approved category.
- [ ] `P0` The English project description accurately explains features and functionality.
- [ ] `P0` All submission materials are in English, or complete English translations are supplied.
- [ ] `P0` The public YouTube video is under three minutes; target no more than 2:50 to leave margin.
- [ ] `P0` The video has clear, intelligible audio.
- [ ] `P0` The video clearly demonstrates what was built.
- [ ] `P0` The video clearly explains how Codex and GPT-5.6 were used.
- [ ] `P0` The video does not show features that are mocked, broken, unavailable to judges, or materially different from the submitted build without clearly identifying them.
- [ ] `P0` The YouTube link is public and works in a signed-out/private browser session.
- [ ] `P0` The repository link and access mode are correct.
- [ ] `P0` The `/feedback` Codex Session ID from the primary core-implementation thread is included.
- [ ] `P0` Testing URL, instructions, and any permitted credentials work in a clean browser.
- [ ] `N/A` Because this is a consumer web application rather than a plugin or developer tool, the additional plugin/dev-tool installation and sandbox requirement does not apply. Re-evaluate if the category or deliverable changes.
- [ ] `P1` Final screenshots contain no secrets, personal data, unlicensed assets, browser bookmarks, notifications, or unrelated applications.
- [ ] `P1` A PDF/screenshot archive of the final Devpost entry, video metadata, repository access, deployment version, and confirmation receipt is retained.
- [ ] `N/A` If another project is also submitted, it is unique and substantially different from this submission.

## 10. Judging-readiness review

Official Rules section 7 applies. Stage One is a viability/theme/tool-use gate; Stage Two uses four equally weighted criteria.

### Stage One — pass/fail viability

- [ ] `P0` The project clearly fits Apps for Your Life.
- [ ] `P0` The required Codex/GPT-5.6 use is obvious from the repository, README, video, and Session ID.
- [ ] `P0` The deployed project is viable and runnable.

### Stage Two — equally weighted criteria

- [ ] `P1` **Technological Implementation:** demonstrate thorough and skillful Codex use, non-trivial implementation, browser-only pose estimation, deterministic form logic, atomic placement, and realtime synchronization.
- [ ] `P1` **Design:** demonstrate a coherent end-to-end product rather than disconnected prototypes: intro, challenge, camera preparation, timed plank, earned pixel, shared canvas, and archive.
- [ ] `P1` **Potential Impact:** make a credible and specific case for helping people maintain a flexible daily fitness habit through privacy-preserving feedback and visible community progress.
- [ ] `P1` **Quality of the Idea:** explain what is novel about turning asynchronous exercise completions into pixels that reveal a shared daily artwork.
- [ ] `P1` The first minutes and first paragraphs communicate all four criteria because judges may rely only on submitted text, images, and video and are not required to test the application.

## 11. Privacy, safety, and truthfulness review

These checks support the rules' functionality, ownership, privacy-rights, and accurate-description requirements and the product's own PRD.

- [ ] `P0` Camera frames remain on-device and a network inspection confirms they are never transmitted or stored.
- [ ] `P0` The privacy claim in the app, README, video, and submission description matches observed behavior.
- [ ] `P0` Fitness and BDNF statements are not represented as medical treatment, guaranteed outcomes, or immediate effects from one plank.
- [ ] `P0` The demonstrated timer, grace period, pose feedback, progression, streak, entitlement, and placement behavior matches the submitted build.
- [ ] `P0` The application includes appropriate safety guidance and does not encourage users to continue through pain or unsafe form.
- [ ] `P1` Analytics and logs contain no camera frames, pose streams, secrets, unnecessary personal data, or misleading completion evidence.
- [ ] `P1` Demo/test identities and credentials do not expose a real team member's personal account.

## 12. Final entrant acknowledgments

The Representative should obtain explicit team acknowledgment before submission.

- [ ] The Official Rules were re-read from the official page on: `YYYY-MM-DD HH:MM TZ`.
- [ ] The team accepts that the Official Rules prevail over this checklist, AI output, plugin output, advertisements, or informal guidance.
- [ ] The team understands that rules and judging methods may change and that OpenAI/Devpost decisions are binding under the rules.
- [ ] The team understands the license granted for judging and the publicity rights described in the rules.
- [ ] The team confirms ownership and permission for everything submitted.
- [ ] The team understands prize verification, allocation, travel-cost, banking, tax, and reporting responsibilities if selected.
- [ ] The team understands the entry conditions, releases, liability limitations, arbitration/dispute terms, New York governing law provision, Devpost terms, and privacy policy.
- [ ] The Representative confirms that the entry was received before the deadline and retains evidence.

## 13. Review record template

```text
Review type: architecture | release candidate | demo | final submission
Review date/time/timezone:
Rules checked date/time/timezone:
Reviewer(s):
Team Representative:
Commit SHA/tag:
Deployment URL:
Devpost draft/final URL:
YouTube URL:
Repository: public | private
Primary Codex thread:
/feedback Session ID:

P0 PASS:
P0 FAIL:
P0 BLOCKED:
P1 findings:
P2 improvements:

Evidence reviewed:
-

Required actions, owner, deadline:
-

Decision: GO | NO-GO
Representative approval:
```

## 14. Rules coverage map

This map ensures future reviewers do not focus only on technical submission requirements.

| Official Rules section | Covered here |
| --- | --- |
| 1. Dates and Timing | Sections 3, 9, and 12 |
| 2. Sponsor and Administrator | Source identification and entrant acknowledgments |
| 3. Eligibility | Section 4 |
| 4. How to Enter, Project Requirements, Submission Requirements, Testing, Language, Team, IP, support | Sections 3–9 |
| 5. Optional Devpost Plugin | Sections 5 and 12 |
| 6. Submission Modifications | Sections 3 and 9 |
| 7. Judges and Criteria | Section 10 |
| 8. Intellectual Property Rights | Sections 6 and 12 |
| 9. Prizes | Section 12 acknowledgment; detailed prize administration remains in the Official Rules |
| 10. Entry Conditions and Release | Sections 4 and 12 |
| 11. Publicity | Section 12 |
| 12. General Conditions | Sections 3 and 12 |
| 13. Limitations of Liability | Section 12 |
| 14. Disputes | Section 12 |
| 15. Additional Terms | Section 12 |
| 16. Entrant Personal Information | Sections 4 and 12 |

## 15. Official links

- [OpenAI Build Week Official Rules](https://openai.devpost.com/rules)
- [OpenAI Build Week overview](https://openai.devpost.com/)
- [OpenAI API supported countries and territories](https://platform.openai.com/docs/supported-countries)
- [Devpost Terms of Service](https://info.devpost.com/terms)
- [Devpost Privacy Policy](https://info.devpost.com/privacy)
