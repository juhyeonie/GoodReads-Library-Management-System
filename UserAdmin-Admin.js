/***************************************************************
 * Sidebar behavior (unchanged)
 ***************************************************************/
(function () {
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
})();

/***************************************************************
 * Data & UI wiring (demo + modal + role field + validation)
 ***************************************************************/
(function () {
  // DEMO DATA - replace with database fetch logic
  const demoUsers = [
    { receipt: '1000', email: 'alice@example.com', password: 'password1', role: 'Book Admin' },
    { receipt: '1001', email: 'bob@example.com', password: 'password2', role: 'Subscription Admin' },
    { receipt: '1002', email: 'jane.doe@example.com', password: 'password3', role: 'User Admin' },
    { receipt: '1003', email: 'john.smith@example.com', password: 'password4', role: 'Super Admin' },
    { receipt: '1004', email: 'user5@example.com', password: 'password5', role: 'Book Admin' },
    { receipt: '1005', email: 'user6@example.com', password: 'password6', role: 'Subscription Admin' },
    { receipt: '1006', email: 'user7@example.com', password: 'password7', role: 'User Admin' },
    { receipt: '1007', email: 'user8@example.com', password: 'password8', role: 'Admin' }
  ];

  let users = demoUsers.slice();

  const tbody = document.querySelector('#usersTable tbody');
  const searchInput = document.getElementById('searchInput');
  const filterSelect = document.getElementById('filterSelect');

  // Render table rows including Role column
  function renderTable(rows) {
    tbody.innerHTML = '';
    rows.forEach(u => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escapeHtml(u.receipt)}</td>
        <td>${escapeHtml(u.email)}</td>
        <td>${escapeHtml(maskPassword(u.password))}</td>
        <td>${escapeHtml(u.role || '')}</td>
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
    const filtered = users.filter(u => {
      const matchText = !q || (u.receipt + ' ' + u.email + ' ' + (u.role||'')).toLowerCase().includes(q);
      return matchText;
    });
    renderTable(filtered);
  }

  applyFilters();
  if (searchInput) searchInput.addEventListener('input', applyFilters);
  if (filterSelect) filterSelect.addEventListener('change', applyFilters);

  function escapeHtml(str) {
    if (str == null) return '';
    return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
  }
  function maskPassword(p) {
    if (!p) return '';
    return '•'.repeat(Math.min(8, p.length));
  }

  /**************** Modal elements (Edit + Add) ****************/
  const editModal = document.getElementById('editModal');
  const editForm = document.getElementById('editForm');
  const editEmail = document.getElementById('editEmail');
  const editPassword = document.getElementById('editPassword');
  const editRole = document.getElementById('editRole');
  const editReceipt = document.getElementById('editReceipt');
  const confirmEdit = document.getElementById('confirmEdit');
  const cancelEdit = document.getElementById('cancelEdit');

  const addModal = document.getElementById('addModal');
  const addForm = document.getElementById('addForm');
  const addEmail = document.getElementById('addEmail');
  const addPassword = document.getElementById('addPassword');
  const addRole = document.getElementById('addRole');
  const addReceipt = document.getElementById('addReceipt');
  const confirmAdd = document.getElementById('confirmAdd');
  const cancelAdd = document.getElementById('cancelAdd');
  const addUserBtn = document.getElementById('addUserBtn');

  function showModal(modal) {
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    const first = modal.querySelector('input, select, textarea');
    if (first) setTimeout(() => first.focus(), 50);
  }
  function hideModal(modal) {
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
  }

  // open edit modal and populate with row data
  function openEditFor(receipt) {
    const u = users.find(x => x.receipt === receipt);
    if (!u) return;
    editReceipt.value = u.receipt;
    editEmail.value = u.email;
    editPassword.value = u.password;
    editRole.value = u.role || '';
    clearValidation(editForm);
    showModal(editModal);
  }

  confirmEdit.addEventListener('click', (e) => {
    e.preventDefault();
    // validate
    const vals = {
      email: editEmail.value.trim(),
      password: editPassword.value,
      role: editRole.value
    };
    const errors = validateAdmin(vals);
    if (errors.length) {
      applyValidation(editForm, errors);
      return;
    }
    const r = editReceipt.value;
    const idx = users.findIndex(x => x.receipt === r);
    if (idx >= 0) {
      users[idx].email = vals.email;
      users[idx].password = vals.password;
      users[idx].role = vals.role;
      applyFilters();
    }
    hideModal(editModal);
  });

  cancelEdit.addEventListener('click', (e) => {
    e.preventDefault();
    hideModal(editModal);
  });

  editModal.addEventListener('click', (e) => {
    if (e.target === editModal) hideModal(editModal);
  });

  /**************** Add modal flow ****************/
  addUserBtn.addEventListener('click', (e) => {
    addReceipt.value = String(Date.now()).slice(-5);
    addEmail.value = '';
    addPassword.value = '';
    addRole.value = '';
    clearValidation(addForm);
    showModal(addModal);
  });

  confirmAdd.addEventListener('click', (e) => {
    e.preventDefault();
    const vals = {
      email: addEmail.value.trim(),
      password: addPassword.value,
      role: addRole.value
    };
    const errors = validateAdmin(vals);
    if (errors.length) {
      applyValidation(addForm, errors);
      return;
    }
    const newUser = {
      receipt: addReceipt.value,
      email: vals.email,
      password: vals.password,
      role: vals.role
    };
    users.unshift(newUser); // push to top
    applyFilters();
    hideModal(addModal);
  });

  cancelAdd.addEventListener('click', (e) => {
    e.preventDefault();
    hideModal(addModal);
  });

  addModal.addEventListener('click', (e) => {
    if (e.target === addModal) hideModal(addModal);
  });

  /**************** Delete modal (unchanged) ****************/
  const deleteModal = document.getElementById('deleteModal');
  const deleteMessage = document.getElementById('deleteMessage');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
  let deleteTargetId = null;

  function showDeleteModal(message) {
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
      deleteTargetId = id;
      showDeleteModal('Delete admin ' + id + '? This action cannot be undone.');
      return;
    }
  });

  /**************** Helpers: validation ****************/
  function validateAdmin({ email, password, role }) {
    const errors = [];
    // email basic
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) errors.push({ field: 'email', message: 'Email is required' });
    else if (!emailRegex.test(email)) errors.push({ field: 'email', message: 'Email must be valid' });

    if (!password) errors.push({ field: 'password', message: 'Password is required' });
    else if (password.length < 6) errors.push({ field: 'password', message: 'Password must be at least 6 characters' });

    if (!role) errors.push({ field: 'role', message: 'Role is required' });

    return errors;
  }

  // Apply validation UI: mark invalid fields and focus first invalid
  function applyValidation(formEl, errors) {
    clearValidation(formEl);
    let first = null;
    errors.forEach(err => {
      const el = formEl.querySelector(`[name="${err.field}"]`);
      if (el) {
        el.dataset.invalid = 'true';
        el.setAttribute('aria-invalid', 'true');
        if (!first) first = el;
      }
    });
    if (first) {
      first.focus();
    } else {
      // fallback: alert messages
      alert(errors.map(e => e.message).join('\n'));
    }
  }

  function clearValidation(formEl) {
    const invalids = formEl.querySelectorAll('[data-invalid="true"]');
    invalids.forEach(i => {
      i.removeAttribute('data-invalid');
      i.removeAttribute('aria-invalid');
    });
  }

  /**************** Demo loader & helpers ****************/
  async function loadFromDatabase() {
    // Replace with API fetch in production
    applyFilters();
  }
  loadFromDatabase();

  // ESC closes open modals
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') {
      if (editModal.getAttribute('aria-hidden') === 'false') hideModal(editModal);
      if (addModal.getAttribute('aria-hidden') === 'false') hideModal(addModal);
      if (deleteModal.getAttribute('aria-hidden') === 'false') hideDeleteModal();
    }
  });

})();
