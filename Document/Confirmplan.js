// Confirmplan.js — debug-friendly: change plan, then clear client state and logout on server
document.addEventListener('DOMContentLoaded', () => {
  const url = new URL(window.location.href);
  const newPlan = url.searchParams.get('new') || '';
  const currentPlan = url.searchParams.get('current') || '';

  const currentEl = document.querySelector('.plan.current');
  const newEl = document.querySelector('.plan.new');

  if (currentEl) currentEl.textContent = currentPlan ? `${currentPlan}` : 'Not signed in / No current plan';
  if (newEl) newEl.textContent = newPlan ? `${newPlan}` : 'No new plan selected';

  const cancelBtn = document.querySelector('.cancel-btn');
  const confirmBtn = document.querySelector('.confirm-btn');

  if (cancelBtn) cancelBtn.addEventListener('click', () => window.history.back());
  if (!confirmBtn) return;

  confirmBtn.addEventListener('click', async () => {
    if (!newPlan) return alert('No plan selected.');
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Processing…';
    console.log('Starting plan change ->', newPlan);

    try {
      const fd = new FormData();
      fd.append('plan', newPlan);

      // 1) POST change_plan
      const changeRes = await fetch('Backend/api/change_plan.php', {
        method: 'POST',
        body: fd,
        credentials: 'same-origin' // change to 'include' if your backend is on different origin
      });
      const changeTxt = await changeRes.text();
      console.log('change_plan response text:', changeTxt);
      let changeJson = null;
      try { changeJson = JSON.parse(changeTxt); } catch(e){ console.warn('change_plan returned non-json'); }

      if (!changeRes.ok || !changeJson || !changeJson.success) {
        const msg = changeJson?.message || `Failed to change plan (status ${changeRes.status})`;
        alert(msg);
        console.error('change_plan failed', changeRes.status, changeJson);
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Confirm';
        return;
      }

      console.log('Plan change success:', changeJson);
      alert(changeJson.message || `Plan changed to ${newPlan}`);

      // 2) Clear client state
      try {
        console.log('Clearing local/session storage...');
        try { sessionStorage.clear(); localStorage.clear(); } catch (e) { console.warn('Storage clear error', e); }

        // Delete caches
        if ('caches' in window) {
          try {
            const cacheNames = await caches.keys();
            console.log('Deleting caches:', cacheNames);
            await Promise.all(cacheNames.map(n => caches.delete(n)));
          } catch (e) { console.warn('Cache deletion error', e); }
        }

        // Unregister service workers
        if ('serviceWorker' in navigator) {
          try {
            const regs = await navigator.serviceWorker.getRegistrations();
            console.log('Unregistering service workers', regs);
            await Promise.all(regs.map(r => r.unregister()));
          } catch (e) { console.warn('Service worker unregister error', e); }
        }
      } catch (err) {
        console.warn('Client cleanup error', err);
      }

      // 3) POST logout to server to destroy session cookie/server session
      try {
        console.log('Calling Backend/api/logout.php...');
        const logoutRes = await fetch('Backend/api/logout.php', {
          method: 'POST',
          credentials: 'same-origin' // use 'include' if cross-origin
        });
        const logoutTxt = await logoutRes.text();
        console.log('logout response text:', logoutTxt);
        let logoutJson = null;
        try { logoutJson = JSON.parse(logoutTxt); } catch(e){ console.warn('logout returned non-json'); }

        if (!logoutRes.ok) {
          console.warn('logout returned non-OK status', logoutRes.status, logoutJson);
          // still proceed to redirect, but inform developer
          alert('Plan changed but logout endpoint returned an error. You may still be signed in on the server.');
        } else if (logoutJson && logoutJson.success === false) {
          console.warn('logout returned success:false', logoutJson);
          alert('Plan changed but logout failed on server: ' + (logoutJson.message || 'check server logs'));
        } else {
          console.log('Logout appears OK', logoutJson);
        }
      } catch (err) {
        console.warn('Logout fetch error', err);
        alert('Plan changed but logout request failed (network/CORS). Check console/network tab.');
      }

      // 4) Force redirect to StartPage and include flag so StartPage can show message if you want
      const target = 'StartPage.html';
      location.replace(target + '?logged_out_by=plan_change&_ts=' + Date.now());
    } catch (err) {
      console.error('Confirm plan error', err);
      alert('Network error. Try again.');
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Confirm';
    }
  });
});
