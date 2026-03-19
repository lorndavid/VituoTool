import { useState, useEffect, useCallback } from "react";
import { TOTP } from "totp-generator";
import {
  ShieldCheck, UserSearch, Copy, RefreshCw,
  AlertCircle, CheckCircle2, History, Trash2, Lock, Zap, Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface LookupHistory {
  id: string;
  url: string;
  uid: string;
  timestamp: number;
}

const palette = {
  text: "#5a2614",
  textSoft: "#8f5f35",
  card: "rgba(255, 248, 238, 0.88)",
  cardStrong: "rgba(255, 250, 242, 0.96)",
  border: "rgba(179, 92, 38, 0.22)",
  borderSoft: "rgba(212, 151, 66, 0.28)",
  input: "rgba(255, 252, 247, 0.96)",
  primary: "linear-gradient(135deg, #b63c2f 0%, #df7b24 55%, #f1c85b 100%)",
  primaryShadow: "rgba(182, 60, 47, 0.24)",
  success: "#2a8f5a",
  danger: "#c6432d",
  gold: "#f1c85b",
  saffron: "#df7b24",
  ruby: "#b63c2f",
  jade: "#2f8f74",
  cream: "#fff6e8",
  lotus: "#f6d2c9",
  mint: "#d7efe2",
};

const GARLANDS = [
  { width: 250, top: "8%", left: "-24px", rotate: "4deg", delay: 0, dur: 16 },
  { width: 230, top: "11%", right: "-20px", rotate: "-5deg", delay: 1.1, dur: 18 },
  { width: 180, top: "70%", left: "74%", rotate: "-12deg", delay: 0.8, dur: 20 },
];

const FLOATERS = [
  { top: "14%", left: "6%", size: 86, delay: 0, bg: "radial-gradient(circle at 35% 35%, #fff6d9 0%, #f1c85b 42%, #b63c2f 100%)" },
  { top: "18%", right: "7%", size: 74, delay: 0.9, bg: "radial-gradient(circle at 35% 35%, #fff7e7 0%, #f0a63f 42%, #2f8f74 100%)" },
  { top: "63%", left: "8%", size: 58, delay: 1.5, bg: "radial-gradient(circle at 35% 35%, #fff3de 0%, #df7b24 42%, #b63c2f 100%)" },
];

const PAWS = [
  { top: "31%", left: "84%", size: 22, opacity: 0.18, delay: 0.2 },
  { top: "36%", left: "80%", size: 16, opacity: 0.14, delay: 0.7 },
  { top: "59%", left: "15%", size: 18, opacity: 0.16, delay: 0.4 },
  { top: "64%", left: "19%", size: 14, opacity: 0.12, delay: 1.1 },
];

export default function App() {
  const [secret, setSecret]       = useState("");
  const [code, setCode]           = useState("");
  const [timeLeft, setTimeLeft]   = useState(30);
  const [copied2fa, setCopied2fa] = useState(false);

  const [fbUrl, setFbUrl]             = useState("");
  const [uid, setUid]                 = useState("");
  const [loadingUid, setLoadingUid]   = useState(false);
  const [errorUid, setErrorUid]       = useState("");
  const [copiedUid, setCopiedUid]     = useState(false);
  const [history, setHistory]         = useState<LookupHistory[]>([]);

  useEffect(() => {
    const s = localStorage.getItem("vtool_history");
    if (s) { try { setHistory(JSON.parse(s)); } catch {} }
  }, []);
  useEffect(() => {
    localStorage.setItem("vtool_history", JSON.stringify(history));
  }, [history]);

  const generateCode = useCallback(async () => {
    if (!secret) { setCode(""); return; }
    try {
      const { otp } = await TOTP.generate(secret.replace(/\s+/g, "").toUpperCase());
      setCode(otp);
    } catch { setCode("INVALID"); }
  }, [secret]);

  useEffect(() => {
    generateCode();
    const t = setInterval(() => {
      const s = 30 - (Math.floor(Date.now() / 1000) % 30);
      setTimeLeft(s);
      if (s === 30) generateCode();
    }, 1000);
    return () => clearInterval(t);
  }, [generateCode]);

  const copy = (text: string, cb: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    cb(true);
    setTimeout(() => cb(false), 2000);
  };

  const lookupUid = async () => {
    if (!fbUrl) return;
    setLoadingUid(true); setErrorUid(""); setUid("");
    try {
      const res  = await fetch("/api/lookup-uid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: fbUrl }),
      });
      const data = await res.json();
      if (res.ok) {
        setUid(data.uid);
        setHistory(prev => [{
          id: Math.random().toString(36).slice(2, 9),
          url: fbUrl, uid: data.uid, timestamp: Date.now(),
        }, ...prev].slice(0, 5));
      } else {
        setErrorUid(data.error || `Error ${res.status}`);
      }
    } catch (e: any) {
      setErrorUid(e.message || "Network error.");
    } finally { setLoadingUid(false); }
  };

  // ── Shared styles ─────────────────────────────────────────────────────────
  const card: React.CSSProperties = {
    background: `linear-gradient(180deg, ${palette.cardStrong} 0%, ${palette.card} 100%)`,
    border: `1.5px solid ${palette.border}`,
    borderRadius: 28,
    padding: "22px",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    boxShadow: "0 22px 44px rgba(217, 156, 198, 0.18)",
    marginBottom: 12,
    position: "relative",
    overflow: "hidden",
  };

  const sectionLabel: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 7,
    fontSize: 10, fontWeight: 900, letterSpacing: "0.18em",
    textTransform: "uppercase", color: palette.textSoft,
    marginBottom: 16, fontFamily: "'Plus Jakarta Sans',sans-serif",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: palette.input,
    border: `1.5px solid ${palette.border}`,
    borderRadius: 16,
    padding: "12px 40px 12px 14px",
    fontFamily: "'Plus Jakarta Sans',sans-serif",
    fontSize: 14,
    color: palette.text,
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s, transform 0.2s",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)",
  };

  const btnPrimary: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    gap: 6, padding: "12px 18px",
    background: palette.primary,
    border: "none", borderRadius: 16,
    color: "#fff", fontFamily: "'Plus Jakarta Sans',sans-serif",
    fontSize: 11, fontWeight: 900,
    letterSpacing: "0.1em", textTransform: "uppercase",
    cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
    transition: "filter 0.18s, transform 0.14s, box-shadow 0.18s",
    boxShadow: `0 14px 28px ${palette.primaryShadow}`,
  };

  const microLabel: React.CSSProperties = {
    fontSize: 9, fontWeight: 900, letterSpacing: "0.18em",
    textTransform: "uppercase", color: palette.textSoft,
    fontFamily: "'Plus Jakarta Sans',sans-serif",
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Marcellus&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: ${palette.text};
          background:
            radial-gradient(circle at 14% 16%, rgba(241, 200, 91, 0.2) 0%, transparent 23%),
            radial-gradient(circle at 84% 18%, rgba(182, 60, 47, 0.16) 0%, transparent 20%),
            radial-gradient(circle at 77% 78%, rgba(47, 143, 116, 0.16) 0%, transparent 22%),
            repeating-linear-gradient(45deg, rgba(182, 60, 47, 0.035) 0 14px, transparent 14px 28px),
            repeating-linear-gradient(-45deg, rgba(241, 200, 91, 0.03) 0 14px, transparent 14px 28px),
            linear-gradient(180deg, #fff7ec 0%, #fffaf1 28%, #fff3e6 62%, #fff8f3 100%);
          min-height: 100dvh;
          overflow-x: hidden;
        }

        /* ── Background bubbles ─── */
        .cloud {
          position: fixed;
          z-index: 0;
          height: 6px;
          border-radius: 999px;
          pointer-events: none;
          background: linear-gradient(90deg, #b63c2f 0%, #f1c85b 48%, #2f8f74 100%);
          box-shadow: 0 10px 18px rgba(182, 60, 47, 0.12);
          transform: rotate(var(--rotate, 0deg));
          animation: cloudFloat 16s ease-in-out infinite alternate;
        }
        .cloud::before,
        .cloud::after {
          content: "";
          position: absolute;
          bottom: -8px;
          width: 18px;
          height: 18px;
          border-radius: 4px;
          border: 2px solid rgba(255,255,255,0.6);
          transform: rotate(45deg);
        }
        .cloud::before { left: 18%; background: linear-gradient(135deg, #f1c85b 0%, #df7b24 100%); }
        .cloud::after { right: 20%; background: linear-gradient(135deg, #2f8f74 0%, #f1c85b 100%); }

        /* ── Tiny dots ─── */
        .pet-floater {
          position: fixed;
          z-index: 0;
          border-radius: 50%;
          pointer-events: none;
          box-shadow: 0 16px 34px rgba(182, 60, 47, 0.12);
          animation: petBob 7s ease-in-out infinite;
        }
        .pet-floater::before,
        .pet-floater::after {
          content: "";
          position: absolute;
          inset: 14%;
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.45);
        }
        .pet-floater::after {
          inset: 34%;
          background: rgba(255,255,255,0.32);
        }
        .paw-mark {
          position: fixed;
          z-index: 0;
          pointer-events: none;
          transform: rotate(45deg);
          border-radius: 5px;
          background: linear-gradient(135deg, #f1c85b 0%, #b63c2f 100%);
          border: 1.5px solid rgba(255,255,255,0.55);
          animation: pawBlink 4.8s ease-in-out infinite;
        }

        /* ── Page wrap ─── */
        .page {
          position: relative; z-index: 1;
          max-width: 560px; margin: 0 auto;
          padding: 22px 14px 52px; width: 100%;
        }
        @media (min-width: 480px) { .page { padding: 28px 20px 60px; } }
        @media (min-width: 768px) { .page { padding: 38px 0 72px; } }

        /* ── Input focus ─── */
        input:focus {
          border-color: #f1c85b !important;
          box-shadow: 0 0 0 4px rgba(241,200,91,0.18) !important;
          transform: translateY(-1px);
          outline: none;
        }
        input::placeholder { color: #b8845f; }

        /* ── Buttons ─── */
        .btn-primary:hover:not(:disabled) { filter: brightness(1.03); transform: translateY(-1px); box-shadow: 0 18px 32px rgba(182,60,47,0.28) !important; }
        .btn-primary:active:not(:disabled) { transform: scale(0.97) !important; }
        .btn-primary:disabled              { opacity: 0.42 !important; cursor: not-allowed; box-shadow: none !important; }

        .btn-icon {
          display: inline-flex; align-items: center; justify-content: center;
          padding: 10px; background: rgba(255,255,255,0.78);
          border: 1.5px solid ${palette.border}; border-radius: 14px;
          cursor: pointer; color: ${palette.textSoft}; transition: all 0.18s; flex-shrink: 0;
        }
        .btn-icon:hover { background: rgba(255,245,233,0.98); color: ${palette.text}; transform: translateY(-1px); }

        /* ── History buttons ─── */
        .hist-btn {
          background: rgba(255,255,255,0.72); border: 1.5px solid ${palette.borderSoft}; cursor: pointer;
          padding: 7px; color: ${palette.textSoft}; border-radius: 12px;
          transition: all 0.18s; display: flex; align-items: center;
        }
        .hist-btn:hover     { background: rgba(255,245,233,0.98); color: ${palette.text}; transform: translateY(-1px); }
        .hist-del:hover     { color: ${palette.danger} !important; background: rgba(255,238,232,0.98) !important; }

        .clear-btn {
          background: rgba(255,255,255,0.76); border: 1.5px solid ${palette.borderSoft}; cursor: pointer;
          font-size: 9px; font-weight: 900; letter-spacing: 0.18em;
          text-transform: uppercase; color: ${palette.textSoft};
          font-family: 'Plus Jakarta Sans', sans-serif; transition: color 0.18s, transform 0.18s, background 0.18s;
          padding: 7px 12px; border-radius: 999px;
        }
        .clear-btn:hover { color: ${palette.ruby}; transform: translateY(-1px); background: rgba(255,244,236,0.96); }

        /* ── Spinner ─── */
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.9s linear infinite; display: block; }
        @keyframes cloudFloat { from { translate: 0 0; } to { translate: 18px -8px; } }
        @keyframes petBob { 0%, 100% { translate: 0 0; } 50% { translate: 0 -10px; } }
        @keyframes pawBlink { 0%, 100% { opacity: 0.08; scale: 0.95; } 50% { opacity: 0.28; scale: 1.05; } }

        /* ── Scrollbar ─── */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #d7ab6d; border-radius: 4px; }
      `}</style>

      {/* ── Background bubbles ─────────────────────────────────────────────── */}
      {GARLANDS.map((cloud, i) => (
        <div key={i} className="cloud" style={{
          width: cloud.width,
          top: cloud.top,
          left: cloud.left,
          right: cloud.right,
          animationDelay: `${cloud.delay}s`,
          animationDuration: `${cloud.dur}s`,
          transform: `rotate(${cloud.rotate})`,
        }} />
      ))}

      {/* ── Tiny dots ──────────────────────────────────────────────────────── */}
      {FLOATERS.map((floater, i) => (
        <div key={i} className="pet-floater" style={{
          width: floater.size,
          height: floater.size,
          left: floater.left,
          right: floater.right,
          top: floater.top,
          background: floater.bg,
          animationDelay: `${floater.delay}s`,
        } as React.CSSProperties}>
        </div>
      ))}

      {PAWS.map((paw, i) => (
        <div key={i} className="paw-mark" style={{
          top: paw.top,
          left: paw.left,
          width: paw.size,
          height: paw.size,
          opacity: paw.opacity,
          animationDelay: `${paw.delay}s`,
        }} aria-hidden="true">
        </div>
      ))}

      {/* ── Page ───────────────────────────────────────────────────────────── */}
      <div className="page">

        {/* Header */}
        <header style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: 10, marginBottom: 18,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 18, overflow: "hidden",
              border: "2px solid rgba(255,255,255,0.78)",
              boxShadow: "0 14px 28px rgba(179, 92, 38, 0.16)",
              background: "rgba(255,255,255,0.92)",
              flexShrink: 0,
            }}>
              <img
                src="/favicon.png"
                alt="V-Tool"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => { (e.target as HTMLImageElement).src = "https://picsum.photos/seed/vtool/80/80"; }}
              />
            </div>
            <div>
              <div style={{
                fontFamily: "'Marcellus', serif",
                fontSize: 30, lineHeight: 1, color: palette.text,
              }}>V-Tool</div>
              <div style={{
                fontSize: 11, fontWeight: 900, letterSpacing: "0.12em",
                textTransform: "uppercase", color: palette.textSoft,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}>Khmer New Year</div>
            </div>
          </div>

          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 9, fontWeight: 900, letterSpacing: "0.14em",
            textTransform: "uppercase", color: palette.textSoft,
            background: "rgba(255,255,255,0.82)",
            border: `1.5px solid ${palette.border}`,
            borderRadius: 99, padding: "7px 12px",
            backdropFilter: "blur(8px)",
            fontFamily: "'Plus Jakarta Sans',sans-serif",
          }}>
            <Sparkles size={12} />
            Cambodian festival theme
          </span>
        </header>



        {/* ── 2FA Card ─────────────────────────────────────────────────────── */}
        <motion.div style={card}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38 }}
        >
          <div style={sectionLabel}>
            <ShieldCheck size={13} color={palette.gold} />
            2FA Authenticator
          </div>

          {/* Secret input */}
          <div style={{ position: "relative", marginBottom: 14 }}>
            <input
              type="text"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Paste your 2FA secret key..."
              style={inputStyle}
            />
            <Lock size={13} color={palette.saffron} style={{
              position: "absolute", right: 13, top: "50%",
              transform: "translateY(-50%)", pointerEvents: "none",
            }} />
          </div>

          {/* Code display box */}
          <div style={{
            background: "linear-gradient(135deg, rgba(255,244,234,0.98) 0%, rgba(255,250,242,0.98) 50%, rgba(236,247,241,0.96) 100%)",
            border: `1.5px solid ${palette.borderSoft}`,
            borderRadius: 22, padding: "20px 18px 16px",
            position: "relative", overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", right: -8, top: -8,
              width: 34, height: 34, transform: "rotate(45deg)", borderRadius: 8, background: "linear-gradient(135deg, rgba(241,200,91,0.22) 0%, rgba(182,60,47,0.18) 100%)",
            }} aria-hidden="true">
            </div>
            {/* Progress bar */}
            <div style={{
              position: "absolute", bottom: 0, left: 0,
              height: 4, width: "100%", background: "rgba(255,255,255,0.72)",
            }}>
              <motion.div
                style={{
                  height: "100%", borderRadius: 2, originX: 0,
                  background: timeLeft < 10
                    ? `linear-gradient(90deg, ${palette.danger} 0%, ${palette.saffron} 100%)`
                    : `linear-gradient(90deg, ${palette.ruby} 0%, ${palette.gold} 55%, ${palette.jade} 100%)`,
                }}
                animate={{ width: `${(timeLeft / 30) * 100}%` }}
                transition={{ duration: 1, ease: "linear" }}
              />
            </div>

            <div style={{ ...microLabel, textAlign: "center", marginBottom: 10 }}>
              Current Code
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={code || "empty"}
                initial={{ opacity: 0, scale: 0.94, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                style={{
                  fontSize: "clamp(36px, 11vw, 50px)",
                  fontWeight: 900, letterSpacing: "0.14em",
                  textAlign: "center", lineHeight: 1, marginBottom: 18,
                  color: !code ? "#c89d7d" : code === "INVALID" ? palette.danger : palette.text,
                  fontVariantNumeric: "tabular-nums",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                {!code ? "000 000"
                  : code === "INVALID" ? "ERROR"
                  : code.match(/.{1,3}/g)?.join(" ")}
              </motion.div>
            </AnimatePresence>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn-primary"
                style={{ ...btnPrimary, flex: 1, opacity: (!code || code === "INVALID") ? 0.35 : 1 }}
                disabled={!code || code === "INVALID"}
                onClick={() => code && code !== "INVALID" && copy(code, setCopied2fa)}
              >
                {copied2fa ? <CheckCircle2 size={13} /> : <Copy size={13} />}
                {copied2fa ? "Copied!" : "Copy Code"}
              </button>
              <div style={{
                fontSize: 12, fontWeight: 900, fontFamily: "'Plus Jakarta Sans', sans-serif",
                padding: "10px 12px",
                background: "rgba(255,255,255,0.82)",
                border: `1.5px solid ${palette.borderSoft}`,
                borderRadius: 14,
                color: timeLeft < 10 ? palette.danger : palette.textSoft,
                flexShrink: 0, textAlign: "center", minWidth: 58,
                transition: "color 0.3s",
              }}>
                {timeLeft}s
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── UID Card ──────────────────────────────────────────────────────── */}
        <motion.div style={card}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: 0.07 }}
        >
          <div style={sectionLabel}>
            <UserSearch size={13} color={palette.jade} />
            UID Lookup
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            <div style={{ position: "relative", flex: "1 1 200px" }}>
              <input
                type="text"
                value={fbUrl}
                onChange={(e) => setFbUrl(e.target.value)}
                placeholder="Paste Facebook URL..."
                style={{ ...inputStyle, paddingRight: 14 }}
                onKeyDown={(e) => e.key === "Enter" && lookupUid()}
              />
            </div>
            <button
              className="btn-primary"
              style={{ ...btnPrimary, opacity: (!fbUrl || loadingUid) ? 0.45 : 1 }}
              onClick={lookupUid}
              disabled={loadingUid || !fbUrl}
            >
              {loadingUid ? <RefreshCw size={13} className="spin" /> : <Zap size={13} />}
              {loadingUid ? "Wait..." : "Lookup"}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {uid ? (
              <motion.div key="res"
                initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                style={{
                  background: "linear-gradient(135deg, rgba(245,251,247,0.96) 0%, rgba(255,247,238,0.94) 100%)",
                  border: "1.5px solid rgba(86, 159, 133, 0.26)",
                  borderRadius: 20, padding: "13px 15px",
                  display: "flex", alignItems: "center", gap: 12,
                }}
              >
                <div style={{
                  width: 42, height: 42, borderRadius: "50%",
                  overflow: "hidden", border: "2px solid rgba(255,255,255,0.82)", flexShrink: 0,
                  boxShadow: "0 10px 20px rgba(47, 143, 116, 0.12)",
                }}>
                  <img src={`https://picsum.photos/seed/${uid}/88/88`} alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ ...microLabel, marginBottom: 3 }}>Numeric ID</div>
                  <div style={{
                    fontSize: 20, fontWeight: 900, letterSpacing: "-0.02em",
                    color: palette.text, fontVariantNumeric: "tabular-nums",
                    fontFamily: "'Plus Jakarta Sans',sans-serif",
                  }}>{uid}</div>
                </div>
                <button className="btn-icon" onClick={() => copy(uid, setCopiedUid)}>
                  {copiedUid ? <CheckCircle2 size={15} color={palette.success} /> : <Copy size={15} />}
                </button>
              </motion.div>
            ) : errorUid ? (
              <motion.div key="err"
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{
                  background: "rgba(255,240,244,0.92)",
                  border: "1.5px solid rgba(255,136,170,0.24)",
                  borderRadius: 18, padding: "11px 14px",
                  display: "flex", alignItems: "flex-start", gap: 8,
                }}
              >
                <AlertCircle size={13} color={palette.danger} style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 11, color: "#dc4c77", lineHeight: 1.55, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                  {errorUid}
                </p>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>

        {/* ── History Card ──────────────────────────────────────────────────── */}
        <motion.div style={card}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: 0.14 }}
        >
          <div style={{
            display: "flex", alignItems: "center",
            justifyContent: "space-between", marginBottom: 14,
          }}>
            <div style={{ ...sectionLabel, marginBottom: 0 }}>
              <History size={13} color={palette.saffron} />
              Recent Lookups
            </div>
            {history.length > 0 && (
              <button className="clear-btn" onClick={() => setHistory([])}>Clear All</button>
            )}
          </div>

          <AnimatePresence initial={false}>
            {history.length > 0 ? history.map((item) => (
              <motion.div key={item.id} layout
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.94) 0%, rgba(255,247,251,0.9) 100%)",
                  border: `1px solid ${palette.borderSoft}`,
                  borderRadius: 18, padding: "10px 12px",
                  display: "flex", alignItems: "center",
                  justifyContent: "space-between", gap: 8, marginBottom: 8,
                  boxShadow: "0 10px 18px rgba(220,173,202,0.09)",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 12, fontWeight: 900, color: palette.text,
                    marginBottom: 2, fontFamily: "monospace",
                    letterSpacing: "0.04em",
                  }}>{item.uid}</div>
                  <div style={{
                    fontSize: 10, color: palette.textSoft,
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    fontFamily: "'Plus Jakarta Sans',sans-serif",
                  }}>{item.url}</div>
                </div>
                <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                  <button className="hist-btn" onClick={() => copy(item.uid, () => {})}>
                    <Copy size={12} />
                  </button>
                  <button className="hist-btn hist-del"
                    onClick={() => setHistory(p => p.filter(h => h.id !== item.id))}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </motion.div>
            )) : (
              <div style={{
                padding: "20px 0", textAlign: "center",
                ...microLabel,
              }}>
                <div style={{ fontSize: 34, marginBottom: 8 }} aria-hidden="true">{"🐶"}</div>
                <div>No lookups yet</div>
                <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: "normal", textTransform: "none", color: palette.textSoft, marginTop: 6 }}>
                  Your recent UID searches will show up here.
                </p>
              </div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <footer style={{ marginTop: 4 }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            padding: "12px 16px",
            background: "rgba(255,255,255,0.74)",
            border: `1.5px solid ${palette.borderSoft}`,
            borderRadius: 18, marginBottom: 12,
            backdropFilter: "blur(10px)",
          }}>
            <Lock size={9} color={palette.success} />
            <span style={{
              fontSize: 9, color: palette.textSoft, fontWeight: 800,
              letterSpacing: "0.08em", fontFamily: "'Plus Jakarta Sans',sans-serif",
            }}>
              Local 2FA generation &bull; No data stored on servers
            </span>
          </div>
          <p style={{
            textAlign: "center", fontSize: 8, color: "#b88da8",
            fontWeight: 900, letterSpacing: "0.28em",
            textTransform: "uppercase", fontFamily: "'Plus Jakarta Sans',sans-serif",
          }}>
            V-Tool Suite &bull; LORN David
          </p>
        </footer>
      </div>

      {/* ── Toast ──────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {(copied2fa || copiedUid) && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 20, x: "-50%" }}
            style={{
              position: "fixed", bottom: 24, left: "50%",
              zIndex: 999, pointerEvents: "none",
              background: palette.primary,
              color: "#fff", padding: "12px 22px", borderRadius: 18,
              display: "flex", alignItems: "center", gap: 8,
              fontSize: 10, fontWeight: 900, letterSpacing: "0.12em",
              textTransform: "uppercase", fontFamily: "'Plus Jakarta Sans',sans-serif",
              boxShadow: "0 16px 30px rgba(255,126,182,0.32)",
            }}
          >
            <CheckCircle2 size={14} />
            Copied to clipboard
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}






