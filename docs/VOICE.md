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

3. **Is grounded in the literature, and engages it.** Naming a paper is not
   citing it. A citation earns its place only if the sentence around it says
   what the paper actually *did*: its method, its dataset, a number it reported,
   or the limitation that makes it not quite fit your case. "Self-critique
   helps [@shinn2023]" is decoration. "Reflexion reflects on a task feedback
   signal, and an internally consistent trajectory produces no signal
   [@shinn2023]" is an argument.

   **Open the paper. Every time.** Read at least the abstract and the method
   before you cite it. A misremembered citation destroys the credibility of
   everything around it, and this genre lives or dies on exactly that.

4. **Names who is wrong.** At least one specific claim, paper, method or
   received practice you are arguing against, attributable to someone. "The
   field" is not an opponent; it is a way of winning an argument nobody turned
   up to. If you cannot name who holds the view you are attacking, you do not
   yet have a thesis.

5. **Takes the counterargument at its strongest, in its own passage.** Write
   the version of the objection that would actually worry you, from someone who
   knows more than you do. Concede what it retires. If nothing in your essay is
   conceded, you argued with a strawman.

6. **Is personal and specific.** The thing only you can write is what happened
   when you built it. A time, a number, a log line, a name for the failure.
   Abstraction is what the papers already do; the essay earns its place with
   the concrete. A reader should finish knowing something about you, not just
   about the topic.

7. **Has a unique lens.** The angle is the product. Anyone can summarise a
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
- Numbers beat adjectives, and **every number carries a denominator**. "Five in
  two days" is an anecdote; "59 of 327 findings across 14 days, present on 14 of
  14" is evidence. A rate with no population is a feeling with a digit in it.
- **Never invent evidence.** No composite users, no illustrative timestamps, no
  plausible-looking IDs, no "a user once asked me". If you did not pull it from
  a log, a table or a file, it does not go in the essay. An essay about machines
  fabricating confident specifics cannot contain fabricated confident specifics,
  and the general rule is only slightly weaker than that.
- State your method when you counted something. "I classified by keyword in the
  title, which is approximate in both directions" costs one sentence and is the
  difference between a measurement and an assertion.
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


## The lint

`npm run post:push` runs `scripts/lint.mjs` before it writes anything. It exists
because the first essay published here was essay-*shaped* and hollow: seven
citations with no method between them, three numbers of which two were a
timestamp, and the cadence of every LLM-drafted post on the internet.

It **blocks** the push on: fewer than 1,200 words; fewer than 8 distinct numbers
in the prose; a reference in the bibliography that is never cited; and sentences
whose only job is to announce the next sentence ("here is", "this is where",
"stated plainly", "the honest ledger").

It **warns** on: a citation whose surrounding paragraph names no method, number
or finding; em-dashes above 5 per 1,000 words; repeated "it is not X, it is Y";
three consecutive sentences opening with the same word; and an essay with
sources but no passage that takes the other side seriously.

`--no-lint` overrides it. If you reach for that flag more than rarely, the
problem is the essay.

A linter cannot detect vacancy — only its symptoms. What actually fixes a hollow
essay is having measured something, and having a specific person to disagree
with.
