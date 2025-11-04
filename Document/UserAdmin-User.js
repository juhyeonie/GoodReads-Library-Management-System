console.log('UserAdmin-User.js loaded');

// ===== Sidebar Logic =====
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

// ===== Customer Management Logic (User Admin Version) =====
(function() {
    let users = [];
    let currentViewAccountId = null; // Used to pass ID from Profile to Receipt modal

    const tbody = document.querySelector('#usersTable tbody');
    const searchInput = document.getElementById('searchInput');
    const filterSelect = document.getElementById('filterSelect');
    const addUserBtn = document.getElementById('addUserBtn');

    // Edit Modal Elements
    const editModal = document.getElementById('editModal');
    const editForm = document.getElementById('editForm');
    const editEmail = document.getElementById('editEmail');
    const editPassword = document.getElementById('editPassword');
    const editPasswordHelper = document.getElementById('editPasswordHelper');
    const editUserIdInput = document.getElementById('editUserId'); // Changed ID
    const confirmEdit = document.getElementById('confirmEdit');
    const cancelEdit = document.getElementById('cancelEdit');

    // Add Modal Elements
    const addModal = document.getElementById('addModal');
    const addForm = document.getElementById('addForm');
    const addEmail = document.getElementById('addEmail');
    const addPassword = document.getElementById('addPassword');
    const addPasswordHelper = document.getElementById('addPasswordHelper');
    const confirmAdd = document.getElementById('confirmAdd');
    const cancelAdd = document.getElementById('cancelAdd');

    // --- DELETE MODAL REMOVED ---

    // Profile Modal Elements
    const viewProfileModal = document.getElementById('viewProfileModal'); 
    const profileContent = document.getElementById('profileContent');     
    const closeProfileBtn = document.getElementById('closeProfileBtn');    
    const viewProfileReceiptBtn = document.getElementById('viewProfileReceiptBtn');
    
    // Payment Receipt Modal Elements
    const viewPaymentReceiptModal = document.getElementById('viewPaymentReceiptModal');
    const paymentReceiptContent = document.getElementById('paymentReceiptContent');
    const closePaymentReceiptBtn = document.getElementById('closePaymentReceiptBtn');

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
    
    function formatReceiptDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString.replace(' ', 'T'));
            if (isNaN(date)) return dateString;
            return date.toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
            });
        } catch (e) {
            return dateString;
        }
    }

    // --- Password Toggle Logic ---
    function getOpenEyeSVG() {
        return `
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        `;
    }

    function getClosedEyeSVG() {
        return `
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"></path>
          <path d="M14.12 14.12A3 3 0 0 1 9.88 9.88"></path>
          <line x1="1" y1="1" x2="23" y2="23"></line>
        `;
    }

    function initPasswordToggles() {
        document.querySelectorAll('.password-toggle').forEach(toggle => {
            const eyeIcon = toggle.querySelector('.eye-icon');
            if (eyeIcon && eyeIcon.innerHTML.trim() === '') {
                eyeIcon.innerHTML = getClosedEyeSVG();
            }
            toggle.addEventListener('click', function() {
                const targetId = this.getAttribute('data-target');
                const passwordInput = document.getElementById(targetId);
                const eyeIconLocal = this.querySelector('.eye-icon');

                if (!passwordInput) return;
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    if (eyeIconLocal) eyeIconLocal.innerHTML = getOpenEyeSVG();
                } else {
                    passwordInput.type = 'password';
                    if (eyeIconLocal) eyeIconLocal.innerHTML = getClosedEyeSVG();
                }
            });
        });
    }

    initPasswordToggles();

    // --- Password Helper Logic ---
    function initPasswordHelpers() {
        if (addPassword && addPasswordHelper) {
            addPassword.addEventListener('focus', () => {
                if (!document.getElementById('addPasswordError').classList.contains('show')) {
                    addPasswordHelper.style.display = 'block';
                }
            });
            addPassword.addEventListener('blur', () => {
                addPasswordHelper.style.display = 'none';
            });
        }

        if (editPassword && editPasswordHelper) {
            editPassword.addEventListener('focus', () => {
                if (!document.getElementById('editPasswordError').classList.contains('show')) {
                    editPasswordHelper.style.display = 'block';
                }
            });
            editPassword.addEventListener('blur', () => {
                editPasswordHelper.style.display = 'none';
            });
        }
    }
    initPasswordHelpers();


    // --- Floating Label Logic ---
    function initFloatingSelects(scope=document) {
        scope.querySelectorAll('select').forEach(s => {
            if (s.value && s.value !== '') s.classList.add('has-value'); 
            else s.classList.remove('has-value');

            s.addEventListener('change', function() {
                if (this.value && this.value !== '') this.classList.add('has-value');
                else this.classList.remove('has-value');
            });
        });
    }

    function initFloatingTextInputs(scope=document) {
        scope.querySelectorAll('input, textarea').forEach(inp => {
            function update() {
                if (!inp) return;
                if (inp.value && inp.value !== '') inp.classList.add('has-val'); 
                else inp.classList.remove('has-val');
            }
            inp.addEventListener('input', update);
            update();
        });
    }

    // --- Data Fetching & Rendering ---
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
            // MODIFIED: Removed "Delete" button
            tr.innerHTML = `
              <td>${escapeHtml(u.AccountID)}</td>
              <td>${escapeHtml(u.Email)}</td>
              <td>
  <span class="plan-badge ${
    escapeHtml(
      u.Plan
        ?.toLowerCase()
        .replace(/\bplan\b/g, '')   
        .replace(/[_\s-]+/g, '')  
        .trim()
    )
  }">
    ${escapeHtml(formatPlan(u.Plan))}
  </span>
</td>

<td>
  <span class="payment-badge ${
    escapeHtml(
      (u.Payment_Method || '')
        .toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[^a-z]/g, '')
        .trim()
    )
  }">
    ${escapeHtml(formatPaymentMethod(u.Payment_Method))}
  </span>
</td>

              <td>
                <div class="actions">
                  <button class="pill view" data-id="${escapeHtml(u.AccountID)}">View Profile</button>
                  <button class="pill edit" data-id="${escapeHtml(u.AccountID)}">Edit</button>
                </div>
              </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // --- Modal Handling ---
    function showModal(modal) { 
        if(modal){ 
            modal.classList.add('show'); 
            modal.style.display = 'flex'; 
            document.body.classList.add('no-scroll'); 
        }
    }

    function hideModal(modal) { 
        if(modal){ 
            modal.classList.remove('show'); 
            modal.style.display = ''; 
            document.body.classList.remove('no-scroll'); 
        }
    }

    function clearErrors(form) {
        if(!form) return;
        form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
        form.querySelectorAll('.error-message').forEach(el => { 
            el.textContent = ''; 
            el.classList.remove('show'); 
        });

        if (addPasswordHelper) addPasswordHelper.style.display = 'none';
        if (editPasswordHelper) editPasswordHelper.style.display = 'none';
    }

    function showError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const errorDiv = document.getElementById(fieldId + 'Error');
        if (field) field.classList.add('error');
        if (errorDiv) { 
            errorDiv.textContent = message; 
            errorDiv.classList.add('show'); 
        }

        if (fieldId === 'addPassword' && addPasswordHelper) {
            addPasswordHelper.style.display = 'none';
        }
        if (fieldId === 'editPassword' && editPasswordHelper) {
            editPasswordHelper.style.display = 'none';
        }
    }

    function displayServerErrors(errors, prefix) {
         const form = document.getElementById(prefix + 'Form');
         clearErrors(form || document);
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

    function validatePassword(password) {
        if (password.length < 8) {
            return { valid: false, message: 'Password must be at least 8 characters.' };
        }
        if (!/[A-Z]/.test(password)) {
            return { valid: false, message: 'Must contain one uppercase letter.' };
        }
        if (!/\d/.test(password)) {
            return { valid: false, message: 'Must contain one number.' };
        }
        return { valid: true, message: '' };
    }

    // MODIFIED: validateForm no longer checks for 'plan'
    function validateForm(email, password, isEdit = false) {
        let isValid = true;
        const prefix = isEdit ? 'edit' : 'add';
        clearErrors(document.getElementById(prefix + 'Form'));
        
        if (!email || !validateEmail(email)) { 
            showError(prefix + 'Email', 'Invalid email'); 
            isValid = false; 
        }

        if (isEdit) {
            if (password && password.length > 0) {
                const passValidation = validatePassword(password);
                if (!passValidation.valid) {
                    showError(prefix + 'Password', passValidation.message);
                    isValid = false;
                }
            }
        } else {
            if (!password) {
                showError(prefix + 'Password', 'Password required'); 
                isValid = false;
            } else {
                const passValidation = validatePassword(password);
                if (!passValidation.valid) {
                    showError(prefix + 'Password', passValidation.message);
                    isValid = false;
                }
            }
        }
        
        return isValid;
    }

    // --- Edit User (Simplified) ---
    function openEditModal(userId) {
        const user = users.find(u => u.AccountID == userId);
        if (!user || !editModal) return;
        
        editUserIdInput.value = user.AccountID;
        editEmail.value = user.Email || '';
        editPassword.value = '';
        
        clearErrors(editForm);
        initFloatingTextInputs(editForm); // Update floating labels
        
        showModal(editModal);
    }

    confirmEdit.addEventListener('click', async (e) => {
        e.preventDefault();
        const userId = editUserIdInput.value;
        const email = editEmail.value.trim(); 
        const password = editPassword.value;

        // MODIFIED: validateForm call
        if (!validateForm(email, password, true)) return;

        confirmEdit.disabled = true; 
        confirmEdit.textContent = 'SAVING...';
        
        try {
            const response = await fetch('Backend/user_update.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // MODIFIED: Simplified body
                body: JSON.stringify({ userId, email, password }) 
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
            console.error("Update User Error:", err); 
            alert(`Error: ${err.message}`);
        } finally {
            confirmEdit.disabled = false; 
            confirmEdit.textContent = 'CONFIRM';
        }
    });

    cancelEdit.addEventListener('click', () => hideModal(editModal));
    
    if (editModal) {
        editModal.addEventListener('click', (e) => { 
            if (e.target === editModal) hideModal(editModal); 
        });
    }

    // --- Add User (Simplified) ---
    addUserBtn.addEventListener('click', () => {
        addForm.reset(); 
        clearErrors(addForm);
        showModal(addModal);
    });

    confirmAdd.addEventListener('click', async (e) => {
        e.preventDefault();
        const email = addEmail.value.trim();
        const password = addPassword.value;

        // MODIFIED: validateForm call
        if (!validateForm(email, password, false)) return;

        confirmAdd.disabled = true; 
        confirmAdd.textContent = 'ADDING...';
        
        try {
            const response = await fetch('Backend/user_add.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // MODIFIED: Body includes hardcoded plan and payment
                body: JSON.stringify({ 
                    email, 
                    password, 
                    plan: 'Basic Plan', 
                    payment_method: 'Admin Given' 
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
    
    if (addModal) {
        addModal.addEventListener('click', (e) => { 
            if (e.target === addModal) hideModal(addModal); 
        });
    }

    // --- DELETE USER FUNCTIONS REMOVED ---

    // --- Profile View ---
    async function openProfileModal(accountId) {
        if (!viewProfileModal || !profileContent) {
            console.error("Profile modal elements not found in HTML.");
            return;
        }
        
        currentViewAccountId = accountId; // Store the ID

        profileContent.innerHTML = `<p style="text-align: center; padding: 40px; color: #888;">Loading profile...</p>`;
        showModal(viewProfileModal);

        try {
            const response = await fetch(`Backend/account_details.php?id=${accountId}`); 
            const data = await response.json();
            if (!data.success) throw new Error(data.message || 'Failed to load profile.');

            const p = data.profile; 
            
            let subsStartText = p.SubsStarted ? formatDate(p.SubsStarted) : 'N/A';
            let subsEndText = p.SubsEnd ? formatDate(p.SubsEnd) : 'N/A';
            
            const isBasicPlan = p.Plan.toLowerCase() === 'basic plan' || 
                               (p.Payment_Method && p.Payment_Method.toLowerCase() === 'free plan');

            if (isBasicPlan) {
                subsStartText = 'N/A (Free Plan)';
                subsEndText = 'N/A (Free Plan)';
            }

            const statusColor = p.Status === 'Active' ? '#38a169' : '#e53e3e';
            
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
        closeProfileBtn.addEventListener('click', () => {
            hideModal(viewProfileModal);
            currentViewAccountId = null;
        }); 
    }
    
    if (viewProfileModal) { 
        viewProfileModal.addEventListener('click', (e) => { 
            if (e.target === viewProfileModal) {
                hideModal(viewProfileModal);
                currentViewAccountId = null;
            }
        }); 
    }

    if (viewProfileReceiptBtn) {
        viewProfileReceiptBtn.addEventListener('click', () => {
            if (currentViewAccountId) {
                openPaymentReceiptModal(currentViewAccountId);
            }
        });
    }
    
    // --- Payment Receipt View ---
    async function openPaymentReceiptModal(accountId) {
        if (!viewPaymentReceiptModal || !paymentReceiptContent) {
            console.error("Payment receipt modal elements not found.");
            return;
        }

        paymentReceiptContent.innerHTML = `<p style="text-align: center; padding: 40px; color: #888;">Loading receipt...</p>`;
        showModal(viewPaymentReceiptModal);

        try {
            const response = await fetch(`Backend/fetch_receipt.php?accountId=${accountId}`);
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Failed to load receipt.');
            }

            const r = data.receipt;
            
            const formattedDateTime = formatReceiptDate(r.dateTime);
            const formattedStartDate = formatReceiptDate(r.startDate);
            const formattedExpiryDate = formatReceiptDate(r.expiryDate);

            paymentReceiptContent.innerHTML = `
                <hr class="top-line">
                <h2>SUBSCRIPTION RECEIPT</h2>
                <hr class="divider">
                <div class="section">
                  <p><span>Receipt no</span> ${escapeHtml(r.receiptNo)}</p>
                  <p><span>Date & Time</span> ${escapeHtml(formattedDateTime)}</p>
                  <p><span>Email</span> ${escapeHtml(r.email)}</p>
                </div>
                <hr class="divider">
                <div class="section">
                  <p><span>Subscription Plan</span> ${escapeHtml(r.planName)}</p>
                  <p><span>Plan Duration</span> ${escapeHtml(r.planDuration)}</p>
                  <p><span>Start Date</span> ${escapeHtml(formattedStartDate)}</p>
                  <p><span>Expiry Date</span> ${escapeHtml(formattedExpiryDate)}</p>
                </div>
                <hr class="divider">
                <div class="section">
                  <p><span>Amount Paid</span> ${escapeHtml(r.amountPaid)}</p>
                  <p><span>Payment Method</span> ${escapeHtml(r.paymentMethod)}</p>
                  <p><span>Payment Status</span> ${escapeHtml(r.paymentStatus)}</p>
                </div>
                <hr class="divider">
                <p class="note">
                  This receipt serves as proof of subscription.
                </p>
                <hr class="bottom-line">
                <p class="footer-note">
                  * This is a system-generated receipt.
                </p>
            `;

        } catch (err) {
            console.error("View Receipt Error:", err);
            paymentReceiptContent.innerHTML = `<p style="text-align: center; padding: 40px; color: red;">Error: ${err.message}</p>`;
        }
    }

    if (closePaymentReceiptBtn) {
        closePaymentReceiptBtn.addEventListener('click', () => hideModal(viewPaymentReceiptModal));
    }
    
    if (viewPaymentReceiptModal) {
        viewPaymentReceiptModal.addEventListener('click', (e) => {
            if (e.target === viewPaymentReceiptModal) hideModal(viewPaymentReceiptModal);
        });
    }

    // --- Table Action Listeners ---
    tbody.addEventListener('click', (e) => {
        const btn = e.target.closest('button.pill');
        if (!btn) return;
        const userId = btn.dataset.id;
        
        if (btn.classList.contains('edit')) {
            openEditModal(userId);
        } else if (btn.classList.contains('view')) {
            openProfileModal(userId); 
        }
        // --- "Delete" listener removed ---
    });

    // --- Search & Filter ---
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
            // --- "Delete" check removed ---
            if (viewProfileModal?.classList.contains('show')) {
                hideModal(viewProfileModal);
                currentViewAccountId = null;
            }
            if (viewPaymentReceiptModal?.classList.contains('show')) hideModal(viewPaymentReceiptModal);
        }
    });

    // --- Initialize ---
    loadUsers();
    initFloatingSelects(document);
    initFloatingTextInputs(document);

})();

// --- ADDED: LOGOUT SCRIPT ---
(function() {
    // Find the logout link (same class used in all your HTML files)
    const logoutButton = document.querySelector('.logout-icon');
    
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault(); // Stop the link from navigating immediately
            
            // Clear the session "Hall Pass"
            sessionStorage.removeItem('user_role');
            sessionStorage.clear(); // Clears everything just in case
            
            // Go to the login page
            window.location.href = 'StartPage.html';
        });
    }
})();
// --- END OF LOGOUT SCRIPT ---