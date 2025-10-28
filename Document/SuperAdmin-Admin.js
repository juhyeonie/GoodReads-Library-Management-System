// File: SuperAdmin-Admin.js

// Sidebar behavior
(function() {
  const sidebar = document.getElementById('sidebar');
  const menuToggle = document.getElementById('menuToggle');
  const collapseBtn = document.getElementById('collapseBtn');
  const mainContent = document.getElementById('mainContent');
  const overlay = document.getElementById('sidebarOverlay');
  
  const COLLAPSED_KEY = 'sidebar_collapsed';
  const MOBILE_BREAKPOINT = 768;

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
})();

// Admin Management
(function() {
  const demoUsers = [
    { receipt: '1000', email: 'alice@example.com', password: 'pass123', role: 'Book Admin' },
    { receipt: '1001', email: 'bob@example.com', password: 'pass456', role: 'Subscription Admin' },
    { receipt: '1002', email: 'jane.doe@example.com', password: 'pass789', role: 'User Admin' },
    { receipt: '1004', email: 'user5@example.com', password: 'pass321', role: 'Book Admin' },
    { receipt: '1005', email: 'user6@example.com', password: 'pass654', role: 'Subscription Admin' },
    { receipt: '1006', email: 'user7@example.com', password: 'pass987', role: 'User Admin' }
  ];

  let users = demoUsers.slice();

  const tbody = document.querySelector('#usersTable tbody');
  const searchInput = document.getElementById('searchInput');
  const filterSelect = document.getElementById('filterSelect');

  function escapeHtml(str) {
    if (str == null) return '';
    return String(str).replace(/[&<>"']/g, s => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[s]));
  }

  function renderTable(rows) {
    tbody.innerHTML = '';
    rows.forEach(u => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escapeHtml(u.receipt)}</td>
        <td>${escapeHtml(u.email)}</td>
        <td>${escapeHtml(u.role || '')}</td>
        <td>
          <div class="actions">
            <button class="pill view" data-id="${escapeHtml(u.receipt)}">View</button>
            <button class="pill edit" data-id="${escapeHtml(u.receipt)}">Edit</button>
            <button class="pill delete" data-id="${escapeHtml(u.receipt)}">Delete</button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  function applyFilters() {
    const searchTerm = (searchInput.value || '').trim().toLowerCase();
    const filterValue = filterSelect.value;

    const filtered = users.filter(u => {
      const matchesSearch = !searchTerm || 
        (u.receipt + ' ' + u.email + ' ' + (u.role || '')).toLowerCase().includes(searchTerm);
      const matchesRole = filterValue === 'all' || u.role === filterValue;
      return matchesSearch && matchesRole;
    });

    renderTable(filtered);
  }

  applyFilters();
  if (searchInput) searchInput.addEventListener('input', applyFilters);
  if (filterSelect) filterSelect.addEventListener('change', applyFilters);

  // Password toggle functionality
  document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.addEventListener('click', function() {
      const targetId = this.getAttribute('data-target');
      const input = document.getElementById(targetId);
      const eyeOpen = this.querySelectorAll('.eye-open');
      const eyeClosed = this.querySelector('.eye-closed');
      
      if (input.type === 'password') {
        input.type = 'text';
        eyeOpen.forEach(path => path.style.display = 'none');
        eyeClosed.style.display = 'block';
      } else {
        input.type = 'password';
        eyeOpen.forEach(path => path.style.display = 'block');
        eyeClosed.style.display = 'none';
      }
    });
  });

  // Modals
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
    modal.classList.add('show');
    document.body.classList.add('no-scroll');
  }

  function hideModal(modal) {
    modal.classList.remove('show');
    document.body.classList.remove('no-scroll');
  }

  function clearErrors(form) {
    form.querySelectorAll('input, select').forEach(el => {
      el.classList.remove('error');
    });
    form.querySelectorAll('.error-message').forEach(el => {
      el.classList.remove('show');
      el.textContent = '';
    });
  }

  function showError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorDiv = document.getElementById(fieldId + 'Error');
    if (field) field.classList.add('error');
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.classList.add('show');
    }
  }

  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  function validateForm(email, password, role, prefix) {
    let isValid = true;
    clearErrors(document.getElementById(prefix + 'Form'));

    if (!email || email.trim() === '') {
      showError(prefix + 'Email', 'Email is required');
      isValid = false;
    } else if (!validateEmail(email)) {
      showError(prefix + 'Email', 'Please enter a valid email address');
      isValid = false;
    }

    if (!password || password.trim() === '') {
      showError(prefix + 'Password', 'Password is required');
      isValid = false;
    } else if (password.length < 6) {
      showError(prefix + 'Password', 'Password must be at least 6 characters');
      isValid = false;
    }

    if (!role || role === '') {
      showError(prefix + 'Role', 'Please select a role');
      isValid = false;
    }

    return isValid;
  }

  function openEditFor(receipt) {
    const user = users.find(u => u.receipt === receipt);
    if (!user) return;
    
    editReceipt.value = user.receipt;
    editEmail.value = user.email;
    editPassword.value = user.password || '';
    editRole.value = user.role || '';
    clearErrors(editForm);
    showModal(editModal);
  }

  confirmEdit.addEventListener('click', (e) => {
    e.preventDefault();
    
    const email = editEmail.value.trim();
    const password = editPassword.value;
    const role = editRole.value;

    if (!validateForm(email, password, role, 'edit')) {
      return;
    }

    const receipt = editReceipt.value;
    const idx = users.findIndex(u => u.receipt === receipt);
    if (idx >= 0) {
      users[idx].email = email;
      users[idx].password = password;
      users[idx].role = role;
      applyFilters();
    }
    hideModal(editModal);
  });

  cancelEdit.addEventListener('click', () => {
    hideModal(editModal);
  });

  editModal.addEventListener('click', (e) => {
    if (e.target === editModal) hideModal(editModal);
  });

  addUserBtn.addEventListener('click', () => {
    addReceipt.value = String(Date.now()).slice(-5);
    addEmail.value = '';
    addPassword.value = '';
    addRole.value = '';
    clearErrors(addForm);
    showModal(addModal);
  });

  confirmAdd.addEventListener('click', (e) => {
    e.preventDefault();
    
    const email = addEmail.value.trim();
    const password = addPassword.value;
    const role = addRole.value;

    if (!validateForm(email, password, role, 'add')) {
      return;
    }

    const newUser = {
      receipt: addReceipt.value,
      email: email,
      password: password,
      role: role
    };
    users.unshift(newUser);
    applyFilters();
    hideModal(addModal);
  });

  cancelAdd.addEventListener('click', () => {
    hideModal(addModal);
  });

  addModal.addEventListener('click', (e) => {
    if (e.target === addModal) hideModal(addModal);
  });

  // Delete modal
  const deleteModal = document.getElementById('deleteModal');
  const deleteMessage = document.getElementById('deleteMessage');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
  let deleteTargetId = null;

  function showDeleteModal(message) {
    deleteMessage.textContent = message || 'Are you sure you want to delete this admin?';
    showModal(deleteModal);
    setTimeout(() => confirmDeleteBtn && confirmDeleteBtn.focus(), 80);
  }

  function hideDeleteModal() {
    hideModal(deleteModal);
    deleteTargetId = null;
  }

  confirmDeleteBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (!deleteTargetId) { 
      hideDeleteModal(); 
      return; 
    }
    users = users.filter(u => u.receipt !== deleteTargetId);
    applyFilters();
    hideDeleteModal();
  });

  cancelDeleteBtn.addEventListener('click', () => {
    hideDeleteModal();
  });

  deleteModal.addEventListener('click', (e) => {
    if (e.target === deleteModal) hideDeleteModal();
  });

  // Table actions
  tbody.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.edit');
    if (editBtn) {
      const id = editBtn.dataset.id;
      openEditFor(id);
      return;
    }

    const delBtn = e.target.closest('.delete');
    if (delBtn) {
      const id = delBtn.dataset.id;
      deleteTargetId = id;
      showDeleteModal('Delete admin ' + id + '? This action cannot be undone.');
      return;
    }
  });

  // ESC key
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') {
      if (editModal.classList.contains('show')) hideModal(editModal);
      if (addModal.classList.contains('show')) hideModal(addModal);
      if (deleteModal.classList.contains('show')) hideDeleteModal();
    }
  });

})();