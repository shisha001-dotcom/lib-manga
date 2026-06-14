let currentFilter = "all";
let searchKeyword = "";

const readingShelf  = document.getElementById("readingShelf");
const nextShelf     = document.getElementById("nextShelf");
const finishedShelf = document.getElementById("finishedShelf");
const searchInput   = document.getElementById("searchInput");
const navButtons    = document.querySelectorAll(".nav-btn");

/* ===== Badge logic ===== */
function getBadgeClass(owned, total) {
  if (owned === total) return "badge-complete";
  if (owned / total >= 0.5) return "badge-mid";
  return "badge-low";
}

/* ===== Filter ===== */
function filterBooks(book) {
  const keyword = searchKeyword.toLowerCase();
  const matched =
    book.title.toLowerCase().includes(keyword) ||
    book.author.toLowerCase().includes(keyword);
  if (!matched) return false;
  if (currentFilter === "complete")   return book.owned === book.total;
  if (currentFilter === "incomplete") return book.owned < book.total;
  return true;
}

/* ===== Create card ===== */
function createBookCard(book) {
  const badgeClass = getBadgeClass(book.owned, book.total);
  const card = document.createElement("div");
  card.className = "book-card";
  card.addEventListener("click", () => {
    window.location.href = `book-detail.html?id=${book.id}`;
  });

  const progressHtml = book.total > 0 ? `
    <div class="progress-wrapper">
      <div class="progress-bar">
        <div class="progress-fill" style="width:${book.progress}%"></div>
      </div>
      <div class="progress-text">${book.owned}/${book.total} tập</div>
    </div>
  ` : '';

  const completeHtml = (book.owned === book.total && book.total > 0)
    ? `<div class="complete-label">✓ Full bộ</div>`
    : '';

  card.innerHTML = `
    <div class="book-cover" style="background-image:url('${book.cover}')">
      <div class="volume-badge ${badgeClass}">${book.owned}/${book.total}</div>
    </div>
    <div class="book-info">
      <div class="book-title">${book.title}</div>
      <div class="book-author">${book.author}</div>
      ${progressHtml}
      ${completeHtml}
    </div>
  `;
  return card;
}

/* ===== Render ===== */
function renderBooks() {
  readingShelf.innerHTML  = "";
  nextShelf.innerHTML     = "";
  finishedShelf.innerHTML = "";

  const filtered = books.filter(filterBooks);
  const counts = { reading: 0, next: 0, finished: 0 };

  filtered.forEach(book => {
    const card = createBookCard(book);
    if (book.shelf === "reading")  { readingShelf.appendChild(card);  counts.reading++; }
    if (book.shelf === "next")     { nextShelf.appendChild(card);     counts.next++; }
    if (book.shelf === "finished") { finishedShelf.appendChild(card); counts.finished++; }
  });

  // Update section counts
  const cr = document.getElementById("countReading");
  const cn = document.getElementById("countNext");
  const cf = document.getElementById("countFinished");
  if (cr) cr.textContent = counts.reading;
  if (cn) cn.textContent = counts.next;
  if (cf) cf.textContent = counts.finished;

  // Empty states
  if (!counts.reading)  readingShelf.innerHTML  = `<p class="empty-msg" style="grid-column:1/-1">Không có truyện nào.</p>`;
  if (!counts.next)     nextShelf.innerHTML     = `<p class="empty-msg" style="grid-column:1/-1">Không có truyện nào.</p>`;
  if (!counts.finished) finishedShelf.innerHTML = `<p class="empty-msg" style="grid-column:1/-1">Không có truyện nào.</p>`;
}

/* ===== Search ===== */
searchInput.addEventListener("input", e => {
  searchKeyword = e.target.value;
  renderBooks();
});

/* ===== Sidebar filter ===== */
navButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    if (!btn.dataset.filter) return;
    navButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    renderBooks();
  });
});

/* ===== Init ===== */
window.addEventListener("booksLoaded", renderBooks);
