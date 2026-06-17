/* ===================================================
   js/book-detail.js
   Phụ thuộc: supabase.js, ui.js, auth.js, data/books.js
   =================================================== */

const params  = new URLSearchParams(window.location.search);
const bookId  = params.get('id');

let currentBook     = null;
let currentFilter   = 'all';
let filteredVolumes = [];
let lightboxIndex   = 0;

window.addEventListener('booksLoaded', () => {
  const book = books.find(b => b.id === bookId);
  if (!book) {
    document.getElementById('bookTitle').innerText = 'Không tìm thấy bộ truyện';
    return;
  }
  currentBook = book;
  document.title = book.title + ' — Kho Sách';
  document.getElementById('bookTitle').innerText = book.title;
  updateProgress(book);
  updateCounts(book);
  renderVolumes(book);
  if (isAdmin) document.getElementById('addVolBtn').style.display = '';
  if (params.get('filter') === 'missing') {
    const btn = document.querySelector('.filter-btn:nth-child(3)');
    if (btn) setFilter('missing', btn);
  }
});

function updateProgress(book) {
  document.getElementById('bookProgress').innerText = `${book.owned}/${book.total} tập`;
}

function updateCounts(book) {
  const owned = book.volumes.filter(v => v.owned).length;
  document.getElementById('countAll').textContent     = book.volumes.length;
  document.getElementById('countOwned').textContent   = owned;
  document.getElementById('countMissing').textContent = book.volumes.length - owned;
}

function setFilter(filter, btn) {
  currentFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderVolumes(currentBook);
}

function renderVolumes(book) {
  const gridEl = document.getElementById('volumesGrid');
  filteredVolumes = book.volumes.filter(v => {
    if (currentFilter === 'owned')   return v.owned;
    if (currentFilter === 'missing') return !v.owned;
    return true;
  });
  if (!filteredVolumes.length) {
    gridEl.innerHTML = `<p class="empty-msg">Không có tập nào.</p>`;
    return;
  }
  gridEl.innerHTML = filteredVolumes.map((volume, idx) => `
    <div class="volume-card${volume.owned ? '' : ' missing'}" data-idx="${idx}">
      <div class="volume-cover" style="background-image:url('${volume.cover}')">
        ${volume.owned ? `<div class="owned-check">✓</div>` : `<div class="missing-mark">✗</div>`}
        <div class="cover-zoom-hint">🔍</div>
      </div>
      <div class="volume-number">Tập ${volume.number}</div>
    </div>
  `).join('');
  gridEl.querySelectorAll('.volume-cover').forEach(el => {
    el.addEventListener('click', () => openLightbox(parseInt(el.closest('[data-idx]').dataset.idx)));
  });
}

/* ── Lightbox ── */
function openLightbox(idx) {
  lightboxIndex = idx;
  showLightboxAt(idx);
  document.getElementById('lightbox').classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  document.getElementById('lightbox').classList.remove('active');
  document.body.style.overflow = '';
}
function showLightboxAt(idx) {
  const v = filteredVolumes[idx];
  document.getElementById('lightboxImg').src = v.cover;
  document.getElementById('lightboxCaption').textContent = `${currentBook.title} — Tập ${v.number}`;
  document.querySelector('.lightbox-prev').style.visibility = idx === 0 ? 'hidden' : 'visible';
  document.querySelector('.lightbox-next').style.visibility = idx === filteredVolumes.length - 1 ? 'hidden' : 'visible';
}
function lightboxPrev(e) { e.stopPropagation(); if (lightboxIndex > 0) showLightboxAt(--lightboxIndex); }
function lightboxNext(e) { e.stopPropagation(); if (lightboxIndex < filteredVolumes.length - 1) showLightboxAt(++lightboxIndex); }

document.addEventListener('keydown', e => {
  if (!document.getElementById('lightbox').classList.contains('active')) return;
  if (e.key === 'ArrowLeft')  lightboxPrev(e);
  if (e.key === 'ArrowRight') lightboxNext(e);
  if (e.key === 'Escape')     closeLightbox();
});

function goBack() { window.history.back(); }

/* ── Bottom Sheet ── */
function openAddVolSheet() {
  if (!currentBook) return;
  document.getElementById('sheetSub').textContent   = `${currentBook.title} · ${currentBook.volumes.length} tập`;
  document.getElementById('sheetVolNum').value       = nextVolNum(currentBook.volumes);
  document.getElementById('sheetVolCover').value     = '';
  document.getElementById('sheetMsg').className      = 'sheet-msg';
  renderSheetVolList();
  document.getElementById('sheetBackdrop').classList.add('open');
  document.getElementById('bottomSheet').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeAddVolSheet() {
  document.getElementById('sheetBackdrop').classList.remove('open');
  document.getElementById('bottomSheet').classList.remove('open');
  document.body.style.overflow = '';
}

function _syncSheet() {
  currentBook.owned = currentBook.volumes.filter(x => x.owned).length;
  updateProgress(currentBook);
  updateCounts(currentBook);
  renderVolumes(currentBook);
  document.getElementById('sheetSub').textContent = `${currentBook.title} · ${currentBook.volumes.length} tập`;
}

function renderSheetVolList() {
  const listEl = document.getElementById('sheetVolList');
  const vols   = [...currentBook.volumes].sort((a, b) => a.number - b.number);
  if (!vols.length) {
    listEl.innerHTML = '<div style="color:var(--text-3);font-size:14px;text-align:center;padding:16px 0">Chưa có tập nào.</div>';
    return;
  }
  listEl.innerHTML = vols.map(v => `
    <div class="vl-row ${v.owned ? 'owned' : ''}" id="vl-${v.id}" data-vol-id="${v.id}" data-owned="${v.owned}">
      <div class="vl-cover-wrap" data-toggle-id="${v.id}">
        ${v.cover
          ? `<img class="vl-cover" src="${esc(v.cover)}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
             <div class="vl-cover-placeholder" style="display:none">📖</div>`
          : `<div class="vl-cover-placeholder">📖</div>`}
        <div class="vl-owned-badge">${v.owned ? '✓' : ''}</div>
      </div>
      <div class="vl-info">
        <div class="vl-num">Tập ${v.number}</div>
        <div class="vl-url-row">
          <input class="vl-url-input" type="url" inputmode="url" placeholder="https://... (URL ảnh bìa)"
            value="${esc(v.cover || '')}" data-vol-id="${v.id}">
          <button class="vl-save-btn" data-vol-id="${v.id}" onclick="sheetSaveCover(this)">💾</button>
        </div>
      </div>
      <button class="vl-del-btn" onclick="event.stopPropagation(); sheetDeleteVol(${v.id})">✕</button>
    </div>
  `).join('');

  bindTouchTap(listEl, '.vl-cover-wrap', el => {
    const row = document.getElementById('vl-' + el.dataset.toggleId);
    if (row) sheetToggleOwned(parseInt(el.dataset.toggleId), row.dataset.owned === 'true');
  });
}

async function sheetSaveCover(btn) {
  const volId  = parseInt(btn.dataset.volId);
  const newUrl = btn.previousElementSibling.value.trim() || null;
  const msgEl  = document.getElementById('sheetMsg');
  btn.disabled = true; btn.textContent = '⏳';
  try {
    await sbPatch('volumes', `id=eq.${volId}`, { cover: newUrl });
    const v = currentBook.volumes.find(x => x.id === volId);
    if (v) v.cover = newUrl;
    renderVolumes(currentBook);
    updateCoverImg(document.getElementById('vl-' + volId), newUrl);
    msgEl.textContent = 'Đã cập nhật bìa ✓'; msgEl.className = 'sheet-msg success';
    setTimeout(() => { msgEl.className = 'sheet-msg'; }, 2500);
  } catch (e) {
    msgEl.textContent = 'Lỗi: ' + e.message; msgEl.className = 'sheet-msg error';
  } finally {
    btn.disabled = false; btn.textContent = '💾';
  }
}

async function sheetToggleOwned(volId, currentOwned) {
  const msgEl = document.getElementById('sheetMsg');
  try {
    await sbPatch('volumes', `id=eq.${volId}`, { owned: !currentOwned });
    const v = currentBook.volumes.find(x => x.id === volId);
    if (v) v.owned = !currentOwned;
    _syncSheet();
    const row = document.getElementById('vl-' + volId);
    if (row) {
      const n = !currentOwned;
      row.dataset.owned = String(n);
      row.classList.toggle('owned', n);
      row.querySelector('.vl-owned-badge').textContent = n ? '✓' : '';
    }
  } catch (e) {
    msgEl.textContent = 'Lỗi: ' + e.message; msgEl.className = 'sheet-msg error';
  }
}

async function sheetAddVolume() {
  const num   = parseInt(document.getElementById('sheetVolNum').value);
  const cover = document.getElementById('sheetVolCover').value.trim() || null;
  const msgEl = document.getElementById('sheetMsg');
  msgEl.className = 'sheet-msg';
  if (!num || num < 1) {
    msgEl.textContent = 'Số tập không hợp lệ.'; msgEl.className = 'sheet-msg error'; return;
  }
  if (currentBook.volumes.find(v => v.number === num)) {
    msgEl.textContent = `Tập ${num} đã tồn tại.`; msgEl.className = 'sheet-msg error'; return;
  }
  const btn = document.querySelector('.sheet-add-btn');
  btn.disabled = true; btn.textContent = 'Đang thêm...';
  try {
    const res = await sbPost('volumes', { book_id: bookId, number: num, owned: false, cover });
    currentBook.volumes.push(res[0]);
    currentBook.total = currentBook.volumes.length;
    document.getElementById('sheetVolNum').value   = nextVolNum(currentBook.volumes);
    document.getElementById('sheetVolCover').value = '';
    _syncSheet();
    renderSheetVolList();
    msgEl.textContent = `Đã thêm tập ${num} ✓`; msgEl.className = 'sheet-msg success';
    setTimeout(() => { msgEl.className = 'sheet-msg'; }, 2500);
  } catch (e) {
    msgEl.textContent = 'Lỗi: ' + e.message; msgEl.className = 'sheet-msg error';
  } finally {
    btn.disabled = false; btn.innerHTML = '＋ Thêm tập';
  }
}

async function sheetDeleteVol(volId) {
  const msgEl = document.getElementById('sheetMsg');
  try {
    await sbDelete('volumes', `id=eq.${volId}`);
    currentBook.volumes = currentBook.volumes.filter(x => x.id !== volId);
    currentBook.total   = currentBook.volumes.length;
    _syncSheet();
    renderSheetVolList();
  } catch (e) {
    msgEl.textContent = 'Lỗi xóa: ' + e.message; msgEl.className = 'sheet-msg error';
  }
}
