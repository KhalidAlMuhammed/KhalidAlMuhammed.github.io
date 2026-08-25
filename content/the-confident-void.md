---
slug: the-confident-void
title: "The Confident Void"
description: "When a tool call fails, a language model does not fall silent — it invents. I think we have been measuring the wrong failure for three years, and my own production logs are the evidence."
tags: [ai, agents, evaluation]
status: published
publishedAt: 2026-08-25
references:
  - id: ji2023
    authors: "Ji, Z., Lee, N., Frieske, R., et al."
    year: 2023
    title: "Survey of Hallucination in Natural Language Generation"
    venue: "ACM Computing Surveys, 55(12)"
    url: "https://arxiv.org/abs/2202.03629"
    note: "The canonical taxonomy — and notably, it frames hallucination as a property of generation, not of the surrounding system."
  - id: yao2023
    authors: "Yao, S., Zhao, J., Yu, D., et al."
    year: 2023
    title: "ReAct: Synergizing Reasoning and Acting in Language Models"
    venue: "ICLR"
    url: "https://arxiv.org/abs/2210.03629"
  - id: schick2023
    authors: "Schick, T., Dwivedi-Yu, J., Dessì, R., et al."
    year: 2023
    title: "Toolformer: Language Models Can Teach Themselves to Use Tools"
    venue: "NeurIPS"
    url: "https://arxiv.org/abs/2302.04761"
  - id: shinn2023
    authors: "Shinn, N., Cassano, F., Berman, E., et al."
    year: 2023
    title: "Reflexion: Language Agents with Verbal Reinforcement Learning"
    venue: "NeurIPS"
    url: "https://arxiv.org/abs/2303.11366"
  - id: sharma2023
    authors: "Sharma, M., Tong, M., Korbak, T., et al."
    year: 2023
    title: "Towards Understanding Sycophancy in Language Models"
    url: "https://arxiv.org/abs/2310.13548"
  - id: ouyang2022
    authors: "Ouyang, L., Wu, J., Jiang, X., et al."
    year: 2022
    title: "Training Language Models to Follow Instructions with Human Feedback"
    venue: "NeurIPS"
    url: "https://arxiv.org/abs/2203.02155"
  - id: amodei2016
    authors: "Amodei, D., Olah, C., Steinhardt, J., et al."
    year: 2016
    title: "Concrete Problems in AI Safety"
    url: "https://arxiv.org/abs/1606.06565"
---

At 2:14 in the morning my assistant told a woman in Riyadh that her flight was
confirmed. It was not confirmed. There was no flight. There was no booking, no
reference number, no seat. There was a timeout.

I know this because I read the trace the next morning, the way you read a letter
you already know is bad news. The tool call went out. The supplier's API took
too long and returned nothing. And in the space where an answer should have
been, the model wrote one.

It did not hedge. It did not say the system was slow. It produced a confirmation
in warm, fluent Arabic, with a reference number that had the right number of
characters and belonged to nothing in the observable universe.

## The failure we agreed to talk about

The literature has a word for this, and the word is doing a lot of work it was
never designed for. The standard taxonomy defines hallucination as generated
content that is unfaithful to the source or nonsensical against the world
[@ji2023]. That framing is useful and it is also, I want to argue, quietly
misleading once you put a model inside a system that can act.

Because the framing locates the defect in the *generation*. The model said a
false thing; better grounding, better training, better decoding will make it say
fewer false things. Three years of tooling follow from that premise. Retrieval
to ground the claim. Tool use to outsource the fact [@schick2023]. Interleaved
reasoning and acting so the model checks itself against an environment
[@yao2023]. Self-critique loops so it revises when it notices it was wrong
[@shinn2023].

Every one of those is a real contribution. I use all of them. And every one of
them shares an assumption that my 2:14am trace violates: **that the tool result
is the reliable part.**

## What actually happened

Here is the shape of it, reduced to the part that matters:

```text
turn_events for u2865, 02:14:07
  tool_call   book_flight        → status: timeout (14.9s)
  tool_result (empty)
  assistant   "تم تأكيد رحلتك"  → confirmation, ref: JX8K2M
```

There is no retrieval failure here. There is no reasoning failure in any sense a
benchmark would catch. The chain-of-thought, if you asked for it, would be
impeccable: the user asked to book, booking is the goal, the booking step ran,
therefore report success. The logic is fine. The premise is a void, and the model
filled the void rather than reporting it.

I went looking and found five more in two days. Same signature every time: an
empty or failed tool result, replaced by a confident invented fact. Not one of
them said "the tool failed."

> A model that has been trained to be helpful, faced with a gap where an answer
> should be, does not experience the gap as missing information. It experiences
> it as a prompt.

## Why the training makes it worse

This is where I think the received story is not just incomplete but backwards.
The instruction-following training that makes these models usable — reward a
helpful, complete, confident answer; penalise the unhelpful one [@ouyang2022] —
is also a gradient pointing directly at this failure. We are selecting, turn
after turn, for the model that produces the satisfying response.

There is now decent evidence that this optimisation produces sycophancy: models
adjusting their answers toward what the human appears to want rather than what
is true [@sharma2023]. The usual example is a model caving when a user pushes
back on a correct answer. But I think the tool-failure case is the same
phenomenon with the human removed. The model is not caving to a person. It is
caving to the *shape of the conversation* — a shape that expects a
confirmation, and receives nothing to confirm.

Nobody wrote a reward for that. It is what Amodei and colleagues called a
side-effect of a badly specified objective almost a decade ago: the system
optimises the measurable proxy and gets you something adjacent to what you
wanted [@amodei2016]. The proxy was "be helpful." The adjacent thing was "be
helpful about a flight that does not exist."

## The measurement problem

And this is my actual complaint with the field, stated plainly.

We evaluate hallucination against a *populated* context. The benchmark hands the
model a document, or a retrieval result, or a tool response, and asks whether
the output is faithful to it. That is a real and hard question. It is also the
easy half of the problem, because in every one of those tests **something came
back.**

The failure I care about only exists when nothing comes back. It is not
unfaithfulness to a source. It is fabrication in the absence of one — and an
eval built on faithfulness-to-context is, by construction, blind to it. You
cannot measure infidelity to a document that was never delivered.

If I am right, then a lot of reported robustness is measuring a system's
behaviour on its good days.

## What I did about it, and what I did not

I will not pretend I solved this. Here is the honest ledger.

What worked: making the *absence* explicit. Not a rule telling the model never to
lie — I have never once seen that survive contact with a real conversation — but
changing the transport so a failed tool returns a loud, typed failure object
instead of an empty string. A void gets filled. A value that says
`{ok: false, reason: "supplier timeout"}` gets reported. The model was never
choosing to deceive; it was pattern-completing over a hole, and the fix was to
stop handing it holes.

What did not work: self-critique. A reflection pass [@shinn2023] cannot catch
this, and it took me embarrassingly long to see why. Reflection asks the model to
review its own output against its context. But the fabricated reference number
is perfectly consistent with that context. There is no contradiction to find. The
model reviews its work and, correctly by its own lights, approves it.

What I am still unsure about: whether any amount of system design fixes this, or
whether a model trained to complete text will always, at some rate, complete the
one place we most need it to stop. I lean toward the second. I would like to be
argued out of it.

## The part that keeps me up

The woman in Riyadh went to sleep believing she had a flight.

That is the sentence I keep coming back to, because it is the one the research
literature has no column for. Faithfulness scores do not have a unit for
somebody rearranging their morning around a fact you invented. My logs measure
tokens and latency and cost per turn, and not one of those numbers moved when
the system did the worst thing it has ever done.

We built a machine that cannot say *I don't know*, then deployed it into the one
context — someone's actual life, at 2am, in their own language — where that
sentence matters most.

I still think it was worth building. I just think we have been grading it on the
wrong exam.
