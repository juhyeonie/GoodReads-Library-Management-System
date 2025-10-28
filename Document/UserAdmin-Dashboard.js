(function () {
  const COLLAPSED_KEY = 'sidebar_collapsed';
  const MOBILE_BREAKPOINT = 768;

  const sidebar = document.getElementById('sidebar');
  const menuToggle = document.getElementById('menuToggle');
  const collapseBtn = document.getElementById('collapseBtn');
  const mainContent = document.getElementById('mainContent');
  const overlay = document.getElementById('sidebarOverlay');

  function isMobile() { 
    return window.innerWidth <= MOBILE_BREAKPOINT; 
  }

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

  /* ---------------- Demo data & rendering ---------------- */
  let nextId = 1008;
  const demoCustomers = [
    { receipt: '1007', email: 'user8@example.com', plan: 'cancelled', payment: 'credit_card', password: 'pass8' },
    { receipt: '1006', email: 'user7@example.com', plan: 'free', payment: 'maya', password: 'pass7' },
    { receipt: '1005', email: 'user6@example.com', plan: 'premium', payment: 'gcash', password: 'pass6' },
    { receipt: '1004', email: 'user5@example.com', plan: 'standard', payment: 'credit_card', password: 'pass5' },
    { receipt: '1003', email: 'john.smith@example.com', plan: 'expired', payment: 'paypal', password: 'pass4' },
    { receipt: '1002', email: 'jane.doe@example.com', plan: 'free', payment: 'paypal', password: 'pass3' },
    { receipt: '1001', email: 'bob@example.com', plan: 'premium', payment: 'maya', password: 'pass2' },
    { receipt: '1000', email: 'alice@example.com', plan: 'standard', payment: 'gcash', password: 'pass1' }
  ];

  let customers = demoCustomers.slice();
  const tbody = document.querySelector('#customersTable tbody');

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
    return (plan || '').charAt(0).toUpperCase() + (plan || '').slice(1);
  }

  function updateStats() {
    const stats = { free:0, standard:0, premium:0, expired:0, cancelled:0 };
    customers.forEach(c => {
      if (stats.hasOwnProperty(c.plan)) stats[c.plan]++;
    });
    document.getElementById('freeCount').textContent = stats.free;
    document.getElementById('standardCount').textContent = stats.standard;
    document.getElementById('premiumCount').textContent = stats.premium;
    document.getElementById('expiredCount').textContent = stats.expired;
    document.getElementById('cancelledCount').textContent = stats.cancelled;
  }

  function renderTable(filteredRows) {
    const rows = filteredRows || customers;
    tbody.innerHTML = '';
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

  function applyFilters() {
    renderTable();
  }

  applyFilters();

  /* ======= Edit Modal logic ======= */
  const editModal = document.getElementById('editModal');
  const editEmail = document.getElementById('editEmail');
  const editPassword = document.getElementById('editPassword');
  const editPlan = document.getElementById('editPlan');
  const editPayment = document.getElementById('editPayment');
  const editReceipt = document.getElementById('editReceipt');
  const confirmEdit = document.getElementById('confirmEdit');
  const cancelEdit = document.getElementById('cancelEdit');

  function showEditModal() {
    if (!editModal) return;
    editModal.classList.add('show');
    document.body.classList.add('no-scroll');
    setTimeout(() => { editEmail && editEmail.focus(); }, 80);
  }
  function hideEditModal() {
    if (!editModal) return;
    editModal.classList.remove('show');
    document.body.classList.remove('no-scroll');
  }

  function openEditFor(receipt) {
    const u = customers.find(x => x.receipt === receipt);
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
    const idx = customers.findIndex(x => x.receipt === r);
    if (idx >= 0) {
      customers[idx].email = editEmail.value.trim();
      if (editPassword.value) customers[idx].password = editPassword.value;
      customers[idx].plan = editPlan.value;
      customers[idx].payment = editPayment.value;
      renderTable();
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

  /* ===== Add Modal ===== */
  const addModal = document.getElementById('addModal');
  const addEmail = document.getElementById('addEmail');
  const addPassword = document.getElementById('addPassword');
  const addPlan = document.getElementById('addPlan');
  const addPayment = document.getElementById('addPayment');
  const addReceipt = document.getElementById('addReceipt');
  const confirmAdd = document.getElementById('confirmAdd');
  const cancelAdd = document.getElementById('cancelAdd');

  function showAddModal() {
    if (!addModal) return;
    addModal.classList.add('show');
    document.body.classList.add('no-scroll');
    setTimeout(() => addEmail && addEmail.focus(), 80);
  }
  function hideAddModal() {
    if (!addModal) return;
    addModal.classList.remove('show');
    document.body.classList.remove('no-scroll');
  }

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
      receipt: addReceipt.value || String(nextId++),
      email,
      password,
      plan,
      payment
    };
    customers.unshift(newUser);
    renderTable();
    hideAddModal();
  });

  cancelAdd.addEventListener('click', (e) => {
    e.preventDefault();
    hideAddModal();
  });

  addModal.addEventListener('click', (e) => {
    if (e.target === addModal) hideAddModal();
  });

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

  confirmDeleteBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (!deleteTargetId) { hideDeleteModal(); return; }
    customers = customers.filter(u => u.receipt !== deleteTargetId);
    renderTable();
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
      if (editModal && editModal.classList.contains('show')) hideEditModal();
      if (addModal && addModal.classList.contains('show')) hideAddModal();
      if (deleteModal && deleteModal.classList.contains('show')) hideDeleteModal();
    }
  });

})();