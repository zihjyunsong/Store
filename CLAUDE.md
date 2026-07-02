# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**露米甜點 (Lumiere Patisserie)** — a bakery e-commerce demo on **Firebase**
(project `webauth-aded6`, region `asia-east1`). It's a teaching project: the interesting
part is the **security boundary between a public static frontend and a trusted backend**.

Two halves:

- **`docs/`** — the static frontend, served by **GitHub Pages** at
  `https://zihjyunsong.github.io/Store/` (Pages source = this repo's `docs/` folder).
  Plain HTML + vanilla JS, no build step, Firebase loaded via CDN (`firebase-*-compat.js`).
- **`functions/`** — **Cloud Functions** (Node 20) that own everything money-related.
- **`firestore.rules`** — the actual access-control layer. The frontend is deliberately
  powerless; the rules are what enforce it.

Currently on branch **`firebasefunc`**, not `main`.

## Frontend architecture (`docs/`)

A hand-rolled **MVC**, all globals (no modules/bundler). Each `.html` page sets
`<body data-page="...">` (and `data-category="..."` for category pages); a single
`controller.js` reads those attributes and dispatches:

- **`js/model.js`** — loads & parses data. Content lives in flat files, **not** hardcoded:
  `data/site-config.json` (store info), `data/products.csv` (catalog), `data/owner-profile.md`.
  `Model` fetch()es these, so pages must be served over http, not opened as `file://`.
- **`js/view.js`** — all DOM rendering. No logic beyond templating.
- **`js/controller.js`** — entry point (`DOMContentLoaded`); routes by `data-page`
  (`home` / `category` / `owner` / `favorites` / `cart` / `orders`) and wires up
  favorite-hearts + cart buttons.
- **`js/auth.js`** — Firebase init + Google sign-in/out + per-page header state.
- **`js/db.js`** — Firestore reads/writes for **user-owned** data only:
  `users/{uid}` with `favorites` (array of product ids) and `cart` (map id→qty).
  Product id = image filename without extension, e.g. `images/Cake/Cake_01.png` → `Cake_01`.
- **`js/firebase-config.js`** — public web config (safe to commit; the real guard is
  Firebase authorized-domains + API-key referrer restrictions).

`docs/data/` is the frontend's editable copy of the content; `Info/` holds the original
source docs (design notes, `ProductCatalog.csv`, etc.) that `docs/data/` was derived from.

## Backend architecture (`functions/`)

Design rule, stated in the code: **"don't trust anything the frontend sends."** Three functions:

- **`createOrder`** (callable, requires auth) — frontend sends only `{ items: [{id, qty}] }`.
  The backend re-reads each price from Firestore `products`, computes subtotal/discount/total
  itself (discount rule `滿1000折100` lives here — the *only* source of truth for money),
  and creates the order with `status: 'pending'`. The client never sends or sets prices.
- **`mockPayPage`** (HTTP) — stands in for the payment provider's hosted page (ECPay/NewebPay
  style). Reads the amount from the DB, not the URL. Replace this when wiring a real gateway.
- **`paymentWebhook`** (HTTP) — the **only** path that can flip an order to `paid`. Verifies
  the HMAC signature (`payment.js`), checks the amount matches the order, enforces
  `pending → paid/failed`, and is idempotent on repeat notifications.

`payment.js` is the swappable gateway interface (`createPayment` / `signPayload` /
`verifyWebhook`). To integrate a real provider, rewrite only this file — `index.js` order
logic shouldn't need to change. The shared secret is `process.env.PAYMENT_SECRET`
(defaults to a demo value — set a real one in production).

## Security model — do not weaken (`firestore.rules`)

This is the whole point of the project. Preserve it:

- `products` — world-readable; writable **only** by an admin (custom claim). Prices change
  via the seed script or an admin, never the browser.
- `users/{uid}` — a user can read/write only their own doc (favorites + cart).
- `access/{email}` — read-your-own only; **no client writes**. (Shared with the `Tutorial`
  site's per-user access list — same Firebase project.)
- `orders/{orderId}` — owner can **read**; **client cannot write at all**. Orders are
  created and marked paid exclusively by Cloud Functions via the Admin SDK, which bypasses
  rules. This is why `status` can never become `paid` from the browser.

Never "simplify" a feature by letting the client write `orders` or `products` — that
dismantles the entire lesson.

## Commands

- **Preview frontend:** `python3 -m http.server 8000` (or `start-server.bat`), open
  `http://localhost:8000/docs/`. Must be over http (Model uses `fetch`).
- **Install function deps:** `cd functions && npm install`.
- **Deploy functions:** from repo root, `firebase deploy --only functions`.
- **Deploy rules:** `firebase deploy --only firestore:rules`.
- **Deploy frontend:** commit + `git push`; GitHub Pages serves `docs/`.
- **Seed products:** `cd tools && node seed-products.js` — imports `docs/data/products.csv`
  into Firestore `products`. Re-run after any price change (Firestore is the pricing truth).
- **Grant admin:** `node tools/set-admin.js <email>` — sets the `admin` custom claim
  (frontend can't). The account must sign out and back in for the new token to take effect.

Both `tools/` scripts need a **`tools/serviceAccountKey.json`** (Firebase service-account
private key). It must **never be committed** — there is currently no `.gitignore` here, so
add/keep the ignore before adding that file.
