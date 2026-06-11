import { useState, useRef, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

// ─── Types ────────────────────────────────────────────────────────────────────
type Screen = "auth" | "app" | "admin";
type AuthTab = "login" | "register";
type AppTab = "chats" | "contacts" | "search" | "settings" | "profile";
type MessageType = "text" | "voice" | "image" | "sticker" | "system";
type ChatType = "personal" | "group" | "channel" | "bot";

interface User {
  id: string;
  name: string;
  username: string;
  phone: string;
  avatar: string;
  status: "online" | "offline" | "typing";
  lastSeen?: string;
  bio?: string;
  statusText?: string;
  isAdmin?: boolean;
}

interface Message {
  id: string;
  from: string;
  text: string;
  type: MessageType;
  time: string;
  read: boolean;
  reactions?: string[];
  replyTo?: string;
  duration?: number;
}

interface Chat {
  id: string;
  type: ChatType;
  name: string;
  avatar: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
  members?: string[];
  pinned?: boolean;
  muted?: boolean;
  online?: boolean;
  subscribers?: number;
}

// ─── Fake Data ────────────────────────────────────────────────────────────────
const DEMO_CHATS: Chat[] = [
  { id: "1", type: "personal", name: "Алия Жакупова", avatar: "АЖ", lastMessage: "Окей, до встречи!", lastTime: "12:34", unread: 3, online: true, pinned: true },
  { id: "2", type: "personal", name: "Берик Сейтов", avatar: "БС", lastMessage: "Ты видел этот фильм?", lastTime: "11:20", unread: 0, online: false },
  { id: "3", type: "group", name: "Команда Jankobil 🚀", avatar: "КД", lastMessage: "Азамат: Задача выполнена!", lastTime: "10:05", unread: 12, members: ["Азамат", "Дина", "Сейт"] },
  { id: "4", type: "channel", name: "Новости KZ 📰", avatar: "НК", lastMessage: "Срочно: новые правила...", lastTime: "09:45", unread: 0, subscribers: 12400 },
  { id: "5", type: "personal", name: "Дина Ахметова", avatar: "ДА", lastMessage: "Фото пришло 📸", lastTime: "вчера", unread: 1, online: true },
  { id: "6", type: "bot", name: "🤖 Jankobil Assistant", avatar: "ЖА", lastMessage: "Чем могу помочь?", lastTime: "вчера", unread: 0 },
  { id: "7", type: "group", name: "Семья ❤️", avatar: "СЕ", lastMessage: "Мама: Приходите в воскресенье", lastTime: "пн", unread: 5, pinned: true },
  { id: "8", type: "personal", name: "Сейт Нурланов", avatar: "СН", lastMessage: "👍", lastTime: "вс", unread: 0, online: false },
];

const DEMO_MESSAGES: Record<string, Message[]> = {
  "1": [
    { id: "m1", from: "them", text: "Привет! Как дела?", type: "text", time: "12:20", read: true },
    { id: "m2", from: "me", text: "Отлично! Работаю над новым проектом 🚀", type: "text", time: "12:22", read: true },
    { id: "m3", from: "them", text: "Это Jankobilogram? Слышала о нём!", type: "text", time: "12:25", read: true },
    { id: "m4", from: "me", text: "Да! Уже можно отправлять голосовые и делать звонки 🎉", type: "text", time: "12:28", read: true },
    { id: "m5", from: "them", text: "Wow, серьёзно? Покажи как!", type: "text", time: "12:30", read: true, reactions: ["🔥", "👍"] },
    { id: "m6", from: "them", text: "Окей, до встречи!", type: "text", time: "12:34", read: true },
  ],
  "3": [
    { id: "g1", from: "Азамат", text: "Всем привет! Новый спринт начинается сегодня 💪", type: "text", time: "09:00", read: true },
    { id: "g2", from: "Дина", text: "Готова! Задачи уже расставила в доске", type: "text", time: "09:15", read: true },
    { id: "g3", from: "me", text: "Отлично, начинаем в 10:00 по плану", type: "text", time: "09:30", read: true },
    { id: "g4", from: "Азамат", text: "Задача выполнена!", type: "text", time: "10:05", read: true },
  ],
  "6": [
    { id: "b1", from: "them", text: "Привет! Я Jankobil Assistant 🤖\n\nЯ могу помочь с:\n• Поиском информации\n• Переводом текста\n• Ответами на вопросы", type: "text", time: "09:00", read: true },
    { id: "b2", from: "them", text: "Чем могу помочь?", type: "text", time: "09:00", read: true },
  ],
};

const CONTACTS: User[] = [
  { id: "c1", name: "Алия Жакупова", username: "@aliya_j", phone: "+7 701 234 5678", avatar: "АЖ", status: "online", bio: "Дизайнер | Алматы ☀️" },
  { id: "c2", name: "Берик Сейтов", username: "@berik_s", phone: "+7 702 345 6789", avatar: "БС", status: "offline", lastSeen: "сегодня в 11:20" },
  { id: "c3", name: "Дина Ахметова", username: "@dina_a", phone: "+7 703 456 7890", avatar: "ДА", status: "online", bio: "Путешествия и кофе ☕" },
  { id: "c4", name: "Азамат Байжанов", username: "@azamat_b", phone: "+7 707 567 8901", avatar: "АБ", status: "offline", lastSeen: "вчера" },
  { id: "c5", name: "Сейт Нурланов", username: "@seit_n", phone: "+7 708 678 9012", avatar: "СН", status: "offline", lastSeen: "3 дня назад" },
];

// ─── Helper ───────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  "#8b5cf6", "#6366f1", "#3b82f6", "#ec4899", "#f59e0b",
  "#10b981", "#ef4444", "#14b8a6", "#f97316", "#a855f7"
];

function getAvatarColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Avatar({ text, size = 40, online, img }: { text: string; size?: number; online?: boolean; img?: string }) {
  const bg = getAvatarColor(text);
  return (
    <div className="relative flex-shrink-0">
      <div className="flex items-center justify-center rounded-full font-semibold text-white select-none"
        style={{ width: size, height: size, background: img ? "transparent" : bg, fontSize: size * 0.36, overflow: "hidden" }}>
        {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : text.slice(0, 2)}
      </div>
      {online && <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-[#1a1a1a]" />}
    </div>
  );
}

function ChatIcon({ type }: { type: ChatType }) {
  if (type === "channel") return <Icon name="Megaphone" size={12} className="text-purple-400" />;
  if (type === "group") return <Icon name="Users" size={12} className="text-blue-400" />;
  if (type === "bot") return <Icon name="Bot" size={12} className="text-green-400" />;
  return null;
}

function Input({ icon, placeholder, value, onChange, type = "text", maxLength }: {
  icon: string; placeholder: string; value: string; onChange: (v: string) => void; type?: string; maxLength?: number;
}) {
  return (
    <div className="relative">
      <Icon name={icon} size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--jnk-text-muted)" }} />
      <input className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none transition-all"
        style={{ background: "var(--jnk-bg)", border: "1px solid var(--jnk-border)", color: "var(--jnk-text)" }}
        placeholder={placeholder} value={value} type={type} maxLength={maxLength}
        onChange={e => onChange(e.target.value)}
        onFocus={e => (e.target.style.borderColor = "var(--jnk-purple)")}
        onBlur={e => (e.target.style.borderColor = "var(--jnk-border)")} />
    </div>
  );
}

function PurpleBtn({ children, onClick, loading }: { children: React.ReactNode; onClick?: () => void; loading?: boolean }) {
  return (
    <button onClick={onClick} disabled={loading}
      className="w-full font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 py-3"
      style={{ background: "var(--jnk-purple)", color: "white", opacity: loading ? 0.7 : 1 }}
      onMouseEnter={e => { if (!loading) (e.currentTarget.style.background = "var(--jnk-purple-dark)"); }}
      onMouseLeave={e => { (e.currentTarget.style.background = "var(--jnk-purple)"); }}>
      {loading ? <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : children}
    </button>
  );
}

function HeaderBtn({ icon, onClick }: { icon: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
      onMouseEnter={e => (e.currentTarget.style.background = "var(--jnk-hover)")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
      <Icon name={icon} size={18} style={{ color: "var(--jnk-text-muted)" }} />
    </button>
  );
}

// ─── Auth Screen ──────────────────────────────────────────────────────────────
function AuthScreen({ onLogin }: { onLogin: (user: User) => void }) {
  const [tab, setTab] = useState<AuthTab>("login");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"form" | "code">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = () => {
    setError("");
    if (tab === "register" && step === "form") {
      if (!name.trim() || !username.trim() || !phone.trim()) { setError("Заполните все поля"); return; }
      if (username.length < 3) { setError("Username минимум 3 символа"); return; }
      setLoading(true);
      setTimeout(() => { setLoading(false); setStep("code"); }, 800);
      return;
    }
    if (tab === "register" && step === "code") {
      if (code !== "12345") { setError("Неверный код. Попробуйте: 12345"); return; }
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        onLogin({ id: "me", name, username: "@" + username, phone, avatar: name.slice(0, 2).toUpperCase(), status: "online", bio: "Привет, я использую Jankobilogram!" });
      }, 600);
      return;
    }
    if (tab === "login") {
      if (!phone.trim() || !password.trim()) { setError("Введите телефон и пароль"); return; }
      setLoading(true);
      setTimeout(() => {
        if (phone === "+7 777 777 7777" && password === "jankobil_admin_2025") {
          onLogin({ id: "admin", name: "Jankobil Admin", username: "@jankobil_admin", phone, avatar: "АД", status: "online", bio: "Создатель Jankobilogram 👑", isAdmin: true });
        } else if (phone === "+7 000 000 0000" && password === "demo") {
          onLogin({ id: "me", name: "Демо Пользователь", username: "@demo_user", phone, avatar: "ДП", status: "online", bio: "Демо аккаунт Jankobilogram" });
        } else {
          setLoading(false);
          setError("Неверный телефон или пароль");
        }
      }, 800);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--jnk-bg)" }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ background: "var(--jnk-purple)" }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-8 blur-3xl" style={{ background: "#6366f1" }} />
      </div>
      <div className="relative w-full max-w-md mx-4 animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 jnk-glow" style={{ background: "var(--jnk-purple)" }}>
            <span className="text-3xl">🚀</span>
          </div>
          <h1 className="text-3xl font-display font-black text-white tracking-tight">Jankobilogram</h1>
          <p className="text-sm mt-1" style={{ color: "var(--jnk-text-muted)" }}>Мессенджер нового поколения</p>
        </div>

        <div className="rounded-2xl p-6" style={{ background: "var(--jnk-sidebar)", border: "1px solid var(--jnk-border)" }}>
          <div className="flex rounded-xl p-1 mb-6" style={{ background: "var(--jnk-bg)" }}>
            {(["login", "register"] as AuthTab[]).map(t => (
              <button key={t} onClick={() => { setTab(t); setStep("form"); setError(""); }}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                style={{ background: tab === t ? "var(--jnk-purple)" : "transparent", color: tab === t ? "white" : "var(--jnk-text-muted)" }}>
                {t === "login" ? "Войти" : "Регистрация"}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 px-3 py-2 rounded-lg text-sm text-red-400" style={{ background: "rgba(239,68,68,0.1)" }}>
              {error}
            </div>
          )}

          {tab === "login" && (
            <div className="space-y-3">
              <Input icon="Phone" placeholder="+7 000 000 0000" value={phone} onChange={setPhone} type="tel" />
              <Input icon="Lock" placeholder="Пароль" value={password} onChange={setPassword} type="password" />
              <p className="text-xs text-center" style={{ color: "var(--jnk-text-muted)" }}>Демо: +7 000 000 0000 / demo</p>
              <PurpleBtn loading={loading} onClick={handleSubmit}>Войти</PurpleBtn>
            </div>
          )}

          {tab === "register" && step === "form" && (
            <div className="space-y-3 animate-fade-in">
              <Input icon="User" placeholder="Ваше имя" value={name} onChange={setName} />
              <Input icon="AtSign" placeholder="Username (без @)" value={username} onChange={setUsername} />
              <Input icon="Phone" placeholder="+7 000 000 0000" value={phone} onChange={setPhone} type="tel" />
              <PurpleBtn loading={loading} onClick={handleSubmit}>Получить код</PurpleBtn>
            </div>
          )}

          {tab === "register" && step === "code" && (
            <div className="space-y-3 animate-fade-in">
              <p className="text-sm text-center" style={{ color: "var(--jnk-text-muted)" }}>
                Код отправлен на <span className="text-white font-medium">{phone}</span>
              </p>
              <Input icon="KeyRound" placeholder="Код из SMS" value={code} onChange={setCode} />
              <p className="text-xs text-center" style={{ color: "var(--jnk-text-muted)" }}>Тестовый код: 12345</p>
              <PurpleBtn loading={loading} onClick={handleSubmit}>Подтвердить</PurpleBtn>
              <button className="w-full text-sm py-1" style={{ color: "var(--jnk-text-muted)" }} onClick={() => setStep("form")}>← Назад</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main App Screen ──────────────────────────────────────────────────────────
function AppScreen({ currentUser, onLogout }: { currentUser: User; onLogout: () => void }) {
  const [tab, setTab] = useState<AppTab>("chats");
  const [chats, setChats] = useState<Chat[]>(DEMO_CHATS);
  const [messages, setMessages] = useState<Record<string, Message[]>>(DEMO_MESSAGES);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [input, setInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [showEmojiPanel, setShowEmojiPanel] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showChatInfo, setShowChatInfo] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({ ...currentUser });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState("ru");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat, messages]);

  const sendMessage = useCallback((text: string, type: MessageType = "text", extra?: Partial<Message>) => {
    if (!activeChat) return;
    const msg: Message = {
      id: "msg_" + Date.now(),
      from: "me",
      text,
      type,
      time: new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" }),
      read: false,
      replyTo: replyTo?.id,
      ...extra,
    };
    setMessages(prev => ({ ...prev, [activeChat.id]: [...(prev[activeChat.id] || []), msg] }));
    setChats(prev => prev.map(c => c.id === activeChat.id ? { ...c, lastMessage: type === "voice" ? "🎤 Голосовое" : text, lastTime: msg.time } : c));
    setReplyTo(null);
    setInput("");
    setShowEmojiPanel(false);
    setShowAttachMenu(false);

    if (activeChat.type === "bot") {
      setTimeout(() => {
        const replies = ["Понял! Обрабатываю запрос...", "Отличный вопрос! Вот что я нашёл 🔍", "Готово! Что-то ещё?", "Конечно, помогу вам с этим 🤖", "Обработка завершена ✅"];
        const reply: Message = {
          id: "bot_" + Date.now(),
          from: "them",
          text: replies[Math.floor(Math.random() * replies.length)],
          type: "text",
          time: new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" }),
          read: true,
        };
        setMessages(prev => ({ ...prev, [activeChat.id]: [...(prev[activeChat.id] || []), reply] }));
      }, 1000);
    }
  }, [activeChat, replyTo]);

  const startRecording = () => {
    setRecording(true);
    setRecordSeconds(0);
    recordTimerRef.current = setInterval(() => setRecordSeconds(s => s + 1), 1000);
  };

  const stopRecording = (send: boolean) => {
    setRecording(false);
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    if (send && recordSeconds > 0) sendMessage(`🎤 голосовое`, "voice", { duration: recordSeconds });
    setRecordSeconds(0);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    sendMessage(`📎 ${file.name}`, "image");
    e.target.value = "";
    setShowAttachMenu(false);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const filteredChats = chats.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUnread = chats.reduce((s, c) => s + c.unread, 0);
  const activeMsgs = activeChat ? (messages[activeChat.id] || []) : [];

  const EMOJIS = ["😊", "😂", "❤️", "🔥", "👍", "🎉", "😍", "🤔", "😮", "👏", "🙏", "✨", "💪", "😎", "🚀", "💯", "😅", "🤣", "😭", "❤️‍🔥"];
  const STICKERS = ["🥰", "😤", "🤯", "😴", "🤩", "😡", "🥳", "😨", "🤗", "🫡", "🫶", "💀", "🙈", "🐸", "🦊", "🐼", "🎭", "🌈", "⚡", "🎯"];

  // ── Sidebar ──────────────────────────────────────────────────────────────────
  const sidebar = (
    <div className="flex flex-col h-full jnk-sidebar" style={{ width: 72, flexShrink: 0 }}>
      <div className="flex flex-col items-center gap-1 py-4 flex-1">
        <button className="w-12 h-12 rounded-full overflow-hidden mb-3 jnk-glow" onClick={() => { setTab("profile"); setActiveChat(null); }}>
          {avatarPreview
            ? <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center font-bold text-sm text-white" style={{ background: "var(--jnk-purple)" }}>
              {profileData.name.slice(0, 2).toUpperCase()}
            </div>
          }
        </button>
        {([
          { id: "chats", icon: "MessageCircle", label: "Чаты" },
          { id: "contacts", icon: "Users", label: "Контакты" },
          { id: "search", icon: "Search", label: "Поиск" },
          { id: "settings", icon: "Settings", label: "Настройки" },
        ] as { id: AppTab; icon: string; label: string }[]).map(item => (
          <button key={item.id}
            onClick={() => { setTab(item.id); setActiveChat(null); }}
            className="relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200"
            style={{ background: tab === item.id ? "var(--jnk-purple)" : "transparent" }}
            onMouseEnter={e => { if (tab !== item.id) e.currentTarget.style.background = "var(--jnk-hover)"; }}
            onMouseLeave={e => { if (tab !== item.id) e.currentTarget.style.background = "transparent"; }}
            title={item.label}>
            <Icon name={item.icon} size={20} style={{ color: tab === item.id ? "white" : "var(--jnk-text-muted)" }} />
            {item.id === "chats" && totalUnread > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center text-white" style={{ background: "var(--jnk-purple)" }}>
                {totalUnread > 99 ? "99+" : totalUnread}
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="flex flex-col items-center pb-4">
        <button onClick={onLogout} className="w-12 h-12 rounded-xl flex items-center justify-center transition-all"
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.15)")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          title="Выйти">
          <Icon name="LogOut" size={18} style={{ color: "var(--jnk-text-muted)" }} />
        </button>
      </div>
    </div>
  );

  // ── Chats List ────────────────────────────────────────────────────────────────
  const chatsList = (
    <div className="flex flex-col h-full" style={{ width: 300, flexShrink: 0, background: "var(--jnk-sidebar)", borderRight: "1px solid var(--jnk-border)" }}>
      <div className="p-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--jnk-border)" }}>
        <h2 className="text-lg font-bold text-white">Чаты</h2>
        <button onClick={() => setShowNewChat(true)} className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "var(--jnk-purple)" }}
          onMouseEnter={e => (e.currentTarget.style.background = "var(--jnk-purple-dark)")}
          onMouseLeave={e => (e.currentTarget.style.background = "var(--jnk-purple)")}>
          <Icon name="Pencil" size={14} className="text-white" />
        </button>
      </div>
      <div className="px-3 py-2">
        <div className="relative">
          <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--jnk-text-muted)" }} />
          <input className="w-full pl-8 pr-3 py-2 rounded-xl text-sm outline-none"
            style={{ background: "var(--jnk-bg)", color: "var(--jnk-text)", border: "1px solid var(--jnk-border)" }}
            placeholder="Поиск..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filteredChats.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)).map(chat => (
          <div key={chat.id} onClick={() => { setActiveChat(chat); setChats(prev => prev.map(c => c.id === chat.id ? { ...c, unread: 0 } : c)); }}
            className="flex items-center gap-3 px-3 py-3 cursor-pointer transition-all duration-150 jnk-chat-item"
            style={{ background: activeChat?.id === chat.id ? "var(--jnk-hover)" : "transparent" }}>
            <div className="relative">
              <Avatar text={chat.avatar} size={48} online={chat.online} />
              {chat.type !== "personal" && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "var(--jnk-sidebar)" }}>
                  <ChatIcon type={chat.type} />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {chat.pinned && <Icon name="Pin" size={10} style={{ color: "var(--jnk-text-muted)" }} />}
                  <span className="font-semibold text-sm text-white truncate">{chat.name}</span>
                </div>
                <span className="text-[11px] flex-shrink-0 ml-2" style={{ color: "var(--jnk-text-muted)" }}>{chat.lastTime}</span>
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <p className="text-xs truncate flex-1" style={{ color: "var(--jnk-text-muted)" }}>{chat.lastMessage}</p>
                {chat.unread > 0 && (
                  <span className="ml-2 min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center text-white flex-shrink-0" style={{ background: chat.muted ? "#555" : "var(--jnk-purple)" }}>
                    {chat.unread}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── Chat Window ───────────────────────────────────────────────────────────────
  const chatWindow = activeChat ? (
    <div className="flex flex-col h-full flex-1 animate-fade-in" style={{ background: "var(--jnk-bg)" }}>
      <div className="flex items-center gap-3 px-4 py-3" style={{ background: "var(--jnk-sidebar)", borderBottom: "1px solid var(--jnk-border)" }}>
        <div className="cursor-pointer flex items-center gap-3 flex-1" onClick={() => setShowChatInfo(true)}>
          <Avatar text={activeChat.avatar} size={40} online={activeChat.online} />
          <div>
            <div className="font-semibold text-white text-sm flex items-center gap-1">
              {activeChat.name}
              {activeChat.type === "channel" && <Icon name="BadgeCheck" size={14} style={{ color: "var(--jnk-purple)" }} />}
            </div>
            <p className="text-[11px]" style={{ color: "var(--jnk-text-muted)" }}>
              {activeChat.online ? "онлайн" :
                activeChat.type === "group" ? `${activeChat.members?.length || 3} участника` :
                activeChat.type === "channel" ? `${(activeChat.subscribers || 0).toLocaleString("ru")} подписчиков` :
                activeChat.type === "bot" ? "бот" : "был(а) недавно"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <HeaderBtn icon="Phone" onClick={() => alert("📞 Голосовой вызов — будет в следующей версии!")} />
          <HeaderBtn icon="Video" onClick={() => alert("📹 Видеозвонок — будет в следующей версии!")} />
          <HeaderBtn icon="MoreVertical" onClick={() => setShowChatInfo(true)} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-0.5">
        {activeMsgs.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center gap-2 opacity-40">
            <span className="text-4xl">💬</span>
            <p className="text-sm" style={{ color: "var(--jnk-text-muted)" }}>Начните переписку!</p>
          </div>
        )}
        {activeMsgs.map((msg, i) => {
          const isMe = msg.from === "me";
          const prevMsg = activeMsgs[i - 1];
          const isFirst = !prevMsg || prevMsg.from !== msg.from;

          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"} ${isFirst ? "mt-3" : "mt-0.5"} group animate-fade-in`}>
              {!isMe && (
                <div className="w-8 mr-2 flex-shrink-0 flex items-end">
                  {isFirst && <Avatar text={msg.from === "them" ? activeChat.avatar : msg.from.slice(0, 2)} size={28} />}
                </div>
              )}
              <div style={{ maxWidth: "70%" }}>
                {!isMe && isFirst && activeChat.type === "group" && (
                  <p className="text-xs mb-1 ml-1" style={{ color: "var(--jnk-purple-light)" }}>{msg.from}</p>
                )}
                {msg.replyTo && (
                  <div className="mb-1 px-2 py-1 rounded-lg text-xs opacity-70 inline-block" style={{ background: "rgba(139,92,246,0.2)", borderLeft: "3px solid var(--jnk-purple)" }}>
                    ↩ Ответ на сообщение
                  </div>
                )}
                <div className={isMe ? "jnk-message-out" : "jnk-message-in"} style={{ padding: "8px 12px", display: "inline-block", maxWidth: "100%" }}>
                  {msg.type === "voice" ? (
                    <div className="flex items-center gap-2">
                      <button className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: isMe ? "rgba(255,255,255,0.2)" : "var(--jnk-purple)" }}>
                        <Icon name="Play" size={11} className="text-white" />
                      </button>
                      <div className="flex items-end gap-0.5" style={{ height: 24 }}>
                        {Array.from({ length: 20 }).map((_, j) => (
                          <div key={j} className="w-0.5 rounded-full flex-shrink-0"
                            style={{ height: Math.sin(j * 0.7) * 8 + 10, background: isMe ? "rgba(255,255,255,0.7)" : "var(--jnk-purple-light)" }} />
                        ))}
                      </div>
                      <span className="text-xs opacity-70 flex-shrink-0">{msg.duration}с</span>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                  )}
                  <div className="flex items-center gap-1 mt-0.5 justify-end">
                    <span className="text-[10px] opacity-50">{msg.time}</span>
                    {isMe && <Icon name={msg.read ? "CheckCheck" : "Check"} size={12} style={{ color: msg.read ? "#a78bfa" : "rgba(255,255,255,0.5)" }} />}
                  </div>
                </div>
                {msg.reactions && msg.reactions.length > 0 && (
                  <div className="flex gap-1 mt-1 ml-1">
                    {msg.reactions.map((r, ri) => (
                      <span key={ri} className="text-sm px-1.5 py-0.5 rounded-full cursor-pointer"
                        style={{ background: "var(--jnk-message-in)" }}>{r}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className={`${isMe ? "mr-1 order-first" : "ml-1"} opacity-0 group-hover:opacity-100 transition-opacity flex items-center`}>
                <button onClick={() => setReplyTo(msg)} className="p-1 rounded-full"
                  style={{ background: "var(--jnk-message-in)" }}>
                  <Icon name="Reply" size={12} style={{ color: "var(--jnk-text-muted)" }} />
                </button>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {replyTo && (
        <div className="px-4 py-2 flex items-center gap-2" style={{ background: "var(--jnk-sidebar)", borderTop: "1px solid var(--jnk-border)" }}>
          <div className="flex-1 px-3 py-1.5 rounded-lg" style={{ borderLeft: "3px solid var(--jnk-purple)", background: "var(--jnk-bg)" }}>
            <p className="text-xs" style={{ color: "var(--jnk-purple-light)" }}>Ответ</p>
            <p className="truncate text-xs" style={{ color: "var(--jnk-text-muted)" }}>{replyTo.text}</p>
          </div>
          <button onClick={() => setReplyTo(null)}><Icon name="X" size={16} style={{ color: "var(--jnk-text-muted)" }} /></button>
        </div>
      )}

      {activeChat.type !== "channel" ? (
        <div className="px-3 py-3 flex items-center gap-2" style={{ background: "var(--jnk-sidebar)", borderTop: "1px solid var(--jnk-border)" }}>
          <div className="relative">
            <button onClick={() => { setShowEmojiPanel(p => !p); setShowAttachMenu(false); }}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
              style={{ background: showEmojiPanel ? "var(--jnk-purple)" : "var(--jnk-bg)" }}>
              <Icon name="Smile" size={18} style={{ color: showEmojiPanel ? "white" : "var(--jnk-text-muted)" }} />
            </button>
            {showEmojiPanel && (
              <div className="absolute bottom-12 left-0 rounded-2xl p-3 z-50 shadow-2xl animate-scale-in"
                style={{ background: "var(--jnk-sidebar)", border: "1px solid var(--jnk-border)", width: 280 }}>
                <p className="text-xs mb-2 font-medium" style={{ color: "var(--jnk-text-muted)" }}>Эмодзи</p>
                <div className="grid grid-cols-10 gap-0.5 mb-3">
                  {EMOJIS.map(e => <button key={e} onClick={() => setInput(p => p + e)} className="text-lg hover:scale-125 transition-transform text-center">{e}</button>)}
                </div>
                <p className="text-xs mb-2 font-medium" style={{ color: "var(--jnk-text-muted)" }}>Стикеры</p>
                <div className="grid grid-cols-10 gap-0.5">
                  {STICKERS.map(e => <button key={e} onClick={() => { sendMessage(e, "sticker"); setShowEmojiPanel(false); }} className="text-lg hover:scale-125 transition-transform text-center">{e}</button>)}
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button onClick={() => { setShowAttachMenu(p => !p); setShowEmojiPanel(false); }}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
              style={{ background: showAttachMenu ? "var(--jnk-purple)" : "var(--jnk-bg)" }}>
              <Icon name="Paperclip" size={18} style={{ color: showAttachMenu ? "white" : "var(--jnk-text-muted)" }} />
            </button>
            {showAttachMenu && (
              <div className="absolute bottom-12 left-0 rounded-2xl p-2 z-50 shadow-2xl animate-scale-in"
                style={{ background: "var(--jnk-sidebar)", border: "1px solid var(--jnk-border)", minWidth: 180 }}>
                {[
                  { icon: "Image", label: "Фото / Видео", action: () => fileInputRef.current?.click() },
                  { icon: "File", label: "Документ", action: () => fileInputRef.current?.click() },
                  { icon: "MapPin", label: "Геолокация", action: () => { sendMessage("📍 Местоположение отправлено"); } },
                  { icon: "Contact", label: "Контакт", action: () => { sendMessage("👤 Контакт отправлен"); } },
                ].map(item => (
                  <button key={item.label} onClick={item.action}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm transition-all"
                    style={{ color: "var(--jnk-text)" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--jnk-hover)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <Icon name={item.icon} size={16} style={{ color: "var(--jnk-purple)" }} />
                    {item.label}
                  </button>
                ))}
                <input ref={fileInputRef} type="file" className="hidden" accept="image/*,video/*,.pdf,.doc" onChange={handleFileUpload} />
              </div>
            )}
          </div>

          {recording ? (
            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "var(--jnk-bg)", border: "1px solid #ef4444" }}>
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <div className="flex gap-0.5 items-center flex-1">
                {Array.from({ length: 16 }).map((_, j) => (
                  <div key={j} className="w-0.5 rounded-full wave-bar"
                    style={{ height: Math.sin(j * 0.5) * 10 + 8, background: "var(--jnk-purple)", animationDelay: `${j * 0.06}s` }} />
                ))}
              </div>
              <span className="text-sm text-red-400 font-mono tabular-nums">{recordSeconds}с</span>
              <button onClick={() => stopRecording(false)}><Icon name="X" size={16} style={{ color: "var(--jnk-text-muted)" }} /></button>
            </div>
          ) : (
            <input
              className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "var(--jnk-bg)", color: "var(--jnk-text)", border: "1px solid var(--jnk-border)" }}
              placeholder="Написать сообщение..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onFocus={e => (e.target.style.borderColor = "var(--jnk-purple)")}
              onBlur={e => (e.target.style.borderColor = "var(--jnk-border)")}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && input.trim()) { e.preventDefault(); sendMessage(input.trim()); } }}
            />
          )}

          {input.trim() ? (
            <button onClick={() => sendMessage(input.trim())}
              className="w-10 h-10 rounded-xl flex items-center justify-center jnk-btn-primary flex-shrink-0">
              <Icon name="Send" size={18} className="text-white" />
            </button>
          ) : (
            <button
              onMouseDown={startRecording}
              onMouseUp={() => stopRecording(true)}
              onMouseLeave={() => { if (recording) stopRecording(true); }}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0"
              style={{ background: recording ? "#ef4444" : "var(--jnk-bg)", border: `1px solid ${recording ? "#ef4444" : "var(--jnk-border)"}` }}>
              <Icon name="Mic" size={18} style={{ color: recording ? "white" : "var(--jnk-text-muted)" }} />
            </button>
          )}
        </div>
      ) : (
        <div className="px-4 py-3 text-center text-sm" style={{ color: "var(--jnk-text-muted)", borderTop: "1px solid var(--jnk-border)", background: "var(--jnk-sidebar)" }}>
          Вы подписаны на канал — только чтение
        </div>
      )}
    </div>
  ) : (
    <div className="flex-1 flex flex-col items-center justify-center gap-4" style={{ background: "var(--jnk-bg)" }}>
      <div className="w-24 h-24 rounded-3xl flex items-center justify-center jnk-glow" style={{ background: "var(--jnk-purple)" }}>
        <span className="text-5xl">🚀</span>
      </div>
      <div className="text-center">
        <h2 className="text-2xl font-display font-black text-white">Jankobilogram</h2>
        <p className="text-sm mt-1" style={{ color: "var(--jnk-text-muted)" }}>Выберите чат, чтобы начать общение</p>
      </div>
    </div>
  );

  // ── Contacts ──────────────────────────────────────────────────────────────────
  const contactsPanel = (
    <div className="flex flex-col h-full flex-1" style={{ background: "var(--jnk-bg)" }}>
      <div className="p-4" style={{ borderBottom: "1px solid var(--jnk-border)" }}>
        <h2 className="text-lg font-bold text-white mb-3">Контакты</h2>
        <div className="relative">
          <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--jnk-text-muted)" }} />
          <input className="w-full pl-8 pr-3 py-2 rounded-xl text-sm outline-none"
            style={{ background: "var(--jnk-sidebar)", color: "var(--jnk-text)", border: "1px solid var(--jnk-border)" }}
            placeholder="Найти контакт..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {CONTACTS.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.username.includes(searchQuery)).map(contact => (
          <div key={contact.id} className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-all jnk-chat-item"
            onClick={() => {
              const existing = chats.find(c => c.name === contact.name);
              if (existing) { setActiveChat(existing); setTab("chats"); }
              else {
                const nc: Chat = { id: "nc_" + contact.id, type: "personal", name: contact.name, avatar: contact.avatar, lastMessage: "", lastTime: "", unread: 0, online: contact.status === "online" };
                setChats(prev => [nc, ...prev]);
                setActiveChat(nc);
                setTab("chats");
              }
            }}>
            <Avatar text={contact.avatar} size={50} online={contact.status === "online"} />
            <div className="flex-1">
              <p className="font-semibold text-white text-sm">{contact.name}</p>
              <p className="text-xs" style={{ color: "var(--jnk-purple-light)" }}>{contact.username}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--jnk-text-muted)" }}>
                {contact.bio || (contact.status === "online" ? "онлайн" : `был(а) ${contact.lastSeen}`)}
              </p>
            </div>
            <button className="p-2 rounded-xl" style={{ background: "var(--jnk-sidebar)" }}>
              <Icon name="MessageCircle" size={16} style={{ color: "var(--jnk-purple)" }} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  // ── Search ─────────────────────────────────────────────────────────────────
  const searchPanel = (
    <div className="flex flex-col h-full flex-1" style={{ background: "var(--jnk-bg)" }}>
      <div className="p-4" style={{ borderBottom: "1px solid var(--jnk-border)" }}>
        <h2 className="text-lg font-bold text-white mb-3">Поиск</h2>
        <div className="relative">
          <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--jnk-text-muted)" }} />
          <input className="w-full pl-10 pr-3 py-3 rounded-xl text-sm outline-none"
            style={{ background: "var(--jnk-sidebar)", color: "var(--jnk-text)", border: "1px solid var(--jnk-border)" }}
            placeholder="Поиск людей, групп, каналов..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} autoFocus />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {searchQuery.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 opacity-40">
            <Icon name="Search" size={48} style={{ color: "var(--jnk-text-muted)" }} />
            <p className="text-sm" style={{ color: "var(--jnk-text-muted)" }}>Введите запрос для поиска</p>
          </div>
        ) : (
          <div className="space-y-1">
            {[...chats].filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase())).map(item => (
              <div key={item.id} onClick={() => { setActiveChat(item); setTab("chats"); }}
                className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all jnk-chat-item">
                <Avatar text={item.avatar} size={44} />
                <div>
                  <p className="font-semibold text-white text-sm">{item.name}</p>
                  <p className="text-xs" style={{ color: "var(--jnk-text-muted)" }}>{item.lastMessage}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ── Settings ───────────────────────────────────────────────────────────────
  const settingsPanel = (
    <div className="flex flex-col h-full overflow-y-auto flex-1" style={{ background: "var(--jnk-bg)" }}>
      <div className="p-4" style={{ borderBottom: "1px solid var(--jnk-border)" }}>
        <h2 className="text-lg font-bold text-white">Настройки</h2>
      </div>
      <div className="p-4 space-y-2">
        {[
          { icon: "Bell", label: "Уведомления", sub: notifications ? "Включены" : "Выключены", toggle: notifications, action: () => setNotifications(p => !p) },
          { icon: "Lock", label: "Конфиденциальность", sub: "Управление данными", action: () => {} },
          { icon: "Palette", label: "Оформление", sub: "Тёмная тема", action: () => {} },
          { icon: "Globe", label: "Язык", sub: language === "ru" ? "Русский" : "English", action: () => setLanguage(p => p === "ru" ? "en" : "ru") },
          { icon: "Download", label: "Хранилище", sub: "Управление файлами", action: () => {} },
          { icon: "HelpCircle", label: "Помощь", sub: "FAQ и поддержка", action: () => {} },
          { icon: "Info", label: "О приложении", sub: "Jankobilogram v1.0", action: () => {} },
        ].map(item => (
          <button key={item.label} onClick={item.action} className="w-full flex items-center gap-3 p-4 rounded-xl transition-all text-left"
            style={{ background: "var(--jnk-sidebar)", border: "1px solid var(--jnk-border)" }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--jnk-purple)")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--jnk-border)")}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(139,92,246,0.15)" }}>
              <Icon name={item.icon} size={18} style={{ color: "var(--jnk-purple)" }} />
            </div>
            <div className="flex-1">
              <p className="font-medium text-white text-sm">{item.label}</p>
              <p className="text-xs" style={{ color: "var(--jnk-text-muted)" }}>{item.sub}</p>
            </div>
            {"toggle" in item ? (
              <div className="w-10 h-6 rounded-full transition-all flex items-center px-1 flex-shrink-0" style={{ background: item.toggle ? "var(--jnk-purple)" : "var(--jnk-border)" }}>
                <div className="w-4 h-4 rounded-full bg-white transition-all" style={{ marginLeft: item.toggle ? "16px" : "0" }} />
              </div>
            ) : (
              <Icon name="ChevronRight" size={16} style={{ color: "var(--jnk-text-muted)" }} />
            )}
          </button>
        ))}
        <button onClick={onLogout} className="w-full flex items-center gap-3 p-4 rounded-xl transition-all text-left mt-2"
          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(239,68,68,0.15)" }}>
            <Icon name="LogOut" size={18} className="text-red-400" />
          </div>
          <span className="font-medium text-red-400 text-sm">Выйти из аккаунта</span>
        </button>
      </div>
    </div>
  );

  // ── Profile ────────────────────────────────────────────────────────────────
  const profilePanel = (
    <div className="flex flex-col h-full overflow-y-auto flex-1" style={{ background: "var(--jnk-bg)" }}>
      <div className="p-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--jnk-border)" }}>
        <h2 className="text-lg font-bold text-white">Профиль</h2>
        <button onClick={() => setEditingProfile(p => !p)} className="px-3 py-1.5 rounded-xl text-sm font-medium transition-all"
          style={{ background: editingProfile ? "var(--jnk-purple)" : "var(--jnk-sidebar)", color: editingProfile ? "white" : "var(--jnk-text-muted)", border: "1px solid var(--jnk-border)" }}>
          {editingProfile ? "Сохранить" : "Редактировать"}
        </button>
      </div>
      <div className="p-6">
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="relative">
            <div className="w-28 h-28 rounded-full overflow-hidden jnk-glow">
              {avatarPreview
                ? <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-white"
                  style={{ background: getAvatarColor(profileData.name) }}>
                  {profileData.name.slice(0, 2).toUpperCase()}
                </div>
              }
            </div>
            {editingProfile && (
              <label className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full flex items-center justify-center cursor-pointer jnk-btn-primary">
                <Icon name="Camera" size={16} className="text-white" />
                <input ref={avatarInputRef} type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
              </label>
            )}
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold text-white">{profileData.name}</h3>
            <p className="text-sm" style={{ color: "var(--jnk-purple-light)" }}>{profileData.username}</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "rgba(34,197,94,0.15)" }}>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-green-400 font-medium">онлайн</span>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { icon: "User", label: "Имя", key: "name", value: profileData.name },
            { icon: "AtSign", label: "Username", key: "username", value: profileData.username },
            { icon: "Phone", label: "Телефон", key: "phone", value: profileData.phone },
            { icon: "FileText", label: "О себе", key: "bio", value: profileData.bio || "" },
          ].map(field => (
            <div key={field.key} className="p-4 rounded-xl" style={{ background: "var(--jnk-sidebar)", border: "1px solid var(--jnk-border)" }}>
              <div className="flex items-center gap-2 mb-1">
                <Icon name={field.icon} size={14} style={{ color: "var(--jnk-purple)" }} />
                <span className="text-xs" style={{ color: "var(--jnk-text-muted)" }}>{field.label}</span>
              </div>
              {editingProfile ? (
                <input className="w-full text-sm bg-transparent outline-none border-b pb-1 text-white"
                  style={{ borderColor: "var(--jnk-purple)" }}
                  value={field.value}
                  onChange={e => setProfileData(p => ({ ...p, [field.key]: e.target.value }))} />
              ) : (
                <p className="text-sm text-white">{field.value || <span style={{ color: "var(--jnk-text-muted)" }}>Не указано</span>}</p>
              )}
            </div>
          ))}
        </div>

        {editingProfile && (
          <div className="mt-4">
            <p className="text-xs mb-2" style={{ color: "var(--jnk-text-muted)" }}>Статус</p>
            <div className="grid grid-cols-2 gap-2">
              {["🚀 Готов к работе", "🎮 Играю", "📚 Учусь", "💤 Не беспокоить", "✈️ В путешествии", "🎵 Слушаю музыку"].map(s => (
                <button key={s} onClick={() => setProfileData(p => ({ ...p, statusText: s }))}
                  className="px-3 py-2 rounded-xl text-sm text-left transition-all"
                  style={{
                    background: profileData.statusText === s ? "rgba(139,92,246,0.2)" : "var(--jnk-sidebar)",
                    border: `1px solid ${profileData.statusText === s ? "var(--jnk-purple)" : "var(--jnk-border)"}`,
                    color: profileData.statusText === s ? "var(--jnk-purple-light)" : "var(--jnk-text-muted)"
                  }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ── Chat Info Modal ────────────────────────────────────────────────────────
  const chatInfoModal = showChatInfo && activeChat ? (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" onClick={() => setShowChatInfo(false)}>
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.7)" }} />
      <div className="relative w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6 animate-scale-in z-10"
        style={{ background: "var(--jnk-sidebar)", border: "1px solid var(--jnk-border)" }}
        onClick={e => e.stopPropagation()}>
        <div className="flex flex-col items-center gap-3 mb-6">
          <Avatar text={activeChat.avatar} size={72} online={activeChat.online} />
          <div className="text-center">
            <h3 className="text-lg font-bold text-white">{activeChat.name}</h3>
            <p className="text-sm" style={{ color: "var(--jnk-text-muted)" }}>
              {activeChat.type === "group" ? `Группа · ${activeChat.members?.length || 3} участника` :
                activeChat.type === "channel" ? `Канал · ${(activeChat.subscribers || 0).toLocaleString("ru")} подписчиков` :
                activeChat.online ? "онлайн" : "был(а) недавно"}
            </p>
          </div>
        </div>
        <div className="flex gap-3 justify-center mb-6">
          {[
            { icon: "Phone", label: "Звонок" },
            { icon: "Video", label: "Видео" },
            { icon: "BellOff", label: "Без звука" },
            { icon: "Search", label: "Поиск" },
          ].map(btn => (
            <button key={btn.label} onClick={() => alert(`${btn.label} — скоро!`)} className="flex flex-col items-center gap-1">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "var(--jnk-bg)" }}>
                <Icon name={btn.icon} size={20} style={{ color: "var(--jnk-purple)" }} />
              </div>
              <span className="text-[10px]" style={{ color: "var(--jnk-text-muted)" }}>{btn.label}</span>
            </button>
          ))}
        </div>
        <div className="space-y-2">
          <button onClick={() => { setChats(p => p.map(c => c.id === activeChat.id ? { ...c, pinned: !c.pinned } : c)); setShowChatInfo(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
            style={{ background: "var(--jnk-bg)", color: "var(--jnk-text)" }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--jnk-hover)")}
            onMouseLeave={e => (e.currentTarget.style.background = "var(--jnk-bg)")}>
            <Icon name="Pin" size={16} style={{ color: "var(--jnk-purple)" }} />
            {activeChat.pinned ? "Открепить" : "Закрепить"} чат
          </button>
          <button onClick={() => { setMessages(p => ({ ...p, [activeChat.id]: [] })); setShowChatInfo(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
            style={{ background: "var(--jnk-bg)", color: "#ef4444" }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--jnk-hover)")}
            onMouseLeave={e => (e.currentTarget.style.background = "var(--jnk-bg)")}>
            <Icon name="Trash2" size={16} className="text-red-400" />
            Очистить историю
          </button>
        </div>
        <button onClick={() => setShowChatInfo(false)} className="w-full mt-3 py-2.5 rounded-xl text-sm"
          style={{ background: "var(--jnk-bg)", color: "var(--jnk-text-muted)" }}>Закрыть</button>
      </div>
    </div>
  ) : null;

  // ── New Chat Modal ─────────────────────────────────────────────────────────
  const newChatModal = showNewChat ? (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" onClick={() => setShowNewChat(false)}>
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.7)" }} />
      <div className="relative w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-5 animate-scale-in z-10"
        style={{ background: "var(--jnk-sidebar)", border: "1px solid var(--jnk-border)" }}
        onClick={e => e.stopPropagation()}>
        <h3 className="text-base font-bold text-white mb-4">Новый чат</h3>
        <div className="space-y-2">
          {[
            { icon: "User", label: "Личное сообщение", sub: "Написать контакту" },
            { icon: "Users", label: "Создать группу", sub: "До 200 000 участников" },
            { icon: "Megaphone", label: "Создать канал", sub: "Публикуйте для подписчиков" },
            { icon: "Bot", label: "Создать бота", sub: "Автоматизация и сервисы" },
          ].map(item => (
            <button key={item.label} onClick={() => { setShowNewChat(false); alert(`${item.label} — скоро будет доступно!`); }}
              className="w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left"
              style={{ background: "var(--jnk-bg)" }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--jnk-hover)")}
              onMouseLeave={e => (e.currentTarget.style.background = "var(--jnk-bg)")}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(139,92,246,0.15)" }}>
                <Icon name={item.icon} size={18} style={{ color: "var(--jnk-purple)" }} />
              </div>
              <div>
                <p className="font-medium text-white text-sm">{item.label}</p>
                <p className="text-xs" style={{ color: "var(--jnk-text-muted)" }}>{item.sub}</p>
              </div>
            </button>
          ))}
        </div>
        <button onClick={() => setShowNewChat(false)} className="w-full mt-3 py-2.5 rounded-xl text-sm"
          style={{ color: "var(--jnk-text-muted)", background: "var(--jnk-bg)" }}>Отмена</button>
      </div>
    </div>
  ) : null;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full overflow-hidden" style={{ background: "var(--jnk-bg)" }}>
      {sidebar}
      <div className="flex flex-1 overflow-hidden">
        {tab === "chats" && (
          <>
            {chatsList}
            {chatWindow}
          </>
        )}
        {tab === "contacts" && contactsPanel}
        {tab === "search" && searchPanel}
        {tab === "settings" && settingsPanel}
        {tab === "profile" && profilePanel}
      </div>
      {chatInfoModal}
      {newChatModal}
    </div>
  );
}

// ─── Admin Panel ──────────────────────────────────────────────────────────────
function AdminPanel({ onLogout }: { onLogout: () => void }) {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [channels, setChannels] = useState([
    { id: "ch1", name: "Новости KZ 📰", subscribers: 12400, views: 340200, posts: 87 },
    { id: "ch2", name: "Jankobil Official 🚀", subscribers: 3800, views: 95000, posts: 34 },
    { id: "ch3", name: "Tech & Dev 💻", subscribers: 720, views: 18900, posts: 21 },
  ]);
  const [groups, setGroups] = useState([
    { id: "g1", name: "Команда Jankobil 🚀", members: 3, messages: 247 },
    { id: "g2", name: "Семья ❤️", members: 7, messages: 1203 },
    { id: "g3", name: "VIP Club 💎", members: 12, messages: 89 },
  ]);
  const [users, setUsers] = useState([
    { id: "u1", name: "Алия Жакупова", username: "@aliya_j", status: "online", messages: 1243, banned: false },
    { id: "u2", name: "Берик Сейтов", username: "@berik_s", status: "offline", messages: 876, banned: false },
    { id: "u3", name: "Дина Ахметова", username: "@dina_a", status: "online", messages: 2341, banned: false },
    { id: "u4", name: "Азамат Байжанов", username: "@azamat_b", status: "offline", messages: 432, banned: false },
    { id: "u5", name: "Сейт Нурланов", username: "@seit_n", status: "offline", messages: 112, banned: false },
  ]);
  const [boostTarget, setBoostTarget] = useState("ch1");
  const [boostAmount, setBoostAmount] = useState("1000");
  const [boostType, setBoostType] = useState<"subscribers" | "views">("subscribers");
  const [boostLog, setBoostLog] = useState<string[]>([]);
  const [boosting, setBoosting] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const totalUsers = users.length;
  const totalMessages = users.reduce((s, u) => s + u.messages, 0);
  const totalSubscribers = channels.reduce((s, c) => s + c.subscribers, 0);
  const onlineUsers = users.filter(u => u.status === "online").length;

  const handleBoost = () => {
    const amount = parseInt(boostAmount) || 0;
    if (!amount || amount < 1) return;
    if (amount > 1000000) { setBoostLog(p => [`❌ Максимум 1 000 000 за раз`, ...p]); return; }
    setBoosting(true);
    const steps = Math.min(5, Math.ceil(amount / 200));
    let done = 0;
    const interval = setInterval(() => {
      done++;
      const chunk = Math.floor(amount / steps);
      if (boostType === "subscribers") {
        setChannels(prev => prev.map(c => c.id === boostTarget ? { ...c, subscribers: c.subscribers + chunk } : c));
      } else {
        setChannels(prev => prev.map(c => c.id === boostTarget ? { ...c, views: c.views + chunk * 10 } : c));
      }
      if (done >= steps) {
        clearInterval(interval);
        setBoosting(false);
        const ch = channels.find(c => c.id === boostTarget);
        setBoostLog(p => [`✅ +${amount.toLocaleString("ru")} ${boostType === "subscribers" ? "подписчиков" : "просмотров"} → ${ch?.name}`, ...p.slice(0, 19)]);
      }
    }, 400);
  };

  const sendAnnouncement = () => {
    if (!announcement.trim()) return;
    setBoostLog(p => [`📢 Анонс отправлен: "${announcement.slice(0, 40)}..."`, ...p.slice(0, 19)]);
    setAnnouncement("");
  };

  const toggleBan = (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, banned: !u.banned } : u));
    const user = users.find(u => u.id === userId);
    const action = user?.banned ? "разблокирован" : "заблокирован";
    setBoostLog(p => [`🔨 ${user?.name} ${action}`, ...p.slice(0, 19)]);
  };

  const sections = [
    { id: "dashboard", icon: "LayoutDashboard", label: "Дашборд" },
    { id: "boost", icon: "TrendingUp", label: "Накрутка" },
    { id: "channels", icon: "Megaphone", label: "Каналы" },
    { id: "groups", icon: "Users", label: "Группы" },
    { id: "users", icon: "UserCog", label: "Пользователи" },
    { id: "announce", icon: "Bell", label: "Анонсы" },
    { id: "logs", icon: "ScrollText", label: "Логи" },
  ];

  return (
    <div className="flex h-full" style={{ background: "var(--jnk-bg)", fontFamily: "'Golos Text', sans-serif" }}>
      {/* Admin Sidebar */}
      <div className="flex flex-col h-full" style={{ width: 220, background: "#0f0f0f", borderRight: "1px solid var(--jnk-border)", flexShrink: 0 }}>
        <div className="p-4 pb-3" style={{ borderBottom: "1px solid var(--jnk-border)" }}>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--jnk-purple)" }}>
              <span className="text-sm">👑</span>
            </div>
            <div>
              <p className="text-xs font-bold text-white">Admin Panel</p>
              <p className="text-[10px]" style={{ color: "var(--jnk-text-muted)" }}>Jankobilogram</p>
            </div>
          </div>
        </div>
        <div className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {sections.map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all text-sm"
              style={{ background: activeSection === s.id ? "var(--jnk-purple)" : "transparent", color: activeSection === s.id ? "white" : "var(--jnk-text-muted)" }}
              onMouseEnter={e => { if (activeSection !== s.id) e.currentTarget.style.background = "var(--jnk-hover)"; }}
              onMouseLeave={e => { if (activeSection !== s.id) e.currentTarget.style.background = "transparent"; }}>
              <Icon name={s.icon} size={16} />
              {s.label}
            </button>
          ))}
        </div>
        <div className="p-2" style={{ borderTop: "1px solid var(--jnk-border)" }}>
          <button onClick={onLogout} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all"
            style={{ color: "#ef4444" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.1)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
            <Icon name="LogOut" size={16} />
            Выйти
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Dashboard */}
        {activeSection === "dashboard" && (
          <div className="animate-fade-in">
            <h1 className="text-2xl font-display font-black text-white mb-6">Дашборд</h1>
            <div className="grid grid-cols-2 gap-4 mb-6 lg:grid-cols-4">
              {[
                { label: "Пользователи", value: totalUsers.toLocaleString("ru"), icon: "Users", color: "#8b5cf6" },
                { label: "Онлайн сейчас", value: onlineUsers.toString(), icon: "Wifi", color: "#22c55e" },
                { label: "Подписчики", value: totalSubscribers.toLocaleString("ru"), icon: "TrendingUp", color: "#f59e0b" },
                { label: "Сообщений", value: totalMessages.toLocaleString("ru"), icon: "MessageCircle", color: "#3b82f6" },
              ].map(stat => (
                <div key={stat.label} className="p-4 rounded-2xl" style={{ background: "var(--jnk-sidebar)", border: "1px solid var(--jnk-border)" }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs" style={{ color: "var(--jnk-text-muted)" }}>{stat.label}</p>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${stat.color}22` }}>
                      <Icon name={stat.icon} size={14} style={{ color: stat.color }} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="p-4 rounded-2xl" style={{ background: "var(--jnk-sidebar)", border: "1px solid var(--jnk-border)" }}>
                <h3 className="text-sm font-semibold text-white mb-3">Топ каналов</h3>
                <div className="space-y-2">
                  {channels.map(ch => (
                    <div key={ch.id} className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: "var(--jnk-text-muted)" }}>{ch.name}</span>
                      <span className="text-sm font-semibold text-white">{ch.subscribers.toLocaleString("ru")} подп.</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 rounded-2xl" style={{ background: "var(--jnk-sidebar)", border: "1px solid var(--jnk-border)" }}>
                <h3 className="text-sm font-semibold text-white mb-3">Последние действия</h3>
                {boostLog.length === 0 ? (
                  <p className="text-sm" style={{ color: "var(--jnk-text-muted)" }}>Действий пока нет</p>
                ) : (
                  <div className="space-y-1.5">
                    {boostLog.slice(0, 5).map((log, i) => (
                      <p key={i} className="text-xs" style={{ color: "var(--jnk-text-muted)" }}>{log}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Boost */}
        {activeSection === "boost" && (
          <div className="animate-fade-in max-w-lg">
            <h1 className="text-2xl font-display font-black text-white mb-2">Накрутка</h1>
            <p className="text-sm mb-6" style={{ color: "var(--jnk-text-muted)" }}>Управление статистикой каналов</p>
            <div className="p-5 rounded-2xl space-y-4" style={{ background: "var(--jnk-sidebar)", border: "1px solid var(--jnk-border)" }}>
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--jnk-text-muted)" }}>Канал</label>
                <select value={boostTarget} onChange={e => setBoostTarget(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none appearance-none"
                  style={{ background: "var(--jnk-bg)", color: "var(--jnk-text)", border: "1px solid var(--jnk-border)" }}>
                  {channels.map(ch => (
                    <option key={ch.id} value={ch.id}>{ch.name} ({ch.subscribers.toLocaleString("ru")} подп.)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--jnk-text-muted)" }}>Тип накрутки</label>
                <div className="flex gap-2">
                  {(["subscribers", "views"] as const).map(t => (
                    <button key={t} onClick={() => setBoostType(t)}
                      className="flex-1 py-2 rounded-xl text-sm font-medium transition-all"
                      style={{ background: boostType === t ? "var(--jnk-purple)" : "var(--jnk-bg)", color: boostType === t ? "white" : "var(--jnk-text-muted)", border: `1px solid ${boostType === t ? "var(--jnk-purple)" : "var(--jnk-border)"}` }}>
                      {t === "subscribers" ? "👥 Подписчики" : "👁 Просмотры"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--jnk-text-muted)" }}>Количество</label>
                <div className="flex gap-2 mb-2">
                  {["500", "1000", "5000", "10000"].map(v => (
                    <button key={v} onClick={() => setBoostAmount(v)}
                      className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{ background: boostAmount === v ? "rgba(139,92,246,0.3)" : "var(--jnk-bg)", color: boostAmount === v ? "var(--jnk-purple-light)" : "var(--jnk-text-muted)", border: `1px solid ${boostAmount === v ? "var(--jnk-purple)" : "var(--jnk-border)"}` }}>
                      {parseInt(v).toLocaleString("ru")}
                    </button>
                  ))}
                </div>
                <input className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "var(--jnk-bg)", color: "var(--jnk-text)", border: "1px solid var(--jnk-border)" }}
                  type="number" placeholder="Или введите своё число..."
                  value={boostAmount} onChange={e => setBoostAmount(e.target.value)}
                  onFocus={e => (e.target.style.borderColor = "var(--jnk-purple)")}
                  onBlur={e => (e.target.style.borderColor = "var(--jnk-border)")} />
              </div>
              <button onClick={handleBoost} disabled={boosting}
                className="w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                style={{ background: "var(--jnk-purple)", color: "white", opacity: boosting ? 0.7 : 1 }}
                onMouseEnter={e => { if (!boosting) e.currentTarget.style.background = "var(--jnk-purple-dark)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "var(--jnk-purple)"; }}>
                {boosting
                  ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" /> Накручиваю...</>
                  : <><Icon name="Zap" size={16} /> Запустить накрутку</>
                }
              </button>
            </div>
            {boostLog.length > 0 && (
              <div className="mt-4 p-4 rounded-2xl" style={{ background: "var(--jnk-sidebar)", border: "1px solid var(--jnk-border)" }}>
                <h3 className="text-xs font-semibold mb-3 text-white">История</h3>
                <div className="space-y-1.5">
                  {boostLog.map((log, i) => (
                    <p key={i} className="text-xs" style={{ color: "var(--jnk-text-muted)" }}>{log}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Channels */}
        {activeSection === "channels" && (
          <div className="animate-fade-in">
            <h1 className="text-2xl font-display font-black text-white mb-6">Каналы</h1>
            <div className="space-y-3">
              {channels.map(ch => (
                <div key={ch.id} className="p-4 rounded-2xl flex items-center gap-4"
                  style={{ background: "var(--jnk-sidebar)", border: "1px solid var(--jnk-border)" }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(139,92,246,0.2)" }}>
                    <Icon name="Megaphone" size={20} style={{ color: "var(--jnk-purple)" }} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white">{ch.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--jnk-text-muted)" }}>
                      {ch.subscribers.toLocaleString("ru")} подписчиков · {ch.views.toLocaleString("ru")} просмотров · {ch.posts} постов
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setBoostTarget(ch.id); setActiveSection("boost"); }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{ background: "var(--jnk-purple)", color: "white" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "var(--jnk-purple-dark)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "var(--jnk-purple)")}>
                      <Icon name="Zap" size={12} className="inline mr-1" />Накрутить
                    </button>
                    <button onClick={() => setChannels(p => p.filter(c => c.id !== ch.id))}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
                      <Icon name="Trash2" size={12} className="inline" />
                    </button>
                  </div>
                </div>
              ))}
              <button onClick={() => {
                const name = prompt("Название канала:");
                if (name) setChannels(p => [...p, { id: "ch" + Date.now(), name, subscribers: 0, views: 0, posts: 0 }]);
              }} className="w-full p-4 rounded-2xl text-sm font-medium transition-all flex items-center justify-center gap-2"
                style={{ background: "var(--jnk-sidebar)", border: "2px dashed var(--jnk-border)", color: "var(--jnk-text-muted)" }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--jnk-purple)")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--jnk-border)")}>
                <Icon name="Plus" size={16} /> Создать канал
              </button>
            </div>
          </div>
        )}

        {/* Groups */}
        {activeSection === "groups" && (
          <div className="animate-fade-in">
            <h1 className="text-2xl font-display font-black text-white mb-6">Группы</h1>
            <div className="space-y-3">
              {groups.map(g => (
                <div key={g.id} className="p-4 rounded-2xl flex items-center gap-4"
                  style={{ background: "var(--jnk-sidebar)", border: "1px solid var(--jnk-border)" }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(59,130,246,0.2)" }}>
                    <Icon name="Users" size={20} style={{ color: "#3b82f6" }} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white">{g.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--jnk-text-muted)" }}>
                      {g.members} участников · {g.messages.toLocaleString("ru")} сообщений
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setGroups(p => p.map(gr => gr.id === g.id ? { ...gr, members: gr.members + Math.floor(Math.random() * 50) + 10 } : gr))}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium"
                      style={{ background: "var(--jnk-purple)", color: "white" }}>
                      +Участников
                    </button>
                    <button onClick={() => setGroups(p => p.filter(gr => gr.id !== g.id))}
                      className="px-3 py-1.5 rounded-lg text-xs" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
                      <Icon name="Trash2" size={12} className="inline" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Users */}
        {activeSection === "users" && (
          <div className="animate-fade-in">
            <h1 className="text-2xl font-display font-black text-white mb-6">Пользователи</h1>
            <div className="space-y-2">
              {users.map(u => (
                <div key={u.id} className="p-4 rounded-2xl flex items-center gap-3 transition-all"
                  style={{ background: selectedUser === u.id ? "rgba(139,92,246,0.1)" : "var(--jnk-sidebar)", border: `1px solid ${selectedUser === u.id ? "var(--jnk-purple)" : "var(--jnk-border)"}`, opacity: u.banned ? 0.5 : 1 }}
                  onClick={() => setSelectedUser(selectedUser === u.id ? null : u.id)}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
                    style={{ background: u.banned ? "#555" : getAvatarColor(u.name) }}>
                    {u.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-white text-sm">{u.name}</p>
                      {u.banned && <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.2)", color: "#ef4444" }}>БАН</span>}
                    </div>
                    <p className="text-xs" style={{ color: "var(--jnk-text-muted)" }}>
                      {u.username} · {u.messages.toLocaleString("ru")} сообщений
                      <span className={`ml-2 ${u.status === "online" ? "text-green-400" : ""}`}>
                        {u.status === "online" ? "🟢 онлайн" : "⚫ офлайн"}
                      </span>
                    </p>
                  </div>
                  {selectedUser === u.id && (
                    <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                      <button onClick={() => toggleBan(u.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                        style={{ background: u.banned ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)", color: u.banned ? "#22c55e" : "#ef4444" }}>
                        {u.banned ? "Разбанить" : "Забанить"}
                      </button>
                      <button onClick={() => { setUsers(p => p.map(usr => usr.id === u.id ? { ...usr, messages: 0 } : usr)); setBoostLog(p => [`🗑 Сообщения ${u.name} удалены`, ...p.slice(0, 19)]); }}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{ background: "rgba(245,158,11,0.2)", color: "#f59e0b" }}>
                        Очистить
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Announce */}
        {activeSection === "announce" && (
          <div className="animate-fade-in max-w-lg">
            <h1 className="text-2xl font-display font-black text-white mb-6">Анонсы</h1>
            <div className="p-5 rounded-2xl space-y-4" style={{ background: "var(--jnk-sidebar)", border: "1px solid var(--jnk-border)" }}>
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--jnk-text-muted)" }}>Текст анонса</label>
                <textarea className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                  style={{ background: "var(--jnk-bg)", color: "var(--jnk-text)", border: "1px solid var(--jnk-border)", height: 120 }}
                  placeholder="Введите текст для отправки всем пользователям..."
                  value={announcement} onChange={e => setAnnouncement(e.target.value)}
                  onFocus={e => (e.target.style.borderColor = "var(--jnk-purple)")}
                  onBlur={e => (e.target.style.borderColor = "var(--jnk-border)")} />
              </div>
              <div className="flex gap-2">
                {["📢 Важное обновление!", "🎉 Новая функция!", "⚠️ Технические работы", "🔥 Специальное предложение"].map(tmpl => (
                  <button key={tmpl} onClick={() => setAnnouncement(tmpl)}
                    className="px-2.5 py-1.5 rounded-lg text-xs transition-all flex-1"
                    style={{ background: "var(--jnk-bg)", color: "var(--jnk-text-muted)", border: "1px solid var(--jnk-border)" }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--jnk-purple)")}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--jnk-border)")}>
                    {tmpl.split(" ")[0]}
                  </button>
                ))}
              </div>
              <button onClick={sendAnnouncement} disabled={!announcement.trim()}
                className="w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                style={{ background: "var(--jnk-purple)", color: "white", opacity: announcement.trim() ? 1 : 0.5 }}>
                <Icon name="Send" size={16} /> Отправить всем
              </button>
            </div>
          </div>
        )}

        {/* Logs */}
        {activeSection === "logs" && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-display font-black text-white">Логи действий</h1>
              <button onClick={() => setBoostLog([])}
                className="px-3 py-1.5 rounded-lg text-sm transition-all"
                style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
                Очистить
              </button>
            </div>
            {boostLog.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3 opacity-40">
                <Icon name="ScrollText" size={40} style={{ color: "var(--jnk-text-muted)" }} />
                <p style={{ color: "var(--jnk-text-muted)" }}>Логов пока нет</p>
              </div>
            ) : (
              <div className="space-y-2">
                {boostLog.map((log, i) => (
                  <div key={i} className="px-4 py-3 rounded-xl text-sm"
                    style={{ background: "var(--jnk-sidebar)", border: "1px solid var(--jnk-border)", color: "var(--jnk-text-muted)" }}>
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function Index() {
  const [screen, setScreen] = useState<Screen>("auth");
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    if (user.isAdmin) setScreen("admin");
    else setScreen("app");
  };

  if (screen === "auth") return <AuthScreen onLogin={handleLogin} />;
  if (screen === "admin" && currentUser) return <AdminPanel onLogout={() => { setCurrentUser(null); setScreen("auth"); }} />;
  if (screen === "app" && currentUser) return <AppScreen currentUser={currentUser} onLogout={() => { setCurrentUser(null); setScreen("auth"); }} />;
  return null;
}