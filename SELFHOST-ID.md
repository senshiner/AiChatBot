# Self-host AiChatBot (panduan singkat)

Jalankan backend + frontend di mesin sendiri supaya bebas atur provider AI
(Groq, Gemini, OpenRouter, atau API lain) — tanpa batasan runtime artifact.

## 1. Prasyarat

- Node.js 18+
- Git

## 2. Clone & install

```bash
git clone https://github.com/senshiner/AiChatBot.git
cd AiChatBot
git checkout demo
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

## 3. Isi API key

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Edit `backend/.env`:

| Variabel | Wajib | Keterangan |
|---|---|---|
| `CLERK_SECRET_KEY` | ya | Dashboard Clerk → API Keys (`sk_...`) |
| `CLERK_PUBLISHABLE_KEY` | ya | Sama, yang `pk_...` |
| `GROQ_API_KEY` | salah satu | https://console.groq.com (gratis) |
| `GEMINI_API_KEY` | salah satu | https://aistudio.google.com/apikey (gratis). Catatan: `gemini-2.5-flash` sudah pensiun untuk user baru — default repo memakai `gemini-3-flash-preview` yang terverifikasi jalan |
| `OPENROUTER_API_KEY` | salah satu | https://openrouter.ai/keys — pakai model `:free`, mis. `openai/gpt-oss-120b:free` |
| `CLIENT_URL` | ya | URL frontend, mis. `http://localhost:5173` |

Provider yang key-nya kosong otomatis **nonaktif**. Minimal satu provider aktif.

Edit `frontend/.env`:

```
VITE_API_URL=http://localhost:3000
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

### Nambah API AI lain (tanpa utak-atik kode)

Pakai slot `CUSTOM_1`–`CUSTOM_9` di `backend/.env` — cukup nama + base URL + key:

```bash
CUSTOM_1_NAME=xai
CUSTOM_1_BASE_URL=https://api.x.ai/v1
CUSTOM_1_API_KEY=isi-key-xai
CUSTOM_1_MODEL=grok-4-1-fast-non-reasoning
```

Semua API yang kompatibel OpenAI (`/v1/chat/completions`) bisa masuk sini:
Ollama lokal (`http://localhost:11434/v1`), DeepSeek, Mistral, dsb.

## 4. Cara kerja provider (sudah bawaan)

- **Round-robin**: provider lain (Groq, Gemini, OpenRouter, custom…) dipakai **bergantian** tiap request — kuota gratis terbagi rata, tidak ada satu provider yang kebakar duluan.
- **Failover otomatis**: provider yang gagal 3x berturut-turut diistirahatkan 5 menit, request dialihkan ke yang sehat.
- Cek status: `GET /api/ai/providers` (tanpa key, aman).

## 5. Jalankan

```bash
# Terminal 1 — backend
cd backend && node server.js        # atau: npm run server (auto-reload)

# Terminal 2 — frontend
cd frontend && npm run dev
```

Buka `http://localhost:5173`, login via Clerk, ngobrol.

## 6. Jalan terus (Linux, systemd user service)

```bash
mkdir -p ~/.config/systemd/user
```

`~/.config/systemd/user/aichatbot-backend.service`:

```ini
[Unit]
Description=AiChatBot backend
After=network-online.target

[Service]
WorkingDirectory=/home/USER/AiChatBot/backend
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=5

[Install]
WantedBy=default.target
```

```bash
systemctl --user daemon-reload
systemctl --user enable --now aichatbot-backend
loginctl enable-linger $USER   # tetap jalan setelah logout
```

Untuk frontend production: `cd frontend && npm run build`, lalu sajikan folder
`dist/` via nginx/caddy, atau biarkan `npm run dev` untuk pemakaian pribadi.

## 7. Diakses dari luar (opsional)

```bash
cloudflared tunnel --url http://localhost:5173
```

Daftarkan URL publiknya ke Clerk (Allowed Origins) dan ke `CLIENT_URL` di
`backend/.env`.
