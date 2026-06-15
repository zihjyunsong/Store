/**
 * payment.js — 通用金流介面（模擬 ECPay / NewebPay 的運作方式）
 *
 * 真實金流的流程：
 *   1. 你的後端向金流商「建立交易」，拿到一個付款網址
 *   2. 使用者被導去金流商的付款頁輸入卡號
 *   3. 付款完成後，金流商用「Webhook」通知你的後端，並附上簽章
 *   4. 你的後端驗證簽章與金額，才把訂單標成已付款
 *
 * 這個檔案模擬了上述介面。之後要接真金流（綠界、藍新、Stripe），
 * 只需要改寫這個檔案，index.js 的訂單邏輯完全不用動。
 */
const crypto = require('crypto');

// 與金流商共用的秘密金鑰（模擬 ECPay 的 HashKey/HashIV）
// 正式環境務必改用環境變數設定，不要寫死在程式碼裡
const PAYMENT_SECRET = process.env.PAYMENT_SECRET || 'demo-secret-change-me';

/**
 * 計算簽章（模擬 ECPay 的 CheckMacValue）：
 * 把欄位照 key 排序串成字串，用共用秘密做 HMAC-SHA256。
 * 因為攻擊者不知道秘密，所以無法偽造出合法簽章。
 */
function signPayload(payload) {
  const base = Object.keys(payload)
    .filter((k) => k !== 'sign')
    .sort()
    .map((k) => `${k}=${payload[k]}`)
    .join('&');
  return crypto.createHmac('sha256', PAYMENT_SECRET).update(base).digest('hex');
}

/**
 * 建立一筆交易，回傳付款網址。
 * 真金流：在這裡呼叫金流商的 API。
 * 模擬版：產生交易編號，付款網址指向我們自己的 mockPayPage。
 */
function createPayment({ orderId, amount, baseUrl }) {
  const tradeNo =
    'T' + Date.now() + Math.random().toString(36).slice(2, 8).toUpperCase();

  const paymentUrl =
    `${baseUrl}/mockPayPage?tradeNo=${encodeURIComponent(tradeNo)}` +
    `&orderId=${encodeURIComponent(orderId)}`;

  return { provider: 'mockpay', tradeNo, paymentUrl, amount };
}

/**
 * 驗證 Webhook 通知的簽章。
 * 簽章不對 = 不是金流商發的 = 直接拒絕。
 */
function verifyWebhook(body) {
  if (!body || typeof body !== 'object' || typeof body.sign !== 'string') {
    return false;
  }
  const { sign, ...rest } = body;
  return sign === signPayload(rest);
}

module.exports = { createPayment, verifyWebhook, signPayload };
