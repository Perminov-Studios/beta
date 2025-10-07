/* =====================================================================
 * NOTIFICATIONS TAB JAVASCRIPT
 * Notifications dropdown functionality and notification-specific features
 * ===================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  // FEATURE: NOTIFICATIONS DROPDOWN ----------------------------------
  const searchIcon = document.getElementById("searchIcon");
  const searchDropdown = searchIcon
    ? searchIcon.querySelector(".dropDown")
    : null;
  const profileIcon = document.getElementById("profileIcon");
  const dropdown = profileIcon ? profileIcon.querySelector(".dropDown") : null;
  const inboxIcon = document.getElementById("inboxIcon");
  const inboxDropdown = inboxIcon ? inboxIcon.querySelector(".dropDown") : null;

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

    // Notification interaction functionality
    const notificationItems =
      searchDropdown.querySelectorAll(".notification-item");
    notificationItems.forEach((item) => {
      item.addEventListener("click", () => {
        // Mark notification as read
        item.classList.remove("unread");

        // Update badge count
        updateNotificationBadge();
      });
    });

    function updateNotificationBadge() {
      const badge = searchIcon.querySelector(".notif-badge");
      const unreadCount = searchDropdown.querySelectorAll(
        ".notification-item.unread"
      ).length;

      if (badge) {
        if (unreadCount > 0) {
          badge.textContent = unreadCount;
          badge.style.display = "flex";
        } else {
          badge.style.display = "none";
        }
      }
    }

    // Initialize badge count on page load
    updateNotificationBadge();
  }
});
