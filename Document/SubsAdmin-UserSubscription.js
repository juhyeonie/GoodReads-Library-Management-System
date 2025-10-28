// ...existing code...
document.addEventListener('DOMContentLoaded', () => {
  const SIDEBAR_COLLAPSED_KEY = 'gr_subs_sidebar_collapsed';
  const MOBILE_BREAK = 800;

  const sidebar = document.getElementById('sidebar');
  const menuToggle = document.getElementById('menuToggle');
  const collapseBtn = document.getElementById('collapseBtn');
  const mainEl = document.getElementById('mainContent');

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
    }
  }

  applyLayout();
  window.addEventListener('resize', applyLayout);

  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => {
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

  if (collapseBtn && sidebar && mainEl) {
    collapseBtn.addEventListener('click', () => {
      if (isMobile()) return;
      const nowCollapsed = sidebar.classList.toggle('collapsed-desktop');
      mainEl.classList.toggle('collapsed-desktop', nowCollapsed);
      collapseBtn.setAttribute('aria-pressed', String(nowCollapsed));
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, nowCollapsed ? 'true' : 'false');
    });
  }

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

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isMobile() && sidebar && sidebar.classList.contains('expanded')) {
      sidebar.classList.remove('expanded');
      document.body.classList.remove('no-scroll');
      if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
    }
  });

  /* Modal + table actions */
  const usersTable = document.getElementById('usersTable');
  const editModal = document.getElementById('editUserModal');
  const editForm = document.getElementById('editUserForm');
  const userEmail = document.getElementById('userEmail');
  const userPlan = document.getElementById('userPlan');
  const userAmount = document.getElementById('userAmount');
  const userStatus = document.getElementById('userStatus');
  const confirmBtn = document.getElementById('confirmUserEdit');
  const cancelBtn = document.getElementById('cancelUserEdit');

  let activeRow = null;

  function showEdit() {
    if (!editModal) return;
    editModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    userEmail && userEmail.focus();
  }
  function hideEdit() {
    if (!editModal) return;
    editModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
    activeRow = null;
  }

  // delegate clicks for edit (view removed)
  document.addEventListener('click', (e) => {
    const editBtn = e.target.closest && e.target.closest('.edit-btn');
    if (editBtn) {
      const tr = editBtn.closest('tr');
      if (!tr) return;
      activeRow = tr;
      const get = (col) => (tr.querySelector(`[data-col="${col}"]`) || {}).textContent || '';
      if (userEmail) userEmail.value = get('email').trim();
      if (userPlan) userPlan.value = get('plan').trim();
      if (userAmount) userAmount.value = get('amount').trim();
      if (userStatus) userStatus.value = get('status').trim();
      showEdit();
      return;
    }
  });

  // confirm edit -> update row
  confirmBtn && confirmBtn.addEventListener('click', (evt) => {
    evt.preventDefault();
    if (!activeRow) { hideEdit(); return; }
    const set = (col, value) => {
      const el = activeRow.querySelector(`[data-col="${col}"]`);
      if (el) el.textContent = value;
    };
    set('email', userEmail ? userEmail.value.trim() : '');
    set('plan', userPlan ? userPlan.value.trim() : '');
    set('amount', userAmount ? userAmount.value.trim() : '');
    set('status', userStatus ? userStatus.value.trim() : '');
    hideEdit();
  });

  cancelBtn && cancelBtn.addEventListener('click', (e) => { e.preventDefault(); hideEdit(); });

  // clicking overlay outside modal-box closes
  editModal && editModal.addEventListener('click', (e) => { if (e.target === editModal) hideEdit(); });

  // escape closes modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && editModal && editModal.getAttribute('aria-hidden') === 'false') hideEdit();
  });

  // simple search/filter (client-side)
  const searchInput = document.getElementById('userSearch');
  const statusFilter = document.getElementById('statusFilter');

  function filterRows() {
    const q = (searchInput && searchInput.value || '').trim().toLowerCase();
    const s = (statusFilter && statusFilter.value) || 'all';
    const rows = usersTable && usersTable.tBodies[0] && Array.from(usersTable.tBodies[0].rows) || [];
    rows.forEach(r => {
      const email = (r.querySelector('[data-col="email"]') || {}).textContent || '';
      const plan = (r.querySelector('[data-col="plan"]') || {}).textContent || '';
      const status = (r.querySelector('[data-col="status"]') || {}).textContent || '';
      const matchesQuery = !q || (email + ' ' + plan).toLowerCase().includes(q);
      const matchesStatus = (s === 'all') || (status.toLowerCase() === s);
      r.style.display = (matchesQuery && matchesStatus) ? '' : 'none';
    });
  }

  if (searchInput) searchInput.addEventListener('input', filterRows);
  if (statusFilter) statusFilter.addEventListener('change', filterRows);
  filterRows();
});