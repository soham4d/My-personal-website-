# AGENTS.md

Static personal site ("Soham" — ink-notebook theme). **No build step, no bundler, no test/lint/typecheck config.** Every page is a hand-written HTML file that loads one shared stylesheet and one shared script. Do not introduce a framework or bundler.

## Project rules

- Static site: plain HTML, CSS, JS. No build step, no frameworks.
- Pages: `main.html`, `hobbies.html`, `fountain-pens.html`, `pencils.html`. Shared `style.css` and `animations.js`.
- Design: "ink notebook". Bone-paper dot-grid background, oxblood / moss / indigo palette.
- Fonts: IBM Plex Mono (headlines), Source Serif 4 (body). **No other fonts.**
- Always use the CSS variables in `style.css` for colours. **Never hardcode hex values.**
- Every colour change must work in dark mode (navy "desk lamp" theme).
- Animations: GSAP + ScrollTrigger + Lenis from CDN. **Animate transform/opacity only.**
- Respect `prefers-reduced-motion`. Skip the custom cursor on touch devices.
- Do not add new libraries or dependencies without asking. **No 3D / Three.js.**
- Keep the copy honest: never invent projects, links or collection details. Use placeholders marked `TODO` instead.

## Workflow

- Show a diff or plan before editing multiple files.
- Change only the files needed for the task.
- **Do not run `git commit` or `git push`.** The user commits.

## Commands

```powershell
python -m http.server 8123        # serve from repo root -> http://127.0.0.1:8123/main.html
```

`npm install` is **not** required to preview the site — GSAP, ScrollTrigger, and Lenis load from the jsDelivr CDN via `<script>` tags at the bottom of every page, not from `node_modules/`. `package.json` deps are only a version record; `node_modules/` is gitignored. There is no `scripts` block, so no `start`/`build`/`test` target exists.

`main.html` is the home page — **there is no `index.html`**. A change to `style.css` or `animations.js` affects all four pages.

## Palette & fonts (the actual variable names)

| Rule says | Variable(s) in `style.css` |
|---|---|
| bone paper | `--paper`, `--card`, `--line-200`, `--paper-line` |
| oxblood | `--oxblood`, `--oxblood-soft` |
| moss | `--moss`, `--moss-soft` |
| indigo | `--ink-900`, `--ink-700`, `--ink-500` — **there is no `--indigo` variable** |
| amber | `--amber` (tape, swatch nib, dark-mode accents) |

Fonts live in `--font-mono` (headlines) and `--font-serif` (body). The Google Fonts `@import` at the top of `style.css` is the only font source — extend that one line if a weight is missing, never add a second `@import` block. (`@import` must stay above all other rules.)

## Colours & dark mode — read this before touching a colour

- Colours are CSS custom properties defined **twice** — in `:root` and again in the `body.dark-mode` block. A new variable must be added to **both** or it will not change in dark mode.
- Dark mode is the class `body.dark-mode` on `<body>`, not a media query. Theme persists in `localStorage` under key `site-theme`; initial value falls back to `prefers-color-scheme`. The toggle button is JS-generated.
- Some elements can't be expressed with variables, so they have hand-written `body.dark-mode` overrides: `.avatar`, `.button.primary`, `.timeline span`, `.file-tab`, `.nib-badge`, `.quick-list li:hover`, `.profile-card::before`, `.tag-cloud span:hover`, `.hobby-preview` / `.pen-hero`, `.theme-toggle`.
- **Existing convention for translucent surfaces:** the base rule hardcodes the light `rgba(...)` and a matching `body.dark-mode .x` rule hardcodes the dark one — e.g. `.site-header` uses `rgba(238, 240, 233, 0.82)` and dark mode uses `rgba(18, 27, 40, 0.82)`. Follow this pattern; don't convert one side and leave the other stale.
- The dot grid (`background-image: radial-gradient(var(--paper-line) 1px, transparent 1px)`) is on `body` only, so any section that sets an opaque background hides it. That is why sections alternate `--paper` / `--card`.

## Per-page boilerplate (no templating)

Each page duplicates its own `<head>`, favicon, header, nav, footer, and CDN script tags. When adding or editing a page:

- Copy the favicon **data-URI** `<link>` verbatim from an existing page (there is no favicon file).
- Copy the four CDN `<script>` tags + `animations.js` at the end of `<body>`, in that order. `animations.js` depends on `window.gsap`, `window.ScrollTrigger`, and `window.Lenis` being present.
- Set `aria-current="page"` on that page's own nav link only; the other nav links have no attribute.
- Small secondary buttons (product/source links) use this exact repeated inline style: `style="margin-top:20px; min-height:auto; padding:9px 16px; font-size:0.8rem;"`.
- Detail blocks use `<dl><div><dt>Label</dt><dd>Value</dd></div></dl>` (e.g. pen cards).

## DOM that `animations.js` injects — do not hand-write it in HTML

`.header-right` (and the theme toggle inside it), `.scroll-progress-track`, `.back-to-top`, `.ink-cursor`, `.ink-blot`, and the `svg.ink-defs` filter are all created at runtime. The nav element is *moved* into a generated `.header-right` wrapper, and the theme toggle is appended after it. These class names exist in `style.css` but have zero HTML counterparts.

## The SVG ink system

- Every hand-drawn stroke is an inline `<path class="ink-stroke">`. `animations.js` applies the `url(#ink-rough)` turbulence/displacement filter and animates `stroke-dashoffset`. **Omit `class="ink-stroke"` and the stroke renders as a plain clean line, not hand-inked.**
- JS targets these containers for draw-on-reveal: `.ink-underline-wrap`, `.heading-underline`, `.seal-ring`, `.timeline-line`, and `.pen-swatch` (hover-to-draw). A new decorative SVG needs its own wiring in `animations.js` to animate.
- Inline SVGs use `preserveAspectRatio="none"` so the `viewBox` stretches to the CSS box — the stroke shape depends on it. (`pen-swatch-empty` intentionally omits it.)
- `viewBox` sizes are hand-tuned to the text they underline; reusing one on a different-length heading will look off.

## Motion

- `prefers-reduced-motion: reduce` is handled in **both** `style.css` and `animations.js`. New animations must respect it in both places.
- The custom cursor is already guarded by `window.matchMedia('(pointer: fine)').matches && !reduceMotion` in `animations.js` — keep that guard if you touch it.
- Scroll reveal uses two classes: `.reveal` (single element) and `.reveal-stagger` (group — children animate in sequence).
- For new work, animate only `transform` / `opacity` (compositor-friendly). Two deliberate exceptions already exist: the ink system animates `stroke-dashoffset`, and the click blot animates `width`/`height`. Colour and border transitions are also already used in `style.css` for hover states.
- **Gotcha:** `.reveal` and `.reveal-stagger > *` are `opacity: 0` in CSS. If JavaScript is disabled entirely, that content never becomes visible. The IntersectionObserver fallback in `animations.js` only runs when `window.gsap` is missing, so a GSAP CDN failure is handled but a total JS failure is not.

## Copy honesty

- Never invent a project, product link, spec, or collection detail. If content is unknown, leave a placeholder marked `TODO` (e.g. `<!-- TODO: add product page -->`) rather than plausible-sounding filler.
- Reserved/empty slots use the `--empty` modifier classes: `.interest-card--empty` (dashed border, muted text) and `.pen-card--empty` (dashed, centred, placeholder copy). Reuse them instead of inventing a third card.
- External links use `target="_blank" rel="noopener"`.

## Gotchas

- `package-lock.json` is **stale**: it still lists `animejs` and `aos` (plus the old package name `My-personal-website-`) that `package.json` no longer declares. `npm ci` prunes those 5 packages. Don't trust the lockfile as the dependency source of truth. Three.js is not installed and must not be added.
- Browser cache serves stale HTML after edits — hard-refresh when a local static server appears to ignore your change.
- No CI, no deploy config, no lint/format config in the repo. Remote is `https://github.com/soham4d/My-personal-website-`, branch `main`.
- `style.css` sets `body { overflow-x: hidden }` and cards are slightly rotated, so a horizontally overflowing element is clipped rather than scrollable.
