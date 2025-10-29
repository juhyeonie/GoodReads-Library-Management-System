// PaymentMethod.js
document.addEventListener('DOMContentLoaded', () => {
  const planInput = document.getElementById('selected-plan');
  const paymentMethodSelect = document.getElementById('payment-method');
  const agreeCheckbox = document.getElementById('agree');
  const startBtn = document.getElementById('startBtn');
  
  const receiptCard = document.getElementById('receiptCard');
  const receiptInner = document.getElementById('receiptInner');
  const printBtn = document.getElementById('printBtn');
  const newBtn = document.getElementById('newBtn');
  const paymentForm = document.getElementById('paymentForm');

  // --- 1. Get data from sessionStorage ---
  const email = sessionStorage.getItem('signup_email');
  const password = sessionStorage.getItem('signup_password');
  const plan = sessionStorage.getItem('signup_plan'); // e.g., "Standard Plan"

  // Check if we have all data. If not, send back to Step 1.
  if (!email || !password || !plan || plan === 'Basic Plan') {
    alert('Your session has expired or you must select a paid plan. Please start over.');
    // Clear all temp data
    sessionStorage.removeItem('signup_email');
    sessionStorage.removeItem('signup_password');
    sessionStorage.removeItem('signup_plan');
    localStorage.removeItem('selectedPlan');
    window.location.href = 'Step1.html';
    return;
  }
  
  // --- 2. Populate the form ---
  planInput.value = plan; // e.g., "Standard Plan"

  // --- 3. Handle form interactivity ---
  function validateForm() {
    const paymentMethod = paymentMethodSelect.value;
    const isAgreed = agreeCheckbox.checked;
    
    // Enable button only if a method is chosen AND box is checked
    if (paymentMethod && isAgreed) {
      startBtn.disabled = false;
    } else {
      startBtn.disabled = true;
    }
  }
  
  agreeCheckbox.addEventListener('change', validateForm);
  paymentMethodSelect.addEventListener('change', validateForm);

  // --- 4. Handle "Pay" (Sign Up) Button Click ---
  startBtn.addEventListener('click', async () => {
    if (startBtn.disabled) return;
    
    startBtn.disabled = true;
    startBtn.textContent = 'Processing...';

    const paymentMethod = paymentMethodSelect.value;
    
    // Prepare data for signup.php
    const fd = new FormData();
    fd.append('email', email);
    fd.append('password', password);
    fd.append('plan', plan); // "Standard Plan" or "Premium Plan"
    fd.append('payment_method', paymentMethod);
    // signup.php will handle subs_started and subs_end

    try {
      const res = await fetch('Backend/signup.php', { method: 'POST', body: fd });
      const json = await res.json();
      
      if (!res.ok || !json.success) {
        // Handle errors from signup.php (e.g., "Email already registered")
        throw new Error(json.message || 'Could not create account.');
      }
      
      // --- SUCCESS! ---
      // Show the receipt and enable final buttons
      showReceipt(email, plan, paymentMethod);
      paymentForm.style.display = 'none'; // Hide the form

    } catch (err) {
      alert(`Error: ${err.message}`);
      startBtn.disabled = false;
      startBtn.textContent = 'Pay';
    }
  });

  // --- 5. Helper function to show receipt (using your logic) ---
  function showReceipt(userEmail, planName, paymentMethod) {
    const now = new Date();
    const formattedDate = now.toLocaleString();
    const startDate = now.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const expiryDate = new Date(now.getTime() + 30*24*60*60*1000).toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' }); // 30 days

    // Use your price logic
    const price = 
        planName === 'Basic Plan' ? '₱0.00' :
        planName === 'Standard Plan' ? '₱199.00' :
        planName === 'Premium Plan' ? '₱299.00' : '₱0.00';

    receiptInner.innerHTML = `
      <hr class="top-line">
      <h2>SUBSCRIPTION RECEIPT</h2>
      <hr class="divider">
      <div class="section">
        <p><span>Date & Time</span> : ${formattedDate}</p>
        <p><span>Email</span> : ${userEmail}</p>
      </div>
      <hr class="divider">
      <div class="section">
        <p><span>Subscription Plan</span> : ${planName}</p>
        <p><span>Plan Duration</span> : 30 Days</p>
        <p><span>Start Date</span> : ${startDate}</p>
        <p><span>Expiry Date</span> : ${expiryDate}</p>
      </div>
      <hr class="divider">
      <div class="section">
        <p><span>Amount Paid</span> : ${price}</p>
        <p><span>Payment Method</span> : ${paymentMethod}</p>
        <p><span>Payment Status</span> : Paid</p>
      </div>
      <hr class="divider">
      <p class="note">
        This receipt serves as proof of subscription.
      </p>
      <hr class="bottom-line">
      <p class="footer-note">
        * This is a system-generated receipt.
      </p>
    `;

    receiptCard.classList.remove("empty");
    receiptCard.style.display = "flex";
    printBtn.disabled = false;
    newBtn.disabled = false;
  }
  
  // --- 6. Handle "Start your membership" button ---
  newBtn.addEventListener('click', () => {
    // Log the user in
    sessionStorage.setItem('user_plan', plan.toLowerCase()); // e.g., "standard plan"
    
    // Clear all temp signup data
    sessionStorage.removeItem('signup_email');
    sessionStorage.removeItem('signup_password');
    sessionStorage.removeItem('signup_plan');
    localStorage.removeItem('selectedPlan');
    
    // Redirect to homepage
    window.location.href = 'homepage.html';
  });

  // --- 7. Print Button (using your logic) ---
  printBtn.addEventListener('click', () => {
    const popup = window.open("", "_blank", "width=600,height=800");
    popup.document.write(`<html><head><title>Receipt</title><style>
      body{font-family:sans-serif;padding:20px;color:#111;}
      h2{text-align:center;margin:8px 0;font-weight:600;}
      hr{border:none;border-top:2px dashed #333;margin:8px 0;}
      p{margin:6px 0;font-size:14px;}
      span{font-weight:600;}
      .note{text-align:center;margin:12px 0;font-size:13px;}
      .footer-note{text-align:center;margin-top:8px;font-size:12px;color:#555;}
    </style></head><body>${receiptInner.innerHTML}</body></html>`);
    popup.document.close();
    popup.print();
  });
});