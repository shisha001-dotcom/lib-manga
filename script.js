/* ===================================================
   script.js — Kho Sách
   Render thư viện, filter, search
   Phụ thuộc: supabase.js, ui.js (esc, SHELF)
   =================================================== */

let allBooksData  = [];
let currentFilter = 'all';
let currentSearch = '';

(async function init() {
  try {
    const [rawBooks, rawVols] = await Promise.all([
      sbGet('books',   'select=*&order=title.asc'),
      sbGet('volumes', 'select=*&order=number.asc'),
    ]);
    const volMap = {};
    rawVols.forEach(v => {
      if (!volMap[v.book_id]) volMap[v.book_id] = [];
      volMap[v.book_id].push(v);
    });
    allBooksData = rawBooks.map(b => {
      const vols  = (volMap[b.id] || []).sort((a, c) => a.number - c.number);
      const owned = vols.filter(v => v.owned).length;
      return { ...b, volumes: vols, owned, total: vols.length };
    });
    renderAll();
    updateTopbarSub();
  } catch (err) {
    console.error('Lỗi tải dữ liệu:', err);
    ['readingShelf','nextShelf','finishedShelf'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = `<p class="empty-msg">⚠️ Không tải được dữ liệu. Vui lòng thử lại.</p>`;
    });
  }
})();

document.getElementById('searchInput')?.addEventListener('input', function () {
  currentSearch = this.value.trim().toLowerCase();
  renderAll();
});

/* Nav filter — delegated sau khi shell.js inject sidebar */
document.addEventListener('click', e => {
  const btn = e.target.closest('.nav-btn[data-filter]');
  if (!btn) return;
  currentFilter = btn.dataset.filter;
  document.querySelectorAll('.nav-btn[data-filter]').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderAll();
});

function renderAll() {
  const shelves = { reading: [], next: [], finished: [] };
  allBooksData.forEach(book => {
    if (currentFilter === 'complete'   && book.owned !== book.total) return;
    if (currentFilter === 'incomplete' && book.owned === book.total) return;
    if (currentSearch) {
      if (!(book.title + ' ' + book.author).toLowerCase().includes(currentSearch)) return;
    }
    if (shelves[book.shelf] !== undefined) shelves[book.shelf].push(book);
  });
  renderShelf('readingShelf',  'countReading',  shelves.reading);
  renderShelf('nextShelf',     'countNext',     shelves.next);
  renderShelf('finishedShelf', 'countFinished', shelves.finished);
}

function renderShelf(gridId, countId, books) {
  const grid    = document.getElementById(gridId);
  const counter = document.getElementById(countId);
  if (!grid) return;
  if (counter) counter.textContent = books.length;
  if (!books.length) {
    grid.innerHTML = `<p class="empty-msg">Không có bộ nào.</p>`;
    return;
  }
  grid.innerHTML = books.map(book => {
    const pct        = book.total > 0 ? Math.round((book.owned / book.total) * 100) : 0;
    const isComplete = book.owned === book.total && book.total > 0;
    const coverSrc   = book.cover_override || (book.volumes[0]?.cover) || '';
    let badgeClass, badgeText;
    if (isComplete)     { badgeClass = 'badge-complete'; badgeText = `✅ Full ${book.total} tập`; }
    else if (pct >= 50) { badgeClass = 'badge-mid';      badgeText = `${pct}%`; }
    else                { badgeClass = 'badge-low';       badgeText = `${book.owned}/${book.total}`; }
    return `
      <div class="book-card" onclick="openBook('${esc(book.id)}')">
        <div class="book-cover" style="${coverSrc ? `background-image:url('${esc(coverSrc)}')` : 'background:var(--bg-alt)'}">
          ${coverSrc ? '' : `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:40px;opacity:.3">📖</div>`}
          <div class="volume-badge ${badgeClass}">${badgeText}</div>
        </div>
        <div class="book-info">
          <div class="book-title">${esc(book.title)}</div>
          <div class="book-author">${esc(book.author)}</div>
          ${isComplete
            ? `<div class="complete-label">✨ Đã đủ bộ</div>`
            : `<div class="progress-wrapper">
                <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
                <div class="progress-text">${book.owned} / ${book.total} tập đã có</div>
              </div>`}
        </div>
      </div>`;
  }).join('');
}

function openBook(id) {
  window.location.href = `book-detail.html?id=${encodeURIComponent(id)}`;
}

function updateTopbarSub() {
  const totalOwned = allBooksData.reduce((s, b) => s + b.owned, 0);
  const totalVols  = allBooksData.reduce((s, b) => s + b.total, 0);
  const sub = document.getElementById('topbarSub');
  if (sub) sub.textContent = `${allBooksData.length} bộ · ${totalOwned}/${totalVols} tập đã sở hữu`;
}
