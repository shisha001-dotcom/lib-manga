/* ===================================================
   js/shell.js
   Inject sidebar + admin modals dùng chung cho index & stats
   Phụ thuộc: ui.js (SHELF), auth.js
   =================================================== */

(function injectShell() {
  /* ── Sidebar ── */
  const currentPage = location.pathname.split('/').pop() || 'index.html';
  const isStats     = currentPage === 'stats.html';

  const navItems = [
    { icon: '📋', label: 'Tất cả',      page: 'index.html', filter: 'all'        },
    { icon: '🔖', label: 'Chưa đủ bộ', page: 'index.html', filter: 'incomplete' },
    { icon: '✅', label: 'Full bộ',     page: 'index.html', filter: 'complete'   },
  ];

  const sidebarHtml = `
    <div class="sidebar-overlay" id="sidebarOverlay" onclick="closeSidebar()"></div>
    <div class="mobile-header">
      <button class="hamburger" onclick="toggleSidebar()">☰</button>
      <span class="mobile-brand">📚 Kho Sách</span>
    </div>
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-brand">
        <div class="brand-logo">
          <div class="brand-icon">📚</div>
          <span class="brand-name">Kho Sách</span>
        </div>
        <div class="brand-sub">Bộ sưu tập manga</div>
      </div>
      <nav class="sidebar-nav">
        <span class="nav-section-label">Thư viện</span>
        ${navItems.map(n => {
          const isActive = !isStats && n.filter === 'all';
          const attrs    = isStats
            ? `onclick="window.location.href='${n.page}'"`
            : `data-filter="${n.filter}"`;
          return `<button class="nav-btn${isActive ? ' active' : ''}" ${attrs}><span class="nav-icon">${n.icon}</span> ${n.label}</button>`;
        }).join('\n        ')}
        <span class="nav-section-label">Công cụ</span>
        ${isStats
          ? `<button class="nav-btn active"><span class="nav-icon">📊</span> Thống kê</button>`
          : `<button class="nav-btn" onclick="window.location.href='stats.html'"><span class="nav-icon">📊</span> Thống kê</button>`}
        <div id="adminNav" style="display:none;">
          <div class="sidebar-divider"></div>
          <button class="nav-btn" onclick="openAdminPanel()" style="color:var(--accent);font-weight:700;">
            <span class="nav-icon">⚙️</span> Quản lý
          </button>
        </div>
      </nav>
      <div class="sidebar-bottom">
        <button class="dark-toggle" id="darkToggle" onclick="toggleDark()">
          <span class="toggle-icon">🌙</span>
          <span class="toggle-label">Chế độ tối</span>
        </button>
        <button class="logout-btn" onclick="logout()">
          <span style="font-size:15px">🚪</span> Đăng xuất
        </button>
      </div>
    </aside>`;

  /* ── Admin modals (dùng chung) ── */
  const adminModalsHtml = `
    <div class="modal-backdrop" id="adminModal" onclick="if(event.target===this) closeAdminModal()">
      <div class="modal admin-modal" style="max-height:90vh;overflow-y:auto;">
        <button class="modal-close" onclick="closeAdminModal()">✕</button>
        <div class="modal-title">⚙️ Quản lý Truyện</div>
        <div class="admin-toolbar">
          <input class="search-box" type="text" id="adminSearch" placeholder="🔍 Tìm theo tên..." oninput="renderAdminTable()">
          <select class="filter-select" id="adminShelfFilter" onchange="renderAdminTable()">
            <option value="">Tất cả kệ</option>
            ${Object.entries(SHELF).map(([k, s]) => `<option value="${k}">${s.fullLabel}</option>`).join('\n            ')}
          </select>
          <button class="btn-primary" onclick="openBookEditModal()">＋ Thêm bộ truyện</button>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr>
              <th style="width:52px">Bìa</th><th>Tên bộ truyện</th><th>Tác giả</th>
              <th>Kệ</th><th>Tập</th><th style="width:110px">Hành động</th>
            </tr></thead>
            <tbody id="adminTableBody">
              <tr><td colspan="6"><div class="empty-state"><div class="emoji">⏳</div>Đang tải...</div></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="modal-backdrop" id="bookEditModal" onclick="if(event.target===this) closeBookEditModal()">
      <div class="modal">
        <button class="modal-close" onclick="closeBookEditModal()">✕</button>
        <div class="modal-title" id="bookEditTitle">Thêm bộ truyện mới</div>
        <div class="modal-msg" id="bookEditMsg"></div>
        <div class="form-grid">
          <div class="form-group-m form-full">
            <label>ID (slug) <span style="color:var(--red-fg)">*</span></label>
            <input type="text" id="fId" placeholder="ví dụ: one-piece, naruto...">
            <div class="form-hint">Không dấu, không khoảng trắng, dùng dấu gạch ngang</div>
          </div>
          <div class="form-group-m form-full">
            <label>Tên bộ truyện <span style="color:var(--red-fg)">*</span></label>
            <input type="text" id="fTitle" placeholder="One Piece, Naruto...">
          </div>
          <div class="form-group-m">
            <label>Tác giả <span style="color:var(--red-fg)">*</span></label>
            <input type="text" id="fAuthor" placeholder="Eiichiro Oda...">
          </div>
          <div class="form-group-m">
            <label>Kệ sách <span style="color:var(--red-fg)">*</span></label>
            <select id="fShelf">
              ${Object.entries(SHELF).map(([k, s]) => `<option value="${k}">${s.fullLabel}</option>`).join('\n              ')}
            </select>
          </div>
          <div class="form-group-m form-full">
            <label>URL ảnh bìa (tùy chọn)</label>
            <input type="text" id="fCover" placeholder="https://...">
            <div class="form-hint">Để trống nếu dùng ảnh bìa từ từng tập</div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" onclick="closeBookEditModal()">Hủy</button>
          <button class="btn-primary" id="bookSaveBtn" onclick="saveBook()">💾 Lưu</button>
        </div>
      </div>
    </div>

    <div class="modal-backdrop" id="volModal" onclick="if(event.target===this) closeVolumeModal()">
      <div class="modal vol-modal">
        <button class="modal-close" onclick="closeVolumeModal()">✕</button>
        <div class="modal-title">Quản lý tập truyện</div>
        <div class="vol-book-title" id="volBookTitle"></div>
        <div class="vol-book-meta" id="volBookMeta"></div>
        <div class="modal-msg" id="volModalMsg"></div>
        <div class="vol-controls">
          <label>Thêm tập số:</label>
          <input type="number" id="volNumInput" min="1" value="1">
          <input type="text" id="volCoverInput" placeholder="URL bìa tập (tuỳ chọn)">
          <button class="btn-primary" style="padding:8px 14px;font-size:13px" onclick="addVolume()">＋ Thêm</button>
        </div>
        <div class="vol-tip">Nhấn bìa = đổi sở hữu &nbsp;·&nbsp; Sửa URL rồi 💾 = cập nhật bìa &nbsp;·&nbsp; ✕ = xóa tập</div>
        <div class="vol-list" id="volGrid"></div>
        <div class="modal-footer">
          <button class="btn-cancel" onclick="closeVolumeModal()">Đóng</button>
        </div>
      </div>
    </div>

    <div class="modal-backdrop" id="delModal" onclick="if(event.target===this) closeModal('delModal')">
      <div class="modal del-modal">
        <div class="del-emoji">🗑️</div>
        <div class="del-msg" id="delMsg">Xóa bộ truyện này?</div>
        <div class="del-sub">Tất cả tập liên quan cũng sẽ bị xóa vĩnh viễn.</div>
        <div style="display:flex;gap:10px;justify-content:center">
          <button class="btn-cancel" onclick="closeModal('delModal')">Hủy</button>
          <button class="btn-danger" id="delConfirmBtn">Xóa vĩnh viễn</button>
        </div>
      </div>
    </div>

    <div id="toast"></div>`;

  /* ── Inject vào body ── */
  const wrapper = document.getElementById('appShellTarget');
  if (wrapper) wrapper.insertAdjacentHTML('beforebegin', sidebarHtml);
  document.body.insertAdjacentHTML('beforeend', adminModalsHtml);
})();
