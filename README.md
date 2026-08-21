# expresso

I made this to help justify this expensive hobby of mine by visually being able to see if I save money by making espresso at home vs. going to a traditional cafe.

A home-espresso tracker: what beans you've bought, how you dialed them in, what you've made with them, and whether the whole setup has paid for itself yet.

**Live:** https://rafzal2020.github.io/EspressoLog/

## What's in it

### Beans
Log a bag when you buy it — roaster, roast level, weight, price. Buying the same bean again doesn't create a duplicate row: it merges into the existing card and bumps the quantity (shown as `qty × price = total`), with a quick +/− stepper to adjust stock without reopening the purchase form.

Tap a bean card to open its detail sheet:
- A continuously spinning **3D render of the bag** (real WebGL, not a static image), with the bean's actual name printed on the label.
- Roast / weight / price-per-bag at a glance, plus the quantity stepper.
- Every dial-in you've logged *for that specific bag* — grind, dose, yield, time, ratio, tasting notes, and a "keeper" star — with a "+ Log a shot" button scoped to that bean. Dial-ins live with the beans they belong to, instead of one long undifferentiated list.

### Drinks
Log what you made and what it cost you to make it. That cost is the whole savings model — see My Stats.

### My Stats
- Your machine: photo, price paid, purchase date, last water-filter change, and general setup notes (grinder settings, machine quirks — the stuff that isn't tied to any one bag of beans).
- **Spend vs. Savings**: a bar chart comparing what you've put in (machine + beans, quantity-aware) against what your drinks have saved you, plus a "% paid back" meter and a line telling you straight out whether the setup has paid for itself yet.
- **Drinks Made**: a bar chart of how many drinks you've made, switchable between weekly / monthly / annually views.

## Why it's built the way it is

No framework, no bundler, no build step — plain HTML/CSS/JS loaded as classic `<script>` tags sharing one namespace (`window.ShotLog`). That's a deliberate choice, not an oversight: this is meant to be opened straight from disk (double-click `index.html`) as well as hosted, and `<script type="module">` is blocked by CORS under `file://` in every major browser. Classic scripts aren't.

The one real dependency — [Three.js](https://threejs.org) (r128, MIT licensed), used for the 3D bag — is vendored locally in `js/vendor/three.min.js` rather than pulled from a CDN, so it works offline too.

All data lives in the browser's `localStorage`. Nothing is sent anywhere; there's no backend. Opening the app on a different device or in a different browser starts fresh.

## Running it

Either:
- **Open `index.html` directly** — no server needed.
- **Visit the live link above**, or host the folder anywhere that serves static files (GitHub Pages, Netlify, etc.) — everything uses relative paths, so it works from any subpath.

## Project structure

```
index.html              entry point — loads styles + scripts in dependency order
css/styles.css           everything, including the animated background and 3D-sheet UI
manifest.json            PWA metadata (Add to Home Screen on iOS/Android)
icons/                   app icons

js/
  state.js               seed data, load/save, one-time data migrations
  helpers.js              formatting/escaping utilities
  icons.js                tab-bar SVG icons
  motion.js               tab-indicator animation, icon gestures, scroll-driven hero shrink
  sheet.js                shared bottom-sheet component (forms, recipe modal, bean detail)
  beanBag3d.js            the WebGL spinning coffee bag
  beanDetail.js           per-bean detail sheet: dial-in log + quantity stepper
  recipeModal.js          drink recipe view/edit
  vendor/three.min.js     Three.js, vendored locally
  panels/
    beans.js              Beans tab
    drinks.js             Drinks tab
    stats.js              My Stats tab
  main.js                 tab routing, header stats, boot
```

## Browser support

Needs WebGL for the 3D bag render (falls back to a plain message if unavailable) and modern CSS (`aspect-ratio`, `backdrop-filter`, CSS custom properties). Built and tested primarily for mobile Safari and Chrome.
