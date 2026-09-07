# BALMORA — Sneaker E-Commerce Platform

Un catálogo completo de zapatillas con filtros en tiempo real, 
una galería de imágenes inmersiva, gestión de consultas y proceso 
de compra vía WhatsApp, y con funcionalidad CRUD completa y carga 
de múltiples imágenes.

**Stack:** React (Vite) · Node.js/Express · MongoDB Atlas · Cloudinary

👉 **See [`DEVELOPMENT_PLAN.md`](./DEVELOPMENT_PLAN.md) for the full
architecture rationale, database schema, API reference, VSCode setup, and
step-by-step deployment guide (Vercel + Render, both free tier).**

## Quickstart

```bash
# Backend
cd backend && npm install && cp .env.example .env   # fill in .env
npm run dev

# Frontend (separate terminal)
cd frontend && npm install && cp .env.example .env  # fill in .env
npm run dev
```

Then open `http://localhost:5173` (storefront) and
`http://localhost:5173/admin/login` (admin panel).
