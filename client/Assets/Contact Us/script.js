/* =====================================================================
 * CONTACT US TAB JAVASCRIPT
 * Contact form functionality and interactions
 * ===================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  // Handle main contact form
  const contactForm = document.getElementById("mainContactForm");

  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();

      // Get form data
      const formData = new FormData(contactForm);
      const data = {};

      for (let [key, value] of formData.entries()) {
        data[key] = value;
      }

      // Validate required fields
      const requiredFields = ["name", "email", "subject", "message"];
      const missingFields = requiredFields.filter(
        (field) => !data[field] || data[field].trim() === ""
      );

      if (missingFields.length > 0) {
        showNotification(
          `Please fill in all required fields: ${missingFields.join(", ")}`,
          "error"
        );
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        showNotification("Please enter a valid email address", "error");
        return;
      }

      // Show loading state
      const submitBtn = contactForm.querySelector(".submit-btn");
      const originalText = submitBtn.textContent;
      submitBtn.textContent = "Sending...";
      submitBtn.disabled = true;

      // Simulate API call
      setTimeout(() => {
        console.log("Contact form submitted:", data);

        // Reset form and button
        contactForm.reset();
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;

        showNotification(
          "Thank you for your message! We'll get back to you within 24 hours.",
          "success"
        );

        // You would typically send this to your server here
        // fetch('/api/contact', { method: 'POST', body: formData })
      }, 2000);
    });
  }

  // Add real-time form validation
  const formInputs = document.querySelectorAll(
    ".form-input, .form-textarea, .form-select"
  );

  formInputs.forEach((input) => {
    input.addEventListener("blur", () => {
      validateField(input);
    });

    input.addEventListener("input", () => {
      clearFieldError(input);
    });
  });

  function validateField(field) {
    const value = field.value.trim();
    const fieldName = field.name;
    let isValid = true;
    let errorMessage = "";

    // Clear previous errors
    clearFieldError(field);

    // Required field check
    if (field.hasAttribute("required") && !value) {
      isValid = false;
      errorMessage = `${getFieldLabel(fieldName)} is required`;
    }

    // Email validation
    if (fieldName === "email" && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        isValid = false;
        errorMessage = "Please enter a valid email address";
      }
    }

    // Phone validation (if phone field exists)
    if (fieldName === "phone" && value) {
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      if (!phoneRegex.test(value)) {
        isValid = false;
        errorMessage = "Please enter a valid phone number";
      }
    }

    if (!isValid) {
      showFieldError(field, errorMessage);
    }

    return isValid;
  }

  function showFieldError(field, message) {
    field.style.borderColor = "#ef4444";

    // Remove existing error message
    const existingError = field.parentNode.querySelector(".field-error");
    if (existingError) {
      existingError.remove();
    }

    // Add new error message
    const errorDiv = document.createElement("div");
    errorDiv.className = "field-error";
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
      color: #ef4444;
      font-size: 12px;
      margin-top: 4px;
      display: block;
    `;

    field.parentNode.appendChild(errorDiv);
  }

  function clearFieldError(field) {
    field.style.borderColor = "";
    const errorDiv = field.parentNode.querySelector(".field-error");
    if (errorDiv) {
      errorDiv.remove();
    }
  }

  function getFieldLabel(fieldName) {
    const labelElement =
      document.querySelector(`label[for="${fieldName}"]`) ||
      document
        .querySelector(`[name="${fieldName}"]`)
        .closest(".form-group")
        .querySelector(".form-label");
    return labelElement
      ? labelElement.textContent.replace("*", "").trim()
      : fieldName;
  }

  // Add character counter for textarea
  const messageTextarea = document.querySelector('textarea[name="message"]');
  if (messageTextarea) {
    const maxLength = 500;
    messageTextarea.setAttribute("maxlength", maxLength);

    const counter = document.createElement("div");
    counter.className = "char-counter";
    counter.style.cssText = `
      text-align: right;
      font-size: 12px;
      color: #9b9ba1;
      margin-top: 4px;
    `;

    messageTextarea.parentNode.appendChild(counter);

    function updateCounter() {
      const remaining = maxLength - messageTextarea.value.length;
      counter.textContent = `${remaining} characters remaining`;

      if (remaining < 50) {
        counter.style.color = "#f59e0b";
      } else if (remaining < 20) {
        counter.style.color = "#ef4444";
      } else {
        counter.style.color = "#9b9ba1";
      }
    }

    messageTextarea.addEventListener("input", updateCounter);
    updateCounter(); // Initial count
  }

  // Add smooth scrolling to contact info sections
  const infoCards = document.querySelectorAll(".info-card");

  infoCards.forEach((card) => {
    card.addEventListener("click", () => {
      const cardType = card
        .querySelector(".info-title")
        .textContent.toLowerCase();

      if (cardType.includes("email")) {
        window.location.href = "mailto:contact@example.com";
      } else if (cardType.includes("phone")) {
        window.location.href = "tel:+1234567890";
      } else if (cardType.includes("address")) {
        window.open("https://maps.google.com/?q=Your+Address", "_blank");
      }
    });
  });

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
      maxWidth: "400px",
    });

    document.body.appendChild(notification);

    setTimeout(() => (notification.style.opacity = "1"), 10);
    setTimeout(() => {
      notification.style.opacity = "0";
      setTimeout(() => notification.remove(), 300);
    }, 4000);
  }
});
