/* ===================================================
   data/books.js
   Dùng cho: stats.html, book-detail.html
   Load từ Supabase, build global `books[]`, dispatch
   "booksLoaded" event khi xong.
   =================================================== */

const _SB_URL  = "https://dklfwlgpomnrmxmbjpat.supabase.co";
const _SB_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrbGZ3bGdwb21ucm14bWJqcGF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MDQ5MDAsImV4cCI6MjA5NDA4MDkwMH0.sy8zDIdh9RBhl9TOqg6PnfTehqtV7VcFQSaSPoc4MoI";
const _H = { apikey: _SB_ANON, Authorization: `Bearer ${_SB_ANON}` };

/* Global array consumed by stats.html & book-detail.html */
var books = [];

(async function loadBooks() {
  try {
    const [rawBooks, rawVols] = await Promise.all([
      _sbFetch("books",   "select=*&order=title.asc"),
      _sbFetch("volumes", "select=*&order=number.asc"),
    ]);

    const volMap = {};
    rawVols.forEach(v => {
      if (!volMap[v.book_id]) volMap[v.book_id] = [];
      volMap[v.book_id].push(v);
    });

    books = rawBooks.map(b => {
      const vols  = (volMap[b.id] || []).sort((a, c) => a.number - c.number);
      const owned = vols.filter(v => v.owned).length;

      /* Pick best cover: override → first volume cover → "" */
      const cover = b.cover_override
        || (vols.length > 0 && vols[0].cover ? vols[0].cover : "")
        || "";

      return {
        id:     b.id,
        title:  b.title,
        author: b.author,
        shelf:  b.shelf,
        cover,
        total:   vols.length,
        owned,
        volumes: vols,
      };
    });

    window.dispatchEvent(new Event("booksLoaded"));

  } catch (err) {
    console.error("books.js: Lỗi tải dữ liệu:", err);
    window.dispatchEvent(new CustomEvent("booksLoadError", { detail: err }));
  }
})();

async function _sbFetch(table, params = "") {
  const r = await fetch(`${_SB_URL}/rest/v1/${table}?${params}`, { headers: _H });
  if (!r.ok) throw new Error(`[${table}] ${r.status}: ${await r.text()}`);
  return r.json();
}
