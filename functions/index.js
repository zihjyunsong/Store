/**
 * 露米甜點後端 — Firebase Cloud Functions
 *
 * 設計原則：「不相信前端送來的任何東西」
 *   - 前端只送「買了哪些商品、各買幾個」（id + qty）
 *   - 價格由後端自己查 Firestore 的 products
 *   - 總價由後端自己算
 *   - 訂單由後端建立（前端對 orders 沒有寫入權限）
 *   - 付款狀態只由金流 Webhook 更新（驗簽章、驗金額）
 *
 * 三個函式：
 *   createOrder    — 結帳（callable，需登入）
 *   mockPayPage    — 模擬金流商的付款頁（之後接真金流就不需要）
 *   paymentWebhook — 金流商付款結果通知
 */
const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const { createPayment, verifyWebhook, signPayload } = require('./payment');

admin.initializeApp();
const db = admin.firestore();

const REGION = 'asia-east1';
const PROJECT_ID = 'webauth-aded6';
const FUNCTIONS_BASE_URL = `https://${REGION}-${PROJECT_ID}.cloudfunctions.net`;
const STORE_URL = 'https://zihjyunsong.github.io/Store';

// 折扣規則：滿 1000 折 100（後端版本——這裡才是算錢的唯一真相）
const DISCOUNT_RULE = { threshold: 1000, amount: 100 };

/* ════════════════════════════════════════════════════════
   createOrder — 結帳
   前端只送 { items: [{ id, qty }, ...] }
   ════════════════════════════════════════════════════════ */
exports.createOrder = onCall({ region: REGION }, async (request) => {
  // ── 1. 必須登入（使用者偽造不了 request.auth，它來自 Firebase 驗證過的 token）
  if (!request.auth) {
    throw new HttpsError('unauthenticated', '請先登入再結帳。');
  }
  const uid = request.auth.uid;

  // ── 2. 驗證輸入格式（前端可能被改過，什麼都可能送上來）
  const raw = request.data && request.data.items;
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 50) {
    throw new HttpsError('invalid-argument', '購物清單格式錯誤。');
  }

  const wanted = new Map(); // 用 Map 順便合併重複的商品
  for (const it of raw) {
    const id = String((it && it.id) || '');
    const qty = Number(it && it.qty);
    if (!/^[A-Za-z0-9_-]{1,50}$/.test(id)) {
      throw new HttpsError('invalid-argument', '商品代號格式錯誤。');
    }
    if (!Number.isInteger(qty) || qty < 1 || qty > 99) {
      throw new HttpsError('invalid-argument', '商品數量必須是 1～99 的整數。');
    }
    wanted.set(id, (wanted.get(id) || 0) + qty);
  }

  // ── 3. 後端自己查價格（完全不看前端送來的價格——它根本沒送，也不准送）
  const lineItems = [];
  let subtotal = 0;

  for (const [id, qty] of wanted) {
    const snap = await db.collection('products').doc(id).get();
    if (!snap.exists) {
      throw new HttpsError('not-found', `商品不存在或已下架：${id}`);
    }
    const p = snap.data();
    const unitPrice = Number(p.price_twd);
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      throw new HttpsError('internal', `商品價格異常：${id}`);
    }
    const lineTotal = unitPrice * qty;
    subtotal += lineTotal;
    lineItems.push({
      productId: id,
      name: p.name_zh || id,
      unitPrice,
      qty,
      lineTotal,
    });
  }

  // ── 4. 後端自己算折扣與總價
  const discount = subtotal >= DISCOUNT_RULE.threshold ? DISCOUNT_RULE.amount : 0;
  const total = subtotal - discount;

  // ── 5. 建立訂單（status 一律從 pending 開始，誰都不能直接生出 paid 的訂單）
  const orderRef = db.collection('orders').doc();
  const payment = createPayment({
    orderId: orderRef.id,
    amount: total,
    baseUrl: FUNCTIONS_BASE_URL,
  });

  await orderRef.set({
    userId: uid,
    items: lineItems,
    subtotal,
    discount,
    total,
    status: 'pending',
    payment: {
      provider: payment.provider,
      tradeNo: payment.tradeNo,
      paymentUrl: payment.paymentUrl,
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // ── 6. 回傳付款網址給前端（金額一併回傳，但只是顯示用）
  return { orderId: orderRef.id, total, paymentUrl: payment.paymentUrl };
});

/* ════════════════════════════════════════════════════════
   mockPayPage — 模擬金流商的付款頁
   真實世界裡這一頁是綠界/藍新的網站，不是你的。
   金額從資料庫讀（不讀網址參數——網址參數可以被改）。
   ════════════════════════════════════════════════════════ */
exports.mockPayPage = onRequest({ region: REGION }, async (req, res) => {
  const tradeNo = String(req.query.tradeNo || (req.body && req.body.tradeNo) || '');
  const orderId = String(req.query.orderId || (req.body && req.body.orderId) || '');

  const snap = await db.collection('orders').doc(orderId).get();
  if (!snap.exists || !snap.data().payment || snap.data().payment.tradeNo !== tradeNo) {
    res.status(404).send('找不到這筆交易。');
    return;
  }
  const order = snap.data();

  // POST = 使用者按下「模擬付款」按鈕 → 由「金流商」簽章並通知 Webhook
  if (req.method === 'POST') {
    const result = req.body.result === 'success' ? 'success' : 'failed';
    const payload = {
      orderId,
      tradeNo,
      amount: order.total, // 金額以資料庫為準
      result,
    };
    payload.sign = signPayload(payload);

    const resp = await fetch(`${FUNCTIONS_BASE_URL}/paymentWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const text = await resp.text();

    res.send(`
      <meta charset="utf-8"><body style="font-family:sans-serif;text-align:center;padding:60px">
      <h2>${result === 'success' ? '✅ 模擬付款完成' : '❌ 模擬付款失敗'}</h2>
      <p>Webhook 回應：<code>${text}</code></p>
      <p><a href="${STORE_URL}/orders.html">→ 回到我的訂單</a></p>
      </body>`);
    return;
  }

  // GET = 顯示付款頁
  if (order.status !== 'pending') {
    res.send(`
      <meta charset="utf-8"><body style="font-family:sans-serif;text-align:center;padding:60px">
      <h2>這筆訂單已處理（狀態：${order.status}）</h2>
      <p><a href="${STORE_URL}/orders.html">→ 回到我的訂單</a></p>
      </body>`);
    return;
  }

  res.send(`
    <meta charset="utf-8"><body style="font-family:sans-serif;text-align:center;padding:60px">
    <h2>💳 模擬金流付款頁</h2>
    <p>訂單編號：${orderId}<br>交易編號：${tradeNo}</p>
    <h1>NT$${order.total}</h1>
    <form method="POST">
      <input type="hidden" name="tradeNo" value="${tradeNo}">
      <input type="hidden" name="orderId" value="${orderId}">
      <button name="result" value="success" style="padding:12px 32px;font-size:16px;cursor:pointer">模擬付款成功</button>
      <button name="result" value="failed" style="padding:12px 32px;font-size:16px;cursor:pointer">模擬付款失敗</button>
    </form>
    <p style="color:#888;font-size:13px">真實世界裡，這一頁是金流商的網站，使用者在這裡輸入卡號。</p>
    </body>`);
});

/* ════════════════════════════════════════════════════════
   paymentWebhook — 金流商的付款結果通知
   這是「訂單變成 paid」的唯一入口。
   ════════════════════════════════════════════════════════ */
exports.paymentWebhook = onRequest({ region: REGION }, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('0|MethodNotAllowed');
    return;
  }

  const body = req.body;

  // ── 1. 驗證簽章：簽不對 = 不是金流商發的 = 有人想偽造通知
  if (!verifyWebhook(body)) {
    res.status(400).send('0|BadSignature');
    return;
  }

  const orderId = String(body.orderId || '');
  const tradeNo = String(body.tradeNo || '');
  const amount = Number(body.amount);
  const result = String(body.result || '');

  // ── 2. 訂單必須存在，且交易編號要對得上
  const ref = db.collection('orders').doc(orderId);
  const snap = await ref.get();
  if (!snap.exists) {
    res.status(404).send('0|OrderNotFound');
    return;
  }
  const order = snap.data();
  if (!order.payment || order.payment.tradeNo !== tradeNo) {
    res.status(400).send('0|TradeNoMismatch');
    return;
  }

  // ── 3. 金額必須和訂單一致（防止「付 1 元解鎖 1000 元訂單」）
  if (amount !== order.total) {
    res.status(400).send('0|AmountMismatch');
    return;
  }

  // ── 4. 狀態只能從 pending 往前走；重複通知要冪等（回 OK 但不重複處理）
  if (order.status === 'paid') {
    res.send('1|OK');
    return;
  }
  if (order.status !== 'pending') {
    res.status(400).send('0|BadStatus');
    return;
  }

  // ── 5. 更新訂單狀態（這裡是 Admin SDK，不受安全規則限制——也只有這裡能做）
  await ref.update({
    status: result === 'success' ? 'paid' : 'failed',
    paidAt: result === 'success' ? admin.firestore.FieldValue.serverTimestamp() : null,
    webhookAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // ECPay 風格的回應：金流商收到 1|OK 才不會重送通知
  res.send('1|OK');
});
