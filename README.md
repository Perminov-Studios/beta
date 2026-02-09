# Perminov Studios - Creative Portfolio Platform

A modern, responsive portfolio website built with HTML, CSS, and JavaScript.

## 📁 Project Structure

```
Perminov v3/
│
├── 📄 index.html          # Landing page with preloader & hero section
├── 📄 login.html          # User login page
├── 📄 signup.html         # User registration page
├── 📄 portfolio.html      # Main portfolio dashboard (authenticated users)
├── 📄 public.html         # Public portfolio view
├── 📄 privacy.html        # Privacy policy page
├── 📄 terms.html          # Terms of service page
├── 📄 Pavelt.otf          # Custom font file
│
├── 📁 favicon/            # Favicon assets for various devices
│   └── site.webmanifest   # PWA manifest file
│
├── 📁 icons/              # Icon assets
│   └── old/               # Deprecated icons
│
├── 📁 index/              # Landing page assets
│   ├── css/
│   │   ├── color.css      # Main landing page styles
│   │   └── notif-modal.css # Notification modal styles (disabled)
│   ├── js/
│   │   ├── script.js      # Landing page JavaScript
│   │   └── notif-modal.js # Notification modal logic (disabled)
│   ├── images/            # Landing page images
│   └── videos/            # Background videos (waves.mp4, etc.)
│
├── 📁 profile/            # Portfolio/Dashboard assets
│   ├── css/
│   │   ├── color.css      # Main portfolio styles
│   │   ├── nav.css        # Navigation & modal system styles
│   │   ├── edit-portfolio-modal.css  # Edit portfolio modal
│   │   └── image-viewer-modal.css    # Lightbox image viewer
│   ├── js/
│   │   ├── script.js      # Portfolio functionality
│   │   └── nav.js         # Modal & navigation system
│   ├── images/            # Portfolio images
│   ├── videos/            # Portfolio videos
│   └── trevor/            # Sample user portfolio assets
│       ├── featured/      # Featured work images
│       └── thumbnails/    # Thumbnail images
│
├── 📁 tools/              # Utility scripts (if any)
└── 📁 videos/             # Shared video assets
```

## 🎨 CSS Architecture

### Color System (CSS Variables)

```css
:root {
  /* Primary Colors */
  --primary: #003bff;      /* Portfolio pages */
  --primary: #00d9ff;      /* Landing page */
  --black: #000000;
  --white: #cfcac3;
  
  /* Typography */
  --myFont: 'Pavelt', sans-serif;
  --mainFont: 'Pavelt', sans-serif;
}
```

### CSS Files Overview

| File | Purpose |
|------|---------|
| `index/css/color.css` | Landing page: typography, hero, preloader, navigation |
| `profile/css/color.css` | Portfolio: base styles, forms, toast notifications |
| `profile/css/nav.css` | Modal system, billing checkout, contact form |
| `profile/css/edit-portfolio-modal.css` | Edit portfolio panel with tabs |
| `profile/css/image-viewer-modal.css` | Fullscreen image lightbox |

## ⚙️ JavaScript Architecture

### External Libraries

- **jQuery 3.7.1** - DOM manipulation
- **Lenis** - Smooth scroll library
- **AOS** - Animate on scroll (CSS only, JS optional)
- **USAL** - Text shimmer animations (CDN loaded)

### JS Files Overview

| File | Purpose |
|------|---------|
| `index/js/script.js` | Preloader, smooth scroll, video handling |
| `profile/js/script.js` | Gallery, settings, toast notifications |
| `profile/js/nav.js` | Modal open/close system, nested modals |

## 🔧 Key Features

### 1. Preloader Animation
- Shows "Loading..." with shimmer effect
- Transitions to "Welcome" 
- Slides up to reveal content

### 2. Smooth Scrolling (Lenis)
- Configurable lerp and duration
- Pauses when tab is hidden
- Works with modal system

### 3. Modal System
- Supports nested modals (child modals)
- Automatic body scroll lock
- Lenis integration

### 4. Toast Notifications
- 4 types: success, error, info, warning
- Auto-dismiss after 4 seconds
- Animated slide-in/out

### 5. Portfolio Gallery
- Lazy loading with IntersectionObserver
- Lightbox image viewer
- Featured vs regular works

### 6. PRO Features
- Extended social links
- Additional customization
- Upgrade checkout flow

## 🚀 Getting Started

1. Open `index.html` in a browser to view the landing page
2. Navigate to `login.html` or `signup.html` for authentication
3. `portfolio.html` shows the main dashboard (simulated login)

## 📱 Responsive Design

- Desktop-first approach
- Breakpoints at 1024px and 480px
- Mobile-optimized navigation
- Touch-friendly interactions

## 🎯 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📝 Development Notes

### Adding New Sections
1. Add HTML structure in the appropriate file
2. Create CSS in the relevant stylesheet
3. Add JavaScript functionality if needed

### Creating New Modals
```html
<!-- Modal trigger button -->
<button data-open-modal="my-modal">Open Modal</button>

<!-- Modal structure -->
<div class="modal" data-modal-id="my-modal">
  <div class="modal-panel">
    <button data-close>×</button>
    <!-- Modal content -->
  </div>
</div>
```

### Toast Notifications
```javascript
showToast('success', 'Title', 'Optional message');
showToast('error', 'Error', 'Something went wrong');
showToast('info', 'Info', 'FYI...');
showToast('warning', 'Warning', 'Be careful!');
```

## 📄 License

Copyright © 2025 Perminov Studios. All rights reserved.
