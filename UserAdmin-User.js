
/* UserAdmin-User.js - Customer Management */
(function () {
  const SIDEBAR_COLLAPSED_KEY = 'gr_sidebar_collapsed';
  const MOBILE_BREAK = 800;

  // Layout elements
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
  let nextId = 1008; // Auto-increment counter
  
  const demoUsers = [
    { receipt: '1000', email: 'dfdfd', plan: 'free', payment: 'credit_card' },
    { receipt: '1001', email: 'alice@example.com', plan: 'standard', payment: 'gcash' },
    { receipt: '1002', email: 'bob@example.com', plan: 'premium', payment: 'maya' },
    { receipt: '1003', email: 'jane.doe@example.com', plan: 'free', payment: 'paypal' },
    { receipt: '1004', email: 'john.smith@example.com', plan: 'standard', payment: 'credit_card' },
    { receipt: '1005', email: 'user5@example.com', plan: 'premium', payment: 'gcash' },
    { receipt: '1006', email: 'user6@example.com', plan: 'free', payment: 'maya' },
    { receipt: '1007', email: 'user7@example.com', plan: 'cancelled', payment: 'paypal' }
  ];

  let users = demoUsers.slice();

  const tbody = document.querySelector('#usersTable tbody');
  const searchInput = document.getElementById('searchInput');
  const filterSelect = document.getElementById('filterSelect');

  function escapeHtml(str) {
    if (str == null) return '';
    return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
  }

  function formatPaymentMethod(method) {
    const methods = {
      'credit_card': 'Credit Card',
      'gcash': 'GCash',
      'maya': 'Maya',
      'paypal': 'PayPal'
    };
    return methods[method] || method;
  }

  function formatPlan(plan) {
    return plan.charAt(0).toUpperCase() + plan.slice(1);
  }

  function renderTable(rows) {
    tbody.innerHTML = '';
    rows.forEach(u => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escapeHtml(u.receipt)}</td>
        <td>${escapeHtml(u.email)}</td>
        <td>${escapeHtml(formatPlan(u.plan))}</td>
        <td>${escapeHtml(formatPaymentMethod(u.payment))}</td>
        <td style="text-align:right">
          <div class="actions">
            <button class="pill edit" data-id="${escapeHtml(u.receipt)}">Edit</button>
            <button class="pill delete" data-id="${escapeHtml(u.receipt)}">Delete</button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  function applyFilters() {
    const q = (searchInput && searchInput.value || '').trim().toLowerCase();
    const f = (filterSelect && filterSelect.value) || 'all';
  
    const filtered = users.filter(u => {
      const matchText = !q || (u.receipt + ' ' + u.email).toLowerCase().includes(q);
      const matchFilter = f === 'all' || u.plan === f;
      return matchText && matchFilter;
    });
    renderTable(filtered);
  }

  // Initial render
  applyFilters();
  if (searchInput) searchInput.addEventListener('input', applyFilters);
  if (filterSelect) filterSelect.addEventListener('change', applyFilters);

  /***************************************************************
   * Modals: Edit, Add, Delete
   ***************************************************************/

  // Edit modal elements
  const editModal = document.getElementById('editModal');
  const editForm = document.getElementById('editForm');
  const editEmail = document.getElementById('editEmail');
  const editPassword = document.getElementById('editPassword');
  const editPlan = document.getElementById('editPlan');
  const editPayment = document.getElementById('editPayment');
  const editReceipt = document.getElementById('editReceipt');
  const confirmEdit = document.getElementById('confirmEdit');
  const cancelEdit = document.getElementById('cancelEdit');

  function showEditModal() {
    if (!editModal) return;
    editModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    setTimeout(() => { editEmail && editEmail.focus(); }, 80);
  }
  function hideEditModal() {
    if (!editModal) return;
    editModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
  }

  function openEditFor(receipt) {
    const u = users.find(x => x.receipt === receipt);
    if (!u) return;
    editReceipt.value = u.receipt;
    editEmail.value = u.email;
    editPassword.value = '';
    editPlan.value = u.plan || '';
    editPayment.value = u.payment || '';
    showEditModal();
  }

  confirmEdit.addEventListener('click', (e) => {
    e.preventDefault();
    const r = editReceipt.value;
    const idx = users.findIndex(x => x.receipt === r);
    if (idx >= 0) {
      users[idx].email = editEmail.value.trim();
      if (editPassword.value) users[idx].password = editPassword.value;
      users[idx].plan = editPlan.value;
      users[idx].payment = editPayment.value;
      applyFilters();
    }
    hideEditModal();
  });

  cancelEdit.addEventListener('click', (e) => {
    e.preventDefault();
    hideEditModal();
  });

  editModal.addEventListener('click', (e) => {
    if (e.target === editModal) hideEditModal();
  });

  /**************** Add User Modal ****************/
  const addModal = document.getElementById('addModal');
  const addForm = document.getElementById('addForm');
  const addEmail = document.getElementById('addEmail');
  const addPassword = document.getElementById('addPassword');
  const addPlan = document.getElementById('addPlan');
  const addPayment = document.getElementById('addPayment');
  const addReceipt = document.getElementById('addReceipt');
  const confirmAdd = document.getElementById('confirmAdd');
  const cancelAdd = document.getElementById('cancelAdd');
  const addUserBtn = document.getElementById('addUserBtn');

  function showAddModal() {
    if (!addModal) return;
    addModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    setTimeout(() => addEmail && addEmail.focus(), 80);
  }
  function hideAddModal() {
    if (!addModal) return;
    addModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
  }

  addUserBtn.addEventListener('click', (e) => {
    addReceipt.value = String(nextId);
    addEmail.value = '';
    addPassword.value = '';
    addPlan.value = '';
    addPayment.value = '';
    showAddModal();
  });

  confirmAdd.addEventListener('click', (e) => {
    e.preventDefault();
    const email = (addEmail && addEmail.value || '').trim();
    const password = (addPassword && addPassword.value || '');
    const plan = (addPlan && addPlan.value || '');
    const payment = (addPayment && addPayment.value || '');
    
    if (!email || !password || !plan || !payment) {
      alert('Please fill in all fields.');
      return;
    }
    const newUser = {
      receipt: addReceipt.value,
      email,
      password,
      plan,
      payment
    };
    users.unshift(newUser);
    nextId++; // Increment for next user
    applyFilters();
    hideAddModal();
  });

  cancelAdd.addEventListener('click', (e) => {
    e.preventDefault();
    hideAddModal();
  });

  addModal.addEventListener('click', (e) => {
    if (e.target === addModal) hideAddModal();
  });

  /**************** Delete modal ****************/
  const deleteModal = document.getElementById('deleteModal');
  const deleteMessage = document.getElementById('deleteMessage');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');

  let deleteTargetId = null;

  function showDeleteModal(message, id) {
    deleteTargetId = id;
    deleteMessage.textContent = message || 'Are you sure you want to delete this user?';
    deleteModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    setTimeout(() => confirmDeleteBtn && confirmDeleteBtn.focus(), 80);
  }
  function hideDeleteModal() {
    deleteModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
    deleteTargetId = null;
  }

  confirmDeleteBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (!deleteTargetId) { hideDeleteModal(); return; }
    users = users.filter(u => u.receipt !== deleteTargetId);
    applyFilters();
    hideDeleteModal();
  });

  cancelDeleteBtn.addEventListener('click', (e) => {
    e.preventDefault();
    hideDeleteModal();
  });

  deleteModal.addEventListener('click', (e) => {
    if (e.target === deleteModal) hideDeleteModal();
  });

  /**************** Delegated table actions ****************/
  document.addEventListener('click', (e) => {
    const editBtn = e.target.closest && e.target.closest('.edit');
    if (editBtn) {
      const id = editBtn.dataset.id;
      openEditFor(id);
      return;
    }

    const delBtn = e.target.closest && e.target.closest('.delete');
    if (delBtn) {
      const id = delBtn.dataset.id;
      showDeleteModal('Delete user ' + id + '? This action cannot be undone.', id);
      return;
    }
  });

  /* ESC closes modals */
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') {
      if (editModal && editModal.getAttribute('aria-hidden') === 'false') hideEditModal();
      if (addModal && addModal.getAttribute('aria-hidden') === 'false') hideAddModal();
      if (deleteModal && deleteModal.getAttribute('aria-hidden') === 'false') hideDeleteModal();
    }
    });

})();
