// Mybook.js — robust loader (uses window.books explicitly) + debug logs

console.log("Mybook.js running. raw myBooks:", localStorage.getItem("myBooks"));
console.log("window.books present?:", typeof window.books !== 'undefined');

function loadBooks() {
  const bookList = document.getElementById("bookList");
  if (!bookList) {
    console.error('No #bookList element found on page.');
    return;
  }
  bookList.innerHTML = "";

  const savedBooks = JSON.parse(localStorage.getItem("myBooks") || "[]");
  console.log('SavedBooks parsed:', savedBooks);

  if (savedBooks.length === 0) {
    bookList.innerHTML = "<p>You haven’t added any books yet.</p>";
    return;
  }

  savedBooks.forEach(saved => {
    // use window.books explicitly (safer)
    const master = (typeof window.books !== "undefined") ? window.books : null;
    let fullBook = null;
    if (master) {
      fullBook = master.find(b => String(b.title).trim() === String(saved.title).trim());
    }
    console.log('Matching saved -> fullBook:', saved.title, 'found?', !!fullBook);

    const display = fullBook || saved;

    // defensive defaults
    const cover = display.cover || display.coverPath || 'Media/Covers/default.jpg';
    const title = display.title || 'Untitled';
    const pdf = display.pdfUrl || display.pdfPath || '#';
    const desc = display.description || '';
    const cat = display.genre || display.category || '';

    const card = document.createElement("div");
    card.className = "book-card";
    card.innerHTML = `
      <div class="book-cover">
        <img src="${cover}" alt="${escapeHtml(title)}" onerror="this.src='Media/Covers/default.jpg'"/>
      </div>
      <div class="book-details">
        <p><strong>Title:</strong> ${escapeHtml(title)}</p>
        <p><strong>Category:</strong> ${escapeHtml(cat)}</p>
        <p class="book-desc"><strong>Description:</strong> ${escapeHtml(desc)}</p>
      </div>
      <div class="book-actions">
        <a href="${pdf}" target="_blank" class="view-btn">VIEW</a>
        <button class="delete-btn">REMOVE</button>
      </div>
    `;

    const delBtn = card.querySelector(".delete-btn");
    if (delBtn) {
      delBtn.addEventListener("click", () => {
        removeBook(title);
      });
    }

    bookList.appendChild(card);
  });
}

// helpers
function escapeHtml(s) {
  if (!s) return '';
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function searchBooks() {
  const input = document.getElementById("searchInput").value.toLowerCase();
  const cards = document.querySelectorAll(".book-card");
  cards.forEach(card => {
    const text = card.innerText.toLowerCase();
    card.style.display = text.includes(input) ? "flex" : "none";
  });
}

function removeBook(title) {
  let items = JSON.parse(localStorage.getItem("myBooks") || "[]");
  items = items.filter(b => String(b.title).trim() !== String(title).trim());
  localStorage.setItem("myBooks", JSON.stringify(items));
  console.log('After remove, myBooks:', items);
  loadBooks();
}

document.addEventListener("DOMContentLoaded", loadBooks);
