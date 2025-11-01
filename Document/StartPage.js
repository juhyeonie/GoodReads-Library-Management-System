// StartPage.js (Updated for Dynamic Plan Loading)

document.addEventListener('DOMContentLoaded', () => {
    
    const plansContainer = document.querySelector('.plans-container');

    // Helper to escape HTML for security
    function escapeHTML(str) {
      if (str == null) return '';
      return String(str).replace(/[&<>"']/g, s => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
      }[s]));
    }

    /**
     * Function to handle plan selection and redirection
     */
    function handlePlanSelection(planName) {
        if (!planName) {
            console.error("Plan name missing.");
            return;
        }
        
        // Store the selected plan (e.g., "Basic Plan", "Standard Plan") in localStorage for Step 2.
        localStorage.setItem("selectedPlan", planName);
        
        // Redirect to the sign-up flow
        window.location.href = "Step2.html";
    }

    /**
     * 1. Dynamic Plan Loader (Fetches data from plan_fetch.php)
     */
    async function loadAndRenderPlans() {
        try {
            const response = await fetch('Backend/plan_fetch.php');
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to load plans.');
            }

            renderPlans(data.plans);

        } catch (err) {
            console.error('Plan loading error:', err);
            if (plansContainer) {
                 plansContainer.innerHTML = '<p class="error-message">Could not load subscription plans. Please try again later.</p>';
            }
        }
    }
    
    /**
     * 2. Rendering Function
     */
    function renderPlans(plans) {
        if (!plansContainer) return;

        // Clear loading message
        plansContainer.innerHTML = ''; 

        plans.forEach(plan => {
            const dataPlanName = escapeHTML(plan.PlanName); 
            // Normalize for CSS classes: "Basic Plan" -> "basic"
            const planKey = plan.PlanName.toLowerCase().split(' ')[0]; 

            const priceText = `₱${parseFloat(plan.Price).toFixed(0)} / month`;
            
            let featuresHTML = '';
            // Render features dynamically
            plan.features.forEach(feature => {
                featuresHTML += `<li>${escapeHTML(feature.FeatureText)}</li>`;
            });

            // Determine classes and button text based on plan name
            let planClass = `plan ${planKey}`;
            let buttonText = 'Go ' + dataPlanName.replace(' Plan', '');
            let ribbonHTML = '';

            if (planKey === 'standard') {
                planClass += ' highlight';
                ribbonHTML = '<div class="ribbon">Most Popular</div>';
            } else if (planKey === 'basic') {
                buttonText = 'Get Started Free';
            } else if (planKey === 'premium') {
                 buttonText = 'Go Premium';
            }

            const planEl = document.createElement('div');
            planEl.className = planClass;
            
            planEl.innerHTML = `
                ${ribbonHTML}
                <h3>${dataPlanName}</h3>
                <p class="price">${escapeHTML(priceText)}</p>
                <ul class="features">
                    ${featuresHTML}
                </ul>
                <button class="plan-btn" data-plan="${dataPlanName}">${buttonText}</button>
            `;
            
            // Attach the plan selection logic directly
            planEl.querySelector('.plan-btn').addEventListener('click', () => {
                handlePlanSelection(dataPlanName);
            });

            plansContainer.appendChild(planEl);
        });
    }

    // Start the dynamic loading process when the page loads
    loadAndRenderPlans();
});