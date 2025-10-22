// Validate-SignIn.js - Fixed with complete auth flow
console.log('Validate-SignIn.js loaded');

document.addEventListener('DOMContentLoaded', () => {
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

      // Store user data in localStorage for client-side access
      if (json.user) {
        localStorage.setItem('userData', JSON.stringify(json.user));
      }

      // Handle account status
      const status = (json.user.Status || '').toString().toLowerCase();
      if (status === 'cancelled' || status === 'expired') {
        alert('Your subscription has expired. Please renew to continue.');
        window.location.href = 'MembershipPlan.html';
        return;
      }

      // Redirect by role
      const role = (json.user.Role || '').toString().toLowerCase();
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