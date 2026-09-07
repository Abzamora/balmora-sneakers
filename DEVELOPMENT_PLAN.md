# SoleYard — Sneaker E-Commerce Platform
### Full Development Plan, Architecture & VSCode-to-Production Guide

---

## 1. Stack decision & justification

| Layer | Choice | Why |
|---|---|---|
| Frontend | **React 18 + Vite + React Router** | Vite gives near-instant HMR (fast local dev), a tiny production bundle, and no framework lock-in like Next.js's server requirements — this is a static SPA that talks to a REST API, so we don't need SSR. React's component model maps cleanly onto "catalog card / gallery / filter sidebar" reuse. |
| Backend | **Node.js + Express** | Same language as the frontend (one mental model, shared JSON contracts), minimal boilerplate for a REST API of this size, huge middleware ecosystem (helmet, multer, rate-limiting) that covers every requirement here without custom code. |
| Database | **MongoDB Atlas (free M0 cluster)** | The product catalog is naturally document-shaped: a sneaker has a variable-length array of images and a variable-length array of size/stock variants. Modeling that in a relational schema means extra join tables for no benefit at this scale. Atlas's free tier (512MB storage) comfortably holds thousands of products with metadata. |
| Image storage | **Cloudinary (free tier, 25GB)** | Product photography is the heaviest asset in this app. Cloudinary auto-optimizes format/quality (`quality: auto`, on-the-fly resizing) and serves from a CDN — critical for the "Performance First" requirement — without us building our own image pipeline. MongoDB itself should never store binary image data. |
| Auth | **JWT (jsonwebtoken + bcryptjs)** | Stateless, no session store needed on a free-tier server that may cold-start/restart. Passwords are hashed with bcrypt (cost factor 12); tokens are verified on every protected request via middleware. |
| Hosting | **Vercel (frontend) + Render (backend)** | Both have functional free tiers, deploy directly from a GitHub repo, and auto-redeploy on push — matching the "free hosting" and "VSCode → git push → live" workflow requested. |

This is the **MERN** stack (MongoDB, Express, React, Node), chosen specifically because every piece has a genuinely usable free tier and the data model (products with nested images/variants) is a natural fit for a document database rather than a forced one.

---

## 2. Project folder structure

```
sneaker-store/
├── backend/
│   ├── config/
│   │   ├── db.js                 # MongoDB connection
│   │   └── cloudinary.js         # Cloudinary SDK config
│   ├── models/
│   │   ├── Product.js            # Product schema (images, variants, brand, style...)
│   │   └── Admin.js              # Admin schema with password hashing
│   ├── middleware/
│   │   ├── auth.js               # JWT verification ("protect")
│   │   ├── upload.js             # Multer + Cloudinary storage for image uploads
│   │   └── errorHandler.js       # Centralized error + 404 handling
│   ├── controllers/
│   │   ├── productController.js  # Catalog queries, facets, admin CRUD, image CRUD
│   │   └── authController.js     # Login, "who am I"
│   ├── routes/
│   │   ├── productRoutes.js
│   │   └── authRoutes.js
│   ├── seed/
│   │   └── seedAdmin.js          # CLI script to create the first admin login
│   ├── .env.example
│   ├── package.json
│   └── server.js                 # App entry point
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── api.js             # Axios instance + every API call, in one place
│   │   ├── components/
│   │   │   ├── Navbar.jsx / .css
│   │   │   ├── ProductCard.jsx / .css
│   │   │   ├── FilterSidebar.jsx / .css
│   │   │   ├── ImageGallery.jsx / .css
│   │   │   └── WhatsAppButton.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx    # Admin session state
│   │   ├── pages/
│   │   │   ├── Catalog.jsx / .css
│   │   │   ├── ProductDetail.jsx / .css
│   │   │   └── admin/
│   │   │       ├── Login.jsx
│   │   │       ├── Dashboard.jsx
│   │   │       ├── ProductForm.jsx
│   │   │       ├── ProtectedRoute.jsx
│   │   │       └── admin.css
│   │   ├── App.jsx                # Route definitions
│   │   ├── main.jsx                # React root + providers
│   │   └── index.css               # Design tokens + global styles
│   ├── index.html
│   ├── vite.config.js
│   ├── .env.example
│   └── package.json
│
└── DEVELOPMENT_PLAN.md            # this file
```

Rationale: **controllers own logic, routes only wire HTTP verbs to controllers, models own schema/validation** — so a change to "how a product is filtered" never touches routing code, and a change to "which URL a filter lives at" never touches business logic. The frontend mirrors this: `api/` is the only file that knows the backend exists, so components stay pure UI.

---

## 3. Database schema (MongoDB / Mongoose)

### `Product`
| Field | Type | Notes |
|---|---|---|
| `name` | String | e.g. "Air Jordan 1 Retro High" |
| `slug` | String, unique | URL-safe, auto-generated from `name` |
| `sku` | String, unique | Shown in the WhatsApp pre-filled message |
| `brand` | Enum | Nike, Adidas, Jordan, New Balance, Puma, Reebok, Vans, Converse, Other |
| `style` | Enum | Running, Basketball, Lifestyle, Skate, Training, Retro, Boots |
| `description` | String | |
| `price` / `compareAtPrice` | Number | `compareAtPrice` drives the "Sale" badge |
| `colors` | [String] | e.g. `["Triple Black", "Bred"]` |
| `variants` | [{ size, stock }] | Per-size inventory |
| `images` | [{ url, publicId, angle, isPrimary }] | `angle` is one of front/side/back/top/sole/detail/lifestyle/box |
| `isFeatured` / `isActive` | Boolean | `isActive: false` = draft, hidden from the public catalog |
| `totalStock` | Number | Denormalized sum of `variants[].stock`, recomputed on every save |
| `createdAt` / `updatedAt` | Date | Automatic (`timestamps: true`) |

Indexes: `brand`, `style`, `price`, `isActive`, and a compound **text index** on `name` + `description` for the search bar — this is what makes filtering and search feel instant even as the catalog grows, without needing a separate search service like Algolia.

### `Admin`
| Field | Type | Notes |
|---|---|---|
| `username` | String, unique | lowercased on save |
| `passwordHash` | String | bcrypt, cost factor 12 — the plaintext password is **never** stored |
| `role` | Enum | `admin` / `superadmin` |
| `lastLoginAt` | Date | |

---

## 4. API reference

Base URL: `/api`

### Public
| Method | Path | Description |
|---|---|---|
| GET | `/products` | Paginated, filterable catalog. Query params: `brand, style, color, size, minPrice, maxPrice, q, sort, page, limit` |
| GET | `/products/facets` | Distinct brand/style/color/size values + price bounds, for the filter sidebar |
| GET | `/products/:slug` | Full product detail |
| GET | `/health` | Uptime check (also used to "wake up" a sleeping Render free instance) |

### Admin (require `Authorization: Bearer <token>`)
| Method | Path | Description |
|---|---|---|
| POST | `/auth/login` | Returns `{ id, username, role, token }` |
| GET | `/auth/me` | Validates a stored token, returns the current admin |
| GET | `/products/admin/all` | All products including drafts |
| POST | `/products` | Create product (metadata only) |
| PUT | `/products/:id` | Update product metadata |
| DELETE | `/products/:id` | Delete product + its Cloudinary images |
| POST | `/products/:id/images` | Multipart upload, field name `images` (up to 10), optional `angles` JSON array |
| DELETE | `/products/:id/images/:publicId` | Remove a single gallery image |

---

## 5. How the required features map to the code

- **Real-time filtering** → `Catalog.jsx` keeps filter state in the URL (`useSearchParams`), debounces price inputs, and re-queries `GET /products` on every change — no "Apply" button, and the view is shareable/bookmarkable.
- **Immersive image gallery** → `ImageGallery.jsx`: a thumbnail rail grouped by `angle` (front/side/sole/etc.) plus a cursor-following zoom layer on desktop; on touch devices it falls back to the browser's native pinch-zoom instead of fighting it.
- **Two WhatsApp CTAs** → `WhatsAppButton.jsx` builds a `wa.me` link with a URL-encoded message that always includes the sneaker's name and SKU. `variant="inquire"` and `variant="buy"` produce two distinctly worded messages, used once on every catalog card and twice on the detail page.
- **Protected, responsive admin panel** → `/admin` routes are wrapped in `ProtectedRoute`, which checks a JWT-backed `AuthContext`; `Dashboard.jsx`'s table collapses into stacked cards under 700px via CSS (`admin.css`), so editing works from a phone.
- **Full CRUD + multi-image management** → `ProductForm.jsx` handles create/edit in one component; images upload separately from metadata (`POST /:id/images`) so a slow mobile upload never blocks saving the text fields, and each image can be deleted individually (which also purges it from Cloudinary, not just the database).

---

## 6. VSCode setup & local development

### 6.1 Prerequisites
- [Node.js 18+](https://nodejs.org) and npm
- [VSCode](https://code.visualstudio.com) with these extensions: **ESLint**, **Prettier**, **MongoDB for VSCode** (lets you browse your Atlas cluster without leaving the editor), **Thunder Client** (optional, for testing API endpoints without Postman)
- A free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) account
- A free [Cloudinary](https://cloudinary.com/users/register/free) account
- A WhatsApp Business (or personal) number to receive inquiries

### 6.2 Provision MongoDB Atlas (free M0)
1. Create a project → **Build a Database** → select **M0 Free**.
2. Create a database user (username + password) — save these, they go in `MONGO_URI`.
3. Under **Network Access**, add `0.0.0.0/0` (allow from anywhere) — acceptable for a small project; for production hardening later, restrict to Render's static IP if you upgrade.
4. Click **Connect → Drivers**, copy the connection string. It looks like:
   `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
   Append `sneaker_store` as the database name before the `?`.

### 6.3 Provision Cloudinary
1. Sign up, go to the **Dashboard**.
2. Copy `Cloud name`, `API Key`, `API Secret` — these go into the backend `.env`.

### 6.4 Clone/open the project in VSCode
```bash
# from the folder containing the "sneaker-store" directory
code sneaker-store
```

### 6.5 Backend setup
```bash
cd sneaker-store/backend
npm install
cp .env.example .env
# open .env in VSCode and fill in MONGO_URI, JWT_SECRET, CLOUDINARY_*, WHATSAPP_NUMBER
npm run dev          # starts on http://localhost:5000 with nodemon (auto-restart on save)
```
Create your first admin login (only needs to be run once):
```bash
npm run seed:admin -- myadmin MyStrongPassword123
```

### 6.6 Frontend setup
Open a **second VSCode terminal** (Terminal → Split Terminal) so backend and frontend run side by side:
```bash
cd sneaker-store/frontend
npm install
cp .env.example .env
# for local dev, VITE_API_URL can stay as "/api" (Vite proxies it to localhost:5000)
# set VITE_WHATSAPP_NUMBER to your number, international format, digits only
npm run dev          # starts on http://localhost:5173
```

Visit `http://localhost:5173` for the storefront and `http://localhost:5173/admin/login` for the admin panel.

### 6.7 Recommended VSCode workspace settings
Create `.vscode/settings.json` at the repo root:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "eslint.workingDirectories": ["backend", "frontend"]
}
```

---

## 7. Deployment guide (free tier, production)

### 7.1 Push to GitHub
```bash
cd sneaker-store
git init
git add .
git commit -m "Initial commit: sneaker e-commerce platform"
# create a repo on github.com, then:
git remote add origin https://github.com/<you>/sneaker-store.git
git push -u origin main
```
Make sure `.env` is **not** committed (it's already in `.gitignore` for both apps) — only `.env.example` should be tracked.

### 7.2 Deploy the backend to Render
1. [render.com](https://render.com) → **New → Web Service** → connect your GitHub repo.
2. **Root Directory**: `backend`
3. **Build Command**: `npm install`
4. **Start Command**: `npm start`
5. **Instance type**: Free
6. Under **Environment**, add every variable from your local `backend/.env` (`MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `WHATSAPP_NUMBER`). Set `CLIENT_ORIGIN` to your future Vercel URL (you can update it after step 7.3).
7. Deploy. Note the resulting URL, e.g. `https://sneaker-store-api.onrender.com`.
8. Run the admin seed script once against production: easiest is a **Render Shell** (Dashboard → your service → Shell tab) → `npm run seed:admin -- myadmin MyStrongPassword123`.

> Free Render web services spin down after inactivity and take ~30–50s to wake on the next request. The `GET /api/health` endpoint exists so you can ping it (e.g. with a free [UptimeRobot](https://uptimerobot.com) monitor) to keep it warm if that cold-start delay matters for your users.

### 7.3 Deploy the frontend to Vercel
1. [vercel.com](https://vercel.com) → **Add New → Project** → import the same GitHub repo.
2. **Root Directory**: `frontend`
3. Framework preset: **Vite** (auto-detected)
4. Environment variables: `VITE_API_URL` = `https://sneaker-store-api.onrender.com/api` (your Render URL from 7.2), `VITE_WHATSAPP_NUMBER` = your number.
5. Deploy. Vercel gives you a URL like `https://sneaker-store.vercel.app`.
6. Go back to Render → update `CLIENT_ORIGIN` to this exact Vercel URL → redeploy the backend so CORS allows it.

### 7.4 Verify end-to-end
1. Visit the Vercel URL → catalog should load (empty until you add products).
2. Visit `<vercel-url>/admin/login` → sign in with the seeded admin.
3. Create a product, upload images, publish it → confirm it appears in the public catalog and that both WhatsApp buttons open a pre-filled chat with the correct sneaker name and SKU.

### 7.5 Ongoing workflow
Both Render and Vercel auto-deploy on every `git push` to `main` — so day-to-day work in VSCode is just: edit → commit → push → live in ~1–2 minutes.

---

## 8. Performance checklist

- Cloudinary transformations (`quality: auto`, capped 1600px) mean no oversized images ever ship to the browser.
- `loading="lazy"` on catalog card images defers off-screen photos.
- MongoDB indexes on every filter field (`brand`, `style`, `price`, text index) keep filtered queries fast as the catalog grows into the thousands.
- Pagination (`limit`/`page`) on `GET /products` prevents ever shipping the entire catalog in one response.
- Debounced price-range inputs prevent a network request per keystroke.
- Vite's production build (`npm run build`) code-splits and minifies automatically; Vercel serves it from a global CDN.

## 9. Security checklist

- Passwords hashed with bcrypt (cost 12), never stored or logged in plaintext.
- JWT-protected admin routes; `helmet()` sets standard security headers; CORS is locked to the known frontend origin(s).
- Rate limiting on `/api/auth/login` (20 attempts / 15 min) to slow down credential-stuffing.
- Cloudinary deletes are triggered whenever a product or image is removed, so no orphaned files accumulate or leak old URLs.
- For a next hardening pass beyond this scope: move the admin JWT from `sessionStorage` into an httpOnly cookie (requires CSRF-token handling), and add 2FA on the admin login.
