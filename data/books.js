const SUPABASE_URL = "https://YOUR_PROJECT.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_ANON_KEY";

const books = [];

async function loadBooks() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/books?select=*,volumes(*)`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`
      }
    }
  );
  const data = await res.json();

  data.forEach(b => {
    const volumes = b.volumes
      .sort((x, y) => x.number - y.number)
      .map(v => ({ number: v.number, owned: v.owned, cover: v.cover }));

    const owned = volumes.filter(v => v.owned).length;
    const total = volumes.length;

    books.push({
      id: b.id,
      title: b.title,
      author: b.author,
      shelf: b.shelf,
      volumes,
      owned,
      total,
      progress: Math.round((owned / total) * 100),
      cover: b.cover_override || volumes[0]?.cover || ""
    });
  });

  window.dispatchEvent(new Event("booksLoaded"));
}

loadBooks();
