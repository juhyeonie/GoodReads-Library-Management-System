// MembershipPlan.js — handles Step 2 logic
document.addEventListener('DOMContentLoaded', () => {
  console.log("MembershipPlan.js loaded ✔");

  // Check if the user came from Step 1
  const email = sessionStorage.getItem('signup_email');
  const password = sessionStorage.getItem('signup_password');

  if (!email || !password) {
    alert('Please complete Step 1 first.');
    window.location.href = 'Membership.html';
    return;
  }

  // Handle plan selection
  const planCards = document.querySelectorAll('.plan-card');
  planCards.forEach(card => {
    card.addEventListener('click', () => {
      const plan = card.getAttribute('data-plan');
      if (!plan) return;

      // Forward user to PaymentMethod with the selected plan in URL
      window.location.href = `PaymentMethod.html?plan=${encodeURIComponent(plan)}`;
    });
  });
});
