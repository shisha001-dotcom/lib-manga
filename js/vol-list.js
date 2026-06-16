/* ===================================================
   js/vol-list.js
   Quản lý danh sách tập dạng list (bìa + URL input + toggle owned)
   Dùng trong: vol modal (index/stats) và bottom sheet (book-detail)

   Phụ thuộc: supabase.js, ui.js
   Biến toàn cục cần có từ trang chứa:
     - volsByBook  {bookId: Volume[]}
     - currentVolBookId  string
     - renderAdminTable()  function (index/stats) hoặc callback
   =================================================== */

/* ── Render danh sách tập ── */
function renderVolList(bookId, containerId = 'volGrid') {
  const vols = (volsByBook[bookId] || []).slice().sort((a, b) => a.number - b.number);
  const el   = document.getElementById(containerId);
  if (!el) return;

  if (!vols.length) {
    el.innerHTML = '<div style="color:var(--text-3);font-size:14px;text-align:center;padding:20px 0">Chưa có tập nào.</div>';
    return;
  }

  el.innerHTML = vols.map(v => `
    <div class="vl-row ${v.owned ? 'owned' : ''}" id="vlr-${v.id}"
         data-vol-id="${v.id}" data-owned="${v.owned}">
      <div class="vl-cover-wrap" data-toggle-id="${v.id}">
        ${v.cover
          ? `<img class="vl-cover" src="${esc(v.cover)}"
                  onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
             <div class="vl-cover-placeholder" style="display:none">📖</div>`
          : `<div class="vl-cover-placeholder">📖</div>`}
        <div class="vl-owned-badge">${v.owned ? '✓' : ''}</div>
      </div>
      <div class="vl-info">
        <div class="vl-num">Tập ${v.number}</div>
        <div class="vl-url-row">
          <input class="vl-url-input" type="url" inputmode="url"
            placeholder="https://... (URL ảnh bìa)"
            value="${esc(v.cover || '')}"
            data-vol-id="${v.id}"
            data-book-id="${bookId}">
          <button class="vl-save-btn"
            data-vol-id="${v.id}" data-book-id="${bookId}"
            onclick="vlSaveCover(this)">💾</button>
        </div>
      </div>
      <button class="vl-del-btn"
        onclick="event.stopPropagation(); vlDeleteVol(${v.id}, '${containerId}')">✕</button>
    </div>
  `).join('');

  /* Touch-safe toggle: chỉ fire nếu ngón tay không di chuyển quá 8px */
  el.querySelectorAll('.vl-cover-wrap').forEach(coverEl => {
    let startX, startY, moved = false;

    coverEl.addEventListener('touchstart', e => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      moved  = false;
    }, { passive: true });

    coverEl.addEventListener('touchmove', e => {
      if (Math.abs(e.touches[0].clientX - startX) > 8 ||
          Math.abs(e.touches[0].clientY - startY) > 8) {
        moved = true;
      }
    }, { passive: true });

    coverEl.addEventListener('touchend', e => {
      if (moved) return;
      e.preventDefault();
      _vlToggle(coverEl);
    });

    /* Desktop click */
    coverEl.addEventListener('click', () => _vlToggle(coverEl));
  });
}

function _vlToggle(coverEl) {
  const volId = parseInt(coverEl.dataset.toggleId);
  const row   = document.getElementById('vlr-' + volId);
  if (!row) return;
  vlToggleOwned(volId, row.dataset.owned === 'true');
}

/* ── Toggle sở hữu ── */
async function vlToggleOwned(volId, currentOwned) {
  try {
    await sbPatch('volumes', `id=eq.${volId}`, { owned: !currentOwned });

    /* Cập nhật cache */
    for (const bid in volsByBook) {
      const v = volsByBook[bid].find(x => x.id === volId);
      if (v) { v.owned = !currentOwned; break; }
    }

    /* Cập nhật row UI ngay — không re-render toàn bộ */
    const row = document.getElementById('vlr-' + volId);
    if (row) {
      const n = !currentOwned;
      row.dataset.owned = String(n);
      row.classList.toggle('owned', n);
      const badge = row.querySelector('.vl-owned-badge');
      if (badge) badge.textContent = n ? '✓' : '';
    }

    /* Callback để trang chứa tự cập nhật (admin table, progress bar...) */
    if (typeof onVolListChanged === 'function') onVolListChanged();

  } catch (e) {
    showToast('Lỗi cập nhật: ' + e.message, true);
  }
}

/* ── Lưu cover URL inline ── */
async function vlSaveCover(btn) {
  const volId   = parseInt(btn.dataset.volId);
  const bookId  = btn.dataset.bookId;
  const input   = btn.previousElementSibling;
  const newUrl  = input.value.trim() || null;

  btn.disabled = true;
  btn.textContent = '⏳';

  try {
    await sbPatch('volumes', `id=eq.${volId}`, { cover: newUrl });

    /* Cập nhật cache */
    const v = (volsByBook[bookId] || []).find(x => x.id === volId);
    if (v) v.cover = newUrl;

    /* Cập nhật ảnh trong row ngay */
    _vlUpdateCoverImg(volId, newUrl);

    showToast('Đã cập nhật bìa ✓');
    if (typeof onVolListChanged === 'function') onVolListChanged();

  } catch (e) {
    showToast('Lỗi lưu bìa: ' + e.message, true);
  } finally {
    btn.disabled = false;
    btn.textContent = '💾';
  }
}

function _vlUpdateCoverImg(volId, newUrl) {
  const row = document.getElementById('vlr-' + volId);
  if (!row) return;
  const img = row.querySelector('.vl-cover');
  const ph  = row.querySelector('.vl-cover-placeholder');
  if (newUrl) {
    if (img) {
      img.src = newUrl;
      img.style.display = '';
    } else {
      const ni = document.createElement('img');
      ni.className = 'vl-cover';
      ni.src = newUrl;
      ni.onerror = () => { ni.style.display = 'none'; if (ph) ph.style.display = 'flex'; };
      row.querySelector('.vl-cover-wrap').prepend(ni);
    }
    if (ph) ph.style.display = 'none';
  } else {
    if (img) img.style.display = 'none';
    if (ph)  ph.style.display  = 'flex';
  }
}

/* ── Xóa tập ── */
async function vlDeleteVol(volId, containerId = 'volGrid') {
  try {
    await sbDelete('volumes', `id=eq.${volId}`);

    /* Xóa khỏi cache */
    for (const bid in volsByBook) {
      volsByBook[bid] = volsByBook[bid].filter(x => x.id !== volId);
    }

    /* Re-render list */
    const bookId = _findBookIdByVol(volId) || currentVolBookId;
    renderVolList(bookId, containerId);

    showToast('Đã xóa tập ✓');
    if (typeof onVolListChanged === 'function') onVolListChanged();

  } catch (e) {
    showToast('Lỗi xóa tập: ' + e.message, true);
  }
}

/* ── Thêm tập mới ── */
async function vlAddVolume() {
  const num    = parseInt(document.getElementById('volNumInput').value);
  const cover  = document.getElementById('volCoverInput').value.trim() || null;
  const msgEl  = document.getElementById('volModalMsg');
  if (msgEl) msgEl.className = 'modal-msg';

  if (!num || num < 1) {
    if (msgEl) { msgEl.textContent = 'Số tập không hợp lệ.'; msgEl.className = 'modal-msg error'; }
    return;
  }
  if ((volsByBook[currentVolBookId] || []).find(v => v.number === num)) {
    if (msgEl) { msgEl.textContent = `Tập ${num} đã tồn tại.`; msgEl.className = 'modal-msg error'; }
    return;
  }

  try {
    const res = await sbPost('volumes', { book_id: currentVolBookId, number: num, owned: false, cover });
    if (!volsByBook[currentVolBookId]) volsByBook[currentVolBookId] = [];
    volsByBook[currentVolBookId].push(res[0]);

    document.getElementById('volNumInput').value  = vlNextVolNum(currentVolBookId);
    document.getElementById('volCoverInput').value = '';

    renderVolList(currentVolBookId);
    showToast(`Đã thêm tập ${num} ✓`);
    if (typeof onVolListChanged === 'function') onVolListChanged();

  } catch (e) {
    if (msgEl) { msgEl.textContent = 'Lỗi: ' + e.message; msgEl.className = 'modal-msg error'; }
  }
}

/* ── Helpers ── */
function vlNextVolNum(bookId) {
  const vols = volsByBook[bookId] || [];
  return vols.length ? Math.max(...vols.map(v => v.number)) + 1 : 1;
}

function _findBookIdByVol(volId) {
  for (const bid in volsByBook) {
    if (volsByBook[bid].find(v => v.id === volId)) return bid;
  }
  return null;
}
