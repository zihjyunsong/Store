# 甜點小店網站設計文檔

## 1. 專案目標

建立一個可部署到 GitHub Pages 的前端甜點網站。

網站只使用：

- HTML
- CSS
- JavaScript

不使用後端。

網站風格要小清新、明亮、溫暖。

文字要短、清楚、有節奏。

整體感覺像店主本人：

- 利落
- 親切
- 不浮誇
- 有法式甜點的細緻感
- 有日常小店的溫度

## 2. 網站定位

這是一間由留法甜點女孩創立的小店。

她剛從法國學成回國。

她做的甜點：

- 技法細緻
- 甜度剛好
- 外型可愛
- 風格明快
- 適合日常分享

網站要讓使用者一進來就知道：

- 這是甜點小店
- 有四大甜點分類
- 商品可以清楚瀏覽
- 價格透明
- 風格溫柔但不拖泥帶水

## 3. 資料與素材

### 維護原則

店主是程式小白。

所以網站內容要盡量資料化。

店主日後只需要修改 `Docs/` 裡的檔案。

不要要求店主改：

- HTML
- CSS
- JavaScript

網站程式負責讀取資料檔，再把內容顯示到頁面上。

### 店面設定資料

新增：

```text
Docs/SiteConfig.json
```

用途：

- 店名
- 英文店名
- 首頁標語
- 首頁短介紹
- 地址
- 電話
- Email
- 營業時間
- 社群連結
- 頁尾小語

建議格式：

```json
{
  "storeNameZh": "露米甜點",
  "storeNameEn": "Lumiere Patisserie",
  "tagline": "法式手藝，日常甜點。",
  "heroText": "回台女孩的明亮甜點小店。",
  "address": "台北市甜點街 12 號",
  "phone": "02-1234-5678",
  "email": "hello@lumiere-dessert.com",
  "businessHours": "週三至週日 11:00-19:00",
  "instagram": "https://www.instagram.com/",
  "footerText": "今天也要吃點甜。"
}
```

店主要更新聯絡資訊時，只改這個檔案。

例如：

- 換電話：改 `phone`
- 換地址：改 `address`
- 換店名：改 `storeNameZh` 和 `storeNameEn`
- 換營業時間：改 `businessHours`

### 文案資料

使用：

```text
Docs/StoreIntro.md
```

用途：

- 首頁補充文案
- 品牌短文
- 頁尾短句

首頁最重要的店名與聯絡資訊不直接寫死在這裡。

首頁主要資料以 `Docs/SiteConfig.json` 為準。

### 店主介紹資料

新增：

```text
Docs/OwnerProfile.md
```

用途：

- `Web/owner.html` 店主介紹頁
- 留法背景
- 甜點理念
- 個人風格介紹

店主要修改個人故事時，只改這個 Markdown。

建議內容保持短段落。

不要寫太長。

### 商品資料

使用：

```text
Docs/ProductCatalog.csv
```

欄位：

- `category`
- `image`
- `name_zh`
- `name_en`
- `price_twd`
- `description_zh`

用途：

- 甜點商品卡片
- 分類頁商品列表
- 首頁分類入口

店主可以透過修改 CSV 增加品項。

只要新增一列商品資料，網站就能顯示新商品。

前提：

- `category` 必須是現有分類之一
- `image` 必須指向存在的圖片
- `price_twd` 只填數字，不加 `NT$`
- 每一欄都要填

目前分類：

- `Cake`
- `Cookie`
- `Japan`
- `Taiwan`

範例：

```csv
category,image,name_zh,name_en,price_twd,description_zh
Cake,Images/Cake/Cake_11.png,蜜桃鮮奶油蛋糕,Peach Cream Cake,320,蜜桃香甜奶霜輕盈
```

若要新增第五種分類，不只改 CSV。

還需要：

- 新增圖片資料夾
- 新增分類頁
- 新增首頁分類按鈕
- 更新分類設定

所以一般店主維護時，建議先只在既有四類中新增商品。

### 商品圖片

使用：

```text
Images/Cake/
Images/Cookie/
Images/Japan/
Images/Taiwan/
```

每一類 10 張圖片。

### 背景參考圖

使用：

```text
Images/Background/flowsers.png
```

只用在：

- 網站頂部
- 網站底部

不鋪滿整個網站。

主內容區使用純色背景，保持文字清楚。

## 4. 網站架構

網站使用多頁式前端架構。

適合 GitHub Pages。

建議檔案結構：

```text
Web/
  index.html
  owner.html
  cake.html
  cookie.html
  japan.html
  taiwan.html
  data/
    site-config.json
    products.csv
    store-intro.md
    owner-profile.md
  css/
    style.css
  js/
    model.js
    view.js
    controller.js
  assets/
    bg-header.png
    bg-footer.png
```

說明：

開發時資料原始檔放在 `Docs/`。

若 GitHub Pages 讀取 `Docs/` 路徑不方便，可部署時複製到：

```text
Web/data/
```

網站實際讀取：

```text
Web/data/site-config.json
Web/data/products.csv
Web/data/store-intro.md
Web/data/owner-profile.md
```

這樣店主只要改資料檔。

程式不用改。

### 頁面規劃

首頁：

```text
Web/index.html
```

內容：

- 店名
- 短標語
- 小店簡介
- 四個甜點分類大按鈕
- 店面聯絡資訊
- 精選甜點區
- 頁尾

店主介紹頁：

```text
Web/owner.html
```

內容：

- 店主介紹
- 留法學習背景
- 甜點理念
- 回首頁按鈕

首頁可放「認識店主」按鈕。

按鈕開啟新分頁。

分類頁：

```text
Web/cake.html
Web/cookie.html
Web/japan.html
Web/taiwan.html
```

每一類甜點使用獨立頁面。

使用者點首頁分類大按鈕後，開啟對應新分頁。

按鈕設定：

```html
target="_blank"
```

分類頁內容：

- 分類名稱
- 分類短介紹
- 商品卡片列表
- 回首頁按鈕

## 5. MVC 架構設計

雖然網站只有前端，也用 MVC 方式整理程式。

讓資料、畫面、操作邏輯分開。

### Model

檔案：

```text
Web/js/model.js
```

負責：

- 讀取店面設定資料
- 讀取商品 CSV 資料
- 讀取店主介紹 Markdown
- 依分類篩選商品
- 提供分類資訊

資料來源：

```text
Web/data/site-config.json
Web/data/products.csv
Web/data/store-intro.md
Web/data/owner-profile.md
```

開發原始資料可放在：

```text
Docs/SiteConfig.json
Docs/ProductCatalog.csv
Docs/OwnerProfile.md
```

部署時再複製到 `Web/data/`。

### 資料檔優先原則

預設不要把商品、店名、聯絡資訊寫死在 JS 裡。

店主未來應該只改資料檔。

Model 透過 `fetch()` 讀取資料：

```js
fetch("./data/site-config.json")
fetch("./data/products.csv")
fetch("./data/store-intro.md")
fetch("./data/owner-profile.md")
```

如果 GitHub Pages 路徑或 CSV 解析遇到問題，才考慮用 JS 陣列做備援。

備援不是主要維護方式。

### View

檔案：

```text
Web/js/view.js
```

負責：

- 產生首頁分類按鈕
- 產生商品卡片
- 顯示價格
- 顯示分類頁標題
- 控制空狀態或載入狀態

商品卡片內容：

- 商品圖片
- 中文名
- 英文名
- NT$ 價格
- 超短簡介

### Controller

檔案：

```text
Web/js/controller.js
```

負責：

- 判斷目前頁面是哪一類
- 從 Model 取得資料
- 呼叫 View 渲染畫面
- 綁定分類按鈕、店主介紹按鈕與回首頁按鈕

首頁行為：

- 顯示四個分類入口
- 分類按鈕開新分頁
- 顯示店面聯絡資訊
- 店主介紹按鈕開新分頁
- 可顯示每類 1 到 2 個精選商品

分類頁行為：

- 依頁面讀取對應分類
- 顯示該分類 10 個商品

店主介紹頁行為：

- 顯示短版店主故事
- 保持短句與明快節奏
- 提供回首頁按鈕

## 6. 視覺風格

### 整體方向

小清新。

明亮。

乾淨。

可愛但不甜膩。

網站主體要有大量留白。

商品卡片要清楚，不要讓背景干擾閱讀。

### 參考背景圖色彩

背景圖有水彩花草與莓果。

建議擷取以下色彩：

| 用途 | 顏色 | 說明 |
|---|---:|---|
| 主背景 | `#FFFDF8` | 奶油白，乾淨溫暖 |
| 區塊背景 | `#F8F1E7` | 淡杏仁色，柔和分區 |
| 主文字 | `#3F342D` | 深可可色，清楚易讀 |
| 次文字 | `#7A6A5D` | 溫和灰棕 |
| 主按鈕 | `#E98FA0` | 花瓣粉，明亮可愛 |
| 按鈕 hover | `#D96F84` | 稍深莓果粉 |
| 輔助色 | `#8FB887` | 葉片綠 |
| 價格色 | `#B85C5C` | 莓果紅，醒目但不刺眼 |
| 卡片線條 | `#E8D8C8` | 淡米棕 |

### 背景圖片使用

頂部背景：

- 來源：`Images/Background/flowsers.png`
- 裁切成橫向 banner
- 建議高度：桌機 `280px`，手機 `190px`
- 圖片位置：center top
- 加白色半透明遮罩，避免文字不清楚

底部背景：

- 同一張圖裁切下方或另一段
- 建議高度：桌機 `180px`，手機 `140px`
- 可降低透明度
- 頁尾文字放在純色或半透明白底上

主內容：

- 不使用背景圖
- 使用純色 `#FFFDF8`

## 7. 字體與文字風格

### 字體方向

網站要明快，不要太軟。

建議使用：

```css
font-family: "Noto Sans TC", "Nunito", sans-serif;
```

若不引入 Google Fonts，可使用：

```css
font-family: "Microsoft JhengHei", "Noto Sans TC", sans-serif;
```

### 文字風格

標題：

- 短
- 直接
- 有呼吸感

例：

```text
法式手藝，日常甜點。
```

按鈕文字：

```text
蛋糕 Cake
餅乾 Cookie
日式甜點 Japan
台式甜點 Taiwan
```

商品簡介：

- 12 字以內優先
- 最多一行
- 不寫長句

例：

```text
莓果酸甜配輕奶霜
```

## 8. 首頁設計

### Hero 區

內容：

- 店名
- 短標語
- 一句簡介

建議文案：

```text
Lumière Pâtisserie
法式手藝，日常甜點。
留法女孩的明亮甜點小店。
```

說明：

- 店名可用英文或中英並列
- 文字放在半透明白色卡片中
- 背景使用花草圖

### 分類大按鈕

四個大按鈕：

- Cake 蛋糕
- Cookie 餅乾
- Japan 日式甜點
- Taiwan 台式甜點

桌機：

- 2 x 2 或 4 欄排列
- 每個按鈕像大卡片
- 放代表性甜點小圖

手機：

- 單欄排列
- 大按鈕高度足夠
- 文字清楚可點

每個按鈕開新分頁。

### 店面聯絡資訊區

首頁不放完整店主介紹。

首頁改放店面聯絡資訊。

資訊要清楚、好找、適合網站訪客快速確認。

建議內容：

```text
店面資訊

地址：台北市甜點街 12 號
電話：02-1234-5678
營業時間：週三至週日 11:00-19:00
Email：hello@lumiere-dessert.com

現場少量販售。
客製與大量訂購請提前預約。
```

設計方式：

- 使用純色卡片
- 背景不放花圖
- 文字靠左
- 重點資訊可用小圖示或粗體
- 手機版維持一欄

### 認識店主入口

首頁只放一個小型 CTA。

```text
認識店主
```

點擊後開啟：

```text
Web/owner.html
```

按鈕設定：

```html
target="_blank"
```

### 精選商品區

可從每個分類選 1 個商品。

用途：

- 讓首頁更有商品感
- 提升使用者點分類的意願

## 9. 分類頁設計

### Cake 頁

主色：

```text
花瓣粉 + 奶油白
```

文案：

```text
蛋糕 Cake
細緻、柔軟、帶一點法式浪漫。
```

價格：

```text
NT$200-390
```

### Cookie 頁

主色：

```text
奶油棕 + 杏仁色
```

文案：

```text
餅乾 Cookie
小小一片，酥香直接。
```

價格：

```text
NT$35-80
```

### Japan 頁

主色：

```text
嫩綠 + 淡粉
```

文案：

```text
日式甜點 Japan
清雅、細緻、剛好的甜。
```

價格：

```text
NT$80-350
```

### Taiwan 頁

主色：

```text
米金 + 暖橘
```

文案：

```text
台式甜點 Taiwan
熟悉的香氣，做得更清爽。
```

價格：

```text
NT$80-350
```

## 10. 商品卡片設計

每張商品卡包含：

- 商品圖片
- 中文名稱
- 英文名稱
- 價格
- 超短簡介

桌機卡片：

- 3 或 4 欄
- 圓角卡片
- 淡色邊框
- 白底
- 圖片置中

手機卡片：

- 1 欄
- 圖片大一點
- 價格清楚

價格顯示：

```text
NT$260
```

商品名顯示：

```text
草莓雲朵杯子蛋糕
Strawberry Cloud Cupcake
```

## 11. RWD 響應式設計

### 桌機

螢幕寬度：

```text
1024px 以上
```

設計：

- 最大寬度 `1120px`
- 首頁分類可 4 欄或 2 x 2
- 商品卡片 4 欄
- Hero 高度約 `360px`

### 平板

螢幕寬度：

```text
768px-1023px
```

設計：

- 分類按鈕 2 欄
- 商品卡片 2 到 3 欄
- Hero 高度約 `300px`

### 手機

螢幕寬度：

```text
767px 以下
```

設計：

- 單欄排版
- 分類按鈕全寬
- 商品卡片單欄
- Hero 高度約 `260px`
- 標題縮小但保持清楚

手機優先事項：

- 按鈕要大
- 文字不要太小
- 商品價格要一眼看到
- 圖片不可擠壓變形

## 12. GitHub Pages 注意事項

GitHub Pages 可直接部署靜態檔案。

建議：

- 將網站入口放在 `Web/index.html`
- 或部署時把 `Web` 設為 Pages 來源資料夾

若 Pages 只能讀根目錄，可改成：

```text
index.html
css/
js/
Images/
Docs/
```

圖片路徑要使用相對路徑。

範例：

從 `Web/index.html` 讀圖片：

```text
../Images/Cake/Cake_01.png
```

從根目錄 `index.html` 讀圖片：

```text
Images/Cake/Cake_01.png
```

目前建議先使用 `Web/` 開發。

之後部署前再確認 GitHub Pages 的來源設定。

## 13. 互動設計

### 必要互動

- 首頁分類按鈕開新分頁
- 首頁認識店主按鈕開新分頁
- 商品卡片 hover 輕微浮起
- 回首頁按鈕

### 建議互動

- 頁面載入時淡入
- 商品卡片 stagger 顯示
- 按鈕 hover 改成莓果粉

互動要輕。

不要太花。

速度要快。

## 14. CSS 設計重點

建議使用 CSS 變數：

```css
:root {
  --cream: #FFFDF8;
  --almond: #F8F1E7;
  --cocoa: #3F342D;
  --taupe: #7A6A5D;
  --petal: #E98FA0;
  --berry: #B85C5C;
  --leaf: #8FB887;
  --line: #E8D8C8;
}
```

重點：

- 全站背景用奶油白
- 卡片用白底
- 區塊用淡杏仁色
- 主按鈕用花瓣粉
- 價格用莓果紅
- Hover 用柔和動畫

## 15. 店主維護指南

### 店主可以只改資料檔嗎？

可以。

設計目標就是讓店主不用碰程式。

日後維護分成三種：

| 想修改 | 修改檔案 |
|---|---|
| 新增、刪除、改商品 | `Web/data/products.csv` |
| 改店名、電話、地址、營業時間 | `Web/data/site-config.json` |
| 改店主介紹、個人故事 | `Web/data/owner-profile.md` |

如果仍保留 `Docs/` 當原始資料區，則先改：

```text
Docs/ProductCatalog.csv
Docs/SiteConfig.json
Docs/OwnerProfile.md
```

再同步到：

```text
Web/data/
```

### 修改 CSV 可以增加品項嗎？

可以。

在 `products.csv` 新增一列即可。

範例：

```csv
Cake,../Images/Cake/Cake_11.png,蜜桃鮮奶油蛋糕,Peach Cream Cake,320,蜜桃香甜奶霜輕盈
```

注意：

- 不要刪掉第一列欄位名稱
- 每一列都要有 6 個欄位
- 價格只填數字
- 圖片路徑要真的存在
- 分類要填 `Cake`、`Cookie`、`Japan` 或 `Taiwan`

如果新增圖片：

1. 把圖片放進對應資料夾
2. 在 CSV 新增一列
3. 填上圖片路徑
4. 重新整理網站

### 店主要怎麼更新聯絡資訊？

修改：

```text
Web/data/site-config.json
```

常改欄位：

```json
{
  "storeNameZh": "露米甜點",
  "storeNameEn": "Lumiere Patisserie",
  "address": "台北市甜點街 12 號",
  "phone": "02-1234-5678",
  "email": "hello@lumiere-dessert.com",
  "businessHours": "週三至週日 11:00-19:00"
}
```

修改時注意：

- 冒號 `:` 不要刪
- 雙引號 `"` 不要刪
- 每一行結尾的逗號要保留，最後一行不用逗號

### 店主要怎麼更新店名？

修改：

```json
"storeNameZh": "新的中文店名",
"storeNameEn": "New English Store Name"
```

首頁、分類頁、頁尾都從這裡讀取。

不用改 HTML。

### 店主要怎麼更新店面介紹？

短的首頁介紹放在：

```json
"tagline": "法式手藝，日常甜點。",
"heroText": "留法女孩的明亮甜點小店。"
```

如果要放比較完整的品牌短文，可以改：

```text
Web/data/store-intro.md
```

建議首頁仍保持短句。

不要放太長。

### 店主要怎麼更新個人介紹？

修改：

```text
Web/data/owner-profile.md
```

這個檔案只給店主介紹頁使用。

首頁只放「認識店主」按鈕。

### 建議給店主看的規則

- 商品資料改 CSV
- 店面資料改 JSON
- 故事文案改 Markdown
- 不改 HTML
- 不改 CSS
- 不改 JS

這樣網站最安全，也最好維護。

## 16. 首頁線框

```text
[Header / Hero with flower background]
  店名
  法式手藝，日常甜點
  留法女孩的明亮甜點小店

[Category Buttons]
  Cake       Cookie
  Japan      Taiwan

[Contact]
  地址
  電話
  營業時間
  Email

[Owner Link]
  認識店主

[Featured Products]
  4 張商品卡

[Footer with flower background]
  今天也要吃點甜
```

## 17. 分類頁線框

```text
[Small Header with flower background]
  Cake 蛋糕
  細緻、柔軟、帶一點法式浪漫

[Product Grid]
  商品卡 x 10

[Back Home Button]

[Footer with flower background]
```

## 18. 店主介紹頁線框

```text
[Small Header with flower background]
  認識店主
  留法女孩的明亮甜點小店

[Owner Story]
  短句介紹
  留法背景
  甜點理念

[Back Home Button]

[Footer with flower background]
```

## 19. 開發順序建議

1. 建立 `Web/index.html`
2. 建立 `Web/css/style.css`
3. 建立 `Web/js/model.js`
4. 建立 `Web/js/view.js`
5. 建立 `Web/js/controller.js`
6. 建立 `Web/owner.html`
7. 建立四個分類頁
8. 裁切背景圖成 header/footer banner
9. 套用 RWD
10. 測試 GitHub Pages 路徑
11. 手機與桌機檢查

## 20. 完成標準

網站完成時需符合：

- GitHub Pages 可開啟
- 首頁有店名、簡介、四個分類大按鈕
- 首頁有店面聯絡資訊
- 店主介紹在獨立分頁
- 認識店主按鈕可開新分頁
- 店名與聯絡資訊可由資料檔修改
- 商品可由 CSV 新增或修改
- 店主介紹可由 Markdown 修改
- 分類按鈕可開新分頁
- 每個分類頁顯示 10 個商品
- 商品名稱、英文名、價格、簡介清楚
- 手機版可讀、可點、不卡版
- 電腦版留白漂亮、商品排列整齊
- 只有頂部與底部使用背景圖
- 主內容文字清楚明快

## 21. 設計關鍵句

法式手藝。

日常甜點。

明亮、乾淨、剛剛好。
