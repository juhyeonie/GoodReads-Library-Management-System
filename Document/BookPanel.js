// filepath: c:\xampp\htdocs\GoodReads-Library-Management-System\Document\BookPanel.js
// Cleaned and consolidated BookPanel.js — safe element access, dropdowns, slide/scroll modes, search, TOC, navigation

// State
let currentChapter = 0;
let currentSlide = 0;
let totalSlides = 0;
let slidePages = [];
let totalChapters = 9;
let currentTheme = 'light';
let currentFontSize = 18;
let currentMode = 'scroll'; // 'scroll' or 'slide'
let tocOpen = false;
let currentSearchTerm = '';

// Elements (safe)
const body = document.body;
const hamburgerBtn = document.getElementById('hamburgerBtn');
const tocSidebar = document.getElementById('tocSidebar');
const bookInfoHeader = document.getElementById('bookInfoHeader');
const tocItems = document.querySelectorAll('.toc-item') || [];
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
const chapters = document.querySelectorAll('.chapter') || [];
const fontSizeInput = document.getElementById('fontSizeInput'); // number input (preferred)
const fontSelect = document.getElementById('fontSelect');
const modeToggleBtns = document.querySelectorAll('.mode-toggle-btn') || [];
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const nextPageIndicator = document.getElementById('nextPageIndicator');
const scrollNextBtn = document.getElementById('scrollNextBtn');
const slidePrevBtn = document.getElementById('slidePrevBtn');
const slideNextBtn = document.getElementById('slideNextBtn');
const pageIndicator = document.getElementById('pageIndicator');
const pageIndicatorWrapper = document.getElementById('pageIndicator');

// Utilities
function safe(fn){ try{ fn(); }catch(e){ console.warn(e); } }

function closeAllDropdowns(){
  if(fontDropdown) fontDropdown.classList.remove('active');
  if(modeDropdown) modeDropdown.classList.remove('active');
  if(searchDropdown) searchDropdown.classList.remove('active');
}

function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

// TOC toggle
if(hamburgerBtn && tocSidebar){
  hamburgerBtn.addEventListener('click', ()=>{
    tocOpen = !tocOpen;
    tocSidebar.classList.toggle('open', tocOpen);
    if(bookInfoHeader) bookInfoHeader.classList.toggle('hidden', tocOpen);
    closeAllDropdowns();
  });
}

// TOC item clicks
if(tocItems.length){
  tocItems.forEach(item=>{
    item.addEventListener('click', ()=>{
      const ch = parseInt(item.dataset.chapter,10);
      if(isNaN(ch)) return;
      goToChapter(ch);
      tocItems.forEach(i=>i.classList.toggle('active', parseInt(i.dataset.chapter,10)===ch));
      // close on small
      if(window.innerWidth <= 768 && tocSidebar){
        tocSidebar.classList.remove('open'); tocOpen=false;
        if(bookInfoHeader) bookInfoHeader.classList.remove('hidden');
      }
    });
  });
}

// Core navigation functions
function updateTOCActive(){
  tocItems.forEach(item=>{
    const idx = parseInt(item.dataset.chapter,10);
    item.classList.toggle('active', idx === currentChapter);
  });
}

function updateHeaderNav(){
  safe(()=> {
    if(currentMode === 'slide'){
      if(prevBtn) prevBtn.disabled = currentSlide === 0;
      if(nextBtn) nextBtn.disabled = currentSlide >= totalSlides - 1;
    } else {
      if(prevBtn) prevBtn.disabled = currentChapter === 0;
      if(nextBtn) nextBtn.disabled = currentChapter >= totalChapters - 1;
    }
  });
}

function updateSlideNav(){
  if(slidePrevBtn) slidePrevBtn.disabled = currentSlide === 0;
  if(slideNextBtn) slideNextBtn.disabled = currentSlide >= totalSlides - 1;
  if(pageIndicator) pageIndicator.textContent = `${Math.min(totalSlides, currentSlide+1)} / ${Math.max(1,totalSlides)}`;
}

// Scroll / Chapter navigation
function goToChapter(chapterNum, highlightTerm=''){
  if(isNaN(chapterNum) || chapterNum < 0) return;
  if(chapterNum >= totalChapters) chapterNum = totalChapters - 1;
  currentChapter = chapterNum;

  if(currentMode === 'slide'){
    // find first slide matching chapter
    let targetSlide = slidePages.findIndex(s => s.chapter === chapterNum);
    if(targetSlide === -1) targetSlide = 0;
    goToSlide(targetSlide);
  } else {
    clearHighlights();
    const target = document.querySelector(`.chapter[data-chapter="${chapterNum}"]`);
    if(target && readingArea){
      readingArea.scrollTo({ top: target.offsetTop, behavior: 'smooth' });
      if(highlightTerm) setTimeout(()=> highlightSearchTerm(target, highlightTerm), 500);
    }
  }

  updateTOCActive();
  updateHeaderNav();
}

// Slide navigation
function goToSlide(slideIndex){
  if(isNaN(slideIndex)) return;
  if(slideIndex < 0) slideIndex = 0;
  if(slideIndex >= totalSlides) slideIndex = totalSlides - 1;
  currentSlide = slideIndex;
  currentChapter = slidePages[slideIndex] ? slidePages[slideIndex].chapter : currentChapter;

  // hide all and show active
  const allSlides = slideContent ? slideContent.querySelectorAll('.slide-page') : [];
  allSlides.forEach(s=> s.classList.remove('active'));
  const active = slideContent ? slideContent.querySelector(`.slide-page[data-slide="${currentSlide}"]`) : null;
  if(active) active.classList.add('active');

  updateSlideNav();
  updateTOCActive();
  updateHeaderNav();
}

// Header buttons
if(prevBtn){
  prevBtn.addEventListener('click', ()=>{
    if(currentMode === 'slide'){
      if(currentSlide > 0) goToSlide(currentSlide - 1);
    } else {
      if(currentChapter > 0) goToChapter(currentChapter - 1);
    }
  });
}
if(nextBtn){
  nextBtn.addEventListener('click', ()=>{
    if(currentMode === 'slide'){
      if(currentSlide < totalSlides - 1) goToSlide(currentSlide + 1);
    } else {
      if(currentChapter < totalChapters - 1) goToChapter(currentChapter + 1);
    }
  });
}

// Slide nav buttons
if(slidePrevBtn) slidePrevBtn.addEventListener('click', ()=>{ if(currentSlide>0) goToSlide(currentSlide-1); });
if(slideNextBtn) slideNextBtn.addEventListener('click', ()=>{ if(currentSlide<totalSlides-1) goToSlide(currentSlide+1); });

// Scroll mode next (bottom) button
if(scrollNextBtn) scrollNextBtn.addEventListener('click', ()=>{ if(currentChapter < totalChapters - 1) goToChapter(currentChapter + 1); });

// Reading area scroll detection (show bottom next when at end of current chapter)
if(readingArea){
  readingArea.addEventListener('scroll', ()=>{
    if(currentMode !== 'scroll') return;
    const scrollTop = readingArea.scrollTop;
    const clientH = readingArea.clientHeight;
    // find active chapter by offset
    let found = currentChapter;
    chapters.forEach((ch, idx)=>{
      if(ch.offsetTop <= scrollTop + 10) found = idx;
    });
    if(found !== currentChapter){
      currentChapter = found;
      updateTOCActive();
      updateHeaderNav();
    }
    // show bottom next when near bottom of current chapter
    const currentEl = chapters[currentChapter];
    if(currentEl){
      const pageBottom = currentEl.offsetTop + currentEl.offsetHeight;
      const atEnd = (scrollTop + clientH) >= (pageBottom - 8);
      if(nextPageIndicator) nextPageIndicator.classList.toggle('show', atEnd && currentChapter < totalChapters - 1);
    }
  });
}

// Theme toggle
if(themeBtn){
  themeBtn.addEventListener('click', ()=>{
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    body.classList.toggle('dark-mode', currentTheme === 'dark');
    body.classList.toggle('light-mode', currentTheme === 'light');
    closeAllDropdowns();
  });
}

// Dropdown toggles (safe)
if(fontBtn){
  fontBtn.addEventListener('click', (e)=>{ e.stopPropagation(); const open = fontDropdown && fontDropdown.classList.contains('active'); closeAllDropdowns(); if(fontDropdown && !open) fontDropdown.classList.add('active'); });
}
if(modeBtn){
  modeBtn.addEventListener('click', (e)=>{ e.stopPropagation(); const open = modeDropdown && modeDropdown.classList.contains('active'); closeAllDropdowns(); if(modeDropdown && !open) modeDropdown.classList.add('active'); });
}
if(searchBtn){
  searchBtn.addEventListener('click', (e)=>{ e.stopPropagation(); const open = searchDropdown && searchDropdown.classList.contains('active'); closeAllDropdowns(); if(searchDropdown && !open){ searchDropdown.classList.add('active'); if(searchInput) searchInput.focus(); } });
}
document.addEventListener('click', (e)=>{ if(!e.target.closest('.icon-btn') && !e.target.closest('.dropdown') && !e.target.closest('.dropdown-menu')) closeAllDropdowns(); });

// Font size input (number)
if(fontSizeInput){
  fontSizeInput.addEventListener('change', ()=>{
    let v = parseInt(fontSizeInput.value,10) || currentFontSize;
    v = Math.max(12, Math.min(40, v));
    currentFontSize = v;
    applyFontSettings();
  });
}
// also support direct fontSelect
if(fontSelect){
  fontSelect.addEventListener('change', ()=> applyFontSettings());
}

function applyFontSettings(){
  if(contentWrapper){
    contentWrapper.style.fontSize = currentFontSize + 'px';
    if(fontSelect && fontSelect.value) contentWrapper.style.fontFamily = fontSelect.value;
  }
  if(currentMode === 'slide') {
    // regenerate slides to respect new metrics
    generateSlidePages();
    goToSlide(currentSlide);
  }
}

// Search handling
if(searchInput){
  searchInput.addEventListener('input', (e)=>{
    const q = (e.target.value || '').trim().toLowerCase();
    currentSearchTerm = q;
    performSearch(q);
  });
}

function performSearch(q){
  if(!searchResults) return;
  if(!q){ searchResults.innerHTML = '<div class="no-results">Enter a search term</div>'; return; }
  const results = [];
  chapters.forEach((ch, idx)=>{
    const txt = ch.textContent || '';
    const sentences = txt.split(/(?<=[.?!])\s+/);
    sentences.forEach(s => {
      if(s.toLowerCase().includes(q)) results.push({ chapter: idx, text: s.trim(), title: ch.querySelector('h2')?.textContent || `Chapter ${idx+1}` });
    });
  });
  if(results.length === 0) searchResults.innerHTML = '<div class="no-results">No results found</div>';
  else {
    searchResults.innerHTML = results.slice(0,15).map(r=>`<div class="search-result-item" data-chapter="${r.chapter}" style="padding:8px;border-bottom:1px solid #eee;cursor:pointer">${escapeHtml(r.text)}<div style="font-size:12px;color:#666">${escapeHtml(r.title)}</div></div>`).join('');
    Array.from(searchResults.querySelectorAll('.search-result-item')).forEach(el=>{
      el.addEventListener('click', ()=>{
        const ch = parseInt(el.dataset.chapter,10);
        goToChapter(ch, currentSearchTerm);
        closeAllDropdowns();
        if(tocOpen && tocSidebar){ tocSidebar.classList.remove('open'); tocOpen=false; if(bookInfoHeader) bookInfoHeader.classList.remove('hidden'); }
      });
    });
  }
}

// Highlight utilities
function clearHighlights(){
  const highlights = scrollContent ? scrollContent.querySelectorAll('.highlight') : [];
  highlights.forEach(h=>{
    const parent = h.parentNode;
    if(parent) parent.replaceChild(document.createTextNode(h.textContent), h);
  });
}
function highlightSearchTerm(container, term){
  if(!term || !container) return;
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
  const nodes = [];
  let n;
  while(n = walker.nextNode()) {
    if(n.nodeValue.toLowerCase().includes(term.toLowerCase())) nodes.push(n);
  }
  nodes.forEach(textNode => {
    const span = document.createElement('span');
    span.innerHTML = escapeHtml(textNode.nodeValue).replace(new RegExp(`(${term})`, 'gi'), '<span class="highlight">$1</span>');
    textNode.parentNode.replaceChild(span, textNode);
  });
}

// Slide generation
function generateSlidePages(){
  if(!slideContent || !contentWrapper) return;
  slidePages = [];
  slideContent.innerHTML = '';

  // create a measurement element
  const temp = document.createElement('div');
  temp.style.position = 'absolute';
  temp.style.left = '-9999px';
  temp.style.width = contentWrapper.clientWidth + 'px';
  temp.style.fontSize = currentFontSize + 'px';
  temp.style.lineHeight = '1.8';
  temp.style.fontFamily = contentWrapper.style.fontFamily || getComputedStyle(contentWrapper).fontFamily;
  document.body.appendChild(temp);

  const availableHeight = (readingArea ? readingArea.clientHeight : window.innerHeight) - 100; // leave space for nav

  chapters.forEach((ch, chIdx)=>{
    // prepare title and paragraphs
    const titleHtml = ch.querySelector('h2') ? ch.querySelector('h2').outerHTML : '';
    const paras = Array.from(ch.querySelectorAll('p')).map(p => p.outerHTML);

    let pageContent = titleHtml ? [titleHtml] : [];
    let currentHeight = 0;
    // estimate title height
    temp.innerHTML = pageContent.join('');
    currentHeight = temp.scrollHeight;

    paras.forEach(pHtml=>{
      temp.innerHTML = pHtml;
      const ph = temp.scrollHeight;
      if(currentHeight + ph > availableHeight && pageContent.length > 0){
        // finalize current page
        createSlidePage(chIdx, pageContent);
        pageContent = [];
        currentHeight = 0;
      }
      pageContent.push(pHtml);
      currentHeight += ph;
    });
    if(pageContent.length) createSlidePage(chIdx, pageContent);
  });

  document.body.removeChild(temp);
  totalSlides = slidePages.length;
  // append slide DOM elements to slideContent (createSlidePage already appended)
}

function createSlidePage(chapterIndex, contentArray){
  const pageDiv = document.createElement('div');
  pageDiv.className = 'slide-page';
  pageDiv.dataset.slide = slidePages.length;
  contentArray.forEach(html => {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    while(wrapper.firstChild){ pageDiv.appendChild(wrapper.firstChild); }
  });
  slideContent.appendChild(pageDiv);
  slidePages.push({ chapter: chapterIndex, element: pageDiv });
}

// Mode toggle (buttons if present)
if(modeToggleBtns.length){
  modeToggleBtns.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const mode = btn.dataset.mode;
      if(!mode) return;
      currentMode = mode;
      modeToggleBtns.forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      if(mode === 'scroll'){
        if(readingArea) readingArea.classList.add('scroll-mode');
        if(readingArea) readingArea.classList.remove('slide-mode');
        if(scrollContent) scrollContent.style.display = 'block';
        if(slideContent) slideContent.style.display = 'none';
      } else {
        if(readingArea) readingArea.classList.add('slide-mode');
        if(readingArea) readingArea.classList.remove('scroll-mode');
        if(scrollContent) scrollContent.style.display = 'none';
        if(slideContent) slideContent.style.display = 'block';
        generateSlidePages();
        // show first slide of current chapter
        let idx = slidePages.findIndex(s => s.chapter === currentChapter); if(idx === -1) idx = 0;
        goToSlide(idx);
      }
      updateHeaderNav();
      closeAllDropdowns();
    });
  });
}

// Keyboard navigation
document.addEventListener('keydown', (e)=>{
  if(e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT')) {
    if(e.key === 'Escape') closeAllDropdowns();
    return;
  }
  if(e.key === 'ArrowLeft'){
    if(currentMode === 'slide'){ if(currentSlide > 0) goToSlide(currentSlide - 1); }
    else { if(currentChapter > 0) goToChapter(currentChapter - 1); }
  } else if(e.key === 'ArrowRight'){
    if(currentMode === 'slide'){ if(currentSlide < totalSlides - 1) goToSlide(currentSlide + 1); }
    else { if(currentChapter < totalChapters - 1) goToChapter(currentChapter + 1); }
  } else if(e.key === 'Escape'){
    closeAllDropdowns();
    if(tocOpen){ tocSidebar && tocSidebar.classList.remove('open'); tocOpen=false; if(bookInfoHeader) bookInfoHeader.classList.remove('hidden'); }
  } else if((e.ctrlKey || e.metaKey) && e.key === 'f'){
    e.preventDefault();
    closeAllDropdowns();
    if(searchDropdown) { searchDropdown.classList.add('active'); if(searchInput) searchInput.focus(); }
  } else if(e.key.toLowerCase() === 't'){
    // toggle toc
    tocOpen = !tocOpen;
    tocSidebar && tocSidebar.classList.toggle('open', tocOpen);
    if(bookInfoHeader) bookInfoHeader.classList.toggle('hidden', tocOpen);
    closeAllDropdowns();
  }
});

// Close book
if(closeBtn){
  closeBtn.addEventListener('click', (e)=>{
    e.preventDefault();
    if(confirm('Are you sure you want to close this book?')) window.history.back();
  });
}

// Initialization
safe(()=>{
  // set totalChapters from DOM if available
  if(chapters.length) totalChapters = chapters.length;
  // apply font settings
  if(fontSizeInput) currentFontSize = parseInt(fontSizeInput.value,10) || currentFontSize;
  applyFontSettings();
  // initial mode: ensure scroll visible
  if(currentMode === 'scroll'){
    if(scrollContent) scrollContent.style.display = 'block';
    if(slideContent) slideContent.style.display = 'none';
  }
  // wire slide nav update if slides exist
  generateSlidePages();
  updateSlideNav();
  updateHeaderNav();
  // expose some utilities for debug
  window.reader = { generateSlidePages, goToChapter, goToSlide, setMode: (m)=>{ currentMode = m; /* trigger UI change if needed */ } };
});