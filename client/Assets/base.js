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
    if (base) showPanelByName(base);
  });

  // Make showPanelByName globally available for other scripts
  window.showPanelByName = showPanelByName;
});
