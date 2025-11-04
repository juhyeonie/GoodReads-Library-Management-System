// --- SESSION CHECK (GATEKEEPER) ---
(function() {
  const userRole = sessionStorage.getItem('user_role');
  
  // 1. This page is for "subsadmin" (lowercase)
  const expectedRole = 'subsadmin'; // <-- MODIFIED
  
  // 2. Check if the user is logged out OR has the wrong role
  if (!userRole || userRole !== expectedRole) {
      sessionStorage.clear(); // Clear all stale data
      alert('You do not have permission to view this page or your session has expired. Please log in.');
      window.location.replace('StartPage.html');
  }
})();
// --- END OF SESSION CHECK ---


// File: SubsAdmin-Dashboard.js
// Fetches from 'subsadmin_dash_stats.php' and populates '#subsTable'.

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

// Dashboard data and functionality (DATABASE CONNECTED)
(function() {
  let users = []; 

  const tbody = document.querySelector('#subsTable tbody');
  
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
          // Format as "Nov 4, 2025"
          return date.toLocaleDateString('en-US', { 
              year: 'numeric', month: 'short', day: 'numeric'
          });
      } catch (e) {
          return dateString;
      }
  }

  function renderTable() {
    if (!tbody) {
        console.error("Critical Error: tbody '#subsTable tbody' not found!");
        return;
    }

    tbody.innerHTML = '';
    // The 'users' array is now the 'recentUsers' from PHP,
    // which is already filtered to Standard/Premium and limited to 10.
    if (!users || users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No recent paid subscriptions found.</td></tr>';
      return;
    }
    
    users.forEach(u => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escapeHtml(u.AccountID)}</td>
        <td>${escapeHtml(u.Email)}</td>
        <td>${escapeHtml(formatPlan(u.Plan))}</td>
        <td>${escapeHtml(formatPaymentMethod(u.Payment_Method))}</td>
        <td style="text-align:right">${escapeHtml(formatDate(u.SubsStarted))}</td>
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
      users = json.recentUsers; // This is the filtered list

      // This dashboard only uses 3 stats
      document.getElementById('card-free').textContent = stats.free;
      document.getElementById('card-standard').textContent = stats.standard;
      document.getElementById('card-premium').textContent = stats.premium;

      renderTable(); // Renders the filtered list

    } catch (err) {
      console.error('Failed to load dashboard data', err);
      document.getElementById('card-free').textContent = '—';
      document.getElementById('card-standard').textContent = '—';
      document.getElementById('card-premium').textContent = '—';
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: red;">Error: ${err.message}</td></tr>`;
      }
    }
  }

  // Initial Load
  loadDashboardData();
  
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