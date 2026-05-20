const books = [
  conan,
  onepiece
];

/* Tự tính owned + total + progress */
books.forEach(book => {
  book.owned = book.volumes.filter(v => v.owned).length;
  book.total = book.volumes.length;
  book.progress = Math.round((book.owned / book.total) * 100);
});
