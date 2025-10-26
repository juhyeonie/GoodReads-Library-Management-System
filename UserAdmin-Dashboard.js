/* Professional Sidebar / Layout controller
   Replace existing layout/sidebar JS with this block.
   Works for both Dashboard and User Management pages.
*/
(function () {
  const SIDEBAR_COLLAPSED_KEY = 'gr_sidebar_collapsed_v2';
  const MOBILE_BREAK = 800; // px
  const RESIZE_DEBOUNCE_MS = 120;

  // Elements
  const sidebar = document.getElementById('sidebar');
  const menuToggle = document.getElementById('menuToggle');
  const collapseBtn = document.getElementById('collapseBtn');
  const mainContent = document.getElementById('mainContent');

  if (!sidebar || !mainContent) {
    // nothing to do if layout missing
    return;
  }

  // Utilities
  const isMobile = () => window.innerWidth <= MOBILE_BREAK;
  const readCollapsed = () => localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
  const saveCollapsed = (v) => localStorage.setItem(SIDEBAR_COLLAPSED_KEY, v ? 'true' : 'false');

  // Focus-trap helpers (lightweight)
  let previousActiveElement = null;
  function trapFocusInSidebar() {
    const focusable = sidebar.querySelectorAll('a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;
    previousActiveElement = document.activeElement;
    focusable[0].focus();

    function handleKey(e) {
      if (e.key !== 'Tab') return;
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

    sidebar.__trapHandler = handleKey;
    document.addEventListener('keydown', handleKey);
  }

  function releaseFocusTrap() {
    if (sidebar.__trapHandler) {
      document.removeEventListener('keydown', sidebar.__trapHandler);
      sidebar.__trapHandler = null;
    }
    if (previousActiveElement && previousActiveElement.focus) previousActiveElement.focus();
    previousActiveElement = null;
  }

  // Apply layout state based on size + stored collapsed
  function applyLayoutState() {
    const collapsed = readCollapsed();

    if (isMobile()) {
      sidebar.classList.remove('collapsed-desktop');
      mainContent.classList.add('full');
      mainContent.classList.remove('collapsed-desktop');

      // Mobile sidebar closed by default (unless opened by menuToggle)
      if (!sidebar.classList.contains('expanded')) {
        // ensure attributes reflect closed state
        menuToggle && menuToggle.setAttribute('aria-expanded', 'false');
      } else {
        menuToggle && menuToggle.setAttribute('aria-expanded', 'true');
      }
      // collapseBtn should reflect not-pressed on mobile
      collapseBtn && collapseBtn.setAttribute('aria-pressed', 'false');
    } else {
      // Desktop behavior: collapsed state controlled by localStorage
      menuToggle && menuToggle.setAttribute('aria-expanded', 'true'); // menuToggle irrelevant on desktop
      if (collapsed) {
        sidebar.classList.add('collapsed-desktop');
        mainContent.classList.add('collapsed-desktop');
        collapseBtn && collapseBtn.setAttribute('aria-pressed', 'true');
      } else {
        sidebar.classList.remove('collapsed-desktop');
        mainContent.classList.remove('collapsed-desktop');
        collapseBtn && collapseBtn.setAttribute('aria-pressed', 'false');
      }
      // always release mobile focus trap if any
      sidebar.classList.remove('expanded');
      document.body.classList.remove('no-scroll');
      releaseFocusTrap();
    }
  }

  // Toggle collapse for desktop
  function toggleDesktopCollapse() {
    if (isMobile()) return;
    const nowCollapsed = sidebar.classList.toggle('collapsed-desktop');
    mainContent.classList.toggle('collapsed-desktop', nowCollapsed);
    collapseBtn && collapseBtn.setAttribute('aria-pressed', String(nowCollapsed));
    saveCollapsed(nowCollapsed);
  }

  // Open/close mobile sidebar (menu toggle)
  function toggleMobileSidebar() {
    if (!isMobile()) return;
    const opening = !sidebar.classList.contains('expanded');
    if (opening) {
      sidebar.classList.add('expanded');
      menuToggle && menuToggle.setAttribute('aria-expanded', 'true');
      document.body.classList.add('no-scroll');
      // trap focus so keyboard users don't tab into main content while sidebar open
      trapFocusInSidebar();
      // listen for outside clicks (once)
      setTimeout(() => document.addEventListener('click', onDocClickOutside), 0);
    } else {
      closeMobileSidebar();
    }
  }

  function closeMobileSidebar() {
    sidebar.classList.remove('expanded');
    menuToggle && menuToggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('no-scroll');
    releaseFocusTrap();
    document.removeEventListener('click', onDocClickOutside);
  }

  // Close when clicking outside on mobile
  function onDocClickOutside(e) {
    if (!isMobile()) return;
    if (!sidebar.contains(e.target) && menuToggle && !menuToggle.contains(e.target)) {
      closeMobileSidebar();
    }
  }

  // Keyboard handlers (Enter / Space activation)
  function onKeyActivate(e, fn) {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      fn();
    }
  }

  // Debounced resize handler
  let resizeTimer = null;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      // if switching from mobile -> desktop, ensure mobile state cleaned up
      if (!isMobile()) {
        closeMobileSidebar();
      }
      applyLayoutState();
    }, RESIZE_DEBOUNCE_MS);
  }

  // Attach handlers
  if (collapseBtn) {
    collapseBtn.addEventListener('click', toggleDesktopCollapse);
    collapseBtn.addEventListener('keydown', (e) => onKeyActivate(e, toggleDesktopCollapse));
    collapseBtn.setAttribute('role', 'button');
    collapseBtn.setAttribute('aria-pressed', String(readCollapsed()));
    collapseBtn.title = collapseBtn.title || 'Collapse sidebar';
  }

  if (menuToggle) {
    menuToggle.addEventListener('click', toggleMobileSidebar);
    menuToggle.addEventListener('keydown', (e) => onKeyActivate(e, toggleMobileSidebar));
    menuToggle.setAttribute('aria-controls', 'sidebar');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.title = menuToggle.title || 'Toggle menu';
  }

  // Escape key closes mobile sidebar
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (isMobile() && sidebar.classList.contains('expanded')) {
        closeMobileSidebar();
      }
    }
  });

  // Initialize
  applyLayoutState();
  window.addEventListener('resize', onResize);

  // Expose a small API on the sidebar for debugging if needed
  sidebar.__gr = sidebar.__gr || {};
  sidebar.__gr.closeMobileSidebar = closeMobileSidebar;
  sidebar.__gr.openMobileSidebar = () => {
    if (isMobile() && !sidebar.classList.contains('expanded')) toggleMobileSidebar();
  };
})();
