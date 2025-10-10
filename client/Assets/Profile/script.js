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
  const likesTab = document.getElementById("profileLikedImagesTab");
  const featuredPanel = document.getElementById("profileFeaturedPanel");
  const allPanel = document.getElementById("profileAllPanel");
  const likesPanel = document.getElementById("profileLikedImagesPanel");
  const featuredGallery = document.getElementById("profileFeaturedGallery");
  const allGallery = document.getElementById("profileAllGallery");
  const likesGallery = document.getElementById("profileLikedGallery");
  const estProfileSideBar = document.getElementById("profileSideBar");
  // Example static banner and profile picture URLs (replace with dynamic data as needed)
  var bannersrc =
    "https://i.pinimg.com/originals/dc/e6/59/dce659269993ee5c55a0543ecd2f159e.gif";
  var userPFPsrc =
    "https://i.pinimg.com/originals/13/34/fd/1334fd5e90dd4f05919b25c76e3fa7e0.gif";

  const userName = "James"; // Replace with dynamic user name
  const userHandle = "@lynovichh"; // Replace with dynamic user handle
  // Move sidebar into profile if not already present (for non-owner view)
  const accStatus = "away"; // Possible values: "online", "offline", "busy", "away"
  const testPRO = true; // Set to true to show Pro badge, false to hide

  const WorkStatus = "2";

  const getSocialLinks = () => {
    // Example static social links (replace with dynamic data as needed)
    const socials = [
      { "Link 1": "https://x.com/X" },
      { "Link 2": "https://www.linkedin.com/" },
      { "Link 3": "https://github.com/borisperminov" },
      { "Link 4": "https://dribbble.com/copelandx" },
    ];

    const escapeHtml = (str) =>
      String(str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    const normalize = (input) => {
      if (!input) return null;
      let raw = String(input).trim();
      // Add https:// if missing scheme (and not mailto)
      if (!/^([a-zA-Z][a-zA-Z0-9+.-]*):/.test(raw)) {
        raw = "https://" + raw;
      }
      if (raw.toLowerCase().startsWith("mailto:")) {
        const email = raw.slice(7);
        const iconSvg = `
          <svg class="social-icon email" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
            <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2Zm0 4-8 5-8-5V6l8 5 8-5v2Z"/>
          </svg>`;
        return {
          href: `mailto:${email}`,
          platform: "Email",
          label: email,
          iconSvg,
          tooltip: email,
        };
      }
      let u;
      try {
        u = new URL(raw);
      } catch (e) {
        return { href: raw, platform: "Link", label: raw };
      }
      const host = u.hostname.replace(/^www\./, "").toLowerCase();
      // Twitter/X normalization
      if (host === "x.com" || host === "twitter.com") {
        const handle = u.pathname.replace(/^\//, "").split("/")[0] || "";
        const href = `https://twitter.com/${handle}`.replace(/\/$/, "");
        // Inline SVG for Twitter icon (icon-only display)
        const iconSvg = `
          <svg class="social-icon twitter" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="#1da1f2" aria-hidden="true">
            <path d="M23 4.8c-.8.4-1.7.7-2.6.8.9-.6 1.6-1.4 1.9-2.5-.9.6-2 .9-3 .- .-" />
          </svg>`;
        // Use a well-known, compact Twitter bird path (fallback if above truncated)
        const safeIconSvg = `
          <svg class="social-icon twitter" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" fill="#1da1f2" height="18" aria-hidden="true">
            <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.52 1.56-1.35 1.88-2.34-.82.49-1.73.85-2.7 1.05a4.18 4.18 0 0 0-7.12 3.82A11.86 11.86 0 0 1 3.1 4.9a4.18 4.18 0 0 0 1.29 5.58c-.66-.02-1.28-.2-1.82-.5v.05a4.18 4.18 0 0 0 3.35 4.1c-.31.09-.64.13-.98.13-.24 0-.48-.02-.71-.07a4.19 4.19 0 0 0 3.9 2.9A8.38 8.38 0 0 1 2 19.54a11.82 11.82 0 0 0 6.41 1.88c7.69 0 11.9-6.37 11.9-11.89 0-.18-.01-.36-.02-.54.82-.59 1.53-1.33 2.09-2.16z"/>
          </svg>`;
        const icon = safeIconSvg; // choose stable svg
        return {
          href,
          platform: "Twitter",
          label: handle
            ? `<li class="social-icon twitter">@${handle}</li>`
            : '<li class="social-icon twitter">Twitter</li>',
          iconSvg: icon,
          tooltip: handle ? `@${handle}` : "Twitter",
        };
      }
      // Dribble
      if (host === "dribbble.com") {
        const handle = u.pathname.replace(/^\//, "").split("/")[0] || "";
        const href = `https://dribbble.com/${handle}`.replace(/\/$/, "");
        const iconSvg = `
          <svg class="social-icon dribbble" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48"><mask id="ipSDribble0"><g fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="4"><path fill="#ea4c89" stroke="#ea4c89" d="M44 24a19.938 19.938 0 0 1-5.889 14.173A19.937 19.937 0 0 1 24 44C12.954 44 4 35.046 4 24a19.932 19.932 0 0 1 5.5-13.775A19.943 19.943 0 0 1 24 4a19.937 19.937 0 0 1 14.111 5.827A19.938 19.938 0 0 1 44 24Z"/><path stroke="#ea4c89" d="M44 24c-2.918 0-10.968-1.1-18.173 2.063C18 29.5 12.333 34.831 9.863 38.147"/><path stroke="#ea4c89" d="M16.5 5.454C19.63 8.343 26.46 15.698 29 23c2.54 7.302 3.48 16.28 4.06 18.835"/><path stroke="#ea4c89" d="M4.154 21.5c3.778.228 13.779.433 20.179-2.3c6.4-2.733 11.907-7.76 13.796-9.355"/><path stroke="#ea4c89" d="M5.5 31.613a20.076 20.076 0 0 0 9 9.991M4 24a19.932 19.932 0 0 1 5.5-13.775M24 4a19.943 19.943 0 0 0-14.5 6.225M32 5.664a20.037 20.037 0 0 1 6.111 4.163A19.938 19.938 0 0 1 44 24c0 2.462-.445 4.821-1.26 7M24 44a19.937 19.937 0 0 0 14.111-5.827"/></g></mask><path fill="#ea4c89" d="M0 0h48v48H0z" mask="url(#ipSDribble0)"/></svg>
        `;
        // Use a well-known, compact Twitter bird path (fallback if above truncated)
        const safeIconSvg = `
          <svg class="social-icon dribbble" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48"><mask id="ipSDribble0"><g fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="4"><path stroke="#ea4c89" d="M44 24a19.938 19.938 0 0 1-5.889 14.173A19.937 19.937 0 0 1 24 44C12.954 44 4 35.046 4 24a19.932 19.932 0 0 1 5.5-13.775A19.943 19.943 0 0 1 24 4a19.937 19.937 0 0 1 14.111 5.827A19.938 19.938 0 0 1 44 24Z"/><path stroke="#ea4c89" d="M44 24c-2.918 0-10.968-1.1-18.173 2.063C18 29.5 12.333 34.831 9.863 38.147"/><path stroke="#ea4c89" d="M16.5 5.454C19.63 8.343 26.46 15.698 29 23c2.54 7.302 3.48 16.28 4.06 18.835"/><path stroke="#ea4c89" d="M4.154 21.5c3.778.228 13.779.433 20.179-2.3c6.4-2.733 11.907-7.76 13.796-9.355"/><path stroke="#ea4c89" d="M5.5 31.613a20.076 20.076 0 0 0 9 9.991M4 24a19.932 19.932 0 0 1 5.5-13.775M24 4a19.943 19.943 0 0 0-14.5 6.225M32 5.664a20.037 20.037 0 0 1 6.111 4.163A19.938 19.938 0 0 1 44 24c0 2.462-.445 4.821-1.26 7M24 44a19.937 19.937 0 0 0 14.111-5.827"/></g></mask><path fill="#ea4c89" d="M0 0h48v48H0z" mask="url(#ipSDribble0)"/></svg>
        `;
        const icon = safeIconSvg; // choose stable svg
        return {
          href,
          platform: "Dribbble",
          label: handle
            ? `<li class="dribbble">@${handle}</li>`
            : "<li>Dribbble</li>",
          iconSvg: icon,
          tooltip: handle ? `@${handle}` : "Dribbble",
        };
      }
      //Behance
      if (host === "behance.net") {
        const handle = u.pathname.replace(/^\//, "").split("/")[0] || "";
        const href = `https://www.behance.net/${handle}`.replace(/\/$/, "");
        const iconSvg = `
          <svg class="social-icon behance" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 432 384"><path fill="#000000" d="M384 103H277V77h107v26zM208 203.5q12 17.5 12 42.5q0 20-8 35q-7 14-21 23q-12 9-30 14q-14 4-34 4H0V56h124q12 0 34 5q13 3 26 12q11 7 18 20q6 13 6 31q0 20-9.5 33.5T172 179q24 7 36 24.5zM55 163h61q17 0 26-6q10-7 10-23q0-9-3.5-15t-9.5-9q-6-4-12-5q-9-2-15-2H55v60zm107 80q0-20-11-29q-11-8-30-8H55v73h64q7 0 17-2q8-2 13.5-5.5T159 260q3-6 3-17zm264-3H289q0 24 13 37q12 11 34 11q15 0 27-8q12-9 14-18h46q-10 35-34 50q-24 16-55 16q-22 0-40-7t-31-21q-13-13-19-32q-7-18-7-40t7-40.5t20-32.5q13-13 30-21q18-8 40-8q24 0 42 9.5t30 25.5q11 15 17 37q5 21 3 42zm-52-34q-2-18-12-30q-9-10-29-10q-13 0-21 4.5T298.5 181t-6.5 13q-3 7-3 12h85z"/></svg>
        `;
        // Use a well-known, compact Twitter bird path (fallback if above truncated)
        const safeIconSvg = `
          <svg class="social-icon behance" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 432 384"><path fill="#000000" d="M384 103H277V77h107v26zM208 203.5q12 17.5 12 42.5q0 20-8 35q-7 14-21 23q-12 9-30 14q-14 4-34 4H0V56h124q12 0 34 5q13 3 26 12q11 7 18 20q6 13 6 31q0 20-9.5 33.5T172 179q24 7 36 24.5zM55 163h61q17 0 26-6q10-7 10-23q0-9-3.5-15t-9.5-9q-6-4-12-5q-9-2-15-2H55v60zm107 80q0-20-11-29q-11-8-30-8H55v73h64q7 0 17-2q8-2 13.5-5.5T159 260q3-6 3-17zm264-3H289q0 24 13 37q12 11 34 11q15 0 27-8q12-9 14-18h46q-10 35-34 50q-24 16-55 16q-22 0-40-7t-31-21q-13-13-19-32q-7-18-7-40t7-40.5t20-32.5q13-13 30-21q18-8 40-8q24 0 42 9.5t30 25.5q11 15 17 37q5 21 3 42zm-52-34q-2-18-12-30q-9-10-29-10q-13 0-21 4.5T298.5 181t-6.5 13q-3 7-3 12h85z"/></svg>
        `;

        const icon = safeIconSvg; // choose stable svg
        return {
          href,
          platform: "Behance",
          label: handle
            ? `<li class="behance">@${handle}</li>`
            : "<li>Behance</li>",
          iconSvg: icon,
          tooltip: handle ? `@${handle}` : "Behance",
        };
      }
      // Facebook
      if (host === "facebook.com" || host === "fb.com") {
        const path = u.pathname.replace(/^\//, "").split("/")[0] || "";
        const iconSvg = `
          <svg class="social-icon facebook" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 32 32"><path fill="#000000" d="M25.566 2.433H6.433c-2.2 0-4 1.8-4 4v19.135c0 2.2 1.8 4 4 4h19.135c2.2 0 4-1.8 4-4V6.433c-.002-2.2-1.8-4-4.002-4zm-.257 14.483h-3.22v11.65h-4.818v-11.65h-2.41V12.9h2.41v-2.41c0-3.276 1.36-5.225 5.23-5.225h3.217V9.28h-2.012c-1.504 0-1.604.563-1.604 1.61l-.013 2.01h3.645l-.426 4.016z"/></svg>
        `;
        // Use a well-known, compact Twitter bird path (fallback if above truncated)
        const safeIconSvg = `
          <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 32 32"><path fill="#000000" d="M25.566 2.433H6.433c-2.2 0-4 1.8-4 4v19.135c0 2.2 1.8 4 4 4h19.135c2.2 0 4-1.8 4-4V6.433c-.002-2.2-1.8-4-4.002-4zm-.257 14.483h-3.22v11.65h-4.818v-11.65h-2.41V12.9h2.41v-2.41c0-3.276 1.36-5.225 5.23-5.225h3.217V9.28h-2.012c-1.504 0-1.604.563-1.604 1.61l-.013 2.01h3.645l-.426 4.016z"/></svg>
        `;

        const icon = safeIconSvg; // choose stable svg
        const fbLabel = path || "Facebook";
        return {
          href: `https://www.facebook.com/${path}`,
          platform: "Facebook",
          label: "Facebook",
          iconSvg: icon,
          tooltip: fbLabel,
        };
      }
      // LinkedIn
      if (host === "linkedin.com" || host === "linkedin.cn") {
        const path = u.pathname || "/";
        const iconSvg = `
  <svg class="social-icon linkedin" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 1025 1024"><path fill="#0a66c2" d="M896.428 1024h-768q-53 0-90.5-37.5T.428 896V128q0-53 37.5-90.5t90.5-37.5h768q53 0 90.5 37.5t37.5 90.5v768q0 53-37.5 90.5t-90.5 37.5zm-640-864q0-13-9.5-22.5t-22.5-9.5h-64q-13 0-22.5 9.5t-9.5 22.5v64q0 13 9.5 22.5t22.5 9.5h64q13 0 22.5-9.5t9.5-22.5v-64zm0 192q0-13-9.5-22.5t-22.5-9.5h-64q-13 0-22.5 9.5t-9.5 22.5v512q0 13 9.5 22.5t22.5 9.5h64q13 0 22.5-9.5t9.5-22.5V352zm640 160q0-80-56-136t-136-56q-44 0-96.5 14t-95.5 39v-21q0-13-9.5-22.5t-22.5-9.5h-64q-13 0-22.5 9.5t-9.5 22.5v512q0 13 9.5 22.5t22.5 9.5h64q13 0 22.5-9.5t9.5-22.5V576q0-53 37.5-90.5t90.5-37.5t90.5 37.5t37.5 90.5v288q0 13 9.5 22.5t22.5 9.5h64q13 0 22.5-9.5t9.5-22.5V512z"/></svg>
        `;
        // Use a well-known, compact Twitter bird path (fallback if above truncated)
        const safeIconSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 1025 1024"><path fill="#0a66c2" d="M896.428 1024h-768q-53 0-90.5-37.5T.428 896V128q0-53 37.5-90.5t90.5-37.5h768q53 0 90.5 37.5t37.5 90.5v768q0 53-37.5 90.5t-90.5 37.5zm-640-864q0-13-9.5-22.5t-22.5-9.5h-64q-13 0-22.5 9.5t-9.5 22.5v64q0 13 9.5 22.5t22.5 9.5h64q13 0 22.5-9.5t9.5-22.5v-64zm0 192q0-13-9.5-22.5t-22.5-9.5h-64q-13 0-22.5 9.5t-9.5 22.5v512q0 13 9.5 22.5t22.5 9.5h64q13 0 22.5-9.5t9.5-22.5V352zm640 160q0-80-56-136t-136-56q-44 0-96.5 14t-95.5 39v-21q0-13-9.5-22.5t-22.5-9.5h-64q-13 0-22.5 9.5t-9.5 22.5v512q0 13 9.5 22.5t22.5 9.5h64q13 0 22.5-9.5t9.5-22.5V576q0-53 37.5-90.5t90.5-37.5t90.5 37.5t37.5 90.5v288q0 13 9.5 22.5t22.5 9.5h64q13 0 22.5-9.5t9.5-22.5V512z"/></svg>
        `;
        const icon = safeIconSvg; // choose stable svg
        // Derive a friendly tooltip from path, e.g., in/username
        const trimmed = path.replace(/\/+$/, "");
        const segs = trimmed.split("/").filter(Boolean);
        let lkLabel = "LinkedIn";
        if (segs[0] === "in" && segs[1]) lkLabel = `in/${segs[1]}`;
        else if (segs.length) lkLabel = segs.join("/");
        return {
          href: `https://www.linkedin.com${path}`,
          platform: "LinkedIn",
          label: "LinkedIn",
          iconSvg: icon,
          tooltip: lkLabel,
        };
      }
      // GitHub
      if (host === "github.com") {
        const user = u.pathname.replace(/^\//, "").split("/")[0] || "";
        const href = `https://github.com/${user}`.replace(/\/$/, "");
        const iconSvg = `
  <svg class="social-icon github" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 432 416"><path fill="#5d6ac0" d="M213.5 0q88.5 0 151 62.5T427 213q0 70-41 125.5T281 416q-14 2-14-11v-58q0-27-15-40q44-5 70.5-27t26.5-77q0-34-22-58q11-26-2-57q-18-5-58 22q-26-7-54-7t-53 7q-18-12-32.5-17.5T107 88h-6q-12 31-2 57q-22 24-22 58q0 55 27 77t70 27q-11 10-13 29q-42 18-62-18q-12-20-33-22q-2 0-4.5.5t-5 3.5t8.5 9q14 7 23 31q1 2 2 4.5t6.5 9.5t13 10.5T130 371t30-2v36q0 13-14 11q-64-22-105-77.5T0 213q0-88 62.5-150.5T213.5 0z"/></svg>
        `;
        // Use a well-known, compact Twitter bird path (fallback if above truncated)
        const safeIconSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 432 416"><path fill="#5d6ac0" d="M213.5 0q88.5 0 151 62.5T427 213q0 70-41 125.5T281 416q-14 2-14-11v-58q0-27-15-40q44-5 70.5-27t26.5-77q0-34-22-58q11-26-2-57q-18-5-58 22q-26-7-54-7t-53 7q-18-12-32.5-17.5T107 88h-6q-12 31-2 57q-22 24-22 58q0 55 27 77t70 27q-11 10-13 29q-42 18-62-18q-12-20-33-22q-2 0-4.5.5t-5 3.5t8.5 9q14 7 23 31q1 2 2 4.5t6.5 9.5t13 10.5T130 371t30-2v36q0 13-14 11q-64-22-105-77.5T0 213q0-88 62.5-150.5T213.5 0z"/></svg>
        `;
        const icon = safeIconSvg; // choose stable svg
        return {
          href,
          platform: "GitHub",
          label: user || "GitHub",
          iconSvg: icon,
          tooltip: user ? `@${user}` : "GitHub",
        };
      }
      // Instagram
      if (host.endsWith("instagram.com")) {
        const user = u.pathname.replace(/^\//, "").split("/")[0] || "";
        const href = `https://instagram.com/${user}`.replace(/\/$/, "");
        const iconSvg = `
  <svg class="social-icon instagram" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><path fill="#000000" d="M17.34 5.46a1.2 1.2 0 1 0 1.2 1.2a1.2 1.2 0 0 0-1.2-1.2Zm4.6 2.42a7.59 7.59 0 0 0-.46-2.43a4.94 4.94 0 0 0-1.16-1.77a4.7 4.7 0 0 0-1.77-1.15a7.3 7.3 0 0 0-2.43-.47C15.06 2 14.72 2 12 2s-3.06 0-4.12.06a7.3 7.3 0 0 0-2.43.47a4.78 4.78 0 0 0-1.77 1.15a4.7 4.7 0 0 0-1.15 1.77a7.3 7.3 0 0 0-.47 2.43C2 8.94 2 9.28 2 12s0 3.06.06 4.12a7.3 7.3 0 0 0 .47 2.43a4.7 4.7 0 0 0 1.15 1.77a4.78 4.78 0 0 0 1.77 1.15a7.3 7.3 0 0 0 2.43.47C8.94 22 9.28 22 12 22s3.06 0 4.12-.06a7.3 7.3 0 0 0 2.43-.47a4.7 4.7 0 0 0 1.77-1.15a4.85 4.85 0 0 0 1.16-1.77a7.59 7.59 0 0 0 .46-2.43c0-1.06.06-1.4.06-4.12s0-3.06-.06-4.12ZM20.14 16a5.61 5.61 0 0 1-.34 1.86a3.06 3.06 0 0 1-.75 1.15a3.19 3.19 0 0 1-1.15.75a5.61 5.61 0 0 1-1.86.34c-1 .05-1.37.06-4 .06s-3 0-4-.06a5.73 5.73 0 0 1-1.94-.3a3.27 3.27 0 0 1-1.1-.75a3 3 0 0 1-.74-1.15a5.54 5.54 0 0 1-.4-1.9c0-1-.06-1.37-.06-4s0-3 .06-4a5.54 5.54 0 0 1 .35-1.9A3 3 0 0 1 5 5a3.14 3.14 0 0 1 1.1-.8A5.73 5.73 0 0 1 8 3.86c1 0 1.37-.06 4-.06s3 0 4 .06a5.61 5.61 0 0 1 1.86.34a3.06 3.06 0 0 1 1.19.8a3.06 3.06 0 0 1 .75 1.1a5.61 5.61 0 0 1 .34 1.9c.05 1 .06 1.37.06 4s-.01 3-.06 4ZM12 6.87A5.13 5.13 0 1 0 17.14 12A5.12 5.12 0 0 0 12 6.87Zm0 8.46A3.33 3.33 0 1 1 15.33 12A3.33 3.33 0 0 1 12 15.33Z"/></svg>
        `;
        // Use a well-known, compact Twitter bird path (fallback if above truncated)
        const safeIconSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24"><path fill="#000000" d="M17.34 5.46a1.2 1.2 0 1 0 1.2 1.2a1.2 1.2 0 0 0-1.2-1.2Zm4.6 2.42a7.59 7.59 0 0 0-.46-2.43a4.94 4.94 0 0 0-1.16-1.77a4.7 4.7 0 0 0-1.77-1.15a7.3 7.3 0 0 0-2.43-.47C15.06 2 14.72 2 12 2s-3.06 0-4.12.06a7.3 7.3 0 0 0-2.43.47a4.78 4.78 0 0 0-1.77 1.15a4.7 4.7 0 0 0-1.15 1.77a7.3 7.3 0 0 0-.47 2.43C2 8.94 2 9.28 2 12s0 3.06.06 4.12a7.3 7.3 0 0 0 .47 2.43a4.7 4.7 0 0 0 1.15 1.77a4.78 4.78 0 0 0 1.77 1.15a7.3 7.3 0 0 0 2.43.47C8.94 22 9.28 22 12 22s3.06 0 4.12-.06a7.3 7.3 0 0 0 2.43-.47a4.7 4.7 0 0 0 1.77-1.15a4.85 4.85 0 0 0 1.16-1.77a7.59 7.59 0 0 0 .46-2.43c0-1.06.06-1.4.06-4.12s0-3.06-.06-4.12ZM20.14 16a5.61 5.61 0 0 1-.34 1.86a3.06 3.06 0 0 1-.75 1.15a3.19 3.19 0 0 1-1.15.75a5.61 5.61 0 0 1-1.86.34c-1 .05-1.37.06-4 .06s-3 0-4-.06a5.73 5.73 0 0 1-1.94-.3a3.27 3.27 0 0 1-1.1-.75a3 3 0 0 1-.74-1.15a5.54 5.54 0 0 1-.4-1.9c0-1-.06-1.37-.06-4s0-3 .06-4a5.54 5.54 0 0 1 .35-1.9A3 3 0 0 1 5 5a3.14 3.14 0 0 1 1.1-.8A5.73 5.73 0 0 1 8 3.86c1 0 1.37-.06 4-.06s3 0 4 .06a5.61 5.61 0 0 1 1.86.34a3.06 3.06 0 0 1 1.19.8a3.06 3.06 0 0 1 .75 1.1a5.61 5.61 0 0 1 .34 1.9c.05 1 .06 1.37.06 4s-.01 3-.06 4ZM12 6.87A5.13 5.13 0 1 0 17.14 12A5.12 5.12 0 0 0 12 6.87Zm0 8.46A3.33 3.33 0 1 1 15.33 12A3.33 3.33 0 0 1 12 15.33Z"/></svg>
        `;
        const icon = safeIconSvg; // choose stable svg
        return {
          href,
          platform: "Instagram",
          label: user ? `@${user}` : "Instagram",
          iconSvg: icon,
          tooltip: user ? `@${user}` : "Instagram",
        };
      }
      // TikTok
      if (host.endsWith("tiktok.com")) {
        const user = u.pathname.replace(/^@?/, "");
        const handle = user.replace(/^\//, "").split("/")[0];
        const href = `https://www.tiktok.com/@${handle}`.replace(/\/@$/, "");
        const iconSvg = `
  <svg class="social-icon tiktok" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><path fill="#000000" d="M12.525.02c1.31-.02 2.61-.01 3.91-.02c.08 1.53.63 3.09 1.75 4.17c1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97c-.57-.26-1.1-.59-1.62-.93c-.01 2.92.01 5.84-.02 8.75c-.08 1.4-.54 2.79-1.35 3.94c-1.31 1.92-3.58 3.17-5.91 3.21c-1.43.08-2.86-.31-4.08-1.03c-2.02-1.19-3.44-3.37-3.65-5.71c-.02-.5-.03-1-.01-1.49c.18-1.9 1.12-3.72 2.58-4.96c1.66-1.44 3.98-2.13 6.15-1.72c.02 1.48-.04 2.96-.04 4.44c-.99-.32-2.15-.23-3.02.37c-.63.41-1.11 1.04-1.36 1.75c-.21.51-.15 1.07-.14 1.61c.24 1.64 1.82 3.02 3.5 2.87c1.12-.01 2.19-.66 2.77-1.61c.19-.33.4-.67.41-1.06c.1-1.79.06-3.57.07-5.36c.01-4.03-.01-8.05.02-12.07z"/></svg>
        `;
        // Use a well-known, compact Twitter bird path (fallback if above truncated)
        const safeIconSvg = `
  <svg class="social-icon tiktok" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><path fill="#000000" d="M12.525.02c1.31-.02 2.61-.01 3.91-.02c.08 1.53.63 3.09 1.75 4.17c1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97c-.57-.26-1.1-.59-1.62-.93c-.01 2.92.01 5.84-.02 8.75c-.08 1.4-.54 2.79-1.35 3.94c-1.31 1.92-3.58 3.17-5.91 3.21c-1.43.08-2.86-.31-4.08-1.03c-2.02-1.19-3.44-3.37-3.65-5.71c-.02-.5-.03-1-.01-1.49c.18-1.9 1.12-3.72 2.58-4.96c1.66-1.44 3.98-2.13 6.15-1.72c.02 1.48-.04 2.96-.04 4.44c-.99-.32-2.15-.23-3.02.37c-.63.41-1.11 1.04-1.36 1.75c-.21.51-.15 1.07-.14 1.61c.24 1.64 1.82 3.02 3.5 2.87c1.12-.01 2.19-.66 2.77-1.61c.19-.33.4-.67.41-1.06c.1-1.79.06-3.57.07-5.36c.01-4.03-.01-8.05.02-12.07z"/></svg>
        `;
        const icon = safeIconSvg; // choose stable svg
        return {
          href,
          platform: "TikTok",
          label: handle ? `@${handle}` : "TikTok",
          iconSvg: icon,
          tooltip: handle ? `@${handle}` : "TikTok",
        };
      }
      // Fallback: website
      const iconSvg = `
        <svg class="social-icon website" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="#4ade80" aria-hidden="true">
          <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm7.94 9h-3.23a13.7 13.7 0 0 0-1.28-5.02A8.51 8.51 0 0 1 19.94 11ZM8.57 4.98A11.7 11.7 0 0 0 7.3 11H4.06a8.51 8.51 0 0 1 4.51-6.02Zm-4.51 8H7.3c.2 1.76.7 3.47 1.27 5.02A8.51 8.51 0 0 1 4.06 13Zm5.84 5.79A20 20 0 0 1 9.3 13h5.4a20 20 0 0 1-.6 5.79A8.13 8.13 0 0 1 12 20a8.13 8.13 0 0 1-2.1-.21ZM14.7 11H9.3a18.4 18.4 0 0 1 1.5-5.61c.38-.13.78-.2 1.2-.2.42 0 .82.07 1.2.2.74 1.74 1.25 3.65 1.3 5.61Zm.43 7.02c.57-1.55 1.07-3.26 1.27-5.02h3.24a8.51 8.51 0 0 1-4.51 6.02Z"/>
        </svg>`;
      return {
        href: u.href,
        platform: "Website",
        label: u.hostname,
        iconSvg,
        tooltip: u.hostname,
      };
    };

    return socials
      .map((entry) => {
        const url = typeof entry === "string" ? entry : Object.values(entry)[0];
        const info = normalize(url);
        if (!info) return "";
        const labelText = info.label || info.platform || "Link";
        const aria = info.tooltip
          ? `${labelText} (${info.platform})`
          : labelText;
        const titleAttr = info.tooltip || labelText;
        const tooltipAttr = info.tooltip || labelText;
        const inner = info.iconSvg
          ? `${info.iconSvg}`
          : `${escapeHtml(labelText)}`;
        return `
      <li>
        <a href="${escapeHtml(
          info.href
        )}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(
          aria
        )}" title="${escapeHtml(titleAttr)}" data-tooltip="${escapeHtml(
          tooltipAttr
        )}" data-platform="${escapeHtml(info.platform || "")}">
          ${inner}
        </a>
      </li>`;
      })
      .join("");
  };

  estProfileSideBar.innerHTML = `
    <div id="profileBanner" style="background: linear-gradient(0deg, #09090b, #09090b00), url('${bannersrc}') center/cover no-repeat;" aria-label="User banner image">
        ${
          testPRO
            ? '<div class="AccPRO" aria-label="Pro Account"><p>PRO</p></div>'
            : ""
        }
        <div id="userProfile" style="background: url('${userPFPsrc}') center/cover no-repeat;" aria-label="User profile picture">
        <div class="onlineStatus1"></div>

        ${accStatus === "online" ? '<div class="onlineStatus1"></div>' : ""}
        ${accStatus === "busy" ? '<div class="onlineStatus2"></div>' : ""}
        ${accStatus === "away" ? '<div class="onlineStatus3"></div>' : ""}
        ${accStatus === "offline" ? '<div class="onlineStatus4"></div>' : ""}
        </div><br>
    </div>

    <div id="AccUserName">
      ${
        testPRO
          ? `<span id="AccProBadge"><h4>${userName}</h4><p>${userHandle}</p></span>`
          : "<h4>" + userName + "</h4><p>" + userHandle + "</p>"
      }
    </div>

    <div id="AccSettings">
      <a href="#settings" data-tab="settings" aria-label="Account Settings" title="Account Settings">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" class="size-4">
          <path fill-rule="evenodd" d="M6.455 1.45A.5.5 0 0 1 6.952 1h2.096a.5.5 0 0 1 .497.45l.186 1.858a4.996 4.996 0 0 1 1.466.848l1.703-.769a.5.5 0 0 1 .639.206l1.047 1.814a.5.5 0 0 1-.14.656l-1.517 1.09a5.026 5.026 0 0 1 0 1.694l1.516 1.09a.5.5 0 0 1 .141.656l-1.047 1.814a.5.5 0 0 1-.639.206l-1.703-.768c-.433.36-.928.649-1.466.847l-.186 1.858a.5.5 0 0 1-.497.45H6.952a.5.5 0 0 1-.497-.45l-.186-1.858a4.993 4.993 0 0 1-1.466-.848l-1.703.769a.5.5 0 0 1-.639-.206l-1.047-1.814a.5.5 0 0 1 .14-.656l1.517-1.09a5.033 5.033 0 0 1 0-1.694l-1.516-1.09a.5.5 0 0 1-.141-.656L2.46 3.593a.5.5 0 0 1 .639-.206l1.703.769c.433-.36.928-.65 1.466-.848l.186-1.858Zm-.177 7.567-.022-.037a2 2 0 0 1 3.466-1.997l.022.037a2 2 0 0 1-3.466 1.997Z" clip-rule="evenodd" />
        </svg>

      </a>
    </div>

    <div id="AccHire">
      ${WorkStatus === "1" ? '<a id="hire1" href="#hire" data-tab="hire" aria-label="Available for Work" title="Available for Work">Available for Hire</a>' : ''}
      ${WorkStatus === "2" ? '<a id="hire2" data-tab="hire" aria-label="Currently Working" title="Currently Working">Busy with a Project</a>' : ''}
      ${WorkStatus === "3" ? '<a id="hire3" data-tab="hire" aria-label="Not Available for Work" title="Not Available for Work">Not looking for Work</a>' : ''}
    </div>
    
    <div class="AccBio">
      <p>This is a brief bio about the user. It can include information about their interests, background, and more.</p>
    </div>
    <br>
    <div id="AccSocials">
       <ul>
        ${getSocialLinks()}
       </ul>
    </div>

  `;
  // Wire the Account Settings cog to open the Settings tab
  const accSettingsLink = estProfileSideBar.querySelector(
    '#AccSettings a[data-tab="settings"]'
  );
  if (accSettingsLink) {
    accSettingsLink.addEventListener("click", (e) => {
      e.preventDefault();
      if (window.showPanelByName) window.showPanelByName("settings");
      else location.hash = "#settings";
    });
  }
  // <div id="AccName">User Info</div>
  //  <div id="AccUserName">Details about the user can go here.</div>
  //
  // Determine if the viewing user is the owner of this profile (client-side hint).
  // If .Main.profile has data-profile-owner="false", treat as non-owner and hide Likes.
  const profileContainer = document.querySelector(".Main.profile");
  const isProfileOwner =
    !profileContainer ||
    profileContainer.getAttribute("data-profile-owner") !== "false";

  if (!isProfileOwner) {
    if (likesTab) likesTab.style.display = "none";
    if (likesPanel) {
      likesPanel.hidden = true;
      likesPanel.style.display = "none";
    }
  }

  if (
    featuredTab &&
    allTab &&
    likesTab &&
    featuredPanel &&
    allPanel &&
    likesPanel &&
    featuredGallery &&
    allGallery &&
    likesGallery
  ) {
    let allImages = [];
    let featuredImages = [];
    // likes are a subset of allImages by id
    let likedImages = [];

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

    function getLikedIds() {
      try {
        const raw = localStorage.getItem("psLikedImageIds");
        const arr = raw ? JSON.parse(raw) : [];
        if (Array.isArray(arr))
          return arr.map((v) => Number(v)).filter((n) => Number.isFinite(n));
      } catch (e) {}
      return [];
    }

    function renderLikes() {
      if (!isProfileOwner || !likesGallery) return;
      likesGallery.setAttribute("aria-busy", "true");
      const likedIds = new Set(getLikedIds());
      likedImages = allImages.filter((img) => likedIds.has(Number(img.id)));
      if (!likedImages.length) {
        likesGallery.innerHTML =
          '<p style="padding:1rem;color:#aaa;">No liked images yet.</p>';
      } else {
        likesGallery.innerHTML = likedImages.map(figureTemplate).join("");
        attachFigureHandlers(likesGallery);
      }
      likesGallery.setAttribute("aria-busy", "false");
    }

    async function loadProfileImages() {
      try {
        const data = window.getImagesManifest
          ? await window.getImagesManifest()
          : (
              await (
                await fetch("../data/images.json", { cache: "no-store" })
              ).json()
            ).images || [];
        allImages = Array.isArray(data) ? data : [];
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
        renderLikes();
      } catch (e) {
        console.error("Failed to load profile images", e);
        featuredGallery.innerHTML =
          '<p style="padding:1rem;color:#f66;">Failed to load images.</p>';
        allGallery.innerHTML =
          '<p style="padding:1rem;color:#f66;">Failed to load images.</p>';
        likesGallery.innerHTML =
          '<p style="padding:1rem;color:#f66;">Failed to load images.</p>';
      }
    }

    function setTabState(activeBtn, ...inactiveBtns) {
      activeBtn.classList.add("active");
      activeBtn.setAttribute("aria-selected", "true");
      inactiveBtns.forEach((btn) => {
        btn.classList.remove("active");
        btn.setAttribute("aria-selected", "false");
      });
    }

    function activateTab(which) {
      if (which === "featured") {
        if (isProfileOwner && likesTab)
          setTabState(featuredTab, allTab, likesTab);
        else setTabState(featuredTab, allTab);
        featuredPanel.hidden = false;
        allPanel.hidden = true;
        if (likesPanel) likesPanel.hidden = true;
      } else if (which === "all") {
        if (isProfileOwner && likesTab)
          setTabState(allTab, featuredTab, likesTab);
        else setTabState(allTab, featuredTab);
        featuredPanel.hidden = true;
        allPanel.hidden = false;
        if (likesPanel) likesPanel.hidden = true;
      } else if (
        which === "likes" &&
        isProfileOwner &&
        likesTab &&
        likesPanel
      ) {
        setTabState(likesTab, featuredTab, allTab);
        featuredPanel.hidden = true;
        allPanel.hidden = true;
        likesPanel.hidden = false;
        // ensure likes are fresh when opening
        renderLikes();
      }
    }

    featuredTab.addEventListener("click", () => activateTab("featured"));
    allTab.addEventListener("click", () => activateTab("all"));
    if (isProfileOwner && likesTab) {
      likesTab.addEventListener("click", () => activateTab("likes"));
    }
    featuredTab.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        allTab.focus();
        activateTab("all");
      } else if (e.key === "ArrowLeft" && isProfileOwner && likesTab) {
        e.preventDefault();
        likesTab.focus();
        activateTab("likes");
      }
    });
    allTab.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        featuredTab.focus();
        activateTab("featured");
      } else if (e.key === "ArrowRight" && isProfileOwner && likesTab) {
        e.preventDefault();
        likesTab.focus();
        activateTab("likes");
      }
    });
    if (isProfileOwner && likesTab) {
      likesTab.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          allTab.focus();
          activateTab("all");
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          featuredTab.focus();
          activateTab("featured");
        }
      });
    }

    // Re-render likes when storage changes (e.g., likes toggled elsewhere)
    window.addEventListener("storage", (ev) => {
      if (ev.key === "psLikedImageIds") {
        renderLikes();
      }
    });

    // Expose a small helper to update likes programmatically
    window.updateProfileLikes = function (ids) {
      try {
        localStorage.setItem("psLikedImageIds", JSON.stringify(ids));
      } catch (e) {}
      renderLikes();
    };

    // Lazy init for Profile tab
    let profileInitialized = false;
    function ensureProfileInitialized() {
      if (profileInitialized) return;
      profileInitialized = true;
      loadProfileImages();
    }

    // Initialize if profile panel is already visible on load
    const profilePanel = document.querySelector(".Main.profile");
    const isProfileVisible =
      profilePanel && getComputedStyle(profilePanel).display !== "none";
    if (isProfileVisible) ensureProfileInitialized();

    // Or wait for tab activation
    document.addEventListener("tab:activate", (e) => {
      if (e.detail?.name === "profile") ensureProfileInitialized();
    });
  }
});
