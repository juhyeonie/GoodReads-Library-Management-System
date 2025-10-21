/* BookAdmin-Dashboard.js
   - Handles sidebar toggle (mobile) and desktop collapsed-icons-only toggle
   - Sets chart sizes so pie chart doesn't grow too large
*/

(function () {
  const sid = document.getElementById('sidebar');
  const menuToggle = document.getElementById('menuToggle');
  const mainContent = document.getElementById('mainContent');
  const collapseBtn = document.getElementById('collapseBtn');

  const DESKTOP_BREAK = 800; // width threshold where "desktop" behaviors apply
  const COLLAPSED_KEY = 'gr_sidebar_collapsed';

  // Helper: is mobile sized
  function isMobileWidth() { return window.innerWidth <= DESKTOP_BREAK; }

  // Apply initial layout and restore collapsed-desktop from localStorage
  function applyInitialLayout() {
    const collapsed = localStorage.getItem(COLLAPSED_KEY) === 'true';

    if (isMobileWidth()) {
      // Mobile: ensure sidebar is hidden by default
      sid.classList.remove('collapsed-desktop');
      sid.classList.remove('expanded');
      mainContent.classList.add('full');
      mainContent.classList.remove('collapsed-desktop');
      menuToggle.setAttribute('aria-expanded', 'false');
      collapseBtn.setAttribute('aria-pressed', 'false');
    } else {
      // Desktop: sidebar visible and can be collapsed to icons-only
      sid.classList.remove('expanded'); // not mobile expanded
      mainContent.classList.remove('full');

      if (collapsed) {
        sid.classList.add('collapsed-desktop');
        mainContent.classList.add('collapsed-desktop');
        collapseBtn.setAttribute('aria-pressed', 'true');
      } else {
        sid.classList.remove('collapsed-desktop');
        mainContent.classList.remove('collapsed-desktop');
        collapseBtn.setAttribute('aria-pressed', 'false');
      }

      menuToggle.setAttribute('aria-expanded', 'true');
    }
  }

  applyInitialLayout();
  window.addEventListener('resize', applyInitialLayout);

  // Mobile toggle: show/hide sidebar overlay
  menuToggle.addEventListener('click', (e) => {
    const isExpanded = sid.classList.contains('expanded');
    if (isExpanded) {
      sid.classList.remove('expanded');
      mainContent.classList.add('full');
      menuToggle.setAttribute('aria-expanded', 'false');
    } else {
      sid.classList.add('expanded');
      mainContent.classList.remove('full');
      menuToggle.setAttribute('aria-expanded', 'true');
    }
  });

  // Desktop collapse toggle (icons-only)
  collapseBtn.addEventListener('click', () => {
    // Only allow desktop collapse when not mobile
    if (isMobileWidth()) return;

    const nowCollapsed = sid.classList.toggle('collapsed-desktop');
    mainContent.classList.toggle('collapsed-desktop', nowCollapsed);
    collapseBtn.setAttribute('aria-pressed', String(nowCollapsed));
    localStorage.setItem(COLLAPSED_KEY, nowCollapsed ? 'true' : 'false');
  });

  // Close mobile sidebar when clicking outside
  document.addEventListener('click', (e) => {
    if (isMobileWidth()) {
      if (!sid.contains(e.target) && !menuToggle.contains(e.target) && sid.classList.contains('expanded')) {
        sid.classList.remove('expanded');
        mainContent.classList.add('full');
        menuToggle.setAttribute('aria-expanded', 'false');
      }
    }
  });

  // --- Charts initialization (uses Chart.js if present) ---
  function initCharts(categories = [], counts = []) {
    // Ensure containers have a controlled height for pie
    const pieContainer = document.querySelector('.chart-card.small-chart .chart-wrap');
    if (pieContainer) {
      // CSS max-height controls it; ensure explicit pixel height fallback for Chart
      pieContainer.style.maxHeight = pieContainer.style.maxHeight || '200px';
      pieContainer.style.height = pieContainer.style.height || pieContainer.style.maxHeight;
    }

    // Bar chart
    const bar = document.getElementById('barChart');
    if (bar && window.Chart) {
      // ensure parent has height for maintainAspectRatio:false
      const parent = bar.parentElement;
      if (parent && !parent.style.height) parent.style.height = parent.style.maxHeight || '160px';

      new Chart(bar.getContext('2d'), {
        type: 'bar',
        data: { labels: categories, datasets: [{ label: 'Books per Category', data: counts, backgroundColor: ['#5A7FFB','#86A8E7','#91EAE4'] }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
      });
    }

    // Pie chart
    const pie = document.getElementById('pieChart');
    if (pie && window.Chart) {
      // ensure parent has height for maintainAspectRatio:false
      const parent = pie.parentElement;
      if (parent && !parent.style.height) parent.style.height = parent.style.maxHeight || '180px';

      new Chart(pie.getContext('2d'), {
        type: 'pie',
        data: { labels: categories, datasets: [{ data: counts, backgroundColor: ['#5A7FFB','#86A8E7','#91EAE4'] }] },
        options: { responsive: true, maintainAspectRatio: false }
      });
    }
  }

  // --- Data loading: replace with your DB calls ---
  async function loadData() {
    try {
      // Example placeholder data
      const data = {
        totalBooks: 22,
        categories: ['Educational', 'Novel', 'Graphic Novel'],
        counts: [12, 8, 2],
        recent: [
          { id: '1000', name: '', author: '', category: '' },
          { id: '1001', name: '', author: '', category: '' },
          { id: '1002', name: '', author: '', category: '' },
        ]
      };

      document.getElementById('total-books').textContent = data.totalBooks;
      initCharts(data.categories, data.counts);

      const tbody = document.querySelector('#books-table tbody');
      tbody.innerHTML = '';
      data.recent.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${row.id || ''}</td>
                        <td>${row.name || ''}</td>
                        <td>${row.author || ''}</td>
                        <td>${row.category || ''}</td>
                        <td></td>`;
        const tdActions = tr.querySelector('td:last-child');
        const editBtn = document.createElement('button'); editBtn.className = 'edit'; editBtn.textContent = 'Edit';
        const delBtn = document.createElement('button'); delBtn.className = 'delete'; delBtn.textContent = 'Delete';
        editBtn.addEventListener('click', () => console.log('Edit', row.id));
        delBtn.addEventListener('click', () => console.log('Delete', row.id));
        tdActions.appendChild(editBtn);
        tdActions.appendChild(delBtn);
        tbody.appendChild(tr);
      });

    } catch (err) {
      console.error('Failed to load dashboard data', err);
    }
  }

  document.addEventListener('DOMContentLoaded', loadData);
})();
