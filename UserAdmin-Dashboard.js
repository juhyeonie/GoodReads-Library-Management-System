// Unified initializer — waits for DOMContentLoaded, then wires sidebar, Edit modal, table actions.
document.addEventListener('DOMContentLoaded', () => {
  const SIDEBAR_COLLAPSED_KEY = 'gr_usermgmt_sidebar_collapsed';
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
      // Mobile: sidebar is overlay, main content always full width
      sidebar.classList.remove('collapsed-desktop');
      sidebar.classList.remove('expanded');
      mainContent.classList.remove('collapsed-desktop');
      if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
      if (collapseBtn) collapseBtn.setAttribute('aria-pressed', 'false');
      document.body.classList.remove('no-scroll');
    } else {
      // Desktop: sidebar pushes content
      sidebar.classList.remove('expanded');

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

  // Mobile menu toggle (overlay)
  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => {
      if (!sidebar.classList.contains('expanded')) {
        sidebar.classList.add('expanded');
        document.body.classList.add('no-scroll');
        menuToggle.setAttribute('aria-expanded', 'true');
      } else {
        sidebar.classList.remove('expanded');
        document.body.classList.remove('no-scroll');
        menuToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Desktop collapse/uncollapse (icons-only)
  if (collapseBtn && sidebar && mainContent) {
    collapseBtn.addEventListener('click', () => {
      if (isMobile()) return;
      const nowCollapsed = sidebar.classList.toggle('collapsed-desktop');
      mainContent.classList.toggle('collapsed-desktop', nowCollapsed);
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
        if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
      }
    }
  });

  // ESC to close mobile overlay
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (isMobile() && sidebar && sidebar.classList.contains('expanded')) {
        sidebar.classList.remove('expanded');
        document.body.classList.remove('no-scroll');
        if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
      }
      if (editModal && editModal.getAttribute('aria-hidden') === 'false') {
        hideEditModal();
      }
    }
  });

  /* ----------------- Edit User Modal ----------------- */
  const editModal = document.getElementById('editUserModal');
  const editForm = document.getElementById('editUserForm');
  const confirmEditBtn = document.getElementById('confirmEdit');
  const closeEditBtn = document.getElementById('closeEditModal');

  let activeRow = null;

  function showEditModal() {
    if (!editModal) return;
    editModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    const first = editForm && editForm.querySelector('input');
    if (first) first.focus();
  }

  function hideEditModal() {
    if (!editModal) return;
    editModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
    activeRow = null;
  }

  if (editModal) {
    editModal.addEventListener('click', (e) => { 
      if (e.target === editModal) hideEditModal(); 
    });
  }

  if (editForm) {
    editForm.addEventListener('submit', (e) => e.preventDefault());
  }

  // Delegate edit / delete clicks on table
  document.addEventListener('click', (e) => {
    const editBtn = e.target.closest && e.target.closest('.edit-btn');
    if (editBtn) {
      const tr = editBtn.closest('tr');
      if (!tr) return;
      activeRow = tr;

      const email = tr.querySelector('[data-col="email"]')?.textContent.trim() || '';
      
      if (editForm) {
        editForm.querySelector('[name="email"]').value = email;
        editForm.querySelector('[name="password"]').value = '';
      }

      showEditModal();
      return;
    }

    const delBtn = e.target.closest && e.target.closest('.delete-btn');
    if (delBtn) {
      const tr = delBtn.closest('tr');
      if (tr && confirm('Are you sure you want to delete this user?')) {
        tr.remove();
      }
      return;
    }
  });

  if (confirmEditBtn) {
    confirmEditBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (!activeRow || !editForm) { 
        hideEditModal(); 
        return; 
      }

      const email = editForm.querySelector('[name="email"]').value;
      const password = editForm.querySelector('[name="password"]').value;

      const emailCell = activeRow.querySelector('[data-col="email"]');
      const passwordCell = activeRow.querySelector('[data-col="password"]');

      if (emailCell) emailCell.textContent = email;
      if (password && passwordCell) {
        passwordCell.textContent = '••••••••';
      }

      hideEditModal();
    });
  }

  if (closeEditBtn) {
    closeEditBtn.addEventListener('click', (e) => { 
      e.preventDefault(); 
      hideEditModal(); 
    });
  }

  /* ----------------- Table render with demo data ----------------- */
  const tbody = document.querySelector('#usersTable tbody');

  // Demo data
  const demoUsers = [
    { id: '1000', email: 'user1@example.com', password: '••••••••' },
    { id: '1001', email: 'user2@example.com', password: '••••••••' },
    { id: '1002', email: 'user3@example.com', password: '••••••••' },
    { id: '1003', email: 'user4@example.com', password: '••••••••' },
    { id: '1004', email: 'user5@example.com', password: '••••••••' },
    { id: '1005', email: 'user6@example.com', password: '••••••••' },
    { id: '1006', email: 'user7@example.com', password: '••••••••' },
    { id: '1007', email: 'user8@example.com', password: '••••••••' }
  ];

  function renderUsers() {
    if (!tbody) return;
    tbody.innerHTML = '';
    
    demoUsers.forEach(user => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${escapeHtml(user.id)}</td>
                      <td data-col="email">${escapeHtml(user.email)}</td>
                      <td data-col="password">${escapeHtml(user.password)}</td>
                      <td>
                        <button class="edit-btn" data-id="${user.id}">Edit</button>
                        <button class="delete-btn" data-id="${user.id}">Delete</button>
                      </td>`;
      tbody.appendChild(tr);
    });
  }

  // Update stats (demo values)
  const totalAdmins = document.getElementById('totalAdmins');
  const totalAdmins2 = document.getElementById('totalAdmins2');
  const activeUsers = document.getElementById('activeUsers');
  const inactiveUsers = document.getElementById('inactiveUsers');

  if (totalAdmins) totalAdmins.textContent = '12';
  if (totalAdmins2) totalAdmins2.textContent = '12';
  if (activeUsers) activeUsers.textContent = '156';
  if (inactiveUsers) inactiveUsers.textContent = '24';

  renderUsers();

  /* ----------------- Helpers ----------------- */
  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, (m) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m]));
  }
});