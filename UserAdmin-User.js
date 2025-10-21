/***************************************************************
 * Sidebar behavior (same as your reference)
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
 * Data & UI wiring (demo + hooks for DB)
 ***************************************************************/
(function () {
  // DEMO DATA - replace with database fetch logic
  const demoUsers = [
    { receipt: '1000', email: 'alice@example.com', password: 'password1' },
    { receipt: '1001', email: 'bob@example.com', password: 'password2' },
    { receipt: '1002', email: 'jane.doe@example.com', password: 'password3' },
    { receipt: '1003', email: 'john.smith@example.com', password: 'password4' },
    { receipt: '1004', email: 'user5@example.com', password: 'password5' },
    { receipt: '1005', email: 'user6@example.com', password: 'password6' },
    { receipt: '1006', email: 'user7@example.com', password: 'password7' },
    { receipt: '1007', email: 'user8@example.com', password: 'password8' }
  ];

  // Current in-memory dataset shown in table
  let users = demoUsers.slice();

  const tbody = document.querySelector('#usersTable tbody');
  const searchInput = document.getElementById('searchInput');
  const filterSelect = document.getElementById('filterSelect');

  // Render table rows
  function renderTable(rows) {
    tbody.innerHTML = '';
    rows.forEach(u => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escapeHtml(u.receipt)}</td>
        <td>${escapeHtml(u.email)}</td>
        <td>${escapeHtml(maskPassword(u.password))}</td>
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

  // Basic search/filter
  function applyFilters() {
    const q = (searchInput && searchInput.value || '').trim().toLowerCase();
    const f = (filterSelect && filterSelect.value) || 'all';
    // Note: filter by f is only placeholder; use your user.active flag when using real data
    const filtered = users.filter(u => {
      const matchText = !q || (u.receipt + ' ' + u.email).toLowerCase().includes(q);
      return matchText;
    });
    renderTable(filtered);
  }

  // Initial render
  applyFilters();

  // Wire search
  if (searchInput) searchInput.addEventListener('input', applyFilters);
  if (filterSelect) filterSelect.addEventListener('change', applyFilters);

  /* ===== Helpers ===== */
  function escapeHtml(str) {
    if (str == null) return '';
    return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
  }
  function maskPassword(p) {
    if (!p) return '';
    return '•'.repeat(Math.min(8, p.length));
  }

  /***************************************************************
   * Edit modal flow
   ***************************************************************/
  const editModal = document.getElementById('editModal');
  const editForm = document.getElementById('editForm');
  const editEmail = document.getElementById('editEmail');
  const editPassword = document.getElementById('editPassword');
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

  // open modal and populate with row data
  function openEditFor(receipt) {
    const u = users.find(x => x.receipt === receipt);
    if (!u) return;
    editReceipt.value = u.receipt;
    editEmail.value = u.email;
    editPassword.value = u.password;
    showEditModal();
  }

  // confirm edit
  confirmEdit.addEventListener('click', (e) => {
    e.preventDefault();
    const r = editReceipt.value;
    const idx = users.findIndex(x => x.receipt === r);
    if (idx >= 0) {
      // Update in-memory. Replace this with DB update call.
      users[idx].email = editEmail.value.trim();
      users[idx].password = editPassword.value;
      applyFilters();
    }
    hideEditModal();
  });

  cancelEdit.addEventListener('click', (e) => {
    e.preventDefault();
    hideEditModal();
  });

  // close when clicking overlay background
  editModal.addEventListener('click', (e) => {
    if (e.target === editModal) hideEditModal();
  });

  /***************************************************************
   * Delete confirm modal (custom)
   ***************************************************************/
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
    // Remove from in-memory array. Replace with backend delete call in production.
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

  /***************************************************************
   * Delegated table actions (Edit / Delete)
   ***************************************************************/
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
      showDeleteModal('Delete user ' + id + '? This action cannot be undone.');
      return;
    }
  });

  /***************************************************************
   * Example Add new user button (opens edit modal as "new")
   ***************************************************************/
  const addUserBtn = document.getElementById('addUserBtn');
  addUserBtn.addEventListener('click', (e) => {
    // Prepare form for new record
    editReceipt.value = String(Date.now()).slice(-5);
    editEmail.value = '';
    editPassword.value = '';
    showEditModal();

    // override confirm to add new user instead of update
    const onceHandler = (ev) => {
      ev.preventDefault();
      const newUser = {
        receipt: editReceipt.value,
        email: editEmail.value.trim(),
        password: editPassword.value
      };
      // push to in-memory list. Replace this with DB insert call.
      users.unshift(newUser);
      applyFilters();
      hideEditModal();
      // remove this one-time handler and reattach default behavior
      confirmEdit.removeEventListener('click', onceHandler);
    };
    confirmEdit.addEventListener('click', onceHandler);
  });

  /***************************************************************
   * Demo loader (replace with DB fetch)
   ***************************************************************/
  // Example async loader — in production call your backend and set users = response.users
  async function loadFromDatabase() {
    // Example:
    // const res = await fetch('/api/users');
    // const json = await res.json();
    // users = json.users;
    // applyFilters();

    // For demo we already have users.
    applyFilters();
  }

  // Kick off (demo)
  loadFromDatabase();

  // Escape with ESC closes modals
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') {
      // close any open modal
      if (editModal.getAttribute('aria-hidden') === 'false') hideEditModal();
      if (deleteModal.getAttribute('aria-hidden') === 'false') hideDeleteModal();
    }
  });

})();
