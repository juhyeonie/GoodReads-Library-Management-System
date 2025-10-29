// Step1.js (The Plan Selection Logic)

document.addEventListener('DOMContentLoaded', () => {
  console.log("Step1.js loaded successfully.");

  // Function to handle plan selection and redirection
  window.selectPlan = function(planName) {
    if (!planName) {
      alert("Please select a valid plan.");
      return;
    }
    
    // Store the selected plan in localStorage for Step 2 to read.
    // We store the simple name (e.g., 'Basic', 'Standard', 'Premium')
    localStorage.setItem("selectedPlan", planName);
    
    // Redirect to the next stage (Email/Password entry)
    window.location.href = "Step2.html";
  }
  
  // Attach event listeners to all plan buttons
  const planButtons = document.querySelectorAll('.plan-btn');
  planButtons.forEach(button => {
    // Get the plan name from the onclick attribute
    const planName = button.getAttribute('onclick').match(/'([^']+)'/)[1];
    
    // Remove the inline onclick and set a clean event listener
    button.removeAttribute('onclick');
    button.addEventListener('click', () => selectPlan(planName));
  });
});