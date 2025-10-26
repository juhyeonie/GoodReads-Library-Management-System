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

    // Customer subscription data and functionality
    (function() {
      let nextId = 1008;
      
      const demoUsers = [
        { id: '1000', email: 'jane@example.com', plan: 'free', payment: 'credit_card' },
        { id: '1001', email: 'tom@example.com', plan: 'standard', payment: 'gcash' },
        { id: '1002', email: 'ana@example.com', plan: 'premium', payment: 'maya' },
        { id: '1003', email: 'bob@example.com', plan: 'free', payment: 'paypal' },
        { id: '1004', email: 'alice@example.com', plan: 'standard', payment: 'credit_card' },
        { id: '1005', email: 'john@example.com', plan: 'premium', payment: 'gcash' },
        { id: '1006', email: 'sara@example.com', plan: 'free', payment: 'maya' },
        { id: '1007', email: 'mike@example.com', plan: 'standard', payment: 'paypal' }
      ];

      let users = demoUsers.slice();

      const tbody = document.querySelector('#usersTable tbody');
      const searchInput = document.getElementById('userSearch');
      const planFilter = document.getElementById('planFilter');
      const editModal = document.getElementById('editUserModal');
      const userEmail = document.getElementById('userEmail');
      const userPlan = document.getElementById('userPlan');
      const userPayment = document.getElementById('userPayment');
      const userId = document.getElementById('userId');
      const confirmBtn = document.getElementById('confirmUserEdit');
      const cancelBtn = document.getElementById('cancelUserEdit');
      const editForm = document.getElementById('editUserForm');

      function escapeHtml(str) {
        if (str == null) return '';
        return String(str).replace(/[&<>"']/g, s => ({
          '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[s]));
      }

      function formatPaymentMethod(method) {
        const methods = {
          'credit_card': 'Credit Card',
          'gcash': 'GCash',
          'maya': 'Maya',
          'paypal': 'PayPal'
        };
        return methods[method] || method;
      }

      function formatPlan(plan) {
        return plan.charAt(0).toUpperCase() + plan.slice(1);
      }

      function renderTable(rows) {
        tbody.innerHTML = '';
        rows.forEach(u => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${escapeHtml(u.id)}</td>
            <td>${escapeHtml(u.email)}</td>
            <td>${escapeHtml(formatPlan(u.plan))}</td>
            <td>${escapeHtml(formatPaymentMethod(u.payment))}</td>
            <td style="text-align:right">
              <button class="action-btn view-btn" data-id="${escapeHtml(u.id)}">View</button>
              <button class="action-btn edit-btn" data-id="${escapeHtml(u.id)}">Edit</button>
            </td>
          `;
          tbody.appendChild(tr);
        });
      }

      function applyFilters() {
        const q = (searchInput && searchInput.value || '').trim().toLowerCase();
        const f = (planFilter && planFilter.value) || 'all';
      
        const filtered = users.filter(u => {
          const matchText = !q || u.email.toLowerCase().includes(q);
          const matchFilter = f === 'all' || u.plan === f;
          return matchText && matchFilter;
        });
        renderTable(filtered);
      }

      applyFilters();
      if (searchInput) searchInput.addEventListener('input', applyFilters);
      if (planFilter) planFilter.addEventListener('change', applyFilters);

      function showEdit() {
        if (!editModal) return;
        editModal.classList.add('show');
        document.body.classList.add('no-scroll');
        setTimeout(() => userEmail && userEmail.focus(), 80);
      }

      function hideEdit() {
        if (!editModal) return;
        editModal.classList.remove('show');
        document.body.classList.remove('no-scroll');
      }

      // Edit button click
      document.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.edit-btn');
        if (editBtn) {
          const id = editBtn.dataset.id;
          const user = users.find(u => u.id === id);
          if (!user) return;
          
          if (userId) userId.value = user.id;
          if (userEmail) userEmail.value = user.email;
          if (userPlan) userPlan.value = user.plan;
          if (userPayment) userPayment.value = user.payment;
          
          showEdit();
          return;
        }
      });

      // Confirm edit
      confirmBtn && confirmBtn.addEventListener('click', (evt) => {
        evt.preventDefault();
        
        const id = userId && userId.value;
        if (!id) { 
          hideEdit(); 
          return; 
        }
        
        const idx = users.findIndex(u => u.id === id);
        if (idx >= 0) {
          users[idx].email = userEmail ? userEmail.value.trim() : '';
          users[idx].plan = userPlan ? userPlan.value : '';
          users[idx].payment = userPayment ? userPayment.value : '';
          applyFilters();
        }
        
        hideEdit();
      });

      // Cancel
      cancelBtn && cancelBtn.addEventListener('click', (e) => { 
        e.preventDefault(); 
        hideEdit(); 
      });

      // Click overlay to close
      editModal && editModal.addEventListener('click', (e) => { 
        if (e.target === editModal) hideEdit(); 
      });

      // Escape to close
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && editModal && editModal.classList.contains('show')) {
          hideEdit();
        }
      });

      // Prevent form submit
      editForm && editForm.addEventListener('submit', (e) => e.preventDefault());
    })();