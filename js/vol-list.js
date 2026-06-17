/* ===================================================
   js/vol-list.js
   Quản lý danh sách tập dạng list
   Phụ thuộc: supabase.js, ui.js (esc, showToast, updateCoverImg, bindTouchTap, nextVolNum)
   =================================================== */

function renderVolList(bookId, containerId = 'volGrid') {
  const vols = (volsByBook[bookId] || []).slice().sort((a, b) => a.number - b.number);
  const el   = document.getElementById(containerId);
  if (!el) return;
  if (!vols.length) {
    el.innerHTML = '<div style="color:var(--text-3);font-size:14px;text-align:center;padding:20px 0">Chưa có tập nào.</div>';
    return;
  }
  el.innerHTML = vols.map(v => _volRowHtml(v, bookId, containerId)).join('');

  bindTouchTap(el, '.vl-cover-wrap', coverEl => {
    const row = document.getElementById('vlr-' + coverEl.dataset.toggleId);
    if (row) vlToggleOwned(parseInt(coverEl.dataset.toggleId), row.dataset.owned === 'true');
  });
}

function _volRowHtml(v, bookId, containerId) {
  return `
    <div class="vl-row ${v.owned ? 'owned' : ''}" id="vlr-${v.id}" data-vol-id="${v.id}" data-owned="${v.owned}">
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
          <input class="vl-url-input" type="url" inputmode="url"
            placeholder="https://... (URL ảnh bìa)"
            value="${esc(v.cover || '')}"
            data-vol-id="${v.id}" data-book-id="${bookId}">
          <button class="vl-save-btn" data-vol-id="${v.id}" data-book-id="${bookId}" onclick="vlSaveCover(this)">💾</button>
        </div>
      </div>
      <button class="vl-del-btn" onclick="event.stopPropagation(); vlDeleteVol(${v.id}, '${containerId}')">✕</button>
    </div>`;
}

async function vlToggleOwned(volId, currentOwned) {
  try {
    await sbPatch('volumes', `id=eq.${volId}`, { owned: !currentOwned });
    for (const bid in volsByBook) {
      const v = volsByBook[bid].find(x => x.id === volId);
      if (v) { v.owned = !currentOwned; break; }
    }
    const row = document.getElementById('vlr-' + volId);
    if (row) {
      const n = !currentOwned;
      row.dataset.owned = String(n);
      row.classList.toggle('owned', n);
      row.querySelector('.vl-owned-badge').textContent = n ? '✓' : '';
    }
    if (typeof onVolListChanged === 'function') onVolListChanged();
  } catch (e) {
    showToast('Lỗi cập nhật: ' + e.message, true);
  }
}

async function vlSaveCover(btn) {
  const volId  = parseInt(btn.dataset.volId);
  const bookId = btn.dataset.bookId;
  const newUrl = btn.previousElementSibling.value.trim() || null;
  btn.disabled = true; btn.textContent = '⏳';
  try {
    await sbPatch('volumes', `id=eq.${volId}`, { cover: newUrl });
    const v = (volsByBook[bookId] || []).find(x => x.id === volId);
    if (v) v.cover = newUrl;
    updateCoverImg(document.getElementById('vlr-' + volId), newUrl);
    showToast('Đã cập nhật bìa ✓');
    if (typeof onVolListChanged === 'function') onVolListChanged();
  } catch (e) {
    showToast('Lỗi lưu bìa: ' + e.message, true);
  } finally {
    btn.disabled = false; btn.textContent = '💾';
  }
}

async function vlDeleteVol(volId, containerId = 'volGrid') {
  try {
    await sbDelete('volumes', `id=eq.${volId}`);
    let bookId = currentVolBookId;
    for (const bid in volsByBook) {
      if (volsByBook[bid].find(v => v.id === volId)) { bookId = bid; break; }
    }
    for (const bid in volsByBook) {
      volsByBook[bid] = volsByBook[bid].filter(x => x.id !== volId);
    }
    renderVolList(bookId, containerId);
    showToast('Đã xóa tập ✓');
    if (typeof onVolListChanged === 'function') onVolListChanged();
  } catch (e) {
    showToast('Lỗi xóa tập: ' + e.message, true);
  }
}

async function vlAddVolume() {
  const num   = parseInt(document.getElementById('volNumInput').value);
  const cover = document.getElementById('volCoverInput').value.trim() || null;
  const msgEl = document.getElementById('volModalMsg');
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
    document.getElementById('volNumInput').value   = nextVolNum(volsByBook[currentVolBookId]);
    document.getElementById('volCoverInput').value = '';
    renderVolList(currentVolBookId);
    showToast(`Đã thêm tập ${num} ✓`);
    if (typeof onVolListChanged === 'function') onVolListChanged();
  } catch (e) {
    if (msgEl) { msgEl.textContent = 'Lỗi: ' + e.message; msgEl.className = 'modal-msg error'; }
  }
}
