// BookReader.js (ES module) — paste entire file, replacing your old BookReader.js

// import PDF.js module (your files are vendor/pdfjs/pdf.mjs and vendor/pdfjs/pdf.worker.mjs)
import * as pdfjsLib from './vendor/pdfjs/pdf.mjs';
// set the worker to the module worker file
pdfjsLib.GlobalWorkerOptions.workerSrc = './vendor/pdfjs/pdf.worker.mjs';

// ---------- CONFIG ----------
const DEFAULT_SCALE = 1.2;
const SCALE_STEP = 0.2;

// decode pdf query param
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

// ---------- DOM ----------
const viewer = document.getElementById('viewer');
const pageNumberInput = document.getElementById('pageNumber');
const btnGo = document.getElementById('btnGo');
const btnPrev = document.getElementById('btnPrev');
const btnNext = document.getElementById('btnNext');
const pageIndicator = document.getElementById('pageIndicator');
const modeSelect = document.getElementById('modeSelect');
const btnZoomIn = document.getElementById('btnZoomIn');
const btnZoomOut = document.getElementById('btnZoomOut');
const btnFit = document.getElementById('btnFit');
const btnSearch = document.getElementById('btnSearch');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const btnFullscreen = document.getElementById('btnFullscreen');
const btnToc = document.getElementById('btnToc');
const tocPanel = document.getElementById('tocPanel');
const tocList = document.getElementById('tocList');
const btnBookmark = document.getElementById('btnBookmark');
const btnHighlight = document.getElementById('btnHighlight');
const btnClose = document.getElementById('btnClose');

// ---------- STATE ----------
let pdfDoc = null;
let currentPage = 1;
let totalPages = 0;
let scale = DEFAULT_SCALE;
let mode = localStorage.getItem(storageKeyPrefix + '::mode') || 'scroll'; // 'scroll' or 'paginated'
let pageElements = []; // {pageNum, canvas, textLayer}
let pageTextContent = []; // cached text for search
let annotations = loadAnnotations(); // highlight & notes
let bookmarks = loadBookmarks();
let outline = null;

// init UI
modeSelect.value = mode;
if (mode === 'paginated') document.getElementById('viewerContainer').classList.add('paginated');

// ---------- HELPERS ----------
function saveState() {
  localStorage.setItem(storageKeyPrefix + '::lastPage', currentPage);
  localStorage.setItem(storageKeyPrefix + '::scale', scale);
  localStorage.setItem(storageKeyPrefix + '::mode', mode);
}

function loadAnnotations(){
  try {
    return JSON.parse(localStorage.getItem(storageKeyPrefix + '::annotations') || '[]');
  } catch(e) { return [];}
}
function storeAnnotations(){
  localStorage.setItem(storageKeyPrefix + '::annotations', JSON.stringify(annotations));
}

function loadBookmarks(){
  try {
    return JSON.parse(localStorage.getItem(storageKeyPrefix + '::bookmarks') || '[]');
  } catch(e){ return [];}
}
function storeBookmarks(){
  localStorage.setItem(storageKeyPrefix + '::bookmarks', JSON.stringify(bookmarks));
}

function addBookmark(page) {
  if (!bookmarks.includes(page)) bookmarks.push(page);
  storeBookmarks();
  alert('Bookmarked page ' + page);
}


function renderPage(pageNum, container, opts = {}) {
  // opts: { scaleOverride, reuseWrap }
  const userScale = opts.scaleOverride || scale; // user zoom factor
  const reuseWrap = opts.reuseWrap || null;
  const outputScale = window.devicePixelRatio || 1;

  function doRender(pdfPage, wrap) {
    // get unscaled page size (scale = 1)
    const unscaledViewport = pdfPage.getViewport({ scale: 1 });

    // determine container width to fit into (wrap.clientWidth after attached)
    const containerWidth = Math.max(1, wrap.clientWidth || container.clientWidth || viewer.clientWidth);

    // base scale to fit width: how much to scale the page so its CSS width == containerWidth
    const baseScale = containerWidth / unscaledViewport.width;

    // final PDF rendering scale = baseScale * user zoom
    const finalScale = baseScale * userScale;

    // PDF.js viewport at final scale (logical CSS pixels)
    const viewport = pdfPage.getViewport({ scale: finalScale });

    // Compute high-DPI bitmap size
    const canvasPixelWidth = Math.floor(viewport.width * outputScale);
    const canvasPixelHeight = Math.floor(viewport.height * outputScale);

    // Ensure wrapper not placeholder
    wrap.classList.remove('placeholder');

    // create or reuse canvas
    let canvas = wrap.querySelector('canvas.pageCanvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.className = 'pageCanvas';
      canvas.style.display = 'block';
      wrap.appendChild(canvas);
    }

    // Set intrinsic pixel size for high-DPI rendering
    canvas.width = canvasPixelWidth;
    canvas.height = canvasPixelHeight;

   // compute the actual CSS width we want (the wrapper's clientWidth)
// Use the PDF viewport logical size for CSS sizing so the drawn pixels match the displayed size.
// viewport.width / viewport.height are "CSS px" at the chosen finalScale.
const cssWidth = Math.round(viewport.width);
const cssHeight = Math.round(viewport.height);

// Set the canvas bitmap to high-DPI size (viewport * devicePixelRatio)
canvas.width = Math.floor(viewport.width * outputScale);
canvas.height = Math.floor(viewport.height * outputScale);

// Set CSS size to the logical viewport size so no CSS scaling mismatch occurs
canvas.style.width = cssWidth + 'px';
canvas.style.height = cssHeight + 'px';

// Make wrapper match the canvas CSS width/height so it won't clip or stretch
wrap.style.width = cssWidth + 'px';
wrap.style.height = cssHeight + 'px';



    // Ensure textLayer exists and matches CSS height
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

    // Render to canvas using scaled context so PDF draws crisply
    const ctx = canvas.getContext('2d');

    // Reset any transform then scale by device pixel ratio
    ctx.setTransform(outputScale, 0, 0, outputScale, 0, 0);

    const renderContext = { canvasContext: ctx, viewport };

    // cancel previous renderTask (if any)
    if (wrap._renderTask && typeof wrap._renderTask.cancel === 'function') {
      try { wrap._renderTask.cancel(); } catch(e) {}
    }

    const renderTask = pdfPage.render(renderContext);
    wrap._renderTask = renderTask;

    return renderTask.promise.then(() => {
      // store text content & populate minimal textLayer
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




function drawAnnotationsForPage(pageNum, wrap) {
  const existing = wrap.querySelectorAll('.highlight-rect');
  existing.forEach(n => n.remove());

  annotations.filter(a => a.page === pageNum).forEach((a, idx) => {
    const textLayer = wrap.querySelector('.textLayer');
    if (!textLayer) return;
    const fullText = textLayer.textContent || '';
    const idxOf = fullText.indexOf(a.text);
    if (idxOf === -1) {
      const badge = document.createElement('div');
      badge.className = 'highlight-rect';
      badge.style.right = '8px';
      badge.style.top = (8 + (idx * 22)) + 'px';
      badge.style.width = '12px';
      badge.style.height = '12px';
      badge.title = a.text + (a.note ? ('\nNote: ' + a.note) : '');
      wrap.appendChild(badge);
      return;
    }
    const rect = document.createElement('div');
    rect.className = 'highlight-rect';
    rect.style.left = '8px';
    rect.style.top = '8px';
    rect.style.width = 'calc(100% - 16px)';
    rect.style.height = '30px';
    rect.title = a.text + (a.note ? ('\nNote: ' + a.note) : '');
    wrap.appendChild(rect);
  });
}

// intersection observer: renders pages when entering viewport
let pageObserver = null;
function createObserver() {
  if (pageObserver) return;
  const options = { root: document.getElementById('viewerContainer'), rootMargin: '400px 0px 400px 0px', threshold: 0.01 };
  pageObserver = new IntersectionObserver(onPageIntersect, options);
}

function onPageIntersect(entries) {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const wrap = entry.target;
      const pageNum = parseInt(wrap.dataset.pageNumber, 10);
      // if not yet rendered, render now
      if (!wrap.dataset.rendered) {
        // render into this existing wrap (reuse)
        renderPage(pageNum, viewer, { reuseWrap: wrap }).then(() => {
          // once rendered, we can optionally unobserve to reduce observer load
          if (pageObserver) pageObserver.unobserve(wrap);
        }).catch(err => {
          console.error('Page render failed', pageNum, err);
        });
      } else {
        // already rendered - unobserve optionally
        if (pageObserver) pageObserver.unobserve(wrap);
      }
    }
  });
}

function renderAllPages() {
  viewer.innerHTML = '';
  pageElements = [];
  createObserver();

  // create placeholder wraps for each page
  for (let i = 1; i <= totalPages; i++) {
    const placeholder = document.createElement('div');
    placeholder.className = 'pageCanvasWrap placeholder';
    placeholder.style.width = '100%';
    placeholder.style.height = '800px'; // approximate height to reserve space; improves scrolling UX
    placeholder.dataset.pageNumber = i;
    // minimal styling to show blank area (optional)
    viewer.appendChild(placeholder);
    // observe it so it renders when near viewport
    if (pageObserver) pageObserver.observe(placeholder);
  }
  // After placeholders created, ensure current page is scrolled into view
  setTimeout(() => {
    const el = viewer.querySelector(`[data-page-number='${currentPage}']`);
    if (el) el.scrollIntoView({ behavior: 'auto', block: 'start' });
  }, 50);
}


function goToPage(n, smooth = true) {
  if (!pdfDoc) return;
  if (n < 1) n = 1;
  if (n > totalPages) n = totalPages;
  currentPage = n;
  pageNumberInput.value = currentPage;
  pageIndicator.textContent = `${currentPage} / ${totalPages}`;
  saveState();
  if (mode === 'paginated') {
    renderSinglePage(currentPage);
  } else {
    const el = viewer.querySelector(`[data-page-number='${currentPage}']`);
    if (el) el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
  }
}

function renderSinglePage(pageNum) {
  viewer.innerHTML = '';
  renderPage(pageNum, viewer).then(wrap => {
    viewer.appendChild(wrap);
  });
}

function searchAll(term) {
  if (!term) {
    searchResults.classList.add('hidden');
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
      results.push({ page: i + 1, snippet: snippet.replace(/\n/g, ' ') });
    }
  }
  if (results.length === 0) {
    searchResults.innerHTML = '<div class="search-result">No results</div>';
  } else {
    searchResults.innerHTML = results.map(r => `<div class="search-result" data-page="${r.page}"><strong>Page ${r.page}</strong><div>${escapeHtml(r.snippet)}</div></div>`).join('');
    searchResults.classList.remove('hidden');
    searchResults.querySelectorAll('.search-result').forEach(node => {
      node.addEventListener('click', () => {
        const page = parseInt(node.dataset.page, 10);
        goToPage(page);
        searchResults.classList.add('hidden');
      });
    });
  }
}

function escapeHtml(s){ return (s+'').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

// ---------- UI events ----------
btnPrev.addEventListener('click', () => goToPage(currentPage - 1));
btnNext.addEventListener('click', () => goToPage(currentPage + 1));
btnGo.addEventListener('click', () => {
  const v = parseInt(pageNumberInput.value || currentPage, 10);
  goToPage(v);
});

modeSelect.addEventListener('change', (e) => {
  mode = e.target.value;
  localStorage.setItem(storageKeyPrefix + '::mode', mode);
  renderAllPages().then(() => goToPage(currentPage, false));
});

// zoom controls
btnZoomIn.addEventListener('click', () => {
  scale = +(scale + SCALE_STEP).toFixed(2);
  rerenderVisible();
});
btnZoomOut.addEventListener('click', () => {
  scale = +(Math.max(0.2, scale - SCALE_STEP)).toFixed(2);
  rerenderVisible();
});
btnFit.addEventListener('click', () => {
  // compute fit and update scale
  if (!pdfDoc) return;
  pdfDoc.getPage(1).then(page => {
    const viewport = page.getViewport({ scale: 1 });
    const containerWidth = Math.min(viewer.clientWidth, 1100) - 40;
    const newScale = containerWidth / viewport.width;
    scale = +(newScale).toFixed(2);
    rerenderVisible();
  });
});


btnSearch.addEventListener('click', () => searchAll(searchInput.value.trim()));
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') searchAll(searchInput.value.trim());
});

btnFullscreen.addEventListener('click', () => toggleFullscreen());
btnToc.addEventListener('click', () => {
  const wasHidden = tocPanel.classList.contains('hidden');
  tocPanel.classList.toggle('hidden');
  // push viewer to the right when TOC visible to avoid overlap
  const viewerContainer = document.getElementById('viewerContainer');
  if (wasHidden) {
    // showing TOC
    viewerContainer.style.marginLeft = tocPanel.offsetWidth + 'px';
  } else {
    // hiding TOC
    viewerContainer.style.marginLeft = '';
  }
});

// Toggle text-layer visibility to allow selection/annotation
let textLayerActive = false;
btnHighlight.addEventListener('click', () => {
  textLayerActive = !textLayerActive;
  // toggle every loaded page text layer
  pageElements.forEach(pe => {
    if (!pe) return;
    const tl = pe.textLayerDiv || pe.wrap.querySelector('.textLayer');

    if (tl) {
      if (textLayerActive) tl.classList.add('visible');
      else tl.classList.remove('visible');
    }
  });
  // if no pages yet rendered, ensure future pages will be visible when created
  // update UI: we can change button look
  btnHighlight.classList.toggle('active', textLayerActive);
  btnHighlight.title = textLayerActive ? 'Disable Annotations' : 'Enable Annotations (select text to save highlight)';
});

btnClose.addEventListener('click', () => window.history.back());

document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if (e.key === 'ArrowLeft') goToPage(currentPage - 1);
  if (e.key === 'ArrowRight') goToPage(currentPage + 1);
  if (e.key === 'PageDown') goToPage(currentPage + 1);
  if (e.key === 'PageUp') goToPage(currentPage - 1);
  if (e.key.toLowerCase() === 'f') toggleFullscreen();
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
    e.preventDefault();
    searchInput.focus();
  }
});

function toggleFullscreen(){
  const doc = document.documentElement;
  if (!document.fullscreenElement) doc.requestFullscreen?.();
  else document.exitFullscreen?.();
}

function fitToWidth(){
  if (!pdfDoc) return;
  pdfDoc.getPage(1).then(page => {
    const viewport = page.getViewport({ scale: 1 });
    const containerWidth = Math.min(viewer.clientWidth, 1100) - 40;
    const newScale = containerWidth / viewport.width;
    scale = newScale;
    rerenderVisible();
  });
}

function rerenderVisible() {
  saveState();
  // In paginated mode, re-render only the single page
  if (mode === 'paginated') {
    renderSinglePage(currentPage);
    return;
  }

  // In scroll mode, re-render only page wrappers that are already rendered
  const rendered = viewer.querySelectorAll('.pageCanvasWrap.rendered');
  const promises = [];
  rendered.forEach(wrap => {
    const pageNum = parseInt(wrap.dataset.pageNumber, 10);
    // re-render into existing wrap (reuse)
    promises.push(renderPage(pageNum, viewer, { reuseWrap: wrap }));
  });

  // If nothing was rendered yet (first open), let observer render when visible
  if (promises.length > 0) {
    Promise.all(promises).then(() => {
      // ensure current page stays in view
      const el = viewer.querySelector(`[data-page-number='${currentPage}']`);
      if (el) el.scrollIntoView({ behavior: 'auto', block: 'start' });
    }).catch(err => console.warn('rerenderVisible error', err));
  }
}


// ---------- PDF load ----------
pdfjsLib.getDocument({ url: pdfUrl }).promise.then(doc => {
  pdfDoc = doc; totalPages = doc.numPages;
  const lastPage = parseInt(localStorage.getItem(storageKeyPrefix + '::lastPage') || '1', 10);
  currentPage = Math.min(Math.max(1, lastPage), totalPages);
  const lastScale = parseFloat(localStorage.getItem(storageKeyPrefix + '::scale') || '') || DEFAULT_SCALE;
  scale = lastScale;

  pageIndicator.textContent = `${currentPage} / ${totalPages}`;
  pageNumberInput.value = currentPage;

  doc.getOutline().then(o => {
    outline = o || [];
    renderOutline();
  });

  const textPromises = [];
  for (let i = 1; i <= totalPages; i++) {
    textPromises.push(
      doc.getPage(i).then(p => p.getTextContent().then(tc => {
        pageTextContent[i-1] = tc.items.map(it=>it.str).join(' ');
      }))
    );
  }

  Promise.all(textPromises).then(() => {
    if (mode === 'scroll') {
      renderAllPages().then(() => { goToPage(currentPage, false); });
    } else {
      renderSinglePage(currentPage);
    }
  });
}).catch(err => {
  console.error('PDF load error', err);
  alert('Failed to load PDF: ' + err.message);
});

// render TOC
// Robust renderOutline replacement
function renderOutline() {
  tocList.innerHTML = '';
  if (!outline || outline.length === 0) {
    tocList.innerHTML = '<li>No outline available</li>';
    return;
  }

  function goToDest(dest) {
    // dest may be a string (named destination) or an array [ref, ...] or something else
    if (!dest) return Promise.reject(new Error('No dest provided'));

    if (typeof dest === 'string') {
      // named destination -> resolve to explicit destination array
      return pdfDoc.getDestination(dest).then(destArr => {
        if (!destArr) throw new Error('Named destination resolved to null');
        const pageRef = destArr[0];
        return pdfDoc.getPageIndex(pageRef).then(idx => idx + 1);
      });
    }

    if (Array.isArray(dest)) {
      const pageRef = dest[0];
      // If it's a reference object, resolve to page index
      if (typeof pageRef === 'object') {
        return pdfDoc.getPageIndex(pageRef).then(idx => idx + 1);
      }
      // If it's a number (some PDFs may store page index), assume 0-based index
      if (typeof pageRef === 'number') {
        return Promise.resolve(pageRef + 1);
      }
    }

    return Promise.reject(new Error('Unknown destination format'));
  }

  function walk(items, parentUl) {
    items.forEach(it => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#';
      a.textContent = it.title || 'Untitled';

      a.addEventListener('click', (e) => {
        e.preventDefault();

        // Try dest first (could be string or array)
        if (it.dest) {
          goToDest(it.dest).then(pageNum => {
            goToPage(pageNum);
          }).catch(err => {
            console.warn('Outline dest resolution failed, trying getDestination fallback:', err);
            // fallback: if dest was array or something weird, attempt getDestination anyway
            try {
              pdfDoc.getDestination(it.dest).then(destArr => {
                if (!destArr) throw new Error('getDestination returned null');
                const ref = destArr[0];
                pdfDoc.getPageIndex(ref).then(idx => goToPage(idx + 1));
              }).catch((err2) => {
                console.error('Fallback getDestination also failed', err2);
              });
            } catch (ex) {
              console.error('No fallback available for this outline entry', ex);
            }
          });
          return;
        }

        // If there's an action (older PDFs), attempt to use it
        if (it.action && it.action === 'GoTo' && it.dest) {
          goToDest(it.dest).then(pageNum => goToPage(pageNum))
            .catch(err => console.warn('Action GoTo failed', err));
          return;
        }

        console.warn('TOC item has no destination/action:', it);
      });

      li.appendChild(a);
      parentUl.appendChild(li);

      if (it.items && it.items.length) {
        const sub = document.createElement('ul');
        li.appendChild(sub);
        walk(it.items, sub);
      }
    });
  }

  walk(outline, tocList);
}

