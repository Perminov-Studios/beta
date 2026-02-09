/* ============================================================================
   PERMINOV STUDIOS - LANDING PAGE JAVASCRIPT
   ============================================================================
   
   TABLE OF CONTENTS:
   1. Lenis Smooth Scrolling Setup
   2. Preloader Animation
   3. Scroll Indicator Visibility
   4. Video Visibility Handling
   5. Footer Text Fitting (Optional)
   
   ============================================================================ */

/* ============================================================================
   1. LENIS SMOOTH SCROLLING SETUP
   Provides buttery-smooth scroll experience
   ============================================================================ */

const lenis = new Lenis({
  lerp: 0.05,              // Interpolation factor (lower = smoother)
  duration: 1.5,           // Animation duration
  easing: (t) => 1 - Math.pow(2, -10 * t),  // Ease-out exponential
  wheelMultiplier: 0.8,    // Scroll wheel sensitivity
  smoothTouch: false,      // Disable on touch devices for better UX
  touchMultiplier: 1.5,    // Touch scroll sensitivity
});

// Request Animation Frame loop management
let rafId = null;

function raf(time) {
  if (lenis && typeof lenis.raf === 'function') {
    lenis.raf(time);
  }
  rafId = requestAnimationFrame(raf);
}

function startRaf() {
  if (rafId === null) {
    rafId = requestAnimationFrame(raf);
  }
}

function stopRaf() {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

// Start the animation loop immediately
startRaf();


/* ============================================================================
   2. PRELOADER ANIMATION
   Shows "Loading..." -> "Welcome" -> Slides up and reveals content
   ============================================================================ */

$(document).ready(function () {
  // Wait 3 seconds, then start the transition
  setTimeout(function () {
    // Step 1: Fade out "Loading..."
    $("#text-container").addClass("fade-out");

    // Step 2: After fade-out, change text and fade in
    setTimeout(function () {
      $("#text-container")
        .removeClass("fade-out")
        .text("Welcome")
        .attr("data-usal", "fade-u split-letter split-delay-200")
        .addClass("fade-in");

      // Step 3: Slide the preloader up after welcome message
      setTimeout(function () {
        $("#box").addClass("slide-up");
      }, 2000);
      
    }, 500); // Wait for fade-out animation to complete
    
  }, 3000); // Initial wait time
});


/* ============================================================================
   3. SCROLL INDICATOR VISIBILITY
   Hides the scroll arrow when user starts scrolling
   ============================================================================ */

(function initScrollIndicator() {
  const scrollIndicator = document.querySelector('.scroll');
  const bgVideo = document.querySelector('.bg-video-wrapper video');
  
  if (!scrollIndicator) return;

  /**
   * Toggle scroll indicator visibility based on scroll position
   * @param {number} scrollY - Current scroll position
   */
  const toggleIndicator = (scrollY) => {
    if (scrollY > 50) {
      scrollIndicator.classList.add('hidden');
    } else {
      scrollIndicator.classList.remove('hidden');
    }
  };

  // Listen to Lenis scroll events (if available)
  if (lenis && typeof lenis.on === 'function') {
    lenis.on('scroll', ({ scroll }) => {
      toggleIndicator(scroll);
    });
  }

  // Fallback to native scroll event
  window.addEventListener('scroll', () => {
    toggleIndicator(window.scrollY);
  }, { passive: true });


  /* ==========================================================================
     4. VIDEO VISIBILITY HANDLING
     Pauses video and stops animations when tab is hidden
     ========================================================================== */
  
  const handleVisibilityChange = () => {
    if (document.hidden) {
      // Tab is hidden - pause video and stop RAF
      if (bgVideo && !bgVideo.paused) {
        try { 
          bgVideo.pause(); 
        } catch (e) {
          console.warn('Could not pause video:', e);
        }
      }
      stopRaf();
    } else {
      // Tab is visible - resume video and RAF
      if (bgVideo && bgVideo.paused) {
        try { 
          bgVideo.play().catch(() => {}); 
        } catch (e) {
          console.warn('Could not play video:', e);
        }
      }
      startRaf();
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange, { passive: true });
  
  // Initialize correct state on page load
  handleVisibilityChange();
})();


/* ============================================================================
   5. FOOTER TEXT FITTING (Optional)
   Splits footer text into spans and adjusts font-size to fit container
   Currently not used but kept for future footer implementation
   ============================================================================ */

(function initFooterFit() {
  /**
   * Split text into individual letter spans for styling
   * @param {string} selector - CSS selector for the element
   * @returns {HTMLElement|null} - The modified element or null
   */
  function splitTextIntoSpans(selector) {
    const el = document.querySelector(selector);
    if (!el) return null;
    
    const text = el.textContent || '';
    const chars = Array.from(text.trim());
    
    if (!chars.length) return null;
    
    el.textContent = '';
    chars.forEach((ch) => {
      const span = document.createElement('span');
      span.className = 'footer-letter';
      span.textContent = ch === ' ' ? '\u00A0' : ch;
      el.appendChild(span);
    });
    
    el.style.display = el.style.display || 'inline-block';
    el.style.whiteSpace = 'nowrap';
    
    return el;
  }

  /**
   * Adjust font size to fit text within container width
   * @param {HTMLElement} el - The text element
   * @param {Object} opts - Configuration options
   */
  function fitTextToContainer(el, opts = {}) {
    if (!el) return;
    
    const container = el.parentElement || el;
    const style = getComputedStyle(container);
    const padLeft = parseFloat(style.paddingLeft) || 0;
    const padRight = parseFloat(style.paddingRight) || 0;
    const available = Math.max(0, container.clientWidth - padLeft - padRight - (opts.buffer || 2));

    const minSize = opts.minSize || 10;
    const maxSize = opts.maxSize || Math.max(48, Math.floor(window.innerHeight * 0.15));

    // Binary search for optimal font size
    let lo = minSize;
    let hi = maxSize;
    let best = minSize;
    
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      el.style.fontSize = mid + 'px';
      el.style.transform = '';
      
      const width = el.getBoundingClientRect().width;
      
      if (width <= available) {
        best = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    
    el.style.fontSize = best + 'px';

    // Adjust letter spacing to fill remaining space
    const naturalWidth = el.getBoundingClientRect().width;
    const letterCount = el.querySelectorAll('.footer-letter').length || 1;
    const gap = available - naturalWidth;
    
    if (letterCount > 1) {
      const spacing = gap / (letterCount - 1);
      const clampedSpacing = Math.max(-6, Math.min(2, spacing));
      el.style.letterSpacing = clampedSpacing + 'px';
    }
  }

  /**
   * Initialize footer text fitting
   */
  function init() {
    const footerText = splitTextIntoSpans('footer .footer-text');
    if (!footerText) return;
    
    const runFit = () => fitTextToContainer(footerText, { 
      minSize: 12, 
      maxSize: 300, 
      buffer: 6 
    });
    
    runFit();
    
    // Debounced resize handler
    let resizeTimeout = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(runFit, 100);
    });
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
