/* ===================================================
   script.js — Kho Sách
   Render thư viện, filter, search
   =================================================== */

const SB_URL  = "https://dklfwlgpomnrmxmbjpat.supabase.co";
const SB_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrbGZ3bGdwb21ucm14bWJqcGF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MDQ5MDAsImV4cCI6MjA5NDA4MDkwMH0.sy8zDIdh9RBhl9TOqg6PnfTehqtV7VcFQSaSPoc4MoI";
const H = { apikey: SB_ANON, Authorization: `Bearer ${SB_ANON}` };

let allBooksData   = [];  // raw from Supabase
let currentFilter  = "all";
let currentSearch  = "";

/* ===== Bootstrap ===== */
(async function init() {
  try {
    const [rawBooks, rawVols] = await Promise.all([
      sbFetch("books", "select=*&order=title.asc"),
      sbFetch("volumes", "select=*&order=number.asc"),
    ]);

    // Group volumes by book_id
    const volMap = {};
    rawVols.forEach(v => {
      if (!volMap[v.book_id]) volMap[v.book_id] = [];
      volMap[v.book_id].push(v);
    });

    // Attach volumes to each book
    allBooksData = rawBooks.map(b => {
      const vols  = (volMap[b.id] || []).sort((a, b) => a.number - b.number);
      const owned = vols.filter(v => v.owned).length;
      return { ...b, volumes: vols, owned, total: vols.length };
    });

    renderAll();
    updateTopbarSub();

  } catch (err) {
    console.error("Lỗi tải dữ liệu:", err);
    ["readingShelf","nextShelf","finishedShelf"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = `<p class="empty-msg">⚠️ Không tải được dữ liệu. Vui lòng thử lại.</p>`;
    });
  }
})();

async function sbFetch(table, params = "") {
  const r = await fetch(`${SB_URL}/rest/v1/${table}?${params}`, { headers: H });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

/* ===== Search ===== */
const searchEl = document.getElementById("searchInput");
if (searchEl) {
  searchEl.addEventListener("input", () => {
    currentSearch = searchEl.value.trim().toLowerCase();
    renderAll();
  });
}

/* ===== Nav filter buttons ===== */
document.querySelectorAll(".nav-btn[data-filter]").forEach(btn => {
  btn.addEventListener("click", () => {
    currentFilter = btn.dataset.filter;
    document.querySelectorAll(".nav-btn[data-filter]").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    renderAll();
  });
});

/* ===== Render ===== */
function renderAll() {
  const shelves = { reading: [], next: [], finished: [] };

  allBooksData.forEach(book => {
    if (currentFilter === "complete"   && book.owned !== book.total) return;
    if (currentFilter === "incomplete" && book.owned === book.total) return;
    if (currentSearch) {
      const haystack = (book.title + " " + book.author).toLowerCase();
      if (!haystack.includes(currentSearch)) return;
    }
    if (shelves[book.shelf] !== undefined) shelves[book.shelf].push(book);
  });

  renderShelf("readingShelf",  "countReading",  shelves.reading);
  renderShelf("nextShelf",     "countNext",     shelves.next);
  renderShelf("finishedShelf", "countFinished", shelves.finished);
}

function renderShelf(gridId, countId, books) {
  const grid    = document.getElementById(gridId);
  const counter = document.getElementById(countId);
  if (!grid) return;

  if (counter) counter.textContent = books.length;

  if (books.length === 0) {
    grid.innerHTML = `<p class="empty-msg">Không có bộ nào.</p>`;
    return;
  }

  grid.innerHTML = books.map(book => {
    const pct         = book.total > 0 ? Math.round((book.owned / book.total) * 100) : 0;
    const isComplete  = book.owned === book.total && book.total > 0;
    const coverSrc    = book.cover_override
      || (book.volumes.length > 0 && book.volumes[0].cover)
      || "";

    let badgeClass, badgeText;
    if (isComplete)       { badgeClass = "badge-complete"; badgeText = `✅ Full ${book.total} tập`; }
    else if (pct >= 50)   { badgeClass = "badge-mid";      badgeText = `${pct}%`; }
    else                  { badgeClass = "badge-low";       badgeText = `${book.owned}/${book.total}`; }

    const coverStyle = coverSrc
      ? `background-image:url('${esc(coverSrc)}')`
      : `background:var(--bg-alt)`;

    return `
      <div class="book-card" onclick="openBook('${esc(book.id)}')">
        <div class="book-cover" style="${coverStyle}">
          ${coverSrc ? "" : `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:40px;opacity:.3">📖</div>`}
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
              </div>`
          }
        </div>
      </div>
    `;
  }).join("");
}

function openBook(id) {
  window.location.href = `book-detail.html?id=${encodeURIComponent(id)}`;
}

function updateTopbarSub() {
  const totalOwned  = allBooksData.reduce((s, b) => s + b.owned, 0);
  const totalVols   = allBooksData.reduce((s, b) => s + b.total, 0);
  const sub = document.getElementById("topbarSub");
  if (sub) {
    sub.textContent = `${allBooksData.length} bộ · ${totalOwned}/${totalVols} tập đã sở hữu`;
  }
}

function esc(s) {
  return String(s || "")
    .replace(/&/g,"&amp;").replace(/</g,"&lt;")
    .replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
