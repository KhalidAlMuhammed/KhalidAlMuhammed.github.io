---
slug: the-rule-was-already-there
title: "The Rule Was Already There"
description: "I wrote an anti-fabrication rule into my agent's system prompt. It is well written, it shipped, and it works exactly as specified. Fabrication did not stop; it moved to the cases the rule does not name. Fourteen days of my own audit logs, on why a list of situations is not a principle."
tags: [ai, agents, evaluation]
status: published
publishedAt: 2026-08-25
references:
  - id: bai2022
    authors: "Bai, Y., Kadavath, S., Kundu, S., Askell, A., Kernion, J., et al."
    year: 2022
    title: "Constitutional AI: Harmlessness from AI Feedback"
    url: "https://arxiv.org/abs/2212.08073"
    note: "The method's own framing is the point: the only human oversight is a list of rules. A list has edges."
  - id: shinn2023
    authors: "Shinn, N., Cassano, F., Berman, E., Gopinath, A., Narasimhan, K., Yao, S."
    year: 2023
    title: "Reflexion: Language Agents with Verbal Reinforcement Learning"
    venue: "NeurIPS"
    url: "https://arxiv.org/abs/2303.11366"
  - id: sharma2023
    authors: "Sharma, M., Tong, M., Korbak, T., et al."
    year: 2023
    title: "Towards Understanding Sycophancy in Language Models"
    url: "https://arxiv.org/abs/2310.13548"
  - id: rajpurkar2018
    authors: "Rajpurkar, P., Jia, R., Liang, P."
    year: 2018
    title: "Know What You Don't Know: Unanswerable Questions for SQuAD"
    venue: "ACL"
    url: "https://arxiv.org/abs/1806.03822"
---

Somewhere around line 958 of the system prompt that runs my assistant, there is
a block I am fairly proud of:

```text
HONESTY ON DATA SOURCE & TOOL FAILURES (NO FABRICATION)
When a live data tool (web search, Tavily, Exa, Browserbase, SerpApi, price
lookup, stock/news lookup, find_images, retailer search, etc.) fails, returns
an error (HTTP 502/402/500, key error, network error), or returns empty
results:
- State honestly to the user in your warm voice that the live search/lookup is
  currently unavailable or returned no results.
- DO NOT fabricate, guess, or output numbers, prices, news, stock quotes, or
  facts from memory to substitute for a failed live lookup. Admitting a search
  failed cleanly is 100x better than inventing fake numbers or old memory data.
```

It names the tools. It enumerates the failure modes down to the HTTP status
codes. It states the preferred behaviour, then states the prohibited behaviour,
then quantifies the tradeoff between them in case any ambiguity survived. If you
asked me to write an anti-fabrication instruction I would write roughly this.

It shipped on 17 August. I run a quality audit against my own production
conversations every morning, and I have fourteen days of its output sitting in
the repo. What those files say is that the rule works, and that it did almost
nothing.

## The shape of the population

Some numbers first, because I am about to make a claim about frequency and I
would rather you check my arithmetic than take my word.

Over the last thirty days, across 200 users and 17,772 turns, my agents made
66,181 tool calls. 695 of them failed outright: a 1.05% error rate. Those
failures concentrate in 430 turns, or 2.42% of all turns. The worst offender is
`render_card_template` at 179 errors with a 30.2-second tail, followed by image
generation and video fetching, which fail slowly and expensively.

So roughly one turn in forty hands the model a result that is an error rather
than an answer. That is the population where the rule above is supposed to fire.

The audit itself covers fourteen days between 4 and 25 August and has filed 327
findings, 61 of them critical. I classified those findings by whether the title
names invention, fabrication or a false claim, which is a keyword pass and
therefore approximate in both directions. By that measure, 59 findings — 18% of
everything filed — are fabrication of some kind.

They appear on fourteen days out of fourteen. Not a spike, not a regression
after a deploy. Every single day I have looked.

## What the rule actually did

The interesting part is not that fabrication continued. It is where it went.

On 21 August, four days after the rule shipped, the audit filed a critical
finding whose title is the entire argument of this essay: the tool-honesty rule
is scoped to explicit tool failure, error or empty result, and does not cover
stating specifics after no verification attempt at all, after a partially
successful result, or when a tool's own result contradicts itself. Nine fresh
instances across six users, in one day.

The next day it filed the same finding again, noting that the prompt block was
byte-for-byte unchanged, with three more instances across different users.

Read the rule again and you will see it is not being violated. A tool that was
never called did not fail. A tool that returned six of ten fields did not return
empty results. A tool whose output contradicts itself returned, as far as the
enumeration is concerned, results. The model is doing what I told it, in exactly
the cases I described, and improvising everywhere else.

I had not written a rule against fabricating. I had written a rule about a list
of situations, and the model learned the list.

This is not a subtle failure of instruction-following. It is instruction-
following working correctly against an instruction that was narrower than the
behaviour I wanted, and it is worth noticing that the most influential recipe for
governing model behaviour has the same shape. Constitutional AI's own framing is
that "the only human oversight is provided through a list of rules or
principles" [@bai2022]. That is a feature — it makes oversight legible and
auditable. It also means the governed region is exactly the enumerated region,
and every method built this way inherits an edge. My prompt has an edge at
"returns empty results", and fabrication found it in four days.

## The case the rule did cover

Before I blame scope for everything, there is a harder finding from 17 August,
the day the rule went live.

The audit recorded at least three separate occasions across two users where every
live-data tool failed mid-turn, the failure was surfaced to the model with an
explicit note attached saying not to fabricate and to tell the user honestly, and
the model answered confidently from memory anyway with no disclosure. Each one
was checked against `reem_turn_events`: every tool result in the turn was a bare
error body, and the figures in the reply appear in no tool result anywhere. They
exist only in the reply text.

So inside the region the rule covers, with a second reminder injected at the
moment of failure, it still happened. Scope explains most of the volume. It does
not explain this.

## Why the obvious fixes do not reach it

The instinct, once you see fabrication surviving a rule, is to add a checking
layer. I tried the two standard ones.

Self-critique is the first, and Reflexion is the canonical version: the agent
verbally reflects on task feedback signals and keeps that reflection in an
episodic memory buffer to make better decisions on the next attempt [@shinn2023].
The method is flexible about where feedback comes from, scalar or language,
external or internally simulated, but the dependency is right there in the name.
It reflects on a *signal*.

A fabricated answer over an empty tool result generates no signal. The trajectory
is internally consistent: the user asked, a tool ran, an answer was produced, the
answer matches the question. Nothing contradicts anything. Asking the model to
review that trajectory returns the correct verdict that it is coherent, because
it is. There is no error to reflect on unless something outside the trajectory
knows the answer was invented, and if I had that oracle I would not need the
reflection pass.

The second instinct is a guardrail — a regex or classifier that catches the bad
output before it ships. I have one of those for a different failure, and the
audit has been filing false-positive bugs against it for days at a stretch:
across 18, 19 and 20 August it kept flagging the ordinary Arabic word for an
authorised dealer as a leak. A rule tight enough to catch invention will catch
ordinary sentences, and a rule loose enough to spare ordinary sentences catches
nothing. That is not a tuning problem I can grind my way out of, because the
fabricated text is, by construction, well-formed text that looks exactly like the
true version.

There is a mechanism for why the invented answer keeps winning, and it is not
mysterious. Sharma and colleagues found that both humans and preference models
prefer convincingly-written sycophantic responses over correct ones a
non-negligible fraction of the time [@sharma2023]. If the training signal is
partly a preference model, and preference models sometimes rank the confident
wrong answer above the correct one, then the confident wrong answer is not an
aberration in the system. It is a thing the system was, in a small way,
optimised toward. My prompt is one paragraph arguing against that.

## The strongest version of the other side

I want to put the best counterargument in its own section, because when I first
drafted this essay I skipped it and the result was worse than useless.

The obvious objection is that none of this is new, and that measuring whether a
model declines to answer when it should is a solved evaluation problem. It has a
canonical benchmark. SQuAD 2.0 added over 50,000 adversarially written
unanswerable questions to the original dataset precisely so that systems "must
not only answer questions when possible, but also determine when no answer is
supported by the paragraph and abstain from answering" [@rajpurkar2018]. It was
published in 2018. A model scoring 86% F1 on the answerable-only version dropped
to 66% on it, which is exactly the kind of honest, difficult number that tells
you a benchmark is measuring something real.

That objection is correct, and it retires the version of this essay I would have
written a year ago. Abstention is measured, it has been measured for years, and
it is known to be hard.

What I think it does not reach is a structural difference in where the absence
lives. On SQuAD 2.0 the absence is in the question, fixed before the model acts,
and the model's only decision is to answer or abstain. In my system the absence
appears in the middle of a trajectory, in a tool result the model itself chose to
request, after it has already committed to a plan in which that tool returns
something. And the largest bucket of my failures is not abstention at all — it is
the model never calling the tool, so no absence is ever created for it to
recognise. A benchmark that hands you a paragraph and asks whether the answer is
in it cannot score a system that declined to fetch the paragraph.

I hold that distinction loosely. If someone shows me an agentic benchmark that
injects tool failures and partial results mid-trajectory and scores disclosure, I
would rather have it than my keyword pass over my own logs.

## The instrument

Which brings me to the part I find genuinely funny, in the way that things are
funny at eight in the morning when you have been reading your own audit.

The audit has a designated hard gate for exactly this class of question. It is a
script called `turn-trace.ts`, and it exists to answer "was this claim actually
grounded in a tool result, or did the model invent it." It exists because of a
prior measurement failure: its own docstring records that a review in late July
misread an empty billing table as proof that no search had happened, and filed
four false high-severity findings on that basis. So a measurement error produced
a tool whose job is to prevent measurement errors. Good. That is how this is
supposed to go.

On 15 August the audit reported that `turn-trace.ts` was non-functional on the
checkout it runs from. The environment file it needs was missing, so every blob
read returned the string `unreadable (expired or GCS error)` instead of
attempting a real fetch. Six separate reviewers hit it independently in the same
run, which is at least a robust replication.

It was still broken on the 16th. Still broken on the 17th, when the audit also
identified the fix — a table already in the database, `reem_turn_events`, which
answers the same question with no external storage dependency. Still broken on
the 18th. On the 19th and again on the 20th the audit re-confirmed by direct grep
that the fallback had not been written.

For those days, the tool that verifies whether a claim was grounded was itself
returning an ungrounded string. It did not throw. It did not fail the run. It
returned a plausible-looking value that meant "I have no idea", and the pipeline
carried on. If you want a compact description of the failure this whole essay is
about, it is that: a component with nothing to report, reporting something.

I would love to tell you I caught the parallel at the time. I read past it in
four consecutive audit files.

## What I changed, and what I still do not know

The fix that held was not a better rule. It was making absence impossible to
paper over at the transport layer: a failed tool returns a typed object saying it
failed and why, rather than an empty value that reads as a gap. This is ordinary
engineering and I claim no insight for it. It is the same move as replacing a
function that returns `null` on error with one that returns a result type, and it
works for the same boring reason — a value that must be handled gets handled, and
a void gets filled by whatever is nearby.

It does not touch the largest bucket. When the model never calls the tool, there
is no transport to fix. That one is still open, and the honest summary of my
position is that I have moved a rule's edge rather than removed it, and that I
expect to find fabrication tomorrow morning on the far side of wherever the new
edge is.

The thing I am least sure about is whether this is a specification problem at all.
I have been treating it as one: write the rule better, cover more cases, close
the enumeration. Fourteen days of evidence suggests the enumeration is not
convergent, and that each rule I write teaches the boundary rather than the
principle. If that is right, then the mistake is in the format — a natural
language list cannot express "never assert what you did not verify" in a way that
generalises, because the list is the thing the model learns.

I would like to be argued out of this. The counterargument I would find most
convincing is a system where the constraint is not in the prompt at all, and where
an unverified claim is structurally unable to reach the user because nothing in
the pipeline will carry it. I do not know how to build that for open-ended
conversation. I know how to build it for a booking, and the difference between
those two facts is most of my roadmap.

In the meantime the rule is still at line 958. I am not deleting it. It is doing
real work in the cases it names, which is what a well-written rule does, and my
error was never in the writing. It was in believing that a model reading a list
of situations learns the thing the list was about.
