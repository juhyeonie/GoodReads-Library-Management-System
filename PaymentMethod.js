(function () {
  console.log("PaymentMethod.js loaded ✓");

  const plans = {
    Basic: { days: 30, amount: 100 },
    Standard: { days: 30, amount: 150 },
    Premium: { days: 30, amount: 250 }
  };

  const selectedPlanInput = document.getElementById('selected-plan');
  const paymentSelect = document.getElementById('payment-method');
  const agree = document.getElementById('agree');
  const startBtn = document.getElementById('startBtn');
  const receiptInner = document.getElementById('receiptInner');
  const receiptCard = document.getElementById('receiptCard');
  const printBtn = document.getElementById('printBtn');
  const newBtn = document.getElementById('newBtn');

  const urlParams = new URLSearchParams(window.location.search);
  const rawPlan = urlParams.get('plan') || 'Basic - PHP 100';
  selectedPlanInput.value = rawPlan;

  function extractShort(raw) {
    const m = raw.match(/(Basic|Standard|Premium)/i);
    return m ? m[0].charAt(0).toUpperCase() + m[0].slice(1).toLowerCase() : 'Basic';
  }
  const short = extractShort(rawPlan);
  const planData = plans[short] || plans.Basic;

  const pad = n => (n < 10 ? '0' + n : n);
  const fmt = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const addDays = (d, days) => new Date(d.getTime() + days * 86400000);

  function buildReceipt(data) {
    return `
      <h3>Subscription Receipt</h3>
      <p><b>Plan:</b> ${data.plan}</p>
      <p><b>Amount:</b> ₱${data.amount}</p>
      <p><b>Start:</b> ${data.startDate}</p>
      <p><b>End:</b> ${data.endDate}</p>
      <p><b>Payment:</b> ${data.method}</p>
    `;
  }

  function updateState() {
    startBtn.disabled = !(agree.checked && paymentSelect.value);
  }
  agree.addEventListener('change', updateState);
  paymentSelect.addEventListener('change', updateState);

  startBtn.addEventListener('click', async e => {
    e.preventDefault();

    const email = sessionStorage.getItem('signup_email');
    const password = sessionStorage.getItem('signup_password');
    if (!email || !password) {
      alert('Missing signup data, please restart.');
      return (window.location.href = 'Membership.html');
    }

    const now = new Date();
    const startDate = fmt(now);
    const endDate = fmt(addDays(now, planData.days));

    const fd = new FormData();
    fd.append('email', email);
    fd.append('password', password);
    fd.append('plan', short);
    fd.append('subs_started', startDate);
    fd.append('subs_end', endDate);
    fd.append('payment_method', paymentSelect.value);

    try {
      const res = await fetch('Backend/signup.php', { method: 'POST', body: fd });
      const json = await res.json();

      if (!json.success) {
        alert(json.message || 'Signup failed');
        return;
      }

      // ✅ Store user data after successful signup
      sessionStorage.setItem('user_logged_in', 'true');
      sessionStorage.setItem('user_email', email);
      sessionStorage.setItem('user_plan', short);
      sessionStorage.setItem('user_role', 'User');
      sessionStorage.setItem('user_status', 'Active');
      sessionStorage.setItem('user_subs_end', endDate);
      if (json.account_id) {
        sessionStorage.setItem('user_account_id', json.account_id);
      }

      // ✅ Auto-login after signup
      const loginFd = new FormData();
      loginFd.append('email', email);
      loginFd.append('password', password);

      const loginRes = await fetch('Backend/auth.php', {
        method: 'POST',
        body: loginFd,
        credentials: 'same-origin'
      });

      const loginJson = await loginRes.json();
      if (loginJson.success && loginJson.user) {
        // Update with server data
        sessionStorage.setItem('user_plan', loginJson.user.Plan);
        sessionStorage.setItem('user_role', loginJson.user.Role);
        sessionStorage.setItem('user_status', loginJson.user.Status);
        sessionStorage.setItem('user_account_id', loginJson.user.AccountID);
      }

      const receipt = {
        plan: short,
        amount: planData.amount,
        startDate,
        endDate,
        method: paymentSelect.value
      };

      receiptInner.innerHTML = buildReceipt(receipt);
      receiptCard.classList.remove('empty');
      printBtn.disabled = false;
      newBtn.disabled = false;

      // Clear temporary signup data
      sessionStorage.removeItem('signup_email');
      sessionStorage.removeItem('signup_password');

    } catch (err) {
      console.error('Signup error:', err);
      alert('Network or server error during signup.');
    }
  });

  printBtn.addEventListener('click', () => window.print());
  newBtn.addEventListener('click', () => {
    alert('Redirecting to homepage...');
    window.location.href = 'Homepage.html';
  });
})();