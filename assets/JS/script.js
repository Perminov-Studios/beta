/** =====================================================================
 * AUTH PAGE SCRIPT (script.js)
 * ---------------------------------------------------------------------
 * Handles:
 *   - Sliding panel animation (create vs sign in) via class toggle.
 *   - Dynamic border accent adjustments for form sides.
 *   - Simple client-side form validation & feedback alerts.
 *   - Theme variant toggle (dark / my-dark) helper.
 *
 * Design Choices:
 *   - Avoided external validation libs; uses minimal inline checks.
 *   - Each form's alerts are hidden by adding 'hide' class; reused DOM.
 *   - submit buttons are disabled until all inputs are non-empty.
 *
 * Future Ideas:
 *   - Extract validation rules into a schema object.
 *   - Add strength meter for password field.
 *   - Persist partial form data in sessionStorage to survive reloads.
 * ===================================================================== */

const signUpButton = document.getElementById("signUp");
const signInButton = document.getElementById("signIn");
const container = document.getElementById("container");
const createAccount = document.getElementById("createAccount");
const signIntoAccount = document.getElementById("signIntoAccount");

// Guard: only wire these handlers on pages that have both forms (login page)
if (
  signUpButton &&
  signInButton &&
  container &&
  createAccount &&
  signIntoAccount
) {
  signUpButton.addEventListener("click", () => {
    container.classList.add("right-panel-active");

    createAccount.style.borderLeft = "4px solid #1ed760"; // red
    createAccount.style.borderRight = "0px solid #00474300"; // blue

    signIntoAccount.style.borderLeft = "2px solid #1ed760"; // green
    signIntoAccount.style.borderRight = "2px solid #1ed760"; // yellow
  });

  signInButton.addEventListener("click", () => {
    container.classList.remove("right-panel-active");

    createAccount.style.borderLeft = "0px solid #00474300"; // red
    createAccount.style.borderRight = "2px solid #1ed760"; // blue

    signIntoAccount.style.borderLeft = "0px solid #00474300"; // green
    signIntoAccount.style.borderRight = "4px solid #1ed760"; // yellow
  });
}

// Toggle root data-theme attribute between two dark variants.
function toggleDarkVariant() {
  const el = document.documentElement;
  const current = el.getAttribute("data-theme") || "dark";
  el.setAttribute("data-theme", current === "dark" ? "my-dark" : "dark");
}

(function () {
  function initAuthForms() {
    const formIds = ["createAccount", "signIntoAccount", "resetPasswordForm"];

    // Toast manager for top-right stacked notifications
    const ToastManager = (function () {
      const hostContainers = new WeakMap();
      function ensureContainer(hostEl) {
        // If a specific host (like an open dialog) is provided, mount inside it; otherwise body
        const host = hostEl || document.body;
        let container =
          hostContainers.get(host) || host.querySelector(".toast-container");
        if (!container) {
          container = document.createElement("div");
          container.className = "toast-container";
          host.appendChild(container);
        }
        hostContainers.set(host, container);
        return container;
      }
      function show({
        type = "success",
        message = "",
        duration = 3000,
        host: hostEl,
      } = {}) {
        const host = ensureContainer(hostEl);
        const toast = document.createElement("div");
        toast.className = `toast toast-${type}`;

        const icon = document.createElement("span");
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = type === "error" ? "❌" : "";

        const text = document.createElement("div");
        text.textContent = message;

        const btn = document.createElement("button");
        btn.className = "close";
        btn.type = "button";
        btn.setAttribute("aria-label", "Dismiss notification");
        btn.textContent = "✕";

        toast.appendChild(icon);
        toast.appendChild(text);
        toast.appendChild(btn);
        host.appendChild(toast);

        // Trigger CSS transition
        requestAnimationFrame(() => toast.classList.add("show"));

        let tId;
        function remove() {
          if (tId) clearTimeout(tId);
          toast.classList.remove("show");
          setTimeout(
            () => host.contains(toast) && host.removeChild(toast),
            250
          );
        }
        btn.addEventListener("click", remove);
        if (duration > 0) tId = setTimeout(remove, duration);
        return { remove };
      }
      return { show };
    })();

    function attachAlertControls(alertEl, autoHideMs) {
      if (!alertEl) return;
      // Ensure a close button exists
      let closeBtn = alertEl.querySelector(".close");
      if (!closeBtn) {
        closeBtn = document.createElement("button");
        closeBtn.type = "button";
        closeBtn.className = "close";
        closeBtn.setAttribute("aria-label", "Dismiss");
        closeBtn.textContent = "✕";
        alertEl.appendChild(closeBtn);
      }
      // Wire close button
      closeBtn.onclick = function () {
        alertEl.classList.add("hide");
        if (alertEl._timeoutId) {
          clearTimeout(alertEl._timeoutId);
          alertEl._timeoutId = null;
        }
      };
      // Auto hide after a delay
      if (autoHideMs && autoHideMs > 0) {
        if (alertEl._timeoutId) clearTimeout(alertEl._timeoutId);
        alertEl._timeoutId = setTimeout(() => {
          alertEl.classList.add("hide");
          alertEl._timeoutId = null;
        }, autoHideMs);
      }
    }

    function showAlert(form, type, message) {
      // Hide inline alerts if present to avoid duplication
      const err = form.querySelector(".alert.alert-error");
      const ok = form.querySelector(".alert.alert-success");
      if (err) err.classList.add("hide");
      if (ok) ok.classList.add("hide");

      // Show toast notification
      const hostDialog = form.closest("dialog[open]");
      try {
        ToastManager.show({
          type: type === "error" ? "error" : "success",
          message,
          duration: type === "error" ? 5000 : 3000,
          host: hostDialog || undefined,
        });
      } catch (e) {
        // As a last resort, fallback to a simple alert so UX continues
        if (typeof console !== "undefined" && console.error) console.error(e);
      }
    }

    // Add password visibility toggles to all password inputs
    function initPasswordToggles(root = document) {
      const pwInputs = root.querySelectorAll('input[type="password"]');
      pwInputs.forEach((input) => {
        // Avoid duplicating toggle
        const wrapper = input.closest(".validator") || input.parentElement;
        if (!wrapper || wrapper.querySelector(".pw-toggle")) return;
        wrapper.classList.add("has-toggle");

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "pw-toggle";
        btn.setAttribute("aria-label", "Show password");
        btn.innerHTML =
          '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.7" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>';
        btn.addEventListener("click", () => {
          const isHidden = input.type === "password";
          input.type = isHidden ? "text" : "password";
          btn.setAttribute(
            "aria-label",
            isHidden ? "Hide password" : "Show password"
          );
          btn.innerHTML = isHidden
            ? '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.7" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c1.51 0 2.945-.278 4.243-.785M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.5a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243L9.88 9.88"/></svg>'
            : '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.7" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>';
          input.focus();
          // Move caret to end on reveal
          try {
            const v = input.value;
            input.value = "";
            input.value = v;
          } catch (_) {}
        });
        wrapper.appendChild(btn);
      });
    }

    // Initialize password toggles immediately for current document/root
    initPasswordToggles(document);

    formIds.forEach((id) => {
      const form = document.getElementById(id);
      if (!form) return;

      // ensure alerts start hidden and closable
      const err = form.querySelector(".alert.alert-error");
      const ok = form.querySelector(".alert.alert-success");
      if (err) err.classList.add("hide");
      if (ok) ok.classList.add("hide");
      attachAlertControls(err);
      attachAlertControls(ok);

      const submitBtn = form.querySelector(
        'button[type="submit"], button.button'
      );
      const spinner = form.querySelector(".loading");

      // Disable submit button initially
      if (submitBtn) submitBtn.disabled = true;

      // Enable/disable submit button based on form validity
      form.addEventListener("input", () => {
        const inputs = form.querySelectorAll("input");
        let allFilled = true;

        inputs.forEach((input) => {
          if (!input.value.trim()) {
            allFilled = false;
          }
        });

        submitBtn.disabled = !allFilled;

        if (err) err.classList.add("hide");
        if (ok) ok.classList.add("hide");
      });

      form.addEventListener("submit", (e) => {
        e.preventDefault();

        // hide previous alerts
        if (err) err.classList.add("hide");
        if (ok) ok.classList.add("hide");

        // custom validation (mirror HTML constraints but handle messages via toasts)
        const inputs = form.querySelectorAll("input");
        for (const input of inputs) {
          const val = input.value.trim();
          const label = input.placeholder || input.name || input.id || "Field";

          // required
          if (input.hasAttribute("required") && !val) {
            showAlert(form, "error", `${label} is required.`);
            input.focus();
            return;
          }

          // type=email
          if (input.type === "email" && val) {
            const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRe.test(val)) {
              showAlert(form, "error", "Please enter a valid email address.");
              input.focus();
              return;
            }
          }

          // minlength
          const minLenAttr = input.getAttribute("minlength");
          if (minLenAttr && val.length < parseInt(minLenAttr, 10)) {
            showAlert(
              form,
              "error",
              `${label} must be at least ${minLenAttr} characters.`
            );
            input.focus();
            return;
          }

          // maxlength
          const maxLenAttr = input.getAttribute("maxlength");
          if (maxLenAttr && val.length > parseInt(maxLenAttr, 10)) {
            showAlert(
              form,
              "error",
              `${label} must be at most ${maxLenAttr} characters.`
            );
            input.focus();
            return;
          }

          // pattern
          const patternAttr = input.getAttribute("pattern");
          if (patternAttr && val) {
            let pat;
            try {
              pat = new RegExp(patternAttr);
            } catch (_) {}
            if (pat && !pat.test(val)) {
              const titleMsg =
                input.getAttribute("title") ||
                "Please match the requested format.";
              showAlert(form, "error", titleMsg);
              input.focus();
              return;
            }
          }
        }

        // Additional cross-field validation (e.g., password match)
        if (id === "resetPasswordForm") {
          const pw = form.querySelector("#newPassword");
          const cpw = form.querySelector("#confirmPassword");
          if (pw && cpw && pw.value.trim() !== cpw.value.trim()) {
            showAlert(form, "error", "Passwords do not match.");
            cpw.focus();
            return;
          }
        }

        // simulate server processing
        if (submitBtn) submitBtn.disabled = true;
        if (spinner) spinner.classList.remove("hide");

        setTimeout(() => {
          if (spinner) spinner.classList.add("hide");
          if (submitBtn) submitBtn.disabled = false;

          if (id === "createAccount") {
            showAlert(
              form,
              "success",
              "Check your email for a confirmation link."
            );
            form.reset();
          } else if (id === "signIntoAccount") {
            showAlert(form, "success", "Login successful.");
          } else if (id === "resetPasswordForm") {
            showAlert(
              form,
              "success",
              "Password updated. Redirecting to login..."
            );
            form.reset();
            // Redirect back to login after a short delay so the toast is visible
            setTimeout(() => {
              try {
                window.location.href = "login.html";
              } catch (_) {}
            }, 4000);
          }
        }, 900);
      });
    });
  }

  function initAll() {
    initAuthForms();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
})();
