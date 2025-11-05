// SignIn.js (REPLACE your current SignIn.js with this file)

// If you want visiting SignIn to always start with a clean sign-in state,
// you can clear only the 'is_logged_in' key at page load — but avoid clearing user_plan
// so backend-driven plan info isn't accidentally wiped after login.
sessionStorage.removeItem('is_logged_in');

console.log('SignIn.js loaded');

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('signinForm');
  const email = document.getElementById('email');
  const password = document.getElementById('password');
  const errEmail = document.getElementById('err-email');
  const errPassword = document.getElementById('err-password');
  const serverMsg = document.getElementById('server-msg');

  // --- Show / Hide Password button ---
  const toggleBtn = document.getElementById('togglePassword');
  if (toggleBtn && password) {
    // Toggle password visibility
    toggleBtn.addEventListener('click', () => {
      const isHidden = password.type === 'password';
      if (isHidden) {
        password.type = 'text';
        toggleBtn.textContent = 'Hide';
        toggleBtn.setAttribute('aria-pressed', 'true');
        toggleBtn.setAttribute('aria-label', 'Hide password');
        toggleBtn.title = 'Hide password';
      } else {
        password.type = 'password';
        toggleBtn.textContent = 'Show';
        toggleBtn.setAttribute('aria-pressed', 'false');
        toggleBtn.setAttribute('aria-label', 'Show password');
        toggleBtn.title = 'Show password';
      }

      // Keep focus on the password field for better UX
      password.focus();
    });

    // Optional: toggle on Enter/Space when button is focused (native button handles it)
    // Optional: hide the password on blur to avoid accidental exposure
    password.addEventListener('blur', () => {
      // If you prefer auto-hiding the password when the user leaves the field, uncomment:
      // password.type = 'password';
      // toggleBtn.textContent = 'Show';
      // toggleBtn.setAttribute('aria-pressed', 'false');
      // toggleBtn.setAttribute('aria-label', 'Show password');
    });
  }

  // occasionally autofill sticks — clear shortly after load
  setTimeout(() => {
    if (email) email.value = '';
    if (password) password.value = '';
    // Ensure toggle shows the correct initial label
    if (toggleBtn) {
      toggleBtn.textContent = 'Show';
      toggleBtn.setAttribute('aria-pressed', 'false');
      toggleBtn.setAttribute('aria-label', 'Show password');
    }
  }, 50);

  const show = (el, msg) => { if (!el) return; el.textContent = msg; el.style.display = 'block'; };
  const hide = el => { if (!el) return; el.textContent = ''; el.style.display = 'none'; };

  const validate = () => {
    let ok = true;
    hide(errEmail); hide(errPassword); hide(serverMsg);

    if (!email.value.trim()) {
      show(errEmail, 'Enter your email.');
      ok = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
      show(errEmail, 'Enter a valid email address.');
      ok = false;
    }
    if (!password.value) {
      show(errPassword, 'Password is required.');
      ok = false;
    }
    return ok;
  };

  // Helper: normalize plan string into storage key used by homepage
  const getStorageKey = (planName) => {
    if (!planName) return 'basic';
    const cleanPlan = planName.toString().toLowerCase().replace(/\s/g, '');
    // map variations to your known keys
    if (cleanPlan === 'basicplan' || cleanPlan === 'basic') return 'basic';
    if (cleanPlan === 'standardplan' || cleanPlan === 'standard') return 'standard';
    if (cleanPlan === 'premiumplan' || cleanPlan === 'premium') return 'premium';
    return cleanPlan;
  };

  // If we detect the user is already signed in (rare), send them to homepage immediately
  if (sessionStorage.getItem('is_logged_in') === 'true' && sessionStorage.getItem('user_plan')) {
    console.log('User already signed in — redirecting to homepage.');
    location.replace('homepage.html');
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hide(serverMsg);
    if (!validate()) return;

    const data = new FormData(form);

    try {
      const res = await fetch('Backend/auth.php', {
        method: 'POST',
        body: data,
        credentials: 'same-origin'
      });

      // If network-level error
      if (!res) {
        show(serverMsg, 'Network error. Please try again.');
        return;
      }

      // attempt to parse JSON; handle parse failures gracefully
      let json;
      try {
        json = await res.json();
      } catch (parseErr) {
        console.error('Could not parse JSON from auth response', parseErr);
        show(serverMsg, 'Server returned an unexpected response.');
        return;
      }

      // handle expected response shape
      // expected: { success: true/false, message: "...", user: { Role, Plan, IsExpired, OriginalPlan, Status } }
      if (!res.ok || !json || !json.success) {
        // show field errors if provided
        if (json && json.errors) {
          if (json.errors.email) show(errEmail, json.errors.email);
          if (json.errors.password) show(errPassword, json.errors.password);
        }
        show(serverMsg, (json && json.message) ? json.message : 'Sign-in failed.');
        return;
      }

      // success path
      const user = json.user || {};
      const role = (user.Role || '').toString().toLowerCase();
      const planRaw = user.Plan || 'basic plan';
      const storageKey = getStorageKey(planRaw);

      // ✅ Store all session keys BEFORE redirecting
      try {
        sessionStorage.setItem('user_plan', storageKey);        // e.g., 'basic', 'standard', 'premium'
        sessionStorage.setItem('is_logged_in', 'true');         // flag other pages check
        sessionStorage.setItem('user_role', role || 'user');    // role for routing
        
        // ===== MODIFICATION: Added user email =====
        sessionStorage.setItem('user_email', user.Email || ''); // Store the user's email
        // ===== END MODIFICATION =====


        // Clear previous expiration flags
        sessionStorage.removeItem('is_plan_expired');
        sessionStorage.removeItem('original_plan');

        // If backend says subscription expired, store flags so homepage shows the modal
        if (user.IsExpired && (role === 'user' || role === 'customer')) {
          sessionStorage.setItem('is_plan_expired', 'true');
          sessionStorage.setItem('original_plan', user.OriginalPlan || '');
          console.log('Subscription flagged as expired for this user.');
        }
      } catch (storageErr) {
        console.warn('Warning: could not write sessionStorage', storageErr);
      }

      // Now route based on role. Use location.replace to avoid adding SignIn to history.
      switch (role) {
        case 'superadmin':
          console.log('→ Redirecting to SuperAdmin Dashboard');
          location.replace('SuperAdmin-Dashboard.html');
          break;
        case 'useradmin':
          console.log('→ Redirecting to UserAdmin Dashboard');
          location.replace('UserAdmin-Dashboard.html');
          break;
        case 'subsadmin':
          console.log('→ Redirecting to SubsAdmin Dashboard');
          location.replace('SubsAdmin-Dashboard.html');
          break;
        case 'user':
        case 'customer':
        default:
          console.log('→ Redirecting to Homepage');
          location.replace('homepage.html');
      }

    } catch (err) {
      console.error('Fetch error:', err);
      show(serverMsg, 'Network or server error. Please try again.');
    }
  });
});