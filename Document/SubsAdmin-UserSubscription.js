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
    const userEmailHidden = document.getElementById('userEmailHidden'); // MODIFIED: Hidden input
    const userEmailDisplay = document.getElementById('userEmailDisplay'); // MODIFIED: Display span
    const userPlan = document.getElementById('userPlan');
    // REMOVED: const userPayment = document.getElementById('userPayment');
    const userId = document.getElementById('userId'); // Hidden input for AccountID
    const confirmBtn = document.getElementById('confirmUserEdit');
    const cancelBtn = document.getElementById('cancelUserEdit');

    // Profile/Receipt Modal Elements
    const viewProfileModal = document.getElementById('viewReceiptModal'); // Renamed ID usage
    const profileContent = document.getElementById('receiptContent'); // Renamed ID usage
    const closeProfileBtn = document.getElementById('closeReceiptBtn'); // Renamed ID usage

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

    // New function to format date/time (copied from SuperAdmin logic)
    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString.replace(' ', 'T')); 
            if (isNaN(date)) return dateString; 
            return date.toLocaleDateString('en-US', { 
                year: 'numeric', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit', hour12: true
            }).replace(',', '');
        } catch (e) {
            return dateString;
        }
    }


    // --- Core Data Fetching & Rendering ---
    async function loadUsers() {
        const searchTerm = searchInput.value.trim();
        const filterValue = planFilter.value;

        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (filterValue) params.append('filter', filterValue);

        try {
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

    // --- Edit User Logic (MODIFIED) ---
    function openEditModal(accountId) {
        const user = users.find(u => u.AccountID == accountId);
        if (!user || !editModal) return;

        userId.value = user.AccountID;
        
        // MODIFICATION: Set the value of the hidden input and the visible span
        userEmailHidden.value = user.Email; 
        userEmailDisplay.textContent = user.Email; 
        
        userPlan.value = user.Plan;
        
        clearErrors(editForm);
        showModal(editModal);
    }

    confirmBtn.addEventListener('click', async (evt) => {
        evt.preventDefault();

        const accountId = userId.value;
        const plan = userPlan.value;
        // MODIFICATION: Get email value from the hidden input for submission
        const email = userEmailHidden.value; 
        
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

    // --- Profile View Logic (MODIFIED) ---
     async function openProfileModal(accountId) {
        if (!viewProfileModal || !profileContent) {
            console.error("Profile modal elements not found in HTML.");
            alert("Profile modal structure is missing in the HTML file.");
            return;
        }

        profileContent.innerHTML = `<p style="text-align: center; padding: 40px; color: #888;">Loading profile...</p>`;
        showModal(viewProfileModal);

        try {
            // NOTE: This assumes you have a backend file named account_details.php 
            // that returns Email, Role, Plan, Plan_Status, SubsStarted, SubsEnd, and Payment_Method.
            const response = await fetch(`Backend/account_details.php?id=${accountId}`);
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to load profile data.');
            }

            const p = data.profile;
            
            // --- Logic for Subscription Text ---
            let subsStartText = p.SubsStarted ? formatDate(p.SubsStarted) : 'N/A';
            let subsEndText = p.SubsEnd ? formatDate(p.SubsEnd) : 'N/A';
            
            const isBasicPlan = p.Plan.toLowerCase() === 'basic plan' || (p.Payment_Method && p.Payment_Method.toLowerCase() === 'free plan');

            if (isBasicPlan) {
                subsStartText = 'N/A (Free Plan)';
                subsEndText = 'N/A (Free Plan)';
            }

            const statusColor = p.Status === 'Active' ? '#38a169' : '#e53e3e';
            
            // --- HTML FOR CUSTOMER PROFILE FORMAT ---
            profileContent.innerHTML = `
                <div class="profile-container" style="padding: 0 20px;">
                    <div class="section" style="margin-bottom: 20px;">
                        <h3 style="font-size: 16px; font-weight: 600; color: #555; margin-bottom: 10px;">Account Details</h3>
                        <p style="margin-bottom: 5px;"><strong style="font-weight: 700; display: inline-block; min-width: 150px;">Account ID:</strong> ${escapeHtml(p.AccountID)}</p>
                        <p style="margin-bottom: 5px;"><strong style="font-weight: 700; display: inline-block; min-width: 150px;">Email:</strong> ${escapeHtml(p.Email)}</p>
                        <p style="margin-bottom: 5px;"><strong style="font-weight: 700; display: inline-block; min-width: 150px;">Role:</strong> ${escapeHtml(p.Role)}</p>
                        </div>

                    <div class="section" style="margin-bottom: 20px;">
                        <h3 style="font-size: 16px; font-weight: 600; color: #555; margin-bottom: 10px;">Subscription Details</h3>
                        <p style="margin-bottom: 5px;"><strong style="font-weight: 700; display: inline-block; min-width: 150px;">Plan:</strong> ${escapeHtml(p.Plan)}</p>
                        <p style="margin-bottom: 5px; color: ${statusColor};"><strong style="font-weight: 700; display: inline-block; min-width: 150px;">Status:</strong> <span style="font-weight: 700; color: ${statusColor};">${escapeHtml(p.Status)}</span></p>
                        <p style="margin-bottom: 5px;"><strong style="font-weight: 700; display: inline-block; min-width: 150px;">Payment Method:</strong> ${escapeHtml(p.Payment_Method)}</p>
                        <p style="margin-bottom: 5px;"><strong style="font-weight: 700; display: inline-block; min-width: 150px;">Subscription Start:</strong> ${escapeHtml(subsStartText)}</p>
                        <p style="margin-bottom: 5px;"><strong style="font-weight: 700; display: inline-block; min-width: 150px;">Subscription End:</strong> ${escapeHtml(subsEndText)}</p>
                    </div>
                </div>
            `;

        } catch (err) {
            console.error("View Profile Error:", err);
            profileContent.innerHTML = `<p style="text-align: center; padding: 40px; color: red;">Error: ${err.message}</p>`;
        }
    }

    if (closeProfileBtn) {
        closeProfileBtn.addEventListener('click', () => hideModal(viewProfileModal));
    }
     if (viewProfileModal) {
        viewProfileModal.addEventListener('click', (e) => { if (e.target === viewProfileModal) hideModal(viewProfileModal); });
    }

    // --- Table Action Listeners (Edit/View) ---
    tbody.addEventListener('click', (e) => {
        const targetButton = e.target.closest('button.action-btn');
        if (!targetButton) return;

        const userId = targetButton.dataset.id;

        if (targetButton.classList.contains('edit-btn')) {
            openEditModal(userId);
        } else if (targetButton.classList.contains('view-btn')) {
            openProfileModal(userId); // Renamed function call
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
            if (viewProfileModal && viewProfileModal.classList.contains('show')) hideModal(viewProfileModal);
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