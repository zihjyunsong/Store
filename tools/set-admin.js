/**
 * set-admin.js — 把某個帳號設為 admin（自訂宣告 custom claim）
 *
 * admin=true 會寫進該帳號的登入 token，安全規則用它判斷誰能改商品。
 * custom claim 只能用 Admin SDK 設定，前端無法偽造。
 *
 * 使用方式：
 *   1. 同 seed-products.js，準備好 tools/serviceAccountKey.json
 *   2. node set-admin.js 你的email@gmail.com
 *
 * 注意：設定後要「重新登入」一次，新的 token 才會帶有 admin。
 */
const admin = require('firebase-admin');

const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const email = process.argv[2];
if (!email) {
  console.error('用法：node set-admin.js <email>');
  process.exit(1);
}

(async () => {
  const user = await admin.auth().getUserByEmail(email);
  await admin.auth().setCustomUserClaims(user.uid, { admin: true });
  console.log(`完成！${email}（uid: ${user.uid}）已設為 admin。`);
  console.log('請該帳號登出再重新登入，新權限才會生效。');
  process.exit(0);
})().catch((err) => {
  console.error('設定失敗：', err);
  process.exit(1);
});
