// SuperAdmin-Dashboard.js
console.log('SuperAdmin-Dashboard.js loaded');

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

// Dashboard Stats (Updated to fetch from DB)
(function() {
  
  // Removed hardcoded demo data arrays (demoCustomers, demoAdmins, demoBooks).

  function escapeHtml(str) {
    if (str == null) return '';
    return String(str).replace(/[&<>"']/g, s => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[s]));
  }

  async function loadStats() {
    try {
      // Fetch statistics from the new PHP endpoint
      const response = await fetch('Backend/dash_stats.php');
      const json = await response.json();
      
      if (!response.ok || !json.success) {
        throw new Error(json.message || 'Failed to fetch data from server.');
      }

      const stats = json.stats;

      // Temporary hardcoded activity log (as requested)
      const activity = [
        { t: '2025-10-21 10:12', text: 'Super Admin1 created admin Admin2' },
        { t: '2025-10-21 09:43', text: 'Subscription Admin approved subscription for user 1003' },
        { t: '2025-10-20 18:02', text: 'Book Admin added "Advanced Physics"' },
        { t: '2025-10-20 15:30', text: 'User Admin updated customer profile for user 1005' },
        { t: '2025-10-20 14:15', text: 'Book Admin removed outdated book "Old Edition"' },
        { t: '2025-10-19 16:45', text: 'Super Admin modified system settings' }
      ];

      // Update dashboard values using fetched data
      document.getElementById('value-free-plan').textContent = stats.free_plan;
      document.getElementById('value-standard-plan').textContent = stats.standard_plan;
      document.getElementById('value-premium-plan').textContent = stats.premium_plan;
      document.getElementById('value-total-admins').textContent = stats.total_admins;
      document.getElementById('value-total-customers').textContent = stats.total_customers;
      document.getElementById('value-total-books').textContent = stats.total_books;


      // Handle activity log display
      const activityList = document.getElementById('activityList');
      activityList.innerHTML = '';
      if (activity && activity.length) {
        activity.forEach(item => {
          const div = document.createElement('div');
          div.className = 'activity-item';
          div.innerHTML = `<div class="activity-time">${escapeHtml(item.t)}</div><div>${escapeHtml(item.text)}</div>`;
          activityList.appendChild(div);
        });
      } else {
        activityList.innerHTML = '<div class="empty-note">No activity yet</div>';
      }

    } catch (err) {
      console.error('Failed to load dashboard stats', err);
      // Fallback display on error
      document.getElementById('value-free-plan').textContent = '—';
      document.getElementById('value-standard-plan').textContent = '—';
      document.getElementById('value-premium-plan').textContent = '—';
      document.getElementById('value-total-admins').textContent = '—';
      document.getElementById('value-total-customers').textContent = '—';
      document.getElementById('value-total-books').textContent = '—';
      document.getElementById('activityList').innerHTML = '<div class="empty-note">Unable to load activity</div>';
    }
  }

  loadStats();
  // Fetch stats every 60 seconds
  setInterval(loadStats, 60000);
})();