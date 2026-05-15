const bookForm = document.getElementById("bookForm");
const bookTableBody = document.getElementById("bookTableBody");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const darkModeToggle = document.getElementById("darkModeToggle");

let books = JSON.parse(localStorage.getItem("books")) || [];

/* Save LocalStorage */

function saveBooks() {
  localStorage.setItem("books", JSON.stringify(books));
}

/* Render Books */

function renderBooks() {

  bookTableBody.innerHTML = "";

  let filteredBooks = books.filter(book => {

    const matchesSearch =
      book.title.toLowerCase().includes(searchInput.value.toLowerCase()) ||
      book.author.toLowerCase().includes(searchInput.value.toLowerCase());

    const matchesCategory =
      categoryFilter.value === "all" ||
      book.category === categoryFilter.value;

    return matchesSearch && matchesCategory;
  });

  filteredBooks.forEach((book, index) => {

    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${book.title}</td>
      <td>${book.author}</td>
      <td>${book.category}</td>

      <td>
        <span class="status ${book.status.toLowerCase()}">
          ${book.status}
        </span>
      </td>

      <td>
        <button class="delete-btn" onclick="deleteBook(${index})">
          Delete
        </button>
      </td>
    `;

    bookTableBody.appendChild(row);

  });

  updateStats();
}

/* Add Book */

bookForm.addEventListener("submit", function(e){

  e.preventDefault();

  const newBook = {
    title: document.getElementById("title").value,
    author: document.getElementById("author").value,
    category: document.getElementById("category").value,
    status: document.getElementById("status").value
  };

  books.push(newBook);

  saveBooks();
  renderBooks();

  bookForm.reset();

});

/* Delete Book */

function deleteBook(index) {

  books.splice(index, 1);

  saveBooks();
  renderBooks();
}

/* Stats */

function updateStats() {

  document.getElementById("totalBooks").textContent = books.length;

  const available = books.filter(
    book => book.status === "Available"
  ).length;

  const borrowed = books.filter(
    book => book.status === "Borrowed"
  ).length;

  document.getElementById("availableBooks").textContent = available;

  document.getElementById("borrowedBooks").textContent = borrowed;
}

/* Search */

searchInput.addEventListener("input", renderBooks);

/* Filter */

categoryFilter.addEventListener("change", renderBooks);

/* Dark Mode */

darkModeToggle.addEventListener("click", () => {
  document.body.classList.toggle("light-mode");
});

/* Init */

renderBooks();
