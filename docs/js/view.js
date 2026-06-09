/**
 * View — 負責所有 DOM 渲染
 */
const View = {

  /** 渲染 Hero 區（首頁） */
  renderHero(config) {
    const el = document.getElementById('hero');
    if (!el) return;
    el.innerHTML = `
      <div class="hero-content">
        <div class="hero-name-en">${config.storeNameEn}</div>
        <div class="hero-tagline">${config.tagline}</div>
        <div class="hero-desc">${config.heroText}</div>
      </div>`;
  },

  /** 渲染四個分類大按鈕 */
  renderCategoryButtons() {
    const el = document.getElementById('categories-grid');
    if (!el) return;

    const cats = [
      { key: 'Cake',   zh: '蛋糕',   en: 'Cake',   file: 'cake.html' },
      { key: 'Cookie', zh: '餅乾',   en: 'Cookie', file: 'cookie.html' },
      { key: 'Japan',  zh: '日式甜點', en: 'Japan', file: 'japan.html' },
      { key: 'Taiwan', zh: '台式甜點', en: 'Taiwan', file: 'taiwan.html' },
    ];

    el.innerHTML = cats.map(cat => `
      <a href="${cat.file}" target="_blank" class="category-card">
        <img src="images/${cat.key}/${cat.key}_01.png"
             alt="${cat.zh}"
             onerror="this.style.visibility='hidden'">
        <span class="category-name-zh">${cat.zh}</span>
        <span class="category-name-en">${cat.en}</span>
      </a>`).join('');
  },

  /** 渲染聯絡資訊區 */
  renderContactInfo(config) {
    const el = document.getElementById('contact-info');
    if (!el) return;

    const igLink = config.instagram
      ? `<div class="contact-item">
           <span class="contact-icon">📷</span>
           <a href="${config.instagram}" target="_blank" rel="noopener noreferrer">Instagram</a>
         </div>`
      : '';

    el.innerHTML = `
      <div class="contact-card">
        <div class="contact-title">店面資訊</div>
        <div class="contact-item">
          <span class="contact-icon">📍</span>
          <span>${config.address}</span>
        </div>
        <div class="contact-item">
          <span class="contact-icon">📞</span>
          <span>${config.phone}</span>
        </div>
        <div class="contact-item">
          <span class="contact-icon">🕐</span>
          <span>${config.businessHours}</span>
        </div>
        <div class="contact-item">
          <span class="contact-icon">✉️</span>
          <span>${config.email}</span>
        </div>
        ${igLink}
        <p class="contact-note">
          現場少量販售。<br>
          客製與大量訂購請提前預約。
        </p>
      </div>`;
  },

  /** 渲染單張商品卡片 HTML */
  _productCardHTML(product) {
    return `
      <div class="product-card">
        <img src="${product.image}"
             alt="${product.name_zh}"
             loading="lazy"
             onerror="this.style.display='none'">
        <div class="product-info">
          <div class="product-name-zh">${product.name_zh}</div>
          <div class="product-name-en">${product.name_en}</div>
          <div class="product-price">NT$${product.price_twd}</div>
          <div class="product-desc">${product.description_zh}</div>
        </div>
      </div>`;
  },

  /** 渲染首頁精選商品 */
  renderFeaturedProducts(products) {
    const el = document.getElementById('featured-grid');
    if (!el) return;
    el.innerHTML = products.map(p => this._productCardHTML(p)).join('');
  },

  /** 渲染分類頁商品格 */
  renderProductGrid(products) {
    const el = document.getElementById('products-grid');
    if (!el) return;

    if (!products || products.length === 0) {
      el.innerHTML = '<p class="loading">目前尚無商品。</p>';
      return;
    }
    el.innerHTML = products.map(p => this._productCardHTML(p)).join('');
  },

  /** 渲染分類頁標題區 */
  renderCategoryHeader(category) {
    const el = document.getElementById('category-header');
    if (!el) return;

    const info = {
      Cake:   { zh: '蛋糕',   en: 'Cake',   desc: '細緻、柔軟、帶一點法式浪漫。',  price: 'NT$200–390' },
      Cookie: { zh: '餅乾',   en: 'Cookie', desc: '小小一片，酥香直接。',         price: 'NT$45–80'  },
      Japan:  { zh: '日式甜點', en: 'Japan', desc: '清雅、細緻、剛好的甜。',       price: 'NT$90–260' },
      Taiwan: { zh: '台式甜點', en: 'Taiwan', desc: '熟悉的香氣，做得更清爽。',    price: 'NT$80–150' },
    };

    const cat = info[category] || { zh: category, en: category, desc: '', price: '' };

    el.innerHTML = `
      <div class="category-hero">
        <div class="container">
          <div class="category-nav">
            <a href="index.html" class="btn-back">← 回首頁</a>
          </div>
          <div class="category-title-zh">${cat.zh}</div>
          <div class="category-title-en">${cat.en}</div>
          <div class="category-desc">${cat.desc}</div>
          <span class="category-price-range">${cat.price}</span>
        </div>
      </div>`;
  },

  /** 渲染店主介紹頁內容 */
  renderOwnerProfile(markdown) {
    const el = document.getElementById('owner-content');
    if (!el) return;
    el.innerHTML = this._markdownToHtml(markdown);
  },

  /** 渲染頁尾文字 */
  renderFooter(config) {
    const el = document.getElementById('footer-text');
    if (el) el.textContent = config.footerText || '今天也要吃點甜。';
  },

  // ── Markdown parser ──────────────────────────────────

  /**
   * 簡易 Markdown → HTML 轉換
   * 支援：# h1、## h2、- list、段落（空行分段）
   */
  _markdownToHtml(md) {
    const blocks = md.split(/\n{2,}/);
    let html = '';

    for (const block of blocks) {
      const trimmed = block.trim();
      if (!trimmed) continue;

      const lines = trimmed.split('\n');

      // 標題
      if (lines.length === 1 && trimmed.startsWith('# ')) {
        html += `<h1>${trimmed.slice(2).trim()}</h1>`;
        continue;
      }
      if (lines.length === 1 && trimmed.startsWith('## ')) {
        html += `<h2>${trimmed.slice(3).trim()}</h2>`;
        continue;
      }

      // 清單區塊（每行都是 - 開頭）
      if (lines.every(l => l.trim().startsWith('- '))) {
        html += '<ul>' + lines.map(l => `<li>${l.trim().slice(2)}</li>`).join('') + '</ul>';
        continue;
      }

      // 混合行（包含標題或清單）
      if (lines.some(l => l.trim().startsWith('# ') || l.trim().startsWith('## ') || l.trim().startsWith('- '))) {
        for (const l of lines) {
          const t = l.trim();
          if (!t) continue;
          if (t.startsWith('# '))  { html += `<h1>${t.slice(2)}</h1>`; }
          else if (t.startsWith('## ')) { html += `<h2>${t.slice(3)}</h2>`; }
          else if (t.startsWith('- ')) { html += `<ul><li>${t.slice(2)}</li></ul>`; }
          else { html += `<p>${t}</p>`; }
        }
        continue;
      }

      // 多行段落（以 <br> 分隔保留短句節奏）
      if (lines.length > 1) {
        html += `<p>${lines.map(l => l.trim()).join('<br>')}</p>`;
        continue;
      }

      // 單行段落
      html += `<p>${trimmed}</p>`;
    }

    return html;
  }
};
