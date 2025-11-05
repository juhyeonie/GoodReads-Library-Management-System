console.log('SuperAdmin-User.js loaded (Fixed Version)');

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

// ===== Customer Management Logic (DATABASE CONNECTED) =====
(function() {
    let users = [];
    let currentViewAccountId = null; // Used to pass ID from Profile to Receipt modal

    const tbody = document.querySelector('#usersTable tbody');
    const searchInput = document.getElementById('searchInput');
    const filterSelect = document.getElementById('filterSelect');
    const addUserBtn = document.getElementById('addUserBtn');

    // --- REMOVED 'viewModal' elements ---

    // Edit Modal Elements
    const editModal = document.getElementById('editModal');
    const editForm = document.getElementById('editForm');
    const editEmail = document.getElementById('editEmail');
    const editPassword = document.getElementById('editPassword');
    const editPasswordHelper = document.getElementById('editPasswordHelper');
    const editPlan = document.getElementById('editPlan');
<<<<<<< HEAD
    // const editPayment = document.getElementById('editPayment'); // This field is removed from edit
=======
>>>>>>> 6318d8df5c58a6f0416cf15fada815654e21f674
    const editUserIdInput = document.getElementById('editReceipt');
    const confirmEdit = document.getElementById('confirmEdit');
    const cancelEdit = document.getElementById('cancelEdit');

    // Add Modal Elements
    const addModal = document.getElementById('addModal');
    const addForm = document.getElementById('addForm');
    const addEmail = document.getElementById('addEmail');
    const addPassword = document.getElementById('addPassword');
    const addPasswordHelper = document.getElementById('addPasswordHelper');
    const addPlan = document.getElementById('addPlan');
<<<<<<< HEAD
    // const addPayment = document.getElementById('addPayment'); // This field is removed
=======
>>>>>>> 6318d8df5c58a6f0416cf15fada815654e21f674
    const confirmAdd = document.getElementById('confirmAdd');
    const cancelAdd = document.getElementById('cancelAdd');

    // Delete Modal Elements
    const deleteModal = document.getElementById('deleteModal');
    const deleteMessage = document.getElementById('deleteMessage');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    let deleteTargetId = null;

<<<<<<< HEAD
    // Profile Modal Elements (REUSING old Receipt IDs for less HTML breakage)
    const viewProfileModal = document.getElementById('viewReceiptModal'); 
    const profileContent = document.getElementById('receiptContent');     
    const closeProfileBtn = document.getElementById('closeReceiptBtn');    
=======
    // Profile Modal Elements
    const viewProfileModal = document.getElementById('viewReceiptModal'); 
    const profileContent = document.getElementById('receiptContent');     
    const closeProfileBtn = document.getElementById('closeReceiptBtn');    
    const viewProfileReceiptBtn = document.getElementById('viewProfileReceiptBtn'); // <-- NEW BUTTON
    
    // Payment Receipt Modal Elements
    const viewPaymentReceiptModal = document.getElementById('viewPaymentReceiptModal');
    const paymentReceiptContent = document.getElementById('paymentReceiptContent');
    const closePaymentReceiptBtn = document.getElementById('closePaymentReceiptBtn');
>>>>>>> 6318d8df5c58a6f0416cf15fada815654e21f674

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
<<<<<<< HEAD
     }
    // New function to format date/time
=======
    }

>>>>>>> 6318d8df5c58a6f0416cf15fada815654e21f674
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
<<<<<<< HEAD
=======
    
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
>>>>>>> 6318d8df5c58a6f0416cf15fada815654e21f674

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
        const selects = scope.querySelectorAll('select');
        selects.forEach(s => {
            if (s.value && s.value !== '') s.classList.add('has-value'); 
            else s.classList.remove('has-value');

            s.addEventListener('change', function() {
                if (this.value && this.value !== '') this.classList.add('has-value');
                else this.classList.remove('has-value');
            });
        });
    }

    function initFloatingTextInputs(scope=document) {
        const inputs = scope.querySelectorAll('input, textarea');
        inputs.forEach(inp => {
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
                  <button class="pill delete" data-id="${escapeHtml(u.AccountID)}">Delete</button>
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

<<<<<<< HEAD
    // MODIFIED: validateForm no longer checks for payment
=======
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

>>>>>>> 6318d8df5c58a6f0416cf15fada815654e21f674
    function validateForm(email, password, plan, isEdit = false) {
        let isValid = true;
        const prefix = isEdit ? 'edit' : 'add';
        clearErrors(document.getElementById(prefix + 'Form'));
        
<<<<<<< HEAD
        // Email validation only for ADD modal
        if (!isEdit && (!email || !validateEmail(email))) { 
            showError(prefix + 'Email', 'Invalid email'); 
            isValid = false; 
        }
        
        if (!isEdit && !password) { showError(prefix + 'Password', 'Password required'); isValid = false; }
        else if (password && password.length < 6) { showError(prefix + 'Password', 'Password >= 6 chars'); isValid = false; }
        if (!plan) { showError(prefix + 'Plan', 'Plan required'); isValid = false; }
        
        // Payment validation is REMOVED
        
=======
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

        if (!plan) { 
            showError(prefix + 'Plan', 'Plan required'); 
            isValid = false; 
        }
        
>>>>>>> 6318d8df5c58a6f0416cf15fada815654e21f674
        return isValid;
    }


    // --- REMOVED 'openViewModal' and its listeners ---


<<<<<<< HEAD
    // --- Edit User Logic (MODIFIED) ---
=======
    // --- Edit User ---
>>>>>>> 6318d8df5c58a6f0416cf15fada815654e21f674
    function openEditModal(userId) {
        const user = users.find(u => u.AccountID == userId);
        if (!user || !editModal) return;
        
        editUserIdInput.value = user.AccountID;
<<<<<<< HEAD
        
        // Set the value of the hidden input and the visible span
        editEmail.value = user.Email; 
        editEmailDisplay.textContent = user.Email;
        
        editPassword.value = ''; // Clear password field
        editPlan.value = user.Plan;
=======
        editEmail.value = user.Email || '';
        editPassword.value = '';
        editPlan.value = user.Plan || '';
>>>>>>> 6318d8df5c58a6f0416cf15fada815654e21f674
        
        clearErrors(editForm);
        
        if (editPlan) {
<<<<<<< HEAD
          if (editPlan.value) editPlan.classList.add('has-value'); else editPlan.classList.remove('has-value');
        }
=======
          if (editPlan.value) editPlan.classList.add('has-value'); 
          else editPlan.classList.remove('has-value');
        }
        
>>>>>>> 6318d8df5c58a6f0416cf15fada815654e21f674
        showModal(editModal);
    }

    // MODIFIED: confirmEdit now determines and sends payment_method
    confirmEdit.addEventListener('click', async (e) => {
        e.preventDefault();
        const userId = editUserIdInput.value;
<<<<<<< HEAD
        const email = editEmail.value.trim(); // Retrieve from hidden input
        const password = editPassword.value;
        const plan = editPlan.value;
        
        // MODIFIED: Implement payment logic
        const payment_method = (plan === 'Basic Plan') ? 'Free' : 'AdminGiven';
        
        // Updated validation call (removed payment)
        if (!validateForm(email, password, plan, true)) return;

        confirmEdit.disabled = true; confirmEdit.textContent = 'SAVING...';
=======
        const email = editEmail.value.trim(); 
        const password = editPassword.value;
        const plan = editPlan.value;

        if (!validateForm(email, password, plan, true)) return;

        confirmEdit.disabled = true; 
        confirmEdit.textContent = 'SAVING...';
        
>>>>>>> 6318d8df5c58a6f0416cf15fada815654e21f674
        try {
            const response = await fetch('Backend/user_update.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
<<<<<<< HEAD
                // MODIFIED: Send plan AND new payment_method
                body: JSON.stringify({ userId, email, password, plan, payment: payment_method }) 
=======
                body: JSON.stringify({ userId, email, password, plan })
>>>>>>> 6318d8df5c58a6f0416cf15fada815654e21f674
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
<<<<<<< HEAD
    editModal.addEventListener('click', (e) => { 
        if (e.target === editModal) hideModal(editModal); 
    });

    // --- Add User Logic (MODIFIED) ---
=======
    
    if (editModal) {
        editModal.addEventListener('click', (e) => { 
            if (e.target === editModal) hideModal(editModal); 
        });
    }

    // --- Add User ---
>>>>>>> 6318d8df5c58a6f0416cf15fada815654e21f674
    addUserBtn.addEventListener('click', () => {
        addForm.reset(); 
        clearErrors(addForm);
        const selects = addForm.querySelectorAll('select');
        selects.forEach(s => s.classList.remove('has-value'));
        showModal(addModal);
<<<<<<< HEAD
     });

    // MODIFIED: confirmAdd now determines and sends payment_method
=======
    });

>>>>>>> 6318d8df5c58a6f0416cf15fada815654e21f674
    confirmAdd.addEventListener('click', async (e) => {
        e.preventDefault();
        const email = addEmail.value.trim();
        const password = addPassword.value;
        const plan = addPlan.value;
<<<<<<< HEAD
        
        // MODIFIED: Implement payment logic
        const payment_method = (plan === 'Basic Plan') ? 'Free' : 'AdminGiven';

        // MODIFIED: Validation call no longer includes payment
=======

>>>>>>> 6318d8df5c58a6f0416cf15fada815654e21f674
        if (!validateForm(email, password, plan, false)) return;

        confirmAdd.disabled = true; 
        confirmAdd.textContent = 'ADDING...';
        
        try {
            const response = await fetch('Backend/user_add.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
<<<<<<< HEAD
                // MODIFIED: Send plan AND new payment_method
                body: JSON.stringify({ email, password, plan, payment: payment_method })
=======
                body: JSON.stringify({ email, password, plan })
>>>>>>> 6318d8df5c58a6f0416cf15fada815654e21f674
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

    // --- Delete User ---
    function showDeleteModal(userId, userEmail) {
        deleteTargetId = userId;
        deleteMessage.textContent = `Are you sure you want to delete user ${escapeHtml(userEmail || userId)}? This action cannot be undone.`;
        showModal(deleteModal);
        setTimeout(() => cancelDeleteBtn?.focus(), 80);
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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: deleteTargetId })
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
            confirmDeleteBtn.textContent = 'YES';
        }
<<<<<<< HEAD
     });
    cancelDeleteBtn.addEventListener('click', hideDeleteModal);
    deleteModal.addEventListener('click', (e) => { if (e.target === deleteModal) hideDeleteModal(); });
=======
    });
>>>>>>> 6318d8df5c58a6f0416cf15fada815654e21f674

    cancelDeleteBtn.addEventListener('click', hideDeleteModal);
    
    if (deleteModal) {
        deleteModal.addEventListener('click', (e) => { 
            if (e.target === deleteModal) hideDeleteModal(); 
        });
    }

    // --- Profile View ---
    async function openProfileModal(accountId) {
        if (!viewProfileModal || !profileContent) {
            console.error("Profile modal elements not found in HTML.");
            alert("Profile modal structure is missing. Please check HTML IDs.");
            return;
        }
        
        currentViewAccountId = accountId; // <-- STORE THE ID

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
            currentViewAccountId = null; // <-- CLEAR THE ID
        }); 
    }
    
    if (viewProfileModal) { 
        viewProfileModal.addEventListener('click', (e) => { 
            if (e.target === viewProfileModal) {
                hideModal(viewProfileModal);
                currentViewAccountId = null; // <-- CLEAR THE ID
            }
        }); 
    }

    // --- NEW LISTENER for button inside profile modal ---
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
        const user = users.find(u => u.AccountID == userId);
        
        if (btn.classList.contains('edit')) openEditModal(userId);
        else if (btn.classList.contains('delete')) showDeleteModal(userId, user?.Email);
<<<<<<< HEAD
        else if (btn.classList.contains('view')) openProfileModal(userId); // *** CALLS NEW PROFILE FUNCTION ***
     });
=======
        else if (btn.classList.contains('view')) openProfileModal(userId); 
    });
>>>>>>> 6318d8df5c58a6f0416cf15fada815654e21f674

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
            if (deleteModal?.classList.contains('show')) hideDeleteModal();
<<<<<<< HEAD
            if (viewProfileModal?.classList.contains('show')) hideModal(viewProfileModal); // Checks profile modal
        }
     });

    // --- Initial Load & floating init ---
    document.addEventListener('DOMContentLoaded', () => {
        loadUsers();
        initFloatingSelects(document);
        initFloatingTextInputs(document);

        // Ensure selects inside modals get background arrow (if desired) and class updated
        // const editPaymentSelect = document.getElementById('editPayment'); // Reference removed
        [document.getElementById('addPlan'), /*document.getElementById('addPayment'),*/ document.getElementById('editPlan'), /*editPaymentSelect,*/ document.getElementById('filterSelect')].forEach(s => {
            if (s) {
                if (s.value && s.value !== '') s.classList.add('has-value'); else s.classList.remove('has-value');
                s.addEventListener('change', () => {
                    if (s.value && s.value !== '') s.classList.add('has-value'); else s.classList.remove('has-value');
                });
            }
        });
    });

    // --- Update plan options in HTML selects (kept) ---
    document.addEventListener('DOMContentLoaded', () => {
        const planSelects = document.querySelectorAll('#editPlan, #addPlan');
        const filterPlanSelect = document.getElementById('filterSelect');
        const planOptions = [
            { value: 'Basic Plan', text: 'Basic Plan' },
            { value: 'Standard Plan', text: 'Standard Plan' },
            { value: 'Premium Plan', text: 'Premium Plan' }
        ];
        planSelects.forEach(select => {
            while (select.options.length > 1) select.remove(1);
            planOptions.forEach(opt => select.add(new Option(opt.text, opt.value)));
        });
        if (filterPlanSelect) {
            while (filterPlanSelect.options.length > 1) filterPlanSelect.remove(1);
            planOptions.forEach(opt => filterPlanSelect.add(new Option(opt.text, opt.value)));
            filterPlanSelect.add(new Option('Expired', 'expired'));
            filterPlanSelect.add(new Option('Cancelled', 'cancelled')); 
            filterPlanSelect.add(new Option('Downgraded', 'downgraded'));
=======
            if (viewProfileModal?.classList.contains('show')) {
                hideModal(viewProfileModal);
                currentViewAccountId = null; // <-- CLEAR THE ID
            }
            if (viewPaymentReceiptModal?.classList.contains('show')) hideModal(viewPaymentReceiptModal);
            // --- REMOVED 'viewModal' check ---
>>>>>>> 6318d8df5c58a6f0416cf15fada815654e21f674
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