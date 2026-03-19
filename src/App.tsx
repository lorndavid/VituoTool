import { useState, useEffect, useCallback } from "react";
import { TOTP } from "totp-generator";
import { 
  ShieldCheck, 
  UserSearch, 
  Copy, 
  RefreshCw, 
  AlertCircle,
  CheckCircle2,
  History,
  Trash2,
  Lock,
  Zap,
  Moon,
  Sun
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// --- Types ---
interface LookupHistory {
  id: string;
  url: string;
  uid: string;
  timestamp: number;
}

export default function App() {
  // --- State ---
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(true);

  // 2FA State
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [timeLeft, setTimeLeft] = useState(30);
  const [copied2fa, setCopied2fa] = useState(false);

  // UID State
  const [fbUrl, setFbUrl] = useState("");
  const [uid, setUid] = useState("");
  const [loadingUid, setLoadingUid] = useState(false);
  const [errorUid, setErrorUid] = useState("");
  const [copiedUid, setCopiedUid] = useState(false);
  const [history, setHistory] = useState<LookupHistory[]>([]);

  // --- Effects ---
  
  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("fb_helper_history");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem("fb_helper_history", JSON.stringify(history));
  }, [history]);

  // Theme Effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // 2FA Logic
  const generateCode = useCallback(async () => {
    if (!secret) {
      setCode("");
      return;
    }
    try {
      const cleanSecret = secret.replace(/\s+/g, "").toUpperCase();
      const { otp } = await TOTP.generate(cleanSecret);
      setCode(otp);
    } catch (err) {
      console.error("2FA Error:", err);
      setCode("INVALID");
    }
  }, [secret]);

  useEffect(() => {
    generateCode();
    const timer = setInterval(() => {
      const seconds = 30 - (Math.floor(Date.now() / 1000) % 30);
      setTimeLeft(seconds);
      if (seconds === 30 || code === "") {
        generateCode();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [generateCode, code]);

  // --- Handlers ---
  
  const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lookupUid = async () => {
    if (!fbUrl) return;
    setLoadingUid(true);
    setErrorUid("");
    setUid("");

    try {
      const response = await fetch("/api/lookup-uid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: fbUrl }),
      });

      const data = await response.json();
      if (response.ok) {
        setUid(data.uid);
        // Add to history
        const newEntry: LookupHistory = {
          id: Math.random().toString(36).substr(2, 9),
          url: fbUrl,
          uid: data.uid,
          timestamp: Date.now(),
        };
        setHistory(prev => [newEntry, ...prev].slice(0, 5)); // Keep last 5 for simplicity
      } else {
        setErrorUid(data.error || `Error ${response.status}: Failed to lookup UID`);
      }
    } catch (err: any) {
      setErrorUid(err.message || "Network error. Please try again.");
    } finally {
      setLoadingUid(false);
    }
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const deleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] font-sans selection:bg-[var(--accent)]/30 p-4 md:p-6 transition-colors duration-300">
      <div className="max-w-xl mx-auto space-y-6">
        {/* --- Minimal Header --- */}
        <header className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg border border-[var(--border)] bg-white">
              <img 
                src="https://i.ibb.co/HLbCKDYh/logo.png" 
                alt="V-Tool Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  // Fallback if the link is not a direct image link
                  (e.target as HTMLImageElement).src = "https://picsum.photos/seed/vtool/64/64";
                }}
              />
            </div>
            <h1 className="text-2xl font-black tracking-tighter bg-[var(--accent-gradient)] bg-clip-text text-transparent">V-Tool</h1>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2.5 rounded-2xl bg-[var(--card-bg)] border border-[var(--border)] text-[var(--text)] hover:scale-110 transition-all shadow-md"
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <span className="text-[10px] text-[var(--muted)] font-mono bg-[var(--card-bg)] px-3 py-1 rounded-full border border-[var(--border)] shadow-sm">v1.6.0</span>
          </div>
        </header>
        <main className="space-y-5">
          {/* 2FA Generator Section */}
          <motion.section 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-5 md:p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck size={16} className="text-[var(--accent)]" />
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">2FA Authenticator</h2>
            </div>

            <div className="space-y-5">
              <div className="space-y-1.5">
                <div className="relative">
                  <input 
                    type="text" 
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                    placeholder="Paste 2FA secret..."
                    className="input-field w-full pr-10 font-mono text-[var(--accent)] placeholder:font-sans"
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]">
                    <Lock size={14} />
                  </div>
                </div>
              </div>

              <div className="bg-[var(--bg)] rounded-xl p-5 border border-[var(--border)] flex flex-col items-center justify-center text-center relative overflow-hidden">
                {/* Progress Bar */}
                <div className="absolute bottom-0 left-0 h-0.5 bg-[var(--border)] w-full" />
                <motion.div 
                  className={`absolute bottom-0 left-0 h-0.5 ${timeLeft < 10 ? "bg-red-500" : "bg-[var(--accent)]"}`}
                  initial={{ width: "100%" }}
                  animate={{ width: `${(timeLeft / 30) * 100}%` }}
                  transition={{ duration: 1, ease: "linear" }}
                />

                <div className="space-y-0.5 mb-4">
                  <span className="text-[9px] font-bold text-[var(--muted)] uppercase tracking-widest">Current Code</span>
                  <div className="flex items-center justify-center">
                    <AnimatePresence mode="wait">
                      <motion.div 
                        key={code || "empty"}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`text-4xl md:text-5xl font-black tracking-tighter tabular-nums ${
                          code === "INVALID" ? "text-red-500" : "text-[var(--text)]"
                        }`}
                      >
                        {code ? (code === "INVALID" ? "ERROR" : code.match(/.{1,3}/g)?.join(" ")) : "000 000"}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full">
                  <button 
                    onClick={() => code && code !== "INVALID" && copyToClipboard(code, setCopied2fa)}
                    disabled={!code || code === "INVALID"}
                    className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2 text-xs"
                  >
                    {copied2fa ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                    <span>{copied2fa ? "Copied" : "Copy Code"}</span>
                  </button>
                  <div className={`font-mono text-[10px] font-bold px-3 py-2.5 bg-[var(--hover)] rounded-lg border border-[var(--border)] ${
                    timeLeft < 10 ? "text-red-400" : "text-[var(--muted)]"
                  }`}>
                    {timeLeft}s
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* UID Lookup Section */}
          <motion.section 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="glass-card rounded-2xl p-5 md:p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <UserSearch size={16} className="text-[var(--accent)]" />
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">UID Lookup</h2>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <input 
                  type="text" 
                  value={fbUrl}
                  onChange={(e) => setFbUrl(e.target.value)}
                  placeholder="Facebook URL..."
                  className="input-field flex-1"
                />
                <button 
                  onClick={lookupUid}
                  disabled={loadingUid || !fbUrl}
                  className="btn-primary px-5 py-2.5 flex items-center justify-center gap-2 text-xs sm:w-auto w-full"
                >
                  {loadingUid ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
                  <span>{loadingUid ? "Wait" : "Lookup"}</span>
                </button>
              </div>

              <AnimatePresence mode="wait">
                {uid ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="bg-[var(--hover)] border border-[var(--border)] rounded-xl p-4 flex items-center gap-4"
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-[var(--border)] shrink-0">
                      <img src={`https://picsum.photos/seed/${uid}/64/64`} alt="Profile" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[9px] text-[var(--muted)] font-bold uppercase mb-0.5">Numeric ID</div>
                      <div className="text-xl font-black tracking-tight text-[var(--text)] font-mono">{uid}</div>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(uid, setCopiedUid)}
                      className="btn-secondary p-2.5"
                    >
                      {copiedUid ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Copy size={16} />}
                    </button>
                  </motion.div>
                ) : errorUid && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/5 border border-red-500/10 rounded-xl p-3 flex items-start gap-2.5"
                  >
                    <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-red-400 leading-relaxed">{errorUid}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.section>

          {/* History Section */}
          <motion.section 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-2xl p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <History size={14} className="text-[var(--accent)]" />
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Recent</h3>
              </div>
              {history.length > 0 && (
                <button 
                  onClick={clearHistory}
                  className="text-[9px] font-bold text-[var(--muted)] hover:text-red-400 transition-colors uppercase tracking-widest"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="space-y-1.5">
              <AnimatePresence initial={false}>
                {history.length > 0 ? (
                  history.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 5 }}
                      className="group bg-[var(--hover)] border border-[var(--border)] rounded-lg p-2.5 flex items-center justify-between hover:border-[var(--accent)]/20 transition-all"
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-mono text-[var(--accent)] font-bold">{item.uid}</span>
                        <span className="text-[9px] text-[var(--muted)] truncate max-w-[150px] sm:max-w-[250px]">{item.url}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => copyToClipboard(item.uid, () => {})}
                          className="p-1.5 text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
                        >
                          <Copy size={12} />
                        </button>
                        <button 
                          onClick={() => deleteHistoryItem(item.id)}
                          className="p-1.5 text-[var(--muted)] hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="py-4 text-center">
                    <p className="text-[9px] text-[var(--muted)] uppercase tracking-widest font-bold">No History</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </motion.section>
        </main>

        {/* --- Minimal Footer --- */}
        <footer className="pt-4 text-center space-y-4 pb-4">
          <div className="flex items-center justify-center gap-3 p-3 bg-[var(--hover)] rounded-xl border border-[var(--border)]">
            <Lock size={10} className="text-emerald-500" />
            <p className="text-[9px] text-[var(--muted)] leading-relaxed">
              Local 2FA Generation &bull; No Data Stored
            </p>
          </div>
          <p className="text-[8px] text-[var(--muted)] font-bold uppercase tracking-[0.4em]">
            V-Tool Suite &bull; LORN David
          </p>
        </footer>
      </div>

      {/* --- Toast Notification --- */}
      <AnimatePresence>
        {(copied2fa || copiedUid) && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 20, x: "-50%" }}
            className="fixed bottom-6 left-1/2 z-[100] bg-[var(--accent)] text-[var(--accent-text)] px-5 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 border border-[var(--border)]"
          >
            <CheckCircle2 size={16} />
            <span className="font-bold text-[10px] uppercase tracking-wider">Copied</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}



