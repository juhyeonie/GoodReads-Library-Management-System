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
/* ===== Dashboard modal & table logic (single file) ===== */

(function(){
  // Dummy data (replace with server data later)
  const DATA = {
    "free-plan": {
      title: "Customers Subscribed to Free Plan",
      columns: ["ID No.", "Email", "Payment Method", "Account Date Registered"],
      rows: [
      ]
    },
    "standard-plan": {
      title: "Customers Subscribed to Standard Plan",
      columns: ["ID No.", "Email", "Payment Method", "Account Date Registered"],
      rows: [
      ]
    },
    "premium-plan": {
      title: "Customers Subscribed to Premium Plan",
      columns: ["ID No.", "Email", "Payment Method", "Account Date Registered"],
      rows: [
      ]
    },
    "user-admin": {
      title: "User Admin List",
      columns: ["ID No.", "Email", "Registered Date"],
      rows: [
      ]
    },
    "subscription-admin": {
      title: "Subscription Admin List",
      columns: ["ID No.", "Email", "Registered Date"],
      rows: [
      ]
    },
    "total-admins": {
      title: "Total Number of Admins",
      columns: ["ID No.", "Email", "Registered Date"],
      rows: [
      ]
    },
    "total-customers": {
      title: "Total Number of Customers",
      columns: ["ID No.", "Email", "Plan", "Payment Method", "Account Date Registered"],
      rows: [
      ]
    },
    "total-books": {
      title: "List of All Books in Database",
      columns: ["Category","Author","Title"],
      rows: [
       
      ]
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
    // focus close button for accessibility
    modalClose.focus();
  }

  function closeModal(){
    modalOverlay.classList.remove('active');
    document.body.classList.remove('no-scroll');
    modalOverlay.setAttribute('aria-hidden','true');
    // keep modalBody content (but you may clear if preferred)
  }

  // open modal when a card is clicked (one shared modal)
  document.querySelectorAll('.stat-card').forEach(card=>{
    card.addEventListener('click', function(){
      const key = this.getAttribute('data-card');
      // map some card keys to existing datasets
      // e.g., subscription-admin, total-admins -> dataset keys already defined
      openModalFor(key);
    });
  });

  // close events
  modalClose.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay.classList.contains('active')) closeModal();
  });

  // Optional: disable scroll snapping when resizing (small nicety)
  window.addEventListener('resize', () => {
    // no-op for now but present if you want adjustments later
  });

  // Accessibility: trap focus inside modal when open (basic)
  document.addEventListener('focus', function(event){
    if(!modalOverlay.classList.contains('active')) return;
    if(!modalContainer.contains(event.target)){
      event.stopPropagation();
      modalClose.focus();
    }
  }, true);

})();