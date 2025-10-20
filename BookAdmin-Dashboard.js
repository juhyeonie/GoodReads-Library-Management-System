// Initialize placeholder charts
document.addEventListener("DOMContentLoaded", () => {
  const barCtx = document.getElementById("barChart").getContext("2d");
  const pieCtx = document.getElementById("pieChart").getContext("2d");

  // Bar chart (sample)
  new Chart(barCtx, {
    type: "bar",
    data: {
      labels: ["Category A", "Category B", "Category C"],
      datasets: [{
        label: "Books per Category",
        data: [10, 7, 5],
        backgroundColor: ["#5A7FFB", "#86A8E7", "#91EAE4"]
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });

  // Pie chart (sample)
  new Chart(pieCtx, {
    type: "pie",
    data: {
      labels: ["Category A", "Category B", "Category C"],
      datasets: [{
        data: [10, 7, 5],
        backgroundColor: ["#5A7FFB", "#86A8E7", "#91EAE4"]
      }]
    },
    options: { responsive: true }
  });
});
