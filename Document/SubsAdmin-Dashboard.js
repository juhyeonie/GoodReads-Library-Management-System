/* ...existing code... */
/* Sidebar behavior adapted to match BookAdmin (mobile overlay + desktop icons-only collapse).
   Kept original data loader and table rendering below. */
document.addEventListener('DOMContentLoaded', () => {
  const SIDEBAR_COLLAPSED_KEY = 'gr_subs_sidebar_collapsed';
  const sidebar = document.getElementById('sidebar');
  const menuToggle = document.getElementById('menuToggle'); // mobile button
  const collapseBtn = document.getElementById('collapseBtn');
  const mainEl = document.getElementById('main');

  const MOBILE_BREAK = 800;
  function isMobile() { return window.innerWidth <= MOBILE_BREAK; }

  function applyLayout() {
    const collapsed = localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';

    if (isMobile()) {
      sidebar.classList.remove('collapsed-desktop');
      sidebar.classList.remove('expanded');
      mainEl.classList.add('full');
      mainEl.classList.remove('collapsed-desktop');
      if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
      if (collapseBtn) collapseBtn.setAttribute('aria-pressed', 'false');
    } else {
      // Desktop
      sidebar.classList.remove('expanded');
      mainEl.classList.remove('full');

      if (collapsed) {
        sidebar.classList.add('collapsed-desktop');
        mainEl.classList.add('collapsed-desktop');
        if (collapseBtn) collapseBtn.setAttribute('aria-pressed', 'true');
      } else {
        sidebar.classList.remove('collapsed-desktop');
        mainEl.classList.remove('collapsed-desktop');
        if (collapseBtn) collapseBtn.setAttribute('aria-pressed', 'false');
      }
      if (menuToggle) menuToggle.setAttribute('aria-expanded', 'true');
    }
  }

  applyLayout();
  window.addEventListener('resize', applyLayout);

  // Mobile menu toggle (overlay)
  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      if (!sidebar.classList.contains('expanded')) {
        sidebar.classList.add('expanded');
        mainEl.classList.remove('full');
        menuToggle.setAttribute('aria-expanded', 'true');
      } else {
        sidebar.classList.remove('expanded');
        mainEl.classList.add('full');
        menuToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Desktop collapse/uncollapse (icons-only)
  if (collapseBtn) {
    collapseBtn.addEventListener('click', () => {
      if (isMobile()) return;
      const nowCollapsed = sidebar.classList.toggle('collapsed-desktop');
      mainEl.classList.toggle('collapsed-desktop', nowCollapsed);
      collapseBtn.setAttribute('aria-pressed', String(nowCollapsed));
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, nowCollapsed ? 'true' : 'false');
    });
  }

  // Close mobile sidebar if clicking outside
  document.addEventListener('click', (e) => {
    if (isMobile() && sidebar.classList.contains('expanded')) {
      if (!sidebar.contains(e.target) && menuToggle && !menuToggle.contains(e.target)) {
        sidebar.classList.remove('expanded');
        mainEl.classList.add('full');
        if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
      }
    }
  });

  // Escape closes mobile overlay
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isMobile() && sidebar.classList.contains('expanded')) {
      sidebar.classList.remove('expanded');
      mainEl.classList.add('full');
      if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
    }
  });

  /* ---------- DATA LOADER (existing) ---------- */
  async function loadData() {
    try {
      // demo data — replace with fetch('/api/subscriptions')
      const data = {
        cards: { totalActive: 124, topPlan: 'Pro', expired: 6 },
        rows: [
          { receipt:'1000', email:'jane@example.com', plan:'Pro', amount:'$50', date:'2025-10-01', status:'Active' },
          { receipt:'1001', email:'tom@example.com', plan:'Basic', amount:'$0', date:'2025-09-28', status:'Expired' },
          { receipt:'1002', email:'ana@example.com', plan:'Pro', amount:'$50', date:'2025-09-27', status:'Active' }
        ]
      };

      // cards
      const totalEl = document.getElementById('card-total');
      const topEl = document.getElementById('card-top');
      const expiredEl = document.getElementById('card-expired');
      if (totalEl) totalEl.textContent = data.cards.totalActive;
      if (topEl) topEl.textContent = data.cards.topPlan;
      if (expiredEl) expiredEl.textContent = data.cards.expired;

      // table
      const tbody = document.querySelector('#subsTable tbody');
      if (!tbody) return;
      tbody.innerHTML = '';
      data.rows.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${r.receipt}</td>
          <td>${r.email}</td>
          <td>${r.plan}</td>
          <td>${r.amount}</td>
          <td>${r.date}</td>
          <td>${r.status}</td>
          <td></td>
        `;
        const actionsTd = tr.querySelector('td:last-child');
        const viewBtn = document.createElement('button');
        viewBtn.textContent = 'View';
        viewBtn.className = 'view-btn';
        viewBtn.addEventListener('click', () => console.log('View', r.receipt));
        actionsTd.appendChild(viewBtn);
        tbody.appendChild(tr);
      });
    } catch (err) {
      console.error('loadData error', err);
    }
  }

  loadData();
});
/* ...existing code... */