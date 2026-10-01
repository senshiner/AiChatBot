// ============================================================================
// Mesin DEMO — tanpa API key, tanpa backend, tanpa login.
//
// Dipakai saat build dengan VITE_DEMO_MODE=true. Semua balasan diambil dari
// bank simpanan di bawah (kebiasaan / pertanyaan yang paling sering diajukan
// pengguna ke chatbot), dan deteksi AI hanya prediksi acak.
//
// ATURAN WAJIB: setiap output dari file ini HARUS diberi label demo di UI
// (badge DEMO) — jangan pernah menampilkannya seolah jawaban AI beneran.
//
// Cara menambah balasan baru: tambah entri ke REPLY_RULES
//   { id, match: [...kata/frasa...], replies: [...varian...] }
// - match berisi frasa (pakai spasi) → dicocokkan sebagai substring.
// - match berisi satu kata → dicocokkan sebagai kata utuh (bukan substring),
//   supaya "p" tidak kepancing oleh kata "apa".
// - replies boleh string biasa atau fungsi () => string (untuk jawaban dinamis
//   seperti jam/tanggal).
// Urutan REPLY_RULES = prioritas: yang spesifik taruh di atas yang umum.
// ============================================================================

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const norm = (s) =>
  (s || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s']/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const wordsOf = (text) => new Set(text.split(" ").filter(Boolean));

const jamSekarang = () => {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `Sekarang jam ${hh}.${mm} (waktu perangkatmu). Ini info beneran dari jam HP/laptopmu, bukan dari AI.`;
};

const hariTanggal = () => {
  const d = new Date();
  const hari = d.toLocaleDateString("id-ID", { weekday: "long" });
  const tgl = d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  return `Hari ini ${hari}, ${tgl}. Ini info beneran dari kalender perangkatmu, bukan dari AI.`;
};

const REPLY_RULES = [
  {
    id: "salam",
    match: [
      "halo", "hai", "hei", "hello", "hi", "pagi", "siang", "sore", "malam",
      "assalamualaikum", "permisi", "tes", "test", "ping",
      "selamat pagi", "selamat siang", "selamat sore", "selamat malam",
    ],
    replies: [
      "Halo juga! Aku SENDAR versi demo — nggak pakai API key sama sekali, semua jawabanku diambil dari bank balasan simpanan.",
      "Hai! Selamat datang di mode demo. Coba tanya kabar, tanya jam, atau kirim gambar di mode Deteksi AI.",
      "Hei, halo! Ini versi demo ya — jawabanku template, bukan dari AI beneran. Tapi UI-nya sama persis kayak versi aslinya.",
    ],
  },
  {
    id: "kabar",
    match: ["apa kabar", "gimana kabar", "bagaimana kabar", "kabar baik", "kabarnya gimana"],
    replies: [
      "Kabar baik! Maklum, aku cuma template demo jadi nggak pernah bad mood. Kamu sendiri gimana kabarnya?",
      "Baik-baik aja nih. Namanya juga balasan simpanan — selalu siap, nggak pernah capek. Kamu apa kabar?",
    ],
  },
  {
    id: "lagi-apa",
    match: ["lagi apa", "sedang apa", "lagi sibuk", "lagi ngapain"],
    replies: [
      "Lagi standby di mode demo nih, nungguin kamu kirim pesan. Nggak makan token, nggak butuh API key.",
      "Lagi nongkrong di browser kamu. Ringan banget — aku jalan 100% lokal, nggak nelpon server mana pun.",
    ],
  },
  {
    id: "nama",
    match: ["siapa kamu", "kamu siapa", "namamu siapa", "nama kamu", "namamu", "siapa namamu"],
    replies: [
      "Aku SENDAR — tapi ini versi demo. Jawabanku bukan dari AI, melainkan dari bank balasan yang disimpan di aplikasinya langsung.",
      "Namaku SENDAR (versi demo). Kalau versi aslinya aku jawab pakai LLM beneran; di sini aku cuma template biar bisa dicoba tanpa API key.",
    ],
  },
  {
    id: "pembuat",
    match: ["siapa yang buat", "siapa pembuat", "dibuat oleh", "pencipta", "yang bikin", "yang membuat", "developer"],
    replies: [
      "Aku dibuat oleh tim SENDAR. Versi demo ini disiapkan biar bisa dicoba tanpa login dan tanpa API key.",
      "Dibuat sama yang punya repo ini. Kalau mau lihat versi full-nya (pakai AI beneran), cek branch main di GitHub.",
    ],
  },
  {
    id: "bantuan",
    match: ["bisa apa", "bisa bantu", "fitur apa", "bantuan", "help", "cara pakai", "cara menggunakan", "panduan", "mulai"],
    replies: [
      "Di mode demo kamu bisa:\n- Kirim pesan — aku jawab dari bank balasan simpanan\n- Coba mode Deteksi AI (ikon di header) — prediksinya acak, khusus demo\n- Ganti tema gelap/terang\n- Semua riwayat chat tersimpan lokal di browser",
      "Yang bisa dicoba di demo ini: chatting (jawaban template), deteksi AI gambar (hasil ngasal, ada label demo), lampiran gambar, dan riwayat chat lokal. Versi aslinya pakai LLM beneran.",
    ],
  },
  {
    id: "jam",
    match: ["jam berapa", "sekarang jam", "pukul berapa"],
    replies: [jamSekarang],
  },
  {
    id: "cuaca",
    match: ["cuaca", "hujan", "mendung", "panas banget"],
    replies: [
      "Waduh, mode demo nggak bisa cek cuaca beneran — aku nggak punya akses internet/API. Coba intip ke luar jendela aja.",
      "Nggak tahu nih, aku kan cuma template offline. Kalau versi asli mungkin bisa dibantu tool cuaca.",
    ],
  },
  {
    id: "tanggal",
    match: ["hari apa", "tanggal berapa", "hari ini", "tanggal hari ini"],
    replies: [hariTanggal],
  },
  {
    id: "terima-kasih",
    match: ["terima kasih", "makasih", "thanks", "thank you", "nuhun", "hatur nuhun"],
    replies: [
      "Sama-sama! Senang bisa nemenin nyoba demonya.",
      "Sami-sami! Jangan lupa, ini cuma demo — versi aslinya jauh lebih pinter.",
    ],
  },
  {
    id: "perpisahan",
    match: ["dadah", "bye", "sampai jumpa", "selamat tinggal", "daag", "dada"],
    replies: [
      "Dadah! Makasih udah nyobain demo SENDAR.",
      "Sampai jumpa! Kalau mau versi AI beneran, deploy branch main ya.",
    ],
  },
];

// Balasan cadangan kalau tidak ada aturan yang cocok.
const FALLBACKS = [
  "Hmm, untuk pertanyaan itu aku nggak punya template jawabannya — maklum, mode demo cuma bawa bank balasan simpanan. Coba tanya yang umum kayak salam, kabar, atau jam berapa.",
  "Itu di luar bank balasanku. Di mode demo aku cuma bisa jawab pola-pola umum (sapaan, tanya kabar, terima kasih, dll). Versi aslinya tentu bisa jawab beneran.",
  "Aku nggak ngerti itu — wajar, aku kan bukan AI beneran di sini, cuma template demo. Coba kirim 'bisa apa' buat lihat yang aku bisa.",
  "Belum ada template untuk itu di bank simpananku. Coba tanya hal simpel kayak 'halo', 'kamu siapa', atau 'jam berapa'.",
  "Oke, jujur aja: aku nggak tahu. Mode demo = jawaban template doang. Tapi lumayan kan buat lihat UI-nya?",
];

// ---------------------------------------------------------------------------
// Balasan utama: cocokkan prompt ke bank simpanan.
// Selalu kembalikan { text, demo: true } — UI wajib render badge DEMO.
// ---------------------------------------------------------------------------
export function getDemoReply(prompt) {
  const text = norm(prompt);
  const words = wordsOf(text);

  for (const rule of REPLY_RULES) {
    const hit = rule.match.some((kw) =>
      kw.includes(" ") ? text.includes(kw) : words.has(kw)
    );
    if (hit) {
      const raw = pick(rule.replies);
      return { text: typeof raw === "function" ? raw() : raw, demo: true, rule: rule.id };
    }
  }
  return { text: pick(FALLBACKS), demo: true, rule: "fallback" };
}

// ---------------------------------------------------------------------------
// Deteksi AI versi demo: prediksi NGASAL 0–100.
// Distribusi dibuat mirip hasil detektor beneran (cenderung ke ekstrem).
// Selalu kembalikan { score, demo: true } — UI wajib render badge DEMO.
// ---------------------------------------------------------------------------
export function getDemoDetection() {
  const r = Math.random();
  let score;
  if (r < 0.35) {
    score = 65 + Math.floor(Math.random() * 34); // 65–98: "kemungkinan AI"
  } else if (r < 0.7) {
    score = Math.floor(Math.random() * 35); // 0–34: "kemungkinan asli"
  } else {
    score = 35 + Math.floor(Math.random() * 30); // 35–64: "meragukan"
  }
  return { score, demo: true };
}
