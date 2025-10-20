// Modal control
const modal = document.getElementById("addBookModal");
const addBtn = document.querySelector(".add-btn");
const closeModal = document.getElementById("closeModal");

// Open modal
addBtn.addEventListener("click", () => {
  modal.style.display = "flex";
});

// Close modal
closeModal.addEventListener("click", (e) => {
  e.preventDefault();
  modal.style.display = "none";
});

// Close when clicking outside
window.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.style.display = "none";
  }
});
