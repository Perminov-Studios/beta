/* ============================================================================
   PERMINOV STUDIOS - MODAL & NAVIGATION SYSTEM
   ============================================================================
   
   Version: 3.0
   Last Updated: February 2026
   
   This file handles:
   - Modal open/close system (data-open-modal, data-close, etc.)
   - Nested/child modals (data-open-child, data-close-child)
   - Backdrop click handling
   - Escape key handling
   - Checkout flow step navigation
   - Settings subview navigation
   - Lenis scroll integration with modals
   
   USAGE:
   - Add data-open-modal="modal-id" to open a modal
   - Add data-close to close the nearest modal
   - Add data-open-child="child-id" for nested modals
   
   ============================================================================ */

/* ============================================================================
   MODAL SYSTEM INITIALIZATION
   ============================================================================ */

// Wait for document ready (jQuery)
$(function () {
  
  /* ==========================================================================
     HELPER FUNCTIONS
     ========================================================================== */
  
  /**
   * Reset all nested modals inside a main modal
   * Called when closing a modal to ensure clean state
   * @param {jQuery} $modal - The modal element to reset
   */
  function resetNestedModals($modal) {
    const modalId = $modal.attr('data-modal-id');
    
    // Close all nested edit modals (e.g., .ep-edit-modal.active)
    $modal.find('.ep-edit-modal.active').removeClass('active');
    
    // Reset overflow on ep-content
    $modal.find('.ep-content').css('overflow', '');
    
    // Reset category modal form
    if (modalId === 'edit-portfolio') {
      // Reset category modal
      $('#epCategoryModalTitle').text('Create Category');
      $('#epCategoryModalActionText').text('Create');
      $('#epNewCategoryName').val('');
      $('#epEditingCategoryId').val('');
      $('#epDeleteCategoryBtn').hide();
      
      // Reset icon picker to default (photo)
      $('.ep-icon-option').removeClass('active');
      $('.ep-icon-option[data-icon="photo"]').addClass('active');
      
      // Reset Add Image modal
      $('#epAddTitle').val('');
      $('#epAddDescription').val('');
      $('#epAddReplaceInput').val('');
      $('#epAddPreviewImg').attr('src', '').removeData('full-src').hide();
      $('#epAddPreviewPlaceholder').show();
      
      // Reset Edit modal
      $('#epEditTitle').val('');
      $('#epEditDescription').val('');
      $('#epEditCategory').val('');
      $('#epEditTags').val('');
      $('#epEditReplaceInput').val('');
      $('#epEditPreviewImg').attr('src', '').removeData('full-src');
      $('#epEditModal').removeData('originalValues');
      
      // Reset Delete confirmation modal
      $('#epDeleteImagePreview').attr('src', '');
      
      // Trigger custom event for script.js to reset its local state
      $(document).trigger('resetEditPortfolioModals');
    }
  }

  // Open buttons: data-open-modal="id"
  $(document).on("click", "[data-open-modal]", function (e) {
    e.preventDefault();
    const id = $(this).attr("data-open-modal");
    if (!id) return;
    const $modal = $("[data-modal-id='" + id + "']");
    $modal.toggleClass("is-open");

    // Prevent background scrolling when any modal is open
    if ($modal.hasClass("is-open")) {
      $("body").addClass("modal-open");
      // Stop Lenis smooth scroll to prevent background scrolling
      if (typeof lenis !== 'undefined') lenis.stop();
    } else {
      // Modal is being closed via toggle, reset nested modals
      resetNestedModals($modal);
      if ($(".modal.is-open").length === 0) {
        $("body").removeClass("modal-open");
        // Re-enable Lenis smooth scroll
        if (typeof lenis !== 'undefined') lenis.start();
      }
    }
  });

  // Close buttons: data-close
  $(document).on("click", "[data-close]", function (e) {
    e.stopPropagation();
    const $m = $(this).closest(".modal");
    // Reset nested modals before closing
    resetNestedModals($m);
    $m.removeClass("is-open");
    if ($(".modal.is-open").length === 0) {
      $("body").removeClass("modal-open");
      // Re-enable Lenis smooth scroll
      if (typeof lenis !== 'undefined') lenis.start();
    }
  });

  // Open a child dialog inside its parent modal: data-open-child="child-id"
  $(document).on("click", "[data-open-child]", function (e) {
    e.preventDefault();
    const childId = $(this).attr("data-open-child");
    if (!childId) return;

    // find nearest parent modal (open the first ancestor .modal)
    const $parentModal = $(this).closest(".modal");
    if ($parentModal.length === 0) return;

    const $child = $parentModal.find("[data-child-id='" + childId + "']");
    if ($child.length === 0) return;

    // ensure parent is open; if not, open it first then open child after transition
    const openParentThenChild = function () {
      $child.addClass("is-open");
      // ensure body modal lock is active while child is open
      $("body").addClass("modal-open");
    };

    if (!$parentModal.hasClass("is-open")) {
      $parentModal.addClass("is-open");
      // wait for parent fade-in, then open child
      setTimeout(openParentThenChild, 260);
    } else {
      openParentThenChild();
    }
  });

  // Close child dialog: data-close-child
  $(document).on("click", "[data-close-child]", function (e) {
    e.stopPropagation();
    $(this).closest("[data-child-id]").removeClass("is-open");
    if ($(".modal.is-open").length === 0) $("body").removeClass("modal-open");
  });

  // Backdrop click: do not close parent if a child dialog is open
  $(document).on("click", ".modal", function (e) {
    if (e.target === this) {
      // if there's an open child inside this modal, ignore backdrop click
      if ($(this).find(".child-modal.is-open").length) return;
      // Reset nested modals before closing
      resetNestedModals($(this));
      $(this).removeClass("is-open");
      if ($(".modal.is-open").length === 0) {
        $("body").removeClass("modal-open");
        // Re-enable Lenis smooth scroll
        if (typeof lenis !== 'undefined') lenis.start();
      }
    }
  });

  // Escape closes open modals unless a child dialog is open
  $(document).on("keydown", function (e) {
    if (e.key === "Escape") {
      // if any child modal is open, ignore Escape
      if ($(".child-modal.is-open").length) return;
      // Reset nested modals in all open modals before closing
      $(".modal.is-open").each(function() {
        resetNestedModals($(this));
      });
      $(".modal.is-open").removeClass("is-open");
      $("body").removeClass("modal-open");
      // Re-enable Lenis smooth scroll
      if (typeof lenis !== 'undefined') lenis.start();
    }
  });

  // ========== Checkout Functionality ==========
  let currentStep = 1;
  const totalSteps = 4;

  function updateProgress(step) {
    $(".checkout .progress-step").each(function () {
      const s = $(this).data("step");
      $(this).removeClass("active completed");
      if (s < step) $(this).addClass("completed");
      else if (s === step) $(this).addClass("active");
    });

    $(".checkout .progress-line").each(function (i) {
      $(this).toggleClass("filled", i < step - 1);
    });
  }

  // Helper: show a subview inside a settings section
  function showSettingsSubview(section, innerHtml) {
    const $sub = $(`[data-subview="${section}"]`);
    if (!$sub.length) return;
    const content = `
      <div class="settings-subview-inner">
        <div class="settings-subview-header">
          <button class="subview-back">← Back</button>
        </div>
        <div class="settings-subview-body">${innerHtml}</div>
      </div>
    `;
    $sub.html(content).show().attr('aria-hidden','false');
    // Attach password visibility toggles if password inputs exist
    attachPasswordToggles($sub);
    $(`[data-settings-section="${section}"] .settings-card`).hide();
  }

  function closeSettingsSubview(section) {
    const $sub = $(`[data-subview="${section}"]`);
    if (!$sub.length) return;
    $sub.hide().attr('aria-hidden','true').empty();
    $(`[data-settings-section="${section}"] .settings-card`).show();
  }

  // Attach visibility toggles to password fields inside a subview
  function attachPasswordToggles($sub) {
    if (!$sub || $sub.length === 0) return;
    const $body = $sub.find('.settings-subview-body');
    $body.find('input[type="password"]').each(function () {
      const $input = $(this);
      const $wrapper = $input.closest('.password-field');
      if ($wrapper.length === 0) {
        $input.wrap('<div class="password-field"></div>');
      }

      const $field = $input.closest('.password-field');
      // Do not duplicate toggle
      if ($field.find('.password-toggle').length) return;

      const $btn = $(
        '<button type="button" class="password-toggle" aria-label="Toggle password visibility">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"></path>' +
            '<circle cx="12" cy="12" r="3"></circle>' +
          '</svg>' +
        '</button>'
      );

      $field.append($btn);

      $btn.on('click', function (e) {
        e.preventDefault();
        const isVisible = $input.attr('type') === 'text';
        if (isVisible) {
          $input.attr('type', 'password');
          $btn.removeClass('visible');
        } else {
          $input.attr('type', 'text');
          $btn.addClass('visible');
        }
      });
    });
  }

  // Back button handler
  $(document).on('click', '.subview-back', function(){
    const $sub = $(this).closest('.settings-subview');
    const section = $sub.data('subview');
    closeSettingsSubview(section);
  });

  function goToStep(step) {
    const $wrapper = $(".checkout .steps-wrapper");
    const $currentStep = $(".checkout .step.active");
    const $nextStep = $(`.checkout .step[data-step="${step}"]`);

    const currentHeight = $wrapper.height();
    $wrapper.css("height", currentHeight);

    $currentStep.removeClass("active");

    setTimeout(() => {
      $nextStep.css({ visibility: "visible", position: "relative" });
      const newHeight = $nextStep.outerHeight();
      $nextStep.css({ visibility: "", position: "" });

      $wrapper.css("height", newHeight);
      $nextStep.addClass("active");

      setTimeout(() => {
        $wrapper.css("height", "");
      }, 400);
    }, 100);

    currentStep = step;
    updateProgress(step);

    if (step === 1) {
      $("#btnCancel").show();
      $("#btnBack").hide();
      $("#btnNext")
        .text("Continue")
        .removeClass("loading")
        .prop("disabled", false);
    } else if (step === totalSteps) {
      $("#btnCancel").hide();
      $("#btnBack").hide();
      $("#btnNext").text("Done").removeClass("loading").prop("disabled", false);
    } else {
      $("#btnCancel").hide();
      $("#btnBack").show();
      $("#btnNext")
        .text(step === 3 ? "Pay $9.99" : "Continue")
        .removeClass("loading");
    }
  }

  // Reset checkout when opening
  $(document).on("click", "[data-open-child='billing']", function () {
    currentStep = 1;
    $(".checkout .step").removeClass("active");
    $(".checkout .step[data-step='1']").addClass("active");
    updateProgress(1);
    $("#btnCancel").show();
    $("#btnBack").hide();
    $("#btnNext")
      .text("Continue")
      .removeClass("loading")
      .prop("disabled", false);
  });

  // Cancel button closes billing modal
  $(document).on("click", "#btnCancel", function () {
    $("[data-child-id='billing']").removeClass("is-open");
  });

  // Card number formatting
  $(document).on("input", "#cardNumber", function () {
    let val = $(this).val().replace(/\s/g, "").replace(/\D/g, "");
    val = val.substring(0, 16);
    let formatted = val.replace(/(.{4})/g, "$1 ").trim();
    $(this).val(formatted);

    $(".card-brand").removeClass("active");
    if (val.startsWith("4")) {
      $(".card-brand[data-brand='visa']").addClass("active");
    } else if (/^5[1-5]/.test(val) || /^2[2-7]/.test(val)) {
      $(".card-brand[data-brand='mastercard']").addClass("active");
    } else if (/^3[47]/.test(val)) {
      $(".card-brand[data-brand='amex']").addClass("active");
    }
  });

  // Expiry formatting
  $(document).on("input", "#expiry", function () {
    let val = $(this).val().replace(/\D/g, "");
    if (val.length >= 2) {
      val = val.substring(0, 2) + " / " + val.substring(2, 4);
    }
    $(this).val(val);
  });

  // CVC formatting
  $(document).on("input", "#cvc", function () {
    let val = $(this).val().replace(/\D/g, "");
    $(this).val(val.substring(0, 4));
  });

  // Name sync
  $(document).on("input", "#fullName", function () {
    const name = $(this).val();
    if (name) {
      $("#cardName").attr("placeholder", name);
    }
  });

  // Email sync
  $(document).on("input", "#email", function () {
    const email = $(this).val() || "you@example.com";
    $("#receiptEmail").text(email);
  });

  // Navigation buttons
  $(document).on("click", "#btnNext", function () {
    if (currentStep === totalSteps) {
      // Close billing child modal and parent pro modal
      $("[data-child-id='billing']").removeClass("is-open");
      $("[data-modal-id='pro']").removeClass("is-open");
      return;
    }

    if (currentStep === 3) {
      $(this).addClass("loading").prop("disabled", true);
      setTimeout(() => {
        goToStep(currentStep + 1);
      }, 2000);
      return;
    }

    goToStep(currentStep + 1);
  });

  $(document).on("click", "#btnBack", function () {
    if (currentStep > 1) {
      goToStep(currentStep - 1);
    }
  });

  // Initialize
  updateProgress(1);

  // ========== Settings Panel Functionality ==========
  // Tab navigation
  $(document).on("click", "[data-settings-tab]", function () {
    const tab = $(this).data("settings-tab");

    // Update active nav item
    $("[data-settings-tab]").removeClass("active");
    $(this).addClass("active");

    // Show corresponding section
    $("[data-settings-section]").removeClass("active");
    $(`[data-settings-section="${tab}"]`).addClass("active");
  });

  // Toggle switches - only for toggles NOT in sections with specific handlers
  $(document).on("click", ".settings-toggle", function (e) {
    // Skip if this toggle is in a section with a specific handler
    const $this = $(this);
    if ($this.closest("[data-settings-section='security']").length ||
        $this.closest("[data-settings-section='appearance']").length ||
        $this.closest("[data-settings-section='notifications']").length ||
        $this.closest("[data-settings-section='privacy']").length) {
      return;
    }
    $this.toggleClass("active");
  });

  // Color picker
  $(document).on("click", ".settings-color", function () {
    $(".settings-color").removeClass("active");
    $(this).addClass("active");
  });

  // Reset settings to first tab when modal opens
  $(document).on("click", "[data-open-modal='settings']", function () {
    $("[data-settings-tab]").removeClass("active");
    $("[data-settings-tab='profile']").addClass("active");
    $("[data-settings-section]").removeClass("active");
    $("[data-settings-section='profile']").addClass("active");
  });

  // ========== Settings Image Uploads ==========
  // Avatar upload - using label+for attribute, just handle file change
  $(document).on("change", "#avatarInput", function (e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (event) {
        $("#avatarPreview").attr("src", event.target.result);
      };
      reader.readAsDataURL(file);
    }
  });

  // Banner upload - using label+for attribute, just handle file change
  $(document).on("change", "#bannerInput", function (e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (event) {
        $("#bannerPreview").attr("src", event.target.result);
      };
      reader.readAsDataURL(file);
    }
  });

  // ========== Notifications Panel Functionality ==========
  
  // Tab navigation
  $(document).on("click", "[data-notif-tab]", function () {
    const tab = $(this).data("notif-tab");

    // Update active nav item
    $("[data-notif-tab]").removeClass("active");
    $(this).addClass("active");

    // Show corresponding section
    $("[data-notif-section]").removeClass("active");
    $(`[data-notif-section="${tab}"]`).addClass("active");

    // Filter notifications by type
    filterNotificationsByType(tab);
  });

  // Filter and display notifications
  function filterNotificationsByType(type) {
    const allCards = $(".notif-card").clone(true);
    const targetSection = $(`[data-notif-section="${type}"]`);
    const targetContainer = targetSection.find(".notif-list-items");

    if (type === "all") {
      // Show all notifications in the All section
      return;
    }

    // Clear the target container
    targetContainer.empty();

    // Filter and add matching cards
    allCards.each(function () {
      if ($(this).data("type") === type) {
        targetContainer.append($(this));
      }
    });

    // Show empty state if no notifications
    if (targetContainer.children().length === 0) {
      targetContainer.html(`
        <div style="text-align: center; padding: 60px 20px; color: var(--notifications-text-tertiary);">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 48px; height: 48px; margin: 0 auto 16px; opacity: 0.3;">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <p style="font-size: 15px;">No notifications in this category</p>
        </div>
      `);
    }
  }

  // Auto-mark notification as read after 3 seconds of hover
  let hoverTimeout = null;
  $(document).on("mouseenter", ".notif-card.unread", function () {
    const $card = $(this);
    hoverTimeout = setTimeout(() => {
      if ($card.hasClass("unread")) {
        $card.removeClass("unread");
        updateUnreadCount();
      }
    }, 500);
  });

  $(document).on("mouseleave", ".notif-card.unread", function () {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      hoverTimeout = null;
    }
  });

  // Delete notification card
  $(document).on("click", ".notif-card-delete", function (e) {
    e.stopPropagation();
    const $card = $(this).closest(".notif-card");
    const notifId = $card.data("notif-id");
    
    // Remove all cards with the same notification ID across all sections
    $(`.notif-card[data-notif-id="${notifId}"]`).fadeOut(250, function () {
      $(this).remove();
      
      // Update all empty sections
      $(".notif-list-items").each(function () {
        const $container = $(this);
        if ($container.children(".notif-card").length === 0 && $container.children("div").length === 0) {
          $container.html(`
            <div style="text-align: center; padding: 60px 20px; color: var(--notifications-text-tertiary);">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 48px; height: 48px; margin: 0 auto 16px; opacity: 0.3;">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <p style="font-size: 15px;">No notifications in this category</p>
            </div>
          `);
        }
      });
      
      updateUnreadCount();
    });
  });

  // Mark notification as read when clicked
  $(document).on("click", ".notif-card", function () {
    if ($(this).hasClass("unread")) {
      $(this).removeClass("unread");
      updateUnreadCount();
    }
  });

  // Mark all as read
  $(document).on("click", "#markAllRead", function () {
    $(".notif-card.unread").removeClass("unread");
    updateUnreadCount();
  });

  // Clear all notifications
  $(document).on("click", "#clearAll", function () {
    if (confirm("Are you sure you want to clear all notifications? This cannot be undone.")) {
      $(".notif-card").fadeOut(300, function () {
        $(this).remove();
        updateUnreadCount();
        
        $(".notif-list-items").html(`
          <div style="text-align: center; padding: 60px 20px; color: var(--notifications-text-tertiary);">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 48px; height: 48px; margin: 0 auto 16px; opacity: 0.3;">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <p style="font-size: 15px;">No notifications</p>
          </div>
        `);
      });
    }
  });

  // Update unread count
  function updateUnreadCount() {
    const unreadCount = $(".notif-card.unread").length;
    $(".notifications-unread-count").text(unreadCount + " unread");
    $(".notifications-badge").text(unreadCount);
    
    if (unreadCount === 0) {
      $(".notifications-badge").hide();
    } else {
      $(".notifications-badge").show();
    }
  }

  // Initialize notification counts on page load
  updateUnreadCount();

  // Hide notification categories with no items
  function updateVisibleCategories() {
    const categories = ['system', 'security', 'account', 'data', 'payment', 'activity', 'task', 'alert'];
    
    categories.forEach(category => {
      const hasNotifications = $(`.notif-card[data-type="${category}"]`).length > 0;
      const $navItem = $(`[data-notif-tab="${category}"]`);
      
      if (hasNotifications) {
        $navItem.show();
      } else {
        $navItem.hide();
      }
    });
  }

  // Call on page load and after any notification changes
  updateVisibleCategories();

  // Update visible categories when deleting notifications
  const originalDeleteHandler = $(document).data('events')?.click || [];
  $(document).on('click', '.notif-card-delete', function() {
    setTimeout(updateVisibleCategories, 300);
  });

  $(document).on('click', '#clearAll', function() {
    setTimeout(updateVisibleCategories, 400);
  });

  // ========== Edit Portfolio Modal Functionality ==========

  // Tab navigation for edit portfolio
  $(document).on("click", "[data-ep-tab]", function () {
    const tab = $(this).data("ep-tab");

    // Update active tab
    $("[data-ep-tab]").removeClass("active");
    $(this).addClass("active");

    // Show corresponding section
    $("[data-ep-section]").removeClass("active");
    $(`[data-ep-section="${tab}"]`).addClass("active");
  });

  // Reset to first tab when modal opens
  $(document).on("click", "[data-open-modal='edit-portfolio']", function () {
    $("[data-ep-tab]").removeClass("active");
    $("[data-ep-tab='upload']").addClass("active");
    $("[data-ep-section]").removeClass("active");
    $("[data-ep-section='upload']").addClass("active");
  });

  // File upload functionality
  const $dropZone = $("#epDropZone");
  const $fileInput = $("#epFileInput");
  const $browseBtn = $("#epBrowseBtn");
  const $uploadQueue = $("#epUploadQueue");

  // Browse button click
  $browseBtn.on("click", function (e) {
    e.stopPropagation();
    $fileInput.click();
  });

  // Click on drop zone
  $dropZone.on("click", function () {
    $fileInput.click();
  });

  // Drag and drop events
  $dropZone.on("dragover", function (e) {
    e.preventDefault();
    e.stopPropagation();
    $(this).addClass("drag-over");
  });

  $dropZone.on("dragleave", function (e) {
    e.preventDefault();
    e.stopPropagation();
    $(this).removeClass("drag-over");
  });

  $dropZone.on("drop", function (e) {
    e.preventDefault();
    e.stopPropagation();
    $(this).removeClass("drag-over");

    const files = e.originalEvent.dataTransfer.files;
    handleFiles(files);
  });

  // File input change
  $fileInput.on("change", function () {
    handleFiles(this.files);
  });

  // Handle uploaded files
  function handleFiles(files) {
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;

      const reader = new FileReader();
      reader.onload = function (e) {
        const fullResUrl = e.target.result;
        
        // Create thumbnail using canvas
        const img = new Image();
        img.onload = function() {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const thumbSize = 400;
          
          // Calculate crop dimensions for square thumbnail
          const size = Math.min(img.width, img.height);
          const sx = (img.width - size) / 2;
          const sy = (img.height - size) / 2;
          
          canvas.width = thumbSize;
          canvas.height = thumbSize;
          ctx.drawImage(img, sx, sy, size, size, 0, 0, thumbSize, thumbSize);
          
          const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
          
          const $item = $(`
            <div class="ep-upload-item" data-fullres="${fullResUrl}" data-thumbnail="${thumbnailUrl}">
              <div class="ep-upload-item-preview">
                <img src="${thumbnailUrl}" alt="${file.name}" />
              </div>
              <div class="ep-upload-item-info">
                <p class="ep-upload-item-name">${file.name}</p>
                <p class="ep-upload-item-size">${formatFileSize(file.size)}</p>
                <div class="ep-upload-item-progress">
                  <div class="ep-upload-item-progress-bar" style="width: 0%"></div>
                </div>
              </div>
              <button class="ep-upload-item-remove">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          `);

          $uploadQueue.append($item);

          // Simulate upload progress
          simulateUpload($item);
        };
        img.src = fullResUrl;
      };
      reader.readAsDataURL(file);
    });
  }

  // Format file size
  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  // Simulate upload progress
  function simulateUpload($item) {
    const $progressBar = $item.find(".ep-upload-item-progress-bar");
    let progress = 0;

    const interval = setInterval(() => {
      progress += Math.random() * 20;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);

        // Show success state
        $item.find(".ep-upload-item-progress").fadeOut(200);
        $item.find(".ep-upload-item-info").append(`
          <div class="ep-upload-item-status">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Uploaded
          </div>
        `);
      }
      $progressBar.css("width", progress + "%");
    }, 200);
  }

  // Remove upload item
  $(document).on("click", ".ep-upload-item-remove", function () {
    $(this).closest(".ep-upload-item").fadeOut(200, function () {
      $(this).remove();
    });
  });

  // Post selection (checkbox)
  $(document).on("click", ".ep-post-item", function (e) {
    if ($(e.target).closest(".ep-post-action").length) return;
    if ($(e.target).closest(".ep-post-drag-handle").length) return;

    $(this).toggleClass("selected");
  });

  // Select all posts in active grid only
  $(document).on("click", "#epSelectAll", function () {
    const $activeGrid = $(".ep-posts-grid.active");
    const $items = $activeGrid.find(".ep-post-item");
    const allSelected = $items.filter(".selected").length === $items.length;
    
    if (allSelected) {
      $items.removeClass("selected");
      $(this).find("svg").parent().html(`
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 11 12 14 22 4"></polyline>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
        </svg>
        Select All
      `);
    } else {
      $items.addClass("selected");
      $(this).html(`
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
        Deselect All
      `);
    }
  });

  // Delete selected posts from active grid
  $(document).on("click", "#epDeleteSelected", function () {
    $(".ep-posts-grid.active .ep-post-item.selected").fadeOut(200, function () {
      $(this).remove();
    });
  });

  // Drag and drop reordering for posts
  let draggedPost = null;

  $(document).on("dragstart", ".ep-post-item", function (e) {
    draggedPost = this;
    $(this).addClass("dragging");
    e.originalEvent.dataTransfer.effectAllowed = "move";
  });

  $(document).on("dragend", ".ep-post-item", function () {
    $(this).removeClass("dragging");
    $(".ep-post-item").removeClass("drag-over");
    draggedPost = null;
  });

  $(document).on("dragover", ".ep-post-item", function (e) {
    e.preventDefault();
    if (this !== draggedPost) {
      $(this).addClass("drag-over");
    }
  });

  $(document).on("dragleave", ".ep-post-item", function () {
    $(this).removeClass("drag-over");
  });

  $(document).on("drop", ".ep-post-item", function (e) {
    e.preventDefault();
    if (this !== draggedPost && draggedPost) {
      const $grid = $("#epPostsGrid");
      const $draggedItem = $(draggedPost);
      const $targetItem = $(this);

      const draggedIndex = $draggedItem.index();
      const targetIndex = $targetItem.index();

      if (draggedIndex < targetIndex) {
        $draggedItem.insertAfter($targetItem);
      } else {
        $draggedItem.insertBefore($targetItem);
      }
    }
    $(this).removeClass("drag-over");
  });

  // Edit post button - load full resolution image
  $(document).on("click", ".ep-post-action.edit", function (e) {
    e.stopPropagation();
    const $postItem = $(this).closest(".ep-post-item");
    const $img = $postItem.find("img");
    const fullResUrl = $img.data("fullres") || $img.attr("src");
    const title = $postItem.find(".ep-post-title").text();
    const category = $postItem.find(".ep-post-category").text();
    
    // Update image viewer with full-res image
    $("#ivMainImage").attr("src", fullResUrl);
    $("#ivTitle").text(title);
    $("#ivCategory").html(`
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
        <line x1="7" y1="7" x2="7.01" y2="7"></line>
      </svg>
      ${category}
    `);
    
    // Open image viewer
    $("[data-modal-id='image-viewer']").addClass("is-open");
  });

  // Category filter tab switching in Manage Images
  $(document).on("click", ".ep-category-tab:not(.add-new)", function () {
    const category = $(this).data("category");
    
    // Update active tab
    $(".ep-category-tab").removeClass("active");
    $(this).addClass("active");
    
    // Show/hide grids based on category
    $(".ep-posts-grid").removeClass("active");
    $(`[data-category-grid="${category}"]`).addClass("active");
  });

  // ========== Image Viewer Modal Functionality ==========

  let currentZoom = 100;
  const minZoom = 50;
  const maxZoom = 200;
  const zoomStep = 25;

  // Zoom in
  $(document).on("click", "#ivZoomIn", function () {
    if (currentZoom < maxZoom) {
      currentZoom += zoomStep;
      updateZoom();
    }
  });

  // Zoom out
  $(document).on("click", "#ivZoomOut", function () {
    if (currentZoom > minZoom) {
      currentZoom -= zoomStep;
      updateZoom();
    }
  });

  // Update zoom level display and image
  function updateZoom() {
    $("#ivZoomLevel").text(currentZoom + "%");
    $("#ivMainImage").css("transform", `scale(${currentZoom / 100})`);
  }

  // Reset zoom when modal opens
  $(document).on("click", "[data-open-modal='image-viewer']", function () {
    currentZoom = 100;
    updateZoom();
  });

  // Fullscreen toggle
  $(document).on("click", "#ivFullscreen", function () {
    const panel = document.querySelector(".image-viewer-panel");
    if (!document.fullscreenElement) {
      if (panel.requestFullscreen) {
        panel.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  });

  // Download image
  $(document).on("click", "#ivDownload", function () {
    const imgSrc = $("#ivMainImage").attr("src");
    const link = document.createElement("a");
    link.href = imgSrc;
    link.download = "image";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  // Navigation arrows (for future gallery integration)
  $(document).on("click", "#ivPrev", function () {
    // Navigate to previous image (implement with gallery data)
    console.log("Previous image");
  });

  $(document).on("click", "#ivNext", function () {
    // Navigate to next image (implement with gallery data)
    console.log("Next image");
  });

  // Keyboard navigation for image viewer
  $(document).on("keydown", function (e) {
    if (!$("[data-modal-id='image-viewer']").hasClass("is-open")) return;

    switch (e.key) {
      case "ArrowLeft":
        $("#ivPrev").click();
        break;
      case "ArrowRight":
        $("#ivNext").click();
        break;
      case "+":
      case "=":
        $("#ivZoomIn").click();
        break;
      case "-":
        $("#ivZoomOut").click();
        break;
    }
  });

  // ========== Enhanced Settings Functionality ==========

  // Use global toast container for notifications
  function showToast(message, type = "success") {
    const iconSvg = type === "success" 
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'
      : type === "error"
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';

    const toast = $(`
      <div class="toast ${type}">
        <div class="toast-icon">${iconSvg}</div>
        <div class="toast-content"><div class="toast-title">${type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Notice'}</div><div class="toast-message">${message}</div></div>
        <button class="toast-close">×</button>
      </div>
    `);

    const $container = $('#toastContainer');
    if ($container.length === 0) {
      $('body').append('<div id="toastContainer" class="toast-container"></div>');
    }
    $('#toastContainer').append(toast);
    setTimeout(()=> toast.addClass('show'), 10);
    // auto dismiss
    setTimeout(()=> { toast.removeClass('show'); setTimeout(()=> toast.remove(), 300); }, 3500);
  }

  // Profile form validation and save
  $(document).on("click", "[data-settings-section='profile'] .settings-btn-primary", function (e) {
    e.preventDefault();
    const $btn = $(this);
    const $form = $btn.closest(".settings-card");

    // Get form values
    const displayName = $form.find("input[placeholder='Your name']").val().trim();
    const username = $form.find("input[placeholder='@username']").val().trim();
    const bio = $form.find("textarea").val().trim();
    const location = $form.find("input[placeholder='City, Country']").val().trim();
    const email = $form.find("input[type='email']").val().trim();

    // Validation
    if (!displayName) {
      showToast("Display name is required", "error");
      return;
    }
    if (!username) {
      showToast("Username is required", "error");
      return;
    }
    if (!email || !email.includes("@")) {
      showToast("Valid email is required", "error");
      return;
    }

    // Show loading state
    const originalText = $btn.text();
    $btn.html('<span class="settings-btn-spinner"></span> Saving...').prop("disabled", true);

    // Simulate API call
    setTimeout(() => {
      $btn.text(originalText).prop("disabled", false);
      showToast("Profile updated successfully!", "success");
    }, 1200);
  });

  // Password change -> open as security subview
  $(document).on("click", "[data-settings-section='security'] .settings-btn-secondary:contains('Change')", function () {
    const html = `
      <br>
      <div class="settings-form-group">
        <label>Current Password</label>
        <input type="password" class="settings-input" id="security_currentPassword" placeholder="Enter current password" />
      </div>
      <div class="settings-form-group">
        <label>New Password</label>
        <input type="password" class="settings-input" id="security_newPassword" placeholder="Enter new password" />
      </div>
      <div class="settings-form-group">
        <label>Confirm New Password</label>
        <input type="password" class="settings-input" id="security_confirmPassword" placeholder="Confirm new password" />
      </div>
      <div class="settings-password-strength" id="security_passwordStrength">
        <div class="strength-bar"></div>
        <span class="strength-text">Password strength</span>
      </div>
      <div style="margin-top:16px; display:flex; gap:8px; justify-content:flex-end;">
        <button class="settings-btn settings-btn-secondary subview-back">Cancel</button>
        <button class="settings-btn settings-btn-primary" id="security_savePassword">Update Password</button>
      </div>
    `;
    showSettingsSubview('security', html);
  });

  // Password strength indicator (subview)
  $(document).on("input", "#security_newPassword", function () {
    const password = $(this).val();
    let strength = 0;
    let text = "Weak";
    let color = "#ef4444";

    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;

    if (strength >= 3) { text = "Strong"; color = "#10b981"; }
    else if (strength >= 2) { text = "Medium"; color = "#f59e0b"; }

    $("#security_passwordStrength .strength-bar").css({ width: (strength * 25) + "%", background: color });
    $("#security_passwordStrength .strength-text").text(text).css("color", color);
  });

  // Save password from subview
  $(document).on("click", "#security_savePassword", function () {
    const current = $("#security_currentPassword").val();
    const newPass = $("#security_newPassword").val();
    const confirm = $("#security_confirmPassword").val();

    if (!current) { showToast("Current password is required", "error"); return; }
    if (newPass.length < 8) { showToast("Password must be at least 8 characters", "error"); return; }
    if (newPass !== confirm) { showToast("Passwords do not match", "error"); return; }

    const $btn = $(this);
    $btn.html('<span class="settings-btn-spinner"></span>').prop("disabled", true);
    setTimeout(() => {
      showToast("Password updated successfully!", "success");
      $btn.text("Update Password").prop("disabled", false);
      $("[data-settings-section='security'] .settings-row-info p:first").text("Last changed just now");
      closeSettingsSubview('security');
    }, 1500);
  });

  // Close dialog
  $(document).on("click", "[data-close-dialog]", function () {
    $(this).closest(".settings-overlay").removeClass("show");
  });

  // Close dialog on overlay click
  $(document).on("click", ".settings-overlay", function (e) {
    if (e.target === this) {
      $(this).removeClass("show");
    }
  });

  // Active Sessions -> open as security subview
  $(document).on("click", "[data-settings-section='security'] .settings-btn-secondary:contains('View')", function () {
    const html = `
      <br>
      <div class="settings-session active-session">
        <div class="session-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg></div>
        <div class="session-info"><h4>Windows PC - Chrome <span class="session-current">Current</span></h4><p>Fort Worth, TX • Last active: Now</p></div>
      </div>
      <div class="settings-session"><div class="session-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/></svg></div><div class="session-info"><h4>iPhone 14 Pro - Safari</h4><p>Fort Worth, TX • Last active: 2 hours ago</p></div><button class="settings-btn settings-btn-danger settings-btn-sm" data-revoke-session>Revoke</button></div>
      <div class="settings-session"><div class="session-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/></svg></div><div class="session-info"><h4>MacBook Pro - Firefox</h4><p>Dallas, TX • Last active: Yesterday</p></div><button class="settings-btn settings-btn-danger settings-btn-sm" data-revoke-session>Revoke</button></div>
      <div style="margin-top:16px; display:flex; gap:8px; justify-content:flex-end;"><button class="settings-btn settings-btn-secondary subview-back">Close</button></div>
    `;
    showSettingsSubview('security', html);
  });

  // Revoke session (works in subview)
  $(document).on("click", "[data-revoke-session]", function () {
    const $session = $(this).closest(".settings-session");
    $(this).html('<span class="settings-btn-spinner"></span>').prop("disabled", true);
    setTimeout(() => {
      $session.slideUp(200, function() { $(this).remove(); });
      showToast("Session revoked successfully", "success");
    }, 800);
  });

  // Log out everywhere
  $(document).on("click", "[data-settings-section='security'] .settings-btn-danger:contains('Log Out')", function () {
    if (confirm("Are you sure you want to log out of all devices? You will need to sign in again on each device.")) {
      const $btn = $(this);
      $btn.html('<span class="settings-btn-spinner"></span>').prop("disabled", true);
      setTimeout(() => {
        $btn.text("Log Out").prop("disabled", false);
        showToast("Logged out of all devices", "success");
      }, 1500);
    }
  });

  // Two-factor authentication toggle with confirmation
  $(document).on("click", "[data-settings-section='security'] .settings-toggle", function () {
    const $toggle = $(this);
    const isEnabled = $toggle.hasClass("active");
    
    if (!isEnabled) {
      // Enabling 2FA - show setup dialog
      if (confirm("Enable two-factor authentication? You will need to set up an authenticator app.")) {
        $toggle.addClass("active");
        showToast("Two-factor authentication enabled", "success");
      }
    } else {
      // Disabling 2FA
      if (confirm("Are you sure you want to disable two-factor authentication? This will make your account less secure.")) {
        $toggle.removeClass("active");
        showToast("Two-factor authentication disabled", "warning");
      }
    }
  });

  // Theme selection
  $(document).on("change", "[data-settings-section='appearance'] .settings-select", function () {
    const theme = $(this).val();
    // Apply theme using dynamic loader and persist
    applyTheme(theme);
    saveSetting(SETTINGS_KEYS.theme, theme);
    showToast(`Theme changed to ${theme}`, "success");
  });

  // Accent color selection
  $(document).on("click", ".settings-color", function () {
    const color = $(this).data("color");
    $(".settings-color").removeClass("active");
    $(this).addClass("active");
    
    // Apply accent color (placeholder - implement actual color switching)
    document.documentElement.setAttribute("data-accent", color);
    localStorage.setItem("accentColor", color);
    showToast("Accent color updated", "success");
  });

  // Reduced motion toggle
  $(document).on("click", "[data-settings-section='appearance'] .settings-toggle", function (e) {
    e.stopPropagation();
    const $toggle = $(this);
    $toggle.toggleClass("active");
    
    const isReduced = $toggle.hasClass("active");
    document.documentElement.classList.toggle("reduced-motion", isReduced);
    localStorage.setItem("reducedMotion", isReduced);
    showToast(isReduced ? "Reduced motion enabled" : "Animations enabled", "success");
  });

  // Notification toggles with persistence
  $(document).on("click", "[data-settings-section='notifications'] .settings-toggle", function (e) {
    e.stopPropagation();
    const $toggle = $(this);
    const settingName = $toggle.closest(".settings-row").find("h4").text();
    $toggle.toggleClass("active");
    
    const isEnabled = $toggle.hasClass("active");
    showToast(`${settingName} ${isEnabled ? "enabled" : "disabled"}`, "success");
  });

  // Privacy toggles
  $(document).on("click", "[data-settings-section='privacy'] .settings-toggle", function (e) {
    e.stopPropagation();
    const $toggle = $(this);
    const settingName = $toggle.closest(".settings-row").find("h4").text();
    $toggle.toggleClass("active");
    
    const isEnabled = $toggle.hasClass("active");
    showToast(`${settingName} ${isEnabled ? "enabled" : "disabled"}`, "success");
  });

  // Request data download
  $(document).on("click", "[data-settings-section='privacy'] .settings-btn-secondary:contains('Request')", function () {
    const $btn = $(this);
    $btn.html('<span class="settings-btn-spinner"></span>').prop("disabled", true);
    
    setTimeout(() => {
      $btn.text("Requested").prop("disabled", true).removeClass("settings-btn-secondary").addClass("settings-btn-success");
      showToast("Data export requested. You'll receive an email when it's ready.", "success");
    }, 1500);
  });

  // Delete account -> open as privacy subview
  $(document).on("click", "[data-settings-section='privacy'] .settings-btn-danger:contains('Delete')", function () {
    const html = `
      <br>
      <p class="settings-dialog-warning">⚠️ This action is permanent and cannot be undone. All your data, including your portfolio, images, and account information will be permanently deleted.</p>
      <div class="settings-form-group"><label>Type "DELETE" to confirm</label><input type="text" class="settings-input" id="privacy_deleteConfirm" placeholder="Type DELETE" /></div>
      <div class="settings-form-group"><label>Enter your password</label><input type="password" class="settings-input" id="privacy_deletePassword" placeholder="Your password" /></div>
      <div style="margin-top:16px; display:flex; gap:8px; justify-content:flex-end;"><button class="settings-btn settings-btn-secondary subview-back">Cancel</button><button class="settings-btn settings-btn-danger" id="privacy_confirmDelete" disabled>Delete My Account</button></div>
    `;
    showSettingsSubview('privacy', html);
  });

  // Enable delete button when "DELETE" is typed (privacy subview)
  $(document).on("input", "#privacy_deleteConfirm", function () {
    const isValid = $(this).val() === "DELETE";
    $("#privacy_confirmDelete").prop("disabled", !isValid);
  });

  // Confirm delete (privacy subview)
  $(document).on("click", "#privacy_confirmDelete", function () {
    const password = $("#privacy_deletePassword").val();
    if (!password) { showToast("Password is required", "error"); return; }
    const $btn = $(this);
    $btn.html('<span class="settings-btn-spinner"></span>').prop("disabled", true);
    setTimeout(() => {
      showToast("Account deletion initiated. You will receive a confirmation email.", "success");
      closeSettingsSubview('privacy');
    }, 2000);
  });

  // Social links - Add new link functionality
  $(document).on("click", "[data-settings-section='connected'] .settings-btn-primary:contains('Save')", function (e) {
    e.preventDefault();
    const $btn = $(this);
    const $inputs = $btn.closest(".settings-card").find(".settings-input");
    
    let validLinks = 0;
    $inputs.each(function () {
      const val = $(this).val().trim();
      if (val && isValidUrl(val)) {
        validLinks++;
        $(this).removeClass("error");
      } else if (val) {
        $(this).addClass("error");
      }
    });
    
    $btn.html('<span class="settings-btn-spinner"></span> Saving...').prop("disabled", true);
    
    setTimeout(() => {
      $btn.text("Save Links").prop("disabled", false);
      showToast(`${validLinks} link${validLinks !== 1 ? 's' : ''} saved successfully!`, "success");
    }, 1000);
  });

  // URL validation helper
  function isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  // Remove error state on input focus
  $(document).on("focus", ".settings-input.error", function () {
    $(this).removeClass("error");
  });

  // ========== Settings LocalStorage Keys ==========
  const SETTINGS_KEYS = {
    // Profile
    displayName: 'settings_displayName',
    username: 'settings_username',
    bio: 'settings_bio',
    location: 'settings_location',
    email: 'settings_email',
    avatarSrc: 'settings_avatarSrc',
    bannerSrc: 'settings_bannerSrc',
    // Security
    twoFactorEnabled: 'settings_twoFactorEnabled',
    // Appearance
    theme: 'theme',
    accentColor: 'accentColor',
    reducedMotion: 'reducedMotion',
    // Notifications
    pushNotifications: 'settings_pushNotifications',
    emailNotifications: 'settings_emailNotifications',
    marketingEmails: 'settings_marketingEmails',
    securityAlerts: 'settings_securityAlerts',
    // Privacy
    publicProfile: 'settings_publicProfile',
    showOnlineStatus: 'settings_showOnlineStatus',
    // Social Links
    socialLink1: 'settings_socialLink1',
    socialLink2: 'settings_socialLink2',
    socialLink3: 'settings_socialLink3'
  };

  // Save individual setting to localStorage
  function saveSetting(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('Failed to save setting:', key);
    }
  }

  // Load individual setting from localStorage
  function loadSetting(key, defaultValue) {
    try {
      const value = localStorage.getItem(key);
      return value !== null ? JSON.parse(value) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  }

  // Light-theme dynamic loader
  const LIGHT_CSS = [
    // Paths are document-relative. For pages under /profile/, use ../ for root css.
    { id: 'light-vars', href: '../css/light-variables.css' },
    { id: 'light-profile', href: './css/light-color.css' },
    { id: 'light-nav', href: './css/light-nav.css' },
    { id: 'light-edit', href: './css/light-edit-portfolio-modal.css' },
    { id: 'light-image', href: './css/light-image-viewer-modal.css' }
  ];

  function applyTheme(theme) {
    if (theme === 'light') {
      LIGHT_CSS.forEach(({ id, href }) => {
        if (!document.getElementById(id)) {
          const l = document.createElement('link');
          l.rel = 'stylesheet';
          l.href = href;
          l.id = id;
          l.dataset.dynamic = 'true';
          document.head.appendChild(l);
        }
      });
    } else {
      LIGHT_CSS.forEach(({ id }) => {
        const el = document.getElementById(id);
        if (el) el.remove();
      });
    }
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('theme', JSON.stringify(theme)); } catch (e) {}
  }

  // Initialize saved settings on page load
  function initializeSettings() {
    // ===== Profile Section =====
    const displayName = loadSetting(SETTINGS_KEYS.displayName, null);
    if (displayName) {
      $("#settingsDisplayName").val(displayName);
    }
    
    const username = loadSetting(SETTINGS_KEYS.username, null);
    if (username) {
      $("#settingsUsername").val(username);
    }
    
    const bio = loadSetting(SETTINGS_KEYS.bio, null);
    if (bio) {
      $("#settingsBio").val(bio);
    }
    
    const location = loadSetting(SETTINGS_KEYS.location, null);
    if (location) {
      $("#settingsLocation").val(location);
    }
    
    const email = loadSetting(SETTINGS_KEYS.email, null);
    if (email) {
      $("#settingsEmail").val(email);
    }
    
    // Avatar and Banner images
    const avatarSrc = loadSetting(SETTINGS_KEYS.avatarSrc, null);
    if (avatarSrc) {
      $("#avatarPreview").attr("src", avatarSrc);
    }
    
    const bannerSrc = loadSetting(SETTINGS_KEYS.bannerSrc, null);
    if (bannerSrc) {
      $("#bannerPreview").attr("src", bannerSrc);
    }

    // ===== Security Section =====
    const twoFactorEnabled = loadSetting(SETTINGS_KEYS.twoFactorEnabled, false);
    if (twoFactorEnabled) {
      $("[data-settings-section='security'] .settings-toggle").first().addClass("active");
    }

    // ===== Appearance Section =====
    const savedTheme = loadSetting(SETTINGS_KEYS.theme, 'dark');
    applyTheme(savedTheme);
    $("[data-settings-section='appearance'] .settings-select").val(savedTheme);

    const savedAccent = loadSetting(SETTINGS_KEYS.accentColor, 'purple');
    document.documentElement.setAttribute("data-accent", savedAccent);
    $(".settings-color").removeClass("active");
    $(`.settings-color[data-color="${savedAccent}"]`).addClass("active");

    const reducedMotion = loadSetting(SETTINGS_KEYS.reducedMotion, false);
    if (reducedMotion) {
      document.documentElement.classList.add("reduced-motion");
      $("[data-settings-section='appearance'] .settings-toggle").addClass("active");
    }

    // ===== Notifications Section =====
    const notifToggles = $("[data-settings-section='notifications'] .settings-toggle");
    const pushNotif = loadSetting(SETTINGS_KEYS.pushNotifications, true);
    const emailNotif = loadSetting(SETTINGS_KEYS.emailNotifications, true);
    const marketingNotif = loadSetting(SETTINGS_KEYS.marketingEmails, false);
    const securityNotif = loadSetting(SETTINGS_KEYS.securityAlerts, true);
    
    notifToggles.eq(0).toggleClass("active", pushNotif);
    notifToggles.eq(1).toggleClass("active", emailNotif);
    notifToggles.eq(2).toggleClass("active", marketingNotif);
    notifToggles.eq(3).toggleClass("active", securityNotif);

    // ===== Privacy Section =====
    const privacyToggles = $("[data-settings-section='privacy'] .settings-toggle");
    const publicProfile = loadSetting(SETTINGS_KEYS.publicProfile, true);
    const showOnlineStatus = loadSetting(SETTINGS_KEYS.showOnlineStatus, true);
    
    privacyToggles.eq(0).toggleClass("active", publicProfile);
    privacyToggles.eq(1).toggleClass("active", showOnlineStatus);

    // ===== Social Links Section =====
    const link1 = loadSetting(SETTINGS_KEYS.socialLink1, '');
    const link2 = loadSetting(SETTINGS_KEYS.socialLink2, '');
    const link3 = loadSetting(SETTINGS_KEYS.socialLink3, '');
    
    $("#settingsSocialLink1").val(link1);
    $("#settingsSocialLink2").val(link2);
    $("#settingsSocialLink3").val(link3);
  }

  // Update profile save handler to persist to localStorage
  $(document).off("click", "#settingsSaveProfile");
  $(document).on("click", "#settingsSaveProfile", function (e) {
    e.preventDefault();
    const $btn = $(this);

    // Get form values
    const displayName = $("#settingsDisplayName").val().trim();
    const username = $("#settingsUsername").val().trim();
    const bio = $("#settingsBio").val().trim();
    const location = $("#settingsLocation").val().trim();
    const email = $("#settingsEmail").val().trim();

    // Validation
    if (!displayName) {
      showToast("Display name is required", "error");
      return;
    }
    if (!username) {
      showToast("Username is required", "error");
      return;
    }
    if (!email || !email.includes("@")) {
      showToast("Valid email is required", "error");
      return;
    }

    // Show loading state
    const originalText = $btn.text();
    $btn.html('<span class="settings-btn-spinner"></span> Saving...').prop("disabled", true);

    // Save to localStorage
    saveSetting(SETTINGS_KEYS.displayName, displayName);
    saveSetting(SETTINGS_KEYS.username, username);
    saveSetting(SETTINGS_KEYS.bio, bio);
    saveSetting(SETTINGS_KEYS.location, location);
    saveSetting(SETTINGS_KEYS.email, email);

    // Simulate API call
    setTimeout(() => {
      $btn.text(originalText).prop("disabled", false);
      showToast("Profile updated successfully!", "success");
    }, 800);
  });

  // Save avatar to localStorage when changed
  $(document).off("change", "#avatarInput");
  $(document).on("change", "#avatarInput", function (e) {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast("Image must be less than 5MB", "error");
        return;
      }
      const reader = new FileReader();
      reader.onload = function (event) {
        const src = event.target.result;
        $("#avatarPreview").attr("src", src);
        saveSetting(SETTINGS_KEYS.avatarSrc, src);
        showToast("Avatar updated!", "success");
      };
      reader.readAsDataURL(file);
    }
  });

  // Save banner to localStorage when changed
  $(document).off("change", "#bannerInput");
  $(document).on("change", "#bannerInput", function (e) {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showToast("Image must be less than 10MB", "error");
        return;
      }
      const reader = new FileReader();
      reader.onload = function (event) {
        const src = event.target.result;
        $("#bannerPreview").attr("src", src);
        saveSetting(SETTINGS_KEYS.bannerSrc, src);
        showToast("Banner updated!", "success");
      };
      reader.readAsDataURL(file);
    }
  });

  // Update 2FA toggle to persist
  $(document).off("click", "[data-settings-section='security'] .settings-toggle");
  $(document).on("click", "[data-settings-section='security'] .settings-toggle", function () {
    const $toggle = $(this);
    const $row = $toggle.closest(".settings-row");
    const settingName = $row.find("h4").text();
    
    // Only handle Two-Factor Authentication toggle
    if (!settingName.includes("Two-Factor")) return;
    
    const isEnabled = $toggle.hasClass("active");
    
    if (!isEnabled) {
      if (confirm("Enable two-factor authentication? You will need to set up an authenticator app.")) {
        $toggle.addClass("active");
        saveSetting(SETTINGS_KEYS.twoFactorEnabled, true);
        showToast("Two-factor authentication enabled", "success");
      }
    } else {
      if (confirm("Are you sure you want to disable two-factor authentication?")) {
        $toggle.removeClass("active");
        saveSetting(SETTINGS_KEYS.twoFactorEnabled, false);
        showToast("Two-factor authentication disabled", "warning");
      }
    }
  });

  // Update theme selection to persist
  $(document).off("change", "[data-settings-section='appearance'] .settings-select");
  $(document).on("change", "[data-settings-section='appearance'] .settings-select", function () {
    const theme = $(this).val();
    applyTheme(theme);
    saveSetting(SETTINGS_KEYS.theme, theme);
    showToast(`Theme changed to ${theme}`, "success");
  });

  // Update accent color to persist
  $(document).off("click", ".settings-color");
  $(document).on("click", ".settings-color", function () {
    const color = $(this).data("color");
    $(".settings-color").removeClass("active");
    $(this).addClass("active");
    document.documentElement.setAttribute("data-accent", color);
    saveSetting(SETTINGS_KEYS.accentColor, color);
    showToast("Accent color updated", "success");
  });

  // Update reduced motion toggle to persist
  $(document).off("click", "[data-settings-section='appearance'] .settings-toggle");
  $(document).on("click", "[data-settings-section='appearance'] .settings-toggle", function (e) {
    e.stopPropagation();
    const $toggle = $(this);
    $toggle.toggleClass("active");
    
    const isReduced = $toggle.hasClass("active");
    document.documentElement.classList.toggle("reduced-motion", isReduced);
    saveSetting(SETTINGS_KEYS.reducedMotion, isReduced);
    showToast(isReduced ? "Reduced motion enabled" : "Animations enabled", "success");
  });

  // Update notification toggles to persist
  $(document).off("click", "[data-settings-section='notifications'] .settings-toggle");
  $(document).on("click", "[data-settings-section='notifications'] .settings-toggle", function (e) {
    e.stopPropagation();
    const $toggle = $(this);
    const $row = $toggle.closest(".settings-row");
    const settingName = $row.find("h4").text();
    const index = $("[data-settings-section='notifications'] .settings-toggle").index($toggle);
    
    $toggle.toggleClass("active");
    const isEnabled = $toggle.hasClass("active");
    
    // Save based on index
    const notifKeys = [
      SETTINGS_KEYS.pushNotifications,
      SETTINGS_KEYS.emailNotifications,
      SETTINGS_KEYS.marketingEmails,
      SETTINGS_KEYS.securityAlerts
    ];
    if (notifKeys[index]) {
      saveSetting(notifKeys[index], isEnabled);
    }
    
    showToast(`${settingName} ${isEnabled ? "enabled" : "disabled"}`, "success");
  });

  // Update privacy toggles to persist
  $(document).off("click", "[data-settings-section='privacy'] .settings-toggle");
  $(document).on("click", "[data-settings-section='privacy'] .settings-toggle", function (e) {
    e.stopPropagation();
    const $toggle = $(this);
    const $row = $toggle.closest(".settings-row");
    const settingName = $row.find("h4").text();
    const index = $("[data-settings-section='privacy'] .settings-toggle").index($toggle);
    
    $toggle.toggleClass("active");
    const isEnabled = $toggle.hasClass("active");
    
    // Save based on index
    const privacyKeys = [
      SETTINGS_KEYS.publicProfile,
      SETTINGS_KEYS.showOnlineStatus
    ];
    if (privacyKeys[index]) {
      saveSetting(privacyKeys[index], isEnabled);
    }
    
    showToast(`${settingName} ${isEnabled ? "enabled" : "disabled"}`, "success");
  });

  // Update social links save to persist
  $(document).off("click", "#settingsSaveSocialLinks");
  $(document).on("click", "#settingsSaveSocialLinks", function (e) {
    e.preventDefault();
    const $btn = $(this);
    
    // Get values using IDs
    const link1 = $("#settingsSocialLink1").val().trim();
    const link2 = $("#settingsSocialLink2").val().trim();
    const link3 = $("#settingsSocialLink3").val().trim();
    const links = [link1, link2, link3];
    
    let validLinks = 0;
    
    // Validate each link
    links.forEach((val, index) => {
      const $input = $(`#settingsSocialLink${index + 1}`);
      if (val && isValidUrl(val)) {
        validLinks++;
        $input.removeClass("error");
      } else if (val) {
        $input.addClass("error");
      } else {
        $input.removeClass("error");
      }
    });
    
    $btn.html('<span class="settings-btn-spinner"></span> Saving...').prop("disabled", true);
    
    // Save to localStorage
    saveSetting(SETTINGS_KEYS.socialLink1, link1);
    saveSetting(SETTINGS_KEYS.socialLink2, link2);
    saveSetting(SETTINGS_KEYS.socialLink3, link3);
    
    setTimeout(() => {
      $btn.text("Save Links").prop("disabled", false);
      if (validLinks > 0 || links.every(l => !l)) {
        showToast(`${validLinks} link${validLinks !== 1 ? 's' : ''} saved successfully!`, "success");
      } else {
        showToast("Please enter valid URLs", "warning");
      }
    }, 800);
  });

  initializeSettings();
});