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
});
