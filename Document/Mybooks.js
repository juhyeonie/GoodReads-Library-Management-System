// Mybooks.js — render saved "My Books" from localStorage and provide search/filter

if (typeof requireAuth === 'function') requireAuth();

// Utility to safely read my_books
function getMyBooks() {
  try {
    const json = localStorage.getItem('my_books');
    if (!json) return [];
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr : [];
  } catch (err) {
    console.warn('Could not parse my_books', err);
    return [];
  }
}

// Render a single book card matching your HTML structure
function createBookCard(book) {
  const card = document.createElement('div');
  card.className = 'book-card';
  
  // cover
  const cover = document.createElement('div');
  cover.className = 'book-cover';
  if (book.cover) {
    // use inline background-image only if your CSS expects .book-cover to show an image
    // But to avoid CSS changes, we'll inject an <img> inside .book-cover like other pages
    const img = document.createElement('img');
    img.src = book.cover;
    img.alt = book.title || 'Cover';
    img.style.width = '100%';
    img.style.height = '100%';
    img.onerror = function() {
      this.onerror = null;
      this.src = 'https://placehold.co/100x150?text=No+Cover';
    }
    cover.appendChild(img);
  }
  card.appendChild(cover);

  // details
  const details = document.createElement('div');
  details.className = 'book-details';
  details.innerHTML = `
    <p><strong>Title:</strong> ${escapeHtml(book.title || '')}</p>
    <p><strong>Author:</strong> ${escapeHtml(book.author || 'Unknown')}</p>
    <p><strong>Category:</strong> ${escapeHtml(book.genre || '')}</p>
    <p><strong>Genre:</strong> ${escapeHtml(book.genre || '')}</p>
    <p class="book-desc"><strong>Description:</strong> ${escapeHtml(book.description || '')}</p>
  `;
  card.appendChild(details);

  // VIEW button - link to BookReader with pdf param if available
  const view = document.createElement('a');
  view.className = 'view-btn';
  view.href = book.pdfUrl ? `BookReader.html?pdf=${encodeURIComponent(book.pdfUrl)}` : '#';
  view.textContent = 'VIEW';
  // open in same tab (consistent with your site)
  view.setAttribute('target', '_self');

  card.appendChild(view);

  return card;
}

// Basic HTML escape to avoid injection
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Append saved books to #bookList (above existing static examples)
function renderSavedBooks() {
  const list = document.getElementById('bookList');
  if (!list) return;

  const saved = getMyBooks();

  if (!saved.length) {
    // nothing saved — do nothing (keep static examples)
    return;
  }

  // Insert saved books at the top: create a container wrapper to group them
  const wrapper = document.createElement('div');
  wrapper.id = 'my-saved-books';
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';
  wrapper.style.gap = '1rem';
  wrapper.style.marginBottom = '1rem';

  saved.forEach(book => {
    const card = createBookCard(book);
    wrapper.appendChild(card);
  });

  // Insert wrapper before the first child so saved books appear above the static examples
  list.insertBefore(wrapper, list.firstChild);
}

// Search function (existing functionality kept)
function searchBooks() {
  const input = document.getElementById("searchInput").value.toLowerCase();
  // We want to search both saved cards and static example cards, so search the container
  const list = document.getElementById('bookList');
  if (!list) return;
  const cards = list.querySelectorAll(".book-card");

  cards.forEach(card => {
    const text = card.innerText.toLowerCase();
    card.style.display = text.includes(input) ? "flex" : "none";
  });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  try {
    renderSavedBooks();
  } catch (err) {
    console.error('Error rendering saved books', err);
  }

  // expose searchBooks globally if your HTML calls it inline
  window.searchBooks = searchBooks;
});
