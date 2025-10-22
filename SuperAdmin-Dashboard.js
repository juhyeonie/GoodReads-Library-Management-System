// Basic sidebar behavior copied from your reference so the sidebar behaves same
document.addEventListener('DOMContentLoaded', () => {
  const SIDEBAR_COLLAPSED_KEY = 'gr_sidebar_collapsed';
  const MOBILE_BREAK = 800;

  const sidebar = document.getElementById('sidebar');
  const menuToggle = document.getElementById('menuToggle');
  const collapseBtn = document.getElementById('collapseBtn');
  const mainContent = document.getElementById('mainContent');

  function isMobile() { return window.innerWidth <= MOBILE_BREAK; }

  function applyLayout() {
    const collapsed = localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
    if (!sidebar || !mainContent) return;

    if (isMobile()) {
      sidebar.classList.remove('collapsed-desktop');
      sidebar.classList.remove('expanded');
      mainContent.classList.add('full');
      mainContent.classList.remove('collapsed-desktop');
      if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
      if (collapseBtn) collapseBtn.setAttribute('aria-pressed', 'false');
      document.body.classList.remove('no-scroll');
    } else {
      sidebar.classList.remove('expanded');
      mainContent.classList.remove('full');

      if (collapsed) {
        sidebar.classList.add('collapsed-desktop');
        mainContent.classList.add('collapsed-desktop');
        if (collapseBtn) collapseBtn.setAttribute('aria-pressed', 'true');
      } else {
        sidebar.classList.remove('collapsed-desktop');
        mainContent.classList.remove('collapsed-desktop');
        if (collapseBtn) collapseBtn.setAttribute('aria-pressed', 'false');
      }
      if (menuToggle) menuToggle.setAttribute('aria-expanded', 'true');
      document.body.classList.remove('no-scroll');
    }
  }

  applyLayout();
  window.addEventListener('resize', applyLayout);

  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => {
      if (!sidebar.classList.contains('expanded')) {
        sidebar.classList.add('expanded');
        document.body.classList.add('no-scroll');
        if (mainContent) mainContent.classList.remove('full');
        menuToggle.setAttribute('aria-expanded', 'true');
      } else {
        sidebar.classList.remove('expanded');
        document.body.classList.remove('no-scroll');
        if (mainContent) mainContent.classList.add('full');
        menuToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  if (collapseBtn && sidebar && mainContent) {
    collapseBtn.addEventListener('click', () => {
      if (isMobile()) return;
      const nowCollapsed = sidebar.classList.toggle('collapsed-desktop');
      mainContent.classList.toggle('collapsed-desktop', nowCollapsed);
      collapseBtn.setAttribute('aria-pressed', String(nowCollapsed));
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, nowCollapsed ? 'true' : 'false');
    });
  }

  // Close mobile sidebar clicking outside
  document.addEventListener('click', (e) => {
    if (isMobile() && sidebar && sidebar.classList.contains('expanded')) {
      if (!sidebar.contains(e.target) && menuToggle && !menuToggle.contains(e.target)) {
        sidebar.classList.remove('expanded');
        document.body.classList.remove('no-scroll');
        if (mainContent) mainContent.classList.add('full');
        if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
      }
    }
  });

  // ESC to close mobile menu
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isMobile() && sidebar && sidebar.classList.contains('expanded')) {
      sidebar.classList.remove('expanded');
      document.body.classList.remove('no-scroll');
      if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
    }
  });

  /* ---------- Stats loader ---------- */
  // Replace this with your DB / API requests. Example format below shows how to inject values.
  async function loadStats() {
    try {
      // Example: make an actual fetch to your API:
      // const res = await fetch('/api/dashboard-stats');
      // const data = await res.json();
      // For demo we'll use static values:
      const data = {
        totalUsers: 1248,
        activeSubscriptions: 652,
        totalBooks: 8203,
        activity: [
          { t: '2025-10-21 10:12', text: 'Super Admin1 created admin Admin2' },
          { t: '2025-10-21 09:43', text: 'Subscription Admin approved subscription for user 1003' },
          { t: '2025-10-20 18:02', text: 'Book Admin added "Advanced Physics"' }
        ]
      };

      // Populate cards
      document.getElementById('value-total-users').textContent = data.totalUsers ?? '—';
      document.getElementById('value-active-subscriptions').textContent = data.activeSubscriptions ?? '—';
      document.getElementById('value-total-books').textContent = data.totalBooks ?? '—';

      // Populate activity list
      const activityList = document.getElementById('activityList');
      activityList.innerHTML = '';
      if (data.activity && data.activity.length) {
        data.activity.forEach(item => {
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
      // show placeholders
      document.getElementById('value-total-users').textContent = '—';
      document.getElementById('value-active-subscriptions').textContent = '—';
      document.getElementById('value-total-books').textContent = '—';
      document.getElementById('activityList').innerHTML = '<div class="empty-note">Unable to load activity</div>';
    }
  }

  // small helper
  function escapeHtml(str) {
    if (str == null) return '';
    return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
  }

  // Kick off initial load (and refresh every 60s)
  loadStats();
  setInterval(loadStats, 60_000);
});
