/**
 * Controller — 判斷頁面並協調 Model 與 View
 */
document.addEventListener('DOMContentLoaded', async () => {
  const page     = document.body.dataset.page;
  const category = document.body.dataset.category;

  try {
    // 所有頁面都需要 config 與 products
    await Model.loadConfig();
    await Model.loadProducts();

    if (page === 'home') {
      initHome();
    } else if (page === 'category' && category) {
      initCategory(category);
    } else if (page === 'owner') {
      await initOwner();
    } else if (page === 'favorites') {
      initFavorites();
    } else if (page === 'cart') {
      initCart();
    }

    initFavoriteHearts();
    initCartButtons();
  } catch (err) {
    console.error('[Controller] 初始化失敗：', err);
    // 顯示簡易錯誤提示（不阻斷使用者）
    document.querySelectorAll('.loading').forEach(el => {
      el.textContent = '資料載入失敗，請確認網站部署環境是否支援 fetch()。';
    });
  }
});

/* ── 首頁 ───────────────────────────────────────────── */
function initHome() {
  View.renderHero(Model.config);
  View.renderCategoryButtons();
  View.renderFeaturedProducts(Model.getFeaturedProducts());
  View.renderContactInfo(Model.config);
  View.renderFooter(Model.config);
}

/* ── 分類頁 ─────────────────────────────────────────── */
function initCategory(category) {
  View.renderCategoryHeader(category);
  View.renderProductGrid(Model.getProductsByCategory(category));
  View.renderFooter(Model.config);
}

/* ── 店主介紹頁 ──────────────────────────────────────── */
async function initOwner() {
  await Model.loadOwnerProfile();
  View.renderOwnerProfile(Model.ownerProfile);
  View.renderFooter(Model.config);
}

/* ── 我的最愛頁 ──────────────────────────────────────── */
function initFavorites() {
  View.renderFooter(Model.config);

  // 等 Firebase 確認登入狀態後再渲染
  firebase.auth().onAuthStateChanged(user => {
    if (!user) {
      View.renderFavoritesPage([], false);
    }
    // 已登入的渲染交給下面的 onFavoritesChanged（載入完成會觸發）
  });

  DB.onFavoritesChanged(favIds => {
    if (Auth.getCurrentUser()) {
      View.renderFavoritesPage(Model.getProductsByIds(favIds), true);
    }
  });
}

/* ── 購物車 ─────────────────────────────────────────── */

// 折扣規則：滿 threshold 折 amount（改這裡就能調整）
const DISCOUNT_RULE = { threshold: 1000, amount: 100 };

/** 由購物車內容算出明細與總價 */
function calcCartSummary(cart) {
  const items = [];
  let subtotal = 0;

  for (const [id, qty] of Object.entries(cart)) {
    const product = Model.products.find(p => p.id === id);
    if (!product) continue; // 商品已下架，略過
    const lineTotal = Number(product.price_twd) * qty;
    subtotal += lineTotal;
    items.push({ product, qty, lineTotal });
  }

  const discount = subtotal >= DISCOUNT_RULE.threshold ? DISCOUNT_RULE.amount : 0;
  return {
    items,
    summary: {
      subtotal,
      discount,
      total: subtotal - discount,
      discountHint: `滿 NT$${DISCOUNT_RULE.threshold} 折 NT$${DISCOUNT_RULE.amount}`,
    },
  };
}

/* 購物車頁 */
function initCart() {
  View.renderFooter(Model.config);

  firebase.auth().onAuthStateChanged(user => {
    if (!user) View.renderCartPage([], null, false);
  });

  // 購物車內容變動（載入完成、增減數量）就重新渲染
  DB.onCartChanged(cart => {
    if (!Auth.getCurrentUser()) return;
    const { items, summary } = calcCartSummary(cart);
    View.renderCartPage(items, summary, true);
  });

  // 數量增減與移除（事件委派）
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const id = btn.dataset.productId;
    const cart = DB.getCart();
    const qty = cart[id] || 0;

    try {
      if (btn.dataset.action === 'inc')    await DB.setCartQty(id, qty + 1);
      if (btn.dataset.action === 'dec')    await DB.setCartQty(id, qty - 1);
      if (btn.dataset.action === 'remove') await DB.setCartQty(id, 0);
    } catch (err) {
      console.error('[Controller] 更新購物車失敗：', err);
    }
  });
}

/* 加入購物車按鈕（所有商品頁）＋ header 徽章 */
function initCartButtons() {
  if (typeof DB === 'undefined') return;

  // 徽章數字同步
  DB.onCartChanged(() => View.updateCartBadge(DB.cartCount()));

  // 事件委派：點「加入購物車」
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.cart-add-btn');
    if (!btn) return;
    e.preventDefault();

    try {
      await DB.addToCart(btn.dataset.productId);
      // 簡單的成功回饋
      const original = btn.textContent;
      btn.textContent = '已加入 ✓';
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = original;
        btn.disabled = false;
      }, 900);
    } catch (err) {
      if (err.message === 'NOT_LOGGED_IN') {
        const current = window.location.pathname.split('/').pop() || 'index.html';
        window.location.href = 'login.html?from=' + encodeURIComponent(current);
      } else {
        console.error('[Controller] 加入購物車失敗：', err);
      }
    }
  });
}

/* ── 最愛收藏：愛心按鈕事件與狀態同步 ────────────────── */
function initFavoriteHearts() {
  if (typeof DB === 'undefined') return;

  // 最愛清單變動時（登入載入完成、或點擊切換）更新所有愛心
  DB.onFavoritesChanged(favIds => View.updateFavoriteHearts(favIds));

  // 事件委派：點擊任何愛心按鈕
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.fav-btn');
    if (!btn) return;
    e.preventDefault();

    const productId = btn.dataset.productId;
    try {
      await DB.toggleFavorite(productId);
    } catch (err) {
      if (err.message === 'NOT_LOGGED_IN') {
        // 未登入 → 導向登入頁，登入後返回
        const current = window.location.pathname.split('/').pop() || 'index.html';
        window.location.href = 'login.html?from=' + encodeURIComponent(current);
      } else {
        console.error('[Controller] 收藏失敗：', err);
      }
    }
  });
}
