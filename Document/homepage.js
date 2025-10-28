// ====== Book Data ======
const books = [

  {
    title: "The Lightning Thief",
    genre: "Book Recommendation",
    cover: "Media/Covers/PJ.jpg",
    description: "The first Percy Jackson book — a modern-day teen discovers he’s a demigod and begins an epic quest.",
    pdfUrl: "Media/Books/PJ.pdf"
  },
  {
    title: "The Sea of Monsters",
    genre: "Book Recommendation",
    cover: "Media/Covers/PJ2.jpg",
    description: "Percy Jackson returns for another mythic quest across dangerous seas to save Camp Half-Blood.",
    pdfUrl: "Media/Books/PJ2.pdf"
  },
  {
    title: "The Titan's Curse",
    genre: "Book Recommendation",
    cover: "Media/Covers/PJ3.jpg",
    description: "A darker Percy Jackson installment where new threats emerge and loyalties are tested.",
    pdfUrl: "Media/Books/PJ3.pdf"
  },
  {
    title: "The Battle of the Labyrinth",
    genre: "Book Recommendation",
    cover: "Media/Covers/PJ4.jpg",
    description: "A fast-paced Percy Jackson adventure involving traps, monsters, and a race to stop a dangerous invasion.",
    pdfUrl: "Media/Books/PJ4.pdf"
  },
  {
    title: "The Last Olympian",
    genre: "Book Recommendation",
    cover: "Media/Covers/PJ5.jpg",
    description: "The climactic Percy Jackson finale — high-stakes heroism, ancient gods, and the defense of Olympus.",
    pdfUrl: "Media/Books/PJ5.pdf"
  },
  {
    title: "All You Need Is Kill",
    genre: "Novel",
    cover: "Media/Covers/ALL.JPG",
    description: "A high-octane military sci-fi about a soldier trapped in a time loop fighting an alien invasion.",
    pdfUrl: "Media/Books/AYNSK.pdf"
  },
  {
    title: "Atomic Habits: An Easy & Proven Way to Build Good Habits & Break Bad Ones",
    genre: "Educational",
    cover: "Media/Covers/atomic.jpg",
    description: "Practical, step-by-step strategies to build small habits that compound into big results.",
    pdfUrl: "Media/Books/ATOMIC.pdf"
  },
  {
    title: "Workbook for James Clear’s Atomic Habits: The Step By Step Guide",
    genre: "Educational",
    cover: "Media/Covers/workbook.jpg",
    description: "A practical workbook with exercises and templates to implement Atomic Habits' ideas.",
    pdfUrl: "Media/Education/WORKBOOKATOMIC.pdf"
  },
  {
    title: "Dune",
    genre: "Novel",
    cover: "Media/Covers/dune1.png",
    description: "Epic science fiction about politics, religion, and ecology on the desert world Arrakis.",
    pdfUrl: "Media/Books/DUNE1.pdf"
  },
  {
    title: "Fahrenheit 451",
    genre: "Novel",
    cover: "Media/Covers/f451.jpg",
    description: "A classic dystopia about censorship, book-burning, and the power of ideas.",
    pdfUrl: "Media/Books/F451.pdf"
  },
  {
    title: "Ikigai",
    genre: "Novel",
    cover: "Media/Covers/ikigai.jpg",
    description: "A concise exploration of Japanese principles for finding purpose and a fulfilling life.",
    pdfUrl: "Media/Books/IKIGAI.pdf"
  },
  {
    title: "Project Hail Mary",
    genre: "Novel",
    cover: "Media/Covers/phm.jpg",
    description: "A lone astronaut wakes with no memory and must save Earth using unexpected science and friendship.",
    pdfUrl: "Media/Books/PHM.pdf"
  },
  {
    title: "Sherlock Holmes (Collected/Stories)",
    genre: "Novel",
    cover: "Media/Covers/sh.jpg",
    description: "Classic detective cases featuring Holmes’ brilliant observation and deductive reasoning.",
    pdfUrl: "Media/Books/SH.pdf"
  },
  {
    title: "The Bell Jar",
    genre: "Novel",
    cover: "Media/Covers/tbj.jpg",
    description: "A powerful, semi-autobiographical novel about a young woman’s mental health and identity.",
    pdfUrl: "Media/Books/TBJ.pdf"
  },
  {
    title: "The Catcher in the Rye",
    genre: "Novel",
    cover: "Media/Covers/THC.jpg",
    description: "A coming-of-age tale exploring teenage alienation, authenticity, and moral confusion.",
    pdfUrl: "Media/Books/Catcher.pdf"
  },
  {
    title: "The Stranger",
    genre: "Novel",
    cover: "Media/Covers/str.jpg",
    description: "Albert Camus’ existential classic about absurdity, alienation, and moral consequence.",
    pdfUrl: "Media/Books/STRANGER.pdf"
  },
  {
    title: "The Sympathizer",
    genre: "Novel",
    cover: "Media/Covers/symp.jpg",
    description: "A sharp, darkly comic spy novel examining identity, politics, and the aftermath of war.",
    pdfUrl: "Media/Books/SYMPHATIZER.pdf"
  },
  {
    title: "The Unabridged Journals of Sylvia Plath",
    genre: "Book Recommendation",
    cover: "Media/Covers/sylv.jpg",
    description: "Intimate journal entries revealing the private thoughts and craft of a major poet.",
    pdfUrl: "Media/Books/SYLVIAPLATH.pdf"
  },
  {
    title: "To Kill a Mockingbird",
    genre: "Book Recommendation",
    cover: "Media/Covers/kill.jpg",
    description: "A powerful story of racial injustice and moral growth in the American South.",
    pdfUrl: "Media/Books/MOCKINGBIRD.pdf"
  },
  {
    title: "White Nights",
    genre: "Book Recommendation",
    cover: "Media/Covers/whiteknights.jpg",
    description: "A lyrical short story about loneliness, fleeting love, and yearning in the city.",
    pdfUrl: "Media/Books/whitenights.pdf"
  },
  {
    title: "Amazing Spider-Man #14 (2025) (Digital)",
    genre: "Graphic Novel",
    cover: "Media/Covers/sp.jpg",
    description: "A modern Spider-Man comic issue packed with action, character moments, and dynamic art.",
    pdfUrl: "Media/Comics/SPIDERMAN.pdf"
  },
  {
    title: "Captain America #4 (2025) (Digital)",
    genre: "Graphic Novel",
    cover: "Media/Covers/CA.jpg",
    description: "A contemporary Captain America issue featuring moral conflict and high-stakes heroics.",
    pdfUrl: "Media/Comics/CAPTAINAMERICA.pdf"
  },
  {
    title: "Fantastic Four – Gargoyles #1 (2025) (Digital)",
    genre: "Graphic Novel",
    cover: "Media/Covers/f4.jpg",
    description: "The Fantastic Four face supernatural threats and strange new allies in this action-packed issue.",
    pdfUrl: "Media/Comics/F4.pdf"
  },
  {
    title: "Incredible Hulk #30 (2025) (Digital)",
    genre: "Graphic Novel",
    cover: "Media/Covers/hulk.webp",
    description: "A Hulk comic with explosive conflict, dramatic stakes, and intense physical spectacle.",
    pdfUrl: "Media/Comics/HULK.pdf"
  },
  {
    title: "One World Under Doom #8 (2025) (Digital)",
    genre: "Graphic Novel",
    cover: "Media/Covers/doom.jpg",
    description: "A high-energy comic issue with global-scale threats and superheroic responses.",
    pdfUrl: "Media/Comics/DOOM.pdf"
  },
  {
    title: "Strange Tales #1 (2025) (Digital)",
    genre: "Graphic Novel",
    cover: "Media/Covers/strt.jpg",
    description: "An anthology-style comic featuring eerie, bizarre, or supernatural short stories.",
    pdfUrl: "Media/Comics/STRANGETALES.pdf"
  },
  {
    title: "Ultimate Black Panther #21 (2025) (Digital)",
    genre: "Graphic Novel",
    cover: "Media/Covers/BP.jpg",
    description: "A modern Black Panther issue focusing on leadership, tech, and royal responsibility.",
    pdfUrl: "Media/Comics/BP.pdf"
  },
  {
    title: "Collected Works of Karl Marx (Illustrated)",
    genre: "Educational",
    cover: "Media/Covers/karl.jpg",
    description: "A comprehensive illustrated compilation of influential works on economics and society.",
    pdfUrl: "Media/Education/KARLMARX.pdf"
  },
  {
    title: "Rich Dad Poor Dad",
    genre: "Educational",
    cover: "Media/Covers/rich.png",
    description: "A personal-finance classic contrasting two mindsets about money, investing, and wealth-building.",
    pdfUrl: "Media/Education/RICHDADDY.pdf"
  },
  {
    title: "Slow Productivity: The Lost Art of Accomplishment Without Burnout",
    genre: "Educational",
    cover: "Media/Covers/slow.jpg",
    description: "Guidance on doing meaningful work by prioritizing focus, rest, and sustainable productivity.",
    pdfUrl: "Media/Education/SLOWPRODUCTIVITY.pdf"
  }
];

// ====== DOM Elements ======
const grids = {
  recommendationGrid: "Book Recommendation",
  educationalGrid: "Educational",
  novelGrid: "Novel",
  graphicNovelGrid: "Graphic Novel"
};

const modal = document.getElementById("bookPreviewModal");
const closeModal = document.getElementById("closeModal");
const addBookBtn = document.getElementById("addBookBtn");
let selectedBook = null;

// ====== 🧠 PLAN VALIDATION ======
let userPlan = sessionStorage.getItem("user_plan") || localStorage.getItem("user_plan");

if (!userPlan) {
  userPlan = "Basic"; // default for demo
  sessionStorage.setItem("user_plan", userPlan);
}

userPlan = userPlan.trim().toLowerCase();
console.log("📘 Current plan:", userPlan);

const allowedGenres = {
  basic: ["educational"],
  standard: ["educational", "novel"],
  premium: ["educational", "novel", "graphic novel"]
};

function requiredPlan(genre) {
  const g = genre.toLowerCase();
  if (g === "educational") return "Basic";
  if (g === "novel") return "Standard";
  if (g === "graphic novel") return "Premium";
  return "Premium";
}

// ====== Render Books ======
function loadBooks() {
  Object.entries(grids).forEach(([gridId, category]) => {
    const grid = document.getElementById(gridId);
    grid.innerHTML = "";
    books
      .filter(book => book.genre === category)
      .forEach(book => {
        const card = document.createElement("div");
        card.classList.add("book-card");
        card.innerHTML = `<img src="${book.cover}" alt="${book.title}">`;

        const genre = book.genre.toLowerCase();
        const isAllowed = allowedGenres[userPlan]?.includes(genre);

        if (!isAllowed) {
          card.style.filter = "grayscale(100%) brightness(0.6)";
          card.style.cursor = "not-allowed";
          card.title = `Upgrade to ${requiredPlan(book.genre)} to access this book.`;

          card.addEventListener("click", () => {
            const warningModal = document.getElementById("warningModal");
            const warningMessage = document.getElementById("warningMessage");
            const closeWarning = document.getElementById("closeWarning");
            const okBtn = document.getElementById("warningOkBtn");

             warningMessage.textContent = `"${book.title}" is not available in your current plan (${userPlan.toUpperCase()}). Upgrade to ${requiredPlan(book.genre)} to unlock this genre!`;
             warningModal.style.display = "block";

            const close = () => (warningModal.style.display = "none");
            closeWarning.onclick = close;
            okBtn.onclick = close;
            window.onclick = e => {
    if (e.target === warningModal) close();
  };
});
        } else {
          card.addEventListener("click", () => openPreview(book));
        }

        grid.appendChild(card);
      });
  });
}

// ====== Modal Logic ======
function openPreview(book) {
  selectedBook = book;
  document.getElementById("previewCover").src = book.cover;
  document.getElementById("previewTitle").textContent = book.title;
  document.getElementById("previewGenre").textContent = book.genre;
  document.getElementById("previewDescription").textContent = book.description;
  document.getElementById("viewBookBtn").href = book.pdfUrl;
  modal.style.display = "block";
}

closeModal.addEventListener("click", () => {
  modal.style.display = "none";
});

window.addEventListener("click", e => {
  if (e.target === modal) modal.style.display = "none";
});

addBookBtn.addEventListener("click", () => {
  alert(`${selectedBook.title} has been added to your My Books!`);
  modal.style.display = "none";
});

const closeModalBtn = document.getElementById("closeModal");
closeModalBtn.addEventListener("click", () => {
  modal.style.display = "none";
  selectedBook = null;
});

// ====== Initialize ======
loadBooks();

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

