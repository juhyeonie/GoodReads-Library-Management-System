// Sidebar & layout behaviour — same pattern as your other pages
document.addEventListener('DOMContentLoaded', () => {
  const SIDEBAR_COLLAPSED_KEY = 'gr_sidebar_collapsed';
  const MOBILE_BREAK = 800;

  const sidebar = document.getElementById('sidebar');
  const menuToggle = document.getElementById('menuToggle');
  const collapseBtn = document.getElementById('collapseBtn');
  const mainContent = document.getElementById('mainContent');

  function isMobile() { return window.innerWidth <= MOBILE_BREAK; }

  function applyLayout() {
    const collapsed = localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
    if (!sidebar || !mainContent) return;

    if (isMobile()) {
      sidebar.classList.remove('collapsed-desktop');
      sidebar.classList.remove('expanded');
      mainContent.classList.add('full');
      mainContent.classList.remove('collapsed-desktop');
      if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
      if (collapseBtn) collapseBtn.setAttribute('aria-pressed', 'false');
      document.body.classList.remove('no-scroll');
    } else {
      sidebar.classList.remove('expanded');
      mainContent.classList.remove('full');

      if (collapsed) {
        sidebar.classList.add('collapsed-desktop');
        mainContent.classList.add('collapsed-desktop');
        if (collapseBtn) collapseBtn.setAttribute('aria-pressed', 'true');
      } else {
        sidebar.classList.remove('collapsed-desktop');
        mainContent.classList.remove('collapsed-desktop');
        if (collapseBtn) collapseBtn.setAttribute('aria-pressed', 'false');
      }
      if (menuToggle) menuToggle.setAttribute('aria-expanded', 'true');
      document.body.classList.remove('no-scroll');
    }
  }

  applyLayout();
  window.addEventListener('resize', applyLayout);

  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => {
      if (!sidebar.classList.contains('expanded')) {
        sidebar.classList.add('expanded');
        document.body.classList.add('no-scroll');
        if (mainContent) mainContent.classList.remove('full');
        menuToggle.setAttribute('aria-expanded', 'true');
      } else {
        sidebar.classList.remove('expanded');
        document.body.classList.remove('no-scroll');
        if (mainContent) mainContent.classList.add('full');
        menuToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  if (collapseBtn && sidebar && mainContent) {
    collapseBtn.addEventListener('click', () => {
      if (isMobile()) return;
      const nowCollapsed = sidebar.classList.toggle('collapsed-desktop');
      mainContent.classList.toggle('collapsed-desktop', nowCollapsed);
      collapseBtn.setAttribute('aria-pressed', String(nowCollapsed));
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, nowCollapsed ? 'true' : 'false');
    });
  }

  document.addEventListener('click', (e) => {
    if (isMobile() && sidebar && sidebar.classList.contains('expanded')) {
      if (!sidebar.contains(e.target) && menuToggle && !menuToggle.contains(e.target)) {
        sidebar.classList.remove('expanded');
        document.body.classList.remove('no-scroll');
        if (mainContent) mainContent.classList.add('full');
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

  /* ---------------- Demo data & table rendering ---------------- */
  const demo = [
    { receipt: '1000', email: 'alice@example.com', password: 'p@ss1', plan: 'Monthly', date: '2025-08-01', status: 'active' },
    { receipt: '1001', email: 'bob@example.com', password: 'p@ss2', plan: 'Annual', date: '2024-10-15', status: 'expired' },
    { receipt: '1002', email: 'carol@example.com', password: 'p@ss3', plan: 'Monthly', date: '2025-09-01', status: 'active' },
    { receipt: '1003', email: 'dave@example.com', password: 'p@ss4', plan: 'Trial', date: '2025-07-10', status: 'cancelled' },
    { receipt: '1004', email: 'eve@example.com', password: 'p@ss5', plan: 'Annual', date: '2025-01-02', status: 'active' },
    { receipt: '1005', email: 'frank@example.com', password: 'p@ss6', plan: 'Monthly', date: '2024-05-20', status: 'expired' },
    { receipt: '1006', email: 'grace@example.com', password: 'p@ss7', plan: 'Monthly', date: '2025-02-18', status: 'active' },
    { receipt: '1007', email: 'heidi@example.com', password: 'p@ss8', plan: 'Trial', date: '2023-12-31', status: 'cancelled' }
  ];

  let users = demo.slice();

  const tbody = document.querySelector('#usersTable tbody');
  const searchInput = document.getElementById('searchInput');
  const statusFilter = document.getElementById('statusFilter');

  function renderTable(rows) {
    tbody.innerHTML = '';
    rows.forEach(u => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escapeHtml(u.receipt)}</td>
        <td>${escapeHtml(u.email)}</td>
        <td>${escapeHtml(maskPassword(u.password))}</td>
        <td>${escapeHtml(u.plan)}</td>
        <td>${escapeHtml(u.date)}</td>
        <td>${capitalize(u.status)}</td>
        <td style="text-align:right">
          <div class="actions">
            <button class="pill view" data-id="${escapeHtml(u.receipt)}">View</button>
            <button class="pill edit" data-id="${escapeHtml(u.receipt)}">Edit</button>
          </div>
        </td>`;
      tbody.appendChild(tr);
    });
  }

  function applyFilters() {
    const q = (searchInput && searchInput.value || '').trim().toLowerCase();
    const s = (statusFilter && statusFilter.value) || 'all';
    const filtered = users.filter(u => {
      const matchesText = !q || (u.receipt + ' ' + u.email).toLowerCase().includes(q);
      const matchesStatus = (s === 'all') || (u.status && u.status.toLowerCase() === s.toLowerCase());
      return matchesText && matchesStatus;
    });
    renderTable(filtered);
  }

  searchInput.addEventListener('input', applyFilters);
  statusFilter.addEventListener('change', applyFilters);

  applyFilters();

  /* ------------- Modals (Add & Edit) ------------- */
  const editModal = document.getElementById('editModal');
  const addModal = document.getElementById('addModal');
  const editForm = document.getElementById('editForm');
  const addForm = document.getElementById('addForm');

  // edit fields
  const editReceipt = document.getElementById('editReceipt');
  const editEmail = document.getElementById('editEmail');
  const editPassword = document.getElementById('editPassword');
  const editPlan = document.getElementById('editPlan');
  const editStatus = document.getElementById('editStatus');
  const confirmEdit = document.getElementById('confirmEdit');
  const cancelEdit = document.getElementById('cancelEdit');

  // add fields
  const addReceipt = document.getElementById('addReceipt');
  const addEmail = document.getElementById('addEmail');
  const addPassword = document.getElementById('addPassword');
  const addPlan = document.getElementById('addPlan');
  const addStatus = document.getElementById('addStatus');
  const confirmAdd = document.getElementById('confirmAdd');
  const cancelAdd = document.getElementById('cancelAdd');
  const addUserBtn = document.getElementById('addUserBtn');

  function showModal(modal) {
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    const first = modal.querySelector('input, select, textarea');
    if (first) setTimeout(() => first.focus(), 80);
  }
  function hideModal(modal) {
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
  }

  function openEdit(receipt) {
    const u = users.find(x => x.receipt === receipt);
    if (!u) return;
    editReceipt.value = u.receipt;
    editEmail.value = u.email;
    editPassword.value = u.password;
    editPlan.value = u.plan;
    editStatus.value = u.status || '';
    showModal(editModal);
  }

  confirmEdit.addEventListener('click', (e) => {
    e.preventDefault();
    const r = editReceipt.value;
    const idx = users.findIndex(x => x.receipt === r);
    if (idx >= 0) {
      users[idx].email = editEmail.value.trim();
      users[idx].password = editPassword.value;
      users[idx].plan = editPlan.value.trim();
      users[idx].status = editStatus.value;
      applyFilters();
    }
    hideModal(editModal);
  });

  cancelEdit.addEventListener('click', (e) => {
    e.preventDefault();
    hideModal(editModal);
  });

  editModal.addEventListener('click', (e) => { if (e.target === editModal) hideModal(editModal); });

  /* Add flow */
  addUserBtn.addEventListener('click', () => {
    addReceipt.value = String(Date.now()).slice(-5);
    addEmail.value = '';
    addPassword.value = '';
    addPlan.value = '';
    addStatus.value = '';
    showModal(addModal);
  });

  confirmAdd.addEventListener('click', (e) => {
    e.preventDefault();
    const newUser = {
      receipt: addReceipt.value,
      email: addEmail.value.trim(),
      password: addPassword.value,
      plan: addPlan.value.trim(),
      date: new Date().toISOString().slice(0,10),
      status: addStatus.value || 'active'
    };
    users.unshift(newUser);
    applyFilters();
    hideModal(addModal);
  });

  cancelAdd.addEventListener('click', (e) => {
    e.preventDefault();
    hideModal(addModal);
  });

  addModal.addEventListener('click', (e) => { if (e.target === addModal) hideModal(addModal); });

  /* Delete modal wiring (optional) */
  const deleteModal = document.getElementById('deleteModal');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
  let deleteTargetId = null;

  function showDelete(message, id) {
    deleteTargetId = id;
    document.getElementById('deleteMessage').textContent = message;
    deleteModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
  }
  function hideDelete() {
    deleteModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
    deleteTargetId = null;
  }

  confirmDeleteBtn && confirmDeleteBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (!deleteTargetId) { hideDelete(); return; }
    users = users.filter(u => u.receipt !== deleteTargetId);
    applyFilters();
    hideDelete();
  });
  cancelDeleteBtn && cancelDeleteBtn.addEventListener('click', (e) => { e.preventDefault(); hideDelete(); });
  deleteModal && deleteModal.addEventListener('click', (e) => { if (e.target === deleteModal) hideDelete(); });

  /* Delegated actions for View / Edit */
  document.addEventListener('click', (e) => {
    const editBtn = e.target.closest && e.target.closest('.edit');
    if (editBtn) {
      const id = editBtn.dataset.id;
      openEdit(id);
      return;
    }
    const viewBtn = e.target.closest && e.target.closest('.view');
    if (viewBtn) {
      // intentionally no function yet
      return;
    }
  });

  /* helpers */
  function escapeHtml(str) {
    if (str == null) return '';
    return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
  }
  function maskPassword(p) { if (!p) return ''; return '•'.repeat(Math.min(8, p.length)); }
  function capitalize(s) { if (!s) return ''; return s.charAt(0).toUpperCase() + s.slice(1); }

});
