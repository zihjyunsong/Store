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
    }
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
