// File: SubsAdmin-Dashboard.js
// (Converted to use Database + Receipt Modal)

// Sidebar behavior
(function() {
  // ... (sidebar logic remains the same)
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

// --- Dashboard data and functionality (DATABASE CONNECTED) ---
(function() {
  let users = []; 

  const tbody = document.querySelector('#subsTable tbody');
  
  // Edit Modal Elements
  const editModal = document.getElementById('editUserModal');
  const userEmail = document.getElementById('userEmail');
  const userPlan = document.getElementById('userPlan');
  const userId = document.getElementById('userId');
  const confirmBtn = document.getElementById('confirmUserEdit');
  const cancelBtn = document.getElementById('cancelUserEdit');
  const editForm = document.getElementById('editUserForm');

  // --- NEW: Receipt Modal Elements ---
  const viewReceiptModal = document.getElementById('viewReceiptModal');
  const receiptContent = document.getElementById('receiptContent');
  const closeReceiptBtn = document.getElementById('closeReceiptBtn');

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

  function renderTable() {
    tbody.innerHTML = '';
    if (!users || users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No recent subscriptions found.</td></tr>';
      return;
    }
    users.forEach(u => {
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
  
  async function loadDashboardData() {
    try {
      const response = await fetch('Backend/subsadmin_dash_stats.php');
      const json = await response.json();
      
      if (!response.ok || !json.success) {
        throw new Error(json.message || 'Failed to fetch data.');
      }

      const stats = json.stats;
      users = json.recentUsers; 

      document.getElementById('card-free').textContent = stats.free;
      document.getElementById('card-standard').textContent = stats.standard;
      document.getElementById('card-premium').textContent = stats.premium;

      renderTable();

    } catch (err) {
      console.error('Failed to load dashboard data', err);
      document.getElementById('card-free').textContent = '—';
      document.getElementById('card-standard').textContent = '—';
      document.getElementById('card-premium').textContent = '—';
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: red;">Error: ${err.message}</td></tr>`;
    }
  }

  // --- Initial Load ---
  loadDashboardData();

  // --- Modal Functions ---
  function showModal(modal) { if(modal){ modal.classList.add('show'); document.body.classList.add('no-scroll'); }}
  function hideModal(modal) { if(modal){ modal.classList.remove('show'); document.body.classList.remove('no-scroll'); }}

  function showEdit() {
    if (!editModal) return;
    showModal(editModal);
    setTimeout(() => userPlan && userPlan.focus(), 80);
  }

  function hideEdit() {
    if (!editModal) return;
    hideModal(editModal);
  }
  
  // --- NEW: Receipt View Logic ---
  async function openReceiptModal(accountId) {
    if (!viewReceiptModal || !receiptContent) {
        console.error("Receipt modal elements not found in HTML.");
        return;
    }

    receiptContent.innerHTML = `<p style="text-align: center; padding: 40px; color: #888;">Loading receipt...</p>`;
    showModal(viewReceiptModal);

    try {
        const response = await fetch(`Backend/fetch_receipt.php?accountId=${accountId}`);
        const data = await response.json();
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
            </div>
        `;
    } catch (err) {
        console.error("View Receipt Error:", err);
        receiptContent.innerHTML = `<p style="text-align: center; padding: 40px; color: red;">Error: ${err.message}</p>`;
    }
  }

  // --- UPDATED: Click listener for table buttons ---
  document.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.edit-btn');
    if (editBtn) {
      const id = editBtn.dataset.id;
      const user = users.find(u => u.AccountID == id);
      if (!user) return;
      
      if (userId) userId.value = user.AccountID;
      if (userEmail) userEmail.value = user.Email;
      if (userPlan) userPlan.value = user.Plan;
      
      showEdit();
      return;
    }
    
    // --- NEW: Handle View Button ---
    const viewBtn = e.target.closest('.view-btn');
    if (viewBtn) {
      const id = viewBtn.dataset.id;
      openReceiptModal(id);
      return;
    }
  });

  // Confirm edit (Fetch logic remains the same)
  confirmBtn && confirmBtn.addEventListener('click', async (evt) => {
    evt.preventDefault();
    
    const id = userId ? userId.value : null;
    const plan = userPlan ? userPlan.value : '';
    const email = userEmail ? userEmail.value : ''; 
    
    if (!id || !plan) {
      alert('Please select a plan.');
      return; 
    }
    
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'SAVING...';

    try {
      const response = await fetch('Backend/subsadmin_user_update.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: id,
          plan: plan,
          email: email
        })
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to update subscription.');
      }
      
      hideEdit();
      loadDashboardData(); 

    } catch (err) {
      console.error('Update Error:', err);
      alert(`Error: ${err.message}`);
    } finally {
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'CONFIRM';
    }
  });

  // --- Modal close listeners ---
  cancelBtn && cancelBtn.addEventListener('click', (e) => { 
    e.preventDefault(); 
    hideEdit(); 
  });
  editModal && editModal.addEventListener('click', (e) => { 
    if (e.target === editModal) hideEdit(); 
  });
  
  // --- NEW: Receipt modal close listeners ---
  if (closeReceiptBtn) { closeReceiptBtn.addEventListener('click', () => hideModal(viewReceiptModal)); }
  if (viewReceiptModal) { viewReceiptModal.addEventListener('click', (e) => { if (e.target === viewReceiptModal) hideModal(viewReceiptModal); }); }


  // --- UPDATED: Escape key listener ---
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (editModal && editModal.classList.contains('show')) {
        hideEdit();
      }
      // --- NEW ---
      if (viewReceiptModal && viewReceiptModal.classList.contains('show')) {
        hideModal(viewReceiptModal);
      }
    }
  });

  editForm && editForm.addEventListener('submit', (e) => e.preventDefault());
})();