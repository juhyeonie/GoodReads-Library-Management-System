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

    // Dashboard Stats
    (function() {
      const demoCustomers = [
        { receipt: '1007', email: 'user8@example.com', plan: 'cancelled', payment: 'credit_card', password: 'pass8' },
        { receipt: '1006', email: 'user7@example.com', plan: 'free', payment: 'maya', password: 'pass7' },
        { receipt: '1005', email: 'user6@example.com', plan: 'premium', payment: 'gcash', password: 'pass6' },
        { receipt: '1004', email: 'user5@example.com', plan: 'standard', payment: 'credit_card', password: 'pass5' },
        { receipt: '1003', email: 'john.smith@example.com', plan: 'expired', payment: 'paypal', password: 'pass4' },
        { receipt: '1002', email: 'jane.doe@example.com', plan: 'free', payment: 'paypal', password: 'pass3' },
        { receipt: '1001', email: 'bob@example.com', plan: 'premium', payment: 'maya', password: 'pass2' },
        { receipt: '1000', email: 'alice@example.com', plan: 'standard', payment: 'gcash', password: 'pass1' }
      ];

      const demoAdmins = [
        { id: 'a1', name: 'Super Admin' },
        { id: 'a2', name: 'Admin2' }
      ];

      const demoBooks = [
        { id: 'b1', title: 'Book One' },
        { id: 'b2', title: 'Book Two' },
        { id: 'b3', title: 'Book Three' },
        { id: 'b4', title: 'Book Four' }
      ];

      let customers = demoCustomers.slice();

      function escapeHtml(str) {
        if (str == null) return '';
        return String(str).replace(/[&<>"']/g, s => ({
          '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[s]));
      }

      async function loadStats() {
        try {
          const counts = customers.reduce((acc, c) => {
            const p = (c.plan || '').toLowerCase();
            if (!acc[p]) acc[p] = 0;
            acc[p]++;
            return acc;
          }, {});

          const freeCount = counts['free'] || 0;
          const standardCount = counts['standard'] || 0;
          const premiumCount = counts['premium'] || 0;
          const totalAdmins = demoAdmins.length;
          const totalCustomers = customers.length;
          const totalBooks = demoBooks.length;

          document.getElementById('value-free-plan').textContent = freeCount;
          document.getElementById('value-standard-plan').textContent = standardCount;
          document.getElementById('value-premium-plan').textContent = premiumCount;
          document.getElementById('value-total-admins').textContent = totalAdmins;
          document.getElementById('value-total-customers').textContent = totalCustomers;
          document.getElementById('value-total-books').textContent = totalBooks;

          const activity = [
            { t: '2025-10-21 10:12', text: 'Super Admin1 created admin Admin2' },
            { t: '2025-10-21 09:43', text: 'Subscription Admin approved subscription for user 1003' },
            { t: '2025-10-20 18:02', text: 'Book Admin added "Advanced Physics"' },
            { t: '2025-10-20 15:30', text: 'User Admin updated customer profile for user 1005' },
            { t: '2025-10-20 14:15', text: 'Book Admin removed outdated book "Old Edition"' },
            { t: '2025-10-19 16:45', text: 'Super Admin modified system settings' }
          ];

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