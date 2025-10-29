// Step1.js (The Plan Selection Logic for Step1.html)

document.addEventListener('DOMContentLoaded', () => {
  console.log("Step1.js loaded successfully.");

  // Function to handle plan selection and redirection
  window.handlePlanSelection = function(planName) {
    if (!planName) {
      alert("Please select a valid plan.");
      return;
    }
    
    // Store the selected plan in localStorage for Step 2 to read.
    localStorage.setItem("selectedPlan", planName);
    
    // Redirect to the next stage (Email/Password entry)
    window.location.href = "Step2.html";
  }
  
  // Attach event listeners to all plan buttons using the data-plan attribute
  const planButtons = document.querySelectorAll('.plan-btn');
  planButtons.forEach(button => {
    const planName = button.getAttribute('data-plan');
    
    // Attach the event listener if the plan name exists
    if (planName) {
        button.addEventListener('click', () => handlePlanSelection(planName));
    }
  });
});