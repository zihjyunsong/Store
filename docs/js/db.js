/**
 * DB — Firestore 資料庫操作（使用者資料與最愛收藏）
 *
 * 資料結構：
 *   users/{uid}
 *     ├─ displayName   使用者名稱
 *     ├─ email         信箱
 *     ├─ createdAt     第一次登入時間
 *     ├─ lastLoginAt   最近登入時間
 *     ├─ favorites     最愛商品 id 陣列，例如 ["Cake_01", "Cookie_03"]
 *     └─ cart          購物車 map，例如 { Cake_01: 2, Cookie_03: 1 }（id → 數量）
 *
 * 商品 id 規則：取圖片檔名（不含副檔名），例如 images/Cake/Cake_01.png → "Cake_01"
 */
const DB = {
  _favorites: new Set(),   // 目前使用者的最愛（本地快取）
  _listeners: [],          // 最愛變動時要通知的 callback
  _ready: false,           // 是否已從 Firestore 載入過最愛
  _cart: {},               // 目前使用者的購物車（本地快取，id → 數量）
  _cartListeners: [],      // 購物車變動時要通知的 callback

  /** 取得 Firestore 實例 */
  db() {
    Auth.initFirebase();
    return firebase.firestore();
  },

  /** 取得某使用者的文件參照 */
  userRef(uid) {
    return this.db().collection('users').doc(uid);
  },

  /**
   * 確保 users/{uid} 文件存在。
   * 第一次登入 → 建立文件；之後登入 → 更新名稱與最近登入時間。
   */
  async ensureUserDoc(user) {
    const ref = this.userRef(user.uid);
    const snap = await ref.get();
    const ts = firebase.firestore.FieldValue.serverTimestamp();

    if (!snap.exists) {
      await ref.set({
        displayName: user.displayName || '',
        email: user.email || '',
        createdAt: ts,
        lastLoginAt: ts,
        favorites: [],
        cart: {},
      });
    } else {
      await ref.set({
        displayName: user.displayName || '',
        email: user.email || '',
        lastLoginAt: ts,
      }, { merge: true });
    }
  },

  /** 從 Firestore 載入最愛清單與購物車到本地快取 */
  async loadFavorites(uid) {
    const snap = await this.userRef(uid).get();
    const data = (snap.exists && snap.data()) || {};
    this._favorites = new Set(data.favorites || []);
    this._cart = data.cart || {};
    this._ready = true;
    this._notify();
    this._notifyCart();
  },

  /** 清空本地快取（登出時用） */
  clearFavorites() {
    this._favorites = new Set();
    this._cart = {};
    this._ready = false;
    this._notify();
    this._notifyCart();
  },

  /** 某商品是否在最愛中 */
  isFavorite(productId) {
    return this._favorites.has(productId);
  },

  /** 取得最愛 id 陣列 */
  getFavorites() {
    return [...this._favorites];
  },

  /**
   * 切換最愛狀態。回傳切換後是否為最愛。
   * 未登入時丟出錯誤，由呼叫端處理（導向登入頁）。
   */
  async toggleFavorite(productId) {
    const user = Auth.getCurrentUser();
    if (!user) throw new Error('NOT_LOGGED_IN');

    const ref = this.userRef(user.uid);
    const FV = firebase.firestore.FieldValue;

    if (this._favorites.has(productId)) {
      this._favorites.delete(productId);
      this._notify();
      await ref.update({ favorites: FV.arrayRemove(productId) });
      return false;
    } else {
      this._favorites.add(productId);
      this._notify();
      await ref.update({ favorites: FV.arrayUnion(productId) });
      return true;
    }
  },

  /** 註冊最愛變動的監聽（頁面用來重新渲染愛心） */
  onFavoritesChanged(callback) {
    this._listeners.push(callback);
    if (this._ready) callback(this.getFavorites());
  },

  _notify() {
    this._listeners.forEach(cb => cb(this.getFavorites()));
  },

  // ── 購物車 ───────────────────────────────────────────

  /** 取得購物車內容（{ 商品id: 數量 }） */
  getCart() {
    return { ...this._cart };
  },

  /** 購物車內商品總件數（給徽章用） */
  cartCount() {
    return Object.values(this._cart).reduce((sum, q) => sum + q, 0);
  },

  /**
   * 設定某商品在購物車的數量。
   * qty <= 0 → 從購物車移除。未登入時丟出錯誤。
   */
  async setCartQty(productId, qty) {
    const user = Auth.getCurrentUser();
    if (!user) throw new Error('NOT_LOGGED_IN');

    const ref = this.userRef(user.uid);
    const FV = firebase.firestore.FieldValue;

    if (qty <= 0) {
      delete this._cart[productId];
      this._notifyCart();
      // dot notation：只刪 cart map 裡的這一個 key
      await ref.update({ ['cart.' + productId]: FV.delete() });
    } else {
      this._cart[productId] = qty;
      this._notifyCart();
      await ref.update({ ['cart.' + productId]: qty });
    }
  },

  /** 加入購物車（數量 +1） */
  async addToCart(productId) {
    const current = this._cart[productId] || 0;
    return this.setCartQty(productId, current + 1);
  },

  /** 清空購物車 */
  async clearCart() {
    const user = Auth.getCurrentUser();
    if (!user) throw new Error('NOT_LOGGED_IN');
    this._cart = {};
    this._notifyCart();
    await this.userRef(user.uid).update({ cart: {} });
  },

  /** 註冊購物車變動的監聽 */
  onCartChanged(callback) {
    this._cartListeners.push(callback);
    if (this._ready) callback(this.getCart());
  },

  _notifyCart() {
    this._cartListeners.forEach(cb => cb(this.getCart()));
  },

  /** 監聽登入狀態：登入→建檔並載入最愛；登出→清空 */
  initAuthSync() {
    Auth.initFirebase();
    firebase.auth().onAuthStateChanged(async (user) => {
      if (user) {
        try {
          await this.ensureUserDoc(user);
          await this.loadFavorites(user.uid);
        } catch (err) {
          console.error('[DB] 同步使用者資料失敗：', err);
        }
      } else {
        this.clearFavorites();
      }
    });
  },
};

document.addEventListener('DOMContentLoaded', () => {
  // 只有在 Firestore SDK 有載入的頁面才啟動
  if (typeof firebase !== 'undefined' && firebase.firestore) {
    DB.initAuthSync();
  }
});
