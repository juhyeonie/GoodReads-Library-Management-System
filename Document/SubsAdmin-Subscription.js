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

    // Modal functionality with dynamic features
    (function() {
      const modal = document.getElementById('editPlanModal');
      const form = document.getElementById('editPlanForm');
      const nameInput = document.getElementById('planNameInput');
      const priceInput = document.getElementById('priceInput');
      const featuresList = document.getElementById('featuresList');
      const addFeatureBtn = document.getElementById('addFeatureBtn');
      const confirmBtn = document.getElementById('confirmEdit');
      const cancelBtn = document.getElementById('cancelEdit');

      let activeCard = null;
      let featureCounter = 0;

      function showModal() {
        if (!modal) return;
        modal.classList.add('show');
        document.body.classList.add('no-scroll');
        nameInput && nameInput.focus();
      }

      function hideModal() {
        if (!modal) return;
        modal.classList.remove('show');
        document.body.classList.remove('no-scroll');
        activeCard = null;
      }

      function createFeatureItem(text = '') {
        const div = document.createElement('div');
        div.className = 'feature-item';
        div.dataset.featureId = featureCounter++;
        
        div.innerHTML = `
          <span class="check-icon">✔</span>
          <input type="text" class="feature-input" placeholder="Enter feature description" value="${text}" />
          <button type="button" class="delete-feature">Delete</button>
        `;

        div.querySelector('.delete-feature').addEventListener('click', () => {
          div.remove();
        });

        return div;
      }

      addFeatureBtn.addEventListener('click', () => {
        const newFeature = createFeatureItem();
        featuresList.appendChild(newFeature);
        newFeature.querySelector('.feature-input').focus();
      });

      // Open modal when edit button is clicked
      document.addEventListener('click', (e) => {
        const btn = e.target.closest('.edit-btn');
        if (!btn) return;
        
        const card = btn.closest('.plan-card');
        if (!card) return;
        activeCard = card;

        const titleEl = card.querySelector('.plan-title');
        const priceEl = card.querySelector('.plan-price');
        const featuresEl = card.querySelectorAll('.plan-features li');

        if (nameInput) nameInput.value = titleEl ? titleEl.textContent.trim() : '';
        if (priceInput) priceInput.value = priceEl ? priceEl.textContent.trim() : '';

        // Clear and populate features
        featuresList.innerHTML = '';
        featuresEl.forEach(li => {
          const featureText = li.textContent.trim();
          const featureItem = createFeatureItem(featureText);
          featuresList.appendChild(featureItem);
        });

        showModal();
      });

      // Confirm: apply edits
      confirmBtn && confirmBtn.addEventListener('click', (evt) => {
        evt.preventDefault();
        if (!activeCard) return hideModal();

        const titleEl = activeCard.querySelector('.plan-title');
        const priceEl = activeCard.querySelector('.plan-price');
        const featuresUl = activeCard.querySelector('.plan-features');

        if (titleEl) titleEl.textContent = nameInput.value.trim() || 'Untitled Plan';
        if (priceEl) priceEl.textContent = priceInput.value.trim() || '₱0 / month';

        // Update features
        if (featuresUl) {
          featuresUl.innerHTML = '';
          const featureInputs = featuresList.querySelectorAll('.feature-input');
          featureInputs.forEach(input => {
            const value = input.value.trim();
            if (value) {
              const li = document.createElement('li');
              li.textContent = value;
              featuresUl.appendChild(li);
            }
          });
        }

        hideModal();
      });

      // Cancel
      cancelBtn && cancelBtn.addEventListener('click', (e) => { 
        e.preventDefault(); 
        hideModal(); 
      });

      // Click overlay to close
      modal && modal.addEventListener('click', (e) => { 
        if (e.target === modal) hideModal(); 
      });

      // Escape to close
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && modal.classList.contains('show')) {
          hideModal();
        }
      });

      // Prevent form submit
      form && form.addEventListener('submit', (e) => e.preventDefault());
    })();