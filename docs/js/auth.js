/**
 * Auth — Firebase 登入狀態管理
 *
 * 負責：
 * - 初始化 Firebase
 * - Google 登入 / 登出
 * - 監聽登入狀態並更新每個頁面的 header
 */
const Auth = {
  _initialized: false,

  /** 初始化 Firebase App */
  initFirebase() {
    if (this._initialized) return;
    if (typeof firebase === 'undefined' || typeof firebaseConfig === 'undefined') {
      console.error('[Auth] Firebase SDK 或 firebase-config.js 未載入。');
      return;
    }
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    this._initialized = true;
  },

  /** 取得目前登入的使用者（可能為 null） */
  getCurrentUser() {
    return firebase.auth().currentUser;
  },

  /** Google 登入 */
  async signInWithGoogle() {
    this.initFirebase();
    const provider = new firebase.auth.GoogleAuthProvider();
    return firebase.auth().signInWithPopup(provider);
  },

  /** 登出 */
  async signOut() {
    this.initFirebase();
    return firebase.auth().signOut();
  },

  /**
   * 初始化頁面頂端 header 的登入狀態顯示。
   * 在每個頁面 DOMContentLoaded 後自動呼叫。
   */
  initHeader() {
    this.initFirebase();
    if (!this._initialized) return;

    const loginBtn  = document.getElementById('auth-login-btn');
    const userBox   = document.getElementById('auth-user');
    const avatarEl  = document.getElementById('auth-avatar');
    const nameEl    = document.getElementById('auth-name');
    const logoutBtn = document.getElementById('auth-logout-btn');

    // 登入 icon 帶上目前頁面，登入後可返回（登入頁本身不帶）
    if (loginBtn) {
      const current = window.location.pathname.split('/').pop() || 'index.html';
      if (current !== 'login.html') {
        loginBtn.href = 'login.html?from=' + encodeURIComponent(current);
      }
    }

    // 綁定登出按鈕
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        try {
          await this.signOut();
        } catch (err) {
          console.error('[Auth] 登出失敗：', err);
        }
      });
    }

    // 監聽登入狀態變化
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        // 已登入
        if (loginBtn) loginBtn.style.display = 'none';
        if (userBox)  userBox.style.display = 'flex';

        // 動態插入「我的最愛」連結（只插一次）
        if (userBox && !document.getElementById('auth-fav-link')) {
          const favLink = document.createElement('a');
          favLink.id = 'auth-fav-link';
          favLink.className = 'auth-fav-link';
          favLink.href = 'favorites.html';
          favLink.title = '我的最愛';
          favLink.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>`;
          userBox.insertBefore(favLink, userBox.firstChild);
        }

        // 動態插入「購物車」連結與數量徽章（只插一次）
        if (userBox && !document.getElementById('auth-cart-link')) {
          const cartLink = document.createElement('a');
          cartLink.id = 'auth-cart-link';
          cartLink.className = 'auth-cart-link';
          cartLink.href = 'cart.html';
          cartLink.title = '購物車';
          cartLink.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round">
              <circle cx="9" cy="21" r="1"/>
              <circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            <span id="auth-cart-count" class="auth-cart-count" style="display:none">0</span>`;
          userBox.insertBefore(cartLink, userBox.firstChild.nextSibling);
          // 插入後立刻同步一次徽章
          if (typeof DB !== 'undefined' && typeof View !== 'undefined') {
            View.updateCartBadge(DB.cartCount());
          }
        }

        const displayName = user.displayName || (user.email ? user.email.split('@')[0] : '會員');
        if (nameEl) nameEl.textContent = displayName;

        if (avatarEl) {
          if (user.photoURL) {
            avatarEl.src = user.photoURL;
            avatarEl.style.display = 'block';
          } else {
            avatarEl.style.display = 'none';
          }
        }
      } else {
        // 未登入
        if (loginBtn) loginBtn.style.display = 'inline-flex';
        if (userBox)  userBox.style.display = 'none';
      }
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Auth.initHeader();
});
