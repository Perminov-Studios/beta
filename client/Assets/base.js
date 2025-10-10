/* =====================================================================
 * BASE JAVASCRIPT - TAB SYSTEM AND CORE FUNCTIONALITY
 * Core functionality shared across all tabs
 * ===================================================================== */

// FEATURE: TAB SYSTEM --------------------------------------------------
// Navigation links inside .navLink act as tabs. Panels are .Main elements
// with a secondary class matching a normalized tab name (data-tab or text).
// Supports deep links using URL hash (e.g. #events, #selectedphoto-15).

document.addEventListener("DOMContentLoaded", () => {
  const navLinks = Array.from(document.querySelectorAll(".navLink a"));
  const portalLinks = Array.from(
    document.querySelectorAll(
      "#profileIcon .dropDown a[data-tab], #inboxIcon .dropDown a[data-tab], #searchIcon .dropDown a[data-tab], #uploadIcon a[data-tab]"
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
  let underline = navLinkContainer?.querySelector(".nav-underline");
  if (!underline && navLinkContainer) {
    underline = document.createElement("span");
    underline.className = "nav-underline";
    navLinkContainer.appendChild(underline);
  }

  /** Position the animated underline under a top-level nav anchor. */
  function positionUnderlineForAnchor(anchor) {
    if (!anchor || !underline) {
      if (underline) underline.style.opacity = "0";
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
  const originalShow = showPanelByName;
  let lastNavUnderlineAnchor =
    navLinks.find((a) => a.classList.contains("active")) || navLinks[0];
  showPanelByName = function (name) {
    originalShow(name);
    // Emit a custom event so tab-specific scripts (e.g., Profile) can initialize on demand
    try {
      const evt = new CustomEvent("tab:activate", { detail: { name } });
      document.dispatchEvent(evt);
    } catch (e) {
      // no-op if CustomEvent not supported
    }
    if (name === "selectedphoto") {
      // Render selected photo view when panel is activated
      renderSelectedPhotoPanel();
    }
    if (name === "profile") {
      ensureProfileReportFab();
    }
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
          if (underline) underline.style.opacity = "0";
          return;
        }
      }
      // For other portal tabs, keep underline at previous nav position
      if (!lastNavUnderlineAnchor && underline) underline.style.opacity = "0";
    } else {
      if (underline) underline.style.opacity = "0";
    }
  };

  // Position at startup
  const initialActive =
    allTabLinks.find((a) => a.classList.contains("active")) || allTabLinks[0];
  if (initialActive) positionUnderlineForAnchor(initialActive);

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
    // If hash includes selectedphoto-id pattern, persist id
    const m = location.hash.match(/^#selectedphoto-(\d+)/i);
    if (m) {
      try {
        sessionStorage.setItem("selectedPhotoId", m[1]);
      } catch (e) {}
    }
    if (base) showPanelByName(base);
  });

  // Make showPanelByName globally available for other scripts
  window.showPanelByName = showPanelByName;

  /* =============================================================
     SELECTED PHOTO RENDERING
     Fetches images.json (lightweight) and renders the selected
     image (by id stored in sessionStorage) into the SelectedPhoto
     panel. Falls back gracefully if id/image not found.
     ============================================================= */
  async function renderSelectedPhotoPanel() {
    const containerPanel = document.querySelector(
      ".Main.selectedphoto, .Main.SelectedPhoto"
    );
    if (!containerPanel) return;
    const mainEl = containerPanel.querySelector(
      'main.home-col.home-center, main[aria-label="Selected photo view"]'
    );
    const asideEl = containerPanel.querySelector(
      'aside.home-col.home-right, aside[aria-label="Photo actions"]'
    );
    if (!mainEl) return;
    let selectedId = null;
    try {
      selectedId = sessionStorage.getItem("selectedPhotoId");
    } catch (e) {}
    if (!selectedId) {
      const mh = location.hash.match(/^#selectedphoto-(\d+)/i);
      if (mh) selectedId = mh[1];
    }
    if (!selectedId) {
      mainEl.innerHTML =
        '<p style="padding:1rem;color:#9b9ba1;">No image selected.</p>';
      if (asideEl) asideEl.innerHTML = "";
      return;
    }
    mainEl.setAttribute("aria-busy", "true");
    mainEl.innerHTML = `<p style="padding:1rem;color:#9b9ba1;">Loading image #${selectedId}…</p>`;
    if (asideEl) asideEl.innerHTML = "";
    try {
      const res = await fetch("../data/images.json", { cache: "no-store" });
      const data = await res.json();
      const images = Array.isArray(data) ? data : data.images || [];
      const img = images.find(
        (i, idx) => String(i.id || idx + 1) === String(selectedId)
      );
      if (!img) {
        mainEl.innerHTML =
          '<p style="padding:1rem;color:#f66;">Image not found.</p>';
        return;
      }
      const safe = (s) =>
        String(s || "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
      const viewsIcon = () =>
        `<svg class=\"w-6 h-6\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\" width=\"18\" height=\"18\" fill=\"currentColor\" viewBox=\"0 0 24 24\"><path fill-rule=\"evenodd\" d=\"M4.998 7.78C6.729 6.345 9.198 5 12 5c2.802 0 5.27 1.345 7.002 2.78a12.713 12.713 0 0 1 2.096 2.183c.253.344.465.682.618.997.14.286.284.658.284 1.04s-.145.754-.284 1.04a6.6 6.6 0 0 1-.618.997 12.712 12.712 0 0 1-2.096 2.183C17.271 17.655 14.802 19 12 19c-2.802 0-5.27-1.345-7.002-2.78a12.712 12.712 0 0 1-2.096-2.183 6.6 6.6 0 0 1-.618-.997C2.144 12.754 2 12.382 2 12s.145-.754.284-1.04c.153-.315.365-.653.618-.997A12.714 12.714 0 0 1 4.998 7.78ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z\" clip-rule=\"evenodd\"/></svg>`;
      const reportIcon = () =>
        `<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 16 16\" fill=\"currentColor\" aria-hidden=\"true\">\n  <path d=\"M2.75 2a.75.75 0 0 0-.75.75v10.5a.75.75 0 0 0 1.5 0v-2.624l.33-.083A6.044 6.044 0 0 1 8 11c1.29.645 2.77.807 4.17.457l1.48-.37a.462.462 0 0 0 .35-.448V3.56a.438.438 0 0 0-.544-.425l-1.287.322C10.77 3.808 9.291 3.646 8 3a6.045 6.045 0 0 0-4.17-.457l-.34.085A.75.75 0 0 0 2.75 2Z\" />\n</svg>`;
      const mainSrc = img.image?.src || "";
      const mainAlt = safe(img.image?.alt || img.title || "Selected image");
      const avatar = img.author?.avatar || "";
      const avatarAlt = safe(img.author?.alt || "Author avatar");
      const avatarName = safe(img.author?.name || "Unknown");
      const title = safe(img.title || "Untitled");
      const desc = safe(img.description || "");
      const views = safe(img.views || "0");

      // IMAGE ONLY IN MAIN
      mainEl.innerHTML = `<figure class="spv-media-wrapper"><img class="spv-media-img" src="${mainSrc}" alt="${mainAlt}" loading="eager" /></figure>`;
      mainEl.removeAttribute("aria-busy");

      // ACTIONS / META IN ASIDE (or fallback to main if aside hidden)
      const actionsMarkup = `
        <div class="spv-actions">
          <div class="spv-actions-header">
            <button type="button" class="spv-back" aria-label="Back to gallery">← Back</button>
            <h1 class="spv-title" title="${title}">${title}</h1>
          </div>
          <div class="spv-author-block">
            <img class="spv-avatar" src="${avatar}" alt="${avatarAlt}">
            <div class="spv-author-info">
              <span class="spv-author-name">${avatarName}</span>
            </div>
          </div>
          <p class="spv-desc">${desc}</p>
          <div class="spv-stats-bar" role="group" aria-label="Image stats and actions">
            <span class="spv-views" aria-label="${views} views">${views} ${viewsIcon()}</span>
            <button type="button" class="spv-like" aria-pressed="false" aria-label="Like this image"><span class="icon">❤</span> <span class="count">0</span></button>
            <button type="button" class="spv-share" aria-label="Copy share link">🔗 Share</button>
          </div>
          <div class="hireAccount">
            <a href="#">Hire ${avatarName}</a>
          </div>
          <section class="spv-comments" aria-label="Comments">
            <h2 class="spv-subheading">Comments</h2>
            <ul class="spv-comment-list" aria-live="polite"></ul>
            <form class="spv-comment-form" aria-label="Add a comment">
              <input type="text" class="spv-comment-input" placeholder="Add a comment" aria-label="Comment text" maxlength="300" required />
              <button type="submit" class="spv-comment-submit">Post</button>
            </form>
          </section>
        </div>`;

      const targetAside =
        asideEl && getComputedStyle(asideEl).display !== "none"
          ? asideEl
          : mainEl;
      targetAside.innerHTML =
        targetAside === asideEl
          ? actionsMarkup
          : actionsMarkup + targetAside.innerHTML; // if fallback, prepend actions above image
      if (targetAside !== asideEl) {
        // ensure order: actions then image
        const imgWrapper = mainEl.querySelector(".spv-media-wrapper");
        if (imgWrapper) {
          mainEl.appendChild(imgWrapper);
        }
      }

      // Add floating report button pinned to bottom-right of the main section
      const fab = document.createElement("button");
      fab.type = "button";
      fab.className = "spv-report fab";
      fab.setAttribute("aria-pressed", "false");
      fab.setAttribute("aria-label", "Report this image");
      fab.setAttribute("title", "Report");
      fab.innerHTML = reportIcon();
      mainEl.appendChild(fab);

      // Wire up interactions
      const backBtn = containerPanel.querySelector(".spv-back");
      if (backBtn) {
        backBtn.addEventListener("click", () => {
          const prev = sessionStorage.getItem("lastGalleryTab") || "home";
          window.showPanelByName(prev);
        });
      }
      const likeBtn = containerPanel.querySelector(".spv-like");
      if (likeBtn) {
        likeBtn.addEventListener("click", () => {
          const pressed = likeBtn.getAttribute("aria-pressed") === "true";
          likeBtn.setAttribute("aria-pressed", String(!pressed));
          const countEl = likeBtn.querySelector(".count");
          let val = parseInt(countEl.textContent, 10) || 0;
          if (!pressed) val++;
          else if (val > 0) val--;
          countEl.textContent = val;
        });
      }
      const shareBtn = containerPanel.querySelector(".spv-share");
      if (shareBtn) {
        shareBtn.addEventListener("click", async () => {
          const shareUrl =
            location.origin +
            location.pathname +
            "#selectedphoto-" +
            selectedId;
          try {
            await navigator.clipboard.writeText(shareUrl);
            shareBtn.textContent = "Copied!";
            setTimeout(() => (shareBtn.textContent = "🔗 Share"), 1800);
          } catch (e) {
            shareBtn.textContent = "Copy failed";
            setTimeout(() => (shareBtn.textContent = "🔗 Share"), 1800);
          }
        });
      }
      const reportBtn = containerPanel.querySelector(".spv-report");
      if (reportBtn) {
        reportBtn.addEventListener("click", () => {
          const pressed = reportBtn.getAttribute("aria-pressed") === "true";
          reportBtn.setAttribute("aria-pressed", String(!pressed));
          const prevTitle = reportBtn.getAttribute("title") || "Report";
          reportBtn.setAttribute("title", pressed ? "Report" : "Reported");
          // Optional: quick visual feedback via outline flash
          reportBtn.style.outline = "2px solid #ff4d4f";
          setTimeout(() => (reportBtn.style.outline = ""), 250);
        });
      }
      const commentForm = containerPanel.querySelector(".spv-comment-form");
      const commentList = containerPanel.querySelector(".spv-comment-list");
      if (commentForm && commentList) {
        commentForm.addEventListener("submit", (e) => {
          e.preventDefault();
          const input = commentForm.querySelector(".spv-comment-input");
          const text = input.value.trim();
          if (!text) return;
          const li = document.createElement("li");
          li.className = "spv-comment-item";
          li.innerHTML = `<span class="cmt-author">You</span><span class="cmt-text"></span>`;
          li.querySelector(".cmt-text").textContent = " " + text;
          commentList.appendChild(li);
          input.value = "";
          input.focus();
        });
      }
    } catch (e) {
      console.error(e);
      mainEl.innerHTML =
        '<p style="padding:1rem;color:#f66;">Failed to load image.</p>';
      if (asideEl) asideEl.innerHTML = "";
    } finally {
      mainEl.removeAttribute("aria-busy");
    }
  }

  // Track last non-selectedphoto gallery tab for back navigation
  const galleryTabNames = ["home", "profile"]; // extend if needed
  const observer = new MutationObserver(() => {
    const visible = panels.find((p) => p.style.display !== "none");
    if (visible) {
      const classes = Array.from(visible.classList);
      const name = classes.find((c) => galleryTabNames.includes(c));
      if (name) {
        try {
          sessionStorage.setItem("lastGalleryTab", name);
        } catch (e) {}
      }
    }
  });
  panels.forEach((p) =>
    observer.observe(p, { attributes: true, attributeFilter: ["style"] })
  );

  // Initial deep-link id capture (#selectedphoto-XX)
  const initialSelected = location.hash.match(/^#selectedphoto-(\d+)/i);
  if (initialSelected) {
    try {
      sessionStorage.setItem("selectedPhotoId", initialSelected[1]);
    } catch (e) {}
  }

  // Ensure a floating report icon exists on the Profile tab main section
  function ensureProfileReportFab() {
    const profMain = document.querySelector(
      '.Main.profile .home-center[aria-label="Primary content area"], .Main.profile .home-center'
    );
    if (!profMain) return;
    if (profMain.querySelector(".spv-report.fab")) return; // already added
    const icon =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">` +
      `<path d="M2.75 2a.75.75 0 0 0-.75.75v10.5a.75.75 0 0 0 1.5 0v-2.624l.33-.083A6.044 6.044 0 0 1 8 11c1.29.645 2.77.807 4.17.457l1.48-.37a.462.462 0 0 0 .35-.448V3.56a.438.438 0 0 0-.544-.425l-1.287.322C10.77 3.808 9.291 3.646 8 3a6.045 6.045 0 0 0-4.17-.457l-.34.085A.75.75 0 0 0 2.75 2Z" />` +
      `</svg>`;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "spv-report fab";
    btn.setAttribute("aria-pressed", "false");
    btn.setAttribute("aria-label", "Report");
    btn.setAttribute("title", "Report");
    btn.innerHTML = icon;
    profMain.appendChild(btn);
    btn.addEventListener("click", () => {
      const pressed = btn.getAttribute("aria-pressed") === "true";
      btn.setAttribute("aria-pressed", String(!pressed));
      btn.setAttribute("title", pressed ? "Report" : "Reported");
      btn.style.outline = "2px solid #ff4d4f";
      setTimeout(() => (btn.style.outline = ""), 250);
    });
  }
  // ================= UPLOAD FORM HANDLING (Prototype) =================
  const uploadForm = document.getElementById("uploadForm");
  if (uploadForm) {
    const feedbackEl = document.getElementById("uploadFeedback");
    const cancelBtn = uploadForm.querySelector("[data-cancel]");
    uploadForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const formData = new FormData(uploadForm);
      const title = (formData.get("title") || "").toString().trim();
      const file = formData.get("image");
      if (!title || !file || !(file instanceof File) || !file.name) {
        if (feedbackEl) {
          feedbackEl.style.color = "#ff8484";
          feedbackEl.textContent =
            "Please provide a title and select an image.";
        }
        return;
      }
      if (feedbackEl) {
        feedbackEl.style.color = "#8da8ff";
        feedbackEl.textContent = "Uploading…";
      }
      setTimeout(() => {
        if (feedbackEl) {
          feedbackEl.style.color = "#5fe3a1";
          feedbackEl.textContent =
            "Upload successful (demo only, not persisted).";
        }
        uploadForm.reset();
      }, 900);
    });
    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        uploadForm.reset();
        if (feedbackEl) feedbackEl.textContent = "";
        showPanelByName("home");
      });
    }
  }
});
