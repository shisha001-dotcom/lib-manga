/* ============================================================
   MANGA COLLECTION — app.js
   ============================================================

   ╔══════════════════════════════════════════════════════════╗
   ║          HƯỚNG DẪN THÊM SÁCH THỦ CÔNG BẰNG TAY          ║
   ╠══════════════════════════════════════════════════════════╣
   ║                                                          ║
   ║  Mở file này (app.js) và tìm hàm getDefaultBooks()      ║
   ║  bên dưới. Thêm một object mới vào trong mảng return []. ║
   ║                                                          ║
   ║  Cấu trúc một cuốn sách:                                 ║
   ║                                                          ║
   ║  {                                                       ║
   ║    id: <số nguyên duy nhất, dùng Date.now() hoặc 1,2,3> ║
   ║    name: 'Tên truyện',                                   ║
   ║    volumes: [1, 2, 3, 5, 7],  // danh sách tập đang có  ║
   ║    totalVolumes: 12,           // tổng số tập của bộ     ║
   ║    cover: 'https://...',       // URL ảnh bìa bộ         ║
   ║    volumeCovers: {             // ảnh bìa từng tập       ║
   ║      1: 'https://...',         // (có thể để {} nếu      ║
   ║      2: 'https://...',         //  không có ảnh tập)     ║
   ║    },                                                    ║
   ║    tags: ['Shounen', 'Action'],// thể loại               ║
   ║    synopsis: 'Tóm tắt...',    // tóm tắt nội dung       ║
   ║    createdAt: Date.now(),      // thời gian thêm vào     ║
   ║  }                                                       ║
   ║                                                          ║
   ║  LƯU Ý QUAN TRỌNG:                                       ║
   ║  • id phải là số nguyên DUY NHẤT, không được trùng       ║
   ║  • volumes là mảng số: [1,2,3] không phải ['1','2','3'] ║
   ║  • Dùng id khác nhau: 1, 2, 3... hoặc Date.now() - N    ║
   ║  • Sau khi sửa file, reload lại trang web               ║
   ║  • Nếu đã có dữ liệu trong localStorage, bạn cần         ║
   ║    xóa localStorage trước (F12 → Application →          ║
   ║    Local Storage → xóa key "manga_collection_v2")        ║
   ║    hoặc đổi tên STORAGE_KEY thành v3, v4...             ║
   ║                                                          ║
   ║  VÍ DỤ THÊM SÁCH:                                        ║
   ║                                                          ║
   ║  {                                                       ║
   ║    id: 2,                                                ║
   ║    name: 'Naruto',                                       ║
   ║    volumes: [1,2,3,4,5,6,7,8,10,11],                    ║
   ║    totalVolumes: 72,                                     ║
   ║    cover: 'https://example.com/naruto-cover.jpg',        ║
   ║    volumeCovers: {                                       ║
   ║      1: 'https://example.com/naruto-vol1.jpg',           ║
   ║    },                                                    ║
   ║    tags: ['Shounen', 'Action', 'Ninja'],                 ║
   ║    synopsis: 'Câu chuyện về Naruto Uzumaki...',          ║
   ║    createdAt: Date.now() - 500000,                       ║
   ║  },                                                      ║
   ║                                                          ║
   ╚══════════════════════════════════════════════════════════╝
*/

'use strict';

/* ─── Constants ─── */
// ĐỔI v2 → v3, v4... mỗi khi muốn reset dữ liệu về mặc định
const STORAGE_KEY = 'manga_collection_v2';
const DEFAULT_COVER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="560" viewBox="0 0 400 560"%3E%3Crect fill="%230d1117" width="400" height="560"/%3E%3Ctext x="200" y="290" text-anchor="middle" font-size="72" fill="%23333"%3E📚%3C/text%3E%3C/svg%3E';

/* ─── State ─── */
let state = {
  books: [],
  editId: null,
  confirmDeleteId: null,
  viewMode: 'grid',    // 'grid' | 'list'
  sortBy: 'newest',
  search: '',
  activeTag: null,     // tag đang được lọc
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

/* ────────────────────────────────────────────────────────────
   DỮ LIỆU MẶC ĐỊNH — CHỈNH SỬA TẠI ĐÂY ĐỂ THÊM SÁCH THỦ CÔNG
   Đọc hướng dẫn ở đầu file để biết cách thêm đúng cấu trúc.
   ──────────────────────────────────────────────────────────── */
function getDefaultBooks() {
  return [
    // ── SÁCH MẪU — xóa hoặc thay thế bằng bộ sưu tập của bạn ──
    {
      id: 1,
      name: 'One Piece',
      volumes: [1, 2, 3, 4, 5, 6, 9, 12],
      totalVolumes: 12,
      cover: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQtU4npgPciG-vcOUxvZ8JXUtX4Y5QA4wG7lNOl3jVOiJQ-lJK6OZn2QWzzNqA8c1qRpiDZZb3xT3key0g9tJQV0jKmteWkTj-DQH6Biw&s=10',
      volumeCovers: {
        1: 'https://static.wikia.nocookie.net/onepiece/images/0/0e/Volume_1.png/revision/latest/thumbnail/width/360/height/360?cb=20220426144844',
      },
      tags: ['Shounen', 'Adventure', 'Fantasy'],
      synopsis: 'Monkey D. Luffy, một chàng trai trẻ với ước mơ trở thành Vua Hải Tặc, tập hợp thuyền viên và bắt đầu hành trình vĩ đại trên biển Grand Line để tìm kiếm kho báu One Piece.',
      createdAt: Date.now() - 1000000,
    },
    // ── THÊM SÁCH MỚI Ở ĐÂY ── (copy object bên trên, đổi id thành 2, 3...)
  ];
}

/* ─── Volume parsing ─── */
function parseVolumes(str) {
  if (!str || !str.trim()) return [];
  const errors = [];

  // Hỗ trợ dải: "1-10,12" → [1,2,3,...,10,12]
  const parts = str.split(',').map(v => v.trim()).filter(Boolean);
  const nums = [];
  parts.forEach(part => {
    const rangeMatch = part.match(/^(\d+)-(\d+)$/);
    if (rangeMatch) {
      const from = parseInt(rangeMatch[1], 10);
      const to   = parseInt(rangeMatch[2], 10);
      if (from <= to && to - from < 500) {
        for (let i = from; i <= to; i++) nums.push(i);
      } else {
        errors.push(part);
      }
    } else {
      const n = parseInt(part, 10);
      if (isNaN(n) || n <= 0) errors.push(part);
      else nums.push(n);
    }
  });

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
    const vol    = parseInt(volStr, 10);
    const url    = parts[1].trim();
    if (isNaN(vol)) { console.warn(`Cannot parse volume: "${parts[0]}"`); return; }
    map[vol] = url;
  });
  return map;
}

function parseTags(str) {
  if (!str || !str.trim()) return [];
  return str.split(',').map(t => t.trim()).filter(Boolean);
}

/* ─── Validation (chỉ dùng cho form sửa) ─── */
function validateEditForm() {
  let valid = true;

  const nameVal = q('#bookName').value.trim();
  if (!nameVal) {
    setFieldError('bookName', 'Vui lòng nhập tên truyện');
    valid = false;
  } else {
    // Kiểm tra trùng tên (ngoại trừ chính nó)
    const dup = state.books.find(b => b.name.toLowerCase() === nameVal.toLowerCase() && b.id !== state.editId);
    if (dup) {
      setFieldError('bookName', `"${dup.name}" đã tồn tại trong kho`);
      valid = false;
    } else {
      clearFieldError('bookName');
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
  const err   = q(`#${id}Error`);
  if (input) input.classList.add('error');
  if (err) { err.textContent = msg; err.classList.add('visible'); }
}

function clearFieldError(id) {
  const input = q(`#${id}`);
  const err   = q(`#${id}Error`);
  if (input) input.classList.remove('error');
  if (err) err.classList.remove('visible');
}

/* ─── Edit (Sửa) ─── */
function startEdit(id) {
  // Đóng detail modal nếu đang mở
  closeDetailModal();

  const book = state.books.find(b => b.id === id);
  if (!book) return;

  state.editId = id;
  q('#bookName').value    = book.name;
  q('#bookVolumes').value = book.volumes.join(',');
  q('#totalVolumes2').value = book.totalVolumes || '';
  q('#bookCover').value   = book.cover || '';
  q('#bookTags').value    = (book.tags || []).join(', ');
  q('#volumeCovers').value = Object.entries(book.volumeCovers || {})
    .sort(([a], [b]) => +a - +b)
    .map(([vol, url]) => `Tập ${vol}|${url}`)
    .join('\n');

  // Textarea synopsis
  if (q('#bookSynopsis')) {
    q('#bookSynopsis').value = book.synopsis || '';
  }

  updateCoverPreview(book.cover);
  clearFieldError('bookName');
  clearFieldError('bookVolumes');

  q('#editModal').classList.add('open');
}

function saveEdit() {
  if (!validateEditForm()) return;

  const name         = q('#bookName').value.trim();
  const volumes      = parseVolumes(q('#bookVolumes').value);
  const totalVols    = parseInt(q('#totalVolumes2').value.trim(), 10) || Math.max(...volumes, 0);
  const cover        = q('#bookCover').value.trim();
  const volumeCovers = parseCoverMap(q('#volumeCovers').value);
  const tags         = parseTags(q('#bookTags').value);
  const synopsis     = q('#bookSynopsis') ? q('#bookSynopsis').value.trim() : '';

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
      synopsis,
      updatedAt: Date.now(),
    };
    showToast(`✏️ Đã cập nhật "${name}"`, 'success');
  }

  saveBooks();
  closeEditModal();
  render();
  renderTagFilter(); // cập nhật tag chips
}

function closeEditModal() {
  state.editId = null;
  q('#editModal').classList.remove('open');
}

/* ─── Delete ─── */
function confirmDelete(id) {
  const book = state.books.find(b => b.id === id);
  if (!book) return;
  state.confirmDeleteId = id;
  q('#modalBookName').textContent = book.name;
  q('#deleteModal').classList.add('open');
}

function executeDelete() {
  const id   = state.confirmDeleteId;
  if (!id) return;
  const book = state.books.find(b => b.id === id);
  state.books = state.books.filter(b => b.id !== id);
  saveBooks();
  render();
  renderTagFilter();
  closeDeleteModal();
  closeDetailModal(); // đóng cả detail nếu đang xem
  showToast(`🗑️ Đã xóa "${book?.name}"`, 'info');
  state.confirmDeleteId = null;
}

function closeDeleteModal() {
  q('#deleteModal').classList.remove('open');
}

/* ─── Detail Modal ─── */
function openDetail(id) {
  const book = state.books.find(b => b.id === id);
  if (!book) return;

  const missing     = getMissingVolumes(book);
  const max         = book.totalVolumes || Math.max(...book.volumes, 0);
  const pct         = max > 0 ? Math.round((book.volumes.length / max) * 100) : 100;
  const isComplete  = missing.length === 0;
  const cover       = book.cover || DEFAULT_COVER;

  // Xây volume chips chi tiết
  let chips = '';
  const displayMax = Math.min(max || book.volumes.length, 120);
  for (let i = 1; i <= displayMax; i++) {
    const have   = book.volumes.includes(i);
    const imgUrl = book.volumeCovers?.[i];
    chips += `
      <div class="vol-chip-detail ${have ? 'have' : 'missing-chip'}"
           title="Tập ${i}${have ? ' ✓ Đang có' : ' ✗ Còn thiếu'}"
           onclick="handleVolChipClick(${i}, ${book.id})">
        ${imgUrl && have
          ? `<img src="${escapeHtml(imgUrl)}" alt="Tập ${i}" loading="lazy" onerror="this.remove()">`
          : ''}
        <span class="vol-num">${i}</span>
        ${have ? '' : '<span class="chip-missing-dot">✕</span>'}
      </div>`;
  }
  if ((max || book.volumes.length) > 120) {
    chips += `<div class="vol-chip-detail" style="background:var(--surface3);color:var(--muted)">+${(max || book.volumes.length) - 120} tập</div>`;
  }

  // Tags HTML
  const tagHTML = (book.tags || []).map(t =>
    `<span class="tag tag-detail" onclick="filterByTag('${escapeHtml(t)}')">${escapeHtml(t)}</span>`
  ).join('');

  // Danh sách tập thiếu (text)
  const missingText = missing.length
    ? `<div class="detail-missing-list">Tập còn thiếu: <strong>${missing.slice(0, 30).join(', ')}${missing.length > 30 ? ` … (+${missing.length - 30} tập)` : ''}</strong></div>`
    : '';

  q('#detailContent').innerHTML = `
    <div class="detail-layout">
      <div class="detail-cover-col">
        <img src="${escapeHtml(cover)}" class="detail-cover-img" alt="${escapeHtml(book.name)}"
          onerror="this.src='${DEFAULT_COVER}'">
        <div class="detail-cover-actions">
          <button class="icon-btn edit-btn detail-action-btn" onclick="startEdit(${book.id})">✏️ Chỉnh sửa</button>
          <button class="icon-btn delete-btn detail-action-btn" onclick="confirmDelete(${book.id})">🗑️ Xóa</button>
        </div>
      </div>

      <div class="detail-info-col">
        <h2 id="detailModalTitle" class="detail-title">${escapeHtml(book.name)}</h2>

        ${tagHTML ? `<div class="detail-tags">${tagHTML}</div>` : ''}

        ${book.synopsis ? `<p class="detail-synopsis">${escapeHtml(book.synopsis)}</p>` : ''}

        <div class="detail-status-row">
          <span class="status-badge ${isComplete ? 'complete' : 'missing'}">
            ${isComplete ? '✅ Đủ bộ' : `⚠️ Thiếu ${missing.length} tập`}
          </span>
          <span class="detail-vol-count">📦 ${book.volumes.length}${max ? ` / ${max}` : ''} tập</span>
        </div>

        ${max > 0 ? `
        <div class="progress-wrap detail-progress">
          <div class="progress-label">
            <span>Tiến độ sưu tập</span>
            <span>${book.volumes.length} / ${max} tập (${pct}%)</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width:${pct}%"></div>
          </div>
        </div>` : ''}

        ${missingText}

        <div class="detail-chips-label">Chi tiết từng tập:</div>
        <div class="detail-volume-grid">${chips}</div>
      </div>
    </div>`;

  q('#detailModal').classList.add('open');
}

function closeDetailModal() {
  q('#detailModal').classList.remove('open');
}

/* Click vào chip tập trong detail → không làm gì, chỉ tooltip */
function handleVolChipClick(volNum, bookId) {
  const book = state.books.find(b => b.id === bookId);
  if (!book) return;
  const have = book.volumes.includes(volNum);
  showToast(have ? `✅ Tập ${volNum} — Đang có` : `⚠️ Tập ${volNum} — Còn thiếu`, have ? 'success' : 'info', 1800);
}

/* ─── Tag Filter (click tag để lọc) ─── */
function filterByTag(tag) {
  // Toggle: nếu đã chọn tag này thì bỏ
  state.activeTag = state.activeTag === tag ? null : tag;
  // Cũng cập nhật search input để hiển thị
  renderTagFilter();
  render();
  closeDetailModal();
}

function renderTagFilter() {
  const wrap = q('#tagFilterWrap');
  if (!wrap) return;

  // Thu thập tất cả unique tags
  const allTags = [...new Set(state.books.flatMap(b => b.tags || []))].sort();

  if (!allTags.length) { wrap.innerHTML = ''; return; }

  wrap.innerHTML = allTags.map(tag => `
    <button class="tag-filter-chip ${state.activeTag === tag ? 'active' : ''}"
      onclick="filterByTag('${escapeHtml(tag)}')"
      title="Lọc theo: ${escapeHtml(tag)}">
      ${escapeHtml(tag)}
    </button>`).join('');
}

/* ─── Filtering & Sorting ─── */
function getFiltered() {
  let list = [...state.books];

  // Lọc theo search text
  if (state.search) {
    const sq = state.search.toLowerCase();
    list = list.filter(b =>
      b.name.toLowerCase().includes(sq) ||
      (b.tags || []).some(t => t.toLowerCase().includes(sq)) ||
      (b.synopsis || '').toLowerCase().includes(sq)
    );
  }

  // Lọc theo active tag chip
  if (state.activeTag) {
    list = list.filter(b =>
      (b.tags || []).some(t => t === state.activeTag)
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
  const max     = book.totalVolumes || Math.max(...book.volumes, 0);
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
        <div class="empty-icon">${(state.search || state.activeTag) ? '🔍' : '📭'}</div>
        <h2>${(state.search || state.activeTag) ? 'Không tìm thấy kết quả' : 'Kho truyện đang trống'}</h2>
        <p>${state.search
          ? `Không có truyện nào khớp với "<strong>${escapeHtml(state.search)}</strong>"`
          : state.activeTag
            ? `Không có truyện nào thuộc thể loại "<strong>${escapeHtml(state.activeTag)}</strong>"`
            : 'Hãy thêm bộ truyện đầu tiên vào file app.js!'}</p>
      </div>`;
    return;
  }

  grid.innerHTML = filtered.map(book => buildBookCard(book)).join('');

  // Xử lý ảnh lỗi
  grid.querySelectorAll('.main-cover').forEach(img => {
    img.addEventListener('error', function () {
      this.src = DEFAULT_COVER;
      this.classList.add('broken');
    });
  });
}

function buildBookCard(book) {
  const missing    = getMissingVolumes(book);
  const max        = book.totalVolumes || Math.max(...book.volumes, 0);
  const pct        = max > 0 ? Math.round((book.volumes.length / max) * 100) : 100;
  const isComplete = missing.length === 0;
  const cover      = book.cover || DEFAULT_COVER;

  // Gọn tags — hiển thị tối đa 3, còn lại "+N"
  const tags     = book.tags || [];
  const maxTags  = 3;
  const tagHTML  = tags.slice(0, maxTags).map(t =>
    `<span class="tag tag-clickable" onclick="event.stopPropagation();filterByTag('${escapeHtml(t)}')"
      title="Lọc theo ${escapeHtml(t)}">${escapeHtml(t)}</span>`
  ).join('') + (tags.length > maxTags
    ? `<span class="tag tag-more">+${tags.length - maxTags}</span>`
    : '');

  return `
  <div class="book-card"
     data-id="${book.id}"
     onclick="window.location.href='detail.html?id=${book.id}'"
     role="listitem"
     tabindex="0"
     onkeydown="if(event.key==='Enter')window.location.href='detail.html?id=${book.id}'">
      <div class="card-cover-wrap">
        <img src="${escapeHtml(cover)}" class="main-cover" alt="${escapeHtml(book.name)}" loading="lazy">
        <div class="card-cover-overlay">
          <span class="overlay-hint">👁 Xem chi tiết</span>
        </div>
        <!-- Nút action ngăn propagation để không mở detail -->
        <div class="card-quick-actions" onclick="event.stopPropagation()">
          <button class="icon-btn edit-btn" onclick="startEdit(${book.id})" title="Chỉnh sửa">✏️</button>
          <button class="icon-btn delete-btn" onclick="confirmDelete(${book.id})" title="Xóa">🗑️</button>
        </div>
      </div>

      <div class="book-content">
        <div class="book-name">${escapeHtml(book.name)}</div>

        <!-- Tags — hiển thị ngay trên card -->
        ${tagHTML ? `<div class="card-tag-list">${tagHTML}</div>` : ''}

        <div class="status-badge ${isComplete ? 'complete' : 'missing'}">
          ${isComplete
            ? '✅ Đủ bộ'
            : `⚠️ Thiếu ${missing.length} tập`}
        </div>

        ${max > 0 ? `
        <div class="progress-wrap">
          <div class="progress-label">
            <span>${book.volumes.length} / ${max} tập</span>
            <span>${pct}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width:${pct}%"></div>
          </div>
        </div>` : `<div class="progress-wrap"><div class="progress-label"><span>${book.volumes.length} tập đang có</span></div></div>`}

        ${book.synopsis ? `<p class="card-synopsis">${escapeHtml(book.synopsis.slice(0, 100))}${book.synopsis.length > 100 ? '…' : ''}</p>` : ''}
      </div>

      <div class="book-footer">
        <span style="color:var(--muted);font-size:13px">📦 ${book.volumes.length} tập</span>
        <span class="detail-hint-link">Chi tiết →</span>
      </div>
    </div>`;
}

/* ─── Form helpers (cho edit modal) ─── */
function updateCoverPreview(url) {
  const prev = q('#coverPreview');
  if (!prev) return;
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
  const el        = document.createElement('div');
  el.className    = `toast ${type}`;
  const icons     = { success: '✅', error: '❌', info: 'ℹ️' };
  el.innerHTML    = `<span>${icons[type] || 'ℹ️'}</span><span>${msg}</span>`;
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

  // Edit modal: cover preview on input
  q('#bookCover').addEventListener('input', e => {
    updateCoverPreview(e.target.value.trim());
  });

  // Edit modal: clear errors on input
  q('#bookName').addEventListener('input', () => clearFieldError('bookName'));
  q('#bookVolumes').addEventListener('input', () => clearFieldError('bookVolumes'));

  // Đóng modal khi click backdrop
  q('#deleteModal').addEventListener('click', e => {
    if (e.target === q('#deleteModal')) closeDeleteModal();
  });
  q('#editModal').addEventListener('click', e => {
    if (e.target === q('#editModal')) closeEditModal();
  });
  q('#detailModal').addEventListener('click', e => {
    if (e.target === q('#detailModal')) closeDetailModal();
  });

  // Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeDeleteModal();
      closeEditModal();
      closeDetailModal();
    }
  });

  renderTagFilter();
  render();
});
