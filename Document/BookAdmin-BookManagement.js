// Unified initializer — waits for DOMContentLoaded, then wires sidebar, Add and Edit modals, table actions.
document.addEventListener('DOMContentLoaded', () => {
  const SIDEBAR_COLLAPSED_KEY = 'gr_bookmgmt_sidebar_collapsed';
  const MOBILE_BREAK = 800;

  const sidebar = document.getElementById('sidebar');
  const menuToggle = document.getElementById('menuToggle');
  const collapseBtn = document.getElementById('collapseBtn');
  const mainContent = document.getElementById('mainContent');

  function isMobile() { return window.innerWidth <= MOBILE_BREAK; }

  function applyLayout() {
    const collapsed = localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
    if (!sidebar || !mainContent) return;

    if (isMobile()) {
      sidebar.classList.remove('collapsed-desktop');
      sidebar.classList.remove('expanded');
      mainContent.classList.add('full');
      mainContent.classList.remove('collapsed-desktop');
      if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
      if (collapseBtn) collapseBtn.setAttribute('aria-pressed', 'false');
      document.body.classList.remove('no-scroll');
    } else {
      sidebar.classList.remove('expanded');
      mainContent.classList.remove('full');

      if (collapsed) {
        sidebar.classList.add('collapsed-desktop');
        mainContent.classList.add('collapsed-desktop');
        if (collapseBtn) collapseBtn.setAttribute('aria-pressed', 'true');
      } else {
        sidebar.classList.remove('collapsed-desktop');
        mainContent.classList.remove('collapsed-desktop');
        if (collapseBtn) collapseBtn.setAttribute('aria-pressed', 'false');
      }
      if (menuToggle) menuToggle.setAttribute('aria-expanded', 'true');
      document.body.classList.remove('no-scroll');
    }
  }

  applyLayout();
  window.addEventListener('resize', applyLayout);

  // Mobile menu toggle (overlay)
  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => {
      if (!sidebar.classList.contains('expanded')) {
        sidebar.classList.add('expanded');
        document.body.classList.add('no-scroll');
        if (mainContent) mainContent.classList.remove('full');
        menuToggle.setAttribute('aria-expanded', 'true');
      } else {
        sidebar.classList.remove('expanded');
        document.body.classList.remove('no-scroll');
        if (mainContent) mainContent.classList.add('full');
        menuToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Desktop collapse/uncollapse (icons-only)
  if (collapseBtn && sidebar && mainContent) {
    collapseBtn.addEventListener('click', () => {
      if (isMobile()) return;
      const nowCollapsed = sidebar.classList.toggle('collapsed-desktop');
      mainContent.classList.toggle('collapsed-desktop', nowCollapsed);
      collapseBtn.setAttribute('aria-pressed', String(nowCollapsed));
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, nowCollapsed ? 'true' : 'false');
    });
  }

  // Close mobile sidebar if clicking outside
  document.addEventListener('click', (e) => {
    if (isMobile() && sidebar && sidebar.classList.contains('expanded')) {
      if (!sidebar.contains(e.target) && menuToggle && !menuToggle.contains(e.target)) {
        sidebar.classList.remove('expanded');
        document.body.classList.remove('no-scroll');
        if (mainContent) mainContent.classList.add('full');
        if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
      }
    }
  });

  // ESC to close mobile overlay
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isMobile() && sidebar && sidebar.classList.contains('expanded')) {
      sidebar.classList.remove('expanded');
      document.body.classList.remove('no-scroll');
      if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
    }
  });

  /* ----------------- Add Book Modal ----------------- */
  const addModal = document.getElementById('addBookModal');
  const openAddBtn = document.getElementById('openModalBtn');
  const closeAddBtn = document.getElementById('closeModal');
  const clearAddBtn = document.getElementById('clearForm');
  const confirmAddBtn = document.getElementById('confirmAdd');
  const addForm = document.getElementById('bookForm');

  function showAddModal() {
    if (!addModal) return;
    addModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    const first = addForm && addForm.querySelector('input, textarea, select');
    if (first) first.focus();
  }
  function hideAddModal() {
    if (!addModal) return;
    addModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
    if (openAddBtn) openAddBtn.focus();
  }

  if (openAddBtn) openAddBtn.addEventListener('click', (e) => { e.preventDefault(); showAddModal(); });
  if (closeAddBtn) closeAddBtn.addEventListener('click', (e) => { e.preventDefault(); hideAddModal(); });
  if (clearAddBtn) clearAddBtn.addEventListener('click', (e) => { e.preventDefault(); if (addForm) addForm.reset(); const f = addForm && addForm.querySelector('input, textarea, select'); if (f) f.focus(); });

  if (addModal) {
    addModal.addEventListener('click', (e) => { if (e.target === addModal) hideAddModal(); });
  }
  if (addForm) {
    addForm.addEventListener('submit', (e) => e.preventDefault());
  }

  // Add confirm: append to table (in-place)
  if (confirmAddBtn) {
    confirmAddBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (!addForm) { hideAddModal(); return; }
      const tbody = document.querySelector('#booksTable tbody');
      if (!tbody) { hideAddModal(); return; }

      const formData = new FormData(addForm);
      const name = (formData.get('name') || '').toString().trim();
      const author = (formData.get('author') || '').toString().trim();
      const description = (formData.get('description') || '').toString().trim();
      const genre = (formData.get('genre') || '').toString().trim();
      const category = (formData.get('category') || '').toString().trim();
      const coverPath = (formData.get('coverPath') || '').toString().trim();

      const tr = document.createElement('tr');
      // simple generated id (not for production)
      const genId = String(Date.now()).slice(-4);
      tr.innerHTML = `<td>${genId}</td>
                      <td data-col="name">${escapeHtml(name)}</td>
                      <td data-col="author">${escapeHtml(author)}</td>
                      <td data-col="category">${escapeHtml(category)}</td>
                      <td><button class="edit-btn">Edit</button> <button class="delete-btn">Delete</button></td>`;
      tbody.appendChild(tr);
      if (addForm) addForm.reset();
      hideAddModal();
    });
  }

  /* ----------------- Edit Book Modal ----------------- */
  const editModal = document.getElementById('editBookModal');
  const editForm = document.getElementById('editBookForm');
  const confirmEditBtn = document.getElementById('confirmEditBook');
  const closeEditBtn = document.getElementById('closeEditModal');
  const clearEditBtn = document.getElementById('clearEditForm');

  let activeRow = null;

  function showEditModal() {
    if (!editModal) return;
    editModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    const first = editForm && editForm.querySelector('input, textarea, select');
    if (first) first.focus();
  }
  function hideEditModal() {
    if (!editModal) return;
    editModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
    activeRow = null;
  }
  if (editModal) {
    editModal.addEventListener('click', (e) => { if (e.target === editModal) hideEditModal(); });
  }
  if (editForm) editForm.addEventListener('submit', (e) => e.preventDefault());

  // delegate edit / delete clicks on table
  document.addEventListener('click', (e) => {
    const editBtn = e.target.closest && e.target.closest('.edit-btn');
    if (editBtn) {
      const tr = editBtn.closest('tr');
      if (!tr) return;
      activeRow = tr;

      // populate form fields from data-col cells (or fallbacks)
      const getCellText = (col) => {
        const el = tr.querySelector(`[data-col="${col}"]`);
        return el ? el.textContent.trim() : '';
      };

      setFieldValue(editForm, 'name', getCellText('name') || tr.cells[1] && tr.cells[1].textContent.trim());
      setFieldValue(editForm, 'author', getCellText('author') || tr.cells[2] && tr.cells[2].textContent.trim());
      setFieldValue(editForm, 'description', getFieldValueFromRow(tr, 'description'));
      setFieldValue(editForm, 'genre', getFieldValueFromRow(tr, 'genre'));
      setFieldValue(editForm, 'category', getCellText('category') || tr.cells[3] && tr.cells[3].textContent.trim());
      setFieldValue(editForm, 'coverPath', getCellText('cover'));

      showEditModal();
      return;
    }

    const delBtn = e.target.closest && e.target.closest('.delete-btn');
    if (delBtn) {
      const tr = delBtn.closest('tr');
      if (tr) tr.remove();
      return;
    }
  });

  if (confirmEditBtn) {
    confirmEditBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (!activeRow || !editForm) { hideEditModal(); return; }

      const vals = getFormValues(editForm);
      // update table cells using data-col attributes where present
      const setCell = (col, value, fallbackIndex) => {
        const el = activeRow.querySelector(`[data-col="${col}"]`);
        if (el) el.textContent = value;
        else if (fallbackIndex != null && activeRow.cells[fallbackIndex]) activeRow.cells[fallbackIndex].textContent = value;
      };

      setCell('name', vals.name || '', 1);
      setCell('author', vals.author || '', 2);
      setCell('category', vals.category || '', 3);
      setCell('cover', vals.coverPath || '', null);

      // optional: update description and genre if you have cells for them
      hideEditModal();
    });
  }

  if (closeEditBtn) closeEditBtn.addEventListener('click', (e) => { e.preventDefault(); hideEditModal(); });
  if (clearEditBtn) clearEditBtn.addEventListener('click', (e) => { e.preventDefault(); if (editForm) editForm.reset(); });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (addModal && addModal.getAttribute('aria-hidden') === 'false') hideAddModal();
      if (editModal && editModal.getAttribute('aria-hidden') === 'false') hideEditModal();
      if (isMobile() && sidebar && sidebar.classList.contains('expanded')) {
        sidebar.classList.remove('expanded');
        document.body.classList.remove('no-scroll');
        if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
      }
    }
  });

  /* ----------------- Table render / search / filter (demo) ----------------- */
  const tbody = document.querySelector('#booksTable tbody');
  const searchInput = document.getElementById('searchInput');
  const filterCategory = document.getElementById('filterCategory');

  async function loadDataDemo() {
    // demo payload
    const demo = [
      { id: '1000', name: 'Physics 101', author: 'A. Teacher', category: 'educational' },
      { id: '1001', name: 'Fairy Tales', author: 'Story Teller', category: 'novel' },
      { id: '1002', name: 'Atomic Habits', author: 'James Clear', category: 'educational' },
      { id: '1003', name: 'Persepolis', author: 'Marjane Satrapi', category: 'graphic' }
    ];
    renderTable(demo);
  }

  function renderTable(rows) {
    if (!tbody) return;
    tbody.innerHTML = '';
    const q = (searchInput && searchInput.value || '').trim().toLowerCase();
    const cat = (filterCategory && filterCategory.value) || 'all';

    rows.filter(r => {
      const textMatch = !q || (r.name + ' ' + r.author + ' ' + r.id).toLowerCase().includes(q);
      const catMatch = (cat === 'all') || (r.category && r.category.toLowerCase() === cat);
      return textMatch && catMatch;
    }).forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${escapeHtml(r.id)}</td>
                      <td data-col="name">${escapeHtml(r.name)}</td>
                      <td data-col="author">${escapeHtml(r.author)}</td>
                      <td data-col="category">${escapeHtml(r.category)}</td>
                      <td><button class="edit-btn">Edit</button> <button class="delete-btn">Delete</button></td>`;
      tbody.appendChild(tr);
    });
  }

  if (searchInput) searchInput.addEventListener('input', () => loadDataDemo());
  if (filterCategory) filterCategory.addEventListener('change', () => loadDataDemo());

  loadDataDemo();

  /* ----------------- Helpers ----------------- */
  function getFormValues(formEl) {
    if (!formEl) return {};
    const data = new FormData(formEl);
    const obj = Object.fromEntries(data.entries());
    return obj;
  }
  function setFieldValue(formEl, name, value) {
    if (!formEl) return;
    const el = formEl.querySelector(`[name="${name}"]`);
    if (el) el.value = value || '';
  }
  function getFieldValueFromRow(tr, key) {
    const el = tr.querySelector(`[data-col="${key}"]`);
    return el ? el.textContent.trim() : '';
  }
  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }
});