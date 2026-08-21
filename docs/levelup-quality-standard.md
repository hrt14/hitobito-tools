# LEVEL UP Quality Standard

This document is the detailed product-quality standard for LEVEL UP app creation and major redesigns. `app/levelup/AGENTS.md` contains the enforceable summary; this document explains the intended bar in more depth.

## 1. Define the exact use moment

Before implementation, describe in one sentence:

- who uses the app
- the concrete situation in which they open it
- how they feel at that moment
- what should change by the end

Avoid abstract descriptions when a real scene can be named.

Example:

- Weak: an app that improves self-esteem
- Strong: an app for someone replaying an awkward comment from a meeting after getting home, helping them switch attention within a few minutes

## 2. Identify the one result the user actually wants

Users do not want a "training module" for its own sake. They usually want to feel lighter, forget something, act, decide, regain confidence, stop ruminating, continue a habit, or become better at a specific behavior.

Choose one primary benefit. More features are not automatically better.

## 3. Raise domain resolution before designing

If psychology, behavior science, habits, communication, work methods, or another factual discipline is involved, research when needed rather than relying on generic summaries.

Understand:

- why the problem occurs
- common failure modes
- useful principles or interventions
- real situations in which it appears
- how beginner and advanced cases differ

Do not merely place educational prose inside game UI.

## 4. Make the interaction itself meaningful

A game needs a reason to be a game. Do not call a set of three buttons a game by default.

Possible interaction patterns include:

- swipe
- tap
- sorting
- deleting
- releasing
- throwing
- growing
- defeating
- protecting
- collecting
- timed judgment
- repetition that builds automatic response
- visible transformation of state

The mechanic should embody the skill.

Examples:

- letting go -> swipe thoughts off screen
- separating responsibilities -> sort each concern into "mine" or "theirs"

The action itself should reinforce the desired mental model.

## 5. Design the first 10 seconds first

Assume the user will not read instructions.

At first glance they should understand:

1. what the app is for
2. whether it applies to them
3. what they should do

Prefer `open -> act -> understand through interaction`.

Long onboarding is a warning sign.

## 6. Make every important action feel responsive

A press that merely swaps text is often too weak.

Use only appropriate feedback:

- motion
- sound
- haptics
- visual state changes
- numbers
- expressions
- effects
- gauges

Feedback should make the action clearer or more satisfying, not merely decorate the screen.

## 7. Build deep content, not a thin demo

Do not make the first ten items polished and the rest repetitive.

Use concrete real-world scenarios where relevant, such as:

- work
- family
- friends
- relationships
- SNS
- money
- future
- mistakes
- comparison
- evaluation
- ordinary daily friction

Progress from obvious cases to more ambiguous realistic ones.

The user should gain resolution as they continue.

## 8. Return a transferable rule, not only a verdict

Do not lecture. Avoid long explanation screens.

After a choice, give concise feedback that improves the next judgment.

Instead of only "wrong", explain the usable rule.

Example:

> You can control what you say and do. You cannot fully control how the other person feels about it.

The user should leave thinking, "I can use that next time."

## 9. Make growth visible

Do not reduce growth to consuming more questions.

Possible mechanisms:

- level tied to actual mastery
- skill tree
- meaningful streaks
- weakness tracking
- progress graph
- earned titles
- before/after comparison
- past judgment comparison
- difficulty unlocks

Points alone are not gamification.

## 10. Make completion itself valuable

Do not end only with a generic congratulations message.

Show what the user gained this session.

Examples:

- "You correctly identified 7 of 8 cases where the other person's reaction was outside your control."
- "Your self-rated rumination fell from 82 to 41."
- "Today you let go of: the old comment, the other person's facial expression, and the late reply."

Persist results when it improves the next session.

## 11. Give a real reason to return

Decide whether the app is one-shot or repeatable.

For repeatable apps, return value can come from:

- new content
- rising difficulty
- personalized weak-point practice
- previous-session comparison
- daily challenge
- accumulated progress

Do not add login rewards if the core experience does not justify a return visit.

## 12. Re-evaluate the title after the product exists

The title is not a decoration. It is part of usability and discovery.

Check:

- Does it include a concrete user benefit?
- Does it feel fresh without becoming vague?
- Does it create useful curiosity?
- Does it feel fast/easy only when that is truthful?
- Is it restrained rather than exaggerated?
- Is it direct?
- Is the intended user or situation clear enough?
- Is the core point simple?
- Can it become more concrete?
- Does it logically match the app?
- Is there meaningless wordplay or style-first naming?
- Are there obvious public naming conflicts that should be checked?

A title should help a user choose the app without needing a paragraph of explanation.

## 13. Review UI as a first-time user

For every screen ask:

- Is the next action obvious?
- Is the amount of text appropriate?
- Is it readable on a phone?
- Are tap targets comfortable?
- Is the most important element visually dominant?
- Is information duplicated?
- Can explanation be removed?
- Does the screen have one primary purpose?
- Are home/back/exit behaviors clear?
- Is accidental misuse unlikely?

Do not solve poor UI with more copy.

## 14. Remove generic AI-app signals

Review aggressively if the product contains:

- generic gradient cards as the main design language
- emoji standing in for a real visual concept
- interchangeable encouragement
- "you can do it" filler
- "great choice" filler
- repeated three-choice patterns
- large text walls
- abstract questions
- copied templates
- levels that are only increasing numbers
- theme-independent gacha

A LEVEL UP app should feel specific to its problem.

## 15. Prove it deserves to exist separately

Before shipping, answer:

> If this app disappeared, why could another LEVEL UP app not replace it?

If the answer is weak, merge the concept or redesign the mechanic.

A new title, color scheme, or question set is not enough differentiation.

## 16. Self-play the complete flow

Do not stop at "the code runs".

Test, as applicable:

- first access
- start
- main interaction
- wrong answer
- correct answer
- back
- reload
- completion
- revisit
- mobile layout

Look deliberately for moments that feel:

- tedious
- confusing
- repetitive
- meaningless
- unresponsive

Fix those moments.

## 17. Score the product before completion

Score 0-10 on:

### Clarity
Can someone play without explanation?

### Usefulness
Can the experience change a real problem meaningfully?

### Interaction feel
Does using it feel responsive and satisfying?

### Distinctiveness
Is there a clear reason for this app to exist separately?

### Replay value
When repeat use makes sense, is there a reason to return?

Every score must be at least 7/10. Do not average away a weak dimension.

If any score is below 7, improve the product first.

## 18. Separate implementation from completion

The following are not sufficient evidence of completion:

- code written
- build passed
- PR opened
- merge to `main`
- deploy trigger updated

For user-facing implementation, completion requires the intended live experience to be available and verified when production deployment is part of the task.

If validation fails, continue diagnosing task-related failures rather than reporting only that a deployment or check could not be observed.

## Final product question

Before declaring the work complete, ask:

> If I genuinely had this problem, would I choose to open this app again?

If not, it is not finished.

Prefer one 90-point app over ten 60-point apps.
