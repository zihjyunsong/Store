# 登入功能設計文檔

## 1. 功能目標

為露米甜點網站加入使用者登入系統。

技術選擇：

- Firebase Authentication
- 純前端實作
- 不需要後端

登入系統是未來功能的基礎。

目前用途：

- 讓使用者可以登入、登出
- 頁面頂端顯示登入狀態

未來可延伸：

- 購物車
- 積點紀錄
- 個人化推薦
- 訂單查詢

---

## 2. Firebase 設定

### Firebase 專案設定

1. 到 [https://console.firebase.google.com/](https://console.firebase.google.com/) 建立專案
2. 新增一個 Web App
3. 複製 Firebase config 物件
4. 在 Firebase Console → Authentication → Sign-in method 啟用：
   - **Google**（建議，方便使用者快速登入）
5. 在 Firebase Console → Authentication → Settings → Authorized domains 加入：
   - `yourname.github.io`（你的 GitHub Pages 網域）

### Config 放置位置

建立：

```text
docs/js/firebase-config.js
```

內容範例：

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "G-XXXXX"
};
```

**注意：**

- Firebase Web API Key 是公開的，可以安全提交到 repo
- 真正的保護機制是 Authorized Domains（限制只有你的網域能用）
- 不需要 `.gitignore`

---

## 3. 檔案結構

新增檔案：

```text
docs/
  login.html              ← 登入頁
  js/
    firebase-config.js    ← Firebase 設定（可安全提交）
    auth.js               ← 登入、登出、狀態監聽邏輯
```

修改檔案：

```text
docs/
  index.html              ← 加入頂部導覽列
  owner.html              ← 加入頂部導覽列
  cake.html               ← 加入頂部導覽列
  cookie.html             ← 加入頂部導覽列
  japan.html              ← 加入頂部導覽列
  taiwan.html             ← 加入頂部導覽列
  css/
    style.css             ← 加入導覽列與登入頁樣式
```

---

## 4. 頂部導覽列設計

### 出現位置

每一個頁面的最頂端。

包含：

- `index.html`
- `owner.html`
- `cake.html`
- `cookie.html`
- `japan.html`
- `taiwan.html`
- `login.html`

### 導覽列 HTML 結構

```html
<header class="site-header">
  <div class="container site-header-inner">
    <a href="index.html" class="site-logo">
      <span class="logo-zh">露米甜點</span>
      <span class="logo-en">Lumière</span>
    </a>
    <div class="header-auth">
      <!-- 未登入：顯示登入 icon -->
      <a href="login.html" class="auth-btn" id="auth-login-btn" title="登入">
        <!-- SVG 人形 icon -->
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      </a>
      <!-- 已登入：顯示使用者資訊與登出 -->
      <div class="auth-user" id="auth-user" style="display:none">
        <img id="auth-avatar" src="" alt="avatar" class="auth-avatar">
        <span id="auth-name" class="auth-name"></span>
        <button id="auth-logout-btn" class="auth-logout-btn">登出</button>
      </div>
    </div>
  </div>
</header>
```

### 狀態說明

**未登入：**

```text
[露米甜點 Lumière]                [👤]
```

- 右側顯示人形輪廓 icon
- 點擊後前往 `login.html`

**已登入：**

```text
[露米甜點 Lumière]     [頭像] 小美  [登出]
```

- 右側顯示 Google 頭像（或預設圓形頭像）
- 顯示使用者名稱（取 displayName 或 email 前綴）
- 「登出」按鈕

### 視覺風格

- 背景：`#FFFDF8`（奶油白）
- 底部邊線：`1px solid var(--line)`
- logo 文字：深可可色，字重 700
- Icon 顏色：`var(--taupe)`
- Hover：`var(--petal)`
- 高度：桌機 `60px`，手機 `52px`

---

## 5. 登入頁設計

### 頁面路徑

```text
docs/login.html
```

### 頁面內容

標題區：

```text
歡迎回來

登入你的帳號，享受更多服務。
```

登入方式（依序顯示）：

1. **Google 登入**（優先推薦，一鍵完成）
2. **Email / 密碼登入**（次要）
3. **註冊新帳號**（切換顯示，在同一頁）

### 版面結構

```text
┌────────────────────────────────┐
│  頂部導覽列                     │
├────────────────────────────────┤
│                                │
│   [背景：淡花草圖，透明遮罩]      │
│                                │
│   ┌──────────────────────┐     │
│   │  歡迎回來              │     │
│   │  登入你的帳號           │     │
│   │                      │     │
│   │  [G] 使用 Google 登入  │     │
│   │                      │     │
│   └──────────────────────┘     │
│                                │
└────────────────────────────────┘
```

### 登入成功後的導向

- 若使用者是從其他頁點 icon 進來 → 返回原頁面（`history.back()` 或 query param `?from=`）
- 若直接開啟 `login.html` → 導向 `index.html`

### 視覺風格

- 背景使用 Hero 同款花草圖
- 卡片：白底、圓角 `20px`、淡陰影
- Google 按鈕：白底＋邊框＋Google 色 G 圖示
- 主要登入按鈕：`var(--petal)` 花瓣粉
- 連結文字：`var(--taupe)`，hover 轉粉

### 錯誤提示

- Email 格式錯誤
- 密碼不正確
- 帳號不存在
- 提示文字顯示在表單上方，紅字（`var(--berry)`）

---

## 6. auth.js 架構

```text
docs/js/auth.js
```

負責：

- 初始化 Firebase Auth
- 監聽登入狀態（`onAuthStateChanged`）
- 更新所有頁面的 header 顯示
- Google 登入
- Email 登入
- 帳號註冊
- 登出

主要函式：

```js
Auth.initHeader()         // 初始化 header 登入狀態監聽
Auth.signInWithGoogle()   // Google 登入
Auth.signInWithEmail(email, password)  // Email 登入
Auth.registerWithEmail(email, password, displayName)  // 註冊
Auth.signOut()            // 登出
Auth.getCurrentUser()     // 取得目前使用者
```

### onAuthStateChanged 行為

每個頁面載入後呼叫：

```js
firebase.auth().onAuthStateChanged(user => {
  if (user) {
    // 已登入：顯示頭像、名稱、登出按鈕
    // 隱藏登入 icon
  } else {
    // 未登入：顯示登入 icon
    // 隱藏使用者資訊
  }
});
```

---

## 7. 各頁面引入方式

每個 HTML 頁面的 `<head>` 加入：

```html
<!-- Firebase SDK（使用 CDN，v9 compat 模式） -->
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js"></script>
<script src="js/firebase-config.js"></script>
<script src="js/auth.js"></script>
```

`<body>` 最上方加入 header：

```html
<header class="site-header">
  <!-- ... -->
</header>
```

`auth.js` 裡的 `Auth.initHeader()` 在每個頁面 `DOMContentLoaded` 時自動執行。

---

## 8. CSS 新增項目

在 `docs/css/style.css` 補充：

```css
/* Site Header */
.site-header { ... }
.site-header-inner { ... }
.site-logo { ... }
.auth-btn { ... }
.auth-user { ... }
.auth-avatar { ... }
.auth-name { ... }
.auth-logout-btn { ... }

/* Login Page */
.login-page { ... }
.login-card { ... }
.google-btn { ... }
.divider { ... }
.form-group { ... }
.form-input { ... }
.form-error { ... }
.register-link { ... }
```

---

## 9. 安全注意事項

- Firebase Web API Key 是公開的，可以安全提交到 repo
- 在 Firebase Console → Authentication → Settings → Authorized domains 設定你的網域
- 不在前端儲存密碼或 token
- Firebase Auth 本身會處理 JWT 安全

---

## 10. 店主維護說明

登入功能完全自動。

店主不需要維護任何程式碼。

使用者自行註冊與登入。

若要新增登入方式（例如 LINE 登入），需由工程師在 Firebase Console 啟用並更新 `auth.js`。
