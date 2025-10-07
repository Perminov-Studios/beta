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

signUpButton.addEventListener("click", () => {
  container.classList.add("right-panel-active");

  createAccount.style.borderLeft = "4px solid #004743"; // red
  createAccount.style.borderRight = "0px solid #00474300"; // blue

  signIntoAccount.style.borderLeft = "2px solid #004743"; // green
  signIntoAccount.style.borderRight = "2px solid #004743"; // yellow
});

signInButton.addEventListener("click", () => {
  container.classList.remove("right-panel-active");

  createAccount.style.borderLeft = "0px solid #00474300"; // red
  createAccount.style.borderRight = "2px solid #004743"; // blue

  signIntoAccount.style.borderLeft = "0px solid #00474300"; // green
  signIntoAccount.style.borderRight = "4px solid #004743"; // yellow
});

// Toggle root data-theme attribute between two dark variants.
function toggleDarkVariant() {
  const el = document.documentElement;
  const current = el.getAttribute("data-theme") || "dark";
  el.setAttribute("data-theme", current === "dark" ? "my-dark" : "dark");
}

(function () {
  document.addEventListener("DOMContentLoaded", () => {
    const formIds = ["createAccount", "signIntoAccount"];

    function showAlert(form, type, message) {
      const err = form.querySelector(".alert.alert-error");
      const ok = form.querySelector(".alert.alert-success");
      if (type === "error") {
        if (err) {
          err.querySelector("span").textContent = message;
          err.classList.remove("hide");
        }
        if (ok) ok.classList.add("hide");
      } else {
        if (ok) {
          ok.querySelector("span").textContent = message;
          ok.classList.remove("hide");
        }
        if (err) err.classList.add("hide");
      }
    }

    formIds.forEach((id) => {
      const form = document.getElementById(id);
      if (!form) return;

      // ensure alerts start hidden
      const err = form.querySelector(".alert.alert-error");
      const ok = form.querySelector(".alert.alert-success");
      if (err) err.classList.add("hide");
      if (ok) ok.classList.add("hide");

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

        // custom validation
        const inputs = form.querySelectorAll("input");
        for (const input of inputs) {
          if (!input.value.trim()) {
            showAlert(form, "error", `${input.placeholder} cannot be empty.`);
            input.focus();
            return;
          }

          if (input.type === "email" && !input.value.includes("@")) {
            showAlert(form, "error", "Please enter a valid email address.");
            input.focus();
            return;
          }

          if (
            input.type === "password" &&
            !/(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}/.test(input.value)
          ) {
            showAlert(
              form,
              "error",
              "Password must be at least 8 characters long, include a number, a lowercase letter, and an uppercase letter."
            );
            input.focus();
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
          } else {
            showAlert(form, "success", "Login successful.");
          }
        }, 900);
      });
    });
  });
})();
