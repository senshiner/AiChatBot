import Aside from "../components/Aside";
import { SignIn, useUser, useAuth } from "@clerk/clerk-react";
import { ImageIcon, Plus, Send, Sparkles, Type } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast, Toaster } from "react-hot-toast";

// Use project's API URL env variable. frontend/.env defines VITE_API_URL
axios.defaults.baseURL = import.meta.env.VITE_API_URL;

const Chat = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [freeUsage, setFreeUsage] = useState(0);
  const [plan, setPlan] = useState("free");

  const [formData, setFormData] = useState({ prompt: "", mode: "text" });
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Halo, Aku bisa membantumu dengan Pesan atau Gambar",
      mode: "text",
    },
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleChatSelection = (item) => {
    setMessages([
      { role: "user", content: item.content, mode: item.mode },
      {
        role: "assistant",
        content: item.result || "no response found",
        mode: item.mode,
      },
    ]);
  };

  const startNewChat = () => {
    setMessages([
      {
        role: "assistant",
        content: "Halo, Aku bisa membantumu dengan Pesan atau Gambar",
        mode: "text",
      },
    ]);
    setFormData({ prompt: "", mode: "text" });
    inputRef.current?.focus();
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
      const { data } = await axios.post(
        "/api/ai/generate",
        {
          prompt: currentPrompt,
          mode: currentMode,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (data.success) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.result, mode: currentMode },
        ]);
        if (data.plan !== "premium") {
          setFreeUsage(data.free_usage);
          setPlan(data.plan);
          const remaining = 10 - data.free_usage;
          if (remaining <= 0) {
            toast.error(" kamu telah melewati limit! upgrate ke premium", {
              duration: 6000,
            });
          } else if (remaining <= 2) {
            toast(
              `only ${remaining} free usage ${remaining === 1 ? "" : "s"} left`,
              {
                duration: 5000,
                style: {
                  background: "#18181b",
                  color: "#facc15",
                  border: "1px solid #ca8a04",
                },
              },
            );
          }
        } else {
          setPlan("premium");
        }
      } else {
        if (data.limit_reached) {
          toast.error("kamu telah menggunakan 10 pesan ", { duration: 6000 });
        } else {
          const msg =
            data.message?.includes("429") ||
            data.message?.includes("status code")
              ? "server AI sedang sibuk tolong coba lagi nanti"
              : data.message || "AI gagal response";
          toast.error(msg);
        }
      }
    } catch (error) {
      console.error("submission error :", error);
      toast.error(error?.response?.data?.message || "connection error");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "maaf, ada yang salah tolong cek internet anda",
          mode: "text",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const remaining = 10 - freeUsage;
  const isLimitReached = plan !== "premium" && remaining <= 0;

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-zinc-950">
        <SignIn />
      </div>
    );
  }

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
        <Aside onSelectedChat={handleChatSelection} />

        <main className="flex flex-col flex-1 min-w-0 relative">
          {/* top Bar */}
          <section className="flex items-center justify-between  px-6 py-3  border-b border-slate-200 dark:border-zinc-800  bg-white dark:bg-zinc-950">
            <div className="flex items-center gap-2">
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
                {plan === "premium" && (
                  <span className="text-[10px]  bg-indigo-900/50 text-indigo-400  border border-indigo-500/30 px-2 py-0.5 rounded-full font-medium">
                    Premium
                  </span>
                )}
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
              {messages.map((message, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  {/* avatar */}
                  {message.role === "user" ? (
                    <img
                      src={user.imageUrl}
                      alt="image"
                      className="w-8 h-8  rounded-full  border border-slate-300 dark:border-zinc-700 shrink-0 object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center ">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 55 86"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="m11.896 85.203 4.879-28.693 24.182-24.286 11.895 11.843zM43.104 0l-4.879 28.693-24.182 24.286L2.148 41.136z"
                          fill="currentColor"
                        />
                      </svg>
                    </div>
                  )}

                  {/* content */}
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${message.role === "user" ? "bg-indigo-600 text-white rounded-tr-sm" : "bg-slate-200 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 rounded-tl-sm border border-slate-300 dark:border-zinc-700"}`}
                  >
                    {message.mode === "image" &&
                    message.role === "assistant" ? (
                      <img
                        src={message.content}
                        className="rounded-xl max-w-full h-auto"
                        alt=""
                      />
                    ) : message.role === "assistant" ? (
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
                          code: ({ inline, children }) =>
                            inline ? (
                              <code className="bg-slate-100 dark:bg-zinc-900 text-indigo-300 px-1 py-0.5 rounded text-xs font-mono">
                                {children}
                              </code>
                            ) : (
                              <code className="block bg-slate-100 dark:bg-zinc-900 text-indigo-300 p-3 rounded-lg text-xs font-mono overflow-x-auto my-2 border border-slate-300 dark:border-zinc-700">
                                {children}
                              </code>
                            ),
                          pre: ({ children }) => (
                            <pre className="my-2">{children}</pre>
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
                    ) : (
                      <p className="whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {/* loading dots */}
              {isLoading && (
                <div className="flex gap-3 items-center">
                  <div className="w-8 h-8 flex items-center justify-center rounded-lg shrink-0 bg-indigo-600">
                    <Sparkles
                      size={14}
                      className="text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="bg-slate-200 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    ></span>
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    ></span>
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    ></span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* input area */}
          <div className="absolute bottom-0  left-0 right-0  px-4 pb-5 pt-3 bg-linear-to-t from-white dark:from-zinc-950 via-white/50 dark:via-zinc-950/50  to-transparent ">
            <div className="max-w-2xl  mx-auto space-y-2">
              {/* free usage bar */}
              {plan !== "premium" && freeUsage > 0 && (
                <div className="flex items-center gap-3 px-1">
                  <span className="text-[10px]  text-slate-500 dark:text-zinc-500  font-medium whitespace-nowrap">
                    {freeUsage}/ 10 free usage{" "}
                  </span>
                  <div className="flex-1 h-1 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${remaining <= 1 ? "bg-red-500" : remaining <= 3 ? "bg-yellow-500" : "bg-indigo-500"}`}
                      style={{ width: `${(freeUsage / 10) * 100}%` }}
                    />
                  </div>
                  {remaining <= 2 && (
                    <span
                      className={`text-[10px] whitespace-nowrap font-medium ${remaining <= 0 ? "text-red-400" : "text-yellow-400 "}`}
                    >
                      {remaining <= 0
                        ? "upgrade to continue"
                        : `${remaining} left `}
                    </span>
                  )}
                </div>
              )}

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

                {/* input row */}
                <form
                  onSubmit={handleSubmit}
                  action=""
                  className="flex items-end gap-2 px-3 py-2.5"
                >
                  <textarea
                    ref={inputRef}
                    value={formData.prompt}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading || isLimitReached}
                    placeholder={
                      isLimitReached
                        ? "upgrade to premium to continue"
                        : formData.mode === "image"
                          ? "describe image you want"
                          : "ask me anyting"
                    }
                    rows={1}
                    className="flex-1 bg-transparent text-sm text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-600 outline-none disabled:opacity-40 disabled:cursor-not-allowed resize-none overflow-y-auto py-1.5 max-h-[150px]"
                  />
                  <button
                    disabled={
                      isLoading || !formData.prompt.trim() || isLimitReached
                    }
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
