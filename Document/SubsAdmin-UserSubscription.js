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

    // Receipt Modal Elements
    const viewReceiptModal = document.getElementById('viewReceiptModal');
    const receiptContent = document.getElementById('receiptContent');
    const closeReceiptBtn = document.getElementById('closeReceiptBtn');

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
                <button class="action-btn view-btn" data-id="${escapeHtml(u.AccountID)}">View</button>
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

    // --- Receipt View Logic ---
     async function openReceiptModal(accountId) {
        if (!viewReceiptModal || !receiptContent) {
            console.error("Receipt modal elements not found in HTML.");
            alert("Receipt modal structure is missing in the HTML file.");
            return;
        }

        receiptContent.innerHTML = `<p style="text-align: center; padding: 40px; color: #888;">Loading receipt...</p>`;
        showModal(viewReceiptModal);

        try {
            const response = await fetch(`Backend/fetch_receipt.php?accountId=${accountId}`);
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to load receipt data.');
            }

            const r = data.receipt;

            receiptContent.innerHTML = `
                <div class="receipt-container" style="border: none; padding: 0;">
                    <hr class="top-line" style="border-top: 2px dashed #333; margin: 10px 0;">
                    <h2 style="text-align: center; margin: 15px 0; font-size: 18px; font-weight: 600;">SUBSCRIPTION RECEIPT</h2>
                    <hr class="divider" style="border-top: 2px dashed #333; margin: 10px 0;">

                    <div class="section" style="margin: 15px 0; line-height: 1.7;">
                      <p><span style="font-weight: 500;">Receipt no.</span> : ${escapeHtml(r.receiptNo)}</p>
                      <p><span style="font-weight: 500;">Date & Time</span> : ${escapeHtml(r.dateTime)}</p>
                      <p><span style="font-weight: 500;">Email</span> : ${escapeHtml(r.email)}</p>
                    </div>

                    <hr class="divider" style="border-top: 2px dashed #333; margin: 10px 0;">

                    <div class="section" style="margin: 15px 0; line-height: 1.7;">
                      <p><span style="font-weight: 500;">Subscription Plan</span> : ${escapeHtml(r.planName)}</p>
                      ${r.planName !== 'Basic Plan' ? `
                      <p><span style="font-weight: 500;">Plan Duration</span> : ${escapeHtml(r.planDuration)}</p>
                      <p><span style="font-weight: 500;">Start Date</span> : ${escapeHtml(r.startDate)}</p>
                      <p><span style="font-weight: 500;">Expiry Date</span> : ${escapeHtml(r.expiryDate)}</p>
                      ` : ''}
                    </div>

                    <hr class="divider" style="border-top: 2px dashed #333; margin: 10px 0;">

                    <div class="section" style="margin: 15px 0; line-height: 1.7;">
                      <p><span style="font-weight: 500;">Amount Paid</span> : ${escapeHtml(r.amountPaid)}</p>
                      <p><span style="font-weight: 500;">Payment Method</span> : ${escapeHtml(r.paymentMethod)}</p>
                      ${r.planName !== 'Basic Plan' ? `
                      <p><span style="font-weight: 500;">Payment Status</span> : ${escapeHtml(r.paymentStatus)}</p>
                      ` : ''}
                    </div>

                    <hr class="divider" style="border-top: 2px dashed #333; margin: 10px 0;">

                    <p class="note" style="font-size: 14px; text-align: center; margin: 15px 0;">
                      ${r.planName !== 'Basic Plan' ? 'This receipt serves as proof of subscription.' : 'This user is on the Basic Plan.'}
                    </p>

                    <hr class="bottom-line" style="border-top: 2px dashed #333; margin: 10px 0;">

                    <p class="footer-note" style="text-align: center; font-size: 13px; margin-top: 10px; color: #333;">
                      * This is a system-generated receipt.
                    </p>
                </div>
            `;

        } catch (err) {
            console.error("View Receipt Error:", err);
            receiptContent.innerHTML = `<p style="text-align: center; padding: 40px; color: red;">Error: ${err.message}</p>`;
        }
    }

    if (closeReceiptBtn) {
        closeReceiptBtn.addEventListener('click', () => hideModal(viewReceiptModal));
    }
     if (viewReceiptModal) {
        viewReceiptModal.addEventListener('click', (e) => { if (e.target === viewReceiptModal) hideModal(viewReceiptModal); });
    }

    // --- Table Action Listeners (Edit/View) ---
    tbody.addEventListener('click', (e) => {
        const targetButton = e.target.closest('button.action-btn');
        if (!targetButton) return;

        const userId = targetButton.dataset.id;

        if (targetButton.classList.contains('edit-btn')) {
            openEditModal(userId);
        } else if (targetButton.classList.contains('view-btn')) {
            openReceiptModal(userId);
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
            if (viewReceiptModal && viewReceiptModal.classList.contains('show')) hideModal(viewReceiptModal);
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