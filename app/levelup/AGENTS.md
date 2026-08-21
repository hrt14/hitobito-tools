# LEVEL UP Agent Instructions

Applies to `app/levelup/**` and any task whose user-visible result is a LEVEL UP app.

## Prime directive

Optimize for a product a real user can understand immediately, benefit from, enjoy using, and want to use again — not for "finished code".

Before creating or materially redesigning an app, read `docs/levelup-quality-standard.md`.

## Before coding

Be able to state, concretely:
1. who opens it
2. the exact moment/situation they open it
3. what they feel or struggle with then
4. what should observably change by the end

Pick one primary user benefit. Avoid abstract framing when a real use moment can be named.

If the concept relies on psychology, behavior science, habits, communication, productivity, or another factual domain, research reliable sources when needed. Do not build from vague general knowledge or turn an article summary into a game.

## Core experience gates

- The interaction should embody the skill being trained. Do not default to generic three-choice buttons unless discriminating between choices is itself the skill.
- First 10 seconds: without a manual, the user should understand what the app is for, why it matters to them, and what to do next.
- Prefer `open -> interact -> learn by doing` over long onboarding.
- Do not rescue confusing UI with extra explanatory copy; fix the UI.
- Every important action should produce immediate, comprehensible feedback. Motion, sound, haptics, scores, gauges, etc. are allowed only when they strengthen understanding or satisfaction.

## Content gates

Do not ship thin, repetitive, AI-sounding content.

Use concrete realistic situations and progress from obvious cases to ambiguous ones where appropriate. Avoid repeated sentence templates, generic praise, filler, fake specificity, and a polished first few items followed by near-duplicates.

After user input, return a short transferable rule or insight, not merely correct/incorrect.

## Progression and completion

If repeat use makes sense, provide a real reason to return: new content, rising difficulty, weak-point practice, previous-session comparison, daily challenge, or visible skill growth.

Points, streaks, badges, levels, or gacha are not substitutes for an improving core experience.

Do not end with only "お疲れさまでした". Show what changed, what the user learned, what they handled well, or what to try next. Persist results when that improves the next session.

## Distinctiveness gate

Before shipping, answer:

> Why can this app not simply be deleted and replaced by another existing LEVEL UP app?

If the answer is weak, redesign or merge it. A new title, color palette, or new set of three-choice questions is not enough.

## Title gate

Re-evaluate the title after the experience exists. It should be specific, direct, benefit-led, truthful, understandable, and consistent with the actual app. Make the intended user or use moment clearer when useful. Avoid meaningless wordplay and style-first naming. Check obvious public naming conflicts when appropriate.

## Mobile UX gate

Review every screen as a first-time mobile user. Confirm:
- obvious next action
- readable text and comfortable tap targets
- one primary purpose per screen
- clear visual hierarchy
- no redundant explanation
- safe back/home/exit behavior
- no dead ends or hidden critical actions

## Anti-template gate

Treat these as warning signs: generic gradient cards, emoji as the main idea, interchangeable encouragement, repeated three-choice loops, long text walls, abstract questions, theme-independent rewards, number-goes-up progression without skill growth, or a reskin of an existing app.

## Required self-play

Before calling an app complete, exercise the real user flow as applicable: first visit, start, correct path, incorrect path, back navigation, reload, completion, revisit, and mobile viewport.

Actively look for moments that feel confusing, tedious, repetitive, weak, or unrewarding. Fix them instead of documenting them.

## Quality score gate

Score 0-10 on all five dimensions:
1. Clarity
2. Usefulness
3. Interaction feel
4. Distinctiveness
5. Replay value (when repeat use makes sense)

Every dimension must be at least 7/10. An average above 7 is not enough. If any score is below 7, improve the product before declaring completion.

## Engineering and production gate

For implementation work:
1. preserve or improve behavior outside the requested scope
2. run relevant tests/checks
3. run `npm run lint`
4. run `npm run build` when feasible
5. fix task-related failures instead of stopping at the first error
6. when the requested result is for the live site, verify the actual production page after deployment

A PR, merge to `main`, deployment trigger, or successful build alone is not proof of user-facing completion.

## Final question

Before declaring completion, ask:

> If I genuinely had this problem, would I choose to open this app again?

If not, it is not finished.
