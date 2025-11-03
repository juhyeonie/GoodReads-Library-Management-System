let currentChapter = 0;
let currentSlide = 0;
let totalSlides = 0;
let slidePages = [];
let totalChapters = 9;
let currentTheme = 'light';
let currentFontSize = 18;
let currentMode = 'scroll';
let tocOpen = false;
let currentSearchTerm = '';

// Elements
const body = document.body;
const hamburgerBtn = document.getElementById('hamburgerBtn');
const tocSidebar = document.getElementById('tocSidebar');
const bookInfoHeader = document.getElementById('bookInfoHeader');
const tocItems = document.querySelectorAll('.toc-item');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const themeBtn = document.getElementById('themeBtn');
const fontBtn = document.getElementById('fontBtn');
const modeBtn = document.getElementById('modeBtn');
const searchBtn = document.getElementById('searchBtn');
const closeBtn = document.getElementById('closeBtn');
const fontDropdown = document.getElementById('fontDropdown');
const modeDropdown = document.getElementById('modeDropdown');
const searchDropdown = document.getElementById('searchDropdown');
const readingArea = document.getElementById('readingArea');
const contentWrapper = document.getElementById('contentWrapper');
const scrollContent = document.getElementById('scrollContent');
const slideContent = document.getElementById('slideContent');
const chapters = document.querySelectorAll('.chapter');
const decreaseFont = document.getElementById('decreaseFont');
const increaseFont = document.getElementById('increaseFont');
const fontSizeDisplay = document.getElementById('fontSizeDisplay');
const fontSelect = document.getElementById('fontSelect');
const modeToggleBtns = document.querySelectorAll('.mode-toggle-btn');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const nextPageIndicator = document.getElementById('nextPageIndicator');
const scrollNextBtn = document.getElementById('scrollNextBtn');
const slidePrevBtn = document.getElementById('slidePrevBtn');
const slideNextBtn = document.getElementById('slideNextBtn');
const pageIndicator = document.getElementById('pageIndicator');

// Toggle TOC Sidebar
hamburgerBtn.addEventListener('click', () => {
tocOpen = !tocOpen;
tocSidebar.classList.toggle('open');
bookInfoHeader.classList.toggle('hidden');
closeAllDropdowns();
});

// TOC Navigation
tocItems.forEach(item => {
item.addEventListener('click', () => {
    const chapterNum = parseInt(item.dataset.chapter);
    goToChapter(chapterNum);
    
    // Update active state
    tocItems.forEach(t => t.classList.remove('active'));
    item.classList.add('active');
    
    // Close TOC on mobile
    if (window.innerWidth <= 768) {
    tocSidebar.classList.remove('open');
    bookInfoHeader.classList.remove('hidden');
    tocOpen = false;
    }
});
});

// Page Navigation Functions
function goToChapter(chapterNum, highlightTerm = '') {
if (chapterNum < 0 || chapterNum >= totalChapters) return;

currentChapter = chapterNum;

if (currentMode === 'slide') {
    // Find the first slide of this chapter
    let slideIndex = 0;
    for (let i = 0; i < slidePages.length; i++) {
    if (slidePages[i].chapter === chapterNum) {
        slideIndex = i;
        break;
    }
    }
    goToSlide(slideIndex);
} else {
    // Clear previous highlights
    clearHighlights();
    
    // Scroll mode - scroll to the chapter
    const targetChapter = document.querySelector(`.chapter[data-chapter="${chapterNum}"]`);
    if (targetChapter) {
    targetChapter.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    // Highlight the search term if provided
    if (highlightTerm) {
        setTimeout(() => {
        highlightSearchTerm(targetChapter, highlightTerm);
        }, 500);
    }
    }
}

updateTOCActive();
updateHeaderNav();
}

function clearHighlights() {
const allHighlights = scrollContent.querySelectorAll('.highlight');
allHighlights.forEach(highlight => {
    const parent = highlight.parentNode;
    parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
    parent.normalize();
});
}

function highlightSearchTerm(container, searchTerm) {
if (!searchTerm) return;

const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    null,
    false
);

const nodesToReplace = [];
let node;

while (node = walker.nextNode()) {
    if (node.nodeValue.toLowerCase().includes(searchTerm.toLowerCase())) {
    nodesToReplace.push(node);
    }
}

nodesToReplace.forEach(textNode => {
    const span = document.createElement('span');
    span.innerHTML = textNode.nodeValue.replace(
    new RegExp(`(${searchTerm})`, 'gi'),
    '<span class="highlight">$1</span>'
    );
    textNode.parentNode.replaceChild(span, textNode);
});
}

function goToSlide(slideIndex) {
if (slideIndex < 0 || slideIndex >= totalSlides) return;

currentSlide = slideIndex;
currentChapter = slidePages[slideIndex].chapter;

// Hide all slides
const allSlides = slideContent.querySelectorAll('.slide-page');
allSlides.forEach(slide => slide.classList.remove('active'));

// Show current slide
const activeSlide = slideContent.querySelector(`[data-slide="${currentSlide}"]`);
if (activeSlide) {
    activeSlide.classList.add('active');
}

updateSlideNav();
updateTOCActive();
updateHeaderNav();
}

function updateTOCActive() {
tocItems.forEach(item => {
    if (parseInt(item.dataset.chapter) === currentChapter) {
    item.classList.add('active');
    } else {
    item.classList.remove('active');
    }
});
}

function updateHeaderNav() {
if (currentMode === 'slide') {
    prevBtn.disabled = currentSlide === 0;
    nextBtn.disabled = currentSlide === totalSlides - 1;
} else {
    prevBtn.disabled = currentChapter === 0;
    nextBtn.disabled = currentChapter === totalChapters - 1;
}
}

function updateSlideNav() {
slidePrevBtn.disabled = currentSlide === 0;
slideNextBtn.disabled = currentSlide === totalSlides - 1;
pageIndicator.textContent = `${currentSlide + 1} / ${totalSlides}`;
}

// Header Navigation Buttons
prevBtn.addEventListener('click', () => {
if (currentMode === 'slide') {
    if (currentSlide > 0) {
    goToSlide(currentSlide - 1);
    }
} else {
    if (currentChapter > 0) {
    goToChapter(currentChapter - 1);
    }
}
});

nextBtn.addEventListener('click', () => {
if (currentMode === 'slide') {
    if (currentSlide < totalSlides - 1) {
    goToSlide(currentSlide + 1);
    }
} else {
    if (currentChapter < totalChapters - 1) {
    goToChapter(currentChapter + 1);
    }
}
});

// Slide Navigation Buttons
slidePrevBtn.addEventListener('click', () => {
if (currentSlide > 0) {
    goToSlide(currentSlide - 1);
}
});

slideNextBtn.addEventListener('click', () => {
if (currentSlide < totalSlides - 1) {
    goToSlide(currentSlide + 1);
}
});

// Scroll Mode Next Button
scrollNextBtn.addEventListener('click', () => {
if (currentChapter < totalChapters - 1) {
    goToChapter(currentChapter + 1);
}
});

// Detect scroll position in scroll mode
readingArea.addEventListener('scroll', () => {
if (currentMode === 'scroll') {
    const scrollTop = readingArea.scrollTop;
    const scrollHeight = readingArea.scrollHeight;
    const clientHeight = readingArea.clientHeight;
    
    // Show next button when near bottom
    if (scrollHeight - scrollTop - clientHeight < 100 && currentChapter < totalChapters - 1) {
    nextPageIndicator.classList.add('show');
    } else {
    nextPageIndicator.classList.remove('show');
    }

    // Update current chapter based on scroll position
    let foundChapter = currentChapter;
    chapters.forEach((chapter, index) => {
    const rect = chapter.getBoundingClientRect();
    if (rect.top <= 100 && rect.bottom > 100) {
        foundChapter = index;
    }
    });
    
    if (foundChapter !== currentChapter) {
    currentChapter = foundChapter;
    updateTOCActive();
    updateHeaderNav();
    }
}
});

// Theme Toggle
themeBtn.addEventListener('click', () => {
if (currentTheme === 'light') {
// Switch to dark mode
currentTheme = 'dark';
body.classList.remove('light-mode');
body.classList.add('dark-mode');
// Update the icon to moon
themeBtn.innerHTML = '<i data-feather="moon"></i>';
themeBtn.classList.add('active');
} else {
// Switch to light mode
currentTheme = 'light';
body.classList.remove('dark-mode');
body.classList.add('light-mode');
// Update the icon to sun
themeBtn.innerHTML = '<i data-feather="sun"></i>';
themeBtn.classList.remove('active');
}
// Re-initialize feather icons after changing the icon
feather.replace();
closeAllDropdowns();
});
// Dropdown Management
function closeAllDropdowns() {
fontDropdown.classList.remove('active');
modeDropdown.classList.remove('active');
searchDropdown.classList.remove('active');
}

fontBtn.addEventListener('click', (e) => {
e.stopPropagation();
const isOpen = fontDropdown.classList.contains('active');
closeAllDropdowns();
if (!isOpen) {
    fontDropdown.classList.add('active');
}
});

modeBtn.addEventListener('click', (e) => {
e.stopPropagation();
const isOpen = modeDropdown.classList.contains('active');
closeAllDropdowns();
if (!isOpen) {
    modeDropdown.classList.add('active');
}
});

searchBtn.addEventListener('click', (e) => {
e.stopPropagation();
const isOpen = searchDropdown.classList.contains('active');
closeAllDropdowns();
if (!isOpen) {
    searchDropdown.classList.add('active');
    searchInput.focus();
}
});

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
if (!e.target.closest('.icon-btn') && !e.target.closest('.dropdown-menu')) {
    closeAllDropdowns();
}
});

// Font Size Control
decreaseFont.addEventListener('click', () => {
if (currentFontSize > 10) {
    currentFontSize -= 1;
    updateFontSize();
}
});

increaseFont.addEventListener('click', () => {
if (currentFontSize < 50) {
    currentFontSize += 1;
    updateFontSize();
}
});

function updateFontSize() {
contentWrapper.style.fontSize = currentFontSize + 'px';
fontSizeDisplay.textContent = currentFontSize + 'px';

// Regenerate slides if in slide mode
if (currentMode === 'slide') {
    setTimeout(() => {
    generateSlidePages();
    goToSlide(currentSlide);
    }, 100);
}
}

// Font Family Control
fontSelect.addEventListener('change', (e) => {
contentWrapper.style.fontFamily = e.target.value;

// Regenerate slides if in slide mode
if (currentMode === 'slide') {
    setTimeout(() => {
    generateSlidePages();
    goToSlide(currentSlide);
    }, 100);
}
});

// Generate Slide Pages
function generateSlidePages() {
slidePages = [];
slideContent.innerHTML = '';

const tempDiv = document.createElement('div');
tempDiv.style.cssText = `
    position: absolute;
    left: -9999px;
    width: ${contentWrapper.clientWidth}px;
    font-size: ${currentFontSize}px;
    line-height: 1.8;
    font-family: ${contentWrapper.style.fontFamily || 'Georgia, serif'};
`;
document.body.appendChild(tempDiv);

const availableHeight = readingArea.clientHeight - 80; // Subtract bottom nav height

chapters.forEach((chapter, chapterIndex) => {
    const title = chapter.querySelector('h2').cloneNode(true);
    const paragraphs = Array.from(chapter.querySelectorAll('p'));
    
    let currentPageContent = [];
    let currentHeight = 0;
    
    // Add title to first page of chapter
    tempDiv.innerHTML = '';
    tempDiv.appendChild(title.cloneNode(true));
    const titleHeight = tempDiv.offsetHeight + 20; // Add margin
    currentHeight += titleHeight;
    currentPageContent.push({ type: 'title', content: title.innerHTML });
    
    paragraphs.forEach((para, paraIndex) => {
    tempDiv.innerHTML = '';
    const paraClone = para.cloneNode(true);
    tempDiv.appendChild(paraClone);
    const paraHeight = tempDiv.offsetHeight + 20; // Add margin
    
    if (currentHeight + paraHeight > availableHeight) {
        // Create new page with current content
        createSlidePage(chapterIndex, currentPageContent);
        
        // Start new page
        currentPageContent = [{ type: 'paragraph', content: para.innerHTML }];
        currentHeight = paraHeight;
    } else {
        currentPageContent.push({ type: 'paragraph', content: para.innerHTML });
        currentHeight += paraHeight;
    }
    });
    
    // Create last page of chapter
    if (currentPageContent.length > 0) {
    createSlidePage(chapterIndex, currentPageContent);
    }
});

document.body.removeChild(tempDiv);
totalSlides = slidePages.length;
}

function createSlidePage(chapterIndex, content) {
const pageDiv = document.createElement('div');
pageDiv.className = 'slide-page';
pageDiv.dataset.slide = slidePages.length;

content.forEach(item => {
    if (item.type === 'title') {
    const h2 = document.createElement('h2');
    h2.innerHTML = item.content;
    pageDiv.appendChild(h2);
    } else {
    const p = document.createElement('p');
    p.innerHTML = item.content;
    pageDiv.appendChild(p);
    }
});

slideContent.appendChild(pageDiv);
slidePages.push({ chapter: chapterIndex, element: pageDiv });
}

// Reading Mode Toggle
modeToggleBtns.forEach(btn => {
btn.addEventListener('click', () => {
    const mode = btn.dataset.mode;
    currentMode = mode;
    
    // Update active state
    modeToggleBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Toggle classes
    if (mode === 'scroll') {
    readingArea.classList.remove('slide-mode');
    readingArea.classList.add('scroll-mode');
    
    scrollContent.style.display = 'block';
    slideContent.style.display = 'none';
    
    // Scroll to current chapter
    setTimeout(() => {
        const targetChapter = document.querySelector(`[data-chapter="${currentChapter}"]`);
        if (targetChapter) {
        targetChapter.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 100);
    
    } else {
    readingArea.classList.remove('scroll-mode');
    readingArea.classList.add('slide-mode');
    
    scrollContent.style.display = 'none';
    slideContent.style.display = 'block';
    
    // Generate slides and show current chapter
    generateSlidePages();
    
    // Find first slide of current chapter
    let slideIndex = 0;
    for (let i = 0; i < slidePages.length; i++) {
        if (slidePages[i].chapter === currentChapter) {
        slideIndex = i;
        break;
        }
    }
    goToSlide(slideIndex);
    }
    
    updateHeaderNav();
    closeAllDropdowns();
});
});

// Search Functionality
searchInput.addEventListener('input', (e) => {
const searchTerm = e.target.value.trim().toLowerCase();
currentSearchTerm = searchTerm;

if (searchTerm === '') {
    searchResults.innerHTML = '<div class="no-results">Enter a search term</div>';
    return;
}

const results = [];
chapters.forEach((chapter, index) => {
    const chapterText = chapter.textContent;
    const sentences = chapterText.split(/[.!?]+/);
    
    sentences.forEach(sentence => {
    const trimmedSentence = sentence.trim();
    if (trimmedSentence && trimmedSentence.toLowerCase().includes(searchTerm)) {
        results.push({
        chapter: index,
        text: trimmedSentence,
        title: chapter.querySelector('h2')?.textContent || `Chapter ${index + 1}`
        });
    }
    });
});

if (results.length === 0) {
    searchResults.innerHTML = '<div class="no-results">No results found</div>';
} else {
    searchResults.innerHTML = results.slice(0, 15).map((result, idx) => `
    <div class="search-result-item" data-chapter="${result.chapter}">
        <div class="search-result-text">${highlightText(result.text, searchTerm)}</div>
        <div class="search-result-page">${result.title}</div>
    </div>
    `).join('');
    
    document.querySelectorAll('.search-result-item').forEach(item => {
    item.addEventListener('click', () => {
        const chapterNum = parseInt(item.dataset.chapter);
        goToChapter(chapterNum, currentSearchTerm);
        closeAllDropdowns();
        
        if (tocOpen) {
        tocSidebar.classList.remove('open');
        bookInfoHeader.classList.remove('hidden');
        tocOpen = false;
        }
    });
    });
}
});

function highlightText(text, searchTerm) {
const regex = new RegExp(`(${searchTerm})`, 'gi');
return text.replace(regex, '<span class="highlight">$1</span>');
}

// Close Book
closeBtn.addEventListener('click', () => {
if (confirm('Are you sure you want to close this book?')) {
    window.history.back();
}
});

// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
    if (e.key === 'Escape') {
    closeAllDropdowns();
    e.target.blur();
    }
    return;
}

if (e.key === 'ArrowLeft') {
    if (currentMode === 'slide') {
    if (currentSlide > 0) goToSlide(currentSlide - 1);
    } else {
    if (currentChapter > 0) goToChapter(currentChapter - 1);
    }
} else if (e.key === 'ArrowRight') {
    if (currentMode === 'slide') {
    if (currentSlide < totalSlides - 1) goToSlide(currentSlide + 1);
    } else {
    if (currentChapter < totalChapters - 1) goToChapter(currentChapter + 1);
    }
}

if (e.key === 'Escape') {
    closeAllDropdowns();
    if (tocOpen) {
    tocSidebar.classList.remove('open');
    bookInfoHeader.classList.remove('hidden');
    tocOpen = false;
    }
}

if (e.key === 't' || e.key === 'T') {
    tocOpen = !tocOpen;
    tocSidebar.classList.toggle('open');
    bookInfoHeader.classList.toggle('hidden');
    closeAllDropdowns();
}

if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
    e.preventDefault();
    closeAllDropdowns();
    searchDropdown.classList.add('active');
    searchInput.focus();
}
}); 

// Initialize
updateHeaderNav();
fontSizeDisplay.textContent = currentFontSize + 'px';

if (window.feather) {
feather.replace();
}