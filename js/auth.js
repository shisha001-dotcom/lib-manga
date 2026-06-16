/* ===================================================
   js/auth.js
   Xác thực session — dùng chung cho index, stats, book-detail
   Phải được load SAU khi DOM đã có các element cần thiết
   =================================================== */

/**
 * Kiểm tra session. Nếu chưa login → redirect về login.html
 * Trả về object session hoặc null.
 */
function requireAuth() {
  const session = JSON.parse(sessionStorage.getItem('admin_user') || 'null');
  if (!session) {
    window.location.href = 'login.html';
    return null;
  }
  return session;
}

/**
 * Hiện các phần tử admin nếu user có quyền editor/superadmin.
 * @param {...string} elementIds - Danh sách id cần show
 */
function showAdminElements(session, ...elementIds) {
  if (!session) return;
  const isAdmin = session.role === 'superadmin' || session.role === 'editor';
  if (!isAdmin) return;
  elementIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = '';
  });
}

function logout() {
  sessionStorage.removeItem('admin_user');
  window.location.href = 'login.html';
}
