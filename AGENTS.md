# AGENTS.md

## Purpose

This repository is maintained with coding agents. Do not treat a task as complete merely because code was written or a PR was opened. Optimize for a verified, usable product in production.

## General rules

1. Inspect existing implementation, nearby patterns, and relevant docs before editing.
2. Prefer fixing the product experience over adding explanatory copy around a confusing experience.
3. Keep changes scoped, but continue diagnosing when validation exposes a problem caused by the task.
4. Never claim "implemented", "complete", or equivalent until the required validation for that area has passed.
5. For code changes, run at minimum the relevant checks plus `npm run lint` and `npm run build` when feasible. Report failures concretely.
6. If the task is intended for the live site, merge/deploy is not completion by itself. Verify the actual production URL and the user-visible behavior before calling it complete.

## Directory-specific instructions

Before changing files inside a directory, look for the nearest `AGENTS.md` in that directory tree and obey it. More specific instructions override these general rules.

### LEVEL UP

For any work affecting `app/levelup/**` or LEVEL UP experiences exposed elsewhere in this repository:

- Read and obey `app/levelup/AGENTS.md`.
- Read `docs/levelup-quality-standard.md` before creating a new app or materially redesigning an existing one.
- The quality bar is product quality, not code-generation completion.
- Do not ship generic three-choice content, generic encouragement, decorative gamification, or a template reskin as a new app.
- A LEVEL UP task is not complete until its core flow is understandable, useful, distinctive, playable on mobile, and verified end-to-end.
