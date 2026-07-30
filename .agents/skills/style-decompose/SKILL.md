---
name: style-decompose
description: >
  Use when you need to break down a visual reference (website, Dribbble/Behance shot,
  studio case, UI screenshot) and understand WHAT makes it good and WHY it works visually.
  Layer-by-layer style decomposition → moodboard + STYLE_GUIDE (tokens + principles).
  Triggers: «style-decompose», "break down this reference", "decompose this style",
  "why does this case work", a link to a studio/shot/site shared as a reference.
  Do NOT use for: analyzing site ARCHITECTURE (page map / sections), writing content,
  building prototypes.
invocation: user
subagent: false
once: false
---

# style-decompose — visual style decomposition

The job of this skill is not to "describe something nicely" but to **take a reference apart
like an engineer takes apart a mechanism**: pull out the concrete decisions, explain the reason
behind each one, separate transferable principles from one-off tricks, and pack it into two
layers — a moodboard (the feel) and a STYLE_GUIDE (tokens + laws).

> This is *inspiration*, not copying. You study an external reference to learn the LOGIC of why it
> works, then build a NEW visual language from those laws — never lift its photos, copy, or exact
> assets (that would be plagiarism, see Step 4).

> **Output location.** By default write artifacts to `./style-decompose/[slug]/`
> (slug = reference name in kebab-case). If your team has a research/inspiration folder, point the
> output there instead — the only requirement is one folder per reference with the two files below.

---

## Step 0 — Get the reference

The user gives one of:
- **A site URL** → open it (WebFetch) and pull text/structure; get visuals where possible
  (screenshot via browser/Figma/pencil tools if available). If visuals aren't accessible —
  work from page content + supplement with WebSearch ("[brand] design", "[brand] UI").
- **A Dribbble / Behance / studio-case link** → WebFetch the page + WebSearch the author/studio.
- **A screenshot / image** → read it directly (image input).

Collect **several frames**, not one: hero, an inner section, a hover/card state, typography
close-up. One screen lies — style reads in the repeating patterns.

If there's no reference — ask for a link or screenshot and stop.

---

## Step 1 — First-glance read (one paragraph)

Before analysis, capture the first impression while the eye is "fresh":
- **One sentence**: what feeling and what category it signals (premium / brutalist / editorial /
  soft-tech / luxury / playful / institutional…).
- **Emotional register**: quiet or loud, warm or cold, dense or airy.
- **Who it's for**: who it "sells" to and with what.

This is the anchor — at the end we check that the breakdown explains exactly THIS feeling.

---

## Step 2 — Layer-by-layer decomposition

Go through EVERY layer. For each: what you see (fact) → why it's done that way (reason).

**1. Colour**
- Palette: pull 5–8 key colours (hex or close). Split into roles: background, surfaces,
  text (3 levels), accent(s), semantic.
- Contrast strategy: where it's maxed, where it's muted. Temperature. Saturation.
- Where the accent lives and how rarely it appears (rarity = premium feel).

**2. Typography**
- Families (usually 2 max): display/heading and body/UI. Name them or pick a close analog.
- Pairing logic: contrast by class (serif × sans), by weight, by width. Why this pair.
- Scale: heading-to-body size ratio. How sharp the jump is (how dramatic the hierarchy).
- Details: letter-spacing, caps, line-height. The "voice" (strict / warm / technical).

**3. Composition & grid**
- Grid: columns, alignment, symmetry vs asymmetry.
- Density: air vs density. Where the emptiness is deliberate and why (whitespace as luxury).
- Rhythm: repetition, pauses, tension points. Where the eye "rests".

**4. Hierarchy & focus**
- What the eye catches 1st, 2nd, 3rd. What creates focus (size / colour / emptiness / position).
- How many hierarchy levels and how cleanly they're separated.

**5. Texture & material**
- Flat / depth / glass / grain / gradients / shadows. Which depth cues are used.
- Materiality: paper, metal, screen, light.

**6. Graphic language**
- Photography (treatment, cropping, tone), illustration, iconography, decorative elements.
- Corners, borders, dividers, radii — the micro-details that hold the style together.

**7. Motion (if it's a site)**
- Hover behavior, transitions, easing feel (sharp/smooth/inertial).
- Where motion reinforces hierarchy vs where it's just decoration.

---

## Step 3 — Why it works (the analytical core)

This is the heart of the skill. Not a recap of the layers — a **conclusion**.

- **Signature moves** — 3–5 signature techniques without which the style collapses. Be concrete.
  ("Giant serif headline on an empty background + a single spot of accent" — that's a move.)
- **Design tensions** — what contrasts hold it together: emptiness × density, warm × cold,
  classic × techno, strict × one playful element. Style is almost always managed tension.
- **Why it works** — why the chosen decisions produce exactly the feeling from Step 1. Link cause to effect.
- **Where the line is** — what makes it premium rather than cheap; what would break the effect if pushed.

---

## Step 4 — What's transferable, what's one-off

Split honestly:
- **Transferable principles** — laws that work for a new brand (accent logic, the type pair,
  whitespace strategy, the contrast model).
- **One-off / brand-specific** — concrete photos, illustrations, copywriting, recognizable tricks
  that must not be lifted (that's plagiarism, not inspiration).

---

## Step 5 — Artifacts

Create the folder `[output]/[slug]/` (slug = reference name in kebab-case) and two files.

### `moodboard.md` — the feel layer
```markdown
# Moodboard — [reference] — [date]

## Source
[URL / author / studio]

## First-glance
[one paragraph of the feeling from Step 1]

## Palette
| Role | Colour | Note |
|------|--------|------|
| bg | #… | … |
| accent | #… | rare, CTA only |
...

## Typography
- Display: [font/analog] — [why]
- Body: [font/analog]
- Hierarchy sample: [sizes/weights]

## Visual references
[links to collected frames/screenshots + 1 line on why each matters]

## Core feeling
[3–5 anchor words]
```

### `STYLE_GUIDE.md` — two layers: tokens + principles
```markdown
# STYLE_GUIDE — [reference] — [date]

## Layer 1 — Tokens (concrete values)
### Colour
bg0 / bg1 / surface / t1 / t2 / t3 / accent / semantic — hex + role

### Typography
Families, scale (display/h1/h2/h3/body/small/caption — px/line-height), weights, letter-spacing

### Space & form
Base unit, spacing scale, radii, border weights, shadow/depth strategy

### Motion (if any)
Durations, easing, transition patterns

## Layer 2 — Principles (the style's laws)
1. [Principle] — [why, how to apply]
2. ...
(including Signature moves and Design tensions from Step 3)

## Anti-patterns
What breaks this style / what not to do

## Transferability
- Transferable: [...]
- One-off (do not lift): [...]
```

---

## 🛑 STOP after output

After creating `moodboard.md` and `STYLE_GUIDE.md`:
- Show the user: first-glance, palette, type pair, 3–5 signature moves, and "why it works".
- Stop. Wait for an explicit command for the next step (e.g. building the design direction).
- Do NOT start building a design system — that's a separate, explicit task.

## Known Gotchas
- One screen != a style. Always collect several frames and states.
- Don't pull hex "by eye" from a compressed screenshot as truth — mark them as approximate.
- This decomposes VISUALS, not architecture (page map / sections) — keep those separate.
- If the reference's visuals aren't accessible (only page text) — say so honestly and supplement via
  WebSearch; never invent colours.
