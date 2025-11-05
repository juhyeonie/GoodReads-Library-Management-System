if (typeof requireAuth === 'function') requireAuth();
const books = [
  {
    title: "The Lightning Thief",
    author: "Rick Riordan",
    genre: "Book Recommendation",
    cover: "Media/Covers/PJ.jpg",
    description: "The first Percy Jackson book — a modern-day teen discovers he’s a demigod and begins an epic quest.",
    pdfUrl: "Media/Books/PJ.pdf"
  },
  {
    title: "The Sea of Monsters",
    author: "Rick Riordan",
    genre: "Book Recommendation",
    cover: "Media/Covers/PJ2.jpg",
    description: "Percy Jackson returns for another mythic quest across dangerous seas to save Camp Half-Blood.",
    pdfUrl: "Media/Books/PJ2.pdf"
  },
  {
    title: "The Titan's Curse",
    author: "Rick Riordan",
    genre: "Book Recommendation",
    cover: "Media/Covers/PJ3.jpg",
    description: "A darker Percy Jackson installment where new threats emerge and loyalties are tested.",
    pdfUrl: "Media/Books/PJ3.pdf"
  },
  {
    title: "The Battle of the Labyrinth",
    author: "Rick Riordan",
    genre: "Book Recommendation",
    cover: "Media/Covers/PJ4.jpg",
    description: "A fast-paced Percy Jackson adventure involving traps, monsters, and a race to stop a dangerous invasion.",
    pdfUrl: "Media/Books/PJ4.pdf"
  },
  {
    title: "The Last Olympian",
    author: "Rick Riordan",
    genre: "Book Recommendation",
    cover: "Media/Covers/PJ5.jpg",
    description: "The climactic Percy Jackson finale — high-stakes heroism, ancient gods, and the defense of Olympus.",
    pdfUrl: "Media/Books/PJ5.pdf"
  },
  {
    title: "All You Need Is Kill",
    author: "Hiroshi Sakurazaka",
    genre: "Novel",
    cover: "Media/Covers/ALL.JPG",
    description: "A high-octane military sci-fi about a soldier trapped in a time loop fighting an alien invasion.",
    pdfUrl: "Media/Books/AYNSK.pdf"
  },
  {
    title: "Atomic Habits: An Easy & Proven Way to Build Good Habits & Break Bad Ones",
    author: "James Clear",
    genre: "Educational",
    cover: "Media/Covers/atomic.jpg",
    description: "Practical, step-by-step strategies to build small habits that compound into big results.",
    pdfUrl: "Media/Books/ATOMIC.pdf"
  },
  {
    title: "Workbook for James Clear’s Atomic Habits: The Step By Step Guide",
    author: "James Clear (workbook)",
    genre: "Educational",
    cover: "Media/Covers/workbook.jpg",
    description: "A practical workbook with exercises and templates to implement Atomic Habits' ideas.",
    pdfUrl: "Media/Education/WORKBOOKATOMIC.pdf"
  },
  {
    title: "Dune",
    author: "Frank Herbert",
    genre: "Novel",
    cover: "Media/Covers/dune1.png",
    description: "Epic science fiction about politics, religion, and ecology on the desert world Arrakis.",
    pdfUrl: "Media/Books/DUNE1.pdf"
  },
  {
    title: "Fahrenheit 451",
    author: "Ray Bradbury",
    genre: "Novel",
    cover: "Media/Covers/f451.jpg",
    description: "A classic dystopia about censorship, book-burning, and the power of ideas.",
    pdfUrl: "Media/Books/F451.pdf"
  },
  {
    title: "Ikigai",
    author: "Héctor García & Francesc Miralles",
    genre: "Novel",
    cover: "Media/Covers/ikigai.jpg",
    description: "A concise exploration of Japanese principles for finding purpose and a fulfilling life.",
    pdfUrl: "Media/Books/IKIGAI.pdf"
  },
  {
    title: "Project Hail Mary",
    author: "Andy Weir",
    genre: "Novel",
    cover: "Media/Covers/phm.jpg",
    description: "A lone astronaut wakes with no memory and must save Earth using unexpected science and friendship.",
    pdfUrl: "Media/Books/PHM.pdf"
  },
  {
    title: "Sherlock Holmes (Collected/Stories)",
    author: "Arthur Conan Doyle",
    genre: "Novel",
    cover: "Media/Covers/sh.jpg",
    description: "Classic detective cases featuring Holmes’ brilliant observation and deductive reasoning.",
    pdfUrl: "Media/Books/SH.pdf"
  },
  {
    title: "The Bell Jar",
    author: "Sylvia Plath",
    genre: "Novel",
    cover: "Media/Covers/tbj.jpg",
    description: "A powerful, semi-autobiographical novel about a young woman’s mental health and identity.",
    pdfUrl: "Media/Books/TBJ.pdf"
  },
  {
    title: "The Catcher in the Rye",
    author: "J.D. Salinger",
    genre: "Novel",
    cover: "Media/Covers/THC.jpg",
    description: "A coming-of-age tale exploring teenage alienation, authenticity, and moral confusion.",
    pdfUrl: "Media/Books/Catcher.pdf"
  },
  {
    title: "The Stranger",
    author: "Albert Camus",
    genre: "Novel",
    cover: "Media/Covers/str.jpg",
    description: "Albert Camus’ existential classic about absurdity, alienation, and moral consequence.",
    pdfUrl: "Media/Books/STRANGER.pdf"
  },
  {
    title: "The Sympathizer",
    author: "Viet Thanh Nguyen",
    genre: "Novel",
    cover: "Media/Covers/symp.jpg",
    description: "A sharp, darkly comic spy novel examining identity, politics, and the aftermath of war.",
    pdfUrl: "Media/Books/SYMPHATIZER.pdf"
  },
  {
    title: "The Unabridged Journals of Sylvia Plath",
    author: "Sylvia Plath",
    genre: "Book Recommendation",
    cover: "Media/Covers/sylv.jpg",
    description: "Intimate journal entries revealing the private thoughts and craft of a major poet.",
    pdfUrl: "Media/Books/SYLVIAPLATH.pdf"
  },
  {
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    genre: "Book Recommendation",
    cover: "Media/Covers/kill.jpg",
    description: "A powerful story of racial injustice and moral growth in the American South.",
    pdfUrl: "Media/Books/MOCKINGBIRD.pdf"
  },
  {
    title: "White Nights",
    author: "Fyodor Dostoevsky",
    genre: "Book Recommendation",
    cover: "Media/Covers/whiteknights.jpg",
    description: "A lyrical short story about loneliness, fleeting love, and yearning in the city.",
    pdfUrl: "Media/Books/whitenights.pdf"
  },
  { title: "Amazing Spider-Man #14 (2025) (Digital)", genre: "Graphic Novel", cover: "Media/Covers/sp.jpg", description: "A modern Spider-Man comic issue packed with action, character moments, and dynamic art.", pdfUrl: "Media/Comics/SPIDERMAN.pdf" }, { title: "Captain America #4 (2025) (Digital)", genre: "Graphic Novel", cover: "Media/Covers/CA.jpg", description: "A contemporary Captain America issue featuring moral conflict and high-stakes heroics.", pdfUrl: "Media/Comics/CAPTAINAMERICA.pdf" }, { title: "Fantastic Four – Gargoyles #1 (2025) (Digital)", genre: "Graphic Novel", cover: "Media/Covers/f4.jpg", description: "The Fantastic Four face supernatural threats and strange new allies in this action-packed issue.", pdfUrl: "Media/Comics/F4.pdf" }, { title: "Incredible Hulk #30 (2025) (Digital)", genre: "Graphic Novel", cover: "Media/Covers/hulk.webp", description: "A Hulk comic with explosive conflict, dramatic stakes, and intense physical spectacle.", pdfUrl: "Media/Comics/HULK.pdf" }, { title: "One World Under Doom #8 (2025) (Digital)", genre: "Graphic Novel", cover: "Media/Covers/doom.jpg", description: "A high-energy comic issue with global-scale threats and superheroic responses.", pdfUrl: "Media/Comics/DOOM.pdf" }, { title: "Strange Tales #1 (2025) (Digital)", genre: "Graphic Novel", cover: "Media/Covers/strt.jpg", description: "An anthology-style comic featuring eerie, bizarre, or supernatural short stories.", pdfUrl: "Media/Comics/STRANGETALES.pdf" }, { title: "Ultimate Black Panther #21 (2025) (Digital)", genre: "Graphic Novel", cover: "Media/Covers/BP.jpg", description: "A modern Black Panther issue focusing on leadership, tech, and royal responsibility.", pdfUrl: "Media/Comics/BP.pdf" }, { title: "Collected Works of Karl Marx (Illustrated)", genre: "Educational", cover: "Media/Covers/karl.jpg", description: "A comprehensive illustrated compilation of influential works on economics and society.", pdfUrl: "Media/Education/KARLMARX.pdf" }, { title: "Rich Dad Poor Dad", genre: "Educational", cover: "Media/Covers/rich.png", description: "A personal-finance classic contrasting two mindsets about money, investing, and wealth-building.", pdfUrl: "Media/Education/RICHDADDY.pdf" }, { title: "Slow Productivity: The Lost Art of Accomplishment Without Burnout", genre: "Educational", cover: "Media/Covers/slow.jpg", description: "Guidance on doing meaningful work by prioritizing focus, rest, and sustainable productivity.", pdfUrl: "Media/Education/SLOWPRODUCTIVITY.pdf" }
];


// ====== DOM Elements & grids mapping ======
const grids = {
  recommendationGrid: "Book Recommendation",
  educationalGrid: "Educational",
  novelGrid: "Novel",
  graphicNovelGrid: "Graphic Novel"
};

const modal = document.getElementById("bookPreviewModal");
const closeModal = document.getElementById("closeModal");
const addBookBtn = document.getElementById("addBookBtn");
const viewBookBtn = document.getElementById("viewBookBtn");
const warningModal = document.getElementById("warningModal");
const warningMessage = document.getElementById("warningMessage");
const warningTitle = warningModal.querySelector('h2'); 
const closeWarning = document.getElementById("closeWarning");
const okBtn = document.getElementById("warningOkBtn");

// Inject like/dislike UI into preview modal (we style minimally inline to avoid requiring CSS edits).
(function injectLikeDislikeUI() {
  const modalContent = document.querySelector('#bookPreviewModal .modal-content');
  if (!modalContent) return;
  const container = document.createElement('div');
  container.className = 'like-dislike-container';
  container.style.display = 'flex';
  container.style.gap = '8px';
  container.style.alignItems = 'center';
  container.style.marginTop = '10px';
  container.innerHTML = `
    <button id="likeBtn" class="like-btn" title="Like" style="padding:8px 10px;border-radius:8px;border:1px solid #ddd;background:#fff;cursor:pointer;"><span id="likeCount">0</span> 👍</button>
    <button id="dislikeBtn" class="dislike-btn" title="Dislike" style="padding:8px 10px;border-radius:8px;border:1px solid #ddd;background:#fff;cursor:pointer;"><span id="dislikeCount">0</span> 👎</button>
  `;
  const confirmation = modalContent.querySelector('.confirmation-text');
  if (confirmation) modalContent.insertBefore(container, confirmation);
  else modalContent.appendChild(container);
})();
const likeBtn = document.getElementById('likeBtn');
const dislikeBtn = document.getElementById('dislikeBtn');
const likeCountEl = document.getElementById('likeCount');
const dislikeCountEl = document.getElementById('dislikeCount');

let selectedBook = null;

// ====== PLAN LOGIC ======
let userPlan = sessionStorage.getItem("user_plan") || localStorage.getItem("user_plan");
if (!userPlan || userPlan === 'null') {
  if (window.location.pathname.split('/').pop() === 'homepage.html') {
    console.warn("User plan not found. Redirecting to sign-in.");
    window.location.href = 'SignIn.html';
  }
  userPlan = "Basic";
}
userPlan = userPlan.trim().toLowerCase().replace(/\s/g, '');
console.log("📘 Current plan:", userPlan.toUpperCase());

// Allowed genres mapping
// BASIC now only has "novel"
const allowedGenres = {
  basic: ["novel"],
  standardplan: ["educational", "novel", "graphic novel", "book recommendation"],
  premiumplan: ["educational", "novel", "graphic novel", "book recommendation"],
  standard: ["educational", "novel", "graphic novel", "book recommendation"],
  premium: ["educational", "novel", "graphic novel", "book recommendation"]
};

function requiredPlan(genre) {
  const g = genre.toLowerCase();
  if (g === "educational") return "Standard";
  if (g === "novel") return "Basic";
  if (g === "book recommendation") return "Standard";
  if (g === "graphic novel") return "Premium";
  return "Premium";
}

// ----------------- Like / Dislike persistence -----------------
function likesKeyFor(book) {
  return `gr_likes::${book.title}::${book.pdfUrl || ''}`;
}
function dislikesKeyFor(book) {
  return `gr_dislikes::${book.title}::${book.pdfUrl || ''}`;
}
function getLikes(book) {
  return parseInt(localStorage.getItem(likesKeyFor(book)) || '0', 10);
}
function getDislikes(book) {
  return parseInt(localStorage.getItem(dislikesKeyFor(book)) || '0', 10);
}
function setLikes(book, n) {
  localStorage.setItem(likesKeyFor(book), String(n));
}
function setDislikes(book, n) {
  localStorage.setItem(dislikesKeyFor(book), String(n));
}

// Helper to show warning modal
function showWarning(title, message) {
  warningTitle.textContent = title;
  warningMessage.textContent = message;
  warningModal.style.display = "block";
  const close = () => (warningModal.style.display = "none");
  closeWarning.onclick = close;
  okBtn.onclick = close;
  window.onclick = e => {
    if (e.target === warningModal) close();
  };
}

// ----------------- UI: Render books -----------------
function loadBooks() {
  Object.entries(grids).forEach(([gridId, category]) => {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    grid.innerHTML = "";
    books
      .filter(book => book.genre === category)
      .forEach(book => {
        const card = document.createElement("div");
        card.classList.add("book-card");
        
        const coverUrl = book.cover || 'https://placehold.co/150x225/A5B4FC/3730A3?text=No+Cover'; 
        card.innerHTML = `<img src="${coverUrl}" alt="${book.title}" onerror="this.onerror=null;this.src='https://placehold.co/150x225/A5B4FC/3730A3?text=No+Cover'">`;

        const genre = book.genre.toLowerCase();
        const isAllowed = allowedGenres[userPlan]?.includes(genre);

        if (!isAllowed) {
          card.classList.add('restricted');
          card.style.filter = "grayscale(100%) brightness(0.6)";
          card.style.cursor = "not-allowed";
          card.title = `Upgrade to ${requiredPlan(book.genre)} to access this book.`;

          card.addEventListener("click", () => {
             const required = requiredPlan(book.genre);
             if (userPlan === 'basic') {
               showWarning("Access Restricted", `"${book.title}" is not accessible on the Basic plan. Upgrade to ${required} to access this genre.`);
             } else {
               showWarning("Access Restricted", `"${book.title}" is not available on your plan. Upgrade to ${required} to access this genre.`);
             }
          });
        } else {
          card.style.cursor = "pointer";
          card.addEventListener("click", () => openPreview(book));
        }

        grid.appendChild(card);
      });
  });
}

// ----------------- Preview modal logic -----------------
function openPreview(book) {
  selectedBook = book;
  document.getElementById("previewCover").src = book.cover || '';
  document.getElementById("previewTitle").textContent = book.title || '';
  const authorEl = document.getElementById("previewAuthor");
  if (authorEl) authorEl.textContent = book.author ? `By ${book.author}` : '';
  document.getElementById("previewGenre").textContent = book.genre || '';
  document.getElementById("previewDescription").textContent = book.description || '';

  document.getElementById("viewBookBtn").href = `BookReader.html?pdf=${encodeURIComponent(book.pdfUrl)}`;

  // Update like/dislike UI
  updateLikeDislikeUI(book);

  // For Basic users: since Basic can only view Novels, there should be no preview for blocked genres — homepage prevents it.
  modal.style.display = "block";
}

function updateLikeDislikeUI(book) {
  if (!book) return;
  const likes = getLikes(book);
  const dislikes = getDislikes(book);
  if (likeCountEl) likeCountEl.textContent = likes;
  if (dislikeCountEl) dislikeCountEl.textContent = dislikes;

  // Enable buttons only for premium. For standard, show but disabled (and show warning on click).
  const isPremium = (userPlan === 'premium' || userPlan === 'premiumplan');
  const isStandard = (userPlan === 'standard' || userPlan === 'standardplan');

  if (likeBtn) {
    likeBtn.disabled = !isPremium;
    likeBtn.style.opacity = isPremium ? '1' : '0.5';
    likeBtn.style.cursor = isPremium ? 'pointer' : 'not-allowed';
  }
  if (dislikeBtn) {
    dislikeBtn.disabled = !isPremium;
    dislikeBtn.style.opacity = isPremium ? '1' : '0.5';
    dislikeBtn.style.cursor = isPremium ? 'pointer' : 'not-allowed';
  }

  // If a Standard user clicks, show upgrade message (we attach handlers below)
}

if (likeBtn) {
  likeBtn.addEventListener('click', () => {
    if (!selectedBook) return;
    const isPremium = (userPlan === 'premium' || userPlan === 'premiumplan');
    if (!isPremium) {
      showWarning("Feature Locked", "Like is available for Premium users only. Upgrade to Premium to like books.");
      return;
    }
    const prev = getLikes(selectedBook);
    setLikes(selectedBook, prev + 1);
    updateLikeDislikeUI(selectedBook);
  });
}

if (dislikeBtn) {
  dislikeBtn.addEventListener('click', () => {
    if (!selectedBook) return;
    const isPremium = (userPlan === 'premium' || userPlan === 'premiumplan');
    if (!isPremium) {
      showWarning("Feature Locked", "Dislike is available for Premium users only. Upgrade to Premium to dislike books.");
      return;
    }
    const prev = getDislikes(selectedBook);
    setDislikes(selectedBook, prev + 1);
    updateLikeDislikeUI(selectedBook);
  });
}

// View book button behavior
viewBookBtn.addEventListener('click', (e) => {
  if (!selectedBook) return;
  const genre = (selectedBook.genre || '').toLowerCase();
  const isAllowed = allowedGenres[userPlan]?.includes(genre);
  if (!isAllowed) {
    // prevent navigation if not allowed (shouldn't happen because homepage blocks), but guard anyway
    e.preventDefault();
    showWarning("Access Restricted", `Your plan cannot open this book. Upgrade to access it.`);
    return;
  }
  // If Standard or Premium, they have unlimited time/pages and full access (reader will accept).
  // If Basic and allowed (Novel), reader will enforce the 60min + 30-pages-per-day limit.
});

// Close preview modal
closeModal.addEventListener("click", () => {
  modal.style.display = "none";
  selectedBook = null;
});
window.addEventListener("click", e => {
  if (e.target === modal) modal.style.display = "none";
});

// ---- My Books localStorage helpers (unchanged) ----
function getMyBooks() {
  try {
    const json = localStorage.getItem('my_books');
    if (!json) return [];
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr : [];
  } catch (err) {
    console.warn('Could not read my_books from localStorage', err);
    return [];
  }
}

function saveMyBooks(arr) {
  try {
    localStorage.setItem('my_books', JSON.stringify(arr));
  } catch (err) {
    console.error('Could not write my_books to localStorage', err);
  }
}

function isBookInMyBooks(book) {
  if (!book) return false;
  const list = getMyBooks();
  return list.some(b => b.title === book.title && (b.pdfUrl || '') === (book.pdfUrl || ''));
}

function addBookToMyBooks(book) {
  if (!book) return false;
  const list = getMyBooks();
  if (isBookInMyBooks(book)) return false;
  const toStore = {
    title: book.title || 'Untitled',
    author: book.author || 'Unknown',
    cover: book.cover || '',
    genre: book.genre || '',
    description: book.description || '',
    pdfUrl: book.pdfUrl || ''
  };
  list.unshift(toStore);
  saveMyBooks(list);
  return true;
}

// Add book button in modal
addBookBtn.addEventListener("click", () => {
  if (!selectedBook) return;
  // Bookmark / Add to My Books: allowed for all plans in homepage (it's just a collection)
  const added = addBookToMyBooks(selectedBook);

  if (!added) {
    showWarning("Already Added", `${selectedBook.title} is already in your My Books.`);
  } else {
    showWarning("Success!", `${selectedBook.title} has been added to your My Books.`);
    setTimeout(() => {
      warningModal.style.display = "none";
      modal.style.display = "none";
      selectedBook = null;
    }, 1100);
  }
});

// Nav active mark
(function markActiveNav() {
  const navLinks = document.querySelectorAll(".nav-icons a");
  const current = window.location.pathname.split("/").pop() || "homepage.html";
  navLinks.forEach(a => {
    const href = a.getAttribute("href")?.split("/").pop();
    if (href && href === current) {
      a.classList.add("active");
      a.setAttribute("aria-current", "page");
    } else {
      a.classList.remove("active");
      a.removeAttribute("aria-current");
    }
  });
})();

if (window.feather && typeof feather.replace === "function") {
  feather.replace();
}

// Initialize UI
loadBooks();

// subscription expiration checker left intact (optional)
function checkSubscriptionExpiration() {
    const isExpired = sessionStorage.getItem('is_plan_expired');
    const originalPlan = sessionStorage.getItem('original_plan');

    if (isExpired === 'true' && originalPlan) {
        sessionStorage.removeItem('is_plan_expired');
        sessionStorage.removeItem('original_plan');
        showWarning("Subscription Expired", `Your ${originalPlan} plan has expired. Your account has been adjusted to Basic; you'll have limited access.`);
    }
}
checkSubscriptionExpiration();