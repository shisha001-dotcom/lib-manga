const books = [];

/* Danh sách file truyện */
const bookFiles = [
  "conan",
  "onepiece",
  "ajin",
  "mashle",
  "rave",
  "fireforce",
  "dr-stone",
  "astro-boy"
];

/* Load từng file */
Promise.all(
  bookFiles.map(name =>
    fetch(`data/${name}.js`)   // FIX
      .then(res => res.text())
      .then(code => eval(code))
  )
).then(() => {

  books.forEach(book => {
    book.owned = book.volumes.filter(v => v.owned).length;
    book.total = book.volumes.length;
    book.progress = Math.round((book.owned / book.total) * 100);

    /* lấy bìa đại diện từ tập 1 */
    book.cover = book.cover || book.volumes[0]?.cover || "";
  });

  window.dispatchEvent(new Event("booksLoaded"));
});
