// js/membership-step1.js
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('signupStep1');
  const email = document.getElementById('email');
  const password = document.getElementById('password');
  const errEmail = document.getElementById('err-email');
  const errPassword = document.getElementById('err-password');
  const serverMsg = document.getElementById('server-msg');
  const nextBtn = document.getElementById('nextBtn');

  const show = (el,msg)=>{ el.textContent = msg; el.style.display='block'; };
  const hide = el=>{ el.textContent=''; el.style.display='none'; };

  // debounce helper to avoid spamming server
  function debounce(fn, wait=350){
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(()=>fn(...args), wait); };
  }

  // Async check to server if email exists
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

  // keep latest check promise to avoid race conditions
  let lastCheckedEmail = '';
  let lastCheckResult = null;

  const debouncedCheck = debounce(async (value) => {
    if (!value) return;
    lastCheckedEmail = value;
    const r = await checkEmailExists(value);
    // still interested only if email unchanged
    if (lastCheckedEmail !== value) return;
    lastCheckResult = r;
    if (r && r.exists === true) {
      show(errEmail, 'This email is already registered. Please sign in or use another email.');
    } else {
      // only clear if current field matches the validated value
      if (email.value.trim() === value) hide(errEmail);
    }
  }, 350);

  // basic validation
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

  // live check on email input (debounced)
  email.addEventListener('input', (e) => {
    const v = email.value.trim();
    hide(errEmail);
    lastCheckResult = null;
    if (!v) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { show(errEmail,'Enter a valid email.'); return; }
    debouncedCheck(v);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateLocal()) return;

    const em = email.value.trim();

    // If we already have a fresh check result for this email, use it
    if (lastCheckResult && lastCheckedEmail === em) {
      if (lastCheckResult.error) {
        show(serverMsg, 'Could not verify email. Try again later.');
        return;
      }
      if (lastCheckResult.exists === true) {
        show(errEmail, 'This email is already registered. Please sign in or use another email.');
        return;
      }
      // not exists => proceed
    } else {
      // No cached check: do a synchronous check before proceeding
      const r = await checkEmailExists(em);
      if (r && r.exists === true) {
        show(errEmail, 'This email is already registered. Please sign in or use another email.');
        lastCheckResult = r;
        lastCheckedEmail = em;
        return;
      }
      if (r && r.error) {
        show(serverMsg, 'Could not verify email. Try again later.');
        return;
      }
    }

    // Save credentials in sessionStorage (temporary until final confirm)
    sessionStorage.setItem('signup_email', em);
    sessionStorage.setItem('signup_password', password.value); // keep plain until server hashes

    // go to plan selection
    window.location.href = 'MembershipPlan.html';
  });
});
