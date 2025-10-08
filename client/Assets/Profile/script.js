/* =====================================================================
 * PROFILE TAB JAVASCRIPT
 * Profile dropdown functionality and profile-specific features
 * ===================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  // FEATURE: PROFILE DROPDOWN ------------------------------------------
  const profileIcon = document.getElementById("profileIcon");
  const dropdown = profileIcon ? profileIcon.querySelector(".dropDown") : null;

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

  // FEATURE: PROFILE IMAGE GALLERIES (Featured / All) -----------------
  const featuredTab = document.getElementById("profileFeaturedTab");
  const allTab = document.getElementById("profileAllTab");
  const featuredPanel = document.getElementById("profileFeaturedPanel");
  const allPanel = document.getElementById("profileAllPanel");
  const featuredGallery = document.getElementById("profileFeaturedGallery");
  const allGallery = document.getElementById("profileAllGallery");

  if (
    featuredTab &&
    allTab &&
    featuredPanel &&
    allPanel &&
    featuredGallery &&
    allGallery
  ) {
    let allImages = [];
    let featuredImages = [];

    function escapeHtml(str) {
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    function viewsIcon() {
      return `<svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path fill-rule="evenodd" d="M4.998 7.78C6.729 6.345 9.198 5 12 5c2.802 0 5.27 1.345 7.002 2.78a12.713 12.713 0 0 1 2.096 2.183c.253.344.465.682.618.997.14.286.284.658.284 1.04s-.145.754-.284 1.04a6.6 6.6 0 0 1-.618.997 12.712 12.712 0 0 1-2.096 2.183C17.271 17.655 14.802 19 12 19c-2.802 0-5.27-1.345-7.002-2.78a12.712 12.712 0 0 1-2.096-2.183 6.6 6.6 0 0 1-.618-.997C2.144 12.754 2 12.382 2 12s.145-.754.284-1.04c.153-.315.365-.653.618-.997A12.714 12.714 0 0 1 4.998 7.78ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clip-rule="evenodd"/></svg>`;
    }

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
        <figure class="bento-item" data-id="${idVal}" tabindex="0" aria-describedby="pimg-${idVal}-title">
          <img src="${mainSrc}" alt="${mainAlt}" loading="lazy" />
          <div class="ImgInfo">
            <h3 id="pimg-${idVal}-title">${safeTitle}</h3>
            <p>${safeDesc}</p>
            <span class="views" aria-label="${views} views">${views} ${viewsIcon()}</span>
            <img src="${avatar}" alt="${avatarAlt}" />
          </div>
        </figure>`;
    }

    function attachFigureHandlers(container) {
      container.querySelectorAll(".bento-item").forEach((fig) => {
        fig.addEventListener("click", () => {
          const id = fig.getAttribute("data-id");
          if (id && window.showPanelByName) {
            try {
              sessionStorage.setItem("selectedPhotoId", id);
            } catch (e) {}
            window.showPanelByName("selectedphoto");
          }
        });
        fig.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fig.click();
          }
        });
      });
    }

    function renderFeatured() {
      featuredGallery.setAttribute("aria-busy", "true");
      featuredGallery.innerHTML = featuredImages.map(figureTemplate).join("");
      featuredGallery.setAttribute("aria-busy", "false");
      attachFigureHandlers(featuredGallery);
    }

    function renderAll() {
      allGallery.setAttribute("aria-busy", "true");
      allGallery.innerHTML = allImages.map(figureTemplate).join("");
      allGallery.setAttribute("aria-busy", "false");
      attachFigureHandlers(allGallery);
    }

    async function loadProfileImages() {
      try {
        const res = await fetch("../data/images.json", { cache: "no-store" });
        const data = await res.json();
        allImages = Array.isArray(data)
          ? data
          : Array.isArray(data.images)
          ? data.images
          : [];
        // Synthetic IDs if missing
        allImages.forEach((img, i) => {
          if (img.id == null) img.id = i + 1;
        });
        // Featured: top 6 by views (reuse simple numeric parse)
        const parseViews = (v) => {
          const s = String(v).toLowerCase();
          const m = s.match(/^(\d+(?:\.\d+)?)([km])?$/);
          if (!m) return parseInt(v, 10) || 0;
          const n = parseFloat(m[1]);
          if (m[2] === "k") return n * 1000;
          if (m[2] === "m") return n * 1000000;
          return n;
        };
        featuredImages = [...allImages]
          .sort((a, b) => parseViews(b.views || 0) - parseViews(a.views || 0))
          .slice(0, 6);
        renderFeatured();
        renderAll();
      } catch (e) {
        console.error("Failed to load profile images", e);
        featuredGallery.innerHTML =
          '<p style="padding:1rem;color:#f66;">Failed to load images.</p>';
        allGallery.innerHTML =
          '<p style="padding:1rem;color:#f66;">Failed to load images.</p>';
      }
    }

    function activateTab(which) {
      if (which === "featured") {
        featuredTab.classList.add("active");
        featuredTab.setAttribute("aria-selected", "true");
        allTab.classList.remove("active");
        allTab.setAttribute("aria-selected", "false");
        featuredPanel.hidden = false;
        allPanel.hidden = true;
      } else {
        allTab.classList.add("active");
        allTab.setAttribute("aria-selected", "true");
        featuredTab.classList.remove("active");
        featuredTab.setAttribute("aria-selected", "false");
        allPanel.hidden = false;
        featuredPanel.hidden = true;
      }
    }

    featuredTab.addEventListener("click", () => activateTab("featured"));
    allTab.addEventListener("click", () => activateTab("all"));
    featuredTab.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        allTab.focus();
        activateTab("all");
      }
    });
    allTab.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        featuredTab.focus();
        activateTab("featured");
      }
    });

    loadProfileImages();
  }
});
