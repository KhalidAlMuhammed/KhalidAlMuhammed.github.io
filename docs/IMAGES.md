# Images

Essays are illustrated with **photography**, not charts. A generated documentary
photograph carries a mood and a place; a bar chart of numbers you made up
carries nothing. If an argument genuinely needs a diagram, draw it — but the
default visualization on this site is a picture of the world the essay is about.

The rules below are the Figma ad-system rules (`reem/docs/reem-ad-system.md`
§1.4 and §6.5) applied to essay illustration. They are the same rules we make in
Figma, deliberately — one photographic body of work across the brand.

## Generating

```bash
npm run image -- <slug> "what the photograph shows"                # hero
npm run image -- <slug> "..." --figure fig1 --alt "caption text"   # in-body figure
```

A hero is saved to `public/images/<slug>-hero.png` and attached to the post row
automatically. A `--figure` prints the Markdown to paste into the body.

## The rules

**1. The photograph must depict the essay's actual subject.** The single most
common failure in the ad library was a palm garden on a gym ad and a spice souq
on a supermarket ad — shipped because nobody looked. Look at the render.

**2. Populated. Other people in frame.** Never a lone figure shot from behind,
at night, in an empty place. Dark plus alone plus from-behind is the visual
grammar of surveillance footage, and no caption rescues it.

**3. Documentary editorial, not stock.** Warm natural light, natural film grain,
candid and unposed, muted natural colour. The style half of the prompt is fixed
in `scripts/generate-image.mjs` so every image on the site matches; you write
only the subject.

**4. No text, no logos, no watermarks, no UI.** Generated lettering is always
subtly wrong and instantly reads as fake. Blurred signage in the far background
is acceptable; legible words are not.

**5. Compose the negative space deliberately.** Brief the subject into the lower
two-thirds with a calm upper third. Heroes crop to 16:9 and card thumbnails to
4:3 — a subject centred in the frame loses its head in one of them.

## Endpoint traps

These cost real time in the Figma work. They apply here identically.

- **It ignores `aspectRatio` and picks its own model.** The same request shape
  has returned `gemini-3.1-flash-image` at 1408×768 and `gpt-image-2` at
  1024×1024. `generate-image.mjs` reads the real dimensions out of the file
  header and warns when the result is not close to the ratio you asked for.
  Crop before shipping.
- **It takes 90–190s.** The script allows 300s. Do not run it under the default
  120s Bash timeout.
- **It must run as a QA tester, never a real user.** The ad doc says `userId:
  110`; that id no longer exists — the 2026-08 QA fleet cleanup removed it. The
  id is now `REEM_IMAGE_USER_ID` (default `2840`). Current QA testers are the
  `999*` phone numbers in `reem_users`. If generation 404s with "user not
  found", pick another:
  ```
  psql "$DATABASE_URL" -c "select id, pn from reem_users where pn like '999%' limit 5"
  ```
- Roughly **$0.11–0.21 per image**, billed to the QA user.

## Checking a render

Same discipline as the Figma QA pass — check the picture, not the metadata.

1. Does it actually show the subject?
2. Are there other people in it?
3. Any legible text, logo or watermark?
4. Does the 16:9 hero crop and the 4:3 card crop both still work?
5. Does the light in the photo match what the essay says about the time of day?
