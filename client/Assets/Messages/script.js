/* =====================================================================
 * MESSAGES TAB JAVASCRIPT
 * Messages/Inbox dropdown functionality and message-specific features
 * ===================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  // FEATURE: INBOX DROPDOWN -------------------------------------------
  const inboxIcon = document.getElementById("inboxIcon");
  const inboxDropdown = inboxIcon ? inboxIcon.querySelector(".dropDown") : null;
  const profileIcon = document.getElementById("profileIcon");
  const dropdown = profileIcon ? profileIcon.querySelector(".dropDown") : null;

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

    // Message interaction functionality
    const messageItems = inboxDropdown.querySelectorAll(".message-item");
    messageItems.forEach((item) => {
      item.addEventListener("click", () => {
        // Mark message as read
        item.classList.remove("unread");

        // Update badge count
        updateMessageBadge();
      });
    });

    function updateMessageBadge() {
      const badge = inboxIcon.querySelector(".msg-badge");
      const unreadCount = inboxDropdown.querySelectorAll(
        ".message-item.unread"
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
    updateMessageBadge();
  }
});
