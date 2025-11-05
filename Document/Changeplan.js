// Changeplan.js — load plans + current user, render, go to confirm page
document.addEventListener('DOMContentLoaded', () => {
  const plansContainer = document.querySelector('.plans-container');

  function escapeHTML(str = '') {
    return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[s]));
  }

  // fetch helper returns {res, json, text}
  async function fetchJson(url, opts = {}) {
    opts.credentials = opts.credentials || 'same-origin';
    try {
      const res = await fetch(url, opts);
      const text = await res.text();
      let json = null;
      try { json = JSON.parse(text); } catch(e){}
      return { res, json, text };
    } catch (err) {
      return { res: { ok:false, status:0 }, json: null, text: null, error: err };
    }
  }

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

      let userPlan = null;
      if (userResp.res.ok && userResp.json && userResp.json.success && userResp.json.user) {
        // backend may use different case names; try common ones
        const u = userResp.json.user;
        userPlan = (u.plan || u.Plan || u.PlanName || u.Plan_Name || '').toString().trim();
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

    // normalize helper for comparisons
    const norm = s => (s||'').toString().trim().toLowerCase().replace(/\s+/g,' ');

    plans.forEach(plan => {
      const planName = plan.PlanName || plan.planName || 'Unknown Plan';
      const price = (plan.Price !== undefined && plan.Price !== null) ? `₱${parseFloat(plan.Price).toFixed(0)}` : '—';
      const isCurrent = currentPlanName && norm(currentPlanName) === norm(planName);

      const features = Array.isArray(plan.features) ? plan.features.map(f => `<li>${escapeHTML(f.FeatureText || f)}</li>`).join('') : '';

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
      if (btn) btn.addEventListener('click', () => onChoosePlan(planName));

      plansContainer.appendChild(div);
    });
  }

  // When user picks a plan we go to confirm page with query params
  function onChoosePlan(planName) {
    if (!planName) return;
    // pass new plan via querystring; we also try to include 'current' by fetching current user again
    // but simpler: fetch current user, then redirect with both values.
    fetch('Backend/api/fetch_current_user.php', { credentials: 'same-origin' })
      .then(r => r.json().catch(()=>null))
      .then(json => {
        let current = '';
        if (json && json.success && json.user) {
          const u = json.user;
          current = u.plan || u.Plan || u.PlanName || '';
        }
        // encode and send user to confirm page
        const params = new URLSearchParams();
        params.set('new', planName);
        if (current) params.set('current', current);
        // go to confirm page
        location.href = 'Confirmplan.html?' + params.toString();
      })
      .catch(err => {
        // fallback: no current plan known
        const params = new URLSearchParams();
        params.set('new', planName);
        location.href = 'Confirmplan.html?' + params.toString();
      });
  }

  loadData();
});
