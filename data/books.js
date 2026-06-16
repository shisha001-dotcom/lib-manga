/* ===================================================
   data/books.js
   Load từ Supabase, build global `books[]`, dispatch
   "booksLoaded" event khi xong.

   Phụ thuộc: js/supabase.js (sbGet)
   =================================================== */

var books = [];

(async function loadBooks() {
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

    books = rawBooks.map(b => {
      const vols  = (volMap[b.id] || []).sort((a, c) => a.number - c.number);
      const owned = vols.filter(v => v.owned).length;
      const cover = b.cover_override
        || (vols.length > 0 && vols[0].cover ? vols[0].cover : '')
        || '';

      return {
        id:      b.id,
        title:   b.title,
        author:  b.author,
        shelf:   b.shelf,
        cover,
        total:   vols.length,
        owned,
        volumes: vols,
      };
    });

    window.dispatchEvent(new Event('booksLoaded'));

  } catch (err) {
    console.error('books.js: Lỗi tải dữ liệu:', err);
    window.dispatchEvent(new CustomEvent('booksLoadError', { detail: err }));
  }
})();
