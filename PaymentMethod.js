// PaymentMethod.js — updated: Selected Plan reads the full ?plan=... value from MembershipPlan
(function () {
  // canonical plan mapping (shortName -> days & amount)
  const plans = {
    Basic:   { label: 'Basic',   days: 30,  amount: 100 },
    Standard:{ label: 'Standard',days: 30,  amount: 150 },
    Premium: { label: 'Premium', days: 30,  amount: 250 }
  };

  const selectedPlanInput = document.getElementById('selected-plan');
  const paymentSelect = document.getElementById('payment-method');
  const agreeCheckbox = document.getElementById('agree');
  const startBtn = document.getElementById('startBtn');
  const receiptInner = document.getElementById('receiptInner');
  const receiptCard = document.getElementById('receiptCard');
  const printBtn = document.getElementById('printBtn');
  const newBtn = document.getElementById('newBtn');

  // Read full plan parameter (e.g. "Basic - PHP 100") and display it
  const urlParams = new URLSearchParams(window.location.search);
  const rawPlanParam = urlParams.get('plan') || ''; // may contain "Basic - PHP 100"
  // Display exactly what user clicked, or a placeholder
  selectedPlanInput.value = rawPlanParam ? rawPlanParam : 'Basic - PHP 100';

  // Determine canonical short plan name (Basic/Standard/Premium) from raw param
  // Strategy: take text before first " - " or first space, then normalize to known keys
  function extractShortName(raw){
    if (!raw) return 'Basic';
    // if format "Basic - PHP 100" -> "Basic"
    const beforeDash = raw.split(' - ')[0].trim();
    // if the user passed "Basic - PHP 100" or "Basic", `beforeDash` becomes "Basic"
    // final attempt: match Basic|Standard|Premium (case-insensitive)
    const m = beforeDash.match(/(Basic|Standard|Premium)/i);
    return m ? (m[0].charAt(0).toUpperCase() + m[0].slice(1).toLowerCase()) : 'Basic';
  }

  const shortName = extractShortName(rawPlanParam);
  const planObj = plans[shortName] || plans.Basic;

  // Update button state: enabled when agreed and payment method chosen
  function updateButtonState() {
    const enabled = agreeCheckbox.checked && paymentSelect.value;
    startBtn.disabled = !enabled;
  }
  agreeCheckbox.addEventListener('change', updateButtonState);
  paymentSelect.addEventListener('change', updateButtonState);

  // formatting helpers
  function pad(n){ return n<10 ? '0'+n : n; }
  function fmtDate(d){ return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
  function fmtDateTime(d){
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }
  function generateReceiptNo() {
    const now = new Date();
    const ymd = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}`;
    const rnd = Math.floor(100 + Math.random()*900);
    return `RCP-${ymd}-${rnd}`;
  }
  function addDays(d, days){
    const res = new Date(d.getTime());
    res.setDate(res.getDate() + days);
    return res;
  }

  function buildReceipt(data){
    return `
      <div class="rcpt-top">
        <div style="text-align:center; font-weight:700; margin-bottom:6px;">SUBSCRIPTION RECEIPT</div>
      </div>

      <div class="line"><span>Receipt no.</span><strong>${data.receiptNo}</strong></div>
      <div class="line"><span>Date & Time</span><strong>${data.timestamp}</strong></div>

      <div style="height:8px;"></div>

      <!-- show exactly the selected plan string (what user clicked) -->
      <div class="line"><span>Selected Plan</span><strong>${data.selectedPlan}</strong></div>
      <div class="line"><span>Subscription Plan</span><strong>${data.plan}</strong></div>
      <div class="line"><span>Plan Duration</span><strong>${data.planDuration}</strong></div>
      <div class="line"><span>Start Date</span><strong>${data.startDate}</strong></div>
      <div class="line"><span>Expiry Date</span><strong>${data.endDate}</strong></div>

      <div style="height:8px;"></div>

      <div class="line"><span>Amount Paid</span><strong>₱${Number(data.amount).toLocaleString()}</strong></div>
      <div class="line"><span>Payment Method</span><strong>${data.paymentMethod}</strong></div>
      <div class="line"><span>Payment Status</span><strong>${data.status}</strong></div>

      <div style="height:12px;"></div>
      <div class="muted" style="font-size:12px;">This receipt serves as proof of subscription. Your plan will automatically renew unless cancelled.</div>
      <div style="height:6px;"></div>
      <div style="font-size:11px;color:#7a8596;margin-top:8px;">* This is a system-generated receipt. No signature required.</div>
    `;
  }

  // On click Start your membership
  startBtn.addEventListener('click', () => {
    // Re-extract short plan in case raw param includes different value
    const raw = (new URLSearchParams(window.location.search)).get('plan') || selectedPlanInput.value || '';
    const short = extractShortName(raw);
    const planData = plans[short] || plans.Basic;

    const paymentMethod = paymentSelect.value || 'N/A';
    const now = new Date();
    const startDate = fmtDate(now);
    const endDate = fmtDate(addDays(now, planData.days));

    const receiptData = {
      receiptNo: generateReceiptNo(),
      timestamp: fmtDateTime(now),
      // show both the full selected plan string and the canonical plan for calculations
      selectedPlan: raw ? raw : `${short} - PHP ${planData.amount}`,
      plan: short,
      planDuration: `${planData.days} Days`,
      startDate,
      endDate,
      amount: planData.amount,
      paymentMethod,
      status: 'Paid'
    };

    // render receipt
    receiptInner.innerHTML = buildReceipt(receiptData);
    receiptCard.classList.remove('empty');
    printBtn.disabled = false;
    newBtn.disabled = false;
    receiptCard.scrollIntoView({behavior:'smooth'});

    // Save to localStorage history (optional; for admin demo)
    try {
      const history = JSON.parse(localStorage.getItem('receipts')||'[]');
      history.unshift(receiptData);
      localStorage.setItem('receipts', JSON.stringify(history.slice(0,200)));
    } catch(e){ /* ignore storage errors */ }
  });

  // Print action
  printBtn.addEventListener('click', () => {
    const html = `
      <html><head><title>Receipt</title>
      <style>
        body{font-family:monospace;padding:24px;color:#111}
        .line{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dashed #eee}
      </style>
      </head><body>${receiptInner.innerHTML}</body></html>`;
    const w = window.open('', '_blank', 'width=700,height=800');
    if (!w) { alert('Please allow popups to print the receipt.'); return; }
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  });

  // New action: reset form & receipt
  newBtn.addEventListener('click', () => {
    agreeCheckbox.checked = false;
    paymentSelect.selectedIndex = 0;
    startBtn.disabled = true;
    receiptInner.innerHTML = '<p class="placeholder">Receipt will appear here after you complete payment.</p>';
    receiptCard.classList.add('empty');
    printBtn.disabled = true;
    newBtn.disabled = true;
  });

  // initial state
  startBtn.disabled = true;
  printBtn.disabled = true;
  newBtn.disabled = true;

})();
