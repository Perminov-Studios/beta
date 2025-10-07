# Project Overview

This repository currently serves a static prototype of an art / media platform consisting of three main page groups:

1. Public landing pages: `index.html`, `login.html`, `resetpassword.html`
2. Authenticated dashboard: `client/dash.html` (with a large tab system and dynamic gallery)
3. Static data assets: JSON + images inside `data/` and `assets/images/`

## Goals of This Documentation

Provide a quick mental model so you can jump to the right place fast, and outline next refactors if/when you want to modularize further.

## High-Level Structure

assets/
CSS/ (Global & page‑specific styles – see section below for suggested future split)
JS/ (Per‑page scripts; dashboard logic lives in `dash.js`)
images/ (Static raster + SVG assets)
client/
dash.html (Dashboard shell; multiple tab panels rendered/hidden by `dash.js`)
data/
images.json (Gallery seed data consumed by dashboard)

## Key Runtime Concepts

Dashboard Tabs (`dash.html` + `assets/JS/dash.js`)

- Each visible panel uses class `Main` plus a semantic class (e.g. `home`, `events`, `selectedphoto`).
- Navigation links (top nav + dropdown portal links) use `data-tab` that matches a panel class.
- URL hash deep‑links e.g. `#selectedphoto-15` switch the active panel and load a focused image view.

Dynamic Gallery

- Populated from `data/images.json` (supports both `{ images: [...] }` and raw `[...]` formats).
- Pagination is client‑side only; page size is read from `data-page-size` attribute on the gallery grid container.

Notifications & Messages

- Dropdown menus create accessible, keyboard-navigable popovers.
- Badges animate numerical changes via CSS animation classes.

## Styling Overview

`dash.css` Largest file; contains layout primitives, navigation, dropdowns, gallery, pagination, selected-photo view, and utility helpers. Section headers have been normalized for quick grep (search for: SECTION: ).
`login.css` Auth (login/register + modal) styles; includes theme CSS custom properties and panel flip transitions.
`nav.css` Landing page hero & navigation bar styles.
`index.css` Lightweight global resets / body defaults for the landing page.
`footer.css` (Placeholder) – kept for future footer-specific overrides; currently empty.

## JavaScript Overview

`dash.js`

- Boot sequence (DOMContentLoaded) wires tab system, dropdown accessibility, badges, gallery loader, deep linking.
- Functions are grouped by feature with banner comments; search for: FEATURE: .
  `script.js`
- Handles login/register panel toggle animations, simple form validation, alert messages, and theme toggle.

## Suggested Future Refactor (Optional)

Short Term (Low Risk)

- Split `dash.css` into: `base.css` (reset + typography), `layout.css` (Main / columns / responsive), `components.css` (dropdowns, gallery, pagination, buttons), `pages.css` (selected-photo specifics), then import them in `dash.html` in order.
- Move inline AOS init scripts into a new `assets/JS/aos-init.js` to declutter HTML.
- Extract gallery + selected photo logic into `gallery.js` and `photo-view.js`; keep a small orchestrator in `dash.js`.

Longer Term

- Replace manual tab logic with a lightweight router (hash-based) for simpler deep links.
- Introduce a build step (e.g. Vite) to allow ES module composition + bundling + minification.
- Add a simple test harness (Jest or Vitest) for gallery pagination and hash parsing utilities.

## Developer Quick Links

Search terms to jump fast:

- "SECTION: NAV" (navigation CSS)
- "SECTION: DROPDOWNS" (profile / inbox / notifications)
- "SECTION: GALLERY" (bento grid + item hover)
- "FEATURE: TAB SYSTEM" (`dash.js` tab logic)
- "FEATURE: GALLERY LOAD" (fetch + pagination)
- "FEATURE: SELECTED PHOTO" (deep link view builder)

## Accessibility Notes

- Dropdowns trap focus and close on Escape.
- Badges use hidden live regions for screen readers (messages).
- Gallery images are focusable (`tabindex="0"`) supporting keyboard activation.
- Pagination buttons implement `aria-current="page"` when active.

## Browser Support Assumptions

Modern evergreen browsers (Chrome, Edge, Firefox, Safari). No polyfills included; optional chaining & ES2015+ features avoided or guarded.

## Contributing

1.  Keep behavioral changes separate from commentary-only commits.
2.  When splitting files, update all `<link rel="stylesheet">` / `<script>` references and test dashboard hash routes.
3.  Prefer progressive enhancement: new JS features should fail gracefully if data or DOM elements are missing.

## License

(Add a LICENSE file if/when you choose an open-source license.)

## Revision History

2025-10-07: Added documentation & inline comments pass (non-breaking) to improve discoverability.
