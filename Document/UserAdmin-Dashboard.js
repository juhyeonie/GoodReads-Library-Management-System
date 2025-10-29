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
  if (menuToggle) menuToggle.addEventListener('click', (e) => { e.stopPropagation(); sidebar.classList.toggle('mobile-open'); overlay.classList.toggle('active'); });
  if (overlay) overlay.addEventListener('click', () => { sidebar.classList.remove('mobile-open'); overlay.classList.remove('active'); });

  const menuLinks = sidebar.querySelectorAll('.menu-item');
  menuLinks.forEach(link => link.addEventListener('click', () => { if (isMobile()) { sidebar.classList.remove('mobile-open'); overlay.classList.remove('active'); } }));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && isMobile() && sidebar.classList.contains('mobile-open')) { sidebar.classList.remove('mobile-open'); overlay.classList.remove('active'); } });

  /* ---------------- Data / API ---------------- */
  const API_ROOT = '/GoodReads-Library-Management-System/Document/Backend/api/customers.php';
  let nextId = 1000;
  let customers = [];

  const tbody = document.querySelector('#customersTable tbody');

  function escapeHtml(str) {
    if (str == null) return '';
    return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
  }

  function formatPaymentMethod(method) {
    const methods = { 'credit_card': 'Credit Card', 'gcash': 'GCash', 'maya': 'Maya', 'paypal': 'PayPal' };
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
  // raw values from DB (may be "Basic Plan", "Standard Plan", "Free Plan", "Premium Plan", "Expired", etc.)
  const rawPlan = String(row.Plan ?? row.plan ?? row.Plan_Status ?? row.plan_status ?? '').trim();
  const rawRole = String(row.Role ?? row.role ?? '').trim().toLowerCase();

  // canonicalize plan -> one of: 'free', 'standard', 'premium', 'expired', 'cancelled', '' (unknown)
  const planLower = rawPlan.toLowerCase();
  let canonicalPlan = '';

  if (!planLower) {
    canonicalPlan = ''; // unknown
  } else if (planLower.includes('free') || planLower.includes('basic')) {
    canonicalPlan = 'free';
  } else if (planLower.includes('standard')) {
    canonicalPlan = 'standard';
  } else if (planLower.includes('premium')) {
    canonicalPlan = 'premium';
  } else if (planLower.includes('expired')) {
    canonicalPlan = 'expired';
  } else if (planLower.includes('cancel')) { // cancelled / cancel
    canonicalPlan = 'cancelled';
  } else {
    // fallback: sometimes Plan column may be empty and Plan_Status indicates 'Active' while PaymentMethod says 'Free Plan'
    const paymentLower = String(row.Payment_Method ?? row.payment_method ?? row.payment ?? '').toLowerCase();
    if (paymentLower.includes('free')) canonicalPlan = 'free';
    else canonicalPlan = planLower; // keep original (but lowercase)
  }

  return {
    receipt: String(row.AccountID ?? row.accountid ?? row.receipt ?? ''),
    email: row.Email ?? row.email ?? '',
    plan: canonicalPlan, // canonical value used everywhere
    rawPlan: rawPlan,    // keep original text if you want to display it later
    payment: (row.Payment_Method ?? row.payment_method ?? row.payment ?? '').toString(),
    password: row.Password ?? row.password ?? '',
    role: rawRole, // already lowercase
    plan_status: (row.Plan_Status ?? row.plan_status ?? '').toString()
  };
}



async function loadCustomersFromServer() {
  try {
    const res = await fetch(API_ROOT, { method: 'GET' });
    if (!res.ok) throw new Error('Network response not ok: ' + res.status);
    const data = await res.json();

    customers = (data || [])
      .map(normalizeRow)
      .filter(c => {
        const role = (c.role || '').toString().toLowerCase();
        // Exclude specific admin roles (lowercase)
        return role !== 'superadmin' && role !== 'subsadmin' && role !== 'useradmin';
        // alternative: exclude any role containing "admin":
        // return !role.includes('admin');
      });

    const numeric = customers.map(x => parseInt(x.receipt, 10)).filter(n => !isNaN(n));
    nextId = numeric.length ? Math.max(...numeric) + 1 : nextId;
    renderTable();
  } catch (err) {
    console.error('Failed to load customers', err);
    customers = customers || [];
    renderTable();
  }
}



  /* ---------------- Rendering & Stats ---------------- */
function updateStats() {
  const stats = { free:0, standard:0, premium:0, expired:0, cancelled:0 };
  customers.forEach(c => {
    const p = (c.plan || '').toString().toLowerCase();

    if (p === 'free') stats.free++;
    else if (p === 'standard') stats.standard++;
    else if (p === 'premium') stats.premium++;
    else if (p === 'expired') stats.expired++;
    else if (p === 'cancelled') stats.cancelled++;
    else {
      // fallback: if plan_status explicitly marked expired
      if ((c.plan_status || '').toLowerCase() === 'expired') stats.expired++;
    }
  });

  // update DOM
  document.getElementById('freeCount').textContent = stats.free;
  document.getElementById('standardCount').textContent = stats.standard;
  document.getElementById('premiumCount').textContent = stats.premium;
  document.getElementById('expiredCount').textContent = stats.expired;
  document.getElementById('cancelledCount').textContent = stats.cancelled;
}


  function renderTable() {
    tbody.innerHTML = '';
    // show newest first (AccountID desc)
    const rows = customers.slice().sort((a,b) => Number(b.receipt) - Number(a.receipt));
    rows.forEach(u => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escapeHtml(u.receipt)}</td>
        <td>${escapeHtml(u.email)}</td>
        <td><span class="plan-badge ${escapeHtml(u.plan)}">${escapeHtml(formatPlan(u.plan))}</span></td>
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
    updateStats();
  }

  // initial load
  loadCustomersFromServer();

  /* ======= Edit Modal logic ======= */
  const editModal = document.getElementById('editModal');
  const editEmail = document.getElementById('editEmail');
  const editPassword = document.getElementById('editPassword');
  const editPlan = document.getElementById('editPlan');
  const editPayment = document.getElementById('editPayment');
  const editReceipt = document.getElementById('editReceipt');
  const confirmEdit = document.getElementById('confirmEdit');
  const cancelEdit = document.getElementById('cancelEdit');

  function showEditModal() { if (!editModal) return; editModal.classList.add('show'); document.body.classList.add('no-scroll'); setTimeout(()=>editEmail && editEmail.focus(), 80); }
  function hideEditModal() { if (!editModal) return; editModal.classList.remove('show'); document.body.classList.remove('no-scroll'); }

  function openEditFor(receipt) {
    const u = customers.find(x => String(x.receipt) === String(receipt));
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
    const id = editReceipt.value;
    if (!id) return;
    const payload = {
      email: editEmail.value.trim(),
      plan: editPlan.value,
      payment: editPayment.value
    };
    if (editPassword.value) payload.password = editPassword.value;
    try {
      const res = await fetch(API_ROOT + '/' + encodeURIComponent(id), {
        method: 'PUT',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Update failed: ' + res.status);
      await loadCustomersFromServer();
      // let other pages know
      window.dispatchEvent(new CustomEvent('customers-updated'));
    } catch (err) {
      console.error('Edit failed', err);
      alert('Failed to update user — check console.');
    }
    hideEditModal();
  });

  cancelEdit.addEventListener('click', (e)=>{ e.preventDefault(); hideEditModal(); });
  editModal.addEventListener('click', (e)=>{ if (e.target === editModal) hideEditModal(); });

  /* ===== Add Modal ===== */
  const addModal = document.getElementById('addModal');
  const addEmail = document.getElementById('addEmail');
  const addPassword = document.getElementById('addPassword');
  const addPlan = document.getElementById('addPlan');
  const addPayment = document.getElementById('addPayment');
  const addReceipt = document.getElementById('addReceipt');
  const confirmAdd = document.getElementById('confirmAdd');
  const cancelAdd = document.getElementById('cancelAdd');

  function showAddModal() { if (!addModal) return; addModal.classList.add('show'); document.body.classList.add('no-scroll'); setTimeout(()=>addEmail && addEmail.focus(), 80); }
  function hideAddModal() { if (!addModal) return; addModal.classList.remove('show'); document.body.classList.remove('no-scroll'); }

  // open add modal when clicking table-level add button (if exists)
  const addUserBtn = document.getElementById('addUserBtn');
  if (addUserBtn) addUserBtn.addEventListener('click', (e) => {
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
      const res = await fetch(API_ROOT, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(newUser)
      });
      if (!res.ok) throw new Error('Add failed: ' + res.status);
      await loadCustomersFromServer();
      window.dispatchEvent(new CustomEvent('customers-updated'));
      hideAddModal();
    } catch (err) {
      console.error('Add failed', err);
      alert('Failed to add user — check console.');
    }
  });

  cancelAdd.addEventListener('click', (e)=>{ e.preventDefault(); hideAddModal(); });
  addModal.addEventListener('click', (e)=>{ if (e.target === addModal) hideAddModal(); });

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
    setTimeout(()=>confirmDeleteBtn && confirmDeleteBtn.focus(), 80);
  }
  function hideDeleteModal() { deleteModal.classList.remove('show'); document.body.classList.remove('no-scroll'); deleteTargetId = null; }

  confirmDeleteBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    if (!deleteTargetId) { hideDeleteModal(); return; }
    try {
      const res = await fetch(API_ROOT + '/' + encodeURIComponent(deleteTargetId), { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed: ' + res.status);
      await loadCustomersFromServer();
      window.dispatchEvent(new CustomEvent('customers-updated'));
    } catch (err) {
      console.error('Delete failed', err);
      alert('Failed to delete user — check console.');
    }
    hideDeleteModal();
  });

  cancelDeleteBtn.addEventListener('click', (e)=>{ e.preventDefault(); hideDeleteModal(); });
  deleteModal.addEventListener('click', (e)=>{ if (e.target === deleteModal) hideDeleteModal(); });

  /* Delegated table actions */
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

  // Listen for updates dispatched by UserAdmin-User.js (when add/edit/delete performed there)
  window.addEventListener('customers-updated', () => {
    loadCustomersFromServer();
  });

  // Expose for debugging
  window.loadCustomersFromServer = loadCustomersFromServer;

})();
