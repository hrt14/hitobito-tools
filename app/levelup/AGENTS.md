# LEVEL UP Agent Instructions

These instructions apply to every file under `app/levelup/**` and to any task whose user-visible result is a LEVEL UP app.

## Prime directive

Do not optimize for "finished code". Optimize for a product that a real user can understand immediately, benefit from, enjoy interacting with, and want to use again.

If a task says only "実装して", the definition of done still includes product design, implementation, validation, and production verification when the task is meant for the live site.

## Required product framing before implementation

Before coding a new app or major redesign, be able to state all four in concrete language:

1. Who opens it?
2. In what exact moment or situation do they open it?
3. What are they feeling or struggling with at that moment?
4. What should be observably different when they finish?

Avoid abstract goals such as "increase self-esteem" when a concrete use moment can be named.

Then identify one primary benefit. Do not dilute it with unrelated features.

## Research rule

If the app relies on psychology, behavior science, habits, communication, productivity, or another factual domain, do not design from vague general knowledge. Research reliable sources first when needed to understand mechanisms, common failure modes, useful interventions, and realistic scenarios. Do not turn a summary article into a game and call that product design.

## Interaction must teach the skill

A LEVEL UP app needs a mechanic that matches the mental or behavioral skill being trained.

Good examples:

- letting go -> physically swipe/release something
- separating responsibilities -> sort items into self/other domains
- acting quickly -> make a small real action under light time pressure
- reframing -> transform or replace a thought in a visible way

Do not default to three generic answer buttons. Choices are acceptable only when discrimination between choices is itself the skill being trained.

## First 10 seconds

On first open, without reading a manual, the user should understand:

- what this app is for
- why it is relevant to them
- what to do next

Prefer `open -> interact -> learn by doing` over long onboarding.

If explanatory copy is required to rescue a confusing UI, improve the UI first.

## Content quality

Do not ship thin, repetitive, AI-sounding content.

For scenario-based apps, use concrete situations across relevant domains such as work, family, friends, relationships, SNS, money, future anxiety, mistakes, comparison, evaluation, and ordinary daily friction. Progress from obvious cases to ambiguous realistic cases.

Avoid:

- repeated sentence templates
- generic encouragement such as "素晴らしい選択です"
- filler copy
- fake specificity
- a polished first few questions followed by near-duplicates

When the user answers, return a short transferable rule or insight, not merely correct/incorrect.

## Feedback and feel

Every important action should produce an immediate, comprehensible response. Use motion, sound, haptics, visual state, score changes, gauges, or other feedback only when they strengthen understanding or satisfaction.

Do not add effects for decoration alone.

## Real progression

If the app is repeatable, give the user a real reason to return, such as:

- increasing difficulty
- different scenarios
- weakness-aware practice
- comparison with previous performance
- a daily challenge
- visible skill growth

Do not use points, streaks, gacha, badges, or levels as a substitute for an improving core experience.

## Completion experience

Do not end with only "お疲れさまでした".

Show what changed, what the user learned, what they handled well, or what to try next. Where appropriate, persist the result so the next session can build on it.

## Distinctiveness gate

Before shipping, answer:

> Why can this app not simply be deleted and replaced by another existing LEVEL UP app?

If there is no strong answer, redesign or merge the concept. A new color palette, new title, or new set of three-choice questions is not sufficient differentiation.

## Title gate

Re-evaluate the title after the experience is designed. The final title should:

- communicate a user benefit
- feel specific rather than generic
- create useful curiosity without clickbait
- feel quick/easy only when the app actually is
- be direct and understandable
- make the intended user or use moment clearer where useful
- avoid meaningless wordplay or style-first naming
- match the actual app behavior
- be made more concrete whenever possible

Check for obvious naming conflicts before finalizing public-facing titles when appropriate.

## Mobile UX gate

Review every screen as a first-time mobile user. Check:

- obvious next action
- readable text size and line length
- comfortable tap targets
- one primary purpose per screen
- clear hierarchy
- no redundant explanatory text
- safe back/home/exit behavior
- no accidental dead ends
- no important action hidden below unnecessary content

## Anti-template gate

Treat these as warning signs requiring review:

- generic gradient cards
- emoji used as the main design idea
- interchangeable motivational copy
- repeated three-choice loops
- long explanatory walls of text
- abstract questions disconnected from a real moment
- theme-independent gacha or reward systems
- number-goes-up progression with no skill growth
- a reskin of an existing app

## Required self-play

Before calling a LEVEL UP app complete, exercise the real user flow, including as applicable:

- first visit
- start
- correct interaction
- incorrect interaction
- back navigation
- reload
- completion
- repeat visit
- mobile viewport

Actively look for moments that feel confusing, tedious, repetitive, weak, or unrewarding. Fix them instead of merely documenting them.

## Quality score gate

Score the finished experience from 0-10 on all five dimensions:

1. Clarity — understandable without explanation
2. Usefulness — produces a meaningful real-world benefit
3. Interaction feel — satisfying and responsive to use
4. Distinctiveness — has a reason to exist separately
5. Replay value — has a reason to use again when the concept is repeatable

Every dimension must be at least 7/10. An average above 7 is not enough. If any dimension is below 7, improve the product before declaring completion.

## Engineering and verification gate

For implementation work:

1. Preserve or improve existing behavior outside the requested scope.
2. Run relevant tests/checks.
3. Run `npm run lint`.
4. Run `npm run build` when feasible.
5. Fix task-related failures rather than stopping at the first error.
6. If the requested result is meant for production, verify the actual production page after deployment.

A PR, merge to `main`, deployment trigger, or successful build alone is not proof that the user-facing task is complete.

## Final internal question

Before declaring completion, ask:

> If I genuinely had this problem, would I choose to open this app again?

If the answer is not a confident yes, the app is not finished.

For the expanded rationale and design checklist, read `docs/levelup-quality-standard.md`.
