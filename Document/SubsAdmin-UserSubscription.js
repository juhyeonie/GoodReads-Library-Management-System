// --- SESSION CHECK (GATEKEEPER) ---
(function() {
  const userRole = sessionStorage.getItem('user_role');
  const expectedRole = 'subsadmin'; // <-- MODIFIED
  
  if (!userRole || userRole !== expectedRole) {
      sessionStorage.clear();
      alert('You do not have permission to view this page or your session has expired. Please log in.');
      window.location.replace('StartPage.html');
  }
})();
// --- END OF SESSION CHECK ---

console.log('SubsAdmin-UserSubscription.js loaded');

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
      let currentViewAccountId = null; // Store the ID for the receipt button

      const tbody = document.querySelector('#usersTable tbody');
      const searchInput = document.getElementById('userSearch');
      const planFilter = document.getElementById('planFilter');

      // Edit modal elements
      const editModal = document.getElementById('editModal');
      const editForm = document.getElementById('editForm');
      const editEmail = document.getElementById('editEmail');
      const editPlan = document.getElementById('editPlan');
      const editPayment = document.getElementById('editPayment');
      const editUserId = document.getElementById('editUserId');
      const confirmEdit = document.getElementById('confirmEdit');
      const cancelEdit = document.getElementById('cancelEdit');

      // Profile Modal Elements (from SuperAdmin)
      const viewProfileModal = document.getElementById('viewProfileModal');
      const profileContent = document.getElementById('profileContent');
      const viewReceiptBtn = document.getElementById('viewReceiptBtn'); // Button inside profile modal
      const closeProfileBtn = document.getElementById('closeProfileBtn');

      // Payment Receipt Modal Elements (from SuperAdmin)
      const viewPaymentReceiptModal = document.getElementById('viewPaymentReceiptModal');
      const paymentReceiptContent = document.getElementById('paymentReceiptContent');
      const closePaymentReceiptBtn = document.getElementById('closePaymentReceiptBtn');


      /* Utility Functions */
      function escapeHtml(str) {
        if (str == null) return '';
        return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
      }

      function formatPlan(p){ return p || 'N/A'; }
      function formatPayment(m){ return m || 'N/A'; }

      function showModal(modal){ if(!modal) return; modal.classList.add('show'); modal.style.display = 'flex'; document.body.classList.add('no-scroll'); modal.setAttribute('aria-hidden','false'); }
      function hideModal(modal){ if(!modal) return; modal.classList.remove('show'); modal.style.display = ''; document.body.classList.remove('no-scroll'); modal.setAttribute('aria-hidden','true'); }

      // Date formatting function (from SuperAdmin)
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
      
      // Receipt Date formatting function (from SuperAdmin)
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

      /* Floating selects: ensure label floats if select has value */
      function initFloatingSelects(scope=document){
        scope.querySelectorAll('select, input').forEach(s => {
          if(s.value && s.value !== '') s.classList.add('has-value'); 
          else s.classList.remove('has-value');
          
          s.addEventListener('change', function(){ 
            if(this.value && this.value !== '') this.classList.add('has-value'); 
            else this.classList.remove('has-value'); 
          });
        });
      }
      
      function clearErrors(form) {
          if(!form) return;
          form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
          form.querySelectorAll('.error-message').forEach(el => { 
              el.textContent = ''; 
              el.classList.remove('show'); 
          });
      }

      /* ---------- Data load & render ---------- */
      async function loadUsers() {
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
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${escapeHtml(u.AccountID)}</td>
            <td>${escapeHtml(u.Email)}</td>
            <td>${escapeHtml(formatPlan(u.Plan))}</td>
            <td>${escapeHtml(formatPayment(u.Payment_Method))}</td>
            <td style="text-align:right">
              <button class="action-btn view-btn" data-id="${escapeHtml(u.AccountID)}">View Profile</button>
              <button class="action-btn edit-btn" data-id="${escapeHtml(u.AccountID)}">Edit</button>
            </td>
          `;
          tbody.appendChild(tr);
        });
      }

      /* ---------- Edit modal logic ---------- */
      function openEditModal(accountId) {
        const user = users.find(x => x.AccountID == accountId);
        if(!user) return;
        
        clearErrors(editForm);
        
        editUserId.value = user.AccountID;
        editEmail.value = user.Email || '';
        editPlan.value = user.Plan || '';
        editPayment.value = user.Payment_Method || '';
        
        // Manually trigger floating label check for pre-filled fields
        initFloatingSelects(editForm);
        
        showModal(editModal);
      }

      confirmEdit.addEventListener('click', async (e) => {
        e.preventDefault();
        const accountId = editUserId.value;
        const plan = editPlan.value;
        const payment = editPayment.value;
        const email = editEmail.value;
        
        clearErrors(editForm);
        let isValid = true;
        
        // simple validation
        if(!plan) { 
            editPlan.classList.add('error'); 
            document.getElementById('editPlanError').textContent = 'Plan is required.';
            document.getElementById('editPlanError').classList.add('show');
            isValid = false;
        }
        if(!payment) { 
            editPayment.classList.add('error'); 
            document.getElementById('editPaymentError').textContent = 'Payment method is required.';
            document.getElementById('editPaymentError').classList.add('show');
            isValid = false;
        }
        
        if (!isValid) return;

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
              let msg = 'Validation errors:\n';
              Object.keys(result.errors).forEach(k => { msg += k+': '+result.errors[k]+'\n'; });
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

      /* ---------- Profile Modal Logic (from SuperAdmin) ---------- */
      async function openProfileModal(accountId) {
        if (!viewProfileModal || !profileContent) {
            console.error("Profile modal elements not found in HTML.");
            return;
        }

        profileContent.innerHTML = `<p style="text-align: center; padding: 40px; color: #888;">Loading profile...</p>`;
        showModal(viewProfileModal);
        currentViewAccountId = accountId; // Store ID for "View Receipt" button

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

      if (closeProfileBtn) { closeProfileBtn.addEventListener('click', () => { hideModal(viewProfileModal); currentViewAccountId = null; }); }
      if (viewProfileModal) { viewProfileModal.addEventListener('click', (e) => { if (e.target === viewProfileModal) { hideModal(viewProfileModal); currentViewAccountId = null; } }); }
      
      // Listener for the new button INSIDE the profile modal
      if (viewReceiptBtn) {
          viewReceiptBtn.addEventListener('click', () => {
              if (currentViewAccountId) {
                  openPaymentReceiptModal(currentViewAccountId);
              }
          });
      }

      /* ---------- Payment Receipt Modal Logic (from SuperAdmin) ---------- */
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

      if (closePaymentReceiptBtn) { closePaymentReceiptBtn.addEventListener('click', () => hideModal(viewPaymentReceiptModal)); }
      if (viewPaymentReceiptModal) { viewPaymentReceiptModal.addEventListener('click', (e) => { if (e.target === viewPaymentReceiptModal) hideModal(viewPaymentReceiptModal); }); }


      /* ---------- Table action listeners ---------- */
      tbody.addEventListener('click', (e) => {
        const btn = e.target.closest('button.action-btn');
        if(!btn) return;
        const id = btn.dataset.id;
        if(btn.classList.contains('edit-btn')) {
            openEditModal(id);
        } else if(btn.classList.contains('view-btn')) {
            openProfileModal(id); // CHANGED to open profile modal
        }
      });

      /* ---------- Search & filter ---------- */
      let searchTimeout;
      searchInput.addEventListener('input', () => { clearTimeout(searchTimeout); searchTimeout = setTimeout(loadUsers, 300); });
      planFilter.addEventListener('change', loadUsers);

      /* ---------- Keyboard global ---------- */
      document.addEventListener('keydown', (ev) => {
        if(ev.key === 'Escape'){
          if(editModal && editModal.classList.contains('show')) hideModal(editModal);
          if(viewProfileModal && viewProfileModal.classList.contains('show')) { hideModal(viewProfileModal); currentViewAccountId = null; }
          if(viewPaymentReceiptModal && viewPaymentReceiptModal.classList.contains('show')) hideModal(viewPaymentReceiptModal);
        }
      });

      /* ---------- Init ---------- */
      document.addEventListener('DOMContentLoaded', () => {
        initFloatingSelects(document);
      });

      // initial fetch
      loadUsers();

    })();

// --- ADDED: LOGOUT SCRIPT ---
(function() {
    const logoutButton = document.querySelector('.logout-icon');
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault(); // Stop the link from navigating
            
            // Clear the session "Hall Pass"
            sessionStorage.removeItem('user_role');
            sessionStorage.removeItem('user_plan');
            sessionStorage.clear(); // Clears everything
            
            // Go to the login page
            window.location.href = 'StartPage.html';
        });
    }
})();
// --- END OF LOGOUT SCRIPT ---