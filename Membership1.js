document.addEventListener('DOMContentLoaded', () => {
  console.log('MembershipPlan.js loaded');

  const email = sessionStorage.getItem('signup_email');
  const password = sessionStorage.getItem('signup_password');

  if (!email || !password) {
    alert('Please complete Step 1 first.');
    window.location.href = 'Membership.html';
    return;
  }

  const cards = document.querySelectorAll('.plan-card');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      const plan = card.getAttribute('data-plan');
      window.location.href = `PaymentMethod.html?plan=${encodeURIComponent(plan)}`;
    });
  });
});
