 console.log('SubsAdmin-UserSubscription (single-file) loaded');

    /* ---------- Sidebar (unchanged logic) ---------- */
    (function(){
      const sidebar = document.getElementById('sidebar');
      const menuToggle = document.getElementById('menuToggle');
      const collapseBtn = document.getElementById('collapseBtn');
      const mainContent = document.getElementById('mainContent');
      const overlay = document.getElementById('sidebarOverlay');
      const COLLAPSED_KEY = 'sidebar_collapsed';
      const MOBILE_BREAKPOINT = 768;

      function isMobile(){ return window.innerWidth <= MOBILE_BREAKPOINT; }
      function updateLayout(){
        if(isMobile()){
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
      if(collapseBtn) collapseBtn.addEventListener('click', () => {
        if(isMobile()) return;
        const isCollapsed = sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('collapsed', isCollapsed);
        localStorage.setItem(COLLAPSED_KEY, isCollapsed);
      });
      if(menuToggle) menuToggle.addEventListener('click', (e) => { e.stopPropagation(); sidebar.classList.toggle('mobile-open'); overlay.classList.toggle('active'); });
      if(overlay) overlay.addEventListener('click', () => { sidebar.classList.remove('mobile-open'); overlay.classList.remove('active'); });
      const menuLinks = sidebar.querySelectorAll('.menu-item');
      menuLinks.forEach(link => link.addEventListener('click', () => { if(isMobile()){ sidebar.classList.remove('mobile-open'); overlay.classList.remove('active'); } }));
      document.addEventListener('keydown', (e) => {
        if(e.key === 'Escape' && isMobile() && sidebar.classList.contains('mobile-open')) {
          sidebar.classList.remove('mobile-open'); overlay.classList.remove('active');
        }
      });
    })();

    /* ---------- App data + modal logic ---------- */
    (function(){
      let users = []; // will be fetched

      const tbody = document.querySelector('#usersTable tbody');
      const searchInput = document.getElementById('userSearch');
      const planFilter = document.getElementById('planFilter');

      // View modal elements
      const viewModal = document.getElementById('viewModal');
      const viewAccountId = document.getElementById('viewAccountId');
      const viewEmail = document.getElementById('viewEmail');
      const viewPlan = document.getElementById('viewPlan');
      const viewPayment = document.getElementById('viewPayment');
      const viewInvoiceBtn = document.getElementById('viewInvoiceBtn');
      const closeViewBtn = document.getElementById('closeViewBtn');
      let currentViewAccountId = null;

<<<<<<< HEAD
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
=======
      // Edit modal elements
      const editModal = document.getElementById('editModal');
      const editForm = document.getElementById('editForm');
      const editEmail = document.getElementById('editEmail');
      const editPlan = document.getElementById('editPlan');
      const editPayment = document.getElementById('editPayment');
      const editUserId = document.getElementById('editUserId');
      const confirmEdit = document.getElementById('confirmEdit');
      const cancelEdit = document.getElementById('cancelEdit');

      // Receipt modal elements
      const viewReceiptModal = document.getElementById('viewReceiptModal');
      const receiptContent = document.getElementById('receiptContent');
      const closeReceiptBtn = document.getElementById('closeReceiptBtn');
>>>>>>> b145637f981ee697f94ca474e82d261f790433d6

      /* Utility */
      function escapeHtml(str) {
        if (str == null) return '';
        return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
      }

      function formatPlan(p){ return p || 'N/A'; }
      function formatPayment(m){ return m || 'N/A'; }

      function showModal(modal){ if(!modal) return; modal.classList.add('show'); modal.style.display = 'flex'; document.body.classList.add('no-scroll'); modal.setAttribute('aria-hidden','false'); }
      function hideModal(modal){ if(!modal) return; modal.classList.remove('show'); modal.style.display = ''; document.body.classList.remove('no-scroll'); modal.setAttribute('aria-hidden','true'); }

<<<<<<< HEAD
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
=======
      /* Floating selects: ensure label floats if select has value */
      function initFloatingSelects(scope=document){
        scope.querySelectorAll('select').forEach(s => {
          if(s.value && s.value !== '') s.classList.add('has-value'); else s.classList.remove('has-value');
          s.addEventListener('change', function(){ if(this.value && this.value !== '') this.classList.add('has-value'); else this.classList.remove('has-value'); });
        });
      }

      /* ---------- Data load & render ---------- */
      async function loadUsers() {
>>>>>>> b145637f981ee697f94ca474e82d261f790433d6
        const searchTerm = searchInput.value.trim();
        const filterValue = planFilter.value;
        const params = new URLSearchParams();
        if(searchTerm) params.append('search', searchTerm);
        if(filterValue) params.append('filter', filterValue);

        try {
          const resp = await fetch(`Backend/user_fetch.php?${params.toString()}`);
          const data = await resp.json();
          if(!data.success) throw new Error(data.message || 'Failed');
          users = data.users || [];
          renderTable(users);
        } catch(err) {
          console.error('Load users error', err);
          tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:red;">Error loading users: ${escapeHtml(err.message)}</td></tr>`;
        }
      }

      function renderTable(rows) {
        tbody.innerHTML = '';
        if(!rows || rows.length === 0) {
          tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No customers found.</td></tr>`;
          return;
        }
        rows.forEach(u => {
<<<<<<< HEAD
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
=======
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${escapeHtml(u.AccountID)}</td>
            <td>${escapeHtml(u.Email)}</td>
            <td>${escapeHtml(formatPlan(u.Plan))}</td>
            <td>${escapeHtml(formatPayment(u.Payment_Method))}</td>
            <td style="text-align:right">
              <button class="action-btn view-btn" data-id="${escapeHtml(u.AccountID)}">View</button>
              <button class="action-btn edit-btn" data-id="${escapeHtml(u.AccountID)}">Edit</button>
            </td>
          `;
          tbody.appendChild(tr);
>>>>>>> b145637f981ee697f94ca474e82d261f790433d6
        });
      }

      /* ---------- View modal logic (matches Customer Management style) ---------- */
      function openViewModal(accountId) {
        const user = users.find(x => x.AccountID == accountId);
        if(!user) return;
        currentViewAccountId = user.AccountID;
        viewAccountId.textContent = user.AccountID || '';
        viewEmail.textContent = user.Email || '';
        viewPlan.textContent = user.Plan || 'N/A';
        viewPayment.textContent = user.Payment_Method || 'N/A';
        showModal(viewModal);
      }

      if(closeViewBtn) closeViewBtn.addEventListener('click', () => { hideModal(viewModal); currentViewAccountId = null; });
      if(viewInvoiceBtn) viewInvoiceBtn.addEventListener('click', () => { if(currentViewAccountId) openReceiptModal(currentViewAccountId); });
      if(viewModal) viewModal.addEventListener('click', (e) => { if(e.target === viewModal) { hideModal(viewModal); currentViewAccountId = null; } });

      /* ---------- Edit modal logic (email readonly, plan, payment) ---------- */
      function openEditModal(accountId) {
        const user = users.find(x => x.AccountID == accountId);
        if(!user) return;
        editUserId.value = user.AccountID; // for backward compatibility
        editUserId && (editUserId.value = user.AccountID);
        editUserId && (editUserId.setAttribute('value', user.AccountID));
        editUserId && (editUserId.textContent = user.AccountID);

<<<<<<< HEAD
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
=======
        editUserId && (editUserId.value = user.AccountID); // ensure hidden set
        editUserId && (editUserId.setAttribute('data-account', user.AccountID));

        // main fields
        editUserId && (editUserId.value = user.AccountID);
        editUserId && (editUserId.setAttribute('value', user.AccountID));
        document.getElementById('editUserId')?.setAttribute('value', user.AccountID);

        // set visible form controls
        editEmail.value = user.Email || '';
        editPlan.value = user.Plan || '';
        editPayment.value = user.Payment_Method || '';
        initFloatingSelects(editForm);
>>>>>>> b145637f981ee697f94ca474e82d261f790433d6
        showModal(editModal);
      }

      // small compatibility: some IDs used earlier
      const editUserIdFallback = document.getElementById('editUserId');

<<<<<<< HEAD
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
=======
      confirmEdit.addEventListener('click', async (e) => {
>>>>>>> b145637f981ee697f94ca474e82d261f790433d6
        e.preventDefault();
        const accountId = editUserIdFallback?.value || (document.getElementById('editUserId')?.value) || editUserId?.value || '';
        const plan = editPlan.value;
        const payment = editPayment.value;
        const email = editEmail.value;
        // simple validation
        if(!plan) { editPlan.classList.add('error'); alert('Please select a plan.'); return; }
        if(!payment) { editPayment.classList.add('error'); alert('Please select a payment method.'); return; }
        editPlan.classList.remove('error'); editPayment.classList.remove('error');

<<<<<<< HEAD
    // --- Profile View Logic (MODIFIED) ---
     async function openProfileModal(accountId) {
        if (!viewProfileModal || !profileContent) {
            console.error("Profile modal elements not found in HTML.");
            alert("Profile modal structure is missing in the HTML file.");
=======
        confirmEdit.disabled = true; confirmEdit.textContent = 'SAVING...';
        try {
          const resp = await fetch('Backend/subsadmin_user_update.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: accountId, email, plan, payment })
          });
          const result = await resp.json();
          if(!result.success) {
            if(result.errors) {
              let msg = 'Validation errors:\\n';
              Object.keys(result.errors).forEach(k => { msg += k+': '+result.errors[k]+'\\n'; });
              alert(msg);
            } else throw new Error(result.message || 'Update failed');
          } else {
            hideModal(editModal);
            await loadUsers();
          }
        } catch(err) {
          console.error('Update error', err);
          alert('Error: ' + (err.message || 'Unable to update'));
        } finally {
          confirmEdit.disabled = false; confirmEdit.textContent = 'CONFIRM';
        }
      });

      cancelEdit.addEventListener('click', (e) => { e.preventDefault(); hideModal(editModal); });
      editModal.addEventListener('click', (e) => { if(e.target === editModal) hideModal(editModal); });

      /* ---------- Receipt logic (kept) ---------- */
      async function openReceiptModal(accountId) {
        if (!viewReceiptModal || !receiptContent) {
            console.error("Receipt modal elements not found in HTML.");
            alert("Receipt modal structure is missing. Please check HTML IDs.");
>>>>>>> b145637f981ee697f94ca474e82d261f790433d6
            return;
        }

        profileContent.innerHTML = `<p style="text-align: center; padding: 40px; color: #888;">Loading profile...</p>`;
        showModal(viewProfileModal);

        try {
            // NOTE: This assumes you have a backend file named account_details.php 
            // that returns Email, Role, Plan, Plan_Status, SubsStarted, SubsEnd, and Payment_Method.
            const response = await fetch(`Backend/account_details.php?id=${accountId}`);
            const data = await response.json();
<<<<<<< HEAD

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
=======
            if (!data.success) throw new Error(data.message || 'Failed to load receipt.');

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
                      ${r.planName !== 'Basic Plan' ? 'Proof of subscription.' : 'User is on Basic Plan.'}
                    </p>
                    <hr class="bottom-line" style="border-top: 2px dashed #333; margin: 10px 0;">
                    <p class="footer-note" style="text-align: center; font-size: 13px; margin-top: 10px; color: #333;">
                      * System-generated receipt.
                    </p>
>>>>>>> b145637f981ee697f94ca474e82d261f790433d6
                </div>
            `;
        } catch (err) {
            console.error("View Profile Error:", err);
            profileContent.innerHTML = `<p style="text-align: center; padding: 40px; color: red;">Error: ${err.message}</p>`;
        }
     }
    if (closeReceiptBtn) { closeReceiptBtn.addEventListener('click', () => hideModal(viewReceiptModal)); }
    if (viewReceiptModal) { viewReceiptModal.addEventListener('click', (e) => { if (e.target === viewReceiptModal) hideModal(viewReceiptModal); }); }

<<<<<<< HEAD
    if (closeProfileBtn) {
        closeProfileBtn.addEventListener('click', () => hideModal(viewProfileModal));
    }
     if (viewProfileModal) {
        viewProfileModal.addEventListener('click', (e) => { if (e.target === viewProfileModal) hideModal(viewProfileModal); });
    }
=======
      /* ---------- Table action listeners ---------- */
      tbody.addEventListener('click', (e) => {
        const btn = e.target.closest('button.action-btn');
        if(!btn) return;
        const id = btn.dataset.id;
        if(btn.classList.contains('edit-btn')) openEditModal(id);
        else if(btn.classList.contains('view-btn')) openViewModal(id);
      });
>>>>>>> b145637f981ee697f94ca474e82d261f790433d6

      /* ---------- Search & filter ---------- */
      let searchTimeout;
      searchInput.addEventListener('input', () => { clearTimeout(searchTimeout); searchTimeout = setTimeout(loadUsers, 300); });
      planFilter.addEventListener('change', loadUsers);

<<<<<<< HEAD
        const userId = targetButton.dataset.id;

        if (targetButton.classList.contains('edit-btn')) {
            openEditModal(userId);
        } else if (targetButton.classList.contains('view-btn')) {
            openProfileModal(userId); // Renamed function call
=======
      /* ---------- Keyboard global ---------- */
      document.addEventListener('keydown', (ev) => {
        if(ev.key === 'Escape'){
          if(viewModal && viewModal.classList.contains('show')) hideModal(viewModal);
          if(editModal && editModal.classList.contains('show')) hideModal(editModal);
          if(viewReceiptModal && viewReceiptModal.classList.contains('show')) hideModal(viewReceiptModal);
>>>>>>> b145637f981ee697f94ca474e82d261f790433d6
        }
      });

      /* ---------- Init ---------- */
      document.addEventListener('DOMContentLoaded', () => {
        initFloatingSelects(document);
      });

<<<<<<< HEAD
    // --- Global Key Listener ---
    document.addEventListener('keydown', (ev) => {
        if (ev.key === 'Escape') {
            if (editModal && editModal.classList.contains('show')) hideModal(editModal);
            if (viewProfileModal && viewProfileModal.classList.contains('show')) hideModal(viewProfileModal);
        }
    });
=======
      // initial fetch
      loadUsers();
>>>>>>> b145637f981ee697f94ca474e82d261f790433d6

      // Expose a small helper for debugging in console if needed:
      window._subsAdmin = { loadUsers, openEditModal, openViewModal, openReceiptModal };
    })();