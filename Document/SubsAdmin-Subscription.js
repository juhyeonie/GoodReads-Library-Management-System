console.log('SubsAdmin-Subscription.js loaded');

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

// NEW DYNAMIC PLAN MANAGEMENT 
(function() {
  const modal = document.getElementById('editPlanModal');
  const form = document.getElementById('editPlanForm');
  const nameInput = document.getElementById('planNameInput');
  const priceInput = document.getElementById('priceInput');
  const featuresList = document.getElementById('featuresList');
  const addFeatureBtn = document.getElementById('addFeatureBtn');
  const confirmBtn = document.getElementById('confirmEdit');
  const cancelBtn = document.getElementById('cancelEdit');
  const plansContainer = document.querySelector('.plans');

  let originalPlanName = null;
  let allPlansData = [];

  /* 1. LOAD ALL PLANS FROM DATABASE */
  async function loadPlans() {
    try {
      const response = await fetch('Backend/plan_fetch.php');
      const data = await response.json();

      if (!data.success) {
        const error = new Error(data.message || 'Failed to fetch plans.');
        error.serverMessage = data.debug_error || 'No debug info available.';
        throw error;
      }

      allPlansData = data.plans;
      renderPlans(allPlansData);

    } catch (err) {
      console.error('loadPlans error:', err.message); 

      if (err.serverMessage) {
        console.error('--- PRECISE SERVER ERROR ---');
        console.error(err.serverMessage);
        console.error('----------------------------');
      }
      
      plansContainer.innerHTML = `<p style="color: red;">Error: ${err.message}</p>`;
    }
  }

  /* 2. RENDER PLANS ON THE PAGE */
  function renderPlans(plans) {
    if (!plansContainer) return;
    plansContainer.innerHTML = ''; 

    plans.forEach(plan => {
      const planEl = document.createElement('div');
      planEl.className = 'plan-card';
      
      const planKey = plan.PlanName.toLowerCase().split(' ')[0];
      planEl.classList.add(planKey);
      
      if (planKey === 'standard') {
        planEl.classList.add('highlight');
      }

      const priceText = `₱${parseFloat(plan.Price).toFixed(0)} / month`;
      
      let featuresHTML = '';
      plan.features.forEach(feature => {
        featuresHTML += `<li>${escapeHTML(feature.FeatureText)}</li>`;
      });

      planEl.innerHTML = `
        ${planKey === 'standard' ? '<div class="ribbon">Most Popular</div>' : ''}
        <h3 class="plan-title">${escapeHTML(plan.PlanName)}</h3>
        <p class="plan-price">${escapeHTML(priceText)}</p>
        <ul class="plan-features">
          ${featuresHTML}
        </ul>
        <button class="edit-btn">Edit</button>
      `;

      planEl.querySelector('.edit-btn').addEventListener('click', () => {
        openEditModal(plan.PlanName);
      });

      plansContainer.appendChild(planEl);
    });
  }

  /* 3. OPEN AND POPULATE THE EDIT MODAL */
  function openEditModal(planName) {
    const plan = allPlansData.find(p => p.PlanName === planName);
    if (!plan) return;

    originalPlanName = plan.PlanName;

    nameInput.value = plan.PlanName;
    priceInput.value = `₱${parseFloat(plan.Price).toFixed(0)} / month`;

    featuresList.innerHTML = '';
    plan.features.forEach(feature => {
      const featureItem = createFeatureItem(feature.FeatureText, feature.FeatureID);
      featuresList.appendChild(featureItem);
    });

    showModal();
  }

  /* 4. SAVE CHANGES TO DATABASE */
  async function handleConfirmEdit(evt) {
    evt.preventDefault();
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'SAVING...';

    const newPlanName = nameInput.value.trim();
    const newPrice = priceInput.value.trim();
    
    const featureInputs = featuresList.querySelectorAll('.feature-input');
    const features = [];
    featureInputs.forEach(input => {
      const text = input.value.trim();
      if (text) {
        features.push(text);
      }
    });

    const updateData = {
      originalPlanName: originalPlanName,
      newPlanName: newPlanName,
      newPrice: newPrice,
      features: features
    };

    try {
      const response = await fetch('Backend/plan_update.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to save changes.');
      }

      hideModal();
      loadPlans();

    } catch (err) {
      console.error('handleConfirmEdit error:', err);
      alert(`Error: ${err.message}`);
    } finally {
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'CONFIRM';
    }
  }


  // Modal Helper Functions

  function showModal() {
    if (!modal) return;
    modal.classList.add('show');
    document.body.classList.add('no-scroll');
    nameInput.focus();
  }

  function hideModal() {
    if (!modal) return;
    modal.classList.remove('show');
    document.body.classList.remove('no-scroll');
    originalPlanName = null;
  }

  function createFeatureItem(text = '', featureId = null) {
    const div = document.createElement('div');
    div.className = 'feature-item';
    div.dataset.featureId = featureId || `new_${Date.now()}`;
    
    div.innerHTML = `
      <span class="check-icon">✔</span>
      <input type="text" class="feature-input" placeholder="Enter feature description" value="${escapeHTML(text)}" />
      <button type="button" class="delete-feature">Delete</button>
    `;

    div.querySelector('.delete-feature').addEventListener('click', () => {
      div.remove();
    });

    return div;
  }

  function escapeHTML(str) {
    return String(str).replace(/[&<>"']/g, s => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[s]));
  }


  // Init & Event Listeners 

  addFeatureBtn.addEventListener('click', () => {
    const newFeature = createFeatureItem();
    featuresList.appendChild(newFeature);
    newFeature.querySelector('.feature-input').focus();
  });

  confirmBtn.addEventListener('click', handleConfirmEdit);

  cancelBtn.addEventListener('click', (e) => { 
    e.preventDefault(); 
    hideModal(); 
  });

  modal.addEventListener('click', (e) => { 
    if (e.target === modal) hideModal(); 
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('show')) {
      hideModal();
    }
  });

  form.addEventListener('submit', (e) => e.preventDefault());

  // Initial load
  loadPlans();
})();

// --- ADDED: LOGOUT SCRIPT ---
(function() {
    const logoutButton = document.querySelector('.logout-icon');
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault(); // Stop the link from navigating
            
            // Clear the session "Hall Pass"
            sessionStorage.removeItem('user_role');
            sessionStorage.removeItem('user_plan');
            sessionStorage.clear(); // Clears everything
            
            // Go to the login page
            window.location.href = 'StartPage.html';
        });
    }
})();
// --- END OF LOGOUT SCRIPT ---