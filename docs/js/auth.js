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
