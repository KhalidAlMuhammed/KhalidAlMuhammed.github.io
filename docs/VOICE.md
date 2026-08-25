# House style

The rules this site's writing is held to. Written down so a post can be checked
against something rather than argued about from taste.

## The register

A college essay, not a blog post and not a paper.

That means: a **thesis** stated early and defended for the whole length; the
strongest version of the opposing view taken seriously before it is answered;
evidence that is cited rather than gestured at; and a first person that is doing
argumentative work, not decorating the page.

It is not a tutorial. It is not a changelog. If the piece could be retitled
"How to X" without loss, it is the wrong piece.

## The five things every essay does

1. **Takes a position.** Something a reasonable expert could disagree with. "RAG
   is useful" is not a position. "We evaluate hallucination against a populated
   context, which is the easy half of the problem" is.

2. **Is critical.** The default posture is critique — of a received idea, a
   benchmark, a paper's framing, or your own earlier decision. Praise is fine
   when earned, but an essay that agrees with everyone has no reason to exist.

3. **Is grounded in the literature.** Real published work, cited properly, with
   a link. Not "studies show." Not a vague nod to a well-known result. If a
   claim leans on a paper, the paper is in the References and the citation sits
   next to the claim. **Verify every reference before publishing** — a
   fabricated or misremembered citation destroys the credibility of everything
   around it, and this genre lives or dies on that credibility.

4. **Is personal and specific.** The thing only you can write is what happened
   when you built it. A time, a number, a log line, a name for the failure.
   Abstraction is what the papers already do; the essay earns its place with
   the concrete. A reader should finish knowing something about you, not just
   about the topic.

5. **Has a unique lens.** The angle is the product. Anyone can summarise a
   paper; the value is the connection nobody else would draw — usually because
   nobody else has both read that paper and shipped that system.

## Humour

Dry, sparing, load-bearing. It comes from precision and from honest
self-deprecation, never from jokiness. One good line per section at most, and
it should double as an argument:

> ...a reference number that had the right number of characters and belonged to
> nothing in the observable universe.

If a line is only funny, cut it. If it is funny *and* it sharpens the point,
keep it.

## Structure

- **Open on the concrete.** A moment, not a definition. Never "In recent years,
  large language models have..."
- **Name the received wisdom** and cite where it comes from.
- **Break it** with the specific thing you saw.
- **Explain why** it breaks — this is where the research does its real work.
- **Say what you did**, including what failed. The ledger of what did not work
  is usually the most credible section in the piece.
- **Land the thesis**, and name what you are still unsure about. Stated
  uncertainty is what makes the confident parts believable.

## Mechanics

- No emoji.
- No em-dash-heavy throat-clearing; say the thing.
- Prefer the short Anglo-Saxon word. "Use," not "utilise."
- Numbers beat adjectives. "Five in two days" beats "several."
- Cut every sentence that only announces what the next sentence will do.
- Length follows the argument. Most land between 1,200 and 2,500 words.

## Citing

Inline, pandoc style, resolved automatically against the `references` list in
the post's frontmatter:

```markdown
...unfaithful to the source or nonsensical against the world [@ji2023].
...two independent results [@yao2023; @shinn2023].
```

The number rendered in the prose is the entry's **position in the
`references` array** — so the bibliography order is the numbering, and you
control it by ordering the list. Editing the list renumbers the prose
automatically; there are no hand-typed numbers to drift.

`npm run post:push` refuses a post that cites a key with no matching entry.
