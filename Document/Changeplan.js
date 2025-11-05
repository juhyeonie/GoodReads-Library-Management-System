// Changeplan.js — load plans + current user, render, allow change
document.addEventListener('DOMContentLoaded', () => {
  const plansContainer = document.querySelector('.plans-container');

  function escapeHTML(str = '') {
    return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[s]));
  }

  // Fetch JSON with credentials
  async function fetchJson(url, opts = {}) {
    opts.credentials = opts.credentials || 'same-origin';
    const res = await fetch(url, opts);
    const text = await res.text();
    try { return { res, json: JSON.parse(text) }; }
    catch(e) { return { res, json: null, text }; }
  }

  // Load both plans and current user in parallel
  async function loadData() {
    plansContainer.innerHTML = '<p>Loading available plans…</p>';
    try {
      const [plansResp, userResp] = await Promise.all([
        fetchJson('Backend/plan_fetch.php'),
        fetchJson('Backend/api/fetch_current_user.php')
      ]);

      if (!plansResp.res.ok || !plansResp.json || !plansResp.json.success) {
        throw new Error(plansResp.json?.message || 'Could not load plans');
      }

      const plans = plansResp.json.plans || [];

      // user may be unauthenticated (we still show plans and fallback to signup flow)
      let userPlan = null;
      if (userResp.res.ok && userResp.json && userResp.json.success && userResp.json.user) {
        userPlan = (userResp.json.user.plan || '').toString().trim();
      }

      renderPlans(plans, userPlan);
    } catch (err) {
      console.error('Plan loading error', err);
      plansContainer.innerHTML = '<p class="error-message">Could not load subscription plans. Please try again later.</p>';
    }
  }

  function renderPlans(plans = [], currentPlanName = '') {
    plansContainer.innerHTML = '';
    if (!plans.length) {
      plansContainer.innerHTML = '<p>No plans available.</p>';
      return;
    }

    plans.forEach(plan => {
      // plan object shape from your backend: { PlanName, Price, features: [{FeatureText}, ...] }
      const planName = plan.PlanName || plan.planName || 'Unknown Plan';
      const price = (plan.Price !== undefined && plan.Price !== null) ? `₱${parseFloat(plan.Price).toFixed(0)}` : '—';
      const isCurrent = currentPlanName && currentPlanName.toLowerCase() === planName.toLowerCase();

      // build features list
      const features = Array.isArray(plan.features) ? plan.features.map(f => `<li>${escapeHTML(f.FeatureText || f)}</li>`).join('') : '';

      // choose classes & button label
      const planClass = `plan ${escapeHTML(planName.toLowerCase().split(' ')[0] || '')} ${isCurrent ? 'highlight' : ''}`;
      const ribbonHTML = isCurrent ? `<div class="ribbon">Current</div>` : '';
      const buttonText = isCurrent ? 'Current Plan' : 'Choose';

      const div = document.createElement('div');
      div.className = planClass;
      div.innerHTML = `
        ${ribbonHTML}
        <h3>${escapeHTML(planName)}</h3>
        <p class="price">${escapeHTML(price)} <small style="font-weight:400; color:#666">/ month</small></p>
        <ul class="features">${features}</ul>
        <div style="display:flex; gap:10px; justify-content:center;">
          <button class="plan-btn" data-plan="${escapeHTML(planName)}" ${isCurrent ? 'disabled' : ''}>${escapeHTML(buttonText)}</button>
        </div>
      `;

      const btn = div.querySelector('.plan-btn');
      btn?.addEventListener('click', () => onSelectPlan(planName, div));

      plansContainer.appendChild(div);
    });
  }

  async function onSelectPlan(planName, planElement) {
    if (!planName) return;
    // Confirm before changing live account
    const ok = confirm(`Change subscription to "${planName}"?`);
    if (!ok) return;

    // Optimistic UI lock
    const btn = planElement.querySelector('.plan-btn');
    const prevText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Updating…';

    try {
      const fd = new FormData();
      fd.append('plan', planName);

      const { res, json } = await fetchJson('Backend/api/change_plan.php', { method: 'POST', body: fd });
      if (!res.ok || !json || !json.success) {
        const msg = json?.message || `Failed to change plan (status ${res.status})`;
        alert(msg);
        // fallback: store selection for signup flow (if unauthenticated)
        localStorage.setItem('selectedPlan', planName);
        return;
      }

      alert(json.message || `Plan changed to ${json.plan || planName}`);
      // After success, return to settings to reflect change
      location.href = 'Setting.html';
    } catch (err) {
      console.error('Change plan failed', err);
      alert('Network error while changing plan. Please try again.');
    } finally {
      btn.disabled = false;
      btn.textContent = prevText;
    }
  }

  // start
  loadData();
});
