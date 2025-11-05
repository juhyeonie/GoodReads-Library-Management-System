/* ===== Sidebar behavior (same logic as SuperAdmin-User/ActivityLog) ===== */
(function() {
  const sidebar = document.getElementById('sidebar');
  const menuToggle = document.getElementById('menuToggle');
  const collapseBtn = document.getElementById('collapseBtn');
  const mainContent = document.getElementById('mainContent');
  const overlay = document.getElementById('sidebarOverlay');

  const COLLAPSED_KEY = 'sidebar_collapsed';
  const MOBILE_BREAKPOINT = 768;

  function isMobile() { return window.innerWidth <= MOBILE_BREAKPOINT; }

  function updateLayout() {
    if (!sidebar || !mainContent) return;
    if (isMobile()) {
      sidebar.classList.remove('collapsed');
      mainContent.classList.remove('collapsed');
      sidebar.classList.remove('mobile-open');
      overlay.classList.remove('active');
      return;
    }
    const isCollapsed = localStorage.getItem(COLLAPSED_KEY) === 'true';
    sidebar.classList.toggle('collapsed', isCollapsed);
    mainContent.classList.toggle('collapsed', isCollapsed);
    sidebar.classList.remove('mobile-open');
    overlay.classList.remove('active');
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

/* ===== Activity Log functionality (table, filter, search, refresh) ===== */
(function() {
  let allLogs = [];
  let filteredLogs = [];
  let currentPage = 1;
  const itemsPerPage = 20;

  function escapeHtml(str) {
    if (str == null) return '';
    return String(str).replace(/[&<>"']/g, s => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[s]));
  }

  function formatTimestamp12Hour(timestamp) {
    try {
      const date = new Date(timestamp);
      if (isNaN(date)) return timestamp;
      
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      
      let hours = date.getHours();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      
      hours = hours % 12;
      hours = hours ? hours : 12; // The hour '0' should be '12'
      
      const hh = String(hours).padStart(2, '0');
      const mm = String(date.getMinutes()).padStart(2, '0');
      const ss = String(date.getSeconds()).padStart(2, '0');
      
      return `${y}-${m}-${d} ${hh}:${mm}:${ss} ${ampm}`;
    } catch (e) {
      return timestamp;
    }
  }

  function renderTable() {
    const tbody = document.getElementById('activityTableBody');
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageData = filteredLogs.slice(start, end);

    if (!tbody) return;

    if (pageData.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="3">
            <div class="empty-state">
              <div class="empty-state-icon">📭</div>
              <div class="empty-state-text">No activity logs found</div>
            </div>
          </td>
        </tr>`;
      document.getElementById('paginationControls').style.display = 'none';
      return;
    }

    // This render function now correctly displays AdminName (as Email)
    // and the Role (as the badge) thanks to the PHP update.
    tbody.innerHTML = pageData.map(log => {
      return `
        <tr>
          <td class="activity-timestamp">${escapeHtml(formatTimestamp12Hour(log.Timestamp || log.timestamp || log.time))}</td>
          <td class="activity-admin">
            ${escapeHtml(log.AdminName || log.admin || 'System')}
            ${log.Role || log.role ? `<span class="admin-badge ${escapeHtml((log.Role || log.role).toLowerCase())}">${escapeHtml(log.Role || log.role)}</span>` : ''}
          </td>
          <td>${escapeHtml(log.Description || log.description || '')}</td>
        </tr>`;
    }).join('');

    updatePagination();
  }

  function updatePagination() {
    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
    const start = filteredLogs.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, filteredLogs.length);

    document.getElementById('paginationInfo').textContent =
      `Showing ${start}-${end} of ${filteredLogs.length} entries`;
    document.getElementById('currentPageBtn').textContent = `${currentPage}`;
    document.getElementById('prevBtn').disabled = currentPage === 1;
    document.getElementById('nextBtn').disabled = currentPage >= totalPages;
    document.getElementById('paginationControls').style.display = filteredLogs.length > itemsPerPage ? 'flex' : 'none';
  }

  function updateStats() {
    document.getElementById('totalLogs').textContent = allLogs.length;
    const today = new Date(); today.setHours(0,0,0,0);
    const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);
    const todayCount = allLogs.filter(l => new Date(l.Timestamp || l.timestamp || l.time) >= today).length;
    const weekCount = allLogs.filter(l => new Date(l.Timestamp || l.timestamp || l.time) >= weekAgo).length;
    document.getElementById('todayLogs').textContent = todayCount;
    document.getElementById('weekLogs').textContent = weekCount;
  }

  // ===== THIS FUNCTION IS UPDATED =====
  function applyFilters() {
    const adminFilter = (document.getElementById('filterSelect')?.value || 'all');
    const searchTerm = (document.getElementById('searchInput')?.value || '').toLowerCase();

    filteredLogs = allLogs.filter(log => {
      // Get all the data from the log object
      const adminName = (log.AdminName || log.admin || 'System').toString(); // This is now the Email
      const role = (log.Role || log.role || 'System').toString();         // This is the Role
      const desc = (log.Description || log.description || '').toString();
      const ts = formatTimestamp12Hour(log.Timestamp || log.timestamp || log.time).toLowerCase();
      
      // FIXED: The dropdown filter now correctly checks the 'role'
      const matchesAdmin = (adminFilter === 'all') || (role === adminFilter);
      
      // FIXED: The search bar now checks email, role, description, and timestamp
      const matchesSearch = !searchTerm ||
        adminName.toLowerCase().includes(searchTerm) || // Search Email
        role.toLowerCase().includes(searchTerm) ||      // Search Role
        desc.toLowerCase().includes(searchTerm) ||      // Search Description
        ts.includes(searchTerm);                        // Search Timestamp

      return matchesAdmin && matchesSearch;
    });

    currentPage = 1;
    renderTable();
  }
  // ===== END OF UPDATED FUNCTION =====


  async function loadActivityLogs() {
    try {
      const resp = await fetch('Backend/activity_log.php', {cache: 'no-store'});
      const json = await resp.json();
      if (!resp.ok || !json.success) throw new Error(json.message || 'Failed to fetch');
      allLogs = json.logs || [];
      
      applyFilters(); 
      updateStats();
    } catch (err) {
      console.error('Failed to load activity logs', err);
      document.getElementById('activityTableBody').innerHTML = `
        <tr><td colspan="3">
          <div class="empty-state">
            <div class="empty-state-icon">⚠️</div>
            <div class="empty-state-text">Unable to load activity logs</div>
          </div>
        </td></tr>`;
    }
  }

  /* Event wiring */
  document.getElementById('filterSelect')?.addEventListener('change', applyFilters);
  
  const searchBtn = document.querySelector('.search-btn');
  if (searchBtn) {
    searchBtn.addEventListener('click', (e)=>{ e.preventDefault(); applyFilters(); });
  }

  document.getElementById('searchInput')?.addEventListener('keydown', (ev)=>{ if(ev.key==='Enter'){ ev.preventDefault(); applyFilters(); } });
  
  let searchTimeout;
  document.getElementById('searchInput')?.addEventListener('input', ()=>{ 
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(applyFilters, 300); // Debounce search
  });

  document.getElementById('refreshBtn')?.addEventListener('click', (e)=>{ e.preventDefault(); loadActivityLogs(); }); 

  document.getElementById('prevBtn')?.addEventListener('click', ()=>{ if(currentPage>1){ currentPage--; renderTable(); }});
  document.getElementById('nextBtn')?.addEventListener('click', ()=>{ const totalPages = Math.ceil(filteredLogs.length/itemsPerPage); if(currentPage<totalPages){ currentPage++; renderTable(); }});

  /* initial */
  loadActivityLogs();
  setInterval(loadActivityLogs, 60000); // Auto-refresh every 60 seconds
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