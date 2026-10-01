# SENDAR — AI Chatbot

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white)
[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://sender-chat-nine.vercel.app/)

Chatbot AI pribadi — **Express + React/Vite** dengan autentikasi Clerk,
LLM multi-provider (*round-robin* + *failover* otomatis), lampiran
gambar/PDF, dan deteksi gambar AI-*generated*.

**[→ Coba demo live](https://sender-chat-nine.vercel.app/)** — versi demo
100% frontend, tanpa login dan tanpa API key.

## Daftar Isi

- [Fitur](#fitur)
- [Demo](#demo)
- [Mulai Cepat](#mulai-cepat)
- [Konfigurasi](#konfigurasi)
- [Struktur Proyek](#struktur-proyek)
- [Teknologi](#teknologi)
- [Deployment](#deployment)
- [Lisensi](#lisensi)

## Fitur

| Fitur | Detail |
| --- | --- |
| 💬 Chat multi-provider | Groq + Gemini sebagai default; provider yang gagal otomatis di-*failover*, *cooldown* 5 menit setelah 3x gagal beruntun |
| 🕵️ Deteksi AI | Estimasi probabilitas gambar AI-*generated* via Sightengine (*rate limit* 10/menit/pengguna), tanpa memakan token LLM |
| 📎 Lampiran | Gambar (maks 4 MB/file, maks 4 gambar, *auto-resize*) & PDF (ekstraksi teks maks 20 halaman) |
| 🗂️ Riwayat lokal | Tersimpan per browser (`localStorage`, maks 100 chat) |
| 🎙️ *Voice input* | Via Web Speech API (Chrome) |

## Demo

Versi demo berjalan sepenuhnya di frontend — tanpa login Clerk, tanpa
backend, dan tanpa API key. Jawaban chat berasal dari bank respons lokal,
skor Deteksi AI diacak, dan semuanya diberi label **DEMO**.

- 🌐 Live: <https://sender-chat-nine.vercel.app/>
- 🌿 Branch: [`demo`](https://github.com/senshiner/AiChatBot/tree/demo)

## Mulai Cepat

### Prasyarat

- Node.js 20+
- Akun Clerk (untuk login)
- Minimal satu API key LLM — Groq / Gemini / OpenRouter / Z.AI (gratis)
- Akun Sightengine gratis (untuk fitur Deteksi AI)

### 1. Clone

```bash
git clone https://github.com/senshiner/AiChatBot.git
cd AiChatBot
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env   # lalu isi .env (lihat tabel Konfigurasi)
node server.js         # berjalan di http://localhost:3000
```

### 3. Frontend (terminal baru)

```bash
cd frontend
npm install
cp ../.env.example .env   # lalu isi .env
npm run dev               # buka http://localhost:5173
```

> Jika backend & frontend beda device (mis. backend di PC, dibuka dari HP):
> isi `VITE_API_URL` dengan IP LAN PC (mis. `http://192.168.1.10:3000`),
> samakan `CLIENT_URL` di backend, dan buka port 3000 di firewall.

## Konfigurasi

**`backend/.env`** (salin dari `backend/.env.example`):

| Key | Wajib | Keterangan |
| --- | --- | --- |
| `CLERK_SECRET_KEY` / `CLERK_PUBLISHABLE_KEY` | Ya | Dari dashboard Clerk |
| `GROQ_API_KEY` / `GEMINI_API_KEY` | Salah satu | Provider LLM utama (gratis). Jika kosong semua, tetap berjalan via LLM7 + OmegaTech (*keyless*, lebih lambat) |
| `SIGHTENGINE_API_USER` / `SIGHTENGINE_API_SECRET` | Ya (fitur Deteksi AI) | Daftar gratis di sightengine.com |
| `DATABASE_URL` | Tidak | Riwayat chat server-side; kosong = nonaktif (riwayat lokal browser tetap berjalan) |
| `CLIENT_URL` | Ya | URL frontend untuk CORS |
| `OPENROUTER_API_KEY` / `ZAI_API_KEY` / `LLM7_API_KEY` / `CUSTOM_1..9_*` | Tidak | Provider tambahan, otomatis ikut *round-robin* |

**`frontend/.env`** (salin dari `.env.example` di root):

| Key | Keterangan |
| --- | --- |
| `VITE_API_URL` | URL backend |
| `VITE_CLERK_PUBLISHABLE_KEY` | Sama dengan `CLERK_PUBLISHABLE_KEY` backend |

> ⚠️ Jangan pernah *commit* file `.env` asli.

## Struktur Proyek

```
AiChatBot/
├── frontend/              # React + Vite + Tailwind (UI)
├── backend/               # Express API (Clerk auth, multi-provider LLM)
├── .env.example           # Template env frontend → salin ke frontend/.env
└── backend/.env.example   # Template env backend → salin ke backend/.env
```

## Teknologi

**Backend:** Express 5 · `@clerk/express` · `helmet` · OpenAI SDK
(multi-provider) · Neon Postgres (opsional) · Sightengine API

**Frontend:** React 19 · Vite · Tailwind CSS 4 · `react-markdown` · pdfjs ·
Clerk

## Deployment

- **Demo (frontend-only):** *deploy* branch `demo` ke Vercel — `vercel.json`
  otomatis *build* dengan `VITE_DEMO_MODE=true`. Tidak butuh backend,
  database, atau API key apa pun.
- **Versi full:** *host* backend di layanan Node.js apa pun (VPS, Railway,
  Render, dsb), *deploy* frontend sebagai situs statis (Vercel/Netlify),
  lalu set `VITE_API_URL` ke URL backend.

## Lisensi

MIT
