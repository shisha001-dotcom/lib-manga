/* ===================================================
   js/ui.js
   Tiện ích UI dùng chung: theme, sidebar, toast, helpers
   =================================================== */

/* ── Shelf config dùng chung ── */
const SHELF = {
  reading:  { label: 'Chưa đủ bộ', icon: '📖', badgeCls: 'shelf-reading',  fullLabel: '📖 Chưa đủ bộ' },
  next:     { label: 'Wishlist',    icon: '🕒', badgeCls: 'shelf-next',     fullLabel: '🕒 Wishlist'    },
  finished: { label: 'Hoàn thành', icon: '✅', badgeCls: 'shelf-finished', fullLabel: '✅ Hoàn thành'  },
};

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

document.addEventListener('DOMContentLoaded', () => {
  syncDarkBtn(document.documentElement.getAttribute('data-theme') === 'dark');
});

/* ── Sidebar (mobile) ── */
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (!sidebar || !overlay) return;
  sidebar.classList.contains('open') ? closeSidebar() : (sidebar.classList.add('open'), overlay.classList.add('active'));
}

function closeSidebar() {
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sidebarOverlay')?.classList.remove('active');
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => { if (window.innerWidth <= 768) closeSidebar(); });
  });
});

/* ── Toast ── */
let _toastTimer;
function showToast(msg, isError = false) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent      = msg;
  t.style.background = isError ? 'var(--red-fg)' : 'var(--text)';
  t.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

/* ── Helpers ── */
function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function closeModal(id) {
  document.getElementById(id)?.classList.remove('open');
}

/* ── Cover image updater (dùng chung cho vol-list và book-detail) ── */
function updateCoverImg(rowEl, newUrl, rowPrefix) {
  if (!rowEl) return;
  const img = rowEl.querySelector('.vl-cover');
  const ph  = rowEl.querySelector('.vl-cover-placeholder');
  if (newUrl) {
    if (img) { img.src = newUrl; img.style.display = ''; }
    else {
      const ni = document.createElement('img');
      ni.className = 'vl-cover'; ni.src = newUrl;
      ni.onerror = () => { ni.style.display = 'none'; if (ph) ph.style.display = 'flex'; };
      rowEl.querySelector('.vl-cover-wrap').prepend(ni);
    }
    if (ph) ph.style.display = 'none';
  } else {
    if (img) img.style.display = 'none';
    if (ph)  ph.style.display  = 'flex';
  }
}

/* ── Touch-safe tap handler (dùng chung cho cover lists) ── */
function bindTouchTap(containerEl, selector, onTap) {
  containerEl.querySelectorAll(selector).forEach(el => {
    let startX, startY, moved = false;
    el.addEventListener('touchstart', e => {
      startX = e.touches[0].clientX; startY = e.touches[0].clientY; moved = false;
    }, { passive: true });
    el.addEventListener('touchmove', e => {
      if (Math.abs(e.touches[0].clientX - startX) > 8 ||
          Math.abs(e.touches[0].clientY - startY) > 8) moved = true;
    }, { passive: true });
    el.addEventListener('touchend', e => { if (moved) return; e.preventDefault(); onTap(el); });
    el.addEventListener('click', () => onTap(el));
  });
}

/* ── Next vol number helper (dùng chung) ── */
function nextVolNum(vols) {
  return vols.length ? Math.max(...vols.map(v => v.number)) + 1 : 1;
}
