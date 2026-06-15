/**
 * seed-products.js — 把 docs/data/products.csv 匯入 Firestore 的 products 集合
 *
 * 商品價格的「唯一真相」在 Firestore，後端結帳時只看這裡。
 * CSV 改價之後，重跑一次這個腳本即可同步。
 *
 * 使用方式：
 *   1. Firebase Console → 專案設定 → 服務帳戶 → 產生新的私密金鑰
 *      把下載的 JSON 存成 tools/serviceAccountKey.json（不要 commit！）
 *   2. cd tools && npm install firebase-admin
 *   3. node seed-products.js
 */
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// ── 讀取並解析 CSV（與前端 model.js 同樣的規則）──
const csvPath = path.join(__dirname, '..', 'docs', 'data', 'products.csv');
let text = fs.readFileSync(csvPath, 'utf8');
if (text.charCodeAt(0) === 0xfeff) text = text.slice(1); // 去除 BOM

const lines = text.trim().split('\n');
const headers = lines[0].split(',').map((h) => h.trim());

const products = lines.slice(1).map((line) => {
  const values = line.split(','); // 此 CSV 無引號欄位，直接切即可
  const obj = {};
  headers.forEach((h, i) => {
    obj[h] = values[i] !== undefined ? values[i].trim() : '';
  });
  obj.id = obj.image.split('/').pop().replace(/\.[^.]+$/, '');
  obj.price_twd = Number(obj.price_twd);
  return obj;
});

// ── 寫入 Firestore ──
(async () => {
  const batch = db.batch();
  for (const p of products) {
    const { id, ...data } = p;
    batch.set(db.collection('products').doc(id), data);
  }
  await batch.commit();
  console.log(`完成！已匯入 ${products.length} 筆商品到 products 集合。`);
  process.exit(0);
})().catch((err) => {
  console.error('匯入失敗：', err);
  process.exit(1);
});
