// BookReader.js (ES module)
// Enforces plans:
// - Basic: 60 min/day, 30 pages/day (across all books). Theme toggle disabled. Bookmarks disabled. Likes disabled.
// - Standard: unlimited time/pages, can toggle theme (dark mode), likes/bookmarks disabled.
// - Premium: full features including bookmarks + like/dislike.

import * as pdfjsLib from './vendor/pdfjs/pdf.mjs';
pdfjsLib.GlobalWorkerOptions.workerSrc = './vendor/pdfjs/pdf.worker.mjs';

// ---------- CONFIG ----------
const DEFAULT_SCALE = 1.2;
const BASIC_DAILY_SECONDS = 60 * 60; // 60 minutes
const BASIC_DAILY_PAGE_LIMIT = 30;   // 30 pages per day across all books

// ---------- UTIL: read user plan ----------
function getUserPlan() {
  let plan = sessionStorage.getItem("user_plan") || localStorage.getItem("user_plan");
  if (!plan || plan === 'null') plan = "Basic";
  return plan.trim().toLowerCase().replace(/\s/g, '');
}
const userPlan = getUserPlan();
console.log('Reader started — userPlan =', userPlan);

// ---------- GET PDF QUERY ----------
function getQueryParam(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}
const rawPdfParam = getQueryParam('pdf');
const pdfUrl = rawPdfParam ? decodeURIComponent(rawPdfParam) : null;
if (!pdfUrl) {
  alert('No PDF specified. Open reader with BookReader.html?pdf=path/to/file.pdf');
  throw new Error('No pdf query parameter');
}
console.log('Loading PDF:', pdfUrl);

const storageKeyPrefix = 'gr_reader::' + pdfUrl;

// ---------- DOM ELEMENTS ----------
const body = document.body;
const btnToc = document.getElementById('btnToc');
const tocSidebar = document.getElementById('tocSidebar');
const tocList = document.getElementById('tocList');
const btnPrev = document.getElementById('btnPrev');
const btnNext = document.getElementById('btnNext');
const pageIndicator = document.getElementById('pageIndicator');
const btnTheme = document.getElementById('btnTheme');
const btnFont = document.getElementById('btnFont');
const btnMode = document.getElementById('btnMode');
const btnSearch = document.getElementById('btnSearch');
let btnBookmark = document.getElementById('btnBookmark');
const btnFullscreen = document.getElementById('btnFullscreen');
const btnClose = document.getElementById('btnClose');
const fontDropdown = document.getElementById('fontDropdown');
const modeDropdown = document.getElementById('modeDropdown');
const searchDropdown = document.getElementById('searchDropdown');
const decreaseFont = document.getElementById('decreaseFont');
const increaseFont = document.getElementById('increaseFont');
const fontSizeDisplay = document.getElementById('fontSizeDisplay');
const fontSelect = document.getElementById('fontSelect');
const modeToggleBtns = document.querySelectorAll('.mode-toggle-btn');
const searchInput = document.getElementById('searchInput');
const searchResultsContainer = document.getElementById('searchResultsContainer');
const readingArea = document.getElementById('readingArea');
const viewer = document.getElementById('viewer');
const nextPageIndicator = document.getElementById('nextPageIndicator');
const scrollNextBtn = document.getElementById('scrollNextBtn');
const pdfTitle = document.getElementById('pdfTitle');
const pdfAuthor = document.getElementById('pdfAuthor');

// small in-reader warning bar
let readerWarningBar = document.getElementById('readerWarningBar');
if (!readerWarningBar) {
  readerWarningBar = document.createElement('div');
  readerWarningBar.id = 'readerWarningBar';
  readerWarningBar.style.position = 'fixed';
  readerWarningBar.style.bottom = '16px';
  readerWarningBar.style.left = '50%';
  readerWarningBar.style.transform = 'translateX(-50%)';
  readerWarningBar.style.background = 'rgba(0,0,0,0.75)';
  readerWarningBar.style.color = '#fff';
  readerWarningBar.style.padding = '10px 14px';
  readerWarningBar.style.borderRadius = '8px';
  readerWarningBar.style.zIndex = '9999';
  readerWarningBar.style.display = 'none';
  document.body.appendChild(readerWarningBar);
}
function showReaderWarning(text, ms = 4000) {
  readerWarningBar.textContent = text;
  readerWarningBar.style.display = 'block';
  setTimeout(() => readerWarningBar.style.display = 'none', ms);
}

// ---------- STATE ----------
let pdfDoc = null;
let currentPage = 1;
let totalPages = 0;
let scale = DEFAULT_SCALE;
let currentFontSize = 12;
let currentTheme = localStorage.getItem(storageKeyPrefix + '::theme') || 'light';
let mode = localStorage.getItem(storageKeyPrefix + '::mode') || 'scroll';
let tocOpen = false;
let pageElements = [];
let pageTextContent = [];
let annotations = loadAnnotations();
let bookmarks = loadBookmarks();
let outline = null;
let textLayerActive = false;

// Reading time and pages viewed (per date, global across books)
function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
}
function readingTimeKey() { return `gr_readtime::${todayKey()}`; }         // seconds int
function pagesViewedKey() { return `gr_pages_viewed::${todayKey()}`; }      // object mapping keys to true

let readingSeconds = parseInt(localStorage.getItem(readingTimeKey()) || '0', 10) || 0;
let pagesViewed = {}; // object with keys `${pdfUrl}::${pageNum}` true
try {
  pagesViewed = JSON.parse(localStorage.getItem(pagesViewedKey()) || '{}') || {};
} catch(e) {
  pagesViewed = {};
}
function pagesViewedCount() {
  return Object.keys(pagesViewed).length;
}
function markPageViewed(pdf, pageNum) {
  const k = `${pdf}::${pageNum}`;
  if (!pagesViewed[k]) {
    pagesViewed[k] = true;
    localStorage.setItem(pagesViewedKey(), JSON.stringify(pagesViewed));
    return true;
  }
  return false; // already counted
}

// Initialize theme and mode classes
body.classList.add(currentTheme + '-mode');
if (currentTheme === 'dark') {
  if (btnTheme) btnTheme.innerHTML = '<i data-feather="moon"></i>';
}
if (mode === 'paginated') {
  readingArea.classList.remove('scroll-mode');
  readingArea.classList.add('paginated-mode');
  modeToggleBtns.forEach(btn => {
    if (btn.dataset.mode === 'paginated') btn.classList.add('active');
    else btn.classList.remove('active');
  });
} else {
  modeToggleBtns.forEach(btn => {
    if (btn.dataset.mode === 'scroll') btn.classList.add('active');
    else btn.classList.remove('active');
  });
}

// ---------- HELPERS ----------
function saveState() {
  localStorage.setItem(storageKeyPrefix + '::lastPage', currentPage);
  localStorage.setItem(storageKeyPrefix + '::scale', scale);
  localStorage.setItem(storageKeyPrefix + '::mode', mode);
  localStorage.setItem(storageKeyPrefix + '::theme', currentTheme);
  localStorage.setItem(storageKeyPrefix + '::fontSize', currentFontSize);
}

function loadAnnotations() {
  try { return JSON.parse(localStorage.getItem(storageKeyPrefix + '::annotations') || '[]'); } catch(e) { return []; }
}
function storeAnnotations() { localStorage.setItem(storageKeyPrefix + '::annotations', JSON.stringify(annotations)); }
function loadBookmarks() {
  try { return JSON.parse(localStorage.getItem(storageKeyPrefix + '::bookmarks') || '[]'); } catch(e) { return []; }
}
function storeBookmarks() { localStorage.setItem(storageKeyPrefix + '::bookmarks', JSON.stringify(bookmarks)); }
function addBookmark(page) {
  if (!bookmarks.includes(page)) {
    bookmarks.push(page);
    storeBookmarks();
    showReaderWarning('Bookmarked page ' + page, 2200);
  } else {
    showReaderWarning('Page ' + page + ' already bookmarked', 2200);
  }
}

// Gate bookmark to premium
function updateBookmarkAvailability() {
  const isPremium = (userPlan === 'premium' || userPlan === 'premiumplan');
  if (!btnBookmark) return;
  if (!isPremium) {
    btnBookmark.disabled = true;
    btnBookmark.title = 'Bookmarks available for Premium only';
    // show upgrade message when clicked
    btnBookmark.addEventListener('click', (e) => {
      e.preventDefault();
      showReaderWarning('Bookmarks are available for Premium users only. Upgrade to Premium to enable this feature.', 4000);
    }, { once: true });
  } else {
    // replace node to remove potential previous handlers
    const newBtn = btnBookmark.cloneNode(true);
    btnBookmark.parentNode.replaceChild(newBtn, btnBookmark);
    btnBookmark = document.getElementById('btnBookmark');
    btnBookmark.addEventListener('click', () => addBookmark(currentPage));
  }
}

// Gate theme toggle: only Standard and Premium can toggle
function updateThemeAvailability() {
  const isStandardOrPremium = (userPlan === 'standard' || userPlan === 'standardplan' || userPlan === 'premium' || userPlan === 'premiumplan');
  if (!btnTheme) return;
  if (!isStandardOrPremium) {
    // disable theme button
    btnTheme.disabled = true;
    btnTheme.title = 'Theme toggle is available for Standard and Premium users';
    btnTheme.addEventListener('click', (e) => {
      e.preventDefault();
      showReaderWarning('Theme toggle is available for Standard and Premium users. Upgrade to change themes.', 3500);
    }, { once: true });
  } else {
    // ensure the button performs theme switching (normal behavior)
    btnTheme.disabled = false;
    btnTheme.title = 'Toggle Theme';
    // (handler defined later in UI events; but enable it)
  }
}

// ---------- RENDER PAGE (same as before but we block new page renders when Basic daily pages exhausted) ----------
function renderPage(pageNum, container, opts = {}) {
  const userScale = opts.scaleOverride || scale;
  const reuseWrap = opts.reuseWrap || null;
  const outputScale = window.devicePixelRatio || 1;

  function doRender(pdfPage, wrap) {
    const unscaledViewport = pdfPage.getViewport({ scale: 1 });
    const containerWidth = Math.max(1, wrap.clientWidth || container.clientWidth || viewer.clientWidth);
    const baseScale = containerWidth / unscaledViewport.width;
    const finalScale = baseScale * userScale;
    const viewport = pdfPage.getViewport({ scale: finalScale });

    const canvasPixelWidth = Math.floor(viewport.width * outputScale);
    const canvasPixelHeight = Math.floor(viewport.height * outputScale);

    wrap.classList.remove('placeholder');

    let canvas = wrap.querySelector('canvas.pageCanvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.className = 'pageCanvas';
      canvas.style.display = 'block';
      wrap.appendChild(canvas);
    }

    const cssWidth = Math.round(viewport.width);
    const cssHeight = Math.round(viewport.height);

    canvas.width = Math.floor(viewport.width * outputScale);
    canvas.height = Math.floor(viewport.height * outputScale);
    canvas.style.width = cssWidth + 'px';
    canvas.style.height = cssHeight + 'px';
    wrap.style.width = cssWidth + 'px';
    wrap.style.height = cssHeight + 'px';

    let textLayerDiv = wrap.querySelector('.textLayer');
    if (!textLayerDiv) {
      textLayerDiv = document.createElement('div');
      textLayerDiv.className = 'textLayer';
      textLayerDiv.style.left = 0;
      textLayerDiv.style.top = 0;
      textLayerDiv.style.width = '100%';
      textLayerDiv.style.pointerEvents = textLayerActive ? 'auto' : 'none';
      wrap.appendChild(textLayerDiv);
    }
    textLayerDiv.style.height = Math.round(viewport.height) + 'px';

    const ctx = canvas.getContext('2d');
    ctx.setTransform(outputScale, 0, 0, outputScale, 0, 0);

    const renderContext = { canvasContext: ctx, viewport };

    if (wrap._renderTask && typeof wrap._renderTask.cancel === 'function') {
      try { wrap._renderTask.cancel(); } catch(e) {}
    }

    const renderTask = pdfPage.render(renderContext);
    wrap._renderTask = renderTask;

    return renderTask.promise.then(() => {
      return pdfPage.getTextContent().then(textContent => {
        pageTextContent[pageNum - 1] = textContent.items.map(i => i.str).join(' ');
        textLayerDiv.innerHTML = '';
        textContent.items.forEach(item => {
          const span = document.createElement('span');
          span.textContent = item.str;
          span.style.display = 'inline-block';
          textLayerDiv.appendChild(span);
        });

        wrap.dataset.rendered = 'true';
        wrap.classList.add('rendered');
        pageElements[pageNum - 1] = { pageNum, canvas, wrap, textLayerDiv };

        if (textLayerActive) textLayerDiv.classList.add('visible');

        // Mark this page as viewed for Basic counting (only if Basic plan)
        if (userPlan === 'basic') {
          const newlyCounted = markPageViewed(pdfUrl, pageNum);
          if (newlyCounted) {
            // if we just incremented and we've reached the limit, show a message
            if (pagesViewedCount() >= BASIC_DAILY_PAGE_LIMIT) {
              showReaderWarning(`You've reached your ${BASIC_DAILY_PAGE_LIMIT} pages/day limit for Basic plan. Upgrade to continue reading.`, 6000);
            }
          }
        }

        return wrap;
      });
    }).catch(err => {
      console.warn('renderPage error', err);
      throw err;
    });
  }

  if (reuseWrap) {
    return pdfDoc.getPage(pageNum).then(pdfPage => doRender(pdfPage, reuseWrap));
  }

  const wrap = document.createElement('div');
  wrap.className = 'pageCanvasWrap placeholder';
  wrap.style.width = '100%';
  wrap.style.minHeight = '120px';
  wrap.dataset.pageNumber = pageNum;
  container.appendChild(wrap);

  return pdfDoc.getPage(pageNum).then(pdfPage => doRender(pdfPage, wrap));
}

// Intersection observer lazy-render
let pageObserver = null;
function createObserver() {
  if (pageObserver) return;
  const options = { 
    root: readingArea, 
    rootMargin: '400px 0px 400px 0px', 
    threshold: 0.01 
  };
  pageObserver = new IntersectionObserver(onPageIntersect, options);
}
function onPageIntersect(entries) {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const wrap = entry.target;
      const pageNum = parseInt(wrap.dataset.pageNumber, 10);

      // If Basic: check daily seconds and pages limit before rendering
      if (userPlan === 'basic') {
        if (readingSeconds >= BASIC_DAILY_SECONDS) {
          wrap.innerHTML = `<div style="padding:40px;text-align:center;color:#666">Daily reading time limit reached (60 minutes). Upgrade to continue reading.</div>`;
          wrap.classList.remove('placeholder');
          if (pageObserver) pageObserver.unobserve(wrap);
          return;
        }
        // if page would exceed daily page limit, block it
        const alreadyViewedKey = `${pdfUrl}::${pageNum}`;
        const alreadyViewed = !!pagesViewed[alreadyViewedKey];
        if (!alreadyViewed && pagesViewedCount() >= BASIC_DAILY_PAGE_LIMIT) {
          wrap.innerHTML = `<div style="padding:40px;text-align:center;color:#666">Daily page limit reached (${BASIC_DAILY_PAGE_LIMIT} pages). Upgrade to continue reading.</div>`;
          wrap.classList.remove('placeholder');
          if (pageObserver) pageObserver.unobserve(wrap);
          return;
        }
      }

      if (!wrap.dataset.rendered) {
        renderPage(pageNum, viewer, { reuseWrap: wrap }).then(() => {
          if (pageObserver) pageObserver.unobserve(wrap);
        }).catch(err => {
          console.error('Page render failed', pageNum, err);
        });
      } else {
        if (pageObserver) pageObserver.unobserve(wrap);
      }
    }
  });
}

function renderAllPages() {
  viewer.innerHTML = '';
  pageElements = [];
  createObserver();

  for (let i = 1; i <= totalPages; i++) {
    const placeholder = document.createElement('div');
    placeholder.className = 'pageCanvasWrap placeholder';
    placeholder.style.width = '100%';
    placeholder.style.height = '800px';
    placeholder.dataset.pageNumber = i;
    viewer.appendChild(placeholder);
    if (pageObserver) pageObserver.observe(placeholder);
  }

  setTimeout(() => {
    const el = viewer.querySelector(`[data-page-number='${currentPage}']`);
    if (el) el.scrollIntoView({ behavior: 'auto', block: 'start' });
  }, 50);
}

function goToPage(n, smooth = true) {
  if (!pdfDoc) return;
  if (n < 1) n = 1;
  if (n > totalPages) n = totalPages;

  // Basic checks: time + pages
  if (userPlan === 'basic') {
    if (readingSeconds >= BASIC_DAILY_SECONDS) {
      showReaderWarning('Daily reading time limit reached (60 minutes). Upgrade to continue reading today.', 6000);
      return;
    }
    const alreadyViewedKey = `${pdfUrl}::${n}`;
    const alreadyViewed = !!pagesViewed[alreadyViewedKey];
    if (!alreadyViewed && pagesViewedCount() >= BASIC_DAILY_PAGE_LIMIT) {
      showReaderWarning(`Daily page limit reached (${BASIC_DAILY_PAGE_LIMIT} pages). Upgrade to continue reading.`, 6000);
      return;
    }
  }

  currentPage = n;
  pageIndicator.textContent = `${currentPage} / ${totalPages}`;
  saveState();

  if (mode === 'paginated') {
    renderSinglePage(currentPage);
  } else {
    const el = viewer.querySelector(`[data-page-number='${currentPage}']`);
    if (el) el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
  }

  updateNavButtons();
}

function renderSinglePage(pageNum) {
  // Basic checks
  if (userPlan === 'basic') {
    if (readingSeconds >= BASIC_DAILY_SECONDS) {
      viewer.innerHTML = `<div style="padding:40px;text-align:center;color:#666">Daily reading time limit reached (60 minutes). Upgrade to continue reading.</div>`;
      return;
    }
    const alreadyViewedKey = `${pdfUrl}::${pageNum}`;
    const alreadyViewed = !!pagesViewed[alreadyViewedKey];
    if (!alreadyViewed && pagesViewedCount() >= BASIC_DAILY_PAGE_LIMIT) {
      viewer.innerHTML = `<div style="padding:40px;text-align:center;color:#666">Daily page limit reached (${BASIC_DAILY_PAGE_LIMIT} pages). Upgrade to continue reading.</div>`;
      return;
    }
  }

  viewer.innerHTML = '';
  renderPage(pageNum, viewer).then(wrap => {
    viewer.appendChild(wrap);
  });
}

function updateNavButtons() {
  btnPrev.disabled = currentPage === 1;
  // Next disabled if at end or basic and pages would be blocked
  const atEnd = currentPage === totalPages;
  if (userPlan === 'basic') {
    const nextWouldBeBlocked = !(() => {
      const nextKey = `${pdfUrl}::${currentPage + 1}`;
      const alreadyViewed = !!pagesViewed[nextKey];
      if (readingSeconds >= BASIC_DAILY_SECONDS) return false;
      if (!alreadyViewed && pagesViewedCount() >= BASIC_DAILY_PAGE_LIMIT) return false;
      return true;
    })();
    btnNext.disabled = atEnd || nextWouldBeBlocked;
  } else {
    btnNext.disabled = atEnd;
  }
}

// ---------- SEARCH (unchanged) ----------
function searchAll(term) {
  if (!term) {
    searchResultsContainer.innerHTML = '<div class="no-results">Enter a search term</div>';
    return;
  }

  const results = [];
  const q = term.toLowerCase();

  for (let i = 0; i < pageTextContent.length; i++) {
    const t = (pageTextContent[i] || '').toLowerCase();
    if (t.includes(q)) {
      const idx = t.indexOf(q);
      const start = Math.max(0, idx - 40);
      const snippet = (pageTextContent[i] || '').substring(start, start + 160);
      results.push({ page: i + 1, snippet: snippet.replace(/\n/g, ' '), text: snippet });
    }
  }

  if (results.length === 0) {
    searchResultsContainer.innerHTML = '<div class="no-results">No results found</div>';
  } else {
    searchResultsContainer.innerHTML = results.slice(0, 15).map(r => `
      <div class="search-result-item" data-page="${r.page}">
        <div class="search-result-text">${highlightText(escapeHtml(r.text), term)}</div>
        <div class="search-result-page">Page ${r.page}</div>
      </div>
    `).join('');

    searchResultsContainer.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', () => {
        const page = parseInt(item.dataset.page, 10);
        goToPage(page);
        closeAllDropdowns();
      });
    });
  }
}

function highlightText(text, searchTerm) {
  const regex = new RegExp(`(${escapeRegex(searchTerm)})`, 'gi');
  return text.replace(regex, '<span class="highlight">$1</span>');
}
function escapeHtml(s) { return (s+'').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot'}[c])); }
function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// ---------- TOC (unchanged) ----------
function renderOutline() {
  tocList.innerHTML = '';
  if (!outline || outline.length === 0) {
    tocList.innerHTML = '<li class="toc-item">No outline available</li>';
    return;
  }

  function goToDest(dest) {
    if (!dest) return Promise.reject(new Error('No dest provided'));

    if (typeof dest === 'string') {
      return pdfDoc.getDestination(dest).then(destArr => {
        if (!destArr) throw new Error('Named destination resolved to null');
        const pageRef = destArr[0];
        return pdfDoc.getPageIndex(pageRef).then(idx => idx + 1);
      });
    }

    if (Array.isArray(dest)) {
      const pageRef = dest[0];
      if (typeof pageRef === 'object') {
        return pdfDoc.getPageIndex(pageRef).then(idx => idx + 1);
      }
      if (typeof pageRef === 'number') {
        return Promise.resolve(pageRef + 1);
      }
    }

    return Promise.reject(new Error('Unknown destination format'));
  }

  function walk(items, parentUl) {
    items.forEach(it => {
      const li = document.createElement('li');
      li.className = 'toc-item';
      li.textContent = it.title || 'Untitled';

      li.addEventListener('click', (e) => {
        e.preventDefault();

        if (it.dest) {
          goToDest(it.dest).then(pageNum => {
            goToPage(pageNum);
            if (tocOpen && window.innerWidth <= 768) {
              tocSidebar.classList.remove('open');
              tocOpen = false;
            }
          }).catch(err => {
            console.warn('Outline dest resolution failed:', err);
          });
          return;
        }
      });

      parentUl.appendChild(li);

      if (it.items && it.items.length) {
        const sub = document.createElement('ul');
        sub.style.paddingLeft = '15px';
        li.appendChild(sub);
        walk(it.items, sub);
      }
    });
  }

  walk(outline, tocList);
}

// ---------- UI EVENTS ----------

// TOC Toggle
btnToc.addEventListener('click', () => {
  tocOpen = !tocOpen;
  tocSidebar.classList.toggle('open');
  closeAllDropdowns();
});

// Navigation
btnPrev.addEventListener('click', () => goToPage(currentPage - 1));
btnNext.addEventListener('click', () => goToPage(currentPage + 1));

// Theme Toggle (only available for Standard & Premium; updateThemeAvailability() enforces)
btnTheme.addEventListener('click', () => {
  const allowed = (userPlan === 'standard' || userPlan === 'standardplan' || userPlan === 'premium' || userPlan === 'premiumplan');
  if (!allowed) {
    showReaderWarning('Theme toggle is available for Standard and Premium users. Upgrade to change themes.', 3500);
    return;
  }

  if (currentTheme === 'light') {
    currentTheme = 'dark';
    body.classList.remove('light-mode');
    body.classList.add('dark-mode');
    btnTheme.innerHTML = '<i data-feather="moon"></i>';
  } else {
    currentTheme = 'light';
    body.classList.remove('dark-mode');
    body.classList.add('light-mode');
    btnTheme.innerHTML = '<i data-feather="sun"></i>';
  }
  feather.replace();
  saveState();
  closeAllDropdowns();
});

// Dropdown management
function closeAllDropdowns() {
  fontDropdown.classList.remove('active');
  modeDropdown.classList.remove('active');
  searchDropdown.classList.remove('active');
}

btnFont.addEventListener('click', (e) => {
  e.stopPropagation();
  const isOpen = fontDropdown.classList.contains('active');
  closeAllDropdowns();
  if (!isOpen) fontDropdown.classList.add('active');
});

btnMode.addEventListener('click', (e) => {
  e.stopPropagation();
  const isOpen = modeDropdown.classList.contains('active');
  closeAllDropdowns();
  if (!isOpen) modeDropdown.classList.add('active');
});

btnSearch.addEventListener('click', (e) => {
  e.stopPropagation();
  const isOpen = searchDropdown.classList.contains('active');
  closeAllDropdowns();
  if (!isOpen) {
    searchDropdown.classList.add('active');
    searchInput.focus();
  }
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('.icon-btn') && !e.target.closest('.dropdown-menu')) {
    closeAllDropdowns();
  }
});

// Font size controls
decreaseFont.addEventListener('click', () => {
  if (currentFontSize > 8) {
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
  viewer.style.fontSize = currentFontSize + 'px';
  fontSizeDisplay.textContent = currentFontSize + 'px';
  saveState();
  if (mode === 'scroll') setTimeout(() => rerenderVisible(), 100);
  else renderSinglePage(currentPage);
}
fontSelect.addEventListener('change', (e) => {
  viewer.style.fontFamily = e.target.value;
  if (mode === 'scroll') setTimeout(() => rerenderVisible(), 100);
  else renderSinglePage(currentPage);
});

// Mode toggle
modeToggleBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const newMode = btn.dataset.mode;
    mode = newMode;
    modeToggleBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    if (mode === 'scroll') {
      readingArea.classList.remove('paginated-mode');
      readingArea.classList.add('scroll-mode');
      renderAllPages();
    } else {
      readingArea.classList.remove('scroll-mode');
      readingArea.classList.add('paginated-mode');
      renderSinglePage(currentPage);
    }
    saveState();
    closeAllDropdowns();
    feather.replace();
  });
});

// Search input
searchInput.addEventListener('input', (e) => {
  searchAll(e.target.value.trim());
});
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') searchAll(searchInput.value.trim());
});

// Bookmark handling - setup based on plan
updateBookmarkAvailability();

// Fullscreen
btnFullscreen.addEventListener('click', () => {
  const doc = document.documentElement;
  if (!document.fullscreenElement) doc.requestFullscreen?.();
  else document.exitFullscreen?.();
});

// Close reader
btnClose.addEventListener('click', () => {
  if (confirm('Are you sure you want to close this document?')) {
    window.history.back();
  }
});

// Next page in scroll mode
scrollNextBtn.addEventListener('click', () => {
  if (currentPage < totalPages) goToPage(currentPage + 1);
});

// Scroll detection updates currentPage
readingArea.addEventListener('scroll', () => {
  if (mode === 'scroll') {
    const scrollTop = readingArea.scrollTop;
    const scrollHeight = readingArea.scrollHeight;
    const clientHeight = readingArea.clientHeight;

    if (scrollHeight - scrollTop - clientHeight < 100 && currentPage < totalPages) nextPageIndicator.classList.add('show');
    else nextPageIndicator.classList.remove('show');

    const visiblePages = viewer.querySelectorAll('.pageCanvasWrap');
    visiblePages.forEach((page) => {
      const rect = page.getBoundingClientRect();
      if (rect.top <= 100 && rect.bottom > 100) {
        const pageNum = parseInt(page.dataset.pageNumber, 10);
        if (pageNum !== currentPage) {
          currentPage = pageNum;
          pageIndicator.textContent = `${currentPage} / ${totalPages}`;
          saveState();
        }
      }
    });
  }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
    if (e.key === 'Escape') {
      closeAllDropdowns();
      e.target.blur();
    }
    return;
  }

  if (e.key === 'ArrowLeft') goToPage(currentPage - 1);
  else if (e.key === 'ArrowRight') goToPage(currentPage + 1);
  else if (e.key === 'PageDown') goToPage(currentPage + 1);
  else if (e.key === 'PageUp') goToPage(currentPage - 1);

  if (e.key === 'Escape') {
    closeAllDropdowns();
    if (tocOpen) {
      tocSidebar.classList.remove('open');
      tocOpen = false;
    }
  }

  if (e.key === 't' || e.key === 'T') {
    tocOpen = !tocOpen;
    tocSidebar.classList.toggle('open');
    closeAllDropdowns();
  }

  if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
    e.preventDefault();
    closeAllDropdowns();
    searchDropdown.classList.add('active');
    searchInput.focus();
  }

  if (e.key.toLowerCase() === 'f') {
    const doc = document.documentElement;
    if (!document.fullscreenElement) doc.requestFullscreen?.();
    else document.exitFullscreen?.();
  }
});

// Rerender visible pages
function rerenderVisible() {
  saveState();
  if (mode === 'paginated') {
    renderSinglePage(currentPage);
    return;
  }

  const rendered = viewer.querySelectorAll('.pageCanvasWrap.rendered');
  const promises = [];
  rendered.forEach(wrap => {
    const pageNum = parseInt(wrap.dataset.pageNumber, 10);
    promises.push(renderPage(pageNum, viewer, { reuseWrap: wrap }));
  });

  if (promises.length > 0) {
    Promise.all(promises).then(() => {
      const el = viewer.querySelector(`[data-page-number='${currentPage}']`);
      if (el) el.scrollIntoView({ behavior: 'auto', block: 'start' });
    }).catch(err => console.warn('rerenderVisible error', err));
  }
}

// ---------- READING TIME (BASIC plan) ----------
let readingTimerInterval = null;
function startReadingTimer() {
  if (userPlan !== 'basic') return;
  if (readingTimerInterval) return;

  readingTimerInterval = setInterval(() => {
    if (document.hidden) return;
    readingSeconds += 1;
    localStorage.setItem(readingTimeKey(), String(readingSeconds));

    const remaining = Math.max(0, BASIC_DAILY_SECONDS - readingSeconds);
    if (remaining === 60) showReaderWarning('1 minute remaining for today on Basic plan', 5000);

    if (readingSeconds >= BASIC_DAILY_SECONDS) {
      stopReadingTimer();
      showReaderWarning('Daily reading time reached for Basic plan. Upgrade to continue today.', 7000);
    }
  }, 1000);
}
function stopReadingTimer() {
  if (!readingTimerInterval) return;
  clearInterval(readingTimerInterval);
  readingTimerInterval = null;
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopReadingTimer();
  else startReadingTimer();
});

// On load check daily limits
function checkDailyLimits() {
  if (userPlan !== 'basic') return true;
  readingSeconds = parseInt(localStorage.getItem(readingTimeKey()) || '0', 10) || 0;
  try {
    pagesViewed = JSON.parse(localStorage.getItem(pagesViewedKey()) || '{}') || {};
  } catch(e) {
    pagesViewed = {};
  }

  if (readingSeconds >= BASIC_DAILY_SECONDS) {
    showReaderWarning('Daily reading time reached for Basic plan. Upgrade to continue today.', 7000);
    return false;
  }
  if (pagesViewedCount() >= BASIC_DAILY_PAGE_LIMIT) {
    showReaderWarning(`Daily page limit reached (${BASIC_DAILY_PAGE_LIMIT} pages). Upgrade to continue reading.`, 7000);
    return false;
  }
  return true;
}

// ---------- PDF LOAD ----------
pdfjsLib.getDocument({ url: pdfUrl }).promise.then(doc => {
  pdfDoc = doc;
  totalPages = doc.numPages;

  const lastPage = parseInt(localStorage.getItem(storageKeyPrefix + '::lastPage') || '1', 10);
  currentPage = Math.min(Math.max(1, lastPage), totalPages);

  const lastScale = parseFloat(localStorage.getItem(storageKeyPrefix + '::scale') || '') || DEFAULT_SCALE;
  scale = lastScale;

  const lastFontSize = parseInt(localStorage.getItem(storageKeyPrefix + '::fontSize') || '12', 10);
  currentFontSize = lastFontSize;
  fontSizeDisplay.textContent = currentFontSize + 'px';
  viewer.style.fontSize = currentFontSize + 'px';

  pageIndicator.textContent = `${currentPage} / ${totalPages}`;

  // Load metadata
  doc.getMetadata().then(metadata => {
    if (metadata && metadata.info) {
      if (metadata.info.Title) pdfTitle.textContent = metadata.info.Title;
      if (metadata.info.Author) pdfAuthor.textContent = metadata.info.Author;
    }
  }).catch(err => { console.warn('Failed to load metadata', err); });

  // Outline
  doc.getOutline().then(o => {
    outline = o || [];
    renderOutline();
  });

  // Preload text content for search
  const textPromises = [];
  for (let i = 1; i <= totalPages; i++) {
    textPromises.push(
      doc.getPage(i).then(p => p.getTextContent().then(tc => {
        pageTextContent[i-1] = tc.items.map(it => it.str).join(' ');
      }))
    );
  }

  Promise.all(textPromises).then(() => {
    // Enforce plan-specific UI availability
    updateBookmarkAvailability();
    updateThemeAvailability();

    // Check daily limits and start timer if allowed
    const allowed = checkDailyLimits();
    if (!allowed && userPlan === 'basic') {
      // let the UI show and block pages as appropriate
    }

    if (mode === 'scroll') renderAllPages();
    else renderSinglePage(currentPage);

    updateNavButtons();
  });

  if (window.feather) feather.replace();

  // start reading timer if allowed
  if (userPlan === 'basic' && checkDailyLimits()) startReadingTimer();

}).catch(err => {
  console.error('PDF load error', err);
  alert('Failed to load PDF: ' + err.message);
});

// finalize UI
if (window.feather) feather.replace();
updateNavButtons();
