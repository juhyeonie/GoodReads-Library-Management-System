(function () {
  const COLLAPSED_KEY = 'sidebar_collapsed';
  const MOBILE_BREAKPOINT = 768;

  const sidebar = document.getElementById('sidebar');
  const menuToggle = document.getElementById('menuToggle');
  const collapseBtn = document.getElementById('collapseBtn');
  const mainContent = document.getElementById('mainContent');
  const overlay = document.getElementById('sidebarOverlay');

  function isMobile() { return window.innerWidth <= MOBILE_BREAKPOINT; }

  function updateLayout() {
    if (isMobile()) {
      sidebar.classList.remove('collapsed');
      mainContent.classList.remove('collapsed');
      sidebar.classList.remove('mobile-open');
      overlay.classList.remove('active');
    } else {
      const isCollapsed = localStorage.getItem(COLLAPSED_KEY) === 'true';
      sidebar.classList.toggle('collapsed', isCollapsed);
      mainContent.classList.toggle('collapsed', isCollapsed);
      sidebar.classList.remove('mobile-open');
      overlay.classList.remove('active');
    }
  }

  updateLayout();
  window.addEventListener('resize', updateLayout);

  if (collapseBtn) {
    collapseBtn.addEventListener('click', () => {
      if (isMobile()) return;
      const isCollapsed = sidebar.classList.toggle('collapsed');
      mainContent.classList.toggle('collapsed', isCollapsed);
      collapseBtn.setAttribute('aria-pressed', String(isCollapsed));
      localStorage.setItem(COLLAPSED_KEY, isCollapsed);
    });
  }

  if (menuToggle) {
    menuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      sidebar.classList.toggle('mobile-open');
      overlay.classList.toggle('active');
    });
  }

  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('mobile-open');
      overlay.classList.remove('active');
    });
  }

  const menuLinks = sidebar.querySelectorAll('.menu-item');
  menuLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (isMobile()) {
        sidebar.classList.remove('mobile-open');
        overlay.classList.remove('active');
      }
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isMobile() && sidebar.classList.contains('mobile-open')) {
      sidebar.classList.remove('mobile-open');
      overlay.classList.remove('active');
    }
  });

  /* ---------------- Data / API ---------------- */
  // POINT THIS to your PHP API location in XAMPP
  const API_ROOT = '/GoodReads-Library-Management-System/Document/Backend/api/customers.php';
  let nextId = 1000;
  let users = [];

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
    return methods[method] || method || '';
  }

  function formatPlan(plan) {
  if (!plan) return '';
  const p = String(plan).toLowerCase().trim();
  if (p === 'admin' || p === 'administrator') return ''; // hide admin
  // pretty-print usual values (handles "premium plan" or "premium")
  return p.replace(/\bplan\b/i, '').replace(/[_-]+/g,' ').trim().replace(/\b\w/g, c => c.toUpperCase());
}


 function normalizeRow(row) {
  const roleVal = (row.Role || row.role || '').toString().toLowerCase();
  // prefer Plan, then Plan_Status; never use Role as the plan
  const planVal = (row.Plan ?? row.plan ?? row.Plan_Status ?? row.plan_status ?? '') || '';
  return {
    receipt: String(row.AccountID ?? row.accountid ?? row.receipt ?? ''),
    email: row.Email ?? row.email ?? '',
    plan: planVal.toString().toLowerCase(),
    payment: (row.Payment_Method ?? row.payment_method ?? row.payment ?? '').toString().toLowerCase(),
    password: row.Password ?? row.password ?? '',
    role: roleVal,
    plan_status: (row.Plan_Status ?? row.plan_status ?? '').toString()
  };
}


async function loadUsersFromServer() {
  try {
    // correct: no trailing /customers because API_ROOT already points to customers.php
    const r = await fetch(API_ROOT, { method: 'GET' });
    if (!r.ok) throw new Error('Failed loading: ' + r.status);
    const data = await r.json();

    // Normalize and filter out admin roles
    users = (data || [])
      .map(normalizeRow)
      .filter(u => {
        const role = (u.role || '').toString().toLowerCase();
        // keep only customers, exclude any admin types
        return role !== 'admin' && role !== 'subsadmin' && role !== 'superadmin' && role !== 'useradmin';
      });

    // update nextId for new inserts
    const numeric = users.map(x => parseInt(x.receipt, 10)).filter(n => !isNaN(n));
    nextId = numeric.length ? Math.max(...numeric) + 1 : nextId;
    applyFilters();
  } catch (err) {
    console.error('loadUsersFromServer error', err);
    users = [];
    applyFilters();
  }
}



  /* ---------------- Rendering & Filters ---------------- */
  function renderTable(rows) {
    tbody.innerHTML = '';
    (rows || []).forEach(u => {
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

  if (searchInput) searchInput.addEventListener('input', applyFilters);
  if (filterSelect) filterSelect.addEventListener('change', applyFilters);

  // initial load
  loadUsersFromServer();

  /* ======= Edit Modal ======= */
  const editModal = document.getElementById('editModal');
  const editForm = document.getElementById('editForm');
  const editEmail = document.getElementById('editEmail');
  const editPassword = document.getElementById('editPassword');
  const editPlan = document.getElementById('editPlan');
  const editPayment = document.getElementById('editPayment');
  const editReceipt = document.getElementById('editReceipt');
  const confirmEdit = document.getElementById('confirmEdit');
  const cancelEdit = document.getElementById('cancelEdit');

  function showEditModal() { if (!editModal) return; editModal.classList.add('show'); document.body.classList.add('no-scroll'); setTimeout(() => { editEmail && editEmail.focus(); }, 80); }
  function hideEditModal() { if (!editModal) return; editModal.classList.remove('show'); document.body.classList.remove('no-scroll'); }

  function openEditFor(receipt) {
    const u = users.find(x => String(x.receipt) === String(receipt));
    if (!u) return;
    editReceipt.value = u.receipt;
    editEmail.value = u.email;
    editPassword.value = '';
    editPlan.value = u.plan || '';
    editPayment.value = u.payment || '';
    showEditModal();
  }

  confirmEdit.addEventListener('click', async (e) => {
    e.preventDefault();
    const r = editReceipt.value;
    const payload = {
      email: editEmail.value.trim(),
      plan: editPlan.value,
      payment: editPayment.value
    };
    if (editPassword.value) payload.password = editPassword.value;
    try {
      const res = await fetch(API_ROOT + '/' + encodeURIComponent(r), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Update failed');
      await loadUsersFromServer();
      // notify dashboard
      window.dispatchEvent(new CustomEvent('customers-updated'));
    } catch (err) {
      console.error('Update error', err);
      alert('Failed to update user — check console.');
    }
    hideEditModal();
  });

  cancelEdit.addEventListener('click', (e) => { e.preventDefault(); hideEditModal(); });
  editModal.addEventListener('click', (e) => { if (e.target === editModal) hideEditModal(); });

  /* ===== Add Modal ===== */
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

  function showAddModal() { if (!addModal) return; addModal.classList.add('show'); document.body.classList.add('no-scroll'); setTimeout(() => addEmail && addEmail.focus(), 80); }
  function hideAddModal() { if (!addModal) return; addModal.classList.remove('show'); document.body.classList.remove('no-scroll'); }

  addUserBtn.addEventListener('click', (e) => {
    addReceipt.value = String(nextId);
    addEmail.value = '';
    addPassword.value = '';
    addPlan.value = '';
    addPayment.value = '';
    showAddModal();
  });

  confirmAdd.addEventListener('click', async (e) => {
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
      email,
      password,
      plan,
      payment,
      role: 'Customer',
      plan_status: (plan === 'expired' ? 'Expired' : 'Active')
    };
    try {
      const r = await fetch(API_ROOT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      if (!r.ok) throw new Error('Add failed');
      await loadUsersFromServer();
      nextId++;
      window.dispatchEvent(new CustomEvent('customers-updated'));
      hideAddModal();
    } catch (err) {
      console.error('Add error', err);
      alert('Failed to add user — check console.');
    }
  });

  cancelAdd.addEventListener('click', (e) => { e.preventDefault(); hideAddModal(); });
  addModal.addEventListener('click', (e) => { if (e.target === addModal) hideAddModal(); });

  /* ===== Delete modal ===== */
  const deleteModal = document.getElementById('deleteModal');
  const deleteMessage = document.getElementById('deleteMessage');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');

  let deleteTargetId = null;

  function showDeleteModal(message, id) {
    deleteTargetId = id;
    deleteMessage.textContent = message || 'Are you sure you want to delete this user?';
    deleteModal.classList.add('show');
    document.body.classList.add('no-scroll');
    setTimeout(() => confirmDeleteBtn && confirmDeleteBtn.focus(), 80);
  }
  function hideDeleteModal() {
    deleteModal.classList.remove('show');
    document.body.classList.remove('no-scroll');
    deleteTargetId = null;
  }

  confirmDeleteBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    if (!deleteTargetId) { hideDeleteModal(); return; }
    try {
      const res = await fetch(API_ROOT + '/' + encodeURIComponent(deleteTargetId), {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Delete failed');
      await loadUsersFromServer();
      window.dispatchEvent(new CustomEvent('customers-updated'));
    } catch (err) {
      console.error('Delete error', err);
      alert('Failed to delete user — check console.');
    }
    hideDeleteModal();
  });

  cancelDeleteBtn.addEventListener('click', (e) => { e.preventDefault(); hideDeleteModal(); });
  deleteModal.addEventListener('click', (e) => { if (e.target === deleteModal) hideDeleteModal(); });

  /* ===== Delegated table actions ===== */
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
      if (editModal && editModal.classList.contains('show')) hideEditModal();
      if (addModal && addModal.classList.contains('show')) hideAddModal();
      if (deleteModal && deleteModal.classList.contains('show')) hideDeleteModal();
    }
  });

  // debug helper
  window.reloadCustomersFromServer = loadUsersFromServer;

})();

// Logout: redirect to sign in
document.querySelectorAll('.logout-icon').forEach(el => {
  el.addEventListener('click', (ev) => {
    ev.preventDefault();
    // optional: clear any auth-like items in localStorage/sessionStorage
    localStorage.removeItem('auth_token');         // if you use one
    localStorage.removeItem('sidebar_collapsed');  // keep the rest if wanted
    sessionStorage.clear();                        // optional
    // redirect to sign in page (adjust path if needed)
    window.location.href = 'SignIn.html';
  });
});
