/* ============================================================================
   PERMINOV STUDIOS - PORTFOLIO PAGE JAVASCRIPT
   ============================================================================
   
   Version: 3.0
   Last Updated: February 2026
   
   This file handles:
   - Lenis smooth scrolling
   - Security measures (devtools detection - disabled)
   - Portfolio image data management
   - Gallery with lazy loading
   - Toast notification system
   - Settings panel functionality
   - Social links management
   - Edit portfolio modal functionality
   
   ============================================================================ */

/* ============================================================================
   TABLE OF CONTENTS
   
   1. Lenis Smooth Scrolling Setup
   2. Security Measures (DevTools Detection)
   3. Portfolio Image Data Helpers
   4. Toast Notification System
   5. Gallery System (Lazy Loading, Lightbox)
   6. Settings System
   7. Social Links Management
   8. Edit Portfolio Modal
   
   ============================================================================ */


/* ============================================================================
   1. LENIS SMOOTH SCROLLING SETUP
   ============================================================================ */

const lenis = new Lenis({
  lerp: 0.05,              // Interpolation factor (lower = smoother)
  duration: 1.5,           // Animation duration
  easing: (t) => 1 - Math.pow(2, -10 * t),  // Ease-out exponential
  wheelMultiplier: 0.8,    // Scroll wheel sensitivity
  smoothTouch: false,      // Disable on touch for better mobile UX
  touchMultiplier: 1.5,    // Touch scroll sensitivity
});

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);


/* ============================================================================
   2. SECURITY MEASURES
   Prevents right-click context menu and common DevTools shortcuts
   Note: DevTools size detection is disabled as it can cause issues
   ============================================================================ */

// Disable right-click context menu
document.addEventListener("contextmenu", (e) => e.preventDefault());

// Block common DevTools shortcuts
document.addEventListener("keydown", (e) => {
  if (
    e.key === "F12" ||
    (e.ctrlKey && e.shiftKey && ["I", "C", "J"].includes(e.key)) ||
    (e.ctrlKey && e.key === "U")
  ) {
    e.preventDefault();
  }
});

// DevTools detection (disabled - can cause false positives)
const devtools = { open: false };

/*
// DevTools detection via window size (DISABLED)
// This can cause false positives with certain browser setups
setInterval(() => {
  const widthThreshold = window.outerWidth - window.innerWidth > 160;
  const heightThreshold = window.outerHeight - window.innerHeight > 160;

  if (widthThreshold || heightThreshold) {
    if (!devtools.open) {
      devtools.open = true;
      document.body.innerHTML = "<h1>DevTools detected</h1>";
    }
  } else {
    devtools.open = false;
  }
}, 500);
*/


/* ============================================================================
   3. PORTFOLIO IMAGE DATA HELPERS
   Manages portfolio images with localStorage persistence
   ============================================================================ */

/**
 * Default portfolio images used when no saved data exists
 * Images are loaded from Pexels with optimized URLs
 */
const DEFAULT_PORTFOLIO_IMAGES = [
  {
    id: 1,
    url: "https://images.pexels.com/photos/539447/pexels-photo-539447.jpeg?auto=compress&cs=tinysrgb&w=800",
    title: "Colorful jelly beans close-up",
    desc: "Colorful jelly beans close-up",
    featured: true,
  },
  {
    id: 2,
    url: "https://images.pexels.com/photos/31698016/pexels-photo-31698016.jpeg?auto=compress&cs=tinysrgb&w=800",
    title: "Thai street food market scene",
    desc: "Thai street food market scene",
    featured: true,
  },
  {
    id: 3,
    url: "https://images.pexels.com/photos/8058800/pexels-photo-8058800.jpeg?auto=compress&cs=tinysrgb&w=800",
    title: "Blank tags on a bold red surface",
    desc: "Blank tags on a bold red surface",
    featured: true,
  },
  {
    id: 4,
    url: "https://images.pexels.com/photos/19392659/pexels-photo-19392659.jpeg?auto=compress&cs=tinysrgb&w=800",
    title: "Traditional Dutch wooden clogs",
    desc: "Traditional Dutch wooden clogs",
    featured: true,
  },
  {
    id: 5,
    url: "https://images.pexels.com/photos/2508565/pexels-photo-2508565.jpeg?auto=compress&cs=tinysrgb&w=800",
    title: "Scattered playing cards",
    desc: "Scattered playing cards",
    featured: true,
  },
  {
    id: 6,
    url: "https://images.pexels.com/photos/5550130/pexels-photo-5550130.jpeg?auto=compress&cs=tinysrgb&w=800",
    title: "Close-up of a lottery ticket",
    desc: "Close-up of a lottery ticket",
    featured: true,
  },
  {
    id: 7,
    url: "https://images.pexels.com/photos/11402499/pexels-photo-11402499.jpeg?auto=compress&cs=tinysrgb&w=800",
    title: "Colorful market clothing display",
    desc: "Colorful market clothing display",
    featured: true,
  },
  {
    id: 8,
    url: "https://images.pexels.com/photos/35315712/pexels-photo-35315712.jpeg?auto=compress&cs=tinysrgb&w=800",
    title: "Royal Mile",
    desc: "Historic street",
    featured: false,
  },
  {
    id: 9,
    url: "https://images.pexels.com/photos/34613730/pexels-photo-34613730.jpeg?auto=compress&cs=tinysrgb&w=800",
    title: "Stain Glass Sky",
    desc: "Beautiful architecture",
    featured: false,
  },
  {
    id: 10,
    url: "https://images.pexels.com/photos/34759438/pexels-photo-34759438.jpeg?auto=compress&cs=tinysrgb&w=800",
    title: "Overlooking the Castle",
    desc: "Castle view",
    featured: false,
  },
  {
    id: 11,
    url: "https://images.pexels.com/photos/27698206/pexels-photo-27698206.jpeg?auto=compress&cs=tinysrgb&w=800",
    title: "Cloud in Color",
    desc: "Colorful clouds",
    featured: false,
  },
  {
    id: 12,
    url: "https://images.pexels.com/photos/10948946/pexels-photo-10948946.jpeg?auto=compress&cs=tinysrgb&w=800",
    title: "Space Needle View",
    desc: "Seattle landmark",
    featured: false,
  },
];

/**
 * Load portfolio images from localStorage
 * Falls back to default images if no saved data
 * @returns {Array} Array of image objects
 */
function loadPortfolioImages() {
  try {
    const raw = localStorage.getItem("portfolioImages");
    if (!raw) return [...DEFAULT_PORTFOLIO_IMAGES];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [...DEFAULT_PORTFOLIO_IMAGES];
    return parsed.map((img, index) => ({
      id: typeof img.id === "number" ? img.id : index + 1,
      url: img.url,
      title: img.title,
      desc: img.desc || "",
      featured: !!img.featured,
    }));
  } catch (e) {
    return [...DEFAULT_PORTFOLIO_IMAGES];
  }
}

/**
 * Save portfolio images to localStorage
 * @param {Array} images - Array of image objects to save
 */
function savePortfolioImages(images) {
  try {
    localStorage.setItem("portfolioImages", JSON.stringify(images));
  } catch (e) {
    console.warn('Could not save portfolio images:', e);
  }
}

/**
 * Check if user has PRO status
 * PRO users have access to additional features
 * @returns {boolean} True if user is PRO
 */
function isProUser() {
  return $('body').hasClass('pro') || $('body').hasClass('ProUser');
}

/* Image Gallery with Lightbox and Lazy Loading + Client-side Optimization */
/* Uses shared portfolioImages data */
$(document).ready(function () {
  /* ============================================================================
     TOAST NOTIFICATION SYSTEM
     ============================================================================ */
  
  function showToast(type, title, message) {
    // Ensure toast container exists and is attached to document.body so it can't be hidden inside modals
    try {
      let $tc = $('#toastContainer');
      if (!$tc.length) {
        $tc = $('<div id="toastContainer" class="toast-container"></div>');
        $(document.body).append($tc);
      } else if (!$tc.parent().is(document.body)) {
        $(document.body).append($tc);
      }
      $tc.css({ position: 'fixed', top: '24px', right: '24px', left: 'auto', zIndex: 2147483647, pointerEvents: 'none' });

      // Observe DOM changes and re-parent the container if it gets moved inside a modal
      try {
        if (!window.__toastContainerObserver) {
          const obs = new MutationObserver(() => {
            const $c = $('#toastContainer');
            if ($c.length && !$c.parent().is(document.body)) {
              $(document.body).append($c);
            }
          });
          obs.observe(document.documentElement || document.body, { childList: true, subtree: true });
          window.__toastContainerObserver = obs;
        }
      } catch (e) {}
    } catch (e) {}

    const icons = {
      success: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" /></svg>',
      error: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clip-rule="evenodd" /></svg>',
      info: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clip-rule="evenodd" /></svg>',
      warning: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clip-rule="evenodd" /></svg>'
    };
    
    const toast = $(`
      <div class="toast ${type}">
        <div class="toast-icon">
          ${icons[type]}
        </div>
        <div class="toast-content">
          <p class="toast-title">${title}</p>
          ${message ? `<p class="toast-message">${message}</p>` : ''}
        </div>
        <button class="toast-close">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path fill-rule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clip-rule="evenodd" />
          </svg>
        </button>
        <div class="toast-progress"></div>
      </div>
    `);
    
    const $container = $('#toastContainer');
    if ($container.length) {
      $container.append(toast);
      toast.css('pointer-events', 'auto');
    } else {
      $(document.body).append(toast);
      toast.css({ position: 'fixed', top: '24px', right: '24px', zIndex: 2147483647, pointerEvents: 'auto' });
    }
    
    // Remove toast after animation
    const removeToast = () => {
      toast.addClass('hiding');
      setTimeout(() => toast.remove(), 300);
    };
    
    // Auto remove after 4 seconds
    const autoRemoveTimer = setTimeout(removeToast, 4000);
    
    // Close button
    toast.find('.toast-close').on('click', function() {
      clearTimeout(autoRemoveTimer);
      removeToast();
    });
  }

  // Tab Switching Functionality for main gallery tabs only
  $(".tab-btn[data-tab]").on("click", function() {
    const tabName = $(this).data("tab");
    if (!tabName) return;

    const $nav = $(this).closest(".tab-navigation");
    $nav.find(".tab-btn[data-tab]").removeClass("active");
    $(this).addClass("active");

    $(".tab-content").removeClass("active");
    $(`#${tabName}-content`).addClass("active");

    if (tabName === "myworks" && $("#myWorksGrid .grid-item").length === 0) {
      loadMyWorksGallery();
    }
  });

  // All Gallery Images (Featured + My Works) - Using Pexels optimized URLs
  let images = loadPortfolioImages();

  const $grid = $("#imageGrid");
  $grid.empty();
  // Filter for featured images only
  const featuredImages = images.filter(img => img.featured === true);
  
  // Lightweight SVG placeholder
  const placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="10" height="10"%3E%3Crect width="10" height="10" fill="%230a0a0a"/%3E%3C/svg%3E';
  
  featuredImages.forEach((img, index) => {
    const $item = $(
      `<div class="grid-item loading" data-index="${index}">
        <img src="${placeholder}" data-src="${img.url}" alt="${img.title}" loading="lazy" decoding="async">
        <div class="overlay">
          <h3>${img.title}</h3>
        </div>
      </div>`
    );
    $grid.append($item);
  });

    // Function to load My Works Gallery
    function loadMyWorksGallery() {
      // Filter for non-featured images only
      const myWorksImages = images.filter(img => img.featured === false);

      const $myWorksGrid = $("#myWorksGrid");
      $myWorksGrid.empty();
      
      const placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="10" height="10"%3E%3Crect width="10" height="10" fill="%230a0a0a"/%3E%3C/svg%3E';
      
      myWorksImages.forEach((img, index) => {
        const $item = $(
          `<div class="grid-item loading" data-index="${index}">
            <img src="${placeholder}" data-src="${img.url}" alt="${img.title}" loading="lazy" decoding="async">
            <div class="overlay">
              <h3>${img.title}</h3>
            </div>
          </div>`
        );
        $myWorksGrid.append($item);
      });

      // Setup lazy loading for My Works images
      setupLazyObserverForGrid('#myWorksGrid');
    }

    // Simplified lazy loading setup for reusable grids
    function setupLazyObserverForGrid(gridSelector) {
      const images = document.querySelectorAll(`${gridSelector} img[data-src]`);
      if (!images || images.length === 0) return;

      const onIntersect = (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const img = entry.target;
          const src = img.getAttribute('data-src');
          if (!src) {
            obs.unobserve(img);
            return;
          }
          
          img.src = src;
          img.onload = () => {
            requestAnimationFrame(() => {
              img.classList.add('loaded');
              img.closest('.grid-item').classList.remove('loading');
            });
          };
          img.onerror = () => {
            img.closest('.grid-item').classList.remove('loading');
          };
          img.removeAttribute('data-src');
          obs.unobserve(img);
        });
      };

      const io = new IntersectionObserver(onIntersect, {
        root: null,
        rootMargin: '100px',
        threshold: 0.01,
      });

      images.forEach((i) => io.observe(i));
    }

    // Simplified lazy loader without heavy canvas operations
    (function setupLazyObserver() {
      const images = document.querySelectorAll('#imageGrid img[data-src]');
      if (!images || images.length === 0) return;

      const onIntersect = (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const img = entry.target;
          const src = img.getAttribute('data-src');
          if (!src) {
            obs.unobserve(img);
            return;
          }
          
          // Direct image loading without optimization
          img.src = src;
          img.onload = () => {
            requestAnimationFrame(() => {
              img.classList.add('loaded');
              img.closest('.grid-item').classList.remove('loading');
            });
          };
          img.onerror = () => {
            img.closest('.grid-item').classList.remove('loading');
          };
          img.removeAttribute('data-src');
          obs.unobserve(img);
        });
      };

      const io = new IntersectionObserver(onIntersect, {
        root: null,
        rootMargin: '100px',
        threshold: 0.01,
      });

      images.forEach((i) => io.observe(i));

      // Also observe elements that use background images via data-bg
      const bgEls = document.querySelectorAll('.lazy-bg[data-bg]');
      if (bgEls && bgEls.length) {
        const bgIo = new IntersectionObserver((entries, obs2) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            const src = el.dataset.bg;
            if (!src) { obs2.unobserve(el); return; }
            (async () => {
              try {
                const { blobUrl } = await optimizeImage(src);
                el.style.backgroundImage = `url(${blobUrl})`;
                el.removeAttribute('data-bg');
                obs2.unobserve(el);
                // revoke after some time to ensure paint (keep for 30s)
                setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
              } catch (e) {
                el.style.backgroundImage = `url(${src})`;
                el.removeAttribute('data-bg');
                obs2.unobserve(el);
              }
            })();
          });
        }, { root: null, rootMargin: '300px', threshold: 0.01 });
        bgEls.forEach(e => bgIo.observe(e));
      }
    })();

  

  /* ============================================================================
     SETTINGS SYSTEM - VERTICAL TAB NAVIGATION
     ============================================================================ */

  // Enable smooth scrolling for settings content and sidebar - just prevent propagation
  // Use passive wheel listeners to avoid non-passive warnings and improve responsiveness
  document.querySelectorAll('.settings-content, .settings-sidebar').forEach(function(el) {
    el.addEventListener('wheel', function(e) { e.stopPropagation(); }, { passive: true });
  });

  // Settings tab switching
  $(document).on('click', '.settings-tab-btn[data-settings-tab]', function() {
    const tabName = $(this).data('settings-tab');
    
    // Update active tab button
    $('.settings-tab-btn').removeClass('active');
    $(this).addClass('active');
    
    // Update active content panel
    $('.settings-panel').removeClass('active');
    $(`#${tabName}-settings`).addClass('active');
  });

  // Theme selection
  $(document).on('click', '.theme-option', function() {
    $('.theme-option').removeClass('active');
    $(this).addClass('active');
    const themeName = $(this).find('span').text();
    showToast('info', 'Theme Changed', `Switched to ${themeName} theme.`);
  });

  // Color selection
  $(document).on('click', '.color-option', function() {
    $('.color-option').removeClass('active');
    $(this).addClass('active');
    showToast('info', 'Color Updated', 'Accent color has been changed.');
  });

  // Toggle switches with notifications
  $(document).on('change', '.toggle-switch input[type="checkbox"]', function() {
    const $toggleItem = $(this).closest('.settings-toggle-item');
    const label = $toggleItem.find('.settings-label').text();
    const isChecked = $(this).is(':checked');
    const status = isChecked ? 'enabled' : 'disabled';
    
    showToast('info', `${label} ${status.charAt(0).toUpperCase() + status.slice(1)}`, 
              `${label} has been ${status}.`);
  });

  // Avatar and Background handlers removed (no profile media inputs in markup)

  /* ============================================================================
     PROFILE SETTINGS - LOCATION & RESUME TOGGLES
     ============================================================================ */

  function applyShowLocationSetting(isVisible) {
    const el = document.getElementById('Location');
    if (!el) return;
    el.style.display = isVisible ? '' : 'none';
  }

  function applyResumeVisibilitySetting(isVisible) {
    const el = document.getElementById('downloadResumeItem');
    if (!el) return;
    el.style.display = isVisible ? '' : 'none';
  }

  // Load persisted toggles
  try {
    const showLocationRaw = localStorage.getItem('profile_showLocation');
    if (showLocationRaw !== null) {
      const showLocation = showLocationRaw === 'true';
      $('#showLocationToggle').prop('checked', showLocation);
      applyShowLocationSetting(showLocation);
    }

    const resumeVisibleRaw = localStorage.getItem('profile_resumeVisible');
    if (resumeVisibleRaw !== null) {
      const resumeVisible = resumeVisibleRaw === 'true';
      $('#resumeVisibleToggle').prop('checked', resumeVisible);
      applyResumeVisibilitySetting(resumeVisible);
    }
  } catch (e) {}

  $('#showLocationToggle').on('change', function() {
    const isChecked = $(this).is(':checked');
    applyShowLocationSetting(isChecked);
    try { localStorage.setItem('profile_showLocation', String(isChecked)); } catch (e) {}
  });

  $('#resumeVisibleToggle').on('change', function() {
    const isChecked = $(this).is(':checked');
    applyResumeVisibilitySetting(isChecked);
    try { localStorage.setItem('profile_resumeVisible', String(isChecked)); } catch (e) {}
  });

  // Resume upload filename display
  $('#resumeInput').on('change', function(e) {
    const file = e.target.files[0];
    if (!file) {
      $('#resumeFileName').text('No file selected');
      return;
    }

    const allowedExt = ['pdf', 'doc', 'docx'];
    const name = file.name || '';
    const ext = name.split('.').pop().toLowerCase();
    if (!allowedExt.includes(ext)) {
      showToast('error', 'Invalid File Type', 'Please upload a PDF, DOC, or DOCX file.');
      $(this).val('');
      $('#resumeFileName').text('No file selected');
      return;
    }

    // Simple size guard (no server upload in this template)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      showToast('error', 'File Too Large', 'Resume file must be less than 5MB.');
      $(this).val('');
      $('#resumeFileName').text('No file selected');
      return;
    }

    $('#resumeFileName').text(file.name);
    showToast('success', 'Resume Selected', 'Your resume file is ready to be saved.');
  });

  /* ============================================================================
     SOCIAL LINKS MANAGEMENT
     ============================================================================ */

  // Check if user is Pro (check if body has 'pro' class)
  const isPro = $('body').hasClass('pro');

  // Initialize PRO social links inputs based on PRO status
  function initializeProSocialLinks() {
    const $proLinksCard = $('#proSocialLinksCard');
    const $proInputs = $proLinksCard.find('.pro-link');
    const $proOverlay = $('#socialLinksProOverlay');

    if (isPro) {
      // Enable PRO inputs for PRO users
      $proInputs.prop('disabled', false);
      $proOverlay.hide();
      $proLinksCard.find('.settings-card-body').css({
        'opacity': '1',
        'pointer-events': 'auto',
        'filter': 'none'
      });
    } else {
      // Keep inputs disabled for non-PRO users
      $proInputs.prop('disabled', true);
      $proOverlay.show();
    }
  }

  // Initialize on page load
  initializeProSocialLinks();

  // PRO overlay button click - redirect to upgrade page
  $('#socialLinksProOverlay').on('click', '.pro-overlay-btn', function(e) {
    e.preventDefault();
    showToast('info', 'Upgrade to PRO', 'Redirecting to upgrade page...');
    // Replace with actual upgrade page URL
    // window.location.href = '/upgrade';
  });

  // Save social links to localStorage
  function saveSocialLinks() {
    const links = [];
    
    // Get basic links (1-3)
    $('.settings-card:not(.settings-pro-locked) .social-link-input').each(function() {
      links.push($(this).val().trim());
    });
    
    // Get PRO links (4-10) if PRO user
    if (isPro) {
      $('#proSocialLinksCard .pro-link').each(function() {
        links.push($(this).val().trim());
      });
    }
    
    try {
      localStorage.setItem('profile_socialLinks', JSON.stringify(links));
    } catch (e) {}
    
    return links;
  }

  // Load social links from localStorage
  function loadSocialLinks() {
    try {
      const raw = localStorage.getItem('profile_socialLinks');
      if (!raw) return;
      
      const links = JSON.parse(raw);
      if (!Array.isArray(links)) return;
      
      // Set basic links (1-3)
      const basicInputs = $('.settings-card:not(.settings-pro-locked) .social-link-input');
      basicInputs.each(function(index) {
        if (links[index]) {
          $(this).val(links[index]);
        }
      });
      
      // Set PRO links (4-10) if PRO user
      if (isPro) {
        const proInputs = $('#proSocialLinksCard .pro-link');
        proInputs.each(function(index) {
          const linkIndex = index + 3; // Start from index 3
          if (links[linkIndex]) {
            $(this).val(links[linkIndex]);
          }
        });
      }
    } catch (e) {}
  }

  // Load saved social links on page load
  loadSocialLinks();

  // Settings save buttons
  $(document).on('click', '.settings-btn-primary', function() {
    const $panel = $(this).closest('.settings-panel');
    const panelId = $panel.attr('id');
    
    // Simulate saving with random success/error for demo
    const saveSuccess = Math.random() > 0.1; // 90% success rate
    
    if (saveSuccess) {
      // Success scenarios based on panel type
      if (panelId === 'profile-settings') {
        showToast('success', 'Profile Updated', 'Your profile information has been saved successfully.');
      } else if (panelId === 'account-settings') {
        showToast('success', 'Account Updated', 'Your account settings have been saved.');
      } else if (panelId === 'appearance-settings') {
        showToast('success', 'Appearance Saved', 'Your appearance preferences have been applied.');
      } else if (panelId === 'privacy-settings') {
        showToast('success', 'Privacy Updated', 'Your privacy settings have been saved.');
      } else if (panelId === 'notifications-settings') {
        showToast('success', 'Preferences Saved', 'Your notification preferences have been updated.');
      } else if (panelId === 'advanced-settings') {
        showToast('success', 'Advanced Settings Saved', 'Your advanced configurations have been applied.');
      } else {
        showToast('success', 'Settings Saved', 'Your changes have been saved successfully.');
      }
    } else {
      // Error scenarios
      const errors = [
        'Failed to connect to server. Please check your internet connection.',
        'Session expired. Please refresh the page and try again.',
        'Invalid data format. Please check your input and try again.',
        'Server error occurred. Please try again later.',
        'Permission denied. You may not have access to modify these settings.'
      ];
      const randomError = errors[Math.floor(Math.random() * errors.length)];
      showToast('error', 'Save Failed', randomError);
    }
  });

  // Settings cancel/reset buttons
  $(document).on('click', '.settings-btn-secondary', function() {
    const buttonText = $(this).text().toLowerCase();
    if (buttonText === 'reset') {
      if (confirm('Reset all appearance settings to default?')) {
        showToast('info', 'Settings Reset', 'All appearance settings have been restored to default.');
      }
    } else if (buttonText === 'cancel') {
      showToast('info', 'Changes Discarded', 'Your unsaved changes have been discarded.');
    } else if (buttonText === 'regenerate') {
      showToast('success', 'API Key Regenerated', 'Your new API key has been generated successfully.');
    }
  });

  /* ============================================================================
     EDIT PORTFOLIO MODAL - Tab Navigation & Image Management
     ============================================================================ */

  // Create a compressed preview DataURL for modal display (keeps full-src separate)
  function createCompressedPreview(src, maxWidth = 1200, quality = 0.75, cb) {
    cb = typeof cb === 'function' ? cb : function() {};
    if (!src) return cb(null);

    try {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = function() {
        try {
          const ratio = Math.min(1, maxWidth / img.width);
          const w = Math.round(img.width * ratio);
          const h = Math.round(img.height * ratio);
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          // try jpeg first
          let dataUrl = null;
          try {
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          } catch (e) {
            try { dataUrl = canvas.toDataURL(); } catch (err) { dataUrl = null; }
          }
          cb(dataUrl);
        } catch (err) {
          cb(null);
        }
      };
      img.onerror = function() { cb(null); };
      // kick off load
      img.src = src;
      // if already cached and complete, trigger onload manually
      if (img.complete) {
        img.onload();
      }
    } catch (e) {
      cb(null);
    }
  }

  // Track current editing item
  let currentEditingItem = null;

  // Check if user is PRO (you can modify this based on your actual PRO check logic)
  const isProUser = typeof isPro !== 'undefined' ? isPro : false;

  // Reset Edit Portfolio modal to Featured tab when opening
  // Shared reset logic to ensure Featured tab is active and PRO tab locked appropriately
  function resetEditPortfolioToFeatured() {
    $('.ep-tab').removeClass('active');
    $('.ep-tab[data-ep-tab="featured"]').addClass('active');
    $('.ep-section').removeClass('active');
    $('.ep-section[data-ep-section="featured"]').addClass('active');

    // Lock/unlock PRO tab based on user status
    if (!isProUser) {
      $('.ep-tab-pro').addClass('locked');
    } else {
      $('.ep-tab-pro').removeClass('locked');
    }
    // Update category tab appearance in case PRO status affects it
    updateCategoryTabForPro();
  }

  // If user is PRO, remove the PRO marker and border from the '+ Category' tab
  function updateCategoryTabForPro() {
    const $catBtn = $('#epAddCategoryTabBtn');
    if (!$catBtn.length) return;
    if (isProUser) {
      $catBtn.removeClass('ep-tab-pro settings-pro-border');
      $catBtn.find('.settings-pro-badge').remove();
    }
  }

  // Ensure category tab is updated on reset and initial load
  updateCategoryTabForPro();

  // Trigger reset when open button is clicked (covers the common case)
  $(document).on('click', '[data-open-modal="edit-portfolio"]', function() {
    resetEditPortfolioToFeatured();
  });

  // Ensure toast container stays on top when any modal becomes active
  // Only trigger on actual modal open buttons, not clicks inside modals
  $(document).on('click', '[data-open-modal]', function() {
    try {
      const $tc = $('#toastContainer');
      if ($tc.length && !$tc.parent().is(document.body)) {
        $tc.css({ position: 'fixed', top: '24px', right: '24px', left: 'auto', zIndex: 2147483647, pointerEvents: 'none', transform: 'translateZ(0)' });
        $tc.appendTo(document.body);
      }
    } catch (e) {}
  });

  // Also observe the modal element for class changes so programmatic opens still reset tabs
  try {
    const $editModal = $("[data-modal-id='edit-portfolio']");
    if ($editModal.length) {
      const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(m) {
          if (m.attributeName === 'class') {
            const cls = $editModal.attr('class') || '';
            if (cls.includes('active') || cls.includes('is-open')) {
              resetEditPortfolioToFeatured();
            }
          }
        });
      });
      observer.observe($editModal[0], { attributes: true, attributeFilter: ['class'] });
    }
  } catch (e) {
    // If MutationObserver isn't available, fallback is the click handler above
  }

  // Edit Portfolio tab switching
  $(document).on('click', '.ep-tab[data-ep-tab]', function() {
    const tabName = $(this).data('ep-tab');
    const isPROTab = $(this).hasClass('ep-tab-pro');
    
    // Check PRO access for categories tab
    if (isPROTab && !isProUser) {
      showToast('warning', 'PRO Feature', 'Upgrade to PRO to unlock custom categories.');
      return;
    }
    
    // Update active tab
    $('.ep-tab').removeClass('active');
    $(this).addClass('active');
    
    // Update active section
    $('.ep-section').removeClass('active');
    $(`.ep-section[data-ep-section="${tabName}"]`).addClass('active');
  });

  // Icon SVG map for Heroicons (used in icon picker)
  const heroIconSVGs = {
    'photo': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>',
    'camera': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" /></svg>',
    'film': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m-1.5 0A1.125 1.125 0 0118 7.125v-1.5m1.125 2.625c-.621 0-1.125.504-1.125 1.125v1.5m2.625-2.625c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M18 5.625v5.25M7.125 12h9.75m-9.75 0A1.125 1.125 0 016 10.875M7.125 12C6.504 12 6 12.504 6 13.125m0-2.25C6 11.496 5.496 12 4.875 12M18 10.875c0 .621-.504 1.125-1.125 1.125M18 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m-12 5.25v-5.25m0 5.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125m-12 0v-1.5c0-.621-.504-1.125-1.125-1.125M18 18.375v-5.25m0 5.25v-1.5c0-.621.504-1.125 1.125-1.125M18 13.125v1.5c0 .621.504 1.125 1.125 1.125M18 13.125c0-.621.504-1.125 1.125-1.125M6 13.125v1.5c0 .621-.504 1.125-1.125 1.125M6 13.125C6 12.504 5.496 12 4.875 12m-1.5 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M19.125 12h1.5m0 0c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h1.5m14.25 0h1.5" /></svg>',
    'paint-brush': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" /></svg>',
    'sparkles': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg>',
    'sun': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>',
    'moon': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>',
    'globe': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>',
    'mountain': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 17.25l6-6 4.5 4.5 1.5-1.5 6 6M3 17.25h18M9 6.75l3-3 3 3" /></svg>',
    'fire': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" /><path stroke-linecap="round" stroke-linejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1.001A3.75 3.75 0 0012 18z" /></svg>',
    'user': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>',
    'users': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>',
    'heart': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>',
    'star': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>',
    'face-smile': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" /></svg>',
    'cube': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" /></svg>',
    'code': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg>',
    'building': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" /></svg>',
    'home': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>',
    'gift': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>',
    'musical-note': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" /></svg>',
    'puzzle': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.96.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z" /></svg>',
    'bolt': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>',
    'rocket': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /></svg>',
    'trophy': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0116.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.023 6.023 0 01-2.77.85m0 0c-.972 0-1.913-.134-2.77-.85" /></svg>'
  };

  // Track selected icon for the modal
  let selectedIcon = 'photo';

  // Listen for modal reset event from nav.js
  $(document).on('resetEditPortfolioModals', function() {
    selectedIcon = 'photo';
    updateIconPickerSelection();
  });

  // Helper to reset the category modal to create mode
  function resetCategoryModal() {
    $('#epCategoryModalTitle').text('Create Category');
    $('#epCategoryModalActionText').text('Create');
    $('#epNewCategoryName').val('');
    $('#epEditingCategoryId').val('');
    $('#epDeleteCategoryBtn').hide();
    selectedIcon = 'photo';
    updateIconPickerSelection();
  }

  // Helper to open modal in edit mode
  function openCategoryEditModal($item) {
    const catId = $item.data('category-id');
    const catName = $item.find('.ep-category-name').val() || '';
    const catIcon = $item.data('category-icon') || 'photo';

    $('#epCategoryModalTitle').text('Edit Category');
    $('#epCategoryModalActionText').text('Save');
    $('#epNewCategoryName').val(catName);
    $('#epEditingCategoryId').val(catId);
    $('#epDeleteCategoryBtn').show();
    selectedIcon = catIcon;
    updateIconPickerSelection();

    $('#epAddCategoryModal').addClass('active');
    $('.ep-content').css('overflow', 'hidden');
  }

  // Update icon picker grid selection and preview
  function updateIconPickerSelection() {
    $('.ep-icon-option').removeClass('active');
    $(`.ep-icon-option[data-icon="${selectedIcon}"]`).addClass('active');
    if (heroIconSVGs[selectedIcon]) {
      $('#epSelectedIcon').html(heroIconSVGs[selectedIcon]);
    }
  }

  // Icon picker grid click
  $(document).on('click', '.ep-icon-option', function() {
    selectedIcon = $(this).data('icon');
    updateIconPickerSelection();
  });

  // '+ Category' tab/button: open modal in create mode for PRO users
  $(document).on('click', '#epAddCategoryTabBtn, #epAddCategoryBtn', function() {
    if (!isProUser) {
      showToast('warning', 'PRO Feature', 'Upgrade to PRO to create custom categories.');
      return;
    }
    resetCategoryModal();
    $('#epAddCategoryModal').addClass('active');
    $('.ep-content').css('overflow', 'hidden');
  });

  // Click on section header edit button: open modal for that section
  $(document).on('click', '.ep-section-edit-btn', function() {
    const sectionName = $(this).data('edit-section');
    const $section = $(this).closest('.ep-section');
    const $header = $section.find('.ep-section-header h3');
    
    // Get current title (without the count span)
    const fullText = $header.text();
    const countSpan = $header.find('span').text();
    const currentName = fullText.replace(countSpan, '').trim();
    
    // Try to get icon from data attribute or default
    const currentIcon = $section.data('section-icon') || 'photo';
    
    $('#epCategoryModalTitle').text('Edit Category');
    $('#epCategoryModalActionText').text('Save');
    $('#epNewCategoryName').val(currentName);
    $('#epEditingCategoryId').val('section-' + sectionName);
    $('#epDeleteCategoryBtn').hide(); // Don't allow deleting built-in sections
    selectedIcon = currentIcon;
    updateIconPickerSelection();

    $('#epAddCategoryModal').addClass('active');
    $('.ep-content').css('overflow', 'hidden');
  });

  // Click on category icon button: open modal in edit mode
  $(document).on('click', '.ep-category-icon-btn', function() {
    const $item = $(this).closest('.ep-category-item');
    openCategoryEditModal($item);
  });

  // Click on category edit button: open modal in edit mode
  $(document).on('click', '.ep-category-edit-btn', function() {
    const $item = $(this).closest('.ep-category-item');
    openCategoryEditModal($item);
  });

  $(document).on('click', '#epAddCategoryModalClose, #epAddCategoryCancelBtn', function() {
    $('#epAddCategoryModal').removeClass('active');
    $('.ep-content').css('overflow', '');
  });

  $(document).on('click', '#epAddCategoryModal', function(e) {
    if (e.target === this) {
      $('#epAddCategoryModal').removeClass('active');
      $('.ep-content').css('overflow', '');
    }
  });

  $(document).on('click', '#epCreateCategoryBtn', function() {
    const name = ($('#epNewCategoryName').val() || '').trim();
    if (!name) {
      showToast('error', 'Name Required', 'Please enter a category name.');
      $('#epNewCategoryName').focus();
      return;
    }

    const editingId = $('#epEditingCategoryId').val();
    const iconSVG = heroIconSVGs[selectedIcon] || heroIconSVGs['photo'];

    if (editingId && editingId.startsWith('section-')) {
      // Edit section header (My Works, etc.)
      const sectionName = editingId.replace('section-', '');
      const $section = $(`.ep-section[data-ep-section="${sectionName}"]`);
      const $header = $section.find('.ep-section-header h3');
      const $countSpan = $header.find('span');
      const countText = $countSpan.length ? $countSpan.text() : '';
      
      // Update section title
      $header.html(`${name} <span id="ep${sectionName.charAt(0).toUpperCase() + sectionName.slice(1)}Count">${countText}</span>`);
      $section.data('section-icon', selectedIcon);
      $section.attr('data-section-icon', selectedIcon);
      
      // Also update the corresponding tab text
      const $tab = $(`.ep-tab[data-ep-tab="${sectionName}"]`);
      if ($tab.length) {
        const $svg = $tab.find('svg').first();
        $tab.html('').append($svg).append(' ' + name);
      }
      
      $('#epAddCategoryModal').removeClass('active');
      $('.ep-content').css('overflow', '');
      showToast('success', 'Category Updated', `"${name}" has been updated.`);
    } else if (editingId) {
      // Edit existing category item
      const $item = $(`.ep-category-item[data-category-id="${editingId}"]`);
      $item.find('.ep-category-name').val(name);
      $item.data('category-icon', selectedIcon);
      $item.attr('data-category-icon', selectedIcon);
      $item.find('.ep-category-icon-btn').html(iconSVG);
      $('#epAddCategoryModal').removeClass('active');
      $('.ep-content').css('overflow', '');
      showToast('success', 'Category Updated', `"${name}" has been updated.`);
    } else {
      // Create new category
      const newId = Date.now();
      const $item = $(`
        <div class="ep-category-item" data-category-id="${newId}" data-category-icon="${selectedIcon}">
          <div class="ep-category-drag">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
          </div>
          <button class="ep-category-icon-btn" title="Change icon">
            ${iconSVG}
          </button>
          <input type="text" class="ep-category-name" value="${name}" placeholder="New category..." />
          <span class="ep-category-count">0 images</span>
          <button class="ep-category-edit-btn" title="Edit category">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="ep-category-delete" title="Delete category">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      `);
      $('#epCategoriesList').append($item);
      $('#epAddCategoryModal').removeClass('active');
      $('.ep-content').css('overflow', '');
      showToast('success', 'Category Created', `"${name}" has been added.`);
    }
  });

  // Delete category from modal
  $(document).on('click', '#epDeleteCategoryBtn', function() {
    const editingId = $('#epEditingCategoryId').val();
    if (!editingId) return;

    const $item = $(`.ep-category-item[data-category-id="${editingId}"]`);
    const catName = $item.find('.ep-category-name').val() || 'Category';

    if (confirm(`Are you sure you want to delete "${catName}"? This action cannot be undone.`)) {
      $item.fadeOut(300, function() {
        $(this).remove();
      });
      $('#epAddCategoryModal').removeClass('active');
      $('.ep-content').css('overflow', '');
      showToast('success', 'Category Deleted', `"${catName}" has been removed.`);
    }
  });

  // Add Image modal
  let currentAddCategory = 'featured';

  $(document).on('click', '[data-open-add]', function() {
    currentAddCategory = $(this).data('open-add') || 'featured';
    $('#epAddTitle').val('');
    $('#epAddDescription').val('');
    $('#epAddReplaceInput').val('');
    $('#epAddPreviewImg').attr('src', '').removeData('full-src').hide();
    $('#epAddPreviewPlaceholder').show();
    $('#epAddModal').addClass('active');
    $('.ep-content').css('overflow', 'hidden');
  });

  $(document).on('click', '#epAddModalClose, #epAddCancelBtn', function() {
    $('#epAddModal').removeClass('active');
    $('.ep-content').css('overflow', '');
  });

  $(document).on('click', '#epAddModal', function(e) {
    if (e.target === this) {
      $('#epAddModal').removeClass('active');
      $('.ep-content').css('overflow', '');
    }
  });

  $(document).on('click', '#epAddReplaceZone', function() {
    $('#epAddReplaceInput').click();
  });

  $(document).on('change', '#epAddReplaceInput', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('error', 'Invalid File', 'Please select an image file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast('error', 'File Too Large', 'Image must be less than 10MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = function(ev) {
      $('#epAddPreviewImg').attr('src', ev.target.result).show();
      $('#epAddPreviewImg').data('full-src', ev.target.result);
      $('#epAddPreviewPlaceholder').hide();
      showToast('info', 'Image Selected', 'New image ready to be added.');
    };
    reader.readAsDataURL(file);
  });

  $(document).on('click', '#epAddSaveBtn', function() {
    const title = ($('#epAddTitle').val() || '').trim();
    const desc = ($('#epAddDescription').val() || '').trim();
    const src = $('#epAddPreviewImg').data('full-src') || $('#epAddPreviewImg').attr('src');
    if (!src) {
      showToast('error', 'Image Required', 'Please upload an image.');
      return;
    }
    if (!title) {
      showToast('error', 'Title Required', 'Please enter a title for this image.');
      $('#epAddTitle').focus();
      return;
    }

    const grid = currentAddCategory === 'featured' ? $('#epFeaturedGrid') : $('#epMyWorksGrid');
    const newId = Date.now() + Math.random();
    const $newItem = $(
      `<div class="ep-image-item" data-id="${newId}" draggable="true">
        <img src="${src}" alt="${title}" />
        <div class="ep-image-overlay">
          <button class="ep-image-action delete" title="Delete">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
        <div class="ep-drag-handle"></div>
      </div>`
    );

    $newItem.attr('data-title', title);
    $newItem.attr('data-description', desc);
    $newItem.attr('data-category', currentAddCategory);

    grid.append($newItem);
    updateImageCount(currentAddCategory);

    $('#epAddModal').removeClass('active');
    $('.ep-content').css('overflow', '');
    showToast('success', 'Image Added', `Image added to ${currentAddCategory === 'featured' ? 'Featured' : 'My Works'}.`);
  });

  /* ============================================================================
     CATEGORIES MANAGEMENT (PRO)
     ============================================================================ */

  // Available category colors
  const categoryColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
  let colorIndex = 0;

  // Add new category
  $(document).on('click', '#epAddCategoryBtn', function() {
    const newId = Date.now();
    const color = categoryColors[colorIndex % categoryColors.length];
    colorIndex++;
    
    const newCategory = $(`
      <div class="ep-category-item" data-category-id="${newId}">
        <div class="ep-category-drag">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
        </div>
        <div class="ep-category-color" style="background: ${color};"></div>
        <input type="text" class="ep-category-name" value="" placeholder="New category..." />
        <span class="ep-category-count">0 images</span>
        <button class="ep-category-delete" title="Delete category">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    `);
    
    $('#epCategoriesList').append(newCategory);
    newCategory.find('.ep-category-name').focus();
    
    showToast('success', 'Category Created', 'New category has been added.');
  });

  // Delete category
  $(document).on('click', '.ep-category-delete', function() {
    const $item = $(this).closest('.ep-category-item');
    const categoryName = $item.find('.ep-category-name').val() || 'Untitled';
    
    if (confirm(`Are you sure you want to delete "${categoryName}"?`)) {
      $item.fadeOut(200, function() {
        $(this).remove();
        showToast('info', 'Category Deleted', `"${categoryName}" has been removed.`);
      });
    }
  });

  // Category name change notification
  $(document).on('change', '.ep-category-name', function() {
    showToast('success', 'Category Updated', 'Category name has been saved.');
  });

  // Upload modal backdrop handler removed

  /* ============================================================================
     EDIT IMAGE MODAL
     ============================================================================ */

  // Open edit modal when clicking edit button
  $(document).on('click', '.ep-image-action.edit', function(e) {
    e.stopPropagation();
    currentEditingItem = $(this).closest('.ep-image-item');
    
    // Get image data
    const $img = currentEditingItem.find('img');
    const imgSrc = $img.attr('src');
    const imgAlt = $img.attr('alt') || '';
    
    // Get saved data attributes (if previously edited)
    const savedTitle = currentEditingItem.attr('data-title') || imgAlt;
    const savedDescription = currentEditingItem.attr('data-description') || '';
    const savedCategory = currentEditingItem.attr('data-category') || 'photography';
    const savedTags = currentEditingItem.attr('data-tags') || '';
    
    // Populate the edit form with saved or default values
    const $previewImg = $('#epEditPreviewImg');
    // store the full source so we can save the original later
    $previewImg.data('full-src', imgSrc);
    // create a compressed preview for modal display (fallback to original if compression fails)
    createCompressedPreview(imgSrc, 1200, 0.75, function(previewSrc) {
      $previewImg.attr('src', previewSrc || imgSrc);
    });
    $('#epEditTitle').val(savedTitle);
    $('#epEditDescription').val(savedDescription);
    $('#epEditCategory').val(savedCategory);
    $('#epEditTags').val(savedTags);
    
    // Reset file input
    $('#epEditReplaceInput').val('');
    
    // Open the edit modal and prevent parent scroll
    $('#epEditModal').addClass('active');
    $('.ep-content').css('overflow', 'hidden');
    
    // Track original values for unsaved changes detection (keep full original src separate)
    $('#epEditModal').data('originalValues', {
      title: savedTitle,
      description: savedDescription,
      category: savedCategory,
      tags: savedTags,
      imgSrcFull: imgSrc
    });
  });

  // Check for unsaved changes in edit modal
  function hasUnsavedEditChanges() {
    const original = $('#epEditModal').data('originalValues');
    if (!original) return false;

    const currentFullSrc = ($('#epEditPreviewImg').data('full-src') || $('#epEditPreviewImg').attr('src')) || '';
    return (
      $('#epEditTitle').val() !== original.title ||
      $('#epEditDescription').val() !== original.description ||
      $('#epEditCategory').val() !== original.category ||
      $('#epEditTags').val() !== original.tags ||
      currentFullSrc !== (original.imgSrcFull || '')
    );
  }

  // Close edit modal with unsaved changes check
  function closeEditModal(skipCheck = false) {
    if (!skipCheck && hasUnsavedEditChanges()) {
      if (!confirm('You have unsaved changes. Are you sure you want to close?')) {
        return;
      }
      showToast('info', 'Changes Discarded', 'Your unsaved changes have been discarded.');
    }
    
    $('#epEditModal').removeClass('active');
    $('.ep-content').css('overflow', '');
    currentEditingItem = null;
    $('#epEditModal').removeData('originalValues');
  }

  // Close edit modal
  $(document).on('click', '#epEditModalClose, #epEditCancelBtn', function() {
    closeEditModal();
  });

  // Close edit modal when clicking backdrop
  $(document).on('click', '#epEditModal', function(e) {
    if (e.target === this) {
      closeEditModal();
    }
  });

  // Prevent scroll propagation on edit modal content
  $(document).on('wheel', '.ep-edit-modal-content', function(e) {
    e.stopPropagation();
  });

  // Handle image replacement in edit modal
  $(document).on('change', '#epEditReplaceInput', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      showToast('error', 'Invalid File', 'Please select an image file.');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      showToast('error', 'File Too Large', 'Image must be less than 10MB.');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
      // When user selects a new file to replace, show full resolution immediately
      $('#epEditPreviewImg').attr('src', e.target.result);
      $('#epEditPreviewImg').data('full-src', e.target.result);
      showToast('info', 'Image Selected', 'New image ready to be saved.');
    };
    reader.readAsDataURL(file);
  });

  // Handle replace zone click
  $(document).on('click', '#epEditReplaceZone', function() {
    $('#epEditReplaceInput').click();
  });

  // Validate form fields on input change
  $(document).on('input', '#epEditTitle', function() {
    const val = $(this).val().trim();
    if (val.length > 100) {
      $(this).val(val.substring(0, 100));
      showToast('warning', 'Title Too Long', 'Title is limited to 100 characters.');
    }
  });

  $(document).on('input', '#epEditDescription', function() {
    const val = $(this).val();
    if (val.length > 500) {
      $(this).val(val.substring(0, 500));
      showToast('warning', 'Description Too Long', 'Description is limited to 500 characters.');
    }
  });

  $(document).on('input', '#epEditTags', function() {
    const val = $(this).val().trim();
    const tags = val.split(',').map(t => t.trim()).filter(t => t);
    if (tags.length > 10) {
      showToast('warning', 'Too Many Tags', 'Maximum 10 tags allowed.');
    }
  });

  // Save changes from edit modal
  $(document).on('click', '#epEditSaveBtn', function() {
    if (!currentEditingItem) return;
    
    // Get form values
    const newTitle = $('#epEditTitle').val().trim();
    const newDescription = $('#epEditDescription').val().trim();
    const newCategory = $('#epEditCategory').val();
    const newTags = $('#epEditTags').val().trim();
    // prefer full-src when available (to avoid saving compressed preview)
    const newImgSrc = $('#epEditPreviewImg').data('full-src') || $('#epEditPreviewImg').attr('src');
    
    // Validate required fields
    if (!newTitle) {
      showToast('error', 'Title Required', 'Please enter a title for this image.');
      $('#epEditTitle').focus();
      return;
    }
    
    // Update the image item
    currentEditingItem.find('img').attr('src', newImgSrc);
    currentEditingItem.find('img').attr('alt', newTitle);
    
    // Store additional data as data attributes
    currentEditingItem.attr('data-title', newTitle);
    currentEditingItem.attr('data-description', newDescription);
    currentEditingItem.attr('data-category', newCategory);
    currentEditingItem.attr('data-tags', newTags);
    
    // Close modal and restore scroll (skip unsaved check since we're saving)
    $('#epEditModal').removeClass('active');
    $('.ep-content').css('overflow', '');
    $('#epEditModal').removeData('originalValues');
    currentEditingItem = null;
    
    showToast('success', 'Image Updated', 'Your changes have been saved successfully.');
  });

  // Upload modal and queue logic removed

  /* ============================================================================
     DRAG AND DROP - Image Reordering
     ============================================================================ */

  let draggedItem = null;

  // Drag start
  $(document).on('dragstart', '.ep-image-item', function(e) {
    draggedItem = this;
    $(this).addClass('dragging');
    e.originalEvent.dataTransfer.effectAllowed = 'move';
    e.originalEvent.dataTransfer.setData('text/html', this.outerHTML);
  });

  // Drag end
  $(document).on('dragend', '.ep-image-item', function() {
    $(this).removeClass('dragging');
    $('.ep-image-item').removeClass('drag-over');
    draggedItem = null;
  });

  // Drag over
  $(document).on('dragover', '.ep-image-item', function(e) {
    e.preventDefault();
    e.originalEvent.dataTransfer.dropEffect = 'move';
    
    if (this !== draggedItem) {
      $(this).addClass('drag-over');
    }
  });

  // Drag leave
  $(document).on('dragleave', '.ep-image-item', function() {
    $(this).removeClass('drag-over');
  });

  // Drop
  $(document).on('drop', '.ep-image-item', function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    if (this === draggedItem) return;
    
    $(this).removeClass('drag-over');
    
    // Get the grid container
    const $grid = $(this).closest('.ep-image-grid');
    const $items = $grid.children('.ep-image-item');
    
    // Get indices
    const draggedIndex = $items.index(draggedItem);
    const targetIndex = $items.index(this);
    
    // Reorder
    if (draggedIndex < targetIndex) {
      $(draggedItem).insertAfter(this);
    } else {
      $(draggedItem).insertBefore(this);
    }
    
    // Update category count (in case we need it)
    const category = $grid.data('category');
    if (category) {
      updateImageCount(category);
    }
    
    showToast('info', 'Image Reordered', 'Portfolio order has been updated.');
  });

  // Track the item pending deletion
  let pendingDeleteItem = null;

  // Reset pendingDeleteItem when modal resets
  $(document).on('resetEditPortfolioModals', function() {
    pendingDeleteItem = null;
  });

  // Delete image from grid - show confirmation modal
  $(document).on('click', '.ep-image-action.delete', function(e) {
    e.stopPropagation();
    const $item = $(this).closest('.ep-image-item');
    const imgSrc = $item.find('img').attr('src');
    
    // Store the item for later deletion
    pendingDeleteItem = $item;
    
    // Set preview image
    $('#epDeleteImagePreview').attr('src', imgSrc);
    
    // Show confirmation modal
    $('#epDeleteImageModal').addClass('active');
    $('.ep-content').css('overflow', 'hidden');
  });

  // Close delete confirmation modal
  $(document).on('click', '#epDeleteImageModalClose, #epDeleteImageCancelBtn', function() {
    $('#epDeleteImageModal').removeClass('active');
    $('.ep-content').css('overflow', '');
    pendingDeleteItem = null;
  });

  // Close on backdrop click
  $(document).on('click', '#epDeleteImageModal', function(e) {
    if (e.target === this) {
      $('#epDeleteImageModal').removeClass('active');
      $('.ep-content').css('overflow', '');
      pendingDeleteItem = null;
    }
  });

  // Confirm delete
  $(document).on('click', '#epDeleteImageConfirmBtn', function() {
    if (!pendingDeleteItem) return;
    
    const $item = pendingDeleteItem;
    const $grid = $item.closest('.ep-image-grid');
    const category = $grid.attr('id') === 'epFeaturedGrid' ? 'featured' : 'myworks';
    
    // Close modal first
    $('#epDeleteImageModal').removeClass('active');
    $('.ep-content').css('overflow', '');
    
    // Remove the item
    $item.fadeOut(200, function() {
      $(this).remove();
      updateImageCount(category);
      showToast('info', 'Image Removed', 'The image has been removed from your portfolio.');
    });
    
    pendingDeleteItem = null;
  });

  // Update image count display
  function updateImageCount(category) {
    const grid = category === 'featured' ? $('#epFeaturedGrid') : $('#epMyWorksGrid');
    const countEl = category === 'featured' ? $('#epFeaturedCount') : $('#epMyWorksCount');
    const count = grid.find('.ep-image-item').length;
    countEl.text(`(${count})`);
  }

  // Contact Me form submission
  $(document).on('click', '#contactSendBtn', function() {
    const name = ($('#contactName').val() || '').trim();
    const email = ($('#contactEmail').val() || '').trim();
    const message = ($('#contactMessage').val() || '').trim();
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!name) { showToast('error', 'Name Required', 'Please enter your name.'); return; }
    if (!email || !emailValid) { showToast('error', 'Valid Email Required', 'Please enter a valid email address.'); return; }
    if (!message) { showToast('error', 'Message Required', 'Please enter a message.'); return; }

    // Create an inbox notification for this message
    if (window.createNotification) {
      window.createNotification({
        type: 'message',
        title: `Message from ${name}`,
        preview: message.length > 120 ? message.slice(0, 120) + '…' : message,
        body: `From: ${name} <${email}>\n\n${message}`,
        timeLabel: 'Just now'
      });
    }

    showToast('success', 'Message Sent', 'Thanks! I will get back to you soon.');
    $("[data-modal-id='contact']").removeClass('is-open');
  });
  

  // Edit Section button handler
  $("#edit-section-btn").on("click", function (e) {
    e.preventDefault();
    console.log("Edit Section clicked");
    // Add your edit section functionality here
  });

  // Close dropdowns when clicking outside
  $(document).on("click", function (e) {
    if (!$(e.target).closest(".icon-btn-wrapper").length) {
      $(".icon-dropdown").removeClass("active");
    }
  });

  // Close dropdowns on Escape key
  $(document).on("keydown", function (e) {
    if (e.key === "Escape") {
      $(".icon-dropdown").removeClass("active");
    }
  });

  /* ============================================================================
     IMAGE VIEWER - Gallery Click Handler
     ============================================================================ */
  
  // Store current gallery state for navigation
  let currentGalleryImages = [];
  let currentImageIndex = 0;

  // Open image viewer when clicking on a gallery item
  $(document).on("click", ".grid-item", function (e) {
    e.preventDefault();
    
    // Get the image data
    const $gridItem = $(this);
    const $img = $gridItem.find("img");
    const imgSrc = $img.attr("src") || $img.data("src");
    const imgTitle = $gridItem.find(".overlay h3").text() || "Untitled";
    const index = parseInt($gridItem.data("index")) || 0;
    
    // Determine which grid we're in (featured or myworks)
    const isMyWorks = $gridItem.closest("#myWorksGrid").length > 0;
    currentGalleryImages = isMyWorks 
      ? images.filter(img => !img.featured)
      : images.filter(img => img.featured);
    currentImageIndex = index;
    
    // Update the image viewer with current image data
    updateImageViewer(currentGalleryImages[currentImageIndex] || {
      url: imgSrc,
      title: imgTitle,
      desc: ""
    });
    
    // Open the image viewer modal
    $("[data-modal-id='image-viewer']").addClass("is-open");
  });

  // Update image viewer content
  function updateImageViewer(imageData) {
    const $viewer = $("[data-modal-id='image-viewer']");
    
    // Update main image
    $("#ivMainImage").attr("src", imageData.url || imageData.src || "");
    
    // Update title
    $("#ivTitle").text(imageData.title || "Untitled");
    
    // Update category (use a default if not available)
    const category = imageData.category || "Photography";
    $("#ivCategory").html(`
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
        <line x1="7" y1="7" x2="7.01" y2="7"></line>
      </svg>
      ${category}
    `);
    
    // Update description
    const description = imageData.desc || imageData.description || "No description available.";
    $("#ivDescription").text(description);
    
    // Update author (use page owner info)
    const authorName = $("#firstName").text() + " " + $("#lastName").text();
    $("#ivAuthor").text(authorName.trim() || "Unknown Artist");
    
    // Update date (use current date as placeholder)
    const now = new Date();
    const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    $("#ivDate").text(now.toLocaleDateString('en-US', dateOptions));
    
    // Update navigation button states
    updateNavButtons();
  }
  
  // Update navigation button states
  function updateNavButtons() {
    $("#ivPrev").prop("disabled", currentImageIndex <= 0);
    $("#ivNext").prop("disabled", currentImageIndex >= currentGalleryImages.length - 1);
    
    // Visual feedback for disabled state
    if (currentImageIndex <= 0) {
      $("#ivPrev").css("opacity", "0.3");
    } else {
      $("#ivPrev").css("opacity", "1");
    }
    
    if (currentImageIndex >= currentGalleryImages.length - 1) {
      $("#ivNext").css("opacity", "0.3");
    } else {
      $("#ivNext").css("opacity", "1");
    }
  }
  
  // Navigate to previous image
  $(document).on("click", "#ivPrev", function () {
    if (currentImageIndex > 0) {
      currentImageIndex--;
      updateImageViewer(currentGalleryImages[currentImageIndex]);
    }
  });
  
  // Navigate to next image
  $(document).on("click", "#ivNext", function () {
    if (currentImageIndex < currentGalleryImages.length - 1) {
      currentImageIndex++;
      updateImageViewer(currentGalleryImages[currentImageIndex]);
    }
  });
});

/* Custom inverted circular cursor (follows mouse, uses mix-blend-mode for inversion) */
(function () {
  try {
    const cursor = document.createElement("div");
    cursor.className = "custom-cursor";
    document.body.appendChild(cursor);

    let lastMove = Date.now();

    document.addEventListener("mousemove", (e) => {
      cursor.style.left = e.clientX + "px";
      cursor.style.top = e.clientY + "px";
      cursor.classList.remove("hidden");
      lastMove = Date.now();

      // detect if element under cursor is interactive (link or button)
      try {
        const el = document.elementFromPoint(e.clientX, e.clientY);
        if (el && el.closest && el.closest('a, button')) {
          cursor.classList.add('ui-hover');
        } else {
          cursor.classList.remove('ui-hover');
        }
      } catch (err) {
        // ignore
      }
    });

    document.addEventListener("mousedown", () => cursor.classList.add("shrink"));
    document.addEventListener("mouseup", () => cursor.classList.remove("shrink"));
    document.addEventListener("mouseleave", () => cursor.classList.add("hidden"));

    // hide after 2s inactivity
    setInterval(() => {
      if (Date.now() - lastMove > 2000) cursor.classList.add("hidden");
    }, 800);
  } catch (e) {
    console.warn("Custom cursor init failed:", e);
  }
})();

// Test toast helper removed.

/* Set data-tooltip attributes for tag elements inside .Links so CSS can show tooltips
   This is used to add tooltips to existing <tag> elements without changing HTML. */
(function () {
  try {
    const tags = document.querySelectorAll('.Links tag');
    tags.forEach((t) => {
      const txt = (t.textContent || '').trim().toLowerCase();
      if (!txt) return;
      if (txt.includes('pro')) {
        t.setAttribute('data-tooltip', 'Member since 2019');
      } else if (txt.includes('beta')) {
        t.setAttribute('data-tooltip', 'Testing since 2021');
      }
    });
  } catch (e) {
    // silent
  }
})();
