/* ===================================================
   js/stats.js
   Render các widget thống kê trên trang stats.html
   Phụ thuộc: data/books.js (biến toàn cục `books`)
   =================================================== */

window.addEventListener('booksLoaded', () => {
  renderStatCards();
  renderShelfChart();
  renderMissingList();
});

function renderStatCards() {
  const totalSeries    = books.length;
  const totalOwned     = books.reduce((s, b) => s + b.owned, 0);
  const totalVolumes   = books.reduce((s, b) => s + b.total, 0);
  const totalMissing   = totalVolumes - totalOwned;
  const completeSeries = books.filter(b => b.owned === b.total && b.total > 0).length;
  const pctOwned       = totalVolumes ? Math.round(totalOwned / totalVolumes * 100) : 0;

  const cards = [
    { icon: '📚', value: totalSeries,    label: 'Bộ truyện'       },
    { icon: '📖', value: totalOwned,     label: 'Tập đang có'     },
    { icon: '❌', value: totalMissing,   label: 'Tập đang thiếu'  },
    { icon: '✅', value: completeSeries, label: 'Bộ đã đủ'        },
    { icon: '📈', value: pctOwned + '%', label: 'Tỉ lệ sở hữu'   },
  ];

  document.getElementById('statCards').innerHTML = cards.map(c => `
    <div class="stat-card">
      <div class="stat-icon">${c.icon}</div>
      <div class="stat-value">${c.value}</div>
      <div class="stat-label">${c.label}</div>
    </div>
  `).join('');
}

function renderShelfChart() {
  const shelfMeta = {
    reading:  { label: '📖 Chưa đủ bộ', cls: 'reading'  },
    next:     { label: '🕒 Wishlist',    cls: 'next'     },
    finished: { label: '✅ Hoàn thành',  cls: 'finished' },
  };
  const counts  = { reading: 0, next: 0, finished: 0 };
  const volumes = { reading: 0, next: 0, finished: 0 };

  books.forEach(b => {
    if (counts[b.shelf] !== undefined) {
      counts[b.shelf]++;
      volumes[b.shelf] += b.owned;
    }
  });

  const maxCount = Math.max(...Object.values(counts), 1);

  document.getElementById('shelfChart').innerHTML = Object.entries(shelfMeta).map(([key, meta]) => `
    <div class="shelf-row">
      <div class="shelf-label">${meta.label}</div>
      <div class="shelf-bar-wrap">
        <div class="shelf-bar-fill ${meta.cls}"
             style="width:${Math.round((counts[key] / maxCount) * 100)}%"></div>
      </div>
      <div class="shelf-stat">${counts[key]} bộ · ${volumes[key]} tập</div>
    </div>
  `).join('');
}

function renderMissingList() {
  const missing = books
    .filter(b => b.owned < b.total)
    .sort((a, b) => (b.owned / b.total) - (a.owned / a.total));

  const el = document.getElementById('missingList');
  if (!missing.length) {
    el.innerHTML = `<div class="all-complete">🎉 Tất cả bộ đều đã đủ tập!</div>`;
    return;
  }

  el.innerHTML = missing.map(book => {
    const lack = book.total - book.owned;
    const pct  = Math.round((book.owned / book.total) * 100);
    return `
      <a class="missing-item" href="book-detail.html?id=${book.id}&filter=missing">
        <div class="missing-cover" style="background-image:url('${book.cover}')"></div>
        <div class="missing-info">
          <div class="missing-title">${book.title}</div>
          <div class="missing-bar-wrap">
            <div class="missing-bar-fill" style="width:${pct}%"></div>
          </div>
          <div class="missing-sub">${book.owned}/${book.total} tập · ${pct}%</div>
        </div>
        <div class="missing-badge">−${lack} tập</div>
      </a>`;
  }).join('');
}
