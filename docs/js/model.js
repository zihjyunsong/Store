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

  // ── Private helpers ──────────────────────────────────

  _parseCSV(text) {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());

    return lines.slice(1).map(line => {
      const values = this._splitCSVLine(line);
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = values[i] !== undefined ? values[i].trim() : '';
      });

      // 修正圖片路徑：從 Web/ 讀取時需要 ../
      if (obj.image && obj.image.startsWith('images/')) {
        obj.image = '../' + obj.image;
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
