const selectedPlan = localStorage.getItem("selectedPlan");
document.getElementById("selected-plan").value = selectedPlan || "No plan selected";

// Agree checkbox enables Pay button
const agree = document.getElementById("agree");
const payBtn = document.getElementById("startBtn");

agree.addEventListener("change", () => {
  payBtn.disabled = !agree.checked;
});

// On Pay click, generate receipt
payBtn.addEventListener("click", () => {
  const method = document.getElementById("payment-method").value;
  const receipt = document.getElementById("receiptInner");

  if (!method) {
    alert("Please choose a payment method.");
    return;
  }

  receipt.innerHTML = `
    <h3>Payment Receipt</h3>
    <p><strong>Plan:</strong> ${selectedPlan}</p>
    <p><strong>Payment Method:</strong> ${method}</p>
    <p><strong>Status:</strong> Payment Successful</p>
    <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
  `;

  document.getElementById("receiptCard").classList.remove("empty");
  document.getElementById("printBtn").disabled = false;
  document.getElementById("newBtn").disabled = false;
});
