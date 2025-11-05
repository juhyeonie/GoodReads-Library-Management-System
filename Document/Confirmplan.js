// Confirmplan.js — show current & new plan and POST to change_plan.php when confirming
document.addEventListener('DOMContentLoaded', () => {
  const url = new URL(window.location.href);
  const newPlan = url.searchParams.get('new') || '';
  const currentPlan = url.searchParams.get('current') || '';

  const currentEl = document.querySelector('.plan.current');
  const newEl = document.querySelector('.plan.new');

  currentEl.textContent = currentPlan ? `${currentPlan}` : 'Not signed in / No current plan';
  newEl.textContent = newPlan ? `${newPlan}` : 'No new plan selected';

  const cancelBtn = document.querySelector('.cancel-btn');
  const confirmBtn = document.querySelector('.confirm-btn');

  if (cancelBtn) cancelBtn.addEventListener('click', () => window.history.back());

  if (!confirmBtn) return;
  confirmBtn.addEventListener('click', async () => {
    if (!newPlan) return alert('No plan selected.');

    // disable button while processing
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Processing…';

    try {
      const fd = new FormData();
      fd.append('plan', newPlan);

      const res = await fetch('Backend/api/change_plan.php', { method: 'POST', body: fd, credentials: 'same-origin' });
      const txt = await res.text();
      let json = null;
      try { json = JSON.parse(txt); } catch(e){}

      if (!res.ok || !json || !json.success) {
        const msg = json?.message || `Failed to change plan (status ${res.status})`;
        alert(msg);
        // fallback: store selection for signup flow
        localStorage.setItem('selectedPlan', newPlan);
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Confirm';
        return;
      }

      alert(json.message || `Plan changed to ${json.plan || newPlan}`);
      // go back to settings (refresh will pick up updated plan from backend)
      window.location.href = 'Setting.html';
    } catch (err) {
      console.error('Confirm plan error', err);
      alert('Network error. Try again.');
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Confirm';
    }
  });
});
