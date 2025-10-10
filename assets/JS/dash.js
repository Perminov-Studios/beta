/** =====================================================================
 * DASHBOARD APPLICATION SCRIPT (dash.js)
 * ---------------------------------------------------------------------
 * Responsibilities:
 *   1. FEATURE: TAB SYSTEM      – Show/Hide .Main panels based on nav / hash.
 *   2. FEATURE: DROPDOWNS       – Accessible profile, inbox, notification popovers.
 *   3. FEATURE: BADGES          – Animated unread count + ARIA live updates.
 *   4. FEATURE: GALLERY LOAD    – Fetch + render paginated bento image grid.
 *   5. FEATURE: SELECTED PHOTO  – Hash deep-link (#selectedphoto-<id>) detail view.
 *   6. FEATURE: ACCESSIBILITY   – Focus trapping, keyboard activation, reduced motion.
 *
 * Architectural Notes:
 *   - No build step: everything is ES5/ES2015 compatible (avoid ESM import/export here).
 *   - Defensive checks (e.g., if element missing) allow partial pages to reuse subset.
 *   - Pure helper utilities (escapeHtml, formatViews, etc.) live inline for now; consider
 *     extraction to a /assets/JS/utils/ folder if they grow.
 *
 * Extension Ideas:
 *   - Split into modules: `tabs.js`, `dropdowns.js`, `gallery.js`, `photo-view.js`.
 *   - Add localStorage or API integration for persistent read/unread state.
 *   - Implement virtualized gallery when image count grows large.
 *
 * Searchable Region Tags:  FEATURE: <NAME>
 * ===================================================================== */

// FEATURE: TAB SYSTEM --------------------------------------------------
// Navigation links inside .navLink act as tabs. Panels are .Main elements
// with a secondary class matching a normalized tab name (data-tab or text).
// Supports deep links using URL hash (e.g. #events, #selectedphoto-15).

document.addEventListener("DOMContentLoaded", () => {
  const navLinks = Array.from(document.querySelectorAll(".navLink a"));
  const portalLinks = Array.from(
    document.querySelectorAll(
      "#profileIcon .dropDown a[data-tab], #inboxIcon .dropDown a[data-tab], #searchIcon .dropDown a[data-tab]"
    )
  );
  const allTabLinks = [...navLinks, ...portalLinks];
  const panels = Array.from(document.querySelectorAll(".Main"));
  const profileIcon = document.getElementById("profileIcon");
  const dropdown = profileIcon ? profileIcon.querySelector(".dropDown") : null;
  const inboxIcon = document.getElementById("inboxIcon");
  const inboxDropdown = inboxIcon ? inboxIcon.querySelector(".dropDown") : null;
  const searchIcon = document.getElementById("searchIcon");
  const searchDropdown = searchIcon
    ? searchIcon.querySelector(".dropDown")
    : null;

  if (!allTabLinks.length || !panels.length) return; // nothing to do

  function normalize(text) {
    return text.trim().toLowerCase();
  }

  /** Derive canonical tab name from anchor (data-tab preferred). */
  function tabNameFromAnchor(a) {
    let raw = a.getAttribute("data-tab") || a.textContent || a.innerText || "";
    raw = normalize(raw);
    return raw.replace(/\s+/g, "-");
  }

  /** Show exactly one panel whose secondary class matches `name`. */
  function showPanelByName(name) {
    let matched = false;
    panels.forEach((panel) => {
      if (panel.classList.contains(name)) {
        panel.style.display = "";
        matched = true;
      } else {
        panel.style.display = "none";
      }
    });

    allTabLinks.forEach((a) => {
      const aName = tabNameFromAnchor(a);
      if (aName === name) {
        a.classList.add("active");
        a.setAttribute("aria-current", "true");
        a.parentElement && a.parentElement.classList.add("active");
      } else {
        a.classList.remove("active");
        a.removeAttribute("aria-current");
        a.parentElement && a.parentElement.classList.remove("active");
      }
    });

    if (matched) {
      // Preserve any existing hash parameters (e.g. #selectedphoto&photo=5)
      if (!location.hash.startsWith("#" + name)) {
        const newHash = "#" + name;
        history.replaceState(null, "", newHash);
      }
    }
  }

  // Attach click handlers
  allTabLinks.forEach((a) => {
    a.setAttribute("role", "tab");
    a.tabIndex = 0;
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const name = tabNameFromAnchor(a);
      showPanelByName(name);
      // If user explicitly switches to another tab, clear persisted selected photo state
      if (name !== "selectedphoto") {
        try {
          sessionStorage.removeItem("selectedPhotoId");
        } catch (e) {}
        // If hash was a selectedphoto hash previously, replace it with new base hash
        if (/^#selectedphoto-/i.test(location.hash)) {
          history.replaceState(null, "", "#" + name);
        }
      }
      if (portalLinks.includes(a)) {
        if (dropdown && dropdown.classList.contains("open"))
          dropdown.classList.remove("open");
        if (inboxDropdown && inboxDropdown.classList.contains("open"))
          inboxDropdown.classList.remove("open");
        if (searchDropdown && searchDropdown.classList.contains("open"))
          searchDropdown.classList.remove("open");
      }
    });

    // support keyboard activation (Enter / Space)
    a.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        a.click();
      }
    });
  });

  // Create sliding underline element inside the .navLink container
  const navLinkContainer = document.querySelector(".navLink");
  let underline = navLinkContainer.querySelector(".nav-underline");
  if (!underline) {
    underline = document.createElement("span");
    underline.className = "nav-underline";
    navLinkContainer.appendChild(underline);
  }

  /** Position the animated underline under a top-level nav anchor. */
  function positionUnderlineForAnchor(anchor) {
    if (!anchor) {
      underline.style.opacity = "0";
      return;
    }
    const containerRect = navLinkContainer.getBoundingClientRect();
    const aRect = anchor.getBoundingClientRect();
    const left = aRect.left - containerRect.left + navLinkContainer.scrollLeft;
    const width = aRect.width;
    underline.style.width = Math.max(6, Math.round(width)) + "px";
    underline.style.transform = "translateX(" + Math.round(left) + "px)";

    // Position the underline vertically so it's flush with the top of the visible .Main panel
    const visiblePanel = panels.find((p) => p.style.display !== "none");
    if (visiblePanel) {
      const panelRect = visiblePanel.getBoundingClientRect();
      // compute top relative to the navLinkContainer
      const top =
        panelRect.top -
        containerRect.top +
        window.scrollY -
        navLinkContainer.scrollTop;
      // place the underline so its top aligns with the panel's top (subtract its height)
      const underlineHeight = underline.getBoundingClientRect().height || 3;
      underline.style.top = Math.round(top - underlineHeight) + "px";
    }

    underline.style.opacity = "1";
  }

  // Underline behavior: animate/move only for top-level nav links, not portal (account) tabs.
  // Preserve original reference so we can enhance underline logic.
  const originalShow = showPanelByName;
  let lastNavUnderlineAnchor =
    navLinks.find((a) => a.classList.contains("active")) || navLinks[0];
  showPanelByName = function (name) {
    originalShow(name);
    const activeNav = navLinks.find((a) => a.classList.contains("active"));
    const activePortal = portalLinks.some((a) =>
      a.classList.contains("active")
    );
    if (activeNav) {
      positionUnderlineForAnchor(activeNav);
      lastNavUnderlineAnchor = activeNav;
    } else if (activePortal) {
      // Hide underline for first three portal options explicitly
      const activePortalAnchor = portalLinks.find((a) =>
        a.classList.contains("active")
      );
      const hideList = [
        "profile",
        "settings",
        "privacy-policy",
        "notifications",
        "messages",
      ];
      if (activePortalAnchor) {
        const portalName = tabNameFromAnchor(activePortalAnchor);
        if (hideList.includes(portalName)) {
          underline.style.opacity = "0";
          return;
        }
      }
      // For other portal tabs, keep underline at previous nav position
      if (!lastNavUnderlineAnchor) underline.style.opacity = "0";
    } else {
      underline.style.opacity = "0";
    }
  };

  // Position at startup
  const initialActive =
    allTabLinks.find((a) => a.classList.contains("active")) || allTabLinks[0];
  positionUnderlineForAnchor(initialActive);

  // Reposition on window resize (debounced)
  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const activeAnchor = navLinks.find((a) => a.classList.contains("active"));
      if (activeAnchor) positionUnderlineForAnchor(activeAnchor);
    }, 80);
  });

  // Helper to extract base tab from hash (strip params like &photo= or trailing id after - / /)
  /** Parse base tab from hash (strip params & trailing id segments). */
  function baseTabFromHash(raw) {
    raw = normalize(raw.replace("#", ""));
    return raw.split(/[&/]/)[0].split("-")[0];
  }
  // Explicit default: always fall back to #home if hash is empty or invalid.
  const defaultTabName = "home";
  const initialBase = baseTabFromHash(location.hash || "");
  const panelExists = panels.some((p) => p.classList.contains(initialBase));
  if (initialBase && panelExists) {
    showPanelByName(initialBase);
  } else {
    // Prefer explicit 'home' tab if present; else first link.
    const homeLink = allTabLinks.find(
      (a) => tabNameFromAnchor(a) === defaultTabName
    );
    const targetName = homeLink
      ? defaultTabName
      : tabNameFromAnchor(allTabLinks[0]);
    showPanelByName(targetName);
    if (location.hash !== "#" + targetName) {
      history.replaceState(null, "", "#" + targetName);
    }
  }

  // Optional: update visible panel when user navigates history (back/forward)
  window.addEventListener("hashchange", () => {
    const base = baseTabFromHash(location.hash || "");
    if (base) showPanelByName(base);
  });

  // FEATURE: DROPDOWNS (Profile) ---------------------------------------
  if (profileIcon && dropdown) {
    // Start closed (CSS already hides it). Ensure no accidental open class.
    dropdown.classList.remove("open");

    function openDropdown() {
      dropdown.classList.add("open");
      profileIcon.setAttribute("aria-expanded", "true");
      // Move focus to first actionable link for accessibility
      const firstLink = dropdown.querySelector(
        'a, button, [tabindex]:not([tabindex="-1"])'
      );
      if (firstLink) firstLink.focus({ preventScroll: true });
      document.addEventListener("mousedown", onOutsideClick, true);
      document.addEventListener("keydown", onKeyDown, true);
    }

    function closeDropdown() {
      if (!dropdown.classList.contains("open")) return;
      dropdown.classList.remove("open");
      profileIcon.setAttribute("aria-expanded", "false");
      document.removeEventListener("mousedown", onOutsideClick, true);
      document.removeEventListener("keydown", onKeyDown, true);
      // Return focus to the trigger image if visible
      const img = profileIcon.querySelector("img");
      if (img) img.focus({ preventScroll: true });
    }

    function toggleDropdown() {
      if (dropdown.classList.contains("open")) closeDropdown();
      else openDropdown();
    }

    function onOutsideClick(e) {
      if (!dropdown.contains(e.target) && !profileIcon.contains(e.target)) {
        closeDropdown();
      }
    }

    function onKeyDown(e) {
      if (e.key === "Escape") {
        closeDropdown();
      } else if (e.key === "Tab" && dropdown.classList.contains("open")) {
        // Basic focus trap: keep tab focus inside dropdown
        const focusable = Array.from(
          dropdown.querySelectorAll(
            'a, button, [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => !el.hasAttribute("disabled"));
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    // Make profile image focusable & act as a button
    const profileImg = profileIcon.querySelector("img");
    if (profileImg) {
      profileImg.setAttribute("role", "button");
      profileImg.setAttribute("tabindex", "0");
      profileImg.setAttribute("aria-haspopup", "menu");
      profileImg.setAttribute("aria-expanded", "false");
      profileImg.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleDropdown();
      });
      profileImg.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleDropdown();
        }
      });
    }

    // Close dropdown if window resized significantly (layout shift)
    let lastWidth = window.innerWidth;
    window.addEventListener("resize", () => {
      if (Math.abs(window.innerWidth - lastWidth) > 80) {
        closeDropdown();
        lastWidth = window.innerWidth;
      }
    });
  }

  // FEATURE: DROPDOWNS (Inbox) -----------------------------------------
  if (inboxIcon && inboxDropdown) {
    inboxDropdown.classList.remove("open");

    function openInbox() {
      // close profile if open
      if (dropdown && dropdown.classList.contains("open"))
        dropdown.classList.remove("open");
      inboxDropdown.classList.add("open");
      inboxIcon.setAttribute("aria-expanded", "true");
      document.addEventListener("mousedown", onInboxOutside, true);
      document.addEventListener("keydown", onInboxKey, true);
    }
    function closeInbox() {
      if (!inboxDropdown.classList.contains("open")) return;
      inboxDropdown.classList.remove("open");
      inboxIcon.setAttribute("aria-expanded", "false");
      document.removeEventListener("mousedown", onInboxOutside, true);
      document.removeEventListener("keydown", onInboxKey, true);
    }
    function toggleInbox() {
      if (inboxDropdown.classList.contains("open")) closeInbox();
      else openInbox();
    }
    function onInboxOutside(e) {
      if (!inboxDropdown.contains(e.target) && !inboxIcon.contains(e.target))
        closeInbox();
    }
    function onInboxKey(e) {
      if (e.key === "Escape") closeInbox();
    }
    inboxIcon.setAttribute("role", "button");
    inboxIcon.setAttribute("tabindex", "0");
    inboxIcon.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleInbox();
    });
    inboxIcon.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleInbox();
      }
    });

    // mark messages read on click (badge logic added later after function declarations)
  }

  // FEATURE: DROPDOWNS (Notifications / Search Icon) -------------------
  if (searchIcon && searchDropdown) {
    searchDropdown.classList.remove("open");

    function openSearch() {
      // close others if open
      if (dropdown && dropdown.classList.contains("open"))
        dropdown.classList.remove("open");
      if (inboxDropdown && inboxDropdown.classList.contains("open"))
        inboxDropdown.classList.remove("open");
      searchDropdown.classList.add("open");
      searchIcon.setAttribute("aria-expanded", "true");
      // focus first link
      const first = searchDropdown.querySelector(
        'a, button, [tabindex]:not([tabindex="-1"])'
      );
      if (first) first.focus({ preventScroll: true });
      document.addEventListener("mousedown", onSearchOutside, true);
      document.addEventListener("keydown", onSearchKey, true);
    }
    function closeSearch() {
      if (!searchDropdown.classList.contains("open")) return;
      searchDropdown.classList.remove("open");
      searchIcon.setAttribute("aria-expanded", "false");
      document.removeEventListener("mousedown", onSearchOutside, true);
      document.removeEventListener("keydown", onSearchKey, true);
      searchIcon.focus({ preventScroll: true });
    }
    function toggleSearch() {
      if (searchDropdown.classList.contains("open")) closeSearch();
      else openSearch();
    }
    function onSearchOutside(e) {
      if (!searchDropdown.contains(e.target) && !searchIcon.contains(e.target))
        closeSearch();
    }
    function onSearchKey(e) {
      if (e.key === "Escape") closeSearch();
      else if (e.key === "Tab" && searchDropdown.classList.contains("open")) {
        const focusable = Array.from(
          searchDropdown.querySelectorAll(
            'a, button, [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => !el.hasAttribute("disabled"));
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    // make icon itself a button-like trigger
    searchIcon.setAttribute("role", "button");
    searchIcon.setAttribute("tabindex", "0");
    searchIcon.setAttribute("aria-haspopup", "menu");
    searchIcon.setAttribute("aria-expanded", "false");
    searchIcon.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleSearch();
    });
    searchIcon.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleSearch();
      }
    });
    // notifications / messages: mark read and maintain badges
    const notificationItems =
      searchDropdown.querySelectorAll(".notification-item");
    // badge element
    let badge = searchIcon.querySelector(".notif-badge");
    // inbox badge + live region for decrements
    let msgBadge = inboxIcon.querySelector(".msg-badge");
    if (!msgBadge) {
      msgBadge = document.createElement("span");
      msgBadge.className = "msg-badge";
      inboxIcon.appendChild(msgBadge);
    }
    // Hidden live region for screen readers announcing new count
    let msgLive = inboxIcon.querySelector(".msg-badge-live");
    if (!msgLive) {
      msgLive = document.createElement("span");
      msgLive.className = "msg-badge-live";
      msgLive.setAttribute("aria-live", "polite");
      msgLive.setAttribute("aria-atomic", "true");
      msgLive.style.cssText =
        "position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);border:0;";
      inboxIcon.appendChild(msgLive);
    }

    // Smooth count animation: animate text shrinking then updating
    function animateBadgeText(el, newText) {
      if (el.textContent === newText) return;
      el.classList.add("count-transition-out");
      setTimeout(() => {
        el.textContent = newText;
        el.classList.remove("count-transition-out");
        el.classList.add("count-transition-in");
        requestAnimationFrame(() => {
          setTimeout(() => el.classList.remove("count-transition-in"), 180);
        });
      }, 120);
    }

    function updateMsgBadge() {
      if (!inboxDropdown) return;
      const unread = inboxDropdown.querySelectorAll(
        ".message-item.unread"
      ).length;
      if (unread > 0) {
        const newText = unread > 9 ? "9+" : String(unread);
        if (msgBadge.style.display !== "flex") msgBadge.style.display = "flex";
        animateBadgeText(msgBadge, newText);
        msgLive.textContent =
          unread + (unread === 1 ? " unread message" : " unread messages");
      } else {
        msgBadge.style.display = "none";
        msgLive.textContent = "All messages read";
      }
    }
    if (!badge) {
      badge = document.createElement("span");
      badge.className = "notif-badge";
      searchIcon.appendChild(badge);
      updateMsgBadge();
    }
    function updateBadge() {
      updateMsgBadge(); // ensure message badge kept current
      const unreadCount = searchDropdown.querySelectorAll(
        ".notification-item.unread"
      ).length;
      if (unreadCount > 0) {
        badge.textContent = unreadCount > 9 ? "9+" : String(unreadCount);
        badge.style.display = "flex";
      } else {
        badge.style.display = "none";
      }
    }
    notificationItems.forEach((item) => {
      item.addEventListener("click", () => {
        item.classList.remove("unread");
        item.setAttribute("aria-pressed", "true");
        updateBadge();
      });
    });
    updateBadge();
    // close on significant resize
    let lastSearchWidth = window.innerWidth;
    window.addEventListener("resize", () => {
      if (Math.abs(window.innerWidth - lastSearchWidth) > 80) {
        closeSearch();
        lastSearchWidth = window.innerWidth;
      }
    });
  }

  /* Attach message read handlers AFTER functions exist (inbox badge animation) */
  if (inboxDropdown) {
    const inboxMessages = inboxDropdown.querySelectorAll(".message-item");
    inboxMessages.forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.classList.contains("unread")) {
          btn.classList.remove("unread");
          btn.setAttribute("aria-selected", "true");
          // trigger update if search dropdown logic defined
          const evt = new CustomEvent("inboxUnreadChanged", { bubbles: true });
          inboxDropdown.dispatchEvent(evt);
        }
      });
    });
    // Listen for custom event to update badge if search logic is loaded
    inboxDropdown.addEventListener("inboxUnreadChanged", () => {
      const msgBadge = inboxIcon.querySelector(".msg-badge");
      if (msgBadge) {
        const unread = inboxDropdown.querySelectorAll(
          ".message-item.unread"
        ).length;
        if (unread > 0) {
          msgBadge.textContent = unread > 99 ? "99+" : String(unread);
          msgBadge.style.display = "flex";
        } else {
          msgBadge.style.display = "none";
        }
      }
    });
  }
});

// FEATURE: GALLERY LOAD ------------------------------------------------
// Separate DOMContentLoaded to avoid interfering with earlier logic
document.addEventListener("DOMContentLoaded", () => {
  const galleryEl = document.getElementById("mainGallery");
  const promotedEl = document.getElementById("promotedGallery");
  const promotedSub = document.getElementById("promotedSub");
  const filtersForm = document.getElementById("galleryFilters");
  const filterSearch = document.getElementById("filterSearch");
  const filterMinViews = document.getElementById("filterMinViews");
  const filterMinViewsValue = document.getElementById("filterMinViewsValue");
  const filterColor = document.getElementById("filterColor");
  const filterSort = document.getElementById("filterSort");
  const filterMatchCount = document.getElementById("filterMatchCount");
  const filterResetBtn = document.getElementById("filterReset");
  if (!galleryEl) return;

  const pageSize = parseInt(galleryEl.getAttribute("data-page-size"), 10) || 20;
  let allImages = [];
  let filteredImages = [];
  let currentPage = 1;
  let promotedImages = [];

  /** Return HTML string for a single gallery <figure> card. */
  function figureTemplate(item, absoluteIndex) {
    const safeTitle = escapeHtml(item.title || "Untitled");
    const safeDesc = escapeHtml(item.description || "");
    const mainSrc = item.image?.src || "";
    const mainAlt = escapeHtml(item.image?.alt || safeTitle);
    const views = escapeHtml(item.views || "0");
    const avatar = item.author?.avatar || "";
    const avatarAlt = escapeHtml(item.author?.alt || "Author avatar");
    const idVal = item.id != null ? item.id : absoluteIndex + 1;
    return `
      <figure class="bento-item" data-id="${idVal}" tabindex="0" aria-describedby="img-${idVal}-title">
        <img src="${mainSrc}" alt="${mainAlt}" loading="lazy" />
        <div class="ImgInfo">
          <h3 id="img-${idVal}-title">${safeTitle}</h3>
          <p>${safeDesc}</p>
          <span class="views" aria-label="${views} views">${formatViews(
      views
    )} ${viewsIcon()}</span>
          <img src="${avatar}" alt="${avatarAlt}" />
        </div>
      </figure>
    `;
  }

  /** Inline SVG: small eye icon (shared between grid & detail view). */
  function viewsIcon() {
    return `<svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
  <path fill-rule="evenodd" d="M4.998 7.78C6.729 6.345 9.198 5 12 5c2.802 0 5.27 1.345 7.002 2.78a12.713 12.713 0 0 1 2.096 2.183c.253.344.465.682.618.997.14.286.284.658.284 1.04s-.145.754-.284 1.04a6.6 6.6 0 0 1-.618.997 12.712 12.712 0 0 1-2.096 2.183C17.271 17.655 14.802 19 12 19c-2.802 0-5.27-1.345-7.002-2.78a12.712 12.712 0 0 1-2.096-2.183 6.6 6.6 0 0 1-.618-.997C2.144 12.754 2 12.382 2 12s.145-.754.284-1.04c.153-.315.365-.653.618-.997A12.714 12.714 0 0 1 4.998 7.78ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clip-rule="evenodd"/>
</svg>
`;
  }

  /** Build HTML for a promoted card (smaller, highlight). */
  function promotedTemplate(item) {
    const safeTitle = escapeHtml(item.title || "Untitled");
    const safeDesc = escapeHtml(item.description || "");
    const mainSrc = item.image?.src || "";
    const mainAlt = escapeHtml(item.image?.alt || safeTitle);
    const views = escapeHtml(item.views || "0");
    const avatar = item.author?.avatar || "";
    const avatarAlt = escapeHtml(item.author?.alt || "Author avatar");
    return `
      <article class="promoted-card" data-id="${
        item.id
      }" tabindex="0" aria-label="Promoted: ${safeTitle}">
        <img class="main" src="${mainSrc}" alt="${mainAlt}" loading="lazy" />
        <div class="pc-body">
          <h4><span class="badge-star">★</span>${safeTitle}</h4>
          <p class="desc">${safeDesc}</p>
          <div class="promoted-meta">
            <span class="views">${formatViews(views)} ${viewsIcon()}</span>
            <img class="avatar" src="${avatar}" alt="${avatarAlt}">
          </div>
        </div>
      </article>`;
  }

  /** Populate promoted row: picks top viewed (or flagged) images. */
  function renderPromoted() {
    if (!promotedEl) return;
    if (!promotedImages.length) {
      promotedEl.innerHTML = '<p class="promoted-empty">No promoted items.</p>';
      return;
    }
    promotedEl.innerHTML = promotedImages.map(promotedTemplate).join("");
    // Handlers for navigation to selected view
    promotedEl.querySelectorAll(".promoted-card").forEach((card) => {
      card.addEventListener("click", () => {
        const id = card.getAttribute("data-id");
        if (id) navigateToSelected(id);
      });
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const id = card.getAttribute("data-id");
          if (id) navigateToSelected(id);
        }
      });
    });
  }

  /** Normalize view strings (e.g., '1.2k' => '1.2 k' for spacing). */
  function formatViews(v) {
    // Insert a thin space before shorthand suffix like k / M if missing
    return v.replace(/(\d+(?:\.\d+)?)([kKmM])$/, "$1 $2");
  }

  /** Basic HTML entity escaping to prevent injection in dynamic strings. */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /** Render a single gallery page (paginate client-side). */
  function renderPage(page) {
    currentPage = page;
    const active = filteredImages.length ? filteredImages : allImages;
    const start = (page - 1) * pageSize;
    const slice = active.slice(start, start + pageSize);
    galleryEl.setAttribute("aria-busy", "true");
    galleryEl.innerHTML = slice
      .map((item, i) => figureTemplate(item, start + i))
      .join("");
    galleryEl.setAttribute("aria-busy", "false");
    attachFigureHandlers();
    renderPagination();
  }

  /** Build / rebuild pagination control beneath the gallery. */
  function renderPagination() {
    // Remove old pagination nav if any
    const existing = document.querySelector(".gallery-pagination");
    if (existing) existing.remove();
    const active = filteredImages.length ? filteredImages : allImages;
    const totalPages = Math.ceil(active.length / pageSize) || 1;
    if (totalPages <= 1) return; // nothing to paginate

    const nav = document.createElement("nav");
    nav.className = "gallery-pagination";
    nav.setAttribute("role", "navigation");
    nav.setAttribute("aria-label", "Gallery pagination");

    function pageButton(p) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = p;
      btn.className = "page-btn";
      if (p === currentPage) {
        btn.disabled = true;
        btn.setAttribute("aria-current", "page");
      }
      btn.addEventListener("click", () => renderPage(p));
      return btn;
    }

    const prev = document.createElement("button");
    prev.type = "button";
    prev.className = "arrow prev";
    prev.textContent = "Previous"; // styled with pseudo for arrow
    prev.disabled = currentPage === 1;
    prev.addEventListener(
      "click",
      () => currentPage > 1 && renderPage(currentPage - 1)
    );
    nav.appendChild(prev);

    const centerGroup = document.createElement("div");
    centerGroup.className = "numbers";
    const track = document.createElement("div");
    track.className = "numbers-track";

    // Build list of pages (simple version: show all if <= 7, else show first, current neighbors, last)
    let pages = [];
    if (totalPages <= 7) {
      pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    } else {
      pages.push(1);
      const windowStart = Math.max(2, currentPage - 1);
      const windowEnd = Math.min(totalPages - 1, currentPage + 1);
      if (windowStart > 2) pages.push("ellipsis-start");
      for (let p = windowStart; p <= windowEnd; p++) pages.push(p);
      if (windowEnd < totalPages - 1) pages.push("ellipsis-end");
      pages.push(totalPages);
    }

    pages.forEach((p) => {
      if (typeof p === "number") {
        track.appendChild(pageButton(p));
      } else {
        const span = document.createElement("span");
        span.className = "ellipsis";
        span.textContent = "...";
        track.appendChild(span);
      }
    });

    centerGroup.appendChild(track);
    nav.appendChild(centerGroup);

    const next = document.createElement("button");
    next.type = "button";
    next.className = "arrow next";
    next.textContent = "Next"; // styled with pseudo for arrow
    next.disabled = currentPage === totalPages;
    next.addEventListener(
      "click",
      () => currentPage < totalPages && renderPage(currentPage + 1)
    );
    nav.appendChild(next);

    // Insert after gallery
    galleryEl.parentElement.appendChild(nav);

    // No animated indicator in this style; highlight is handled by active button styling
  }

  /** Fetch images JSON (supports { images: [] } or bare array). */
  async function loadImages() {
    try {
      const res = await fetch("../data/images.json", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load images.json: " + res.status);
      const data = await res.json();
      allImages = Array.isArray(data)
        ? data
        : Array.isArray(data.images)
        ? data.images
        : [];
      allImages.forEach((img, i) => {
        if (img.id == null) img.id = i + 1;
        // derive synthetic created timestamp (for sorting demo) if missing
        if (!img.created) {
          // distribute pseudo dates backwards from now
          img.created = Date.now() - i * 86400000; // i days ago
        }
        // future: respect explicit img.promoted true flag; for now we'll compute after
      });
      // Select promoted set: top 6 by numeric views (ignoring those with extremely low views)
      promotedImages = [...allImages]
        .sort(
          (a, b) =>
            parseViewsString(b.views || 0) - parseViewsString(a.views || 0)
        )
        .slice(0, 6);
      if (promotedSub) promotedSub.textContent = `Refreshes weekly`;
      renderPromoted();
      applyFilters(true); // initialize filteredImages & counts
      renderPage(1);
      // If URL specifies a selected photo via hash parameters, load it
      checkSelectedPhotoDeepLink();
    } catch (err) {
      console.error(err);
      galleryEl.innerHTML = `<p style="padding:1rem;color:#f66;">Failed to load gallery.</p>`;
      galleryEl.setAttribute("aria-busy", "false");
    }
  }

  loadImages();

  /* ---------------- Selected Photo View Logic ---------------- */
  const selectedPanel = document.querySelector(".Main.selectedphoto");
  // FEATURE: SELECTED PHOTO --------------------------------------------
  /** Construct detail view (image + meta + actions) for given ID. */
  function showSelectedPhoto(itemId) {
    if (!selectedPanel) return;
    const main = selectedPanel.querySelector(".home-center");
    const aside = selectedPanel.querySelector(".home-right");
    if (!main || !aside) return;
    const item = allImages.find((img) => String(img.id) === String(itemId));
    if (!item) {
      main.innerHTML = `<p style="padding:1rem;">Image not found.</p>`;
      aside.innerHTML = "";
      return;
    }
    const safeTitle = escapeHtml(item.title || "Untitled");
    const safeDesc = escapeHtml(item.description || "");
    const mainSrc = item.image?.src || "";
    const mainAlt = escapeHtml(item.image?.alt || safeTitle);
    const views = escapeHtml(item.views || "0");
    const avatar = item.author?.avatar || "";
    const avatarUsername = escapeHtml(item.author?.name || "Unknown");
    const avatarAlt = escapeHtml(item.author?.alt || "Author avatar");
    // Main: only the image, centered & responsive
    main.innerHTML = `
      <div class="selected-photo-wrapper">
        <img class="selected-photo" src="${mainSrc}" alt="${mainAlt}" />
      </div>
    `;
    // Aside: metadata & actions
    aside.innerHTML = `
      <div class="photo-meta">
        <header class="photo-meta-header">
          <h2 class="photo-title">${safeTitle}</h2>
          <div class="photo-views" aria-label="${views} views">${formatViews(
      views
    )} ${viewsIcon()}</div>
        </header>
        <p class="photo-desc">${safeDesc}</p>
        <div class="photo-author">
          <img src="${avatar}" alt="${avatarAlt}" class="author-avatar" />
          <span class="author-label">$${avatarUsername}</span>
        </div>
        <div class="photo-actions" role="group" aria-label="Photo actions">
          <button type="button" class="photo-btn" data-action="like">Like</button>
          <button type="button" class="photo-btn" data-action="comment">Comment</button>
          <button type="button" class="photo-btn" data-action="share">Share</button>
          <a href="${mainSrc}" download class="photo-btn download" data-action="download">Download</a>
        </div>
        <div class="photo-nav">
          <button type="button" class="photo-prev" aria-label="Previous image">Prev</button>
          <button type="button" class="photo-next" aria-label="Next image">Next</button>
        </div>
      </div>
    `;
    // Wire prev/next
    const idx = allImages.findIndex((img) => String(img.id) === String(itemId));
    const prevBtn = aside.querySelector(".photo-prev");
    const nextBtn = aside.querySelector(".photo-next");
    if (prevBtn) {
      prevBtn.disabled = idx <= 0;
      prevBtn.addEventListener("click", () => {
        if (idx > 0) navigateToSelected(allImages[idx - 1].id);
      });
    }
    if (nextBtn) {
      nextBtn.disabled = idx >= allImages.length - 1;
      nextBtn.addEventListener("click", () => {
        if (idx < allImages.length - 1)
          navigateToSelected(allImages[idx + 1].id);
      });
    }
  }

  /** Switch to selectedphoto view and update hash/session state. */
  function navigateToSelected(id) {
    try {
      sessionStorage.setItem("selectedPhotoId", String(id));
    } catch (e) {}
    location.hash = `#selectedphoto-${id}`;
    document.querySelectorAll(".Main").forEach((p) => {
      if (p.classList.contains("selectedphoto")) p.style.display = "";
      else p.style.display = "none";
    });
    showSelectedPhoto(id);
  }

  /* ------------------------------------------------------------------
     FEATURE: ADVANCED GALLERY FILTERS
     - Supports text search across title/description.
     - Minimum views slider + quick range preset chips.
     - Sorting by (pseudo) created date, views, title.
     - Real-time match count update.
     - Non-destructive: original allImages always preserved.
  ------------------------------------------------------------------ */
  function parseViewsString(v) {
    // Accept formats like "1.2k", "910", "5.0k" → numeric value
    if (typeof v !== "string") return Number(v) || 0;
    const m = v
      .trim()
      .toLowerCase()
      .match(/([0-9]+(?:\.[0-9]+)?)(k|m)?/);
    if (!m) return 0;
    let num = parseFloat(m[1]);
    const suffix = m[2];
    if (suffix === "k") num *= 1000;
    else if (suffix === "m") num *= 1000000;
    return num;
  }

  function applyFilters(initial = false) {
    if (!filtersForm) {
      filteredImages = [];
      return;
    }
    const q = (filterSearch?.value || "").trim().toLowerCase();
    const minViews = parseInt(filterMinViews?.value || "0", 10) || 0;
    let presetRange = null;
    const activeChip = filtersForm.querySelector('.chip[aria-pressed="true"]');
    if (activeChip) {
      const range = activeChip.getAttribute("data-views-preset");
      if (range) {
        const [a, b] = range.split("-").map(Number);
        presetRange = { min: a || 0, max: b || Number.MAX_SAFE_INTEGER };
      }
    }

    // Color filtering
    const selectedColor = filterColor?.value || "";

    filteredImages = allImages.filter((img) => {
      const title = (img.title || "").toLowerCase();
      const desc = (img.description || "").toLowerCase();
      const viewsNum = parseViewsString(img.views || 0);

      // Text search filter
      if (q && !(title.includes(q) || desc.includes(q))) return false;

      // Views filters
      if (viewsNum < minViews) return false;
      if (
        presetRange &&
        (viewsNum < presetRange.min || viewsNum > presetRange.max)
      )
        return false;

      // Color filter
      if (selectedColor) {
        const imgColors = img.colors || [];
        if (!imgColors.includes(selectedColor)) return false;
      }

      return true;
    });

    // Sorting
    const sortVal = filterSort?.value || "newest";
    const collator = new Intl.Collator(undefined, { sensitivity: "base" });
    const byTitle = (a, b) => collator.compare(a.title || "", b.title || "");
    const byViews = (a, b) =>
      parseViewsString(a.views) - parseViewsString(b.views);
    const byCreated = (a, b) => (a.created || 0) - (b.created || 0);
    switch (sortVal) {
      case "oldest":
        filteredImages.sort(byCreated);
        break;
      case "views-desc":
        filteredImages.sort((a, b) => byViews(b, a));
        break;
      case "views-asc":
        filteredImages.sort(byViews);
        break;
      case "title-asc":
        filteredImages.sort(byTitle);
        break;
      case "title-desc":
        filteredImages.sort((a, b) => byTitle(b, a));
        break;
      case "newest":
      default:
        filteredImages.sort((a, b) => byCreated(b, a));
        break;
    }

    if (filterMatchCount)
      filterMatchCount.textContent = String(filteredImages.length);
    if (!initial) renderPage(1);
  }

  function setupFilterEvents() {
    if (!filtersForm) return;
    if (filterMinViews && filterMinViewsValue) {
      filterMinViews.addEventListener("input", () => {
        filterMinViewsValue.textContent = filterMinViews.value;
        applyFilters();
      });
    }
    if (filterSearch) {
      let searchDebounce;
      filterSearch.addEventListener("input", () => {
        clearTimeout(searchDebounce);
        searchDebounce = setTimeout(() => applyFilters(), 180);
      });
    }
    if (filterSort) {
      filterSort.addEventListener("change", () => applyFilters());
    }
    if (filterColor) {
      filterColor.addEventListener("change", () => applyFilters());
    }
    // View Range Chips
    filtersForm.querySelectorAll(".chip[data-views-preset]").forEach((chip) => {
      chip.addEventListener("click", () => {
        const wasActive = chip.getAttribute("aria-pressed") === "true";
        // toggle logic: only one active at a time
        filtersForm
          .querySelectorAll('.chip[aria-pressed="true"]')
          .forEach((c) => c.setAttribute("aria-pressed", "false"));
        chip.setAttribute("aria-pressed", wasActive ? "false" : "true");
        applyFilters();
      });
    });
    if (filterResetBtn) {
      filterResetBtn.addEventListener("click", (e) => {
        // Allow default reset to clear inputs, then custom cleanup
        setTimeout(() => {
          filtersForm
            .querySelectorAll('.chip[aria-pressed="true"]')
            .forEach((c) => c.setAttribute("aria-pressed", "false"));
          if (filterMinViewsValue && filterMinViews) {
            filterMinViewsValue.textContent = filterMinViews.value || "0";
          }
          applyFilters();
        }, 0);
      });
    }
  }

  setupFilterEvents();

  /** On load: if hash / sessionStorage indicates a selected photo, open it. */
  function checkSelectedPhotoDeepLink() {
    // Only honor explicit hash deep-links now; remove silent sessionStorage fallback
    const m = location.hash.match(/#selectedphoto-(\w+)/i);
    if (m) {
      navigateToSelected(m[1]);
    }
  }

  /** Add click + keyboard activation for each gallery figure. */
  function attachFigureHandlers() {
    const figures = galleryEl.querySelectorAll(".bento-item");
    figures.forEach((fig) => {
      fig.addEventListener("click", () => {
        const id = fig.getAttribute("data-id");
        if (id) navigateToSelected(id);
      });
      fig.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const id = fig.getAttribute("data-id");
          if (id) navigateToSelected(id);
        }
      });
    });
  }

  // Also listen to hash changes for deep linking from outside
  window.addEventListener("hashchange", () => {
    if (/^#selectedphoto-/i.test(location.hash)) {
      const m = location.hash.match(/#selectedphoto-(\w+)/i);
      if (m) showSelectedPhoto(m[1]);
    }
  });
});
