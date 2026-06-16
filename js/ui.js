/* ===================================================
   js/ui.js
   Tiện ích UI dùng chung: theme, sidebar, toast, helpers
   =================================================== */

/* ── Theme ── */
(function applyTheme() {
  const saved = localStorage.getItem('theme');
  if (saved) document.documentElement.setAttribute('data-theme', saved);
})();

function toggleDark() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const next   = !isDark;
  localStorage.setItem('theme', next ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
  syncDarkBtn(next);
}

function syncDarkBtn(isDark) {
  const btn = document.getElementById('darkToggle');
  if (!btn) return;
  btn.querySelector('.toggle-icon').textContent  = isDark ? '☀️' : '🌙';
  btn.querySelector('.toggle-label').textContent = isDark ? 'Chế độ sáng' : 'Chế độ tối';
}

/* Gọi ngay để sync icon khi trang load */
document.addEventListener('DOMContentLoaded', () => {
  syncDarkBtn(document.documentElement.getAttribute('data-theme') === 'dark');
});

/* ── Sidebar (mobile) ── */
function toggleSidebar() {
  const sidebar  = document.getElementById('sidebar');
  const overlay  = document.getElementById('sidebarOverlay');
  if (!sidebar || !overlay) return;
  if (sidebar.classList.contains('open')) {
    closeSidebar();
  } else {
    sidebar.classList.add('open');
    overlay.classList.add('active');
  }
}

function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('active');
}

/* Đóng sidebar khi tap nav-btn trên mobile */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (window.innerWidth <= 768) closeSidebar();
    });
  });
});

/* ── Toast ── */
let _toastTimer;

function showToast(msg, isError = false) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent   = msg;
  t.style.background = isError ? 'var(--red-fg)' : 'var(--text)';
  t.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

/* ── Helpers ── */
function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}
