---
# Sample content for design work. Never published.
title: The spec is the product
subtitle: What is left to decide once the code writes itself
description: When agents write the code, the document that says what to build is the thing you ship.
date: 2026-11-12
# Borrowed from @bsky.app for its replies, to test the interactions
site:
  bskyUri: at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.post/3n2opitxdyc2j
---

For twenty years the scarce thing was the code. A team argued about what to
build because building was expensive, and the argument was a way of rationing
it. An agent will write the wrong thing as fast as the right one, and it will
not ask why.

That changes where the work is. The hours that went into typing now go into
saying, precisely, what should exist and what should not. The document that
says so used to be a formality written after the meeting. It is now the only
part of the process that *nobody else can do for you*.

## A spec is a list of refusals

Most specifications describe what the software does. The useful ones describe
what it refuses to do, because that is where the decisions are:

- which requests are turned away, and what the person is told instead;
- which data is never stored, even when storing it would be convenient;
- which errors stop the work, and which are allowed to pass.

A generated implementation fills every gap you leave with the most common
answer. The most common answer is, by construction, **the one everyone else
already ships**.

> The model does not know what you would be ashamed to release. That is not a
> limitation to engineer around. It is the job description.

### What it looks like in practice

The rule I keep is short: one sentence per behaviour, and every sentence can
fail a test. Here is the difference, for a function that sends a reminder.

```ts
// Vague: "send reminders for upcoming appointments"
// Precise: the three decisions the sentence above was hiding
export function shouldRemind(appointment: Appointment, now: Date): boolean {
  if (appointment.cancelledAt) return false
  if (appointment.remindedAt) return false // never twice
  const hoursLeft = (appointment.startsAt.getTime() - now.getTime()) / 36e5
  return hoursLeft <= 24 && hoursLeft > 2 // too late is worse than never
}
```

Nothing in it is hard to write. Every line of it had to be decided, and the
`hoursLeft > 2` line was a forty-minute conversation[^1].

## The review moves upstream

Code review assumed that reading the change was cheaper than writing it. With
a thousand generated lines a day, it no longer is. What can still be read in
full is the two pages that produced them.

| Before             | Now                          |
| ------------------ | ---------------------------- |
| Review the diff    | Review the decision          |
| Tests follow code  | Tests are the specification  |
| Estimate the build | Estimate the disagreement    |

So the question I ask of a piece of work is no longer "is this built well?".
It is the older and less comfortable one: [was this worth building at
all](https://example.com/worth-building)?

[^1]: The two-hour floor exists because a reminder that arrives while someone
    is already on their way reads as a reproach.
