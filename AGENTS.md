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

## Deployment requests

When the user asks you to deploy, **do not try to reach Vercel yourself.** Take the work as far as it can go without Vercel access, then hand off.

Why: agent sandboxes for this project are on the "trusted network access" policy, which rejects `CONNECT` to every Vercel host — `api.vercel.com`, `vercel.com`, `mcp.vercel.com`, `telemetry.vercel.com`, `codex-deploy-skills.vercel.sh` (all 403). This is an egress policy, not a credential problem, so a token, the Vercel CLI, or adding the Vercel MCP will not help. Do not retry or route around it. (Verified 2026-09-02 across two independent sessions.)

Also note: this repository's Vercel Git Integration is intentionally OFF, so **pushing to GitHub deploys nothing.** The last `vercel[bot]` deployment was 2026-08-24. Do not re-enable it to work around a deploy request; do not claim a push deployed anything.

Steps, in order:

1. Finish the code. Run the relevant checks plus `npm run lint` and `npm run build`, and report failures concretely.
2. Commit and push to the designated working branch.
3. Work out what the deploy needs: target branch, latest commit SHA, the pages to check, and every environment variable the change requires (name, whether it is required, which Vercel environment it belongs to). Flag any `NEXT_PUBLIC_*` variable — those are inlined at build time and need to be set *before* the deploy.
4. Output a ready-to-paste handoff message, in Japanese, addressed to an assistant that has the Vercel MCP connected. It must state: repository, branch, commit SHA, that this is a **Preview** deployment and not Production, that production domains and LEVEL UP settings must not be touched, that Git Integration must not be re-enabled, the environment variables to set, and what to report back (Preview URL, build result, which variables are set).
5. Never ask for secrets to be pasted into the conversation. The user sets them in the Vercel dashboard.

Say plainly that you cannot produce the URL yourself, and do not present the handoff message as if the deploy is done.

`.github/workflows/vercel-preview.yml` is a backup route (GitHub runners can reach Vercel). It is `workflow_dispatch`-only and, because dispatch requires the file to live on the default branch, it cannot be triggered from a feature branch. It needs `VERCEL_TOKEN` / `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` in Actions secrets. Offer it only if the MCP handoff is not an option.

## Directory-specific instructions

Before changing files inside a directory, look for the nearest `AGENTS.md` in that directory tree and obey it. More specific instructions override these general rules.

### LEVEL UP

For any work affecting `app/levelup/**` or LEVEL UP experiences exposed elsewhere in this repository:

- Read and obey `app/levelup/AGENTS.md`.
- Read `docs/levelup-quality-standard.md` before creating a new app or materially redesigning an existing one.
- The quality bar is product quality, not code-generation completion.
- Do not ship generic three-choice content, generic encouragement, decorative gamification, or a template reskin as a new app.
- A LEVEL UP task is not complete until its core flow is understandable, useful, distinctive, playable on mobile, and verified end-to-end.
