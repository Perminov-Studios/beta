/* =====================================================================
 * ABOUT US TAB JAVASCRIPT
 * About us page functionality and interactions
 * ===================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  // Add smooth scrolling for any internal links
  const internalLinks = document.querySelectorAll('a[href^="#"]');

  internalLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      const targetId = link.getAttribute("href");
      const targetElement = document.querySelector(targetId);

      if (targetElement) {
        e.preventDefault();
        targetElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
  });

  // Animate team members on scroll (if Intersection Observer is available)
  if ("IntersectionObserver" in window) {
    const teamMembers = document.querySelectorAll(".team-member");

    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0)";
        }
      });
    }, observerOptions);

    teamMembers.forEach((member, index) => {
      // Add initial animation styles
      member.style.opacity = "0";
      member.style.transform = "translateY(20px)";
      member.style.transition = `opacity 0.6s ease ${
        index * 0.1
      }s, transform 0.6s ease ${index * 0.1}s`;

      observer.observe(member);
    });
  }

  // Add hover effect for interactive elements
  const aboutSections = document.querySelectorAll(".about-section");

  aboutSections.forEach((section) => {
    section.addEventListener("mouseenter", () => {
      section.style.transform = "translateY(-2px)";
    });

    section.addEventListener("mouseleave", () => {
      section.style.transform = "translateY(0)";
    });
  });

  // Handle contact form if present
  const contactForm = document.getElementById("aboutContactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();

      // Get form data
      const formData = new FormData(contactForm);
      const data = {};

      for (let [key, value] of formData.entries()) {
        data[key] = value;
      }

      console.log("About contact form submitted:", data);

      // Show success message
      showMessage(
        "Thank you for your interest! We'll get back to you soon.",
        "success"
      );

      // Reset form
      contactForm.reset();
    });
  }

  // Utility function to show messages
  function showMessage(text, type = "info") {
    const message = document.createElement("div");
    message.className = `message message-${type}`;
    message.textContent = text;

    Object.assign(message.style, {
      position: "fixed",
      top: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      padding: "12px 24px",
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

    document.body.appendChild(message);

    setTimeout(() => (message.style.opacity = "1"), 10);

    setTimeout(() => {
      message.style.opacity = "0";
      setTimeout(() => message.remove(), 300);
    }, 4000);
  }
});
