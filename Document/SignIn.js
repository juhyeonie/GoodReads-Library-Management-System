// Validate-SignIn.js
console.log('SignIn.js loaded');

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('signinForm');
  const email = document.getElementById('email');
  const password = document.getElementById('password');
  const errEmail = document.getElementById('err-email');
  const errPassword = document.getElementById('err-password');
  const serverMsg = document.getElementById('server-msg');

  // Force clear autofilled values on page load
  setTimeout(() => {
    email.value = '';
    password.value = '';
  }, 50);

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

      // ✅ Store user plan in session storage for homepage access control
      if (json.user && json.user.Status) {
        const plan = json.user.Status.toString().toLowerCase();
        sessionStorage.setItem('user_plan', plan);
        console.log('📘 User plan stored:', plan);
      }

      // ✅ Check account status first
      const status = json.user?.Status ? json.user.Status.toString().toLowerCase() : '';
      if (status === 'cancelled' || status === 'expired') {
        // Redirect to membership plan page for expired/cancelled accounts
        window.location.href = 'MembershipPlan.html';
        return;
      }

      // ✅ Route based on role
      const role = json.user?.Role ? json.user.Role.toString().toLowerCase() : '';
      
      console.log('🔐 User role detected:', role);

      switch(role) {
        case 'superadmin':
        case 'super admin':
          console.log('→ Redirecting to SuperAdmin Dashboard');
          window.location.href = 'SuperAdmin-Dashboard.html';
          break;
          
        case 'useradmin':
        case 'user admin':
          console.log('→ Redirecting to UserAdmin Dashboard');
          window.location.href = 'UserAdmin-Dashboard.html';
          break;
          
        case 'subsadmin':
        case 'subs admin':
        case 'subscriptionadmin':
        case 'subscription admin':
          console.log('→ Redirecting to SubsAdmin Dashboard');
          window.location.href = 'SubsAdmin-Dashboard.html';
          break;
          
        case 'user':
        case 'customer':
          console.log('→ Redirecting to Homepage');
          window.location.href = 'homepage.html';
          break;
          
        default:
          console.warn('⚠️ Unknown role:', role);
          // Default to homepage for unknown roles
          window.location.href = 'homepage.html';
      }

    } catch (err) {
      console.error('Fetch error:', err);
      show(serverMsg, 'Network or server error.');
    }
  });
});