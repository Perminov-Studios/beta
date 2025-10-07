/* =====================================================================
 * PRIVACY POLICY TAB JAVASCRIPT
 * Privacy policy page functionality and interactions
 * ===================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  // Add smooth scrolling for table of contents or section links
  const tocLinks = document.querySelectorAll('a[href^="#"]');

  tocLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      const targetId = link.getAttribute("href");
      const targetSection = document.querySelector(targetId);

      if (targetSection) {
        e.preventDefault();
        targetSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });

        // Highlight the section briefly
        highlightSection(targetSection);
      }
    });
  });

  // Create a table of contents if sections exist
  createTableOfContents();

  // Add reading progress indicator
  addReadingProgress();

  function createTableOfContents() {
    const sections = document.querySelectorAll(".privacy-section h2");
    if (sections.length === 0) return;

    const tocContainer = document.createElement("div");
    tocContainer.className = "table-of-contents";
    tocContainer.innerHTML = `
      <h3>Table of Contents</h3>
      <ul class="toc-list"></ul>
    `;

    // Style the TOC
    Object.assign(tocContainer.style, {
      background: "linear-gradient(145deg, #1a1a1d 0%, #161619 70%)",
      border: "1px solid #2a2a30",
      borderRadius: "12px",
      padding: "20px",
      marginBottom: "30px",
      position: "sticky",
      top: "20px",
      zIndex: "100",
    });

    const tocList = tocContainer.querySelector(".toc-list");

    sections.forEach((section, index) => {
      const sectionId = `section-${index + 1}`;
      section.id = sectionId;

      const listItem = document.createElement("li");
      listItem.innerHTML = `<a href="#${sectionId}">${section.textContent}</a>`;

      listItem.querySelector("a").style.cssText = `
        color: #6daeff;
        text-decoration: none;
        font-size: 14px;
        line-height: 1.6;
        display: block;
        padding: 4px 0;
        transition: color 0.2s;
      `;

      tocList.appendChild(listItem);
    });

    // Insert TOC at the beginning of the privacy container
    const container = document.querySelector(".privacy-container");
    if (container) {
      container.insertBefore(tocContainer, container.firstChild);
    }
  }

  function highlightSection(section) {
    const originalBackground = section.style.background;
    section.style.background =
      "linear-gradient(145deg, #2b2b30 0%, #25252a 70%)";
    section.style.transition = "background 0.5s ease";

    setTimeout(() => {
      section.style.background = originalBackground;
    }, 2000);
  }

  function addReadingProgress() {
    // Create progress bar
    const progressBar = document.createElement("div");
    progressBar.className = "reading-progress";

    Object.assign(progressBar.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "0%",
      height: "3px",
      background: "linear-gradient(90deg, #2b7fff 0%, #6daeff 100%)",
      zIndex: "10000",
      transition: "width 0.2s ease",
    });

    document.body.appendChild(progressBar);

    // Update progress on scroll
    function updateProgress() {
      const container = document.querySelector(".privacy-container");
      if (!container) return;

      const containerTop = container.offsetTop;
      const containerHeight = container.offsetHeight;
      const windowHeight = window.innerHeight;
      const scrollTop = window.scrollY;

      const progress = Math.min(
        100,
        Math.max(
          0,
          ((scrollTop - containerTop + windowHeight) / containerHeight) * 100
        )
      );

      progressBar.style.width = progress + "%";
    }

    window.addEventListener("scroll", updateProgress);
    updateProgress(); // Initial call
  }

  // Add copy to clipboard functionality for important sections
  const highlightElements = document.querySelectorAll(".highlight");

  highlightElements.forEach((element) => {
    element.style.cursor = "pointer";
    element.title = "Click to copy";

    element.addEventListener("click", () => {
      navigator.clipboard
        .writeText(element.textContent)
        .then(() => {
          showTooltip(element, "Copied!");
        })
        .catch(() => {
          showTooltip(element, "Failed to copy");
        });
    });
  });

  function showTooltip(element, message) {
    const tooltip = document.createElement("div");
    tooltip.textContent = message;
    tooltip.className = "copy-tooltip";

    Object.assign(tooltip.style, {
      position: "absolute",
      background: "#18181b",
      color: "white",
      padding: "6px 12px",
      borderRadius: "6px",
      fontSize: "12px",
      zIndex: "10000",
      pointerEvents: "none",
      opacity: "0",
      transition: "opacity 0.2s",
    });

    document.body.appendChild(tooltip);

    const rect = element.getBoundingClientRect();
    tooltip.style.left =
      rect.left + rect.width / 2 - tooltip.offsetWidth / 2 + "px";
    tooltip.style.top = rect.top - tooltip.offsetHeight - 8 + "px";

    setTimeout(() => (tooltip.style.opacity = "1"), 10);

    setTimeout(() => {
      tooltip.style.opacity = "0";
      setTimeout(() => tooltip.remove(), 200);
    }, 2000);
  }

  // Add expand/collapse functionality for long sections
  const longSections = document.querySelectorAll(".privacy-section");

  longSections.forEach((section) => {
    const content = section.querySelector("p, ul");
    if (content && content.scrollHeight > 300) {
      const toggleButton = document.createElement("button");
      toggleButton.textContent = "Read More";
      toggleButton.className = "expand-toggle";

      Object.assign(toggleButton.style, {
        background: "transparent",
        color: "#6daeff",
        border: "1px solid #6daeff",
        padding: "8px 16px",
        borderRadius: "20px",
        cursor: "pointer",
        fontSize: "12px",
        fontWeight: "500",
        marginTop: "10px",
        transition: "all 0.2s",
      });

      // Initially collapse long content
      content.style.maxHeight = "200px";
      content.style.overflow = "hidden";
      content.style.position = "relative";

      // Add fade out effect
      const fadeOverlay = document.createElement("div");
      Object.assign(fadeOverlay.style, {
        position: "absolute",
        bottom: "0",
        left: "0",
        right: "0",
        height: "40px",
        background: "linear-gradient(transparent, #18181b)",
        pointerEvents: "none",
      });
      content.appendChild(fadeOverlay);

      let isExpanded = false;

      toggleButton.addEventListener("click", () => {
        isExpanded = !isExpanded;

        if (isExpanded) {
          content.style.maxHeight = "none";
          fadeOverlay.style.display = "none";
          toggleButton.textContent = "Read Less";
        } else {
          content.style.maxHeight = "200px";
          fadeOverlay.style.display = "block";
          toggleButton.textContent = "Read More";
        }
      });

      section.appendChild(toggleButton);
    }
  });
});
