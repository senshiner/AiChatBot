# SENDAR — AI Chatbot (Demo)

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white)
[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://sender-chat-nine.vercel.app/)

> 🌿 Branch **`demo`** — versi demo 100% frontend dari
> [SENDAR AI Chatbot](https://github.com/senshiner/AiChatBot).
> Untuk versi full (Clerk + multi-provider LLM), lihat branch
> [`main`](https://github.com/senshiner/AiChatBot/tree/main).

**[→ Coba demo live](https://sender-chat-nine.vercel.app/)** — langsung masuk
zona chat, tanpa login dan tanpa API key.

## Daftar Isi

- [Tentang Mode Demo](#tentang-mode-demo)
- [Menjalankan Lokal](#menjalankan-lokal)
- [Kustomisasi Respons](#kustomisasi-respons)
- [Deploy ke Vercel](#deploy-ke-vercel)
- [Struktur Proyek](#struktur-proyek)
- [Teknologi](#teknologi)
- [Lisensi](#lisensi)

## Tentang Mode Demo

*Build* dengan `VITE_DEMO_MODE=true` menghasilkan aplikasi yang:

| Aspek | Perilaku demo |
| --- | --- |
| 🔓 Login | Dinonaktifkan — pengunjung langsung masuk chat sebagai *Tamu Demo* |
| 💬 Chat AI | Tanpa API key; balasan dari bank respons lokal (`frontend/src/lib/demo.js`) |
| 🕵️ Deteksi AI | Tanpa API key; skor probabilitas **acak** 0–100% |
| 🏷️ Label | Semua berlabel **DEMO** — badge di tiap balasan, kartu hasil deteksi, dan *banner* di atas chat |
| 💾 Riwayat | Tetap tersimpan lokal di browser |

## Menjalankan Lokal

Prasyarat: Node.js 20+.

```bash
git clone -b demo https://github.com/senshiner/AiChatBot.git
cd AiChatBot/frontend
npm install

# mode demo (direkomendasikan)
VITE_DEMO_MODE=true npm run dev     # buka http://localhost:5173

# atau build statis
VITE_DEMO_MODE=true npm run build   # output di frontend/dist
```

Tanpa flag `VITE_DEMO_MODE`, aplikasi berjalan dalam mode normal
(butuh Clerk + backend + API key).

## Kustomisasi Respons

Seluruh respons demo terpusat di **`frontend/src/lib/demo.js`** — tambah
atau ubah pola kata kunci di sana untuk menyesuaikan perilaku bot.
Abstraksi auth (`frontend/src/lib/auth.js`) memastikan jalur login normal
tidak tersentuh.

## Deploy ke Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fsenshiner%2FAiChatBot)

Repo ini siap *deploy* apa adanya:

1. Import repo → pilih **frontend** sebagai *single project*
   (*Root Directory* otomatis `frontend`).
2. **Settings → Environments → Production → Branch Tracking** → isi `demo`
   (UI Vercel terbaru; butuh minimal satu *deployment* dari branch `demo`
   terlebih dahulu — *push* apa pun ke branch `demo` memicunya).
3. *Redeploy* — output 100% statis.

Tidak butuh *environment variable*, backend, database, atau API key apa pun
di Vercel — `vercel.json` (di root maupun `frontend/`) otomatis *build*
dengan `VITE_DEMO_MODE=true`. Termasuk *SPA rewrite* agar *refresh* di rute
`/chat` tidak 404.

## Struktur Proyek

```
AiChatBot/
├── frontend/              # React + Vite + Tailwind (seluruh demo)
│   ├── src/lib/demo.js    # Bank respons & logika mode demo
│   ├── src/lib/auth.js    # Abstraksi auth (Clerk / mode demo)
│   └── vercel.json        # Konfig build demo
├── backend/               # Tidak dipakai dalam mode demo
└── vercel.json            # Konfig build demo (import dari root repo)
```

## Teknologi

React 19 · Vite · Tailwind CSS 4 · `react-markdown` · pdfjs

## Lisensi

MIT
