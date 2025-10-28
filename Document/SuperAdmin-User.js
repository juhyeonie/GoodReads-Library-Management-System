console.log('SuperAdmin-User.js loaded');

// Sidebar behavior (omitted for brevity, assume this section is unchanged)
(function() {
    // ... (Your existing sidebar code remains here) ...
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

// --- Customer Management (DATABASE CONNECTED) ---
(function() {
    // Removed demoUsers array
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
    const editPlan = document.getElementById('editPlan');
    const editPayment = document.getElementById('editPayment');
    const editUserIdInput = document.getElementById('editReceipt'); // Using hidden input for ID
    const confirmEdit = document.getElementById('confirmEdit');
    const cancelEdit = document.getElementById('cancelEdit');

    // Add Modal Elements
    const addModal = document.getElementById('addModal');
    const addForm = document.getElementById('addForm');
    const addEmail = document.getElementById('addEmail');
    const addPassword = document.getElementById('addPassword');
    const addPlan = document.getElementById('addPlan');
    const addPayment = document.getElementById('addPayment');
    const confirmAdd = document.getElementById('confirmAdd');
    const cancelAdd = document.getElementById('cancelAdd');

    // Delete Modal Elements
    const deleteModal = document.getElementById('deleteModal');
    const deleteMessage = document.getElementById('deleteMessage');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    let deleteTargetId = null;

    // --- Utility Functions ---
    function escapeHtml(str) {
        if (str == null) return '';
        return String(str).replace(/[&<>"']/g, s => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[s]));
    }
    
    // Updated to match database/UI inconsistencies if needed. Use DB values directly.
    function formatPaymentMethod(method) {
        return method || 'N/A'; // Directly display DB value or 'N/A' if null/empty
    }

    // Displays the plan name directly from the DB ("Basic Plan", "Standard Plan", etc.)
    function formatPlan(plan) {
        return plan || 'N/A';
    }

    // --- Core Data Fetching & Rendering ---
    async function loadUsers() {
        const searchTerm = searchInput.value.trim();
        const filterValue = filterSelect.value; // Expecting 'all', 'basic plan', 'standard plan', etc.

        // Build query string
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (filterValue) params.append('filter', filterValue);

        try {
            const response = await fetch(`Backend/user_fetch.php?${params.toString()}`);
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to fetch users.');
            }

            users = data.users; // Store fetched users globally
            renderTable(users);

        } catch (err) {
            console.error("Load Users Error:", err);
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: red;">Error loading users: ${err.message}</td></tr>`;
        }
    }

    function renderTable(rows) {
        tbody.innerHTML = ''; // Clear existing rows
        if (!rows || rows.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No customers found.</td></tr>`;
            return;
        }

        rows.forEach(u => {
            const tr = document.createElement('tr');
            // Use AccountID from database
            tr.innerHTML = `
              <td>${escapeHtml(u.AccountID)}</td> 
              <td>${escapeHtml(u.Email)}</td>
              <td>${escapeHtml(formatPlan(u.Plan))}</td>
              <td>${escapeHtml(formatPaymentMethod(u.Payment_Method))}</td>
              <td>
                <div class="actions">
                  <button class="pill view" data-id="${escapeHtml(u.AccountID)}">View</button> 
                  <button class="pill edit" data-id="${escapeHtml(u.AccountID)}">Edit</button>
                  <button class="pill delete" data-id="${escapeHtml(u.AccountID)}">Delete</button>
                </div>
              </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // --- Modal Handling ---
    function showModal(modal) { modal.classList.add('show'); document.body.classList.add('no-scroll'); }
    function hideModal(modal) { modal.classList.remove('show'); document.body.classList.remove('no-scroll'); }

    function clearErrors(form) {
        form.querySelectorAll('input, select').forEach(el => el.classList.remove('error'));
        form.querySelectorAll('.error-message').forEach(el => { el.textContent = ''; el.classList.remove('show'); });
    }

    function showError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const errorDiv = document.getElementById(fieldId + 'Error');
        if (field) field.classList.add('error');
        if (errorDiv) { errorDiv.textContent = message; errorDiv.classList.add('show'); }
    }
    
    // Display server-side validation errors
    function displayServerErrors(errors, prefix) {
         clearErrors(document.getElementById(prefix + 'Form'));
         for (const key in errors) {
             // Map backend keys to frontend IDs (adjust if needed)
             let fieldId = prefix + key.charAt(0).toUpperCase() + key.slice(1);
             if (key === 'database' || key === 'general') { // Handle general errors
                 alert(`Server Error: ${errors[key]}`); 
             } else {
                 showError(fieldId, errors[key]);
             }
         }
    }


    function validateEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }

    // Client-side basic validation (backend does the final check)
    function validateForm(email, password, plan, isEdit = false) {
        let isValid = true;
        const prefix = isEdit ? 'edit' : 'add';
        clearErrors(document.getElementById(prefix + 'Form'));

        if (!email) { showError(prefix + 'Email', 'Email is required'); isValid = false; } 
        else if (!validateEmail(email)) { showError(prefix + 'Email', 'Invalid email'); isValid = false; }

        // Password required for ADD, optional for EDIT
        if (!isEdit && !password) { showError(prefix + 'Password', 'Password is required'); isValid = false; } 
        else if (password && password.length < 6) { showError(prefix + 'Password', 'Password must be >= 6 chars'); isValid = false; }

        if (!plan) { showError(prefix + 'Plan', 'Plan is required'); isValid = false; }

        // Payment method optional for Basic Plan
        // Removed payment validation for simplicity, backend handles it

        return isValid;
    }

    // --- Edit User Logic ---
    function openEditModal(userId) {
        const user = users.find(u => u.AccountID == userId); // Use == for potential type difference
        if (!user) return;

        editUserIdInput.value = user.AccountID;
        editEmail.value = user.Email;
        editPassword.value = ''; // Clear password field for security - only set if changing
        editPlan.value = user.Plan; 
        editPayment.value = user.Payment_Method || ''; // Handle potential null
        clearErrors(editForm);
        showModal(editModal);
    }

    confirmEdit.addEventListener('click', async (e) => {
        e.preventDefault();
        const userId = editUserIdInput.value;
        const email = editEmail.value.trim();
        const password = editPassword.value; // Send empty if not changing
        const plan = editPlan.value;
        const payment = editPayment.value;

        if (!validateForm(email, password, plan, true)) return;

        confirmEdit.disabled = true; confirmEdit.textContent = 'SAVING...';
        try {
            const response = await fetch('Backend/user_update.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, email, password, plan, payment })
            });
            const result = await response.json();

            if (!result.success) {
                 if (result.errors) {
                     displayServerErrors(result.errors, 'edit');
                 } else {
                     throw new Error(result.message || 'Failed to update user.');
                 }
            } else {
                hideModal(editModal);
                loadUsers(); // Refresh table
            }
        } catch (err) {
            console.error("Update User Error:", err);
            alert(`Error: ${err.message}`);
        } finally {
            confirmEdit.disabled = false; confirmEdit.textContent = 'CONFIRM';
        }
    });

    cancelEdit.addEventListener('click', () => hideModal(editModal));
    editModal.addEventListener('click', (e) => { if (e.target === editModal) hideModal(editModal); });

    // --- Add User Logic ---
    addUserBtn.addEventListener('click', () => {
        addForm.reset(); // Clear form fields
        clearErrors(addForm);
        showModal(addModal);
    });

    confirmAdd.addEventListener('click', async (e) => {
        e.preventDefault();
        const email = addEmail.value.trim();
        const password = addPassword.value;
        const plan = addPlan.value;
        const payment = addPayment.value;

        if (!validateForm(email, password, plan, false)) return;

        confirmAdd.disabled = true; confirmAdd.textContent = 'ADDING...';
        try {
            const response = await fetch('Backend/user_add.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, plan, payment })
            });
            const result = await response.json();

            if (!result.success) {
                 if (result.errors) {
                     displayServerErrors(result.errors, 'add');
                 } else {
                     throw new Error(result.message || 'Failed to add user.');
                 }
            } else {
                hideModal(addModal);
                loadUsers(); // Refresh table to show the new user
            }
        } catch (err) {
            console.error("Add User Error:", err);
            alert(`Error: ${err.message}`);
        } finally {
            confirmAdd.disabled = false; confirmAdd.textContent = 'CONFIRM';
        }
    });

    cancelAdd.addEventListener('click', () => hideModal(addModal));
    addModal.addEventListener('click', (e) => { if (e.target === addModal) hideModal(addModal); });


    // --- Delete User Logic ---
    function showDeleteModal(userId, userEmail) {
        deleteTargetId = userId;
        deleteMessage.textContent = `Are you sure you want to delete user ${escapeHtml(userEmail || userId)}? This action cannot be undone.`;
        showModal(deleteModal);
        setTimeout(() => confirmDeleteBtn && confirmDeleteBtn.focus(), 80);
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
            const response = await fetch('Backend/user_delete.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: deleteTargetId })
            });
            const result = await response.json();

            if (!result.success) {
                throw new Error(result.message || 'Failed to delete user.');
            }
            hideDeleteModal();
            loadUsers(); // Refresh table
        } catch (err) {
            console.error("Delete User Error:", err);
            alert(`Error: ${err.message}`);
        } finally {
            confirmDeleteBtn.disabled = false; confirmDeleteBtn.textContent = 'YES, DELETE';
        }
    });

    cancelDeleteBtn.addEventListener('click', hideDeleteModal);
    deleteModal.addEventListener('click', (e) => { if (e.target === deleteModal) hideDeleteModal(); });


    // --- Table Action Listeners (Edit/Delete/View) ---
    tbody.addEventListener('click', (e) => {
        const targetButton = e.target.closest('button.pill');
        if (!targetButton) return;

        const userId = targetButton.dataset.id;
        const user = users.find(u => u.AccountID == userId);

        if (targetButton.classList.contains('edit')) {
            openEditModal(userId);
        } else if (targetButton.classList.contains('delete')) {
            showDeleteModal(userId, user ? user.Email : userId);
        } else if (targetButton.classList.contains('view')) {
            // Implement view logic if needed (e.g., redirect to user profile)
            alert(`Viewing user ID: ${userId}`);
        }
    });

    // --- Search & Filter Listeners ---
    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(loadUsers, 300); // Debounce search
    });
    filterSelect.addEventListener('change', loadUsers);

    // --- Global Key Listener ---
    document.addEventListener('keydown', (ev) => {
        if (ev.key === 'Escape') {
            if (editModal.classList.contains('show')) hideModal(editModal);
            if (addModal.classList.contains('show')) hideModal(addModal);
            if (deleteModal.classList.contains('show')) hideDeleteModal();
        }
    });

    // --- Initial Load ---
    loadUsers();

})();

// FIX: Update plan options in HTML selects to match database ("Basic Plan", etc.)
document.addEventListener('DOMContentLoaded', () => {
    const planSelects = document.querySelectorAll('#editPlan, #addPlan');
    const filterPlanSelect = document.getElementById('filterSelect');
    
    // Correct options based on your database
    const planOptions = [
        { value: 'Basic Plan', text: 'Basic Plan' },
        { value: 'Standard Plan', text: 'Standard Plan' },
        { value: 'Premium Plan', text: 'Premium Plan' }
    ];
    
    // Update Add/Edit modal dropdowns
    planSelects.forEach(select => {
        // Clear existing options except the placeholder
        while (select.options.length > 1) {
            select.remove(1);
        }
        // Add correct options
        planOptions.forEach(opt => {
            select.add(new Option(opt.text, opt.value));
        });
    });

    // Update Filter dropdown
    if (filterPlanSelect) {
         // Clear existing options except 'All'
        while (filterPlanSelect.options.length > 1) {
            filterPlanSelect.remove(1);
        }
        // Add correct plan options
        planOptions.forEach(opt => {
            // Use lowercase with space for filter value? Let's use exact DB value
            filterPlanSelect.add(new Option(opt.text, opt.value)); 
        });
        // Add status options
        filterPlanSelect.add(new Option('Expired', 'expired'));
        filterPlanSelect.add(new Option('Cancelled', 'cancelled')); // Assuming 'Cancelled' is a possible status
        filterPlanSelect.add(new Option('Downgraded', 'downgraded')); // Add if needed
    }
});