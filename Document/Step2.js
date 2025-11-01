// Step2.js (FINAL VERSION with Live Password Validation)
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

  /**
   * Performs full validation for form submission.
   */
  function validateLocal() {
    let ok=true;
    hide(errEmail); 
    hide(errPassword); // Ensure this is hidden before showing new errors
    hide(serverMsg);
    const em = email.value.trim();
    const pw = password.value;
    
    // Regular expressions for password requirements
    const hasUpperCase = /[A-Z]/.test(pw);
    const hasNumber = /[0-9]/.test(pw);
    
    // Email Validation (Stays the same)
    if (!em) { 
        show(errEmail,'Enter your email.'); 
        ok=false; 
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { 
        show(errEmail,'Enter a valid email.'); 
        ok=false; 
    }

    // Password Validation (Stays the same for final check)
    if (!pw) { 
        show(errPassword,'Enter a password.'); 
        ok=false; 
    } else if (pw.length < 8) { 
        show(errPassword,'Password must be at least 8 characters.'); 
        ok=false; 
    } else if (!hasUpperCase) {
        show(errPassword,'Password must contain at least 1 uppercase letter.');
        ok=false;
    } else if (!hasNumber) {
        show(errPassword,'Password must contain at least 1 number.');
        ok=false;
    }
    
    return ok;
  }
  
  /**
   * Provides live password feedback to the user.
   */
  function checkPasswordStrength(pw) {
    const hasLength = pw.length >= 8;
    const hasUpperCase = /[A-Z]/.test(pw);
    const hasNumber = /[0-9]/.test(pw);
    
    let requirements = [];

    if (!hasLength) requirements.push("8+ characters");
    if (!hasUpperCase) requirements.push("1 uppercase letter");
    if (!hasNumber) requirements.push("1 number");

    if (requirements.length === 0 && pw.length > 0) {
        hide(errPassword);
        return true;
    } else if (requirements.length > 0) {
        // Display the list of missing requirements
        const msg = `Password must contain: ${requirements.join(', ')}.`;
        show(errPassword, msg);
        return false;
    }
    hide(errPassword);
    return false;
  }


  // --- Event Listeners ---

  email.addEventListener('input', (e) => {
    const v = email.value.trim();
    hide(errEmail);
    lastCheckResult = null;
    if (!v) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { show(errEmail,'Enter a valid email.'); return; }
    debouncedCheck(v);
  });

  // NEW: Live feedback on password input
  password.addEventListener('input', (e) => {
    // Only show live feedback if the input is not empty
    if (password.value.length > 0) {
      checkPasswordStrength(password.value);
    } else {
      // Clear message if field is empty
      hide(errPassword); 
    }
  });


  // --- FORM SUBMIT LOGIC ---
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    // Re-validate everything, including the new password rules
    if (!validateLocal()) {
        // Run checkPasswordStrength one last time to ensure the error message is comprehensive
        if (password.value) checkPasswordStrength(password.value); 
        return;
    }

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
    
    // --- CONDITIONAL LOGIC (No changes here) ---
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