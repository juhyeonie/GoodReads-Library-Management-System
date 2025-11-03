console.log('SuperAdmin-User.js loaded');

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

// --- Customer Management (DATABASE CONNECTED) ---
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
    const editPlan = document.getElementById('editPlan');
    const editUserIdInput = document.getElementById('editReceipt'); // This holds the AccountID
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

    // Profile Modal Elements
    const viewProfileModal = document.getElementById('viewProfileModal');
    const profileContent = document.getElementById('profileContent');
    const closeProfileBtn = document.getElementById('closeProfileBtn');

    // --- Utility Functions ---
    function escapeHtml(str) {
        if (str == null) return '';
        return String(str).replace(/[&<>"']/g, s => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[s]));
    }
    function formatPaymentMethod(method) {
        return method || 'N/A';
    }
    function formatPlan(plan) {
        return plan || 'N/A';
    }
    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString.replace(' ', 'T'));
            if (isNaN(date)) return dateString;
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return dateString;
        }
    }

    // --- Core Data Fetching & Rendering ---
    async function loadUsers() {
        const searchTerm = searchInput.value.trim();
        const filterValue = filterSelect.value;

        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (filterValue) params.append('filter', filterValue);

        try {
            const response = await fetch(`Backend/user_fetch.php?${params.toString()}`);
            const data = await response.json();
            if (!data.success) throw new Error(data.message || 'Failed to fetch.');
            users = data.users;
            renderTable(users);
        } catch (err) {
            console.error("Load Users Error:", err);
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: red;">Error: ${err.message}</td></tr>`;
        }
    }

    function renderTable(rows) {
        tbody.innerHTML = '';
        if (!rows || rows.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No customers found.</td></tr>`;
            return;
        }
        rows.forEach(u => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td>${escapeHtml(u.AccountID)}</td>
              <td>${escapeHtml(u.Email)}</td>
              <td>${escapeHtml(formatPlan(u.Plan))}</td>
              <td>${escapeHtml(formatPaymentMethod(u.Payment_Method))}</td>
              <td>
                <div class="actions">
                  <button class="pill view" data-id="${escapeHtml(u.AccountID)}">View Profile</button>
                  <button class="pill edit" data-id="${escapeHtml(u.AccountID)}">Edit</button>
                  <button class="pill delete" data-id="${escapeHtml(u.AccountID)}">Delete</button>
                </div>
              </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // --- Modal Handling ---
    function showModal(modal) {
        if (modal) {
            modal.classList.add('show');
            document.body.classList.add('no-scroll');
        }
    }

    function hideModal(modal) {
        if (modal) {
            modal.classList.remove('show');
            document.body.classList.remove('no-scroll');
        }
    }

    function clearErrors(form) {
        form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
        form.querySelectorAll('.error-message').forEach(el => {
            el.textContent = '';
            el.classList.remove('show');
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

    function displayServerErrors(errors, prefix) {
        clearErrors(document.getElementById(prefix + 'Form'));
        for (const key in errors) {
            let fieldId = prefix + key.charAt(0).toUpperCase() + key.slice(1);
            if (key === 'database' || key === 'general') {
                alert(`Server Error: ${errors[key]}`);
            } else {
                showError(fieldId, errors[key]);
            }
        }
    }

    function validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function validateForm(email, password, plan, isEdit = false) {
        let isValid = true;
        const prefix = isEdit ? 'edit' : 'add';
        clearErrors(document.getElementById(prefix + 'Form'));

        // Only validate email on ADD form, not EDIT form
        if (!isEdit) {
            if (!email || !validateEmail(email)) {
                showError(prefix + 'Email', 'Invalid email');
                isValid = false;
            }
        }

        // Validate password: required for ADD, optional for EDIT
        if (!isEdit && !password) {
            showError(prefix + 'Password', 'Password required');
            isValid = false;
        } else if (password && password.length < 6) { // Validate length only if password is provided
            showError(prefix + 'Password', 'Password >= 6 chars');
            isValid = false;
        }

        if (!plan) {
            showError(prefix + 'Plan', 'Plan required');
            isValid = false;
        }

        return isValid;
    }

    // --- Edit User Logic ---
    function openEditModal(userId) {
        const user = users.find(u => u.AccountID == userId);
        if (!user || !editModal) return;
        editUserIdInput.value = user.AccountID;
        editEmail.value = user.Email; // Set the readonly email field
        editPassword.value = ''; // Clear password field
        editPlan.value = user.Plan;
        clearErrors(editForm);
        showModal(editModal);
    }

    confirmEdit.addEventListener('click', async (e) => {
        e.preventDefault();
        const userId = editUserIdInput.value;
        const email = editEmail.value.trim(); // Get the readonly email value to send to backend
        const password = editPassword.value; // Empty string if not changing
        const plan = editPlan.value;

        if (!validateForm(email, password, plan, true)) return;

        confirmEdit.disabled = true;
        confirmEdit.textContent = 'SAVING...';
        try {
            const response = await fetch('Backend/user_update.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId,
                    email,
                    password,
                    plan
                }) // Send all data
            });
            const result = await response.json();
            if (!result.success) {
                if (result.errors) displayServerErrors(result.errors, 'edit');
                else throw new Error(result.message || 'Failed.');
            } else {
                hideModal(editModal);
                loadUsers(); // Refresh table
            }
        } catch (err) {
            console.error("Update User Error:", err);
            alert(`Error: ${err.message}`);
        } finally {
            confirmEdit.disabled = false;
            confirmEdit.textContent = 'CONFIRM';
        }
    });

    cancelEdit.addEventListener('click', () => hideModal(editModal));
    editModal.addEventListener('click', (e) => {
        if (e.target === editModal) hideModal(editModal);
    });

    // --- Add User Logic ---
    addUserBtn.addEventListener('click', () => {
        addForm.reset();
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
        if (!payment) {
            showError('addPayment', 'Payment required');
            return;
        }

        confirmAdd.disabled = true;
        confirmAdd.textContent = 'ADDING...';
        try {
            const response = await fetch('Backend/user_add.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    password,
                    plan,
                    payment
                })
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
            console.error("Add User Error:", err);
            alert(`Error: ${err.message}`);
        } finally {
            confirmAdd.disabled = false;
            confirmAdd.textContent = 'CONFIRM';
        }
    });
    cancelAdd.addEventListener('click', () => hideModal(addModal));
    addModal.addEventListener('click', (e) => {
        if (e.target === addModal) hideModal(addModal);
    });

    // --- Delete User Logic ---
    function showDeleteModal(userId, userEmail) {
        deleteTargetId = userId;
        deleteMessage.textContent = `Delete user ${escapeHtml(userEmail || userId)}? This cannot be undone.`;
        showModal(deleteModal);
        setTimeout(() => confirmDeleteBtn?.focus(), 80);
    }

    function hideDeleteModal() {
        hideModal(deleteModal);
        deleteTargetId = null;
    }
    confirmDeleteBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        if (!deleteTargetId) {
            hideDeleteModal();
            return;
        }
        confirmDeleteBtn.disabled = true;
        confirmDeleteBtn.textContent = 'DELETING...';
        try {
            const response = await fetch('Backend/user_delete.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: deleteTargetId
                })
            });
            const result = await response.json();
            if (!result.success) throw new Error(result.message || 'Failed.');
            hideDeleteModal();
            loadUsers();
        } catch (err) {
            console.error("Delete User Error:", err);
            alert(`Error: ${err.message}`);
        } finally {
            confirmDeleteBtn.disabled = false;
            confirmDeleteBtn.textContent = 'YES, DELETE';
        }
    });
    cancelDeleteBtn.addEventListener('click', hideDeleteModal);
    deleteModal.addEventListener('click', (e) => {
        if (e.target === deleteModal) hideDeleteModal();
    });

    // *** Profile View Logic ***
    function openProfileModal(accountId) {
        const user = users.find(u => u.AccountID == accountId);
        if (!user) {
            profileContent.innerHTML = `<p style="text-align: center; padding: 40px; color: red;">User data not found in local cache.</p>`;
            showModal(viewProfileModal);
            return;
        }

        const isBasicPlan = user.Plan === 'Basic Plan';

        let subsStartDisplay;
        let subsEndHtml;

        if (isBasicPlan) {
            subsStartDisplay = 'N/A (Free Plan)';
            subsEndHtml = `<p><strong>Subscription End:</strong> N/A (Free Plan)</p>`;
        } else {
            subsStartDisplay = formatDate(user.SubsStarted);
            const subsEndDisplay = user.SubsEnd ? formatDate(user.SubsEnd) : 'N/A';
            subsEndHtml = `<p><strong>Subscription End:</strong> ${subsEndDisplay}</p>`;
        }

        profileContent.innerHTML = `
            <div class="profile-container" style="padding: 20px 0;">
                <h2 style="text-align: center; margin-bottom: 25px; font-size: 20px; font-weight: 700; color: #1b3c53;">CUSTOMER PROFILE</h2>
                
                <div class="profile-section" style="margin-bottom: 20px;">
                    <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Account Details</h3>
                    <p><strong>Account ID:</strong> ${escapeHtml(user.AccountID)}</p>
                    <p><strong>Email:</strong> ${escapeHtml(user.Email)}</p>
                    <p><strong>Role:</strong> ${escapeHtml(user.Role || 'Customer')}</p>
                    <p><strong>Creation Date:</strong> ${formatDate(user.AccountCreated) || 'N/A'}</p>
                </div>

                <div class="profile-section" style="margin-bottom: 20px;">
                    <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Subscription Details</h3>
                    <p><strong>Plan:</strong> ${escapeHtml(user.Plan)}</p>
                    <p><strong>Status:</strong> <span style="font-weight: 700; color: ${user.Plan_Status === 'Active' ? '#10b981' : '#ef4444'};">${escapeHtml(user.Plan_Status)}</span></p>
                    <p><strong>Payment Method:</strong> ${escapeHtml(user.Payment_Method || 'N/A')}</p>
                    <p><strong>Subscription Start:</strong> ${subsStartDisplay}</p>
                    ${subsEndHtml} 
                </div>
                
            </div>
        `;
        showModal(viewProfileModal);
    }

    if (closeProfileBtn) {
        closeProfileBtn.addEventListener('click', () => hideModal(viewProfileModal));
    }
    if (viewProfileModal) {
        viewProfileModal.addEventListener('click', (e) => {
            if (e.target === viewProfileModal) hideModal(viewProfileModal);
        });
    }


    // --- Table Action Listeners ---
    tbody.addEventListener('click', (e) => {
        const btn = e.target.closest('button.pill');
        if (!btn) return;
        const userId = btn.dataset.id;
        const user = users.find(u => u.AccountID == userId);
        if (btn.classList.contains('edit')) openEditModal(userId);
        else if (btn.classList.contains('delete')) showDeleteModal(userId, user?.Email);
        else if (btn.classList.contains('view')) openProfileModal(userId);
    });

    // --- Search & Filter Listeners ---
    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(loadUsers, 300);
    });
    filterSelect.addEventListener('change', loadUsers);

    // --- Global Key Listener ---
    document.addEventListener('keydown', (ev) => {
        if (ev.key === 'Escape') {
            if (editModal?.classList.contains('show')) hideModal(editModal);
            if (addModal?.classList.contains('show')) hideModal(addModal);
            if (deleteModal?.classList.contains('show')) hideDeleteModal();
            if (viewProfileModal?.classList.contains('show')) hideModal(viewProfileModal);
        }
    });

    // --- Initial Load ---
    loadUsers();

    // --- Update plan options in HTML selects ---
    document.addEventListener('DOMContentLoaded', () => {
        const planSelects = document.querySelectorAll('#editPlan, #addPlan');
        const filterPlanSelect = document.getElementById('filterSelect');
        const planOptions = [{
            value: 'Basic Plan',
            text: 'Basic Plan'
        }, {
            value: 'Standard Plan',
            text: 'Standard Plan'
        }, {
            value: 'Premium Plan',
            text: 'Premium Plan'
        }];
        planSelects.forEach(select => {
            while (select.options.length > 1) select.remove(1);
            planOptions.forEach(opt => select.add(new Option(opt.text, opt.value)));
        });
        if (filterPlanSelect) {
            while (filterPlanSelect.options.length > 1) filterPlanSelect.remove(1);
            planOptions.forEach(opt => filterPlanSelect.add(new Option(opt.text, opt.value)));
            filterPlanSelect.add(new Option('Expired', 'expired'));
            filterPlanSelect.add(new Option('Downgraded', 'downgraded'));
        }
    });

})(); // End Main IIFE