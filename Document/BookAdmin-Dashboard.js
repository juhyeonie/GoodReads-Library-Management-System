/* BookAdmin-Dashboard.js
   Replaced edit/delete logging handlers with full edit/delete behavior
   copied from BookAdmin-BookManagement.js:
   - Edit opens modal (prefills fields from row)
   - Confirm updates the row in-place
   - Delete removes the row
*/

(function () {
  const sid = document.getElementById('sidebar');
  const menuToggle = document.getElementById('menuToggle');
  const mainContent = document.getElementById('mainContent');
  const collapseBtn = document.getElementById('collapseBtn');

  const DESKTOP_BREAK = 800; // width threshold where "desktop" behaviors apply
  const COLLAPSED_KEY = 'gr_sidebar_collapsed';

  function isMobileWidth() { return window.innerWidth <= DESKTOP_BREAK; }

  function applyInitialLayout() {
    const collapsed = localStorage.getItem(COLLAPSED_KEY) === 'true';

    if (isMobileWidth()) {
      sid.classList.remove('collapsed-desktop');
      sid.classList.remove('expanded');
      mainContent.classList.add('full');
      mainContent.classList.remove('collapsed-desktop');
      if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
      if (collapseBtn) collapseBtn.setAttribute('aria-pressed', 'false');
    } else {
      sid.classList.remove('expanded');
      mainContent.classList.remove('full');

      if (collapsed) {
        sid.classList.add('collapsed-desktop');
        mainContent.classList.add('collapsed-desktop');
        if (collapseBtn) collapseBtn.setAttribute('aria-pressed', 'true');
      } else {
        sid.classList.remove('collapsed-desktop');
        mainContent.classList.remove('collapsed-desktop');
        if (collapseBtn) collapseBtn.setAttribute('aria-pressed', 'false');
      }

      if (menuToggle) menuToggle.setAttribute('aria-expanded', 'true');
    }
  }

  applyInitialLayout();
  window.addEventListener('resize', applyInitialLayout);

  // Mobile toggle
  if (menuToggle && sid) {
    menuToggle.addEventListener('click', () => {
      if (!sid.classList.contains('expanded')) {
        sid.classList.add('expanded');
        mainContent.classList.remove('full');
        menuToggle.setAttribute('aria-expanded', 'true');
      } else {
        sid.classList.remove('expanded');
        mainContent.classList.add('full');
        menuToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Desktop collapse
  if (collapseBtn && sid && mainContent) {
    collapseBtn.addEventListener('click', () => {
      if (isMobileWidth()) return;
      const nowCollapsed = sid.classList.toggle('collapsed-desktop');
      mainContent.classList.toggle('collapsed-desktop', nowCollapsed);
      collapseBtn.setAttribute('aria-pressed', String(nowCollapsed));
      localStorage.setItem(COLLAPSED_KEY, nowCollapsed ? 'true' : 'false');
    });
  }

  // Click outside to close mobile sidebar
  document.addEventListener('click', (e) => {
    if (isMobileWidth() && sid.classList.contains('expanded')) {
      if (!sid.contains(e.target) && menuToggle && !menuToggle.contains(e.target)) {
        sid.classList.remove('expanded');
        mainContent.classList.add('full');
        if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
      }
    }
  });

  /***********************
   * Charts & data loader
   ************************/
  function initCharts(categories = [], counts = []) {
    // same chart init as before (unchanged)
    const bar = document.getElementById('barChart');
    if (bar && window.Chart) {
      const parent = bar.parentElement;
      if (parent && !parent.style.height) parent.style.height = parent.style.maxHeight || '160px';
      new Chart(bar.getContext('2d'), {
        type: 'bar',
        data: { labels: categories, datasets: [{ label: 'Books per Category', data: counts, backgroundColor: ['#5A7FFB','#86A8E7','#91EAE4'] }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
      });
    }

    const pie = document.getElementById('pieChart');
    if (pie && window.Chart) {
      const parent = pie.parentElement;
      if (parent && !parent.style.height) parent.style.height = parent.style.maxHeight || '180px';
      new Chart(pie.getContext('2d'), {
        type: 'pie',
        data: { labels: categories, datasets: [{ data: counts, backgroundColor: ['#5A7FFB','#86A8E7','#91EAE4'] }] },
        options: { responsive: true, maintainAspectRatio: false }
      });
    }
  }

  async function loadData() {
    try {
      const data = {
        totalBooks: 22,
        categories: ['Educational', 'Novel', 'Graphic Novel'],
        counts: [12, 8, 2],
        recent: [
          { id: '1000', name: 'Physics 101', author: 'A. Teacher', category: 'educational' },
          { id: '1001', name: 'Fairy Tales', author: 'Story Teller', category: 'novel' },
          { id: '1002', name: 'Atomic Habits', author: 'James Clear', category: 'educational' },
          { id: '1003', name: 'Persepolis', author: 'Marjane Satrapi', category: 'graphic' }
        ]
      };

      document.getElementById('total-books').textContent = data.totalBooks;
      initCharts(data.categories, data.counts);

      const tbody = document.querySelector('#books-table tbody');
      tbody.innerHTML = '';
      data.recent.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${escapeHtml(row.id || '')}</td>
                        <td data-col="name">${escapeHtml(row.name || '')}</td>
                        <td data-col="author">${escapeHtml(row.author || '')}</td>
                        <td data-col="category">${escapeHtml(row.category || '')}</td>
                        <td></td>`;
        const tdActions = tr.querySelector('td:last-child');
        // create Edit and Delete buttons with same classnames used in BookManagement
        const editBtn = document.createElement('button'); editBtn.className = 'edit-btn'; editBtn.textContent = 'Edit';
        const delBtn = document.createElement('button'); delBtn.className = 'delete-btn'; delBtn.textContent = 'Delete';
        tdActions.appendChild(editBtn);
        tdActions.appendChild(delBtn);
        tbody.appendChild(tr);
      });

    } catch (err) {
      console.error('Failed to load dashboard data', err);
    }
  }

  /* -----------------------
     Add the edit modal markup if it's not present
     (if you already pasted the HTML snippet into the HTML file you can skip this).
     This check prevents duplicating the modal.
  -------------------------*/
  function ensureEditModalExists() {
    if (document.getElementById('editBookModal')) return;
    const frag = document.createRange().createContextualFragment(`
      <div id="editBookModal" class="modal-overlay" role="dialog" aria-modal="true" aria-hidden="true" aria-labelledby="editModalTitle">
        <div class="modal-box" role="document">
          <div class="modal-topbar"></div>
          <div class="modal-body">
            <h2 id="editModalTitle" class="modal-title">Edit book details</h2>
            <form id="editBookForm" class="book-form" autocomplete="off">
              <label class="field"><input name="name" type="text" placeholder="Book Name" required /></label>
              <label class="field"><input name="author" type="text" placeholder="Author" required /></label>
              <label class="field"><textarea name="description" placeholder="Description"></textarea></label>
              <label class="field"><input name="genre" type="text" placeholder="Genre" /></label>
              <label class="field">
                <select name="category" required>
                  <option value="" disabled>Category</option>
                  <option value="educational">Educational</option>
                  <option value="novel">Novel</option>
                  <option value="graphic">Graphic Novel</option>
                </select>
              </label>
              <label class="field"><input name="coverPath" type="text" placeholder="Cover Image Path" /></label>
              <label class="field"><input name="coverFile" type="file" accept="image/*" /></label>
            </form>
          </div>
          <div class="modal-bottombar">
            <div class="modal-actions">
              <button id="confirmEditBook" class="btn confirm">CONFIRM</button>
              <button id="clearEditForm" class="btn clear" type="button">CLEAR</button>
              <button id="closeEditModal" class="btn cancel" type="button">CANCEL</button>
            </div>
          </div>
        </div>
      </div>
    `);
    document.body.appendChild(frag);
  }

  // Utility helpers used by the BookManagement code copy
  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }

  /* -----------------------
     BookManagement-style edit/delete logic (delegated)
  -------------------------*/
  document.addEventListener('DOMContentLoaded', () => {
    ensureEditModalExists();

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

    // delegated handler for edit / delete on the table
    document.addEventListener('click', (e) => {
      const editBtn = e.target.closest && e.target.closest('.edit-btn');
      if (editBtn) {
        const tr = editBtn.closest('tr');
        if (!tr) return;
        activeRow = tr;

        // populate form fields from data-col cells (or table cells)
        const getCellText = (col) => {
          const el = tr.querySelector(`[data-col="${col}"]`);
          return el ? el.textContent.trim() : '';
        };

        // set form fields (same names used in BookManagement form)
        setFieldValue(editForm, 'name', getCellText('name') || (tr.cells[1] && tr.cells[1].textContent.trim()));
        setFieldValue(editForm, 'author', getCellText('author') || (tr.cells[2] && tr.cells[2].textContent.trim()));
        setFieldValue(editForm, 'description', getFieldValueFromRow(tr, 'description'));
        setFieldValue(editForm, 'genre', getFieldValueFromRow(tr, 'genre'));
        setFieldValue(editForm, 'category', getCellText('category') || (tr.cells[3] && tr.cells[3].textContent.trim()));
        setFieldValue(editForm, 'coverPath', getCellText('cover') || '');

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

        // optional: update description and genre if your rows include those cells
        hideEditModal();
      });
    }

    if (closeEditBtn) closeEditBtn.addEventListener('click', (e) => { e.preventDefault(); hideEditModal(); });
    if (clearEditBtn) clearEditBtn.addEventListener('click', (e) => { e.preventDefault(); if (editForm) editForm.reset(); });
  });

  // small helpers copied from BookManagement.js
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

  // Execute data loader on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', loadData);

  // Escape key close for mobile sidebar
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isMobileWidth() && sid && sid.classList.contains('expanded')) {
      sid.classList.remove('expanded');
      mainContent.classList.add('full');
      if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
    }
  });
})();
