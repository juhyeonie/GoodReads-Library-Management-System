// SuperAdmin-Dashboard.js
console.log('SuperAdmin-Dashboard.js loaded');

// Sidebar behavior (omitted for brevity, assume this section is unchanged)
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
  
  function escapeHtml(str) {
    if (str == null) return '';
    return String(str).replace(/[&<>"']/g, s => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[s]));
  }

  async function loadStats() {
    try {
      const response = await fetch('Backend/dash_stats.php'); 
      const json = await response.json();
      
      if (!response.ok || !json.success) {
        throw new Error(json.message || 'Failed to fetch data from server.');
      }

      const stats = json.stats;
      // 📢 NEW: Get activity logs from the server response
      const activity = json.activityLogs; 

      // Update dashboard values
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
          // Item properties match the SELECT query: Timestamp, Description
          const div = document.createElement('div');
          div.className = 'activity-item';
          div.innerHTML = `<div class="activity-time">${escapeHtml(item.Timestamp)}</div><div>${escapeHtml(item.Description)}</div>`;
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
  setInterval(loadStats, 60000);
})();