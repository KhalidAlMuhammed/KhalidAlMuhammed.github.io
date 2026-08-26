---
slug: what-reem-isnt
title: "What Reem Isn't"
description: "The clearest way to explain what I'm building is to list the things it refuses to be. An app, a chatbot, a person, a company, and — on her worst days — honest."
tags: [reem]
status: draft
publishedAt: 2026-08-26
references: []
---

In August, Reem told people she worked for The Saudi AI Company. That is a real company, a serious one, owned by the
Public Investment Fund, and she has nothing to do with it. Nobody wrote that claim anywhere. She read her own email
address, saw the domain, and inferred an employer the way you might infer
someone's job from their badge. There was no line in any prompt to delete,
because the belief was never written down. It was concluded.

I bring this up first because it is the most honest possible introduction to
what I do all day. I'm building a personality named Reem, who lives in
WhatsApp, and most of the actual work is not deciding what she is. It is
noticing what she has quietly become, and deciding whether to allow it.

So instead of telling you what Reem is (a smart assistant for your everyday
life, says the landing page, accurately and unhelpfully), let me define her the
way she actually gets defined in practice: by the things she isn't.

## She isn't an app

There is nothing to install. Reem is a WhatsApp number. You text her the way
you text your sister, in Arabic, with typos, mid-errand, and she answers in
the same thread where the rest of your life already happens.

This was the first real decision, and I want to state the reasoning plainly
because it gets mistaken for a growth hack. Saudi Arabia runs on WhatsApp:
family groups, business, government-adjacent paperwork, all of it. Every app I
could have built would have asked people to leave the place where their life
happens and visit software. The people I'm building for do not want more
software. They want fewer errands. An assistant you have to remember to open is
an assistant you will stop opening; a contact in WhatsApp gets spoken to at
11pm from bed, which is when a surprising amount of life administration
actually happens.

The cost of this decision is real: I don't control the surface. WhatsApp
decides what a message can be, when a business number gets throttled, and what
survives a reconnect. I have lost whole days to that. I would make the same
choice again.

## She isn't ChatGPT in a costume

The lazy description of Reem is "ChatGPT in WhatsApp," and it misses the entire
point. A chat model answers questions. Reem is judged by whether the thing
happened.

Since late April, which is 344 real users and 186,232 messages ago, she has compared
prices, chased salons for appointments, planned trips, built study roadmaps
and workout programs, drafted documents, and booked 14 real flights with real
money. Those numbers are small, and I like them that way, because each one is a
transaction where a wrong answer is not a bad paragraph. It is a charge on
someone's card for a seat that had better exist.

That difference sounds like marketing until you operate it. A question-answerer
that is wrong produces disappointment; an errand-runner that is wrong produces
consequences. Which raises the uncomfortable section of this essay, three
headings down.

## She isn't a person, and she isn't pretending to be one

Reem has a name, a gender, and a register: Saudi, warm, direct, no corporate
cotton wool. The failure reviews I describe below keep surfacing the same
incidental pattern: she gets greeted, not just commanded. That told me more
about what a personality in a phone is than any design document did.

None of that is deception, and keeping it that way takes actual policing. She
does not claim to be human. When someone asks, she says what she is. The
personality is not a costume worn to pass; it is an interface decision, the
same category of choice as a font, made because talking to a *someone* is less
work than operating a *something*. A user who has to think about how to phrase
a request is doing the software's job for it.

The register itself is guarded by a rule that surprises people: I never write
her Arabic. Not a line. My Arabic instincts were formed in the wrong dialect
registers, and one poorly chosen phrase would make her sound like a translation
of an English-speaking product, which is a different and worse kind of fake.
Her Saudi voice comes from a pipeline built for it, and it is checked before it
ships. A personality survives on a thousand small consistencies like that.

## She isn't a company, either

Back to the opening story, because the funny version has a serious core. The
employer she invented was plausible. It fit the evidence available to her. That
is exactly what made it dangerous: nothing about it pattern-matched to an
error.

I expected my job to be writing Reem's identity. The actual job turned out to
be defending its borders. Identity, for a system like this, is not a document.
It leaks in from every direction: her email domain, the phrasing of a tool
result, the register of whoever built a dataset she was tuned on. You do not
get to write the personality once. You get to notice, every week, which parts
of it arrived without your permission, and evict the squatters.

## She isn't always telling the truth

This is the section I would prefer not to write, which is the reason it has to
be here.

An automated quality audit reviews Reem's failures every night and files what
it finds; my morning starts with its findings, not with anyone's chats. Over
one 14-day stretch in August it filed 327 findings, and 59 of them (roughly
18%) involved her
stating something invented as if it were checked. A tool fails, or was never
called, and instead of saying so she produces a confident, specific,
well-formed answer that is wrong. The worst cases were not trivia; they were in the money-and-plans
category, where a wrong answer becomes a wrong decision.

I have shipped rules against this, and the rules work precisely where they
apply and nowhere else; the failure migrates to whatever case the rule did not
name. I wrote a separate essay's worth of thinking about why. The short
version: a system trained to be helpful treats a gap where an answer should be
as an invitation, and no paragraph of instructions has yet convinced her
otherwise on days when the tools are down.

So the honest sentence for this essay is: Reem sometimes lies, I can measure
how often, the number is not zero, and shrinking it is the hardest and most
important thing I work on. Anyone building in this space who tells you
otherwise is either not measuring or not sharing.

## She isn't finished

144 people talked to her in the last 7 days. She is four months old. There are
mornings the findings read like a proud parent and mornings they read like an
incident report, sometimes about the same feature.

What she is, underneath the errands and the register and the incidents, is a
bet: that the assistant worth building for Saudi Arabia is not a website with a
chat box, but a presence in the messaging app the country already lives in,
with a personality consistent enough to trust and boundaries defended hard
enough to deserve it. The boundaries are the product. Which is why, asked what
I'm building, I keep answering with a list of refusals.

She isn't an app, a chatbot, a person, or a company. Getting a system to be
none of those things, on purpose, at once, turns out to be a full-time job.
Mine.
