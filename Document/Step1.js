// Step1-Dynamic.js

document.addEventListener('DOMContentLoaded', () => {
    console.log("Step1-Dynamic.js loaded successfully. Starting dynamic plan fetch.");

    const plansContainer = document.querySelector('.plans-container');

    // Helper to escape HTML for security when inserting dynamic content
    function escapeHTML(str) {
        if (str == null) return '';
        return String(str).replace(/[&<>"']/g, s => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[s]));
    }

    /**
     * 1. Dynamic Plan Loader
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

        // Clear existing hardcoded content
        plansContainer.innerHTML = ''; 

        plans.forEach(plan => {
            // Use the full plan name from the DB as the plan name for storage
            const dataPlanName = escapeHTML(plan.PlanName); 
            // Normalize for CSS classes: "Basic Plan" -> "basic"
            const planKey = plan.PlanName.toLowerCase().split(' ')[0]; 

            const priceText = `₱${parseFloat(plan.Price).toFixed(0)} / month`;
            
            let featuresHTML = '';
            plan.features.forEach(feature => {
                featuresHTML += `<li>${escapeHTML(feature.FeatureText)}</li>`;
            });

            // Determine classes and button text based on plan
            let planClass = `plan ${planKey}`;
            let buttonText = 'Go ' + dataPlanName.replace(' Plan', '');
            let ribbonHTML = '';

            if (planKey === 'standard') {
                planClass += ' highlight';
                ribbonHTML = '<div class="ribbon">Most Popular</div>';
            } else if (planKey === 'basic') {
                buttonText = 'Get Started Free';
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
            
            // Attach the selection logic to the dynamically created button
            planEl.querySelector('.plan-btn').addEventListener('click', () => {
                handlePlanSelection(dataPlanName);
            });

            plansContainer.appendChild(planEl);
        });
    }

    /**
     * 3. Plan Selection Logic (Copied from original Step1.js)
     */
    window.handlePlanSelection = function(planName) {
      if (!planName) {
        alert("Please select a valid plan.");
        return;
      }
      
      // Store the full, database-edited plan name in localStorage
      localStorage.setItem("selectedPlan", planName);
      
      // Redirect to the next stage (Email/Password entry)
      window.location.href = "Step2.html";
    }
    
    // Start the loading process
    loadAndRenderPlans();
});