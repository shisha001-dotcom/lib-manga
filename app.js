/* ============================
   MANGA COLLECTION — app.js
   ============================ */

'use strict';

/* ─── Constants ─── */
const STORAGE_KEY = 'manga_collection_v2';
const DEFAULT_COVER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="560" viewBox="0 0 400 560"%3E%3Crect fill="%230d1117" width="400" height="560"/%3E%3Ctext x="200" y="290" text-anchor="middle" font-size="72" fill="%23333"%3E📚%3C/text%3E%3C/svg%3E';

/* ─── State ─── */
let state = {
  books: [],
  editId: null,
  confirmDeleteId: null,
  viewMode: 'grid',   // 'grid' | 'list'
  sortBy: 'newest',   // 'newest' | 'oldest' | 'az' | 'za' | 'most' | 'missing'
  search: '',
};

/* ─── Storage helpers ─── */
function loadBooks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultBooks();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return getDefaultBooks();
    return parsed;
  } catch (e) {
    console.warn('[MangaCol] Failed to parse storage:', e);
    return getDefaultBooks();
  }
}

function saveBooks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.books));
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      showToast('Bộ nhớ đầy! Hãy xóa bớt dữ liệu cũ.', 'error');
    } else {
      console.error('[MangaCol] Save error:', e);
    }
  }
}

function getDefaultBooks() {
  return [
    {
      id: 1,
      name: 'One Piece',
      volumes: [1, 2, 3, 4, 5, 6, 9, 12],
      totalVolumes: 12,
      cover: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQtU4npgPciG-vcOUxvZ8JXUtX4Y5QA4wG7lNOl3jVOiJQ-lJK6OZn2QWzzNqA8c1qRpiDZZb3xT3key0g9tJQV0jKmteWkTj-DQH6Biw&s=10',
      volumeCovers: {
        1: 'https://static.wikia.nocookie.net/onepiece/images/0/0e/Volume_1.png/revision/latest/thumbnail/width/360/height/360?cb=20220426144844',
      },
      tags: ['Shounen', 'Adventure'],
      createdAt: Date.now() - 1000000,
    },
  ];
}

/* ─── Volume parsing ─── */
function parseVolumes(str) {
  if (!str || !str.trim()) return [];
  const errors = [];
  const nums = str.split(',').map(v => {
    const n = parseInt(v.trim(), 10);
    if (isNaN(n)) errors.push(v.trim());
    return n;
  }).filter(v => !isNaN(v) && v > 0);

  if (errors.length) {
    showToast(`Bỏ qua giá trị không hợp lệ: ${errors.join(', ')}`, 'info');
  }
  return [...new Set(nums)].sort((a, b) => a - b);
}

function parseCoverMap(text) {
  const map = {};
  if (!text || !text.trim()) return map;
  text.split('\n').forEach((line, i) => {
    const parts = line.split('|');
    if (parts.length < 2) {
      if (line.trim()) console.warn(`[MangaCol] Line ${i + 1} ignored: "${line}"`);
      return;
    }
    const volStr = parts[0].replace(/tập/i, '').trim();
    const vol = parseInt(volStr, 10);
    const url = parts[1].trim();
    if (isNaN(vol)) {
      console.warn(`[MangaCol] Cannot parse volume number: "${parts[0]}"`);
      return;
    }
    if (!url.startsWith('http')) {
      console.warn(`[MangaCol] Suspicious URL on line ${i + 1}: "${url}"`);
    }
    map[vol] = url;
  });
  return map;
}

function parseTags(str) {
  if (!str || !str.trim()) return [];
  return str.split(',').map(t => t.trim()).filter(Boolean);
}

/* ─── Validation ─── */
function validateForm() {
  let valid = true;

  const nameVal = q('#bookName').value.trim();
  if (!nameVal) {
    setFieldError('bookName', 'Vui lòng nhập tên truyện');
    valid = false;
  } else {
    clearFieldError('bookName');
  }

  // Duplicate check (only when adding, not editing)
  if (!state.editId) {
    const dup = state.books.find(b => b.name.toLowerCase() === nameVal.toLowerCase());
    if (dup) {
      setFieldError('bookName', `"${dup.name}" đã tồn tại trong kho`);
      valid = false;
    }
  }

  const volVal = q('#bookVolumes').value.trim();
  if (!volVal) {
    setFieldError('bookVolumes', 'Nhập ít nhất 1 tập');
    valid = false;
  } else {
    clearFieldError('bookVolumes');
  }

  return valid;
}

function setFieldError(id, msg) {
  const input = q(`#${id}`);
  const err = q(`#${id}Error`);
  input.classList.add('error');
  if (err) { err.textContent = msg; err.classList.add('visible'); }
}

function clearFieldError(id) {
  const input = q(`#${id}`);
  const err = q(`#${id}Error`);
  input.classList.remove('error');
  if (err) err.classList.remove('visible');
}

function clearAllErrors() {
  ['bookName', 'bookVolumes'].forEach(clearFieldError);
}

/* ─── CRUD ─── */
function addBook() {
  if (!validateForm()) return;

  const name         = q('#bookName').value.trim();
  const volumes      = parseVolumes(q('#bookVolumes').value);
  const totalVols    = parseInt(q('#totalVolumes2').value.trim(), 10) || Math.max(...volumes, 0);
  const cover        = q('#bookCover').value.trim();
  const volumeCovers = parseCoverMap(q('#volumeCovers').value);
  const tags         = parseTags(q('#bookTags').value);

  if (state.editId) {
    // Update existing
    const idx = state.books.findIndex(b => b.id === state.editId);
    if (idx !== -1) {
      state.books[idx] = {
        ...state.books[idx],
        name,
        volumes,
        totalVolumes: totalVols,
        cover,
        volumeCovers,
        tags,
        updatedAt: Date.now(),
      };
      showToast(`✏️ Đã cập nhật "${name}"`, 'success');
    }
    cancelEdit();
  } else {
    // Add new
    state.books.unshift({
      id: Date.now(),
      name,
      volumes,
      totalVolumes: totalVols,
      cover,
      volumeCovers,
      tags,
      createdAt: Date.now(),
    });
    showToast(`✅ Đã thêm "${name}" vào kho`, 'success');
  }

  saveBooks();
  resetForm();
  render();
}

function startEdit(id) {
  const book = state.books.find(b => b.id === id);
  if (!book) return;

  state.editId = id;
  q('#bookName').value = book.name;
  q('#bookVolumes').value = book.volumes.join(',');
  q('#totalVolumes2').value = book.totalVolumes || '';
  q('#bookCover').value = book.cover || '';
  q('#bookTags').value = (book.tags || []).join(', ');

  // Rebuild volumeCovers textarea
  const lines = Object.entries(book.volumeCovers || {})
    .sort(([a], [b]) => +a - +b)
    .map(([vol, url]) => `Tập ${vol}|${url}`)
    .join('\n');
  q('#volumeCovers').value = lines;

  // Update cover preview
  updateCoverPreview(book.cover);

  // Change button label
  q('#addBtnLabel').textContent = 'Lưu thay đổi';
  q('#cancelEditBtn').classList.add('visible');
  q('.side-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
  q('#bookName').focus();
}

function cancelEdit() {
  state.editId = null;
  q('#addBtnLabel').textContent = 'Thêm vào kho';
  q('#cancelEditBtn').classList.remove('visible');
  resetForm();
}

function confirmDelete(id) {
  const book = state.books.find(b => b.id === id);
  if (!book) return;
  state.confirmDeleteId = id;
  q('#modalBookName').textContent = book.name;
  q('#deleteModal').classList.add('open');
}

function executeDelete() {
  const id = state.confirmDeleteId;
  if (!id) return;
  const book = state.books.find(b => b.id === id);
  state.books = state.books.filter(b => b.id !== id);
  saveBooks();
  render();
  closeModal();
  showToast(`🗑️ Đã xóa "${book?.name}"`, 'info');
  state.confirmDeleteId = null;
}

function closeModal() {
  q('#deleteModal').classList.remove('open');
}

/* ─── Filtering & Sorting ─── */
function getFiltered() {
  let list = [...state.books];

  if (state.search) {
    const q = state.search.toLowerCase();
    list = list.filter(b =>
      b.name.toLowerCase().includes(q) ||
      (b.tags || []).some(t => t.toLowerCase().includes(q))
    );
  }

  switch (state.sortBy) {
    case 'newest':  list.sort((a, b) => b.createdAt - a.createdAt); break;
    case 'oldest':  list.sort((a, b) => a.createdAt - b.createdAt); break;
    case 'az':      list.sort((a, b) => a.name.localeCompare(b.name, 'vi')); break;
    case 'za':      list.sort((a, b) => b.name.localeCompare(a.name, 'vi')); break;
    case 'most':    list.sort((a, b) => b.volumes.length - a.volumes.length); break;
    case 'missing': list.sort((a, b) => getMissingVolumes(b).length - getMissingVolumes(a).length); break;
  }

  return list;
}

function getMissingVolumes(book) {
  const max = book.totalVolumes || Math.max(...book.volumes, 0);
  const missing = [];
  for (let i = 1; i <= max; i++) {
    if (!book.volumes.includes(i)) missing.push(i);
  }
  return missing;
}

/* ─── Render ─── */
function render() {
  renderStats();
  renderGrid();
}

function renderStats() {
  const total    = state.books.length;
  const volCount = state.books.reduce((a, b) => a + b.volumes.length, 0);
  const missing  = state.books.filter(b => getMissingVolumes(b).length > 0).length;
  const complete = state.books.filter(b => getMissingVolumes(b).length === 0).length;

  setText('#statTotal',    total);
  setText('#statVolumes',  volCount);
  setText('#statMissing',  missing);
  setText('#statComplete', complete);
}

function renderGrid() {
  const grid     = q('#bookGrid');
  const filtered = getFiltered();

  setText('#filteredCount', filtered.length);

  grid.className = 'book-grid' + (state.viewMode === 'list' ? ' list-view' : '');

  if (!filtered.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">${state.search ? '🔍' : '📭'}</div>
        <h2>${state.search ? 'Không tìm thấy kết quả' : 'Kho truyện đang trống'}</h2>
        <p>${state.search ? `Thử tìm với từ khóa khác` : 'Hãy thêm bộ truyện đầu tiên!'}</p>
      </div>`;
    return;
  }

  grid.innerHTML = filtered.map(book => buildBookCard(book)).join('');

  // Lazy-load images: handle broken cover
  grid.querySelectorAll('.main-cover').forEach(img => {
    img.addEventListener('error', function () {
      this.src = DEFAULT_COVER;
      this.classList.add('broken');
    });
  });
}

function buildBookCard(book) {
  const missing = getMissingVolumes(book);
  const max     = book.totalVolumes || Math.max(...book.volumes, 0);
  const pct     = max > 0 ? Math.round((book.volumes.length / max) * 100) : 100;
  const isComplete = missing.length === 0;
  const cover   = book.cover || DEFAULT_COVER;

  // Volume chips
  let chips = '';
  const displayMax = Math.min(max, 60); // cap at 60 chips
  for (let i = 1; i <= displayMax; i++) {
    const have   = book.volumes.includes(i);
    const imgUrl = book.volumeCovers?.[i];
    chips += `
      <div class="vol-chip ${have ? 'have' : 'missing-chip'}" title="Tập ${i}${have ? '' : ' (thiếu)'}">
        ${imgUrl && have ? `<img src="${imgUrl}" alt="Tập ${i}" loading="lazy" onerror="this.remove()">` : ''}
        <span class="vol-num">${i}</span>
      </div>`;
  }
  if (max > 60) {
    chips += `<div class="vol-chip" style="background:var(--surface3);color:var(--muted)">+${max - 60}</div>`;
  }

  // Tags
  const tagHTML = (book.tags || []).length
    ? (book.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')
    : '';

  return `
    <div class="book-card" data-id="${book.id}">
      <img src="${escapeHtml(cover)}" class="main-cover" alt="${escapeHtml(book.name)}" loading="lazy">
      <div class="book-content">
        <div class="book-meta">
          <div class="book-name">${escapeHtml(book.name)}</div>
          <div class="book-actions">
            <button class="icon-btn edit-btn" onclick="startEdit(${book.id})" title="Chỉnh sửa">✏️</button>
            <button class="icon-btn delete-btn" onclick="confirmDelete(${book.id})" title="Xóa">🗑️</button>
          </div>
        </div>

        <div class="status-badge ${isComplete ? 'complete' : 'missing'}">
          ${isComplete
            ? '✅ Đủ bộ'
            : `⚠️ Thiếu ${missing.length} tập: ${missing.slice(0, 8).join(', ')}${missing.length > 8 ? '…' : ''}`}
        </div>

        ${max > 0 ? `
        <div class="progress-wrap">
          <div class="progress-label">
            <span>Tiến độ sưu tập</span>
            <span>${book.volumes.length} / ${max} tập (${pct}%)</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width:${pct}%"></div>
          </div>
        </div>` : ''}

        <div class="volume-list">${chips}</div>

      </div>
      <div class="book-footer">
        <div class="tag-list">${tagHTML}</div>
        <div>📦 ${book.volumes.length} tập</div>
      </div>
    </div>`;
}

/* ─── Form helpers ─── */
function resetForm() {
  ['bookName', 'bookVolumes', 'totalVolumes2', 'bookCover', 'bookTags', 'volumeCovers'].forEach(id => {
    const el = q(`#${id}`);
    if (el) el.value = '';
  });
  updateCoverPreview('');
  clearAllErrors();
}

function updateCoverPreview(url) {
  const prev = q('#coverPreview');
  if (!url || !url.startsWith('http')) {
    prev.classList.remove('visible');
    prev.src = '';
    return;
  }
  prev.src = url;
  prev.classList.add('visible');
  prev.onerror = () => {
    prev.classList.remove('visible');
    showToast('Không tải được ảnh bìa, kiểm tra lại URL.', 'error');
  };
}

/* ─── Toast ─── */
function showToast(msg, type = 'info', duration = 3000) {
  const container = q('#toastContainer');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  el.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${msg}</span>`;
  container.appendChild(el);

  setTimeout(() => {
    el.classList.add('hiding');
    el.addEventListener('animationend', () => el.remove());
  }, duration);
}

/* ─── Utilities ─── */
function q(sel) { return document.querySelector(sel); }
function setText(sel, val) {
  const el = q(sel);
  if (el) el.textContent = val;
}
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ─── Init ─── */
document.addEventListener('DOMContentLoaded', () => {
  state.books = loadBooks();

  // Search
  q('#searchInput').addEventListener('input', e => {
    state.search = e.target.value.trim();
    render();
  });

  // Sort
  q('#sortSelect').addEventListener('change', e => {
    state.sortBy = e.target.value;
    render();
  });

  // View toggle
  q('#viewGrid').addEventListener('click', () => {
    state.viewMode = 'grid';
    q('#viewGrid').classList.add('active');
    q('#viewList').classList.remove('active');
    render();
  });

  q('#viewList').addEventListener('click', () => {
    state.viewMode = 'list';
    q('#viewList').classList.add('active');
    q('#viewGrid').classList.remove('active');
    render();
  });

  // Cover preview on input
  q('#bookCover').addEventListener('input', e => {
    updateCoverPreview(e.target.value.trim());
  });

  // Clear errors on input
  q('#bookName').addEventListener('input', () => clearFieldError('bookName'));
  q('#bookVolumes').addEventListener('input', () => clearFieldError('bookVolumes'));

  // Modal close on backdrop click
  q('#deleteModal').addEventListener('click', e => {
    if (e.target === q('#deleteModal')) closeModal();
  });

  // Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeModal();
      if (state.editId) cancelEdit();
    }
  });

  render();
});
