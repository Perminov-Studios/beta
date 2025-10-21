/* =====================================================================
 * HIRE ARTISTS TAB JAVASCRIPT
 * Hire artists page functionality and interactions
 * ===================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("artistGrid");
  const searchForm = document.getElementById("artistSearchForm");
  const searchInput = document.getElementById("artistSearch");
  const resetBtn = document.getElementById("artistSearchReset");
  const matchCount = document.getElementById("artistMatchCount");

  let allUsers = [];
  let filtered = [];
  const pageSize = parseInt(grid?.getAttribute("data-page-size"), 10) || 12;
  let currentPage = 1;
  let hasSearched = false;

  function normalize(str) {
    return String(str || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function tokenize(s) {
    const n = normalize(s);
    return n ? n.split(/\s+/) : [];
  }

  // Return a safe avatar URL; if missing, use a generated placeholder
  function getAvatarUrl(user) {
    const url = String(user?.avatar || "").trim();
    if (url) return url;
    const name = String(user?.name || "User").trim() || "User";
    const qp = encodeURIComponent(name);
    // Neutral dark background to match card ring, white text, bold; 128 for crispness
    return `https://ui-avatars.com/api/?name=${qp}&background=111114&color=ffffff&size=128&bold=true`;
  }

  // Return a safe banner URL; if missing, use a local placeholder
  function getBannerUrl(user) {
    const url = String(user?.banner || "").trim();
    if (url) return url;
    // Local neutral banner fallback (relative to dash.html)
    return "../assets/images/green.jpg";
  }

  function slugify(s) {
    return (
      String(s || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "user"
    );
  }

  function scoreUser(user, query) {
    if (!query) return 0;
    const terms = tokenize(query);
    if (!terms.length) return 0;
    const W = { name: 3, handle: 2, bio: 1.5, location: 1.5, skills: 2.5 };
    const name = normalize(user.name);
    const handle = normalize(user.handle);
    const bio = normalize(user.bio);
    const location = normalize(user.location);
    const skills = normalize((user.skills || []).join(" "));
    const fields = [
      { text: name, w: W.name },
      { text: handle, w: W.handle },
      { text: bio, w: W.bio },
      { text: location, w: W.location },
      { text: skills, w: W.skills },
    ];
    let score = 0;
    for (const t of terms) {
      for (const f of fields) {
        if (!f.text) continue;
        if (f.text.includes(t)) score += 20 * f.w;
      }
    }
    return score;
  }

  function renderArtistPage(page) {
    if (!grid) return;
    currentPage = page;
    grid.setAttribute("aria-busy", "true");
    if (!filtered.length) {
      grid.innerHTML = `
        <div class="artist-empty" role="status" aria-live="polite">
          <div class="icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M10.5 3a7.5 7.5 0 1 1 0 15 7.5 7.5 0 0 1 0-15Zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Zm9.78 13.72-3.53-3.53a1 1 0 1 0-1.42 1.42l3.53 3.53a1 1 0 0 0 1.42-1.42Z"/>
            </svg>
          </div>
          <div class="title">No artists match your search</div>
          <div class="note">Try different keywords or check your spelling.</div>
        </div>`;
      if (matchCount) matchCount.textContent = "0";
      // Remove any existing pagination when empty
      const existing = document.querySelector(".gallery-pagination.artist");
      if (existing) existing.remove();
      grid.setAttribute("aria-busy", "false");
      return;
    }
    const start = (page - 1) * pageSize;
    const slice = filtered.slice(start, start + pageSize);
    const html = slice
      .map((u) => {
        const avatar = getAvatarUrl(u);
        const banner = getBannerUrl(u);
        const name = u.name || "Unknown Artist";
        const handle = u.handle || "@unknown";
        const bio = u.bio || "";
        const skills = Array.isArray(u.skills)
          ? u.skills
          : inferSkillsFromBio(bio);
        const tags = (skills || []).slice(0, 6);
        const statusClass =
          u.status === "online"
            ? "online"
            : u.status === "busy"
            ? "busy"
            : u.status === "away"
            ? "away"
            : "offline";
        const work = String(u.workStatus || "1");
        const workText =
          work === "1"
            ? "Available for Hire"
            : work === "2"
            ? "Busy with a Project"
            : "Not looking for Work";
        const workClass =
          work === "1" ? "hire-1" : work === "2" ? "hire-2" : "hire-3";

        return `
          <article class="artist-card ${u.isPro ? "pro" : ""}" data-user-id="${
          u.id || ""
        }" data-user-name="${escapeHtml(name)}">
            <div class="artist-card-banner">
              ${
                u.isPro
                  ? '<div class="artist-pro-ribbon" aria-label="Pro Account"><p>PRO</p></div>'
                  : ""
              }
              <img class="artist-banner-img" src="${escapeHtml(
                banner
              )}" alt="${escapeHtml(
          name
        )} banner" onerror="this.onerror=null;this.src='../assets/images/green.jpg'" />
            </div>

            <div class="artist-avatar">
              <img class="artist-avatar-img" src="${escapeHtml(
                avatar
              )}" alt="${escapeHtml(
          name
        )} avatar" onerror="this.onerror=null;this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(
          name
        )}&background=111114&color=ffffff&size=128&bold=true'" />
              <span class="artist-status ${statusClass}"></span>
            </div>

            <div class="artist-username ${u.isPro ? "pro" : ""}">
              <h4>${escapeHtml(name)}</h4>
              <p>${escapeHtml(handle)}</p>
            </div>

            <div class="artist-hire ${workClass}">
              <span>${escapeHtml(workText)}</span>
            </div>

            <div class="artist-bio-panel">
              <p>${escapeHtml(bio)}</p>
            </div>

            <div class="artist-tags">${tags
              .map((t) => `<span class="tag">${escapeHtml(t)}</span>`)
              .join("")}</div>

            <div class="artist-actions">
              <button type="button" class="hire-btn">Request Quote</button>
              <button type="button" class="view-profile-btn">View Profile</button>
            </div>
          </article>`;
      })
      .join("");
    grid.innerHTML = html;
    grid.setAttribute("aria-busy", "false");
    renderArtistPagination();
    wireCardInteractions();
  }

  function renderArtistPagination() {
    // Remove any existing pagination under the artist grid
    const existing = document.querySelector(".gallery-pagination.artist");
    if (existing) existing.remove();

    const totalPages = Math.ceil((filtered.length || 0) / pageSize) || 1;
    if (totalPages <= 1) return;

    const nav = document.createElement("nav");
    nav.className = "gallery-pagination artist";
    nav.setAttribute("aria-label", "Artist pagination");

    const track = document.createElement("div");
    track.className = "numbers-track";

    function pageButton(p) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = String(p);
      btn.className = "page-btn";
      if (p === currentPage) btn.setAttribute("aria-current", "page");
      btn.addEventListener("click", () => renderArtistPage(p));
      return btn;
    }

    const prev = document.createElement("button");
    prev.type = "button";
    prev.className = "arrow prev";
    prev.textContent = "Previous";
    prev.disabled = currentPage === 1;
    prev.addEventListener(
      "click",
      () => currentPage > 1 && renderArtistPage(currentPage - 1)
    );
    nav.appendChild(prev);

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
      if (typeof p === "number") track.appendChild(pageButton(p));
      else {
        const el = document.createElement("span");
        el.className = "ellipsis";
        el.textContent = "…";
        track.appendChild(el);
      }
    });
    nav.appendChild(track);

    const next = document.createElement("button");
    next.type = "button";
    next.className = "arrow next";
    next.textContent = "Next";
    next.disabled = currentPage === totalPages;
    next.addEventListener(
      "click",
      () => currentPage < totalPages && renderArtistPage(currentPage + 1)
    );
    nav.appendChild(next);

    grid.insertAdjacentElement("afterend", nav);
  }

  function renderUsers(list) {
    filtered = list.slice();
    if (matchCount) matchCount.textContent = String(filtered.length);
    renderArtistPage(1);
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function inferSkillsFromBio(bio) {
    const s = normalize(bio);
    const skills = [];
    const map = [
      [/(ui|ux|product)\b/, "UI/UX"],
      [/illustration|illustrator/, "Illustration"],
      [/photo|photograph/, "Photography"],
      [/brand|identity/, "Branding"],
      [/web|frontend|react|html|css|js/, "Web"],
      [/motion|video|after effects|premiere/, "Motion"],
    ];
    map.forEach(([re, label]) => {
      if (re.test(s)) skills.push(label);
    });
    return skills.length ? skills : ["Artist"];
  }

  async function loadUsers() {
    try {
      const res = await fetch("../data/users.json", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load users.json");
      const data = await res.json();
      allUsers = Array.isArray(data?.users)
        ? data.users
        : Array.isArray(data)
        ? data
        : [];
      // Enrich with default skills if missing
      allUsers = allUsers.map((u) => ({
        ...u,
        skills: u.skills || inferSkillsFromBio(u.bio),
      }));
      // Initial state: hide cards until a search query is established
      hasSearched = false;
      showSearchPrompt();
    } catch (e) {
      if (grid)
        grid.innerHTML = `<p style="padding:1rem;color:#f66;">Failed to load artists.</p>`;
    }
  }

  function applySearch() {
    const q = searchInput?.value || "";
    const hasQuery = q.trim().length > 0;
    hasSearched = hasQuery;
    if (!hasQuery) {
      // Keep cards hidden until user provides a query
      showSearchPrompt();
      return;
    }
    const scored = allUsers
      .map((u) => ({ u, s: scoreUser(u, q) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .map((x) => x.u);
    renderUsers(scored);
  }

  if (searchForm) {
    searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      applySearch();
    });
    searchForm.addEventListener("reset", () => {
      setTimeout(() => {
        hasSearched = false;
        if (searchInput) searchInput.value = "";
        filtered = [];
        showSearchPrompt();
      }, 0);
    });
  }

  function wireCardInteractions() {
    const hireButtons = document.querySelectorAll(".hire-btn");
    hireButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const card = button.closest(".artist-card");
        const name = card?.dataset.userName || "the artist";
        const originalText = button.textContent;
        button.textContent = "Processing...";
        button.disabled = true;
        setTimeout(() => {
          button.textContent = originalText;
          button.disabled = false;
          showNotification(
            `Request sent to ${name}! They will contact you soon.`,
            "success"
          );
        }, 1200);
      });
    });

    const viewProfileButtons = document.querySelectorAll(".view-profile-btn");
    viewProfileButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const card = button.closest(".artist-card");
        const uid = card?.dataset.userId;
        const user = allUsers.find((u) => String(u.id) === String(uid));
        if (user) {
          navigateToProfile(user);
        } else {
          // Fallback: derive from card dataset
          navigateToProfile({ id: uid, name: card?.dataset.userName || "" });
        }
      });
    });
  }

  function navigateToProfile(user) {
    try {
      const url = new URL(window.location.href);
      const handleRaw = String(user.handle || "").trim();
      const handle = handleRaw
        ? handleRaw.replace(/^@/, "")
        : slugify(user.name || `user-${user.id || ""}`);
      if (handle) url.searchParams.set("user", handle);
      if (user.id != null) url.searchParams.set("uid", String(user.id));
      url.hash = "profile";
      history.pushState({}, "", url.toString());
      // Trigger tab switch to Profile
      const profileLink = document.querySelector('a[data-tab="profile"]');
      if (profileLink) {
        profileLink.dispatchEvent(
          new MouseEvent("click", { bubbles: true, cancelable: true })
        );
      } else {
        // Fallback: notify SPA listeners
        window.dispatchEvent(new HashChangeEvent("hashchange"));
      }
    } catch (e) {
      window.location.hash = "profile";
    }
  }

  // Utility function for notifications
  function showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    Object.assign(notification.style, {
      position: "fixed",
      top: "20px",
      right: "20px",
      padding: "12px 20px",
      borderRadius: "8px",
      color: "white",
      backgroundColor:
        type === "success"
          ? "#10b981"
          : type === "error"
          ? "#ef4444"
          : "#3b82f6",
      zIndex: "10000",
      opacity: "0",
      transition: "opacity 0.3s",
    });

    document.body.appendChild(notification);

    setTimeout(() => (notification.style.opacity = "1"), 10);
    setTimeout(() => {
      notification.style.opacity = "0";
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // Kick off
  loadUsers();

  function showSearchPrompt() {
    if (!grid) return;
    grid.setAttribute("aria-busy", "false");
    // Empty state: hide cards and prompt user to search
    grid.innerHTML = `
      <div class="artist-empty" role="status" aria-live="polite">
        <div class="icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M10.5 3a7.5 7.5 0 1 1 0 15 7.5 7.5 0 0 1 0-15Zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Zm9.78 13.72-3.53-3.53a1 1 0 1 0-1.42 1.42l3.53 3.53a1 1 0 0 0 1.42-1.42Z"/>
          </svg>
        </div>
        <div class="title">Find artists</div>
        <div class="note">Use the search above to discover creators by name, skill, or location.</div>
      </div>`;
    if (matchCount) matchCount.textContent = "0";
    // Remove any lingering pagination
    const existing = document.querySelector(".gallery-pagination.artist");
    if (existing) existing.remove();
  }
});
