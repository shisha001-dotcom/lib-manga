const books = [];

/* Danh sách file truyện */
const bookFiles = [
  "conan",
  "onepiece",
  "naruto"
];

/* Load từng file */
Promise.all(
  bookFiles.map(name =>
    fetch(`js/data/${name}.js`)
      .then(res => res.text())
      .then(code => eval(code))
  )
).then(() => {
  /* Tính dữ liệu */
  books.forEach(book => {
    book.owned = book.volumes.filter(v => v.owned).length;
    book.total = book.volumes.length;
    book.progress = Math.round((book.owned / book.total) * 100);
  });

  /* báo app.js rằng đã load xong */
  window.dispatchEvent(new Event("booksLoaded"));
});
