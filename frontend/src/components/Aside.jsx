import { ImageIcon, Loader2, LogOut, MessageSquare, Plus } from "lucide-react";
import { useClerk, useUser, useAuth } from "@clerk/clerk-react";
import ThemeToggle from "./ThemeToggle";
import api from "../lib/api";
import { useEffect, useState } from "react";

const Aside = ({ onSelectedChat }) => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { signOut } = useClerk();
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchHistory = async () => {
      try {
        const token = await getToken();
        const { data } = await api.get("/api/chat/history", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (isMounted && data.success) setHistory(data.messages);
      } catch (error) {
        console.error("Failed to fetch history", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchHistory();

    return () => {
      isMounted = false;
    };
  }, [getToken]);

  const formatLabel = (content) => {
    if (!content) return "Untitled";
    return content.length > 32 ? content.slice(0, 32) + "..." : content;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";

    const days = Math.max(0, Math.floor((new Date().getTime() - date.getTime()) / 86400000));

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <aside className="w-64 border-r border-slate-200 bg-slate-50 dark:border-zinc-800 dark:bg-zinc-950/50 flex flex-col h-[calc(100vh-73px)] shrink-0" style={{ fontFamily: "sans-serif" }}>
      {/* brand */}
      <div className="flex items-center gap-2 px-4 py-4 border-b border-slate-200 dark:border-zinc-800">
        <svg viewBox="0 0 319 86" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-9 w-auto">
          <path d="m11.896 85.203 4.879-28.693 24.182-24.286 11.895 11.843zM43.104 0l-4.879 28.693-24.182 24.286L2.148 41.136z" fill="currentColor" className="text-slate-900 dark:text-white" />
          <text x="74" y="58" fontFamily="Poppins, Arial, sans-serif" fontSize="52" fontWeight="700" fill="currentColor" className="text-slate-900 dark:text-white" letterSpacing="1">
            SENDAR
          </text>
        </svg>
      </div>

      {/* new chat */}
      <div className="px-3 pt-2 pb-2 ">
        <button
          onClick={() => window.location.href = window.location.pathname}
          className="w-full bg-indigo-600 flex items-center justify-center rounded-full  px-4 py-2.5 text-white hover:bg-indigo-900 transition-colors hover:cursor-pointer gap-2 font-medium text-xs  "
        >
          <Plus size={14} />
          New Chat
        </button>
      </div>

      {/* histori */}
      <div className="  flex-1 overflow-y-auto px-3 py-2">
        <p className="px-2 text-[10px] font-semibold uppercase tracking-widest  mb-2 mt-1 text-zinc-600 ">History</p>
        {isLoading ? (
          <div className="flex-1 overflow-y-auto px-3 py-2">
            <Loader2 size={14} className="animate-spin" />
            <span className="text-xs">Loading...</span>
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-500 dark:text-zinc-600">
            <MessageSquare size={20} />
            <p className="text-xs text-center leading-relaxed">
              No conversation yet. <br />
              Start One above
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {history.map((item) => (
              <button key={item.id} onClick={() => onSelectedChat(item)} className="flex w-full items-start gap-2.5 text-left px-2.5 py-2 rounded-lg transition-colors shrink-0 text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200">
                <span className="mt-0.5 shrink-0 text-slate-500 group-hover:text-indigo-600 dark:text-zinc-600 dark:group-hover:text-indigo-400 transition-colors">{item.mode === "image" ? <ImageIcon size={13} /> : <MessageSquare size={13} />}</span>

                <div className="flex flex-col min-w-0">
                  <span className="truncate text-xs leading-relaxed">{formatLabel(item.content)}</span>
                  <span className="text-[10px] text-slate-500 dark:text-zinc-600 mt-0.5">{formatDate(item.created_at)}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* User Profile */}
      <div className="px-3 py-3 border-t border-slate-200 dark:border-zinc-800 flex justify-between items-center">
        {user && (
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors flex-1 min-w-0">
            <img src={user.imageUrl} alt="image" className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-300 dark:border-zinc-700" />
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-semibold text-slate-900 dark:text-zinc-200 truncate">{user.fullName}</span>
            </div>
            
            <ThemeToggle />
            <button onClick={signOut} className="p-1.5 rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-400/10 cursor-pointer shrink-0 transition-colors">
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Aside;
