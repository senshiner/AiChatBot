# SENDAR — AI Chatbot

Chatbot AI pribadi (Express + React/Vite) dengan login Clerk, multi-provider
LLM (round-robin + failover otomatis), lampiran gambar/PDF, dan fitur
**Deteksi AI** (estimasi gambar AI-generated via Sightengine, tanpa makan
token LLM).

Repo: `senshiner/AiChatBot`.

## Struktur

```
AiChatBot/
├── frontend/          # React + Vite + Tailwind (UI)
├── backend/           # Express API (Clerk auth, multi-provider LLM)
├── .env.example       # template env FRONTEND → salin ke frontend/.env
└── backend/.env.example  # template env BACKEND → salin ke backend/.env
```

## Prasyarat

- Node.js 20+
- Akun Clerk (untuk login)
- API key LLM, minimal satu (Groq / Gemini / OpenRouter / Z.AI — gratis)
- Akun Sightengine gratis (untuk fitur Deteksi AI)

## Setup

### 1. Clone

```bash
git clone https://github.com/senshiner/AiChatBot.git
cd AiChatBot
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
# isi .env (lihat tabel Environment di bawah)
node server.js        # jalan di http://localhost:3000
```

### 3. Frontend (terminal baru)

```bash
cd frontend
npm install
cp ../.env.example .env
# isi .env
npm run dev           # buka http://localhost:5173
```

> Kalau backend & frontend beda device (mis. backend di PC, dibuka dari HP):
> `VITE_API_URL` isi IP LAN PC (mis. `http://192.168.1.10:3000`),
> `CLIENT_URL` di backend samakan, dan buka port 3000 di firewall.

## Environment

**`backend/.env`** (salin dari `backend/.env.example`):

| Key | Wajib | Keterangan |
|---|---|---|
| `CLERK_SECRET_KEY` / `CLERK_PUBLISHABLE_KEY` | Ya | Dashboard Clerk tim |
| `GROQ_API_KEY` / `GEMINI_API_KEY` | Salah satu | Provider LLM utama (gratis). Kosong semua tetap jalan via LLM7 + OmegaTech (keyless, lebih lambat) |
| `SIGHTENGINE_API_USER` / `SIGHTENGINE_API_SECRET` | Ya (fitur Deteksi AI) | Daftar gratis di sightengine.com |
| `DATABASE_URL` | Tidak | Riwayat chat server-side; kosong = nonaktif (riwayat lokal browser tetap jalan) |
| `CLIENT_URL` | Ya | URL frontend untuk CORS |
| `OPENROUTER_API_KEY` / `ZAI_API_KEY` / `LLM7_API_KEY` / `CUSTOM_1..9_*` | Tidak | Provider tambahan, otomatis ikut round-robin |

**`frontend/.env`** (salin dari `.env.example` di root):

| Key | Keterangan |
|---|---|
| `VITE_API_URL` | URL backend |
| `VITE_CLERK_PUBLISHABLE_KEY` | Sama dengan `CLERK_PUBLISHABLE_KEY` backend |

## Fitur

- **Chat multi-provider** — Groq + Gemini default; provider gagal otomatis
  di-failover, cooldown 5 menit setelah 3x gagal beruntun.
- **Deteksi AI** — tombol di header; upload gambar → estimasi probabilitas
  AI-generated via Sightengine (rate limit 10/menit/user).
- **Lampiran** — gambar (max 4 MB/file, max 4 gambar, auto-resize) & PDF
  (ekstrak teks max 20 halaman).
- **Riwayat lokal** — tersimpan per browser (localStorage, max 100 chat).
- **Voice input** — via Web Speech API (Chrome).

## Tech Stack

Backend: Express 5 · `@clerk/express` · `helmet` · OpenAI SDK (multi-provider)
· Neon Postgres (opsional) · Sightengine API.
Frontend: React 19 · Vite · Tailwind 4 · `react-markdown` · pdfjs · Clerk.

## License

MIT
