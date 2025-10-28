document.addEventListener('DOMContentLoaded', () => {
  const selectedPlan = localStorage.getItem("selectedPlan") || "No plan selected";
  const selectedPlanInput = document.getElementById("selected-plan");
  if (selectedPlanInput) selectedPlanInput.value = selectedPlan;

  const agree = document.getElementById("agree");
  const payBtn = document.getElementById("startBtn");
  const paymentMethodSelect = document.getElementById("payment-method");
  const receiptInner = document.getElementById("receiptInner");
  const receiptCard = document.getElementById("receiptCard");
  const printBtn = document.getElementById("printBtn");
  const newBtn = document.getElementById("newBtn");

  // Enable pay button when checkbox checked
  agree.addEventListener("change", () => {
    payBtn.disabled = !agree.checked;
  });

  // On Pay click, generate receipt
  payBtn.addEventListener("click", () => {
    const method = paymentMethodSelect.value;
    if (!method) {
      alert("Please choose a payment method.");
      return;
    }

    const now = new Date();
    const formattedDate = now.toLocaleString();
    const startDate = now.toLocaleDateString();
    const expiryDate = new Date(now.getTime() + 30*24*60*60*1000).toLocaleDateString(); // 30 days

    receiptInner.innerHTML = `
      <hr class="top-line">
      <h2>SUBSCRIPTION RECEIPT</h2>
      <hr class="divider">

      <div class="section">
        <p><span>Date & Time</span> : ${formattedDate}</p>
      </div>

      <hr class="divider">

      <div class="section">
        <p><span>Subscription Plan</span> : ${selectedPlan}</p>
        <p><span>Plan Duration</span> : 30 Days</p>
        <p><span>Start Date</span> : ${startDate}</p>
        <p><span>Expiry Date</span> : ${expiryDate}</p>
      </div>

      <hr class="divider">

      <div class="section">
        <p><span>Amount Paid</span> : ${
              selectedPlan === 'Basic Plan' ? '₱0.00' :
              selectedPlan === 'Standard Plan' ? '₱199.00' :
              selectedPlan === 'Premium Plan' ? '₱299.00' : '₱0.00'
            }</p>

        <p><span>Payment Method</span> : ${method}</p>
        <p><span>Payment Status</span> : Paid</p>
      </div>

      <hr class="divider">

      <p class="note">
        This receipt serves as proof of subscription. Your plan will automatically renew unless cancelled.
      </p>

      <hr class="bottom-line">

      <p class="footer-note">
        * This is a system-generated receipt. No signature required.
      </p>
    `;

    receiptCard.classList.remove("empty");
    receiptCard.style.display = "flex";

    printBtn.disabled = false;
    newBtn.disabled = false;
  });

  // Optional: Print
  printBtn.addEventListener("click", () => {
    const popup = window.open("", "_blank", "width=600,height=800");
    popup.document.write(`<html><head><title>Receipt</title><style>
      body{font-family:'Gordita',sans-serif;padding:20px;color:#111;}
      h2{text-align:center;margin:8px 0;font-weight:600;}
      .divider,.top-line,.bottom-line{border:none;border-top:2px dashed #333;margin:8px 0;}
      .section p{margin:6px 0;padding-bottom:6px;border-bottom:1px dashed #ddd;font-size:14px;}
      .section span{font-weight:600;}
      .note{text-align:center;margin:12px 0;font-size:13px;}
      .footer-note{text-align:center;margin-top:8px;font-size:12px;color:#555;}
    </style></head><body>${receiptInner.innerHTML}</body></html>`);
    popup.document.close();
    popup.print();
  });

  // Optional: Start membership
  newBtn.addEventListener("click", () => {
    window.location.href = 'homepage.html';
  });
});
