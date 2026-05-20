const books = [
  {
    id: "conan",
    title: "Conan",
    author: "Gosho Aoyama",
    shelf: "reading",
    progress: 70,

    volumes: [
      { number: 1, owned: true, cover: "https://via.placeholder.com/120x180?text=Conan+1" },
      { number: 2, owned: true, cover: "https://via.placeholder.com/120x180?text=Conan+2" },
      { number: 3, owned: true, cover: "https://via.placeholder.com/120x180?text=Conan+3" },
      { number: 4, owned: false, cover: "https://via.placeholder.com/120x180?text=Conan+4" },
      { number: 5, owned: false, cover: "https://via.placeholder.com/120x180?text=Conan+5" }
    ]
  },

  {
    id: "onepiece",
    title: "One Piece",
    author: "Eiichiro Oda",
    shelf: "reading",
    progress: 60,

    volumes: [
      { number: 1, owned: true, cover: "https://via.placeholder.com/120x180?text=OP+1" },
      { number: 2, owned: true, cover: "https://via.placeholder.com/120x180?text=OP+2" },
      { number: 3, owned: false, cover: "https://via.placeholder.com/120x180?text=OP+3" }
    ]
  }
];

/* Tự tính owned + total */
books.forEach(book => {
  book.owned = book.volumes.filter(v => v.owned).length;
  book.total = book.volumes.length;
});
