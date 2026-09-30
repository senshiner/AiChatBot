// Riwayat chat sementara — disimpan per browser (localStorage).
// Tidak memakai database backend; tiap browser punya riwayat sendiri.
const KEY = "sendar_chats_v1";
const MAX_CHATS = 100;

function readRaw() {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeRaw(chats) {
  try {
    localStorage.setItem(KEY, JSON.stringify(chats.slice(0, MAX_CHATS)));
  } catch {
    // localStorage penuh / tidak tersedia — abaikan diam-diam
  }
  window.dispatchEvent(new Event("sendar:history-changed"));
}

export const newChatId = () =>
  `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

/** Daftar chat, terbaru dulu. */
export function loadChats() {
  return readRaw().sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
}

/** Ambil satu chat lengkap by id. */
export function getChat(id) {
  return readRaw().find((c) => c.id === id) || null;
}

/**
 * Simpan/upsert satu chat.
 * chat: { id, title, messages, mode }
 */
export function saveChat(chat) {
  if (!chat || !chat.id) return;
  const chats = readRaw();
  const now = new Date().toISOString();
  const record = {
    id: chat.id,
    title: chat.title || "Untitled",
    messages: chat.messages || [],
    mode: chat.mode || "text",
    created_at: chat.created_at || now,
    updated_at: now,
  };
  const i = chats.findIndex((c) => c.id === chat.id);
  if (i >= 0) {
    record.created_at = chats[i].created_at || now;
    chats[i] = record;
  } else {
    chats.unshift(record);
  }
  writeRaw(chats);
}

/** Hapus satu chat. */
export function deleteChat(id) {
  writeRaw(readRaw().filter((c) => c.id !== id));
}
