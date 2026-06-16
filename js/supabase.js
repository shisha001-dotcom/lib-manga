/* ===================================================
   js/supabase.js
   Cấu hình Supabase + helper CRUD dùng chung toàn app
   =================================================== */

const SB_URL = "https://dklfwlgpomnrmxmbjpat.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrbGZ3bGdwb21ucm14bWJqcGF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MDQ5MDAsImV4cCI6MjA5NDA4MDkwMH0.sy8zDIdh9RBhl9TOqg6PnfTehqtV7VcFQSaSPoc4MoI";
const SB_HEADERS = {
  apikey:         SB_KEY,
  Authorization:  `Bearer ${SB_KEY}`,
  'Content-Type': 'application/json',
};

async function sbGet(table, params = '') {
  const r = await fetch(`${SB_URL}/rest/v1/${table}?${params}`, { headers: SB_HEADERS });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function sbPost(table, body) {
  const r = await fetch(`${SB_URL}/rest/v1/${table}`, {
    method:  'POST',
    headers: { ...SB_HEADERS, Prefer: 'return=representation' },
    body:    JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function sbPatch(table, filter, body) {
  const r = await fetch(`${SB_URL}/rest/v1/${table}?${filter}`, {
    method:  'PATCH',
    headers: { ...SB_HEADERS, Prefer: 'return=minimal' },
    body:    JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await r.text());
}

async function sbDelete(table, filter) {
  const r = await fetch(`${SB_URL}/rest/v1/${table}?${filter}`, {
    method:  'DELETE',
    headers: SB_HEADERS,
  });
  if (!r.ok) throw new Error(await r.text());
}
