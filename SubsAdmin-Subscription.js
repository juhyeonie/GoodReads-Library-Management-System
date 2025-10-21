// ...existing code...
/* Sidebar behavior: mobile overlay + desktop icons-only collapse + modal handling */
document.addEventListener('DOMContentLoaded', () => {
  const SIDEBAR_COLLAPSED_KEY = 'gr_subs_subscription_sidebar_collapsed';
  const sidebar = document.getElementById('sidebar');
  const menuToggle = document.getElementById('menuToggle');
  const collapseBtn = document.getElementById('collapseBtn');
  const mainEl = document.getElementById('mainContent');
  const MOBILE_BREAK = 800;

  function isMobile() { return window.innerWidth <= MOBILE_BREAK; }

  function applyLayout() {
    const collapsed = localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
    if (!sidebar || !mainEl) return;

    if (isMobile()) {
      sidebar.classList.remove('collapsed-desktop', 'expanded');
      mainEl.classList.add('full');
      mainEl.classList.remove('collapsed-desktop');
      if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
      if (collapseBtn) collapseBtn.setAttribute('aria-pressed', 'false');
      document.body.classList.remove('no-scroll');
    } else {
      sidebar.classList.remove('expanded');
      mainEl.classList.remove('full');
      if (collapsed) {
        sidebar.classList.add('collapsed-desktop');
        mainEl.classList.add('collapsed-desktop');
        if (collapseBtn) collapseBtn.setAttribute('aria-pressed', 'true');
      } else {
        sidebar.classList.remove('collapsed-desktop');
        mainEl.classList.remove('collapsed-desktop');
        if (collapseBtn) collapseBtn.setAttribute('aria-pressed', 'false');
      }
      if (menuToggle) menuToggle.setAttribute('aria-expanded', 'true');
      document.body.classList.remove('no-scroll');
    }
  }

  applyLayout();
  window.addEventListener('resize', applyLayout);

  // Mobile menu toggle (overlay)
  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!sidebar.classList.contains('expanded')) {
        sidebar.classList.add('expanded');
        document.body.classList.add('no-scroll');
        mainEl && mainEl.classList.remove('full');
        menuToggle.setAttribute('aria-expanded', 'true');
      } else {
        sidebar.classList.remove('expanded');
        document.body.classList.remove('no-scroll');
        mainEl && mainEl.classList.add('full');
        menuToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Desktop collapse/uncollapse (icons-only)
  if (collapseBtn && sidebar && mainEl) {
    collapseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (isMobile()) return;
      const nowCollapsed = sidebar.classList.toggle('collapsed-desktop');
      mainEl.classList.toggle('collapsed-desktop', nowCollapsed);
      collapseBtn.setAttribute('aria-pressed', String(nowCollapsed));
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, nowCollapsed ? 'true' : 'false');
    });
  }

  // Close mobile sidebar if clicking outside
  document.addEventListener('click', (e) => {
    if (isMobile() && sidebar && sidebar.classList.contains('expanded')) {
      if (!sidebar.contains(e.target) && menuToggle && !menuToggle.contains(e.target)) {
        sidebar.classList.remove('expanded');
        document.body.classList.remove('no-scroll');
        mainEl && mainEl.classList.add('full');
        if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
      }
    }
  });

  // escape closes overlay
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (isMobile() && sidebar && sidebar.classList.contains('expanded')) {
        sidebar.classList.remove('expanded');
        document.body.classList.remove('no-scroll');
        if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
      }
      // modal escape handled below
    }
  });

  /* ---------- MODAL: edit plan ---------- */
  const modal = document.getElementById('editPlanModal');
  const form = document.getElementById('editPlanForm');
  const nameInput = document.getElementById('planNameInput');
  const priceInput = document.getElementById('priceInput');
  const descInput = document.getElementById('descInput');
  const confirmBtn = document.getElementById('confirmEdit');
  const cancelBtn = document.getElementById('cancelEdit');

  let activeCard = null;

  function showModal() {
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    nameInput && nameInput.focus();
  }

  function hideModal() {
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
    activeCard = null;
  }

  // Open modal when any plan edit button is clicked
  document.addEventListener('click', (e) => {
    const btn = e.target && e.target.closest ? e.target.closest('.edit-btn') : null;
    if (!btn) return;
    // find containing plan card
    const card = btn.closest && btn.closest('.plan-card');
    if (!card) return;
    activeCard = card;

    const titleEl = card.querySelector('.plan-header');
    const priceEl = card.querySelector('.price');
    const detailsEl = card.querySelector('.details');

    if (nameInput) nameInput.value = titleEl ? titleEl.textContent.trim() : '';
    if (priceInput) priceInput.value = priceEl ? priceEl.textContent.trim() : '';
    if (descInput) descInput.value = detailsEl ? detailsEl.textContent.trim() : '';

    showModal();
  });

  // Confirm: apply edits into card (simple in-place update)
  confirmBtn && confirmBtn.addEventListener('click', (evt) => {
    evt.preventDefault();
    if (!activeCard) return hideModal();

    const titleEl = activeCard.querySelector('.plan-header');
    const priceEl = activeCard.querySelector('.price');
    const detailsEl = activeCard.querySelector('.details');

    if (titleEl) titleEl.textContent = nameInput.value.trim() || 'Untitled';
    if (priceEl) priceEl.textContent = priceInput.value.trim() || '';
    if (detailsEl) detailsEl.textContent = descInput.value.trim() || '';

    hideModal();
  });

  // Cancel / close
  cancelBtn && cancelBtn.addEventListener('click', (e) => { e.preventDefault(); hideModal(); });

  // clicking overlay outside modal-box closes
  modal && modal.addEventListener('click', (e) => { if (e.target === modal) hideModal(); });

  // Escape closes modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.getAttribute('aria-hidden') === 'false') {
      hideModal();
    }
  });

  // prevent form submit default
  form && form.addEventListener('submit', (e) => e.preventDefault());
});