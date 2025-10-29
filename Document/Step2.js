// Step2.js
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('signupStep1');
  const email = document.getElementById('email');
  const password = document.getElementById('password');
  const errEmail = document.getElementById('err-email');
  const errPassword = document.getElementById('err-password');
  const serverMsg = document.getElementById('server-msg');
  const nextBtn = document.getElementById('nextBtn');

  // --- Read the plan selected from StartPage.html or Step1.html ---
  const selectedPlan = localStorage.getItem('selectedPlan');

  // If no plan was selected, redirect back to a selection page
  if (!selectedPlan) {
    alert('Please select a plan first.');
    
    // Check the referrer to provide a better redirect path
    const referrer = document.referrer;
    if (referrer && referrer.includes('StartPage.html')) {
        window.location.href = 'StartPage.html'; 
    } else {
        window.location.href = 'Step1.html'; 
    }
    return;
  }
  
  // Update button text for Basic Plan
  if (selectedPlan === 'Basic Plan' || selectedPlan === 'Basic') {
    nextBtn.textContent = 'Complete Sign Up';
  }

  email.value = '';
  password.value = '';

  const show = (el,msg)=>{ el.textContent = msg; el.style.display='block'; };
  const hide = el=>{ el.textContent=''; el.style.display='none'; };

  function debounce(fn, wait=350){
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(()=>fn(...args), wait); };
  }

  async function checkEmailExists(emailValue) {
    try {
      const fd = new FormData();
      fd.append('email', emailValue);
      const resp = await fetch('Backend/check_email.php', { method: 'POST', body: fd, credentials: 'same-origin' });
      if (!resp.ok) return { error: 'server' };
      const json = await resp.json();
      return json; // { exists: true/false }
    } catch (e) {
      console.error('checkEmailExists error', e);
      return { error: 'network' };
    }
  }

  let lastCheckedEmail = '';
  let lastCheckResult = null;

  const debouncedCheck = debounce(async (value) => {
    if (!value) return;
    lastCheckedEmail = value;
    const r = await checkEmailExists(value);
    if (lastCheckedEmail !== value) return;
    lastCheckResult = r;
    if (r && r.exists === true) {
      show(errEmail, 'This email is already registered. Please sign in or use another email.');
    } else {
      if (email.value.trim() === value) hide(errEmail);
    }
  }, 350);

  function validateLocal() {
    let ok=true;
    hide(errEmail); hide(errPassword); hide(serverMsg);
    const em = email.value.trim();
    const pw = password.value;

    if (!em) { show(errEmail,'Enter your email.'); ok=false; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { show(errEmail,'Enter a valid email.'); ok=false; }
    if (!pw) { show(errPassword,'Enter a password.'); ok=false; }
    else if (pw.length < 8) { show(errPassword,'Password must be at least 8 characters.'); ok=false; }
    return ok;
  }

  email.addEventListener('input', (e) => {
    const v = email.value.trim();
    hide(errEmail);
    lastCheckResult = null;
    if (!v) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { show(errEmail,'Enter a valid email.'); return; }
    debouncedCheck(v);
  });

  // --- FORM SUBMIT LOGIC ---
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateLocal()) return;

    const em = email.value.trim();
    const pw = password.value;

    // Final check for email existence
    if (!lastCheckResult || lastCheckedEmail !== em) {
      const r = await checkEmailExists(em);
      if (r && r.exists === true) {
        show(errEmail, 'This email is already registered. Please sign in or use another email.');
        return;
      }
      if (r && r.error) {
        show(serverMsg, 'Could not verify email. Try again later.');
        return;
      }
    }
    
    // Clear any old temp data
    sessionStorage.removeItem('signup_email');
    sessionStorage.removeItem('signup_password');
    sessionStorage.removeItem('signup_plan');
    
    // --- CONDITIONAL LOGIC ---
    if (selectedPlan === 'Basic Plan' || selectedPlan === 'Basic') {
      // --- HANDLE BASIC PLAN: Create account and redirect to homepage ---
      nextBtn.disabled = true;
      nextBtn.textContent = 'Creating Account...';

      const fd = new FormData();
      fd.append('email', em);
      fd.append('password', pw);
      fd.append('plan', 'Basic Plan'); // Use the full plan name for signup.php
      
      try {
        const res = await fetch('Backend/signup.php', { method: 'POST', body: fd });
        const json = await res.json();
        
        if (!res.ok || !json.success) {
          throw new Error(json.message || 'Could not create account.');
        }

        // --- SUCCESS ---
        sessionStorage.setItem('user_plan', 'basic plan'); 
        localStorage.removeItem('selectedPlan'); // Clean up local storage
        
        // Redirect to homepage
        window.location.href = 'homepage.html'; 

      } catch (err) {
        show(serverMsg, err.message);
        nextBtn.disabled = false;
        nextBtn.textContent = 'Complete Sign Up';
      }

    } else {
      // --- HANDLE PAID PLANS: Save to session and redirect to PaymentMethod.html ---
      sessionStorage.setItem('signup_email', em);
      sessionStorage.setItem('signup_password', pw);
      
      // Store the full plan name
      let fullPlanName = selectedPlan;
      if (selectedPlan === 'Standard') fullPlanName = 'Standard Plan';
      if (selectedPlan === 'Premium') fullPlanName = 'Premium Plan';
      
      sessionStorage.setItem('signup_plan', fullPlanName);
      
      window.location.href = 'PaymentMethod.html';
    }
  });
});