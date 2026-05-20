let currentFilter = "all";
let searchKeyword = "";

const readingShelf = document.getElementById("readingShelf");
const nextShelf = document.getElementById("nextShelf");
const finishedShelf = document.getElementById("finishedShelf");

const searchInput = document.getElementById("searchInput");
const navButtons = document.querySelectorAll(".nav-btn");

/* ===== Badge logic ===== */
function getBadgeClass(owned, total) {
  const ratio = owned / total;

  if (owned === total) return "badge-complete";
  if (ratio >= 0.5) return "badge-mid";
  return "badge-low";
}

/* ===== Filter logic ===== */
function filterBooks(book) {
  // Search
  const keyword = searchKeyword.toLowerCase();
  const matched =
    book.title.toLowerCase().includes(keyword) ||
    book.author.toLowerCase().includes(keyword);

  if (!matched) return false;

  // Sidebar filter
  if (currentFilter === "complete") {
    return book.owned === book.total;
  }

  if (currentFilter === "incomplete") {
    return book.owned < book.total;
  }

  return true;
}

/* ===== Create book card ===== */
function createBookCard(book) {
  const badgeClass = getBadgeClass(book.owned, book.total);

  const card = document.createElement("div");
  card.className = "book-card";

  card.innerHTML = `
    <div class="book-cover" style="background-image:url('${book.cover}')">
      <div class="volume-badge ${badgeClass}">
        ${book.owned}/${book.total}
      </div>
    </div>

    <div class="book-title">${book.title}</div>
    <div class="book-author">${book.author}</div>

    ${
      book.progress > 0
        ? `
      <div class="progress-wrapper">
        <div class="progress-bar">
          <div class="progress-fill" style="width:${book.progress}%"></div>
        </div>
        <div class="progress-text">${book.progress}% đã đọc</div>
      </div>
    `
        : ""
    }

    ${
      book.owned === book.total
        ? `<div class="complete-label">✓ Full bộ</div>`
        : ""
    }
  `;

  return card;
}

/* ===== Render ===== */
function renderBooks() {
  readingShelf.innerHTML = "";
  nextShelf.innerHTML = "";
  finishedShelf.innerHTML = "";

  const filteredBooks = books.filter(filterBooks);

  filteredBooks.forEach(book => {
    const card = createBookCard(book);

    if (book.shelf === "reading") {
      readingShelf.appendChild(card);
    }

    if (book.shelf === "next") {
      nextShelf.appendChild(card);
    }

    if (book.shelf === "finished") {
      finishedShelf.appendChild(card);
    }
  });
}

/* ===== Search ===== */
searchInput.addEventListener("input", e => {
  searchKeyword = e.target.value;
  renderBooks();
});

/* ===== Sidebar filter ===== */
navButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    navButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    currentFilter = btn.dataset.filter || "all";
    renderBooks();
  });
});

/* ===== First load ===== */
renderBooks();
