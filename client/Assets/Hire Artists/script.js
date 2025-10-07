/* =====================================================================
 * HIRE ARTISTS TAB JAVASCRIPT
 * Hire artists page functionality and interactions
 * ===================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  // Handle hire button clicks
  const hireButtons = document.querySelectorAll(".hire-btn");

  hireButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      const artistCard = button.closest(".artist-card");
      const artistName = artistCard.querySelector("h3").textContent;

      // Add loading state
      const originalText = button.textContent;
      button.textContent = "Processing...";
      button.disabled = true;

      // Simulate API call
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;

        showNotification(
          `Request sent to ${artistName}! They will contact you soon.`,
          "success"
        );

        // You would typically send this to your server
        console.log("Hire request sent for:", artistName);
      }, 1500);
    });
  });

  // Add filter functionality for artists
  const filterButtons = document.querySelectorAll(".filter-btn");
  const artistCards = document.querySelectorAll(".artist-card");

  if (filterButtons.length > 0) {
    filterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        // Remove active class from all buttons
        filterButtons.forEach((btn) => btn.classList.remove("active"));
        // Add active class to clicked button
        button.classList.add("active");

        const filterValue = button.getAttribute("data-filter");

        artistCards.forEach((card) => {
          if (
            filterValue === "all" ||
            card.getAttribute("data-specialty") === filterValue
          ) {
            card.style.display = "block";
            card.style.opacity = "1";
            card.style.transform = "scale(1)";
          } else {
            card.style.opacity = "0";
            card.style.transform = "scale(0.8)";
            setTimeout(() => {
              if (card.style.opacity === "0") {
                card.style.display = "none";
              }
            }, 300);
          }
        });
      });
    });
  }

  // Add sorting functionality
  const sortSelect = document.getElementById("artistSort");
  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      const sortValue = sortSelect.value;
      const artistGrid = document.querySelector(".artist-grid");
      const cards = Array.from(artistCards);

      cards.sort((a, b) => {
        switch (sortValue) {
          case "name":
            const nameA = a.querySelector("h3").textContent;
            const nameB = b.querySelector("h3").textContent;
            return nameA.localeCompare(nameB);

          case "rating":
            const ratingA = parseFloat(a.getAttribute("data-rating") || "0");
            const ratingB = parseFloat(b.getAttribute("data-rating") || "0");
            return ratingB - ratingA;

          case "price":
            const priceA = parseFloat(a.getAttribute("data-price") || "0");
            const priceB = parseFloat(b.getAttribute("data-price") || "0");
            return priceA - priceB;

          default:
            return 0;
        }
      });

      // Remove all cards and re-append in sorted order
      cards.forEach((card) => card.remove());
      cards.forEach((card) => artistGrid.appendChild(card));
    });
  }

  // Add hover animations to artist cards
  artistCards.forEach((card) => {
    card.addEventListener("mouseenter", () => {
      const img = card.querySelector(".artist-info img");
      if (img) {
        img.style.transform = "scale(1.1) rotate(5deg)";
      }
    });

    card.addEventListener("mouseleave", () => {
      const img = card.querySelector(".artist-info img");
      if (img) {
        img.style.transform = "scale(1) rotate(0deg)";
      }
    });
  });

  // Handle contact artist functionality
  const contactButtons = document.querySelectorAll(".contact-artist-btn");

  contactButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const artistCard = button.closest(".artist-card");
      const artistName = artistCard.querySelector("h3").textContent;

      // Open contact modal or form
      showContactModal(artistName);
    });
  });

  function showContactModal(artistName) {
    // Create modal HTML
    const modal = document.createElement("div");
    modal.className = "contact-modal";
    modal.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content">
          <h3>Contact ${artistName}</h3>
          <form id="artistContactForm">
            <div class="form-group">
              <label>Your Name</label>
              <input type="text" name="name" required>
            </div>
            <div class="form-group">
              <label>Email</label>
              <input type="email" name="email" required>
            </div>
            <div class="form-group">
              <label>Project Description</label>
              <textarea name="message" rows="4" required></textarea>
            </div>
            <div class="form-actions">
              <button type="button" class="cancel-btn">Cancel</button>
              <button type="submit" class="send-btn">Send Message</button>
            </div>
          </form>
        </div>
      </div>
    `;

    // Style the modal
    Object.assign(modal.style, {
      position: "fixed",
      top: "0",
      left: "0",
      right: "0",
      bottom: "0",
      zIndex: "10000",
    });

    document.body.appendChild(modal);

    // Handle modal events
    const overlay = modal.querySelector(".modal-overlay");
    const cancelBtn = modal.querySelector(".cancel-btn");
    const form = modal.querySelector("#artistContactForm");

    function closeModal() {
      modal.remove();
    }

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal();
    });

    cancelBtn.addEventListener("click", closeModal);

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const formData = new FormData(form);
      const data = {};
      for (let [key, value] of formData.entries()) {
        data[key] = value;
      }

      console.log("Contact message sent:", { artist: artistName, ...data });

      closeModal();
      showNotification(`Message sent to ${artistName}!`, "success");
    });
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
});
