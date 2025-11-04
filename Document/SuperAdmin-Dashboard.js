// Sidebar behavior
console.log('SuperAdmin-Dashboard.js loaded');

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

/* ===== Dashboard modal & table logic (DATABASE CONNECTED) ===== */

(function(){
  // This will hold the actual data from the database
  let DATA = {
    "free-plan": {
      title: "Customers Subscribed to Basic Plan",
      columns: ["ID No.", "Email", "Payment Method", "Plan Status"],
      rows: []
    },
    "standard-plan": {
      title: "Customers Subscribed to Standard Plan",
      columns: ["ID No.", "Email", "Payment Method", "Plan Status"],
      rows: []
    },
    "premium-plan": {
      title: "Customers Subscribed to Premium Plan",
      columns: ["ID No.", "Email", "Payment Method", "Plan Status"],
      rows: []
    },
    "user-admin": {
      title: "User Admin List",
      columns: ["ID No.", "Email", "Role"],
      rows: []
    },
    "subscription-admin": {
      title: "Subscription Admin List",
      columns: ["ID No.", "Email", "Role"],
      rows: []
    },
    "total-admins": {
      title: "Total Number of Admins",
      columns: ["ID No.", "Email", "Role"],
      rows: []
    },
    "total-customers": {
      title: "Total Number of Customers",
      columns: ["ID No.", "Email", "Plan", "Payment Method", "Plan Status"],
      rows: []
    },
    "total-books": {
      title: "Books Feature (Coming Soon)",
      columns: ["Info"],
      rows: [["Books feature will be added in the future"]]
    }
  };

  const modalOverlay = document.getElementById('modalOverlay');
  const modalContainer = document.querySelector('.modal-container');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');
  const modalClose = document.getElementById('modalClose');

  // utility: escape
  function escapeHtml(str){
    if(str == null) return '';
    return String(str)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#39;');
  }

  // Create table HTML from provided data
  function buildTableHTML(dataset){
    if(!dataset || !dataset.columns || dataset.columns.length === 0){
      return `<div style="padding:24px; text-align:center; color:#888;">No data available</div>`;
    }

    const cols = dataset.columns.map(c => `<th>${escapeHtml(c)}</th>`).join('');
    const rowsHtml = (dataset.rows || []).map(r => {
      const cells = r.map(cell => `<td>${escapeHtml(cell)}</td>`).join('');
      return `<tr>${cells}</tr>`;
    }).join('');

    return `
      <div class="modal-table-wrapper" role="region" aria-label="${escapeHtml(dataset.title)} table">
        <table class="modal-table" cellspacing="0" cellpadding="0">
          <thead><tr>${cols}</tr></thead>
          <tbody>${rowsHtml || `<tr><td colspan="${dataset.columns.length}" style="text-align:center; padding:18px;">No records found</td></tr>`}</tbody>
        </table>
      </div>
    `;
  }

  function openModalFor(key){
    const dataset = DATA[key];
    if(!dataset){
      modalTitle.textContent = 'Details';
      modalBody.innerHTML = `<div style="padding:24px; text-align:center; color:#888;">No data.</div>`;
    } else {
      modalTitle.textContent = dataset.title || 'Details';
      modalBody.innerHTML = buildTableHTML(dataset);
    }
    modalOverlay.classList.add('active');
    document.body.classList.add('no-scroll');
    modalOverlay.setAttribute('aria-hidden','false');
    modalClose.focus();
  }

  function closeModal(){
    modalOverlay.classList.remove('active');
    document.body.classList.remove('no-scroll');
    modalOverlay.setAttribute('aria-hidden','true');
  }

  // NEW: Load dashboard data from database
  async function loadDashboardData() {
    try {
      const response = await fetch('Backend/dash_stats.php');
      const json = await response.json();
      
      if (!response.ok || !json.success) {
        throw new Error(json.message || 'Failed to fetch dashboard data.');
      }

      const stats = json.stats;
      const customers = json.customers || [];
      const admins = json.admins || [];

      // Update stat card values
      document.getElementById('value-free-plan').textContent = stats.free_plan || 0;
      document.getElementById('value-standard-plan').textContent = stats.standard_plan || 0;
      document.getElementById('value-premium-plan').textContent = stats.premium_plan || 0;
      document.getElementById('value-total-admins').textContent = stats.total_admins || 0;
      document.getElementById('value-total-customers').textContent = stats.total_customers || 0;
      document.getElementById('value-total-books').textContent = stats.total_books || 0;

      // Count specific admin types
      const userAdmins = admins.filter(a => a.Role === 'UserAdmin').length;
      const subsAdmins = admins.filter(a => a.Role === 'SubsAdmin').length;
      
      document.getElementById('value-user-admin').textContent = userAdmins;
      document.getElementById('value-subscription-admin').textContent = subsAdmins;

      // Populate DATA object with actual database records
      
      // Basic Plan customers
      DATA['free-plan'].rows = customers
        .filter(c => c.Plan === 'Basic Plan')
        .map(c => [c.AccountID, c.Email, c.Payment_Method || 'N/A', c.Plan_Status || 'Active']);

      // Standard Plan customers
      DATA['standard-plan'].rows = customers
        .filter(c => c.Plan === 'Standard Plan')
        .map(c => [c.AccountID, c.Email, c.Payment_Method || 'N/A', c.Plan_Status || 'Active']);

      // Premium Plan customers
      DATA['premium-plan'].rows = customers
        .filter(c => c.Plan === 'Premium Plan')
        .map(c => [c.AccountID, c.Email, c.Payment_Method || 'N/A', c.Plan_Status || 'Active']);

      // User Admins
      DATA['user-admin'].rows = admins
        .filter(a => a.Role === 'UserAdmin')
        .map(a => [a.AccountID, a.Email, a.Role]);

      // Subscription Admins
      DATA['subscription-admin'].rows = admins
        .filter(a => a.Role === 'SubsAdmin')
        .map(a => [a.AccountID, a.Email, a.Role]);

      // All Admins
      DATA['total-admins'].rows = admins
        .map(a => [a.AccountID, a.Email, a.Role]);

      // All Customers
      DATA['total-customers'].rows = customers
        .map(c => [c.AccountID, c.Email, c.Plan, c.Payment_Method || 'N/A', c.Plan_Status || 'Active']);

      console.log('Dashboard data loaded successfully');

    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      // Set error state on all cards
      document.getElementById('value-free-plan').textContent = '—';
      document.getElementById('value-standard-plan').textContent = '—';
      document.getElementById('value-premium-plan').textContent = '—';
      document.getElementById('value-user-admin').textContent = '—';
      document.getElementById('value-subscription-admin').textContent = '—';
      document.getElementById('value-total-admins').textContent = '—';
      document.getElementById('value-total-customers').textContent = '—';
      document.getElementById('value-total-books').textContent = '—';
      
      alert('Error loading dashboard data: ' + err.message);
    }
  }

  // Load data on page load
  loadDashboardData();

  // Open modal when a card is clicked
  document.querySelectorAll('.stat-card').forEach(card=>{
    card.addEventListener('click', function(){
      const key = this.getAttribute('data-card');
      openModalFor(key);
    });
  });

  // Close events
  modalClose.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay.classList.contains('active')) closeModal();
  });

  // Accessibility: trap focus inside modal when open
  document.addEventListener('focus', function(event){
    if(!modalOverlay.classList.contains('active')) return;
    if(!modalContainer.contains(event.target)){
      event.stopPropagation();
      modalClose.focus();
    }
  }, true);

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