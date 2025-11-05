(function () {
  const COLLAPSED_KEY = 'sidebar_collapsed';
  const MOBILE_BREAKPOINT = 768;

  const sidebar = document.getElementById('sidebar');
  const menuToggle = document.getElementById('menuToggle');
  const collapseBtn = document.getElementById('collapseBtn');
  const mainContent = document.getElementById('mainContent');
  const overlay = document.getElementById('sidebarOverlay');

  function isMobile() { return window.innerWidth <= MOBILE_BREAKPOINT; }

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
      collapseBtn.setAttribute('aria-pressed', String(isCollapsed));
      localStorage.setItem(COLLAPSED_KEY, isCollapsed);
    });
  }
  if (menuToggle) menuToggle.addEventListener('click', (e) => { e.stopPropagation(); sidebar.classList.toggle('mobile-open'); overlay.classList.toggle('active'); });
  if (overlay) overlay.addEventListener('click', () => { sidebar.classList.remove('mobile-open'); overlay.classList.remove('active'); });

  const menuLinks = sidebar.querySelectorAll('.menu-item');
  menuLinks.forEach(link => link.addEventListener('click', () => { if (isMobile()) { sidebar.classList.remove('mobile-open'); overlay.classList.remove('active'); } }));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && isMobile() && sidebar.classList.contains('mobile-open')) { sidebar.classList.remove('mobile-open'); overlay.classList.remove('active'); } });

  /* ---------------- Data / API ---------------- */
  // Uses the same backend as SubsAdmin
  const API_ROOT = 'Backend/subsadmin_dash_stats.php';
  let customers = []; // This will hold the 'recentUsers'

  const tbody = document.querySelector('#customersTable tbody');

  function escapeHtml(str) {
    if (str == null) return '';
    return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
  }

  function formatPaymentMethod(method) {
    const methods = { 'credit_card': 'Credit Card', 'gcash': 'GCash', 'maya': 'Maya', 'paypal': 'PayPal' };
    return methods[method] || method || '';
  }

  function formatPlan(plan) {
    if (!plan) return '';
    const p = String(plan).toLowerCase().trim();
    if (p === 'admin' || p === 'administrator') return ''; // hide admin
    return p.replace(/\bplan\b/i, '').replace(/[_-]+/g,' ').trim().replace(/\b\w/g, c => c.toUpperCase());
  }

  function formatDate(dateString) {
      if (!dateString) return 'N/A';
      try {
          const date = new Date(dateString.replace(' ', 'T')); 
          if (isNaN(date)) return dateString;
          return date.toLocaleDateString('en-US', { 
              year: 'numeric', month: 'short', day: 'numeric'
          });
      } catch (e) {
          return dateString;
      }
  }

  // MODIFIED: This function now targets your original card IDs
  function updateStats(stats) {
    if (!stats) return;
    document.getElementById('freeCount').textContent = stats.free;
    document.getElementById('standardCount').textContent = stats.standard;
    document.getElementById('premiumCount').textContent = stats.premium;
    // "expired" and "cancelled" lines are removed
  }

  function renderTable() {
    if (!tbody) {
        console.error("Critical Error: tbody '#customersTable tbody' not found!");
        return;
    }
    tbody.innerHTML = '';
    
    // The 'customers' array is the 'recentUsers' from PHP
    if (!customers || customers.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No recent paid subscriptions found.</td></tr>';
      return;
    }

    // Show only 5 most recent on dashboard
    customers.slice(0, 5).forEach(u => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escapeHtml(u.AccountID)}</td>
        <td>${escapeHtml(u.Email)}</td>
        <td>
  <span class="plan-badge ${
    escapeHtml(
      u.Plan
        ?.toLowerCase()
        .replace(/\bplan\b/g, '')      // remove the word "plan"
        .replace(/[_\s-]+/g, '')       // remove spaces, underscores, hyphens
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
        <td style="text-align:right">${escapeHtml(formatDate(u.SubsStarted))}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  async function loadCustomersFromServer() {
    try {
      const res = await fetch(API_ROOT, { method: 'GET' });
      if (!res.ok) throw new Error('Network response not ok: ' + res.status);
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to load data from server.');
      }

      customers = data.recentUsers; // This is the filtered list
      updateStats(data.stats); // Update the 3 stat cards
      renderTable(); // Render the filtered table

    } catch (err) {
      console.error('Failed to load customers', err);
      if (tbody) {
          tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: red;">Error: ${err.message}</td></tr>`;
      }
      // MODIFIED: Error stats match the 3-card layout
      const stats = { free: '—', standard: '—', premium: '—' };
      updateStats(stats);
    }
  }

  // initial load
  loadCustomersFromServer();

  // Listen for updates dispatched by UserAdmin-User.js
  window.addEventListener('customers-updated', () => {
    loadCustomersFromServer();
  });

  // Expose for debugging
  window.loadCustomersFromServer = loadCustomersFromServer;

})();

// --- ADDED: LOGOUT SCRIPT (Standardized) ---
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
