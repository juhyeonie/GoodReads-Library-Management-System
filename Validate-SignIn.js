// Validate-SignIn.js
console.log('Validate-SignIn.js loaded');

document.addEventListener('DOMContentLoaded', () => {
  // quick visual test (optional; remove when done)
  const el = document.createElement('div');
  el.id = 'js-loaded-test';
  el.textContent = 'JS loaded ✓';
  el.style.position = 'fixed';
  el.style.bottom = '6px';
  el.style.right = '6px';
  el.style.background = '#0f0';
  el.style.padding = '2px 6px';
  el.style.fontSize = '12px';
  document.body.appendChild(el);

  const form = document.getElementById('signinForm');
  const email = document.getElementById('email');
  const password = document.getElementById('password');
  const errEmail = document.getElementById('err-email');
  const errPassword = document.getElementById('err-password');
  const serverMsg = document.getElementById('server-msg');

  const show = (el, msg) => { el.textContent = msg; el.style.display = 'block'; };
  const hide = el => { el.textContent = ''; el.style.display = 'none'; };

  const validate = () => {
    let ok = true;
    hide(errEmail); hide(errPassword); hide(serverMsg);

    if (!email.value.trim()) {
      show(errEmail, 'Enter your email.');
      ok = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
      show(errEmail, 'Enter a valid email address.');
      ok = false;
    }
    if (!password.value) {
      show(errPassword, 'Password is required.');
      ok = false;
    }
    return ok;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const data = new FormData(form);
    try {
      const res = await fetch('Backend/auth.php', {
        method: 'POST',
        body: data,
        credentials: 'same-origin'
      });

      let json;
      try {
        json = await res.json();
      } catch (parseErr) {
        console.error('Could not parse JSON from auth response', parseErr);
        show(serverMsg, 'Server returned an unexpected response.');
        return;
      }

      if (!res.ok || !json.success) {
        if (json.errors) {
          if (json.errors.email) show(errEmail, json.errors.email);
          if (json.errors.password) show(errPassword, json.errors.password);
        }
        show(serverMsg, json.message || 'Sign-in failed.');
        return;
      }

      // ✅ Store user data in sessionStorage for homepage
      if (json.user) {
        sessionStorage.setItem('user_logged_in', 'true');
        sessionStorage.setItem('user_email', json.user.Email);
        sessionStorage.setItem('user_plan', json.user.Plan);
        sessionStorage.setItem('user_role', json.user.Role);
        sessionStorage.setItem('user_status', json.user.Status);
        sessionStorage.setItem('user_account_id', json.user.AccountID);
        
        // Store subscription end date if available
        if (json.user.SubsEnd) {
          sessionStorage.setItem('user_subs_end', json.user.SubsEnd);
        }
        
        // Check if subscription is expired
        if (json.user.isExpired) {
          sessionStorage.setItem('user_subs_expired', 'true');
        }
      }

      // ✅ Handle account status
      const status = (json.user?.Status || '').toString().toLowerCase();
      if (status === 'cancelled' || status === 'expired') {
        alert('Your subscription has expired. Please choose a new plan.');
        window.location.href = 'MembershipPlan.html';
        return;
      }

      // ✅ Redirect by role
      const role = (json.user?.Role || '').toString().toLowerCase();
      if (role === 'admin') {
        window.location.href = 'BookAdmin-Dashboard.html';
      } else {
        window.location.href = 'homepage.html';
      }

    } catch (err) {
      console.error('Fetch error:', err);
      show(serverMsg, 'Network or server error.');
    }
  });
});