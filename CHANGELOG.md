# Perminov Studios v3 - Changelog

## [3.0.2] - 2026-02-08

### Added
- **css/variables.css**: New centralized CSS variables file containing all design tokens
  - Color palette (primary, black, white, derived colors)
  - Typography (font families, sizes)
  - Spacing scale
  - Border properties
  - Button sizing
  - Transitions
  - Z-index scale
  - Shadow utilities

### Changed
- All CSS files now import from centralized variables.css:
  - `index/css/color.css` - imports variables, removed local :root
  - `profile/css/color.css` - imports variables, removed local :root  
  - `profile/css/nav.css` - imports variables, removed local :root
  - `profile/css/edit-portfolio-modal.css` - imports variables, removed duplicate font-face
  - `profile/css/image-viewer-modal.css` - imports variables
- To change the site theme, now only edit `css/variables.css`

---

## [3.0.1] - 2026-02-08

### Added
- Comprehensive README.md with project documentation
- EditorConfig file for consistent code formatting
- Better code comments throughout all files
- JSDoc-style comments for JavaScript functions

### Changed
- **index.html**: Added meta description, organized head section with comment blocks
- **login.html**: Added meta description, organized head section
- **signup.html**: Added meta description, organized head section
- **portfolio.html**: Added meta description, organized head section, proper page title
- **public.html**: Added meta description, organized head section, proper page title
- **privacy.html**: Added meta description, organized head section
- **terms.html**: Added meta description, organized head section

### CSS Improvements
- **index/css/color.css**: 
  - Added table of contents
  - Organized into logical sections (Fonts, Variables, Resets, Nav, Main, Video, Hero, Scroll, Preloader, Animations)
  - Better comments explaining each section
  - Removed duplicate `.scroll.hidden` rule

- **profile/css/color.css**: 
  - Updated table of contents
  - Added file description with version info
  - References to related CSS files

- **profile/css/nav.css**: 
  - Added comprehensive header with table of contents
  - Better organization notes

### JavaScript Improvements
- **index/js/script.js**: 
  - Added file header with table of contents
  - Organized into 5 main sections
  - JSDoc comments for functions
  - Better variable naming
  - Consistent formatting

- **profile/js/script.js**: 
  - Added file header with table of contents  
  - Organized into 8 main sections
  - JSDoc comments for functions
  - Better code documentation

- **profile/js/nav.js**: 
  - Added comprehensive header explaining modal system
  - Usage documentation in comments
  - Better section organization

- **index/js/notif-modal.js**: Properly documented as disabled
- **index/css/notif-modal.css**: Properly documented as disabled

### Deprecated
- `icons/old/` folder - Contains old icon assets

### Notes for Developers
- All HTML files now use `<!DOCTYPE html>` (uppercase)
- All files have consistent 2-space indentation
- Toast notification system is documented in README.md
- Modal system usage is documented in nav.js header
