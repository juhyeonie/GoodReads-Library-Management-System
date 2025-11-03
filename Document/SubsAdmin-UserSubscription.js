console.log('SubsAdmin-UserSubscription.js loaded');

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

// --- Customer Subscription Management (DATABASE CONNECTED) ---
(function() {
    let users = []; // Will hold data fetched from DB

    const tbody = document.querySelector('#usersTable tbody');
    const searchInput = document.getElementById('userSearch');
    const planFilter = document.getElementById('planFilter');

    // Edit Modal Elements
    const editModal = document.getElementById('editUserModal');
    const editForm = document.getElementById('editUserForm');
    const userEmail = document.getElementById('userEmail'); // Readonly email field
    const userPlan = document.getElementById('userPlan');
    // REMOVED: const userPayment = document.getElementById('userPayment');
    const userId = document.getElementById('userId'); // Hidden input for AccountID
    const confirmBtn = document.getElementById('confirmUserEdit');
    const cancelBtn = document.getElementById('cancelUserEdit');

    // *** START CHANGE: Renamed Receipt Modal Elements to Profile Modal Elements ***
    const viewProfileModal = document.getElementById('viewProfileModal');
    const profileContent = document.getElementById('profileContent');
    const closeProfileBtn = document.getElementById('closeProfileBtn');
    // *** END CHANGE ***

    // --- Utility Functions ---
    function escapeHtml(str) {
        if (str == null) return '';
        return String(str).replace(/[&<>"']/g, s => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[s]));
    }

    function formatPaymentMethod(method) {
        return method || 'N/A';
    }

    function formatPlan(plan) {
        return plan || 'N/A';
    }

    // *** START CHANGE: Added formatDate function ***
    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        // Handle SQLite date format (YYYY-MM-DD HH:MM:SS or just YYYY-MM-DD)
        try {
            const date = new Date(dateString.replace(' ', 'T'));
            if (isNaN(date)) return dateString; // Return original if parsing fails
            return date.toLocaleDateString('en-US', { 
                year: 'numeric', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
        } catch (e) {
            return dateString;
        }
    }
    // *** END CHANGE ***

    // --- Core Data Fetching & Rendering ---
    async function loadUsers() {
        const searchTerm = searchInput.value.trim();
        const filterValue = planFilter.value;

        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (filterValue) params.append('filter', filterValue);

        try {
            // This fetch URL now retrieves AccountCreated, SubsStarted, and SubsEnd
            const response = await fetch(`Backend/user_fetch.php?${params.toString()}`);
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to fetch users.');
            }

            users = data.users;
            renderTable(users);

        } catch (err) {
            console.error("Load Users Error:", err);
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: red;">Error loading users: ${err.message}</td></tr>`;
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
              <td style="text-align:right">
                <button class="action-btn view-btn" data-id="${escapeHtml(u.AccountID)}">View Profile</button>
                <button class="action-btn edit-btn" data-id="${escapeHtml(u.AccountID)}">Edit</button>
              </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // --- Modal Handling ---
    function showModal(modal) { if(modal) { modal.classList.add('show'); document.body.classList.add('no-scroll'); }}
    function hideModal(modal) { if(modal) { modal.classList.remove('show'); document.body.classList.remove('no-scroll'); }}

    function clearErrors(form) {
        form.querySelectorAll('input, select').forEach(el => el.classList.remove('error'));
    }

     function displayServerErrors(errors) {
         let errorMsg = "Validation failed:\n";
         for (const key in errors) {
             errorMsg += `- ${key}: ${errors[key]}\n`;
         }
         alert(errorMsg);
    }

    // --- Edit User Logic ---
    function openEditModal(accountId) {
        const user = users.find(u => u.AccountID == accountId);
        if (!user || !editModal) return;

        userId.value = user.AccountID;
        userEmail.value = user.Email; // Email is readonly
        userPlan.value = user.Plan;
        // REMOVED: userPayment.value = user.Payment_Method || '';
        clearErrors(editForm);
        showModal(editModal);
    }

    confirmBtn.addEventListener('click', async (evt) => {
        evt.preventDefault();

        const accountId = userId.value;
        const plan = userPlan.value;
        const email = userEmail.value; // Pass email for logging
        // REMOVED: const payment = userPayment.value;

        if (!plan) {
            alert('Please select a plan.');
            userPlan.classList.add('error');
            return;
        }
         clearErrors(editForm);

        confirmBtn.disabled = true; confirmBtn.textContent = 'SAVING...';
        try {
            const response = await fetch('Backend/subsadmin_user_update.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // REMOVED: payment from body
                body: JSON.stringify({ userId: accountId, email, plan })
            });
            const result = await response.json();

            if (!result.success) {
                 if (result.errors) {
                     displayServerErrors(result.errors);
                 } else {
                     throw new Error(result.message || 'Failed to update user subscription.');
                 }
            } else {
                hideModal(editModal);
                loadUsers(); // Refresh table
            }
        } catch (err) {
            console.error("Update User Sub Error:", err);
            alert(`Error: ${err.message}`);
        } finally {
            confirmBtn.disabled = false; confirmBtn.textContent = 'CONFIRM';
        }
    });

    cancelBtn.addEventListener('click', (e) => {
        e.preventDefault();
        hideModal(editModal);
    });
    editModal.addEventListener('click', (e) => { if (e.target === editModal) hideModal(editModal); });

    // *** START CHANGE: Replaced 'openReceiptModal' with 'openProfileModal' ***
    function openProfileModal(accountId) {
        const user = users.find(u => u.AccountID == accountId);
        if (!user) {
            profileContent.innerHTML = `<p style="text-align: center; padding: 40px; color: red;">User data not found in local cache.</p>`;
            showModal(viewProfileModal);
            return;
        }

        // Determine plan types
        const isBasicPlan = user.Plan === 'Basic Plan';

        // Conditional values for start/end date
        let subsStartDisplay;
        let subsEndHtml; // This will hold the entire HTML line for the end date

        if (isBasicPlan) {
            // FIX: If Basic Plan, show "N/A (Free Plan)" for dates
            subsStartDisplay = 'N/A (Free Plan)';
            subsEndHtml = `<p><strong>Subscription End:</strong> N/A (Free Plan)</p>`;
        } else {
            // Paid Plan Logic
            subsStartDisplay = formatDate(user.SubsStarted);
            // FIX: Show SubsEnd if it exists, otherwise 'N/A'
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
                    ${subsEndHtml} </div>
                
            </div>
        `;
        showModal(viewProfileModal);
    }

    if (closeProfileBtn) {
        closeProfileBtn.addEventListener('click', () => hideModal(viewProfileModal));
    }
     if (viewProfileModal) {
        viewProfileModal.addEventListener('click', (e) => { if (e.target === viewProfileModal) hideModal(viewProfileModal); });
    }
    // *** END CHANGE ***

    // --- Table Action Listeners (Edit/View) ---
    tbody.addEventListener('click', (e) => {
        const targetButton = e.target.closest('button.action-btn');
        if (!targetButton) return;

        const userId = targetButton.dataset.id;

        if (targetButton.classList.contains('edit-btn')) {
            openEditModal(userId);
        } else if (targetButton.classList.contains('view-btn')) {
            // *** START CHANGE: Call 'openProfileModal' ***
            openProfileModal(userId);
            // *** END CHANGE ***
        }
    });

    // --- Search & Filter Listeners ---
    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(loadUsers, 300); // Debounce search
    });
    planFilter.addEventListener('change', loadUsers);

    // --- Global Key Listener ---
    document.addEventListener('keydown', (ev) => {
        if (ev.key === 'Escape') {
            if (editModal && editModal.classList.contains('show')) hideModal(editModal);
            // *** START CHANGE: Check for 'viewProfileModal' ***
            if (viewProfileModal && viewProfileModal.classList.contains('show')) hideModal(viewProfileModal);
            // *** END CHANGE ***
        }
    });

    // --- Initial Load ---
    loadUsers();

    // --- Update plan options in HTML selects ---
    document.addEventListener('DOMContentLoaded', () => {
        const planSelects = document.querySelectorAll('#userPlan, #planFilter');

        const planOptions = [
            { value: 'Basic Plan', text: 'Basic Plan' },
            { value: 'Standard Plan', text: 'Standard Plan' },
            { value: 'Premium Plan', text: 'Premium Plan' }
        ];

        planSelects.forEach(select => {
            const isFilter = select.id === 'planFilter';
            while (select.options.length > 1) { select.remove(1); }
            planOptions.forEach(opt => { select.add(new Option(opt.text, opt.value)); });
            if (isFilter) {
                 select.add(new Option('Expired', 'expired'));
                 select.add(new Option('Downgraded', 'downgraded'));
            }
        });
    });

})();