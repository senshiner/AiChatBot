import Aside from "../components/Aside";
import { SignIn, useUser, useAuth } from "@clerk/clerk-react";
import {
  Check,
  Copy,
  Eye,
  Code2,
  ImageIcon,
  Menu,
  Mic,
  Plus,
  Send,
  Type,
  Eraser,
  ClipboardCopy,
} from "lucide-react";
import { Children, isValidElement, useEffect, useRef, useState } from "react";
import api from "../lib/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast, Toaster } from "react-hot-toast";
import { newChatId, saveChat, getChat } from "../lib/chatHistory";

// ---------------------------------------------------------------------------
// Sapaan awal pakai nama akun.
// ---------------------------------------------------------------------------
const greetingFor = (name) => ({
  role: "assistant",
  isGreeting: true,
  content: name ? `Hai ${name}, ada yang bisa dibantu hari ini?` : "Hai, ada yang bisa dibantu hari ini?",
  mode: "text",
});

// ---------------------------------------------------------------------------
// Estimasi token sederhana (±4 karakter per token, cukup untuk indikator UI).
// ---------------------------------------------------------------------------
const estimateTokens = (text) => (text ? Math.max(1, Math.ceil(text.length / 4)) : 0);
const countWords = (text) => (text.trim() ? text.trim().split(/\s+/).length : 0);

// ---------------------------------------------------------------------------
// Pewarna sintaks ringan (tanpa dependensi): komentar, string, angka, keyword.
// ---------------------------------------------------------------------------
const TOKEN_RE =
  /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|#[^\n]*)|("""[\s\S]*?"""|'''[\s\S]*?'''|"([^"\\\n]|\\.)*"|'([^'\\\n]|\\.)*'|`([^`\\]|\\.)*`)|\b(\d[\d._]*)\b|\b(const|let|var|function|return|if|else|for|while|do|class|extends|import|from|export|default|new|try|catch|finally|throw|async|await|switch|case|break|continue|typeof|instanceof|in|of|this|super|static|yield|def|elif|with|as|pass|lambda|None|True|False|not|and|or|is|print|len|range|self|fn|struct|enum|impl|pub|use|match|mut|echo|foreach|endforeach|endif|endfor)\b/g;

const TOKEN_CLASS = {
  comment: "text-slate-500 dark:text-zinc-500 italic",
  string: "text-amber-700 dark:text-amber-300",
  number: "text-orange-700 dark:text-orange-300",
  keyword: "text-indigo-700 dark:text-indigo-300",
};

function highlight(code) {
  const out = [];
  let last = 0;
  let m;
  let key = 0;
  TOKEN_RE.lastIndex = 0;
  while ((m = TOKEN_RE.exec(code))) {
    if (m[0].length === 0) {
      TOKEN_RE.lastIndex++;
      continue;
    }
    if (m.index > last) out.push({ text: code.slice(last, m.index), type: "plain", key: key++ });
    const type = m[1] ? "comment" : m[2] ? "string" : m[6] ? "number" : "keyword";
    out.push({ text: m[0], type, key: key++ });
    last = m.index + m[0].length;
  }
  if (last < code.length) out.push({ text: code.slice(last), type: "plain", key: key++ });
  return out;
}

const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
};

// ---------------------------------------------------------------------------
// Blok kode ala editor: header (label bahasa + tombol salin), pewarna sintaks,
// dan tab Preview/Kode untuk HTML/SVG/XML.
// ---------------------------------------------------------------------------
const PREVIEWABLE = ["html", "xml", "svg"];

function CodeBlock({ language, code }) {
  const [tab, setTab] = useState("code");
  const [copied, setCopied] = useState(false);
  const lang = (language || "").toLowerCase();
  const canPreview = PREVIEWABLE.includes(lang);

  const handleCopy = async () => {
    const ok = await copyText(code);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } else {
      toast.error("Gagal menyalin kode");
    }
  };

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-slate-300 dark:border-zinc-700">
      <div className="flex items-center justify-between bg-slate-200 dark:bg-zinc-900 px-3 py-1.5">
        <div className="flex items-center gap-2">
          <Code2 size={13} className="text-slate-500 dark:text-zinc-500" />
          <span className="text-[11px] font-mono text-slate-600 dark:text-zinc-400">
            {lang || "code"}
          </span>
          {canPreview && (
            <div className="flex ml-2 rounded-lg overflow-hidden border border-slate-300 dark:border-zinc-700">
              <button
                onClick={() => setTab("preview")}
                className={`flex items-center gap-1 px-2 py-0.5 text-[11px] ${tab === "preview" ? "bg-indigo-600 text-white" : "text-slate-600 dark:text-zinc-400 hover:bg-slate-300 dark:hover:bg-zinc-800"}`}
              >
                <Eye size={11} /> Preview
              </button>
              <button
                onClick={() => setTab("code")}
                className={`flex items-center gap-1 px-2 py-0.5 text-[11px] ${tab === "code" ? "bg-indigo-600 text-white" : "text-slate-600 dark:text-zinc-400 hover:bg-slate-300 dark:hover:bg-zinc-800"}`}
              >
                <Code2 size={11} /> Kode
              </button>
            </div>
          )}
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] text-slate-600 dark:text-zinc-400 hover:bg-slate-300 dark:hover:bg-zinc-800 transition-colors"
        >
          {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
          {copied ? "Tersalin" : "Salin"}
        </button>
      </div>
      {canPreview && tab === "preview" ? (
        <iframe
          title="preview"
          sandbox="allow-scripts"
          srcDoc={code}
          className="w-full h-64 bg-white"
        />
      ) : (
        <pre className="bg-slate-50 dark:bg-zinc-950 p-3 overflow-x-auto text-xs font-mono leading-relaxed">
          <code>
            {highlight(code).map((t) => (
              <span key={t.key} className={TOKEN_CLASS[t.type] || ""}>
                {t.text}
              </span>
            ))}
          </code>
        </pre>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Logo Sendar (mark geometris) + pill nama model + indikator typing
// ala referensi: logo | SENDAR | [model] lalu bubble "Memproses respon...".
// ---------------------------------------------------------------------------
const SendarMark = ({ size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 55 86"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="m11.896 85.203 4.879-28.693 24.182-24.286 11.895 11.843zM43.104 0l-4.879 28.693-24.182 24.286L2.148 41.136z"
      fill="currentColor"
    />
  </svg>
);

const AiHeader = ({ model }) => (
  <div className="flex items-center gap-2">
    <div className="w-7 h-7 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
      <SendarMark size={14} />
    </div>
    <span className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">
      SENDAR
    </span>
    {model && (
      <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-300 whitespace-nowrap overflow-hidden text-ellipsis max-w-[220px]">
        {model}
      </span>
    )}
  </div>
);

const TypingIndicator = ({ model }) => (
  <div className="flex flex-col gap-2">
    <AiHeader model={model} />
    <div className="max-w-[85%] w-fit rounded-2xl px-4 py-3 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 flex items-center gap-2.5">
      <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse shrink-0" />
      <span className="text-sm text-sky-600 dark:text-sky-300">
        ⚡ Memproses respon...
      </span>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Halaman Chat
// ---------------------------------------------------------------------------
const Chat = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recRef = useRef(null);
  const menuRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [listening, setListening] = useState(false);
  // Model yang sedang dipakai untuk request berjalan (indikator typing).
  const [pendingModel, setPendingModel] = useState(null);

  const [formData, setFormData] = useState({ prompt: "", mode: "text" });
  // Nama akun untuk sapaan (fullName, fallback firstName).
  const displayName = user?.fullName?.trim() || user?.firstName?.trim() || "";
  const [messages, setMessages] = useState(() => [greetingFor(displayName)]);
  const [currentChatId, setCurrentChatId] = useState(() => newChatId());

  // Clerk memuat user secara async — perbarui sapaan saat nama tersedia
  // (hanya jika chat masih berisi sapaan awal).
  useEffect(() => {
    if (!displayName) return;
    setMessages((msgs) =>
      msgs.length === 1 && msgs[0]?.isGreeting ? [greetingFor(displayName)] : msgs
    );
  }, [displayName]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Tutup menu "+" saat klik di luar.
  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const SpeechRecognition =
    typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);

  const handleChatSelection = (item) => {
    const chat = getChat(item.id);
    if (chat) {
      setCurrentChatId(chat.id);
      setMessages(
        chat.messages && chat.messages.length > 0 ? chat.messages : [greetingFor(displayName)]
      );
    }
  };

  // Simpan chat aktif ke localStorage (riwayat sementara per browser).
  const persistCurrentChat = (msgs, mode) => {
    const firstUser = msgs.find((m) => m.role === "user");
    if (!firstUser) return; // jangan simpan chat kosong (cuma sapaan)
    saveChat({
      id: currentChatId,
      title: firstUser.content.slice(0, 60),
      messages: msgs,
      mode,
    });
  };

  const startNewChat = () => {
    setCurrentChatId(newChatId());
    setMessages([greetingFor(displayName)]);
    setFormData({ prompt: "", mode: "text" });
    setMenuOpen(false);
    inputRef.current?.focus();
  };

  const copyConversation = async () => {
    const text = messages
      .map((m) => `${m.role === "user" ? "Kamu" : "Sendar"}: ${m.content}`)
      .join("\n\n");
    const ok = await copyText(text);
    toast[ok ? "success" : "error"](ok ? "Percakapan disalin" : "Gagal menyalin");
    setMenuOpen(false);
  };

  const toggleMode = (mode) => setFormData({ ...formData, mode });
  const handleChange = (e) => {
    setFormData({ ...formData, prompt: e.target.value });
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 150) + "px";
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const toggleMic = () => {
    if (!SpeechRecognition) {
      toast.error("Browser tidak mendukung voice input");
      return;
    }
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const rec = new SpeechRecognition();
    rec.lang = "id-ID";
    rec.interimResults = false;
    rec.onresult = (e) => {
      const text = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join(" ");
      setFormData((f) => ({ ...f, prompt: (f.prompt ? f.prompt + " " : "") + text }));
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => {
      setListening(false);
      toast.error("Gagal mengenali suara");
    };
    recRef.current = rec;
    rec.start();
    setListening(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.prompt.trim() || isLoading) return;

    const currentPrompt = formData.prompt;
    const currentMode = formData.mode;

    setMessages((prev) => [
      ...prev,
      { role: "user", content: currentPrompt, mode: currentMode },
    ]);
    setFormData({ ...formData, prompt: "" });
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
    setIsLoading(true);

    try {
      const token = await getToken({ skipCache: true });
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      // Cari tahu model yang akan melayani request ini (untuk indikator typing).
      try {
        const { data: preview } = await api.get("/api/ai/provider-preview", {
          headers,
        });
        if (preview.success) {
          setPendingModel({
            provider: preview.provider,
            model: preview.model,
          });
        }
      } catch {
        // Abaikan — request utama tetap jalan walau preview gagal.
      }

      const { data } = await api.post(
        "/api/ai/generate",
        {
          prompt: currentPrompt,
          mode: currentMode,
        },
        { headers }
      );

      if (data.success) {
        setMessages((prev) => {
          const next = [
            ...prev,
            {
              role: "assistant",
              content: data.result,
              mode: currentMode,
              provider: data.provider,
              model: data.model,
            },
          ];
          persistCurrentChat(next, currentMode);
          return next;
        });
      } else {
        const msg =
          data.message?.includes("429") || data.message?.includes("status code")
            ? "server AI sedang sibuk, tolong coba lagi nanti"
            : data.message || "AI gagal merespons";
        toast.error(msg);
      }
    } catch (error) {
      console.error("submission error :", error);
      toast.error(error?.response?.data?.message || "connection error");
      setMessages((prev) => {
        const next = [
          ...prev,
          {
            role: "assistant",
            content: "maaf, ada yang salah tolong cek internet anda",
            mode: "text",
          },
        ];
        persistCurrentChat(next, "text");
        return next;
      });
    } finally {
      setIsLoading(false);
      setPendingModel(null);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-zinc-950">
        <SignIn />
      </div>
    );
  }

  const chars = formData.prompt.length;
  const words = countWords(formData.prompt);
  const tokens = estimateTokens(formData.prompt);
  const hemat = tokens > 0 && tokens <= 150;

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#18181b",
            color: "#e4e4e7",
            border: "1px solid #3f3f46",
          },
        }}
      />
      <div
        className="flex h-screen  bg-white dark:bg-zinc-950   text-slate-800 dark:text-zinc-200 overflow-hidden"
        style={{ fontFamily: "'DM sans', sans-serif " }}
      >
        {/* side bar */}
        <Aside
          onSelectedChat={handleChatSelection}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onNewChat={startNewChat}
        />

        <main className="flex flex-col flex-1 min-w-0 relative">
          {/* top Bar */}
          <section className="flex items-center justify-between  px-4 md:px-6 py-3  border-b border-slate-200 dark:border-zinc-800  bg-white dark:bg-zinc-950">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 -ml-2 rounded-lg text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900"
                aria-label="Buka riwayat"
              >
                <Menu size={18} />
              </button>
              <div className="flex items-center gap-2">
                <svg
                  width="120"
                  height="32"
                  viewBox="0 0 319 86"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-auto"
                >
                  <path
                    d="m11.896 85.203 4.879-28.693 24.182-24.286 11.895 11.843zM43.104 0l-4.879 28.693-24.182 24.286L2.148 41.136z"
                    fill="currentColor"
                  />
                  <text
                    x="74"
                    y="58"
                    fontFamily="Poppins, Arial, sans-serif"
                    fontSize="52"
                    fontWeight="700"
                    fill="currentColor"
                    letterSpacing="1"
                  >
                    SENDAR
                  </text>
                </svg>
              </div>
            </div>

            <button
              onClick={startNewChat}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-900 text-xs font-medium transition-colors"
            >
              <Plus size={13} /> New Chat
            </button>
          </section>

          {/* message */}
          <div className="flex-1  overflow-y-auto  px-4 py-6 ">
            <div className="max-w-2xl mx-auto space-y-6 pb-40">
              {messages.map((message, i) =>
                message.role === "user" ? (
                  <div key={i} className="flex justify-end">
                    {/* content */}
                    <div className="max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed bg-indigo-600 text-white rounded-br-sm whitespace-pre-wrap break-words">
                      {message.content}
                    </div>
                  </div>
                ) : (
                  <div key={i} className="flex flex-col gap-2">
                    {/* header: logo + SENDAR + pill model */}
                    <AiHeader model={message.model} />

                    {/* content */}
                    <div className="max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed bg-slate-200 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 rounded-tl-sm border border-slate-300 dark:border-zinc-700">
                      {message.mode === "image" ? (
                        <img
                          src={message.content}
                          className="rounded-xl max-w-full h-auto"
                          alt=""
                        />
                      ) : (
                        <div className="chat-md">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              h1: ({ children }) => (
                                <h1 className="text-base font-bold text-slate-900 dark:text-white mt-3 mb-1">
                                  {children}
                                </h1>
                              ),
                            h2: ({ children }) => (
                              <h2 className="text-sm font-bold text-slate-900 dark:text-white mt-2 mb-1">
                                {children}
                              </h2>
                            ),
                            h3: ({ children }) => (
                              <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100 mt-2 mb-1">
                                {children}
                              </h3>
                            ),
                            p: ({ children }) => (
                              <p className="mb-2 last:mb-0">{children}</p>
                            ),
                            ul: ({ children }) => (
                              <ul className="list-disc list-inside mb-2 space-y-0.5">
                                {children}
                              </ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="list-decimal list-inside mb-2 space-y-0.5">
                                {children}
                              </ol>
                            ),
                            li: ({ children }) => (
                              <li className="text-slate-700 dark:text-zinc-300">
                                {children}
                              </li>
                            ),
                            strong: ({ children }) => (
                              <strong className="font-semibold text-slate-900 dark:text-white">
                                {children}
                              </strong>
                            ),
                            em: ({ children }) => (
                              <em className="italic text-slate-600 dark:text-zinc-400">
                                {children}
                              </em>
                            ),
                            pre: (props) => {
                              const child = Children.toArray(props.children)[0];
                              if (isValidElement(child) && child.type === "code") {
                                const className = child.props.className || "";
                                const lang = (/language-([\w-]+)/.exec(className) || [])[1] || "";
                                const codeText = Children.toArray(child.props.children)
                                  .join("")
                                  .replace(/\n$/, "");
                                return <CodeBlock language={lang} code={codeText} />;
                              }
                              return <pre {...props} />;
                            },
                            table: ({ children }) => (
                              <div className="overflow-x-auto my-3 rounded-lg border border-slate-300 dark:border-zinc-700">
                                <table className="w-full text-xs border-collapse">
                                  {children}
                                </table>
                              </div>
                            ),
                            thead: ({ children }) => (
                              <thead className="bg-slate-100 dark:bg-zinc-900">{children}</thead>
                            ),
                            th: ({ children }) => (
                              <th className="px-3 py-2 text-left font-semibold text-slate-900 dark:text-zinc-100 border-b border-slate-300 dark:border-zinc-700 whitespace-nowrap">
                                {children}
                              </th>
                            ),
                            td: ({ children }) => (
                              <td className="px-3 py-2 border-b border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300">
                                {children}
                              </td>
                            ),
                            blockquote: ({ children }) => (
                              <blockquote className="border-l-2 border-indigo-500 pl-3  text-slate-600 dark:text-zinc-400 italic my-2">
                                {children}{" "}
                              </blockquote>
                            ),
                            a: ({ href, children }) => (
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-400 hover:underline"
                              >
                                {children}{" "}
                              </a>
                            ),
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* indikator typing ala referensi */}
              {isLoading && <TypingIndicator model={pendingModel?.model} />}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* input area */}
          <div className="absolute bottom-0  left-0 right-0  px-4 pb-5 pt-3 bg-linear-to-t from-white dark:from-zinc-950 via-white/50 dark:via-zinc-950/50  to-transparent ">
            <div className="max-w-2xl  mx-auto space-y-2">
              {/* input box */}
              <div className="bg-slate-100 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-2xl overflow-hidden focus-within:border-indigo-500 transition-colors">
                {/* mode input */}
                <div className="flex gap-1 px-3 py-2.5">
                  <button
                    onClick={() => toggleMode("text")}
                    type="button"
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg  text-xs font-medium transition-colors ${formData.mode === "text" ? "bg-indigo-500 text-white" : "text-slate-500 dark:text-zinc-500 hover:text-zinc-300"} `}
                  >
                    <Type size={14} />
                    Text
                  </button>
                  <button
                    onClick={() => toggleMode("image")}
                    type="button"
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg  text-xs font-medium transition-colors ${formData.mode === "image" ? "bg-indigo-500 text-white" : "text-slate-500 dark:text-zinc-500 hover:text-zinc-300"} `}
                  >
                    <ImageIcon size={14} /> Image
                  </button>
                </div>

                {/* statistik prompt */}
                {formData.prompt && (
                  <div className="flex items-center gap-2 px-3 pb-1 text-[10px] text-slate-500 dark:text-zinc-500">
                    <span title="Estimasi token">~{tokens} token</span>
                    <span aria-hidden>·</span>
                    <span>{chars} karakter</span>
                    <span aria-hidden>·</span>
                    <span>{words} kata</span>
                    {hemat && (
                      <span className="ml-1 px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 font-semibold">
                        Prompt Hemat
                      </span>
                    )}
                  </div>
                )}

                {/* input row */}
                <form
                  onSubmit={handleSubmit}
                  action=""
                  className="flex items-end gap-2 px-3 py-2.5"
                >
                  {/* menu + */}
                  <div ref={menuRef} className="relative shrink-0">
                    <button
                      type="button"
                      onClick={() => setMenuOpen((v) => !v)}
                      className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-500 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors"
                      aria-label="Menu"
                    >
                      <Plus size={16} />
                    </button>
                    {menuOpen && (
                      <div className="absolute bottom-10 left-0 w-44 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg py-1 z-20">
                        <button
                          type="button"
                          onClick={startNewChat}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
                        >
                          <Eraser size={13} /> Chat baru
                        </button>
                        <button
                          type="button"
                          onClick={copyConversation}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
                        >
                          <ClipboardCopy size={13} /> Salin percakapan
                        </button>
                      </div>
                    )}
                  </div>

                  <textarea
                    ref={inputRef}
                    value={formData.prompt}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                    placeholder={
                      formData.mode === "image"
                        ? "describe image you want"
                        : "ask me anything"
                    }
                    rows={1}
                    className="flex-1 bg-transparent text-sm text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-600 outline-none disabled:opacity-40 disabled:cursor-not-allowed resize-none overflow-y-auto py-1.5 max-h-[150px]"
                  />

                  {SpeechRecognition && (
                    <button
                      type="button"
                      onClick={toggleMic}
                      title="Voice input (Bahasa Indonesia)"
                      className={`w-8 h-8 flex items-center justify-center rounded-xl transition-colors shrink-0 ${listening ? "bg-red-500 text-white animate-pulse" : "text-slate-500 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800"}`}
                    >
                      <Mic size={16} />
                    </button>
                  )}

                  <button
                    disabled={isLoading || !formData.prompt.trim()}
                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-30  disabled:cursor-not-allowed shrink-0"
                  >
                    <Send size={14} />
                  </button>
                </form>
              </div>

              <p className="text-center  text-[10px]  text-slate-400 dark:text-zinc-600">
                AI bisa membuat kesalahan. tolong cek info kembali
              </p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default Chat;
