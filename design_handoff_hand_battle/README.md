# Handoff: Hand Battle — Visual Redesign

## Overview

Hand Battle is a real-time browser card game where two players duel via webcam, casting spells by holding hand gestures (recognized by Google MediaPipe) for 1.5 seconds. This handoff covers a full visual redesign from "lab prototype" to **dark fantasy elegant** — deep arcane violets, candlelight gold, parchment textures, ornate filigree, abstract geometric sigils.

Stack target: vanilla HTML/CSS/JS dropped into the existing `static/` folder of the Python (FastAPI + Socket.IO) backend. **No frameworks** (no React, no Vue) per the original brief.

## About the Design Files

The files in `prototype/` are **design references created in HTML** — a self-contained interactive prototype showing the intended look, motion, and behavior. They are **not production code** for the live app. Your task is to **recreate these visuals inside `static/index.html`, `static/style.css`, and (minimally) `static/app.js`** of the real codebase, preserving all existing game logic and Socket.IO/WebRTC/MediaPipe behavior. Only the visual layer should change — touch `app.js` only to add/remove CSS class names where states need them (e.g. `.card.active`, `.charge-bar.charging`, `.video-tile.casting`).

## Fidelity

**High-fidelity.** Final colors, typography, spacing, and motion. Recreate pixel-close. The prototype includes a Tweaks panel — those are exploration knobs for design review, NOT user-facing settings. Pick the chosen defaults (palette `default`, motion `max`) and ship those values; do not port the Tweaks panel itself.

---

## Screens

### 1. Lobby

**Purpose:** Player enters name, picks a class, advances to deck builder.

**Layout** (max-width 880px, centered, padded 40px 32px):
- Hero block — eyebrow line, "Hand Battle" wordmark, italic subtitle
- Form column (max-width 480px)
  - Name input (single ornate-bordered text field, h=52px)
  - Class grid (5 columns × 1 row of tiles)
- Primary CTA "Pasul Următor" (h=60px, full-width gold button)

**Wordmark:**
- Font: Cinzel 900, 48–96px clamp(48px, 7vw, 96px)
- Gradient fill: linear-gradient(180deg, #ffe9b8 0%, #d4a857 40%, #6e5224 100%) clipped to text
- Drop shadow: 0 0 30px rgba(212,168,87,0.4)
- Flanked by small horizontal flourish glyphs in `--gold-candle`

**Eyebrow line:** "Hand of Spells · AI Gesture Duel", Cinzel 11px, letter-spacing 0.5em, uppercase, color `--gold-candle`, with thin horizontal gold lines fading in on either side.

**Subtitle:** EB Garamond italic 18px, color `--parchment-dim`.

**Class tile (5 total):**
- 1px solid rgba(212,168,87,0.22) border, radius 12px
- Background: linear-gradient(180deg, rgba(40,26,76,0.55), rgba(15,8,28,0.85))
- 18px 8px 14px padding
- Contents (vertical, centered):
  - 58×58 SVG class sigil in `--gold-candle` with drop-shadow glow
  - Class name (Cinzel 10–11px, uppercase, letter-spacing 0.08em, ellipsis on overflow)
  - HP value (JetBrains Mono 11px, color `--blood-glow`)
  - Perk description (EB Garamond italic 10.5px, color `--parchment-dim`, ~28px min-height)
- **Hover:** border → rgba(212,168,87,0.55), translateY(-3px), radial violet glow at top
- **Selected:** border → `--gold-candle`, background tints violet, `--glow-gold` box-shadow

**Classes (data):**

| id | name | hp | perk |
|---|---|---|---|
| soldat | Soldatul | 120 | +10 Scut start · +5 Regen Energie |
| mag | Magul | 80 | Magie -1 cost · +6 Regen Energie |
| capcaun | Căpcăunul | 180 | Atac +5 · +4 Regen Energie |
| asasin | Asasinul | 90 | Primul atac x2 · +4 Regen Energie |
| bancher | Bancherul | 100 | +20 Energie start · +3 Regen Energie |

**Name input:**
- Height 52px, padding 0 18px, font EB Garamond 18px italic placeholder
- Background: linear-gradient(180deg, rgba(20,12,38,0.7), rgba(10,6,20,0.85))
- Border 1px rgba(212,168,87,0.28), radius 8px
- Focus: border `--gold-candle`, `--glow-gold` box-shadow

**Field label ornament:** "◆ NUMELE VRĂJITORULUI ◆" Cinzel 11px, letter-spacing 0.28em, color `--gold-candle`, flanked by fading gold lines on both sides.

**Primary button "Pasul Următor":**
- Height 60px, full-width
- Background: linear-gradient(180deg, `--gold-bright` 0%, `--gold-candle` 50%, `--gold-base` 100%)
- Border 1px `--gold-deep`, radius 8px
- Inset highlight + 4px drop shadow on `--gold-deep` (creates raised look)
- Hover: translateY(-2px), `--glow-gold`, shimmer overlay sweep (1.2s loop)
- Active: translateY(2px), depressed shadow
- Label: Cinzel 700 14px, letter-spacing 0.18em, uppercase, color #2a1c0a

**On-load animation:** `.lobby-content` enters with opacity 0 → 1 + translateY(20→0) over 500–800ms (JS-driven, not CSS keyframes — see Implementation Notes).

---

### 2. Deck Builder

**Purpose:** Player picks exactly 15 cards from the pool, then matches.

**Layout** (padding 24px 32px, gap 20px, three rows):
- Header — title + filter chips
- Body — 2-column grid (1fr | 280px sidebar)
- Footer — back button (ghost) + primary CTA

**Header title:** "CONSTRUIEȘTE DECUL" Cinzel 26px uppercase, gold-clipped gradient text.
**Header subtitle:** "Alege exact **15 cărți** din arhive · jucător *<name>*" EB Garamond italic 14px, color `--parchment-dim`, "15 cărți" in `--gold-bright`.

**Filter chips:** 4 chips — Toate / Ofensive / Defensive / Utilitate
- Pill shape, h=32px, radius 16px, padding 0 14px
- Inter 12px medium, letter-spacing 0.08em, uppercase
- Inactive: rgba(20,12,38,0.5) bg, rgba(212,168,87,0.22) border, color `--ink-muted`
- Active: `--gold-bright` text, `--gold-candle` border, gold-tinted gradient bg, `--glow-gold`

**Card pool:** CSS grid `repeat(auto-fill, minmax(160px, 1fr))`, gap 18px, scrollable Y (thin gold-deep scrollbar). Cards at default size (`--card-w: 168px`, aspect 168/240).

**Deck sidebar** (`.panel.panel-ornate`, 280px wide, padding 18px):
- Eyebrow "DECUL TĂU" (gold-clipped)
- Circular progress ring (120×120 SVG, stroke gradient `gold-grad`, stroke-width 4, dashoffset animated 600ms)
  - Center text: "{n}<span faded>/15</span>" Cinzel 56/28px gold-clipped + "CĂRȚI" eyebrow under
- Deck list — scrollable column of compact rows, each row: 22px sigil column, name, "{cost} EN" right-aligned mono, hover-revealed × remove button
- (When empty) EB Garamond italic helper text: "Selectează cărți din arhivă pentru a-ți construi decul."

**Primary CTA states:**
- < 15 cards: disabled, grayscale, label "Mai ai nevoie de {15-n} cărți"
- == 15: enabled, full gold, label "Caută Adversar →"

---

### 3. Battle

**Purpose:** Live duel — two webcam tiles, stats, charge bar, log, hand of cards.

**Layout** (grid-template-rows: auto 1fr auto, gap 12px, padding 12px):
1. Opponent band — `grid-template-columns: minmax(0,1fr) 240px minmax(0,1fr)`
2. Arena (center)
3. Your band — same 3-column grid
4. Hand of 5 cards (bottom)

**Player band** (used for both opponent top + you bottom):
- Outer column 1 (or 3) — player meta + stats panel:
  - Player meta row: 28×28 class sigil, name (Cinzel 13px uppercase letter-spacing 0.14em) + class (EB Garamond italic 11px parchment-dim)
  - Stats panel: rgba(20,12,38,0.55), border rgba(212,168,87,0.18), radius 8px, padding 6px 8px
    - HP bar (see Components)
    - Energy crystal row (see Components)
    - Bottom row: shield value + status badges
- Center column (240px) — video tile
- Other outer column — round indicator ("TURA 4" eyebrow + "DUEL" gold-clipped Cinzel 22px) OR hand info

**Video tile:**
- Aspect 4/3, max-width 240px, margin auto
- Background: radial violet glow + diagonal hatched stripes (`repeating-linear-gradient(135deg, rgba(20,12,38,0.6) 0 4px, rgba(15,8,28,0.6) 4px 8px)`)
- Gold ring border via mask (1.5px gradient from `--gold-base` to `--gold-deep`)
- Bottom-left label tag: Cinzel 10px gold, dark bg with gold border
- Center placeholder: "Webcam · Tu" mono uppercase 10px, color `--ink-muted`
- **Casting state** (`.video-tile.casting`): box-shadow pulses gold (0.6s alternate), outer ring with animated gold/violet gradient blur

**HP bar:**
- h=22px, radius 11px, bg linear-gradient(180deg, #1a0a0a, #2a0e0e), inset shadow
- Fill: linear-gradient(180deg, #ff6868, `--blood`, #7a1f1f), inset highlight, glow
- `transform: scaleX(hp / hpMax)` with `transition: transform 600ms cubic-bezier(0.16,1,0.3,1)`
- Shine sweep: 3s ease-in-out infinite (transparent → white 20% → transparent)
- Center text: "{hp} / {hpMax}" JetBrains Mono 700 13px

**Energy crystals:**
- Row of hexagonal segments (clip-path polygon), 14×18px each, gap 4px
- Active: linear-gradient(180deg, `--violet-glow`, `--violet-arcane` 60%, `--violet-deep`) + soft glow + inset highlight
- Spent: opacity 0.18, grayscale, no shadow
- Charging: 1.2s pulse (scale 1 → 1.18, brightness 1 → 1.6)
- Render `enMax` crystals, mark first `en` as active

**Status badges:** Pill h=28px, radius 14px, padding 0 10px, Inter 600 11px uppercase letter-spacing 0.08em, leading 6px glowing dot. Variants:
- `buff` (teal-glow): `--teal-glow` text, teal border + glow
- `debuff` (blood-glow)
- `vuln` (amber)

**Charge bar:**
- 280px max-width, h=36px, radius 18px
- Background: dark inset, gold border 1px rgba(212,168,87,0.4)
- Fill: linear-gradient(90deg, `--violet-arcane`, `--violet-glow`, `--gold-bright`) with violet glow, transform-origin left, scaleX 0 → 1 over 1.5s linear when `.charging`
- Moving glow streak (60px wide, blur 4px) crosses left → right in 1.5s
- Center label: "ȚINE GESTUL · 1.5S" Cinzel 11px uppercase letter-spacing 0.3em

**Battle log:**
- max-width 420px, mask-image fade at top, vertical column of entries
- Entry: EB Garamond 13px, line-height 1.4, bottom-bordered with rgba(212,168,87,0.08)
- Inline actor tag (Cinzel 10px uppercase letter-spacing 0.16em `--gold-candle`) + text
- Variants by `.cls`: `damage` (blood-glow), `heal` (teal-glow), `buff` (violet-glow), `critical` (`--gold-bright`, 600ms flash background on entry)
- Entry rise animation: opacity 0 + translateY(6) → 1 + translateY(0) over 400ms

**Damage popup:** Cinzel 900 48px `--blood-glow` with red drop-shadow, absolute-positioned in arena, rises and fades over 1200ms (scale 0.6 → 1.2 → 0.9, translate y 0 → -160%).

**Cast ring:** 240×240 circle, gold border, scales 0.2 → 1.5, opacity 1 → 0, border-width 6 → 1, glow fades over 800ms.

**Screen shake:** 0.5s 9-keyframe translate jitter, applied via `.shake` class — used on opponent video on hit, on full battle screen when you take damage.

**Hand of cards:** 5 small cards (`--card-w: 124px`), centered, fanned with subtle rotation:
- nth-child(1): rotate(-6deg) translateY(8px)
- (2): rotate(-3deg) translateY(2px)
- (3): rotate(0deg)
- (4): rotate(3deg) translateY(2px)
- (5): rotate(6deg) translateY(8px)
- Hover (not disabled): rotate(0) translateY(-16px) scale(1.06)
- Active (charging): rotate(0) translateY(-24px) scale(1.1), gold-flow border + shimmer overlay

---

## Cards (core component)

All cards share the same component. Type drives only the accent color.

**Dimensions:**
- Default: 168×240, radius 14px
- Small (in hand): 124×178
- Large: 220×314

**Frame:** outer gradient ring (`--gold-base` → `--gold-deep` → `--gold-base`), padding-box trick, inner panel inset 1.5px.

**Inner panel:**
- Background: radial type-tinted glow at top + linear violet-to-ink gradient
- Filigree corners: 14×14px L-shaped ornaments in all 4 corners (1px gold lines, opacity 0.75)

**Top region:**
- Cost gem (top-left, hexagon clip-path 30×36, violet gradient + glow, JetBrains Mono 700 15px)
- Card name (Cinzel 700 11px uppercase letter-spacing 0.14em, gold-bright, centered, bottom border 1px rgba(212,168,87,0.3))

**Sigil region (center, flex 1):**
- 70% width SVG, max 88px
- Color = type accent (ember/azure/amber)
- Drop-shadow glow rgba(type-glow, 0.6) + 0.4
- Behind sigil: radial soft circle of same hue (60% width, opacity 0.25)

**Foot:**
- Top border 1px rgba(212,168,87,0.22), darker bg gradient
- Type label: Cinzel 9px uppercase letter-spacing 0.22em, type color
- Effect text: EB Garamond italic 11px line-height 1.25, color `--parchment-dim`, `<strong>` portions = `--parchment` normal-style

**Type accent colors:**
| Type | Color | Glow rgb |
|---|---|---|
| offense | `--ember` #e88848 | 232, 136, 72 |
| defense | `--azure` #5fb0e8 | 95, 176, 232 |
| utility | `--amber` #e8c14e | 232, 193, 78 |

**States:**
- **default:** static
- **hover:** translateY(-6px), brightness 1.08, inner shadow tinted to type color
- **disabled** (energy insufficient): grayscale 0.8, brightness 0.45, cost gem desaturated, cursor not-allowed
- **selected** (deck builder): thicker gold frame (2.5px), gold-pale gradient, inset gold shadow, top-right ✓ badge (22px circle, gold gradient)
- **active** (gesture being held): pulse animation (1.6s ease-in-out infinite, translateY -10 → -14, scale 1 → 1.04), `gold-flow` animated frame, intense type glow (36px + 72px), shimmer overlay (1.6s linear)

**Card back** (face-down): violet radial bg, centered 50% gold-bordered circle with inner ring + central diamond glyph.

---

## Gesture sigils (19 cards)

All sigils are **abstract geometric glyphs** drawn with primitives only (lines, circles, polygons, paths of straight lines). **Not** drawings of hands. Each SVG is 100×100 viewBox, `currentColor` for stroke + fill, in `js/sigils.js`.

| Card | Cost | Sigil concept |
|---|---|---|
| atac | 1 | Angular lightning chevron polygon |
| magie | 3 | 8-point star burst + inner diamond |
| concentrare | 2 | 3 concentric circles + center dot |
| garda | 2 | 4-pointed compass star + center cutout |
| dubla | 4 | Twin crescent horns |
| scut | 1 | Hexagonal shield outline + cross |
| bariera | 3 | Triangle over horizontal line |
| reflectie | 4 | Two mirrored triangles meeting at midline |
| ghimpi | 2 | 12-spike radial burst + center disc |
| purificare | 2 | Triangle (flame) with inner triangle |
| buff | 2 | Up arrow in circle |
| pregatire | 1 | Dashed outer + solid inner ring + center dot |
| debuff | 2 | Down arrow in circle |
| vulnerabil | 1 | Broken-L corner with floating dot |
| sacrificiu | 0 | 8-armed asterisk + center disc |
| adrenalina | 1 | 3 parallel diagonal slashes |
| viziune | 1 | Eye ellipse + iris dot |
| arhiva | 2 | Square with internal X |
| pass | 0 | 4 parallel lines + arrow-forward triangle |

## Class emblems

| Class | Emblem |
|---|---|
| soldat | Crossed swords (two diagonal lines + hilt diamonds) |
| mag | Vertical staff with 5-point star on top |
| capcaun | Twin fangs (triangles) under horizontal bar |
| asasin | Slim dagger blade + crossguard + pommel |
| bancher | Concentric coin circles + stacked rune lines |

Both sigil sets are 100×100 viewBox SVGs in `js/sigils.js` (`HB_SIGILS` and `HB_CLASS_EMBLEMS` exported on `window`). Copy them verbatim into the production code.

---

## Interactions & Behavior

### Lobby
- Class tile click → toggle `.selected` on clicked tile, remove from all others; update `state.playerClass`.
- Name input → store live in `state.playerName`.
- "Pasul Următor" → fade-out lobby (opacity transition 500ms), fade-in builder.

### Deck Builder
- Pool card click:
  - if not in deck and deck < 15 → add, toggle `.selected`
  - if in deck → remove
  - if deck == 15 → flash warning toast
- Filter chip click → set filter, re-render pool.
- Deck-item row hover → reveal × remove button.
- "Caută Adversar" disabled until deck.length === 15.

### Battle (gesture cast loop)
The 1.5s hold is the cornerstone interaction.

```
on pointerdown card  → if state.you.en >= card.cost:
  state.charging = true
  cardEl.add('.active')
  chargeBar.add('.charging')        // CSS animates scaleX over 1.5s
  chargeTimer = setTimeout(doCast, 1500 / motionScale)

on pointerup / pointerleave / pointercancel:
  if state.charging:
    clearTimeout(chargeTimer)
    cardEl.remove('.active')
    chargeBar.remove('.charging')
    state.charging = false

doCast(card):
  - subtract card.cost from energy
  - apply card effect to opponent / self
  - spawn .cast-ring at center of arena (remove after 900ms)
  - if damage: shake opponent video, spawn damage popup, push 'damage' log entry
  - if defense: bump shield, push 'buff' log entry
  - re-render battle band
  - 1.1s later: opponent counter-cast → add .casting to opponent video for 800ms, apply damage to you, shake whole battle screen
```

In the real app, replace the simulated `doCast` with the existing Socket.IO event dispatch — but keep the CSS class lifecycle (`.active` / `.charging` / `.casting` / `.shake`) and the cast-ring spawn identical.

### Charge bar timing
The CSS animation duration is hard-coded to 1.5s. If you change MediaPipe hold time, also update `@keyframes charge-fill` duration in `styles/screens.css`.

---

## State Management (current minimum)

The prototype keeps a single `state` object. In the real app, your existing `app.js` already manages this — just expose:

```js
state.battle.you  = { hp, hpMax, en, enMax, shield, statuses: [...] }
state.battle.foe  = { hp, hpMax, en, enMax, shield, statuses: [...] }
state.battle.log  = [ { actor, text, cls } ]
state.battle.charging = boolean
state.battle.activeCard = Card | null
```

The render functions key off these. Re-render the affected band/log on each state delta — full re-render is fine at this scale (~6 elements).

---

## Design Tokens

All tokens are defined in `prototype/styles/tokens.css`. Copy that file verbatim or inline into `static/style.css`.

### Colors

| Token | Value |
|---|---|
| --ink-void | #08060f |
| --ink-deep | #120a22 |
| --ink-mid | #1b1132 |
| --ink-soft | #2a1c4a |
| --ink-hover | #382663 |
| --violet-arcane | #6b4ee8 |
| --violet-glow | #b89cff |
| --violet-mist | #8a6df0 |
| --violet-deep | #3b2380 |
| --gold-deep | #6e5224 |
| --gold-base | #b88a3e |
| --gold-candle | #d4a857 |
| --gold-bright | #f5d28a |
| --gold-pale | #ffe9b8 |
| --parchment | #ede2c6 |
| --parchment-dim | #bfb198 |
| --ink-text | #f3ecdb |
| --ink-muted | #a89cb8 |
| --ink-faint | #6a5e80 |
| --blood | #c14545 |
| --blood-glow | #ff6868 |
| --teal-ward | #4ec3a8 |
| --teal-glow | #7de4cb |
| --ember | #e88848 |
| --azure | #5fb0e8 |
| --amber | #e8c14e |

### Typography

- Display: **Cinzel** 500/700/900 (titles, eyebrows, card names)
- Serif: **EB Garamond** 400/500/italic (card flavor, descriptions, helper text)
- UI: **Inter** 400/500/600/700 (chips, badges, generic UI)
- Mono: **JetBrains Mono** 500/700 (HP/EN numbers, stats)

Load all four from Google Fonts (the prototype's `<link>` tag is reusable verbatim).

### Spacing scale
4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 px (--sp-1 … --sp-8)

### Radii
4 / 8 / 12 / 14 (card) / 18 / 26 px

### Shadows + glows
See `tokens.css`: `--shadow-sm/md/lg`, `--glow-violet/gold/blood/teal`, `--shadow-inner`.

### Motion easings
- `--ease-out`: cubic-bezier(0.16, 1, 0.3, 1)
- `--ease-in`: cubic-bezier(0.7, 0, 0.84, 0)
- `--ease-spring`: cubic-bezier(0.34, 1.56, 0.64, 1)

### Motion scale
The `--motion-scale` token modulates animation durations. Body classes `.motion-max` (1), `.motion-med` (0.6), `.motion-low` (0.2) flip it — accessibility win. Default to `.motion-max`.

---

## Responsive

**Mobile-first per brief.** Provide CSS at common breakpoints.

The prototype includes a viewport switcher and tunes:
- `.battle-band` grid → `minmax(0,1fr) 110px minmax(0,1fr)` on mobile
- Hand cards → 78×112
- Class tiles → tighter padding, smaller sigils (38×38), name 9px, perk hidden

Apply these overrides at `max-width: 640px` in the real CSS.

Landscape vs portrait: battle works in both since the grid is naturally 3-row. Lobby/builder are vertical scrolling — fine on both.

---

## Implementation Notes (gotchas)

1. **The lobby-content rise animation must be JS-driven**, not CSS keyframes. CSS animations on elements that were inside a `display:none` ancestor at parse time can freeze at frame 0 in some browsers. The prototype uses a double-rAF approach in `renderLobby()` to set opacity/transform inline. Copy this pattern.
2. **Screens use `display: none !important` when not active**, and `.is-active` overrides to `flex` or `grid` depending on screen. Don't drop the `!important` — the screen-specific `display: grid` rule for `.battle` will otherwise win.
3. **Video tiles must be width-constrained.** They have `aspect-ratio: 4/3` and live in a grid cell — without `max-width: 240px` they'll expand to fill the cell and break the row height.
4. **MediaPipe gesture → card.active class**: in your existing `app.js`, when the recognized gesture matches the hand's card AND the hold timer starts, add `.active` to that card element. The card's CSS does the rest (pulse + shimmer + gold flow).
5. **Charge bar duration is in CSS**, not JS. If you ever tune the 1.5s hold, update `@keyframes charge-fill` and `@keyframes charge-glow` durations together.
6. **Embers canvas is decorative** and runs an rAF loop. On mobile / low-power, gate it behind `prefers-reduced-motion: reduce` and skip the loop entirely.

---

## Files

In `prototype/`:

```
Hand Battle.html         - Entry point + screen scaffold
styles/
  tokens.css             - All design tokens (drop-in)
  components.css         - Buttons, inputs, panels, filigree, HP bar, energy crystals, badges, chips
  cards.css              - Card component + states + sizes + back
  screens.css            - Lobby / Builder / Battle layout + prototype chrome
js/
  sigils.js              - 19 gesture sigils + 5 class emblems + small icons (SVG strings)
  data.js                - Card data array + class data + renderCard() helper
  prototype.js           - Screen orchestration, sim state, charge loop, embers, tweaks
                           (in production: replace the sim parts with real Socket.IO handlers,
                            keep the render helpers and class-state choreography)
```

In the real app you target the existing `static/index.html`, `static/style.css`, `static/app.js`. **Do not introduce a framework or build step.** The cleanest port:
- Inline `tokens.css` + `components.css` + `cards.css` + `screens.css` into `static/style.css`
- Inline `sigils.js` constants into `static/app.js` (or a new `static/sigils.js`)
- Update the existing HTML templates in `static/index.html` to use the new class names and structure shown in the prototype's render functions

---

## Out of scope (do not port)

- The Tweaks panel (`.tweaks-panel`) is a design-review tool, not a user setting.
- The prototype chrome top tabs (`.proto-chrome`) — the real app already routes between screens via Socket.IO state.
- The `palette-crimson / -emerald / -azure` body classes — only ship the default arcane palette.
- The simulated battle loop in `prototype.js` (`doCast`, `foeCasts`, `state.battle.log` seeding) — use the real game state from your existing app.

If anything in this README contradicts the visual in the prototype HTML, **the HTML wins**. Open it in a browser and inspect.
