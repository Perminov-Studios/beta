# Project Overview

This repository hosts a static prototype of an art/media platform with:

1. Public landing pages: `index.html`, `login.html`, `resetpassword.html`
2. Authenticated dashboard web app: `client/dash.html`
3. Static data assets: JSON + images in `data/` and `assets/images/`

The dashboard is structured for progressive enhancement: it renders without JS and upgrades to a tabbed SPA-like experience when scripts load.

## High-Level Structure

- `assets/`
  - `CSS/` Global and landing-page styles
  - `JS/` Legacy dashboard script (`dash.js`) used by non-client pages
  - `images/` Static raster + SVG assets
- `client/`
  - `dash.html` Dashboard shell (tabs/panels)
  - `Assets/` Dashboard-only assets
    - `base.css` Global dashboard layout/components
    - `base.js` Core tab system, deep links, dropdown wiring, selected-photo view, upload demo
    - Tab modules: `Home/`, `Profile/`, `Settings/`, `Privacy Policy/`, `Messages/`, `Notifcations/`, each with `color.css` and `script.js`
- `data/`
  - `images.json` Gallery seed data consumed by dashboard and profile

Notes

- `client/dash.html` uses assets under `client/Assets/…` (not the legacy `assets/JS/dash.js`). The legacy script remains for landing/older prototypes and can be removed if not needed.

## Runtime model (dashboard)

Panels and tabs

- Each panel has class `Main` plus a semantic class, e.g. `home`, `events`, `profile`, `selectedphoto`.
- Navigation and account-portal links carry `data-tab` matching the panel class. Example: `data-tab="profile"` -> `.Main.profile`.
- Deep links: `#selectedphoto-<id>` opens the Selected Photo view for that image.

Custom tab activation event

- On every tab switch, `client/Assets/base.js` emits a custom event:
  - Type: `tab:activate`
  - Payload: `{ detail: { name: string /* normalized tab name */ } }`
- Example listener:

```js
document.addEventListener("tab:activate", (e) => {
  if (e.detail?.name === "profile") {
    // initialize or refresh profile view
  }
});
```

Selected Photo view

- When a gallery item is clicked, the app switches to `.Main.selectedphoto` and renders the image + metadata and actions.
- The URL hash becomes `#selectedphoto-<id>`; a copyable share link is generated.
- A lightweight report FAB and basic like/share/comment interactions are provided for demo.
- The last gallery tab (`home` or `profile`) is remembered in `sessionStorage.lastGalleryTab` for a quick “Back” behavior.

## Profile tab specifics

Files

- Markup in `client/dash.html` under `.Main.profile`
- Logic in `client/Assets/Profile/script.js`

Behavior

- Lazy initialization: the Profile module listens for `tab:activate` with `name === "profile"` and loads user images on first activation (also initializes immediately if the Profile panel is visible at page load).
- Galleries
  - Featured: top 6 by views (basic numeric parse supports values like `1.2k`)
  - All Images: full set from `../data/images.json`
  - Likes: for the profile owner only; computed from IDs stored in `localStorage.psLikedImageIds`
- Image click navigates to the Selected Photo view; IDs are persisted in `sessionStorage.selectedPhotoId` when navigating.
- Sidebar mock data renders banner, profile picture, status, username/handle, and example social links.

Data source

- `../data/images.json` supports both `{ images: [...] }` and bare `[...]` formats. Each image should include `image.src`, `title`, `description`, and optionally `author.avatar`, `author.name`, `views`, `colors`, etc.

## Accessibility highlights

- Dropdowns (profile, inbox, notifications) trap focus and close on Escape; icons are keyboard-activatable.
- Top navigation underline is purely decorative and hides for account-portal tabs as appropriate.
- Gallery items and promoted cards are focusable and activate on Enter/Space.
- Pagination marks the active page with `aria-current="page"`.

## Developer guide (quick find)

- “FEATURE: TAB SYSTEM” in `client/Assets/base.js`
- “SELECTED PHOTO RENDERING” in `client/Assets/base.js`
- Profile gallery in `client/Assets/Profile/script.js` (search for renderFeatured/renderAll/renderLikes)
- Data fetch path: `../data/images.json` relative to `client/dash.html`

## Suggested future refactors (optional)

Short term

- Extract Selected Photo and tab underline code to standalone modules.
- Normalize data shape for `images.json` and add schema comments.

Longer term

- Introduce a hash router to replace manual tab management.
- Add a build step (e.g., Vite) and unit tests for URL/hash parsing and filters.

## Contributing

1. Keep behavioral changes separate from commentary-only commits.
2. When reorganizing files, update all `<link rel="stylesheet">`/`<script>` references in `client/dash.html` and verify deep links and tab activation events.
3. Prefer progressive enhancement; handle missing DOM/data gracefully.

## Revision History

2025-10-10

- Fix: Profile images now load automatically on tab switch by emitting a `tab:activate` event in `client/Assets/base.js` and listening in `client/Assets/Profile/script.js`.
- Docs: Updated README to reflect `client/Assets/` structure, event contract, local run steps, and Profile behavior.

2025-10-07

- Added documentation & inline comments pass (non-breaking) to improve discoverability.
