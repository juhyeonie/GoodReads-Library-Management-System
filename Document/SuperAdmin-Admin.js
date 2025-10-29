// File: SuperAdmin-Admin.js
// (Converted to use Database)

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
})();

// --- Admin Management (DATABASE CONNECTED) ---
(function() {
    let users = []; // Will hold data fetched from DB

    const tbody = document.querySelector('#usersTable tbody');
    const searchInput = document.getElementById('searchInput');
    const filterSelect = document.getElementById('filterSelect');
    const addUserBtn = document.getElementById('addUserBtn');

    // Edit Modal Elements
    const editModal = document.getElementById('editModal');
    const editForm = document.getElementById('editForm');
    const editEmail = document.getElementById('editEmail');
    const editPassword = document.getElementById('editPassword');
    const editRole = document.getElementById('editRole');
    const editUserIdInput = document.getElementById('editUserId'); // Matched HTML
    const confirmEdit = document.getElementById('confirmEdit');
    const cancelEdit = document.getElementById('cancelEdit');

    // Add Modal Elements
    const addModal = document.getElementById('addModal');
    const addForm = document.getElementById('addForm');
    const addEmail = document.getElementById('addEmail');
    const addPassword = document.getElementById('addPassword');
    const addRole = document.getElementById('addRole');
    const confirmAdd = document.getElementById('confirmAdd');
    const cancelAdd = document.getElementById('cancelAdd');

    // Delete Modal Elements
    const deleteModal = document.getElementById('deleteModal');
    const deleteMessage = document.getElementById('deleteMessage');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    let deleteTargetId = null;
    
    // Password toggle functionality
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', function() {
          const targetId = this.getAttribute('data-target');
          const input = document.getElementById(targetId);
          if (!input) return;
          const eyeOpen = this.querySelectorAll('.eye-open');
          const eyeClosed = this.querySelector('.eye-closed');
          
          if (input.type === 'password') {
            input.type = 'text';
            eyeOpen.forEach(path => path.style.display = 'none');
            if(eyeClosed) eyeClosed.style.display = 'block';
          } else {
            input.type = 'password';
            eyeOpen.forEach(path => path.style.display = 'block');
            if(eyeClosed) eyeClosed.style.display = 'none';
          }
        });
    });

    // --- Utility Functions ---
    function escapeHtml(str) {
        if (str == null) return '';
        return String(str).replace(/[&<>"']/g, s => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[s]));
     }
    function formatRole(role) {
        return role || 'N/A';
     }

    // --- Core Data Fetching & Rendering ---
    async function loadUsers() {
        const searchTerm = searchInput.value.trim();
        const filterValue = filterSelect.value;

        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (filterValue) params.append('filter', filterValue);

        try {
            // Use the new admin_fetch.php endpoint
            const response = await fetch(`Backend/admin_fetch.php?${params.toString()}`);
            const data = await response.json();
            if (!data.success) throw new Error(data.message || 'Failed to fetch.');
            users = data.users;
            renderTable(users);
        } catch (err) {
            console.error("Load Admins Error:", err);
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color: red;">Error: ${err.message}</td></tr>`;
        }
     }
     
    function renderTable(rows) {
        tbody.innerHTML = '';
        if (!rows || rows.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No admins found.</td></tr>`;
            return;
        }
        rows.forEach(u => {
            const tr = document.createElement('tr');
            // Render columns for ID, Email, Role, Actions
            tr.innerHTML = `
              <td>${escapeHtml(u.AccountID)}</td>
              <td>${escapeHtml(u.Email)}</td>
              <td>${escapeHtml(formatRole(u.Role))}</td>
              <td>
                <div class="actions">
                  <button class="pill edit" data-id="${escapeHtml(u.AccountID)}">Edit</button>
                  <button class="pill delete" data-id="${escapeHtml(u.AccountID)}">Delete</button>
                </div>
              </td>
            `;
            tbody.appendChild(tr);
        });
     }

    // --- Modal Handling ---
    function showModal(modal) { if(modal){ modal.classList.add('show'); document.body.classList.add('no-scroll'); }}
    function hideModal(modal) { if(modal){ modal.classList.remove('show'); document.body.classList.remove('no-scroll'); }}
    function clearErrors(form) {
        form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
        form.querySelectorAll('.error-message').forEach(el => { el.textContent = ''; el.classList.remove('show'); });
     }
    function showError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const errorDiv = document.getElementById(fieldId + 'Error');
        if (field) field.classList.add('error');
        if (errorDiv) { errorDiv.textContent = message; errorDiv.classList.add('show'); }
     }
    function displayServerErrors(errors, prefix) {
         clearErrors(document.getElementById(prefix + 'Form'));
         for (const key in errors) {
             let fieldId = prefix + key.charAt(0).toUpperCase() + key.slice(1);
             if (key === 'database' || key === 'general') { alert(`Server Error: ${errors[key]}`); }
             else { showError(fieldId, errors[key]); }
         }
     }
    function validateEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }

    function validateForm(email, password, role, isEdit = false) {
        let isValid = true;
        const prefix = isEdit ? 'edit' : 'add';
        clearErrors(document.getElementById(prefix + 'Form'));

        if (!email || !validateEmail(email)) { showError(prefix + 'Email', 'Invalid email'); isValid = false; }
        if (!isEdit && !password) { showError(prefix + 'Password', 'Password required'); isValid = false; }
        else if (password && password.length < 6) { showError(prefix + 'Password', 'Password >= 6 chars'); isValid = false; }
        if (!role) { showError(prefix + 'Role', 'Role required'); isValid = false; }
        return isValid;
     }

    // --- Edit User Logic ---
    function openEditModal(userId) {
        const user = users.find(u => u.AccountID == userId);
        if (!user || !editModal) return;
        editUserIdInput.value = user.AccountID;
        editEmail.value = user.Email;
        editPassword.value = ''; // Clear password field
        editRole.value = user.Role;
        clearErrors(editForm);
        showModal(editModal);
     }

    confirmEdit.addEventListener('click', async (e) => {
        e.preventDefault();
        const userId = editUserIdInput.value;
        const email = editEmail.value.trim();
        const password = editPassword.value;
        const role = editRole.value;

        if (!validateForm(email, password, role, true)) return;

        confirmEdit.disabled = true; confirmEdit.textContent = 'SAVING...';
        try {
            // Use the new admin_update.php endpoint
            const response = await fetch('Backend/admin_update.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, email, password, role })
            });
            const result = await response.json();
            if (!result.success) {
                 if (result.errors) displayServerErrors(result.errors, 'edit');
                 else throw new Error(result.message || 'Failed.');
            } else {
                hideModal(editModal);
                loadUsers();
            }
        } catch (err) {
            console.error("Update Admin Error:", err); alert(`Error: ${err.message}`);
        } finally {
            confirmEdit.disabled = false; confirmEdit.textContent = 'CONFIRM';
        }
     });

    cancelEdit.addEventListener('click', () => hideModal(editModal));
    editModal.addEventListener('click', (e) => { if (e.target === editModal) hideModal(editModal); });

    // --- Add User Logic ---
    addUserBtn.addEventListener('click', () => {
        addForm.reset(); clearErrors(addForm); showModal(addModal);
     });
    confirmAdd.addEventListener('click', async (e) => {
        e.preventDefault();
        const email = addEmail.value.trim();
        const password = addPassword.value;
        const role = addRole.value;

        if (!validateForm(email, password, role, false)) return;

        confirmAdd.disabled = true; confirmAdd.textContent = 'ADDING...';
        try {
            // Use the new admin_add.php endpoint
            const response = await fetch('Backend/admin_add.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, role })
            });
            const result = await response.json();
            if (!result.success) {
                 if (result.errors) displayServerErrors(result.errors, 'add');
                 else throw new Error(result.message || 'Failed.');
            } else {
                hideModal(addModal);
                loadUsers();
            }
        } catch (err) {
            console.error("Add Admin Error:", err); alert(`Error: ${err.message}`);
        } finally {
            confirmAdd.disabled = false; confirmAdd.textContent = 'CONFIRM';
        }
     });
    cancelAdd.addEventListener('click', () => hideModal(addModal));
    addModal.addEventListener('click', (e) => { if (e.target === addModal) hideModal(addModal); });

    // --- Delete User Logic ---
    function showDeleteModal(userId, userEmail) {
        deleteTargetId = userId;
        deleteMessage.textContent = `Delete admin ${escapeHtml(userEmail || userId)}? This cannot be undone.`;
        showModal(deleteModal);
        setTimeout(() => confirmDeleteBtn?.focus(), 80);
     }
    function hideDeleteModal() {
        hideModal(deleteModal);
        deleteTargetId = null;
     }
    confirmDeleteBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        if (!deleteTargetId) { hideDeleteModal(); return; }
        confirmDeleteBtn.disabled = true; confirmDeleteBtn.textContent = 'DELETING...';
        try {
            // Use the new admin_delete.php endpoint
            const response = await fetch('Backend/admin_delete.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: deleteTargetId })
            });
            const result = await response.json();
            if (!result.success) throw new Error(result.message || 'Failed.');
            hideDeleteModal();
            loadUsers();
        } catch (err) {
            console.error("Delete Admin Error:", err); alert(`Error: ${err.message}`);
        } finally {
            confirmDeleteBtn.disabled = false; confirmDeleteBtn.textContent = 'YES, DELETE';
        }
     });
    cancelDeleteBtn.addEventListener('click', hideDeleteModal);
    deleteModal.addEventListener('click', (e) => { if (e.target === deleteModal) hideDeleteModal(); });

    // --- Table Action Listeners ---
    tbody.addEventListener('click', (e) => {
        const btn = e.target.closest('button.pill');
        if (!btn) return;
        const userId = btn.dataset.id;
        const user = users.find(u => u.AccountID == userId);
        if (btn.classList.contains('edit')) openEditModal(userId);
        else if (btn.classList.contains('delete')) showDeleteModal(userId, user?.Email);
        // No 'view' action for admins
     });

    // --- Search & Filter Listeners ---
    let searchTimeout;
    searchInput.addEventListener('input', () => { clearTimeout(searchTimeout); searchTimeout = setTimeout(loadUsers, 300); });
    filterSelect.addEventListener('change', loadUsers);

    // --- Global Key Listener ---
    document.addEventListener('keydown', (ev) => {
        if (ev.key === 'Escape') {
            if (editModal?.classList.contains('show')) hideModal(editModal);
            if (addModal?.classList.contains('show')) hideModal(addModal);
            if (deleteModal?.classList.contains('show')) hideDeleteModal();
        }
     });

    // --- Initial Load ---
    loadUsers();

})(); // End Main IIFE