// StartPage.js (New File)

document.addEventListener('DOMContentLoaded', () => {
    
    // Function to handle plan selection and redirection
    function handlePlanSelection(planName) {
        if (!planName) {
            console.error("Plan name missing.");
            return;
        }
        
        // Store the selected plan in localStorage for Step 2 to read.
        localStorage.setItem("selectedPlan", planName);
        
        // Redirect to the next stage (Email/Password entry)
        window.location.href = "Step2.html";
    }

    // Attach event listeners to all plan buttons on the StartPage
    const planButtons = document.querySelectorAll('#featured-books .plan-btn');
    
    planButtons.forEach(button => {
        // We look up the plan name based on the button text to be flexible
        let planName = '';
        if (button.textContent.includes('Free')) {
            planName = 'Basic';
        } else if (button.textContent.includes('Standard')) {
            planName = 'Standard';
        } else if (button.textContent.includes('Premium')) {
            planName = 'Premium';
        }

        // Only attach if a plan name was found
        if (planName) {
             // Remove any inline onclick to prevent double handling
            button.removeAttribute('onclick'); 
            button.addEventListener('click', () => handlePlanSelection(planName));
        } else {
             console.warn("Could not determine plan name for button:", button.textContent);
        }
    });
});