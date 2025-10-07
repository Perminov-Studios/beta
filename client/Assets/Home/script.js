/* =====================================================================
 * HOME TAB JAVASCRIPT
 * Gallery functionality, filters, and home page specific features
 * ===================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  // FEATURE: GALLERY LOAD ----------------------------------------------
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
</svg>`;
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
    prev.textContent = "Previous";
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
    next.textContent = "Next";
    next.disabled = currentPage === totalPages;
    next.addEventListener(
      "click",
      () => currentPage < totalPages && renderPage(currentPage + 1)
    );
    nav.appendChild(next);

    // Insert after gallery
    galleryEl.parentElement.appendChild(nav);
  }

  /** Parse views string to numeric for sorting/filtering (e.g., '1.2k' => 1200). */
  function parseViewsString(str) {
    const s = String(str).trim().toLowerCase();
    const match = s.match(/^(\d+(?:\.\d+)?)\s*([km])?$/);
    if (!match) return parseInt(str, 10) || 0;
    const num = parseFloat(match[1]);
    const suffix = match[2];
    if (suffix === "k") return Math.round(num * 1000);
    if (suffix === "m") return Math.round(num * 1000000);
    return Math.round(num);
  }

  /** Apply current filter state to allImages => filteredImages. */
  function applyFilters(silent = false) {
    const searchTerm = filterSearch?.value.toLowerCase().trim() || "";
    const minViews = parseViewsString(filterMinViews?.value || "0");
    const colorFilter = filterColor?.value || "";
    const sortBy = filterSort?.value || "newest";

    filteredImages = allImages.filter((img) => {
      if (searchTerm && !img.title?.toLowerCase().includes(searchTerm)) {
        return false;
      }
      if (minViews > 0 && parseViewsString(img.views || 0) < minViews) {
        return false;
      }
      if (colorFilter && colorFilter !== "any" && img.color !== colorFilter) {
        return false;
      }
      return true;
    });

    // Sort
    if (sortBy === "newest") {
      filteredImages.sort((a, b) => (b.created || 0) - (a.created || 0));
    } else if (sortBy === "oldest") {
      filteredImages.sort((a, b) => (a.created || 0) - (b.created || 0));
    } else if (sortBy === "views") {
      filteredImages.sort(
        (a, b) =>
          parseViewsString(b.views || 0) - parseViewsString(a.views || 0)
      );
    }

    // Update count display
    if (filterMatchCount) {
      filterMatchCount.textContent = `${filteredImages.length} match${
        filteredImages.length === 1 ? "" : "es"
      }`;
    }

    if (!silent) {
      renderPage(1); // reset to first page
    }
  }

  /** Reset all filters to default state. */
  function resetFilters() {
    if (filterSearch) filterSearch.value = "";
    if (filterMinViews) filterMinViews.value = "0";
    if (filterColor) filterColor.value = "any";
    if (filterSort) filterSort.value = "newest";
    updateMinViewsDisplay();
    applyFilters();
  }

  /** Update the displayed value for the range slider. */
  function updateMinViewsDisplay() {
    if (filterMinViewsValue && filterMinViews) {
      const val = parseViewsString(filterMinViews.value);
      filterMinViewsValue.textContent =
        val === 0 ? "Any" : formatViews(String(val));
    }
  }

  /** Attach event handlers to figure elements. */
  function attachFigureHandlers() {
    galleryEl.querySelectorAll(".bento-item").forEach((fig) => {
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

  /** Navigate to selected photo view. */
  function navigateToSelected(id) {
    // Store the selected photo ID for the selected photo view
    try {
      sessionStorage.setItem("selectedPhotoId", id);
    } catch (e) {}

    // Use the global showPanelByName function if available
    if (window.showPanelByName) {
      window.showPanelByName("selectedphoto");
    } else {
      // Fallback to hash navigation
      location.hash = `#selectedphoto-${id}`;
    }
  }

  /** Check for deep link to selected photo. */
  function checkSelectedPhotoDeepLink() {
    const hash = location.hash;
    const match = hash.match(/^#selectedphoto-(\d+)$/);
    if (match) {
      const id = match[1];
      try {
        sessionStorage.setItem("selectedPhotoId", id);
      } catch (e) {}
    }
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
      });
      // Select promoted set: top 6 by numeric views
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
      checkSelectedPhotoDeepLink();
    } catch (err) {
      console.error(err);
      galleryEl.innerHTML = `<p style="padding:1rem;color:#f66;">Failed to load gallery.</p>`;
    }
  }

  // Filter event listeners
  if (filterSearch) {
    filterSearch.addEventListener("input", applyFilters);
  }
  if (filterMinViews) {
    filterMinViews.addEventListener("input", () => {
      updateMinViewsDisplay();
      applyFilters();
    });
  }
  if (filterColor) {
    filterColor.addEventListener("change", applyFilters);
  }
  if (filterSort) {
    filterSort.addEventListener("change", applyFilters);
  }
  if (filterResetBtn) {
    filterResetBtn.addEventListener("click", resetFilters);
  }

  // Initialize displays
  updateMinViewsDisplay();

  // Load gallery data
  loadImages();
});
