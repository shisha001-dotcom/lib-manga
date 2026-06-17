/* ===================================================
   js/admin.js
   Phụ thuộc: supabase.js, ui.js (SHELF, esc, showToast, closeModal), vol-list.js
   =================================================== */

let allBooks         = [];
let volsByBook       = {};
let editingBookId    = null;
let currentVolBookId = null;

async function loadAdminData() {
  try {
    const [books, vols] = await Promise.all([
      sbGet('books',   'select=*&order=title.asc'),
      sbGet('volumes', 'select=*&order=number.asc'),
    ]);
    allBooks   = books;
    volsByBook = {};
    vols.forEach(v => {
      if (!volsByBook[v.book_id]) volsByBook[v.book_id] = [];
      volsByBook[v.book_id].push(v);
    });
    renderAdminTable();
  } catch (e) {
    showToast('Lỗi tải dữ liệu: ' + e.message, true);
  }
}

function onVolListChanged() { renderAdminTable(); }

function shelfBadgeHtml(shelf) {
  const s = SHELF[shelf];
  return s ? `<span class="shelf-badge ${s.badgeCls}">${s.fullLabel}</span>` : shelf;
}

function renderAdminTable() {
  const q     = (document.getElementById('adminSearch')?.value || '').toLowerCase();
  const shelf = document.getElementById('adminShelfFilter')?.value || '';
  const rows  = allBooks.filter(b =>
    (b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)) &&
    (!shelf || b.shelf === shelf)
  );
  const tbody = document.getElementById('adminTableBody');
  if (!tbody) return;
  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><div class="emoji">📭</div>Không tìm thấy truyện nào.</div></td></tr>`;
    return;
  }
  tbody.innerHTML = rows.map(b => {
    const vols     = volsByBook[b.id] || [];
    const owned    = vols.filter(v => v.owned).length;
    const coverUrl = b.cover_override || (vols[0]?.cover) || '';
    return `<tr>
      <td>
        ${coverUrl ? `<img class="book-cover-thumb" src="${esc(coverUrl)}" onerror="this.style.display='none';this.nextSibling.style.display='flex'">` : ''}
        <div class="no-cover" style="${coverUrl ? 'display:none' : ''}">📖</div>
      </td>
      <td><strong>${esc(b.title)}</strong><br><span style="font-size:11px;color:var(--text-3)">${esc(b.id)}</span></td>
      <td>${esc(b.author)}</td>
      <td>${shelfBadgeHtml(b.shelf)}</td>
      <td class="vol-count"><span class="vol-owned">${owned}</span> / ${vols.length} tập</td>
      <td><div class="row-actions">
        <button class="btn-icon btn-edit" onclick="openBookEditModal('${esc(b.id)}')">✏️</button>
        <button class="btn-icon btn-vol"  onclick="openVolumeModal('${esc(b.id)}')">📦</button>
        <button class="btn-icon btn-del"  onclick="confirmDelete('${esc(b.id)}','${esc(b.title)}')">🗑️</button>
      </div></td>
    </tr>`;
  }).join('');
}

function openAdminPanel()  { loadAdminData(); document.getElementById('adminModal').classList.add('open'); }
function closeAdminModal() { document.getElementById('adminModal').classList.remove('open'); }

function openBookEditModal(bookId) {
  editingBookId = bookId || null;
  document.getElementById('bookEditTitle').textContent = bookId ? 'Chỉnh sửa bộ truyện' : 'Thêm bộ truyện mới';
  document.getElementById('bookEditMsg').className = 'modal-msg';
  document.getElementById('fId').disabled = !!bookId;
  if (bookId) {
    const b = allBooks.find(x => x.id === bookId);
    document.getElementById('fId').value     = b.id;
    document.getElementById('fTitle').value  = b.title;
    document.getElementById('fAuthor').value = b.author;
    document.getElementById('fShelf').value  = b.shelf;
    document.getElementById('fCover').value  = b.cover_override || '';
  } else {
    ['fId','fTitle','fAuthor','fCover'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('fShelf').value = 'reading';
  }
  document.getElementById('bookEditModal').classList.add('open');
}
function closeBookEditModal() { document.getElementById('bookEditModal').classList.remove('open'); }

async function saveBook() {
  const btn   = document.getElementById('bookSaveBtn');
  const msgEl = document.getElementById('bookEditMsg');
  msgEl.className = 'modal-msg';
  const id     = document.getElementById('fId').value.trim();
  const title  = document.getElementById('fTitle').value.trim();
  const author = document.getElementById('fAuthor').value.trim();
  const shelf  = document.getElementById('fShelf').value;
  const cover  = document.getElementById('fCover').value.trim() || null;
  if (!id || !title || !author) {
    msgEl.textContent = 'Vui lòng điền đầy đủ các trường bắt buộc (*)';
    msgEl.className = 'modal-msg error'; return;
  }
  if (!/^[a-z0-9-]+$/.test(id)) {
    msgEl.textContent = 'ID chỉ gồm chữ thường, số và dấu gạch ngang';
    msgEl.className = 'modal-msg error'; return;
  }
  btn.disabled = true; btn.innerHTML = '<span class="spin"></span>Đang lưu...';
  try {
    if (!editingBookId) {
      await sbPost('books', { id, title, author, shelf, cover_override: cover });
      showToast('Đã thêm bộ truyện mới ✓');
    } else {
      await sbPatch('books', `id=eq.${encodeURIComponent(editingBookId)}`, { title, author, shelf, cover_override: cover });
      showToast('Đã cập nhật ✓');
    }
    closeBookEditModal(); loadAdminData();
  } catch (e) {
    const msg = (e.message.includes('duplicate') || e.message.includes('unique')) ? 'ID này đã tồn tại.' : 'Lỗi: ' + e.message;
    msgEl.textContent = msg; msgEl.className = 'modal-msg error';
  } finally {
    btn.disabled = false; btn.innerHTML = '💾 Lưu';
  }
}

function confirmDelete(bookId, title) {
  document.getElementById('delMsg').textContent = `Xóa "${title}"?`;
  document.getElementById('delConfirmBtn').onclick = () => doDeleteBook(bookId);
  document.getElementById('delModal').classList.add('open');
}

async function doDeleteBook(bookId) {
  const btn = document.getElementById('delConfirmBtn');
  btn.disabled = true; btn.textContent = 'Đang xóa...';
  try {
    await sbDelete('books', `id=eq.${encodeURIComponent(bookId)}`);
    showToast('Đã xóa bộ truyện ✓');
    closeModal('delModal'); loadAdminData();
  } catch (e) {
    showToast('Lỗi: ' + e.message, true);
  } finally {
    btn.disabled = false; btn.textContent = 'Xóa vĩnh viễn';
  }
}

function openVolumeModal(bookId) {
  currentVolBookId = bookId;
  const b = allBooks.find(x => x.id === bookId);
  document.getElementById('volBookTitle').textContent = b.title;
  document.getElementById('volBookMeta').textContent  = `${b.author} · ${SHELF[b.shelf]?.label || ''}`;
  document.getElementById('volModalMsg').className    = 'modal-msg';
  document.getElementById('volNumInput').value        = nextVolNum(volsByBook[bookId] || []);
  document.getElementById('volCoverInput').value      = '';
  renderVolList(bookId);
  document.getElementById('volModal').classList.add('open');
}
function closeVolumeModal() { document.getElementById('volModal').classList.remove('open'); }

/* Aliases cho onclick inline */
function addVolume()          { vlAddVolume(); }
function deleteVol(id)        { vlDeleteVol(id); }
function toggleOwned(id, cur) { vlToggleOwned(id, cur); }
