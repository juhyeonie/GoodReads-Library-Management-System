// SignIn.js
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
  
  // Helper function for redirection
  const redirectToHomepage = () => {
      window.location.href = 'homepage.html';
  };
  
  // --- NEW Helper to create the correct storage key ---
  const getStorageKey = (planName) => {
      if (!planName) return 'basic';
      const cleanPlan = planName.toString().toLowerCase().replace(/\s/g, '');
      if (cleanPlan === 'basicplan') return 'basic'; // FIX: maps 'basicplan' to 'basic'
      return cleanPlan;
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

      const user = json.user;
      const role = user?.Role ? user.Role.toString().toLowerCase() : '';
      const plan = user?.Plan ? user.Plan.toString().toLowerCase() : 'basic plan'; // 'basic plan'
      
      // 1. Store CURRENT user plan in session storage for homepage access control
      // --- FIX APPLIED HERE ---
      const storageKey = getStorageKey(plan); 
      sessionStorage.setItem('user_plan', storageKey); // Stores 'basic', 'standardplan', etc.
      console.log('📘 User plan stored:', storageKey); 

      // --- THIS IS THE NEW LINE YOU MUST ADD ---
      sessionStorage.setItem('user_role', role); // Stores 'superadmin', 'useradmin', etc.
      // ----------------------------------------
      
      // Clear previous plan expiration flags
      sessionStorage.removeItem('is_plan_expired');
      sessionStorage.removeItem('original_plan');


      // 2. Store expiration status if applicable (only for non-admin accounts)
      if (user.IsExpired && (role === 'user' || role === 'customer')) {
          sessionStorage.setItem('is_plan_expired', 'true');
          sessionStorage.setItem('original_plan', user.OriginalPlan || 'Standard/Premium');
          console.log(`⚠️ Subscription expired. Original plan: ${user.OriginalPlan}. Downgraded to Basic. Flag stored for homepage.`);
      }
      
      // 3. Check general status (e.g., 'Cancelled')
      const status = user?.Status ? user.Status.toString().toLowerCase() : '';
      if (status === 'cancelled' || status === 'expired') {
        // Redirect to membership plan page for truly un-logged-in accounts if needed
        window.location.href = 'MembershipPlan.html';
        return;
      }

      // 4. Route based on role
      console.log('🔐 User role detected:', role);

      switch(role) {
        case 'superadmin':
          console.log('→ Redirecting to SuperAdmin Dashboard');
          window.location.href = 'SuperAdmin-Dashboard.html';
          break;
          
        case 'useradmin':
          console.log('→ Redirecting to UserAdmin Dashboard');
          window.location.href = 'UserAdmin-Dashboard.html';
          break;
          
        case 'subsadmin':
          console.log('→ Redirecting to SubsAdmin Dashboard');
          window.location.href = 'SubsAdmin-Dashboard.html';
          break;
          
        case 'user':
        case 'customer':
          console.log('→ Redirecting to Homepage');
          redirectToHomepage();
          break;
          
        default:
          console.warn('⚠️ Unknown role:', role);
          // Default to homepage for unknown roles
          redirectToHomepage();
      }

    } catch (err) {
      console.error('Fetch error:', err);
      show(serverMsg, 'Network or server error.');
    }
  });
});