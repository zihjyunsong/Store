/**
 * Model — 負責讀取與解析所有資料
 */
const Model = {
  config: null,
  products: [],

  /** 讀取店面設定 */
  async loadConfig() {
    const res = await fetch('./data/site-config.json');
    if (!res.ok) throw new Error('無法讀取 site-config.json');
    this.config = await res.json();
    return this.config;
  },

  /** 讀取並解析商品 CSV */
  async loadProducts() {
    const res = await fetch('./data/products.csv');
    if (!res.ok) throw new Error('無法讀取 products.csv');
    const text = await res.text();
    this.products = this._parseCSV(text);
    return this.products;
  },

  /** 讀取店主介紹 Markdown */
  async loadOwnerProfile() {
    const res = await fetch('./data/owner-profile.md');
    if (!res.ok) throw new Error('無法讀取 owner-profile.md');
    this.ownerProfile = await res.text();
    return this.ownerProfile;
  },

  /** 依分類篩選商品 */
  getProductsByCategory(category) {
    return this.products.filter(p => p.category === category);
  },

  /** 每個分類取第一個商品，用於首頁精選 */
  getFeaturedProducts() {
    const categories = ['Cake', 'Cookie', 'Japan', 'Taiwan'];
    return categories
      .map(cat => this.products.find(p => p.category === cat))
      .filter(Boolean);
  },

  /** 依 id 清單篩選商品（我的最愛頁用） */
  getProductsByIds(ids) {
    const set = new Set(ids);
    return this.products.filter(p => set.has(p.id));
  },

  // ── Private helpers ──────────────────────────────────

  _parseCSV(text) {
    // 移除檔案開頭可能存在的 BOM 字元（U+FEFF），避免第一個欄位名稱解析錯誤
    if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());

    return lines.slice(1).map(line => {
      const values = this._splitCSVLine(line);
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = values[i] !== undefined ? values[i].trim() : '';
      });

      // images/ 已在 docs/ 內，路徑直接使用

      // 商品 id：取圖片檔名（不含副檔名），例如 "Cake_01"
      if (obj.image) {
        obj.id = obj.image.split('/').pop().replace(/\.[^.]+$/, '');
      }

      return obj;
    });
  },

  /** 處理含引號的 CSV 行 */
  _splitCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"' && !inQuotes) {
        inQuotes = true;
      } else if (ch === '"' && inQuotes) {
        inQuotes = false;
      } else if (ch === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current);
    return result;
  }
};
