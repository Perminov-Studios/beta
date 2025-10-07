/* =====================================================================
 * SETTINGS TAB JAVASCRIPT
 * Settings functionality and interactions
 * ===================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  // Initialize toggle switches
  const toggles = document.querySelectorAll(".toggle-switch");

  toggles.forEach((toggle) => {
    toggle.addEventListener("click", () => {
      toggle.classList.toggle("active");

      // You can add specific settings logic here
      const settingName = toggle
        .closest(".setting-item")
        ?.querySelector(".setting-label")?.textContent;
      const isActive = toggle.classList.contains("active");

      console.log(`${settingName}: ${isActive ? "enabled" : "disabled"}`);

      // Save to localStorage or send to server
      if (settingName) {
        try {
          localStorage.setItem(
            `setting_${settingName.toLowerCase().replace(/\s+/g, "_")}`,
            isActive
          );
        } catch (e) {
          console.warn("Unable to save setting to localStorage");
        }
      }
    });
  });

  // Load saved settings from localStorage
  toggles.forEach((toggle) => {
    const settingName = toggle
      .closest(".setting-item")
      ?.querySelector(".setting-label")?.textContent;
    if (settingName) {
      try {
        const saved = localStorage.getItem(
          `setting_${settingName.toLowerCase().replace(/\s+/g, "_")}`
        );
        if (saved === "true") {
          toggle.classList.add("active");
        }
      } catch (e) {
        console.warn("Unable to load setting from localStorage");
      }
    }
  });

  // Handle form submissions if any
  const settingsForm = document.getElementById("settingsForm");
  if (settingsForm) {
    settingsForm.addEventListener("submit", (e) => {
      e.preventDefault();

      // Collect all form data
      const formData = new FormData(settingsForm);
      const settings = {};

      for (let [key, value] of formData.entries()) {
        settings[key] = value;
      }

      console.log("Settings saved:", settings);

      // You would typically send this to your server
      // Or save to localStorage for demo purposes
      try {
        localStorage.setItem("userSettings", JSON.stringify(settings));

        // Show success message
        showNotification("Settings saved successfully!", "success");
      } catch (e) {
        showNotification("Failed to save settings", "error");
      }
    });
  }

  // Utility function to show notifications
  function showNotification(message, type = "info") {
    // Create notification element
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Style the notification
    Object.assign(notification.style, {
      position: "fixed",
      top: "20px",
      right: "20px",
      padding: "12px 20px",
      borderRadius: "8px",
      color: "white",
      backgroundColor:
        type === "success"
          ? "#4ade80"
          : type === "error"
          ? "#ef4444"
          : "#3b82f6",
      zIndex: "10000",
      opacity: "0",
      transition: "opacity 0.3s",
    });

    document.body.appendChild(notification);

    // Fade in
    setTimeout(() => {
      notification.style.opacity = "1";
    }, 10);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.opacity = "0";
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
});
