// Setting.js — dynamic membership description, plan + price, email + password handlers
if (typeof requireAuth === 'function') requireAuth();

document.addEventListener("DOMContentLoaded", () => {
  // Tabs
  const tabs = document.querySelectorAll(".tab-btn");
  const panels = document.querySelectorAll(".tab-panel");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      const target = tab.getAttribute("data-tab");
      panels.forEach(panel => panel.classList.toggle("hidden", panel.id !== target));
    });
  });

  // -------------------
  // Helpers
  // -------------------
  function normalizePlanName(s) {
    if (!s) return '';
    return s.toString().trim().toLowerCase().replace(/\s+/g, ' ');
  }

  async function safeJsonFetch(url, opts = {}) {
    opts.credentials = opts.credentials || 'same-origin';
    try {
      const res = await fetch(url, opts);
      const txt = await res.text();
      try { return { ok: res.ok, status: res.status, json: JSON.parse(txt) }; }
      catch(e) { return { ok: res.ok, status: res.status, json: null, text: txt }; }
    } catch (err) {
      return { ok: false, status: 0, json: null, error: err };
    }
  }

  // -------------------
  // Load current user + plans and update Membership panel dynamically
  // -------------------
  async function loadCurrentUser() {
    try {
      // fetch user and plans in parallel
      const [userResp, plansResp] = await Promise.all([
        safeJsonFetch('Backend/api/fetch_current_user.php'),
        safeJsonFetch('Backend/plan_fetch.php')
      ]);

      const user = (userResp.json && userResp.json.success) ? userResp.json.user : null;
      const plansList = (plansResp.json && plansResp.json.success && Array.isArray(plansResp.json.plans)) ? plansResp.json.plans : [];

      // populate email input if available
      const emailPanel = document.getElementById('email');
      if (emailPanel && user) {
        const inputs = emailPanel.querySelectorAll('input[type="email"]');
        if (inputs[0]) inputs[0].value = user.Email || user.email || '';
      }

      // membership panel update
      const membershipPanel = document.getElementById('membership');
      if (!membershipPanel) return;
      const planNameEl = membershipPanel.querySelector('.plan-name');
      const planDescEl = membershipPanel.querySelector('.plan-desc');

      // default empty state
      if (!user) {
        if (planNameEl) planNameEl.textContent = 'Not signed in';
        if (planDescEl) planDescEl.textContent = 'Sign in to manage your membership.';
        return;
      }

      // user may store Plan as "Premium Plan" or "Premium" — normalize
      const userPlanRaw = user.Plan || user.plan || user.PlanName || '';
      const userPlanNormalized = normalizePlanName(userPlanRaw);

      // find matching plan record (case-insensitive tolerant)
      let found = null;
      for (const p of plansList) {
        const pName = p.PlanName || p.planName || '';
        if (!pName) continue;
        if (normalizePlanName(pName) === userPlanNormalized) { found = p; break; }
        // extra tolerant match: match first token (e.g., "premium plan" -> "premium")
        if (normalizePlanName(pName).split(' ')[0] === userPlanNormalized.split(' ')[0]) { found = p; break; }
      }

      if (found) {
        // Use the plan record fields if present
        const displayName = found.PlanName || userPlanRaw || 'Plan';
        const priceText = (found.Price !== undefined && found.Price !== null) ? `PHP ${parseFloat(found.Price).toFixed(2)}` : '';
        if (planNameEl) planNameEl.textContent = priceText ? `${displayName} - ${priceText}` : displayName;

        // Prefer Description, then ShortDesc, then fallback to a generated description
        const desc = found.Description || found.ShortDesc || found.PlanDescription || '';
        if (planDescEl) {
          if (desc && desc.trim()) planDescEl.textContent = desc;
          else planDescEl.textContent = `Active plan: ${displayName}.`;
        }
      } else {
        // fallback: use user Plan text stored in the account
        const displayName = userPlanRaw || 'Basic plan';
        if (planNameEl) planNameEl.textContent = `${displayName} - PHP ??.00`;
        if (planDescEl) planDescEl.textContent = user.PlanDescription || `Active plan: ${displayName}.`;
      }
    } catch (err) {
      console.error('User fetch error', err);
      // very defensive fallback
      const membershipPanel = document.getElementById('membership');
      if (membershipPanel) {
        const planNameEl = membershipPanel.querySelector('.plan-name');
        const planDescEl = membershipPanel.querySelector('.plan-desc');
        if (planNameEl) planNameEl.textContent = 'Basic plan - PHP 100.00';
        if (planDescEl) planDescEl.textContent = 'Access our collection of Educational Books.';
      }
    }
  }

  // Call it (important)
  loadCurrentUser();

  // -------------------
  // EMAIL tab handlers
  // -------------------
  const emailPanel = document.getElementById('email');
  if (emailPanel) {
    const [currentEmailInput, newEmailInput] = emailPanel.querySelectorAll('input[type="email"]');
    const confirmEmailBtn = emailPanel.querySelector('.confirm-btn');
    const cancelEmailBtn = emailPanel.querySelector('.cancel-btn');

    if (confirmEmailBtn) {
      confirmEmailBtn.addEventListener('click', async () => {
        const current = (currentEmailInput.value || '').trim();
        const neu = (newEmailInput.value || '').trim();
        if (!current || !neu) return alert('Both fields required');
        const fd = new FormData();
        fd.append('current_email', current);
        fd.append('new_email', neu);
        try {
          const res = await fetch('Backend/api/update_email.php', { method: 'POST', body: fd, credentials: 'same-origin' });
          const json = await res.json();
          if (!res.ok || !json.success) return alert(json.message || 'Failed to update email');
          alert('Email updated');
          currentEmailInput.value = neu;
          newEmailInput.value = '';
        } catch (err) {
          console.error(err);
          alert('Network error');
        }
      });
    }
    if (cancelEmailBtn) cancelEmailBtn.addEventListener('click', () => {
      if (currentEmailInput) currentEmailInput.value = '';
      if (newEmailInput) newEmailInput.value = '';
    });
  }

  // -------------------
  // PASSWORD tab handlers
  // -------------------
  const passwordPanel = document.getElementById('password');
  if (passwordPanel) {
    const [currentPw, newPw, rePw] = passwordPanel.querySelectorAll('input[type="password"]');
    const confirmPwBtn = passwordPanel.querySelector('.confirm-btn');
    const cancelPwBtn = passwordPanel.querySelector('.cancel-btn');

    if (confirmPwBtn) {
      confirmPwBtn.addEventListener('click', async () => {
        if (!currentPw.value || !newPw.value || !rePw.value) return alert('Please fill all fields');
        if (newPw.value !== rePw.value) return alert('New passwords do not match');
        const fd = new FormData();
        fd.append('current_password', currentPw.value);
        fd.append('new_password', newPw.value);
        fd.append('retype_password', rePw.value);

        try {
          const res = await fetch('Backend/api/change_password.php', { method: 'POST', body: fd, credentials: 'same-origin' });
          const json = await res.json();
          if (!res.ok || !json.success) return alert(json.message || 'Failed to change password');
          alert('Password updated.');
          currentPw.value = newPw.value = rePw.value = '';
        } catch (err) {
          console.error(err);
          alert('Network error');
        }
      });
    }
    if (cancelPwBtn) cancelPwBtn.addEventListener('click', () => {
      currentPw.value = newPw.value = rePw.value = '';
    });
  }

  // -------------------
  // MEMBERSHIP tab handlers
  // -------------------
  const membershipPanel = document.getElementById('membership');
  if (membershipPanel) {
    const cancelBtn = membershipPanel.querySelector('.cancel-membership');
    const changePlanBtn = membershipPanel.querySelector('.change-plan');

    if (cancelBtn) {
      cancelBtn.addEventListener('click', async () => {
        if (!confirm('Are you sure you want to cancel your membership?')) return;
        try {
          const res = await fetch('Backend/api/cancel_membership.php', { method: 'POST', credentials: 'same-origin' });
          const json = await res.json();
          if (!res.ok || !json.success) return alert(json.message || 'Failed to cancel membership');
          alert('Membership cancelled.');
          // reflect UI change immediately
          const planNameEl = membershipPanel.querySelector('.plan-name');
          const planDescEl = membershipPanel.querySelector('.plan-desc');
          if (planNameEl) planNameEl.textContent = 'Basic plan - PHP 100.00';
          if (planDescEl) planDescEl.textContent = 'Access our collection of Educational Books.';
        } catch (err) {
          console.error(err);
          alert('Network error');
        }
      });
    }

    if (changePlanBtn) {
      changePlanBtn.addEventListener('click', () => {
        window.location.href = 'Changeplan.html';
      });
    }
  }
});
