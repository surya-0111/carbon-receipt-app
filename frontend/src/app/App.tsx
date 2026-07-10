import { useState, useRef, useCallback, useEffect } from "react";
import { useReceipt } from "../context/ReceiptContext";
import { useAuth } from "../context/AuthContext";
import { db } from "../imports/firebase";
import confetti from "canvas-confetti";
import { Html5Qrcode } from "html5-qrcode";
import {
  Upload,
  BarChart2,
  FileText,
  Info,
  LogIn,
  UserPlus,
  Leaf,
  Zap,
  ShoppingBag,
  Download,
  ChevronRight,
  Menu,
  X,
  Star,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Github,
  ArrowRight,
  Package,
  Recycle,
  Globe,
  Camera,
  PieChart,
  FileBarChart,
  Lightbulb,
  Send,
  RefreshCw,
  Award,
  Sparkles,
  Printer,
  TrendingUp,
  Search,
  Calendar,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RPieChart,
  Pie,
  Cell,
} from "recharts";

// ─── Types ───────────────────────────────────────────────────────────────────
type Page = "home" | "dashboard" | "reports" | "about" | "login" | "signup";

// ─── Constants ───────────────────────────────────────────────────────────────
const WOOD_DARK = "#4e3629";
const TERRACOTTA = "#8e3020";
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// ─── Mock charts fallback data ───────────────────────────────────────────────
const monthlyData = [
  { month: "Jan", co2: 24.8 },
  { month: "Feb", co2: 20.2 },
  { month: "Mar", co2: 29.4 },
  { month: "Apr", co2: 18.6 },
  { month: "May", co2: 23.6 },
  { month: "Jun", co2: 17.0 },
  { month: "Jul", co2: 14.4 },
];

const categoryData = [
  { name: "Grocery & Food", value: 45, color: "#4e3629" },
  { name: "Dairy Products", value: 25, color: "#8e3020" },
  { name: "Meats & Poultry", value: 20, color: "#a68a64" },
  { name: "Beverages", value: 10, color: "#2a6f97" },
];

const weeklyBarData = [
  { day: "Mon", co2: 4.2 },
  { day: "Tue", co2: 1.6 },
  { day: "Wed", co2: 6.8 },
  { day: "Thu", co2: 2.4 },
  { day: "Fri", co2: 9.4 },
  { day: "Sat", co2: 5.8 },
  { day: "Sun", co2: 3.0 },
];

// ─── Shared Components ────────────────────────────────────────────────────────

function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "text-sm", md: "text-base", lg: "text-xl" };
  return (
    <div className={`flex items-center gap-2 font-bold ${sizes[size]} font-serif text-primary`}>
      <div className="w-6 h-6 bg-primary text-background flex items-center justify-center rounded-none border border-primary">
        <Leaf className="w-3.5 h-3.5" />
      </div>
      <span className="tracking-tight uppercase font-black">The Gazette</span>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const border =
    score >= 75 ? "border-emerald-700 text-emerald-800 bg-emerald-50/50" : score >= 50 ? "border-amber-700 text-amber-800 bg-amber-50/50" : "border-rose-700 text-rose-800 bg-rose-50/50";
  return (
    <span className={`px-2 py-0.5 border font-mono text-[10px] uppercase font-bold rounded-none ${border}`}>
      Eco Score: {score}/100
    </span>
  );
}

// Helper to compute consecutive scanning streak using actual receipt logs
const calculateRealStreak = (receipts: any[]) => {
  if (!receipts || receipts.length === 0) return 0;
  
  const dates = receipts.map((r) => {
    try {
      const d = new Date(r.date);
      if (!isNaN(d.getTime())) {
        return d.toISOString().split("T")[0];
      }
    } catch (e) {}
    return null;
  }).filter(Boolean) as string[];

  const uniqueDates = Array.from(new Set(dates)).sort((a, b) => b.localeCompare(a));
  if (uniqueDates.length === 0) return 0;

  const todayStr = new Date().toISOString().split("T")[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const mostRecent = uniqueDates[0];
  if (mostRecent !== todayStr && mostRecent !== yesterdayStr) {
    return 0;
  }

  let streak = 1;
  let current = new Date(mostRecent);
  
  for (let i = 1; i < uniqueDates.length; i++) {
    const prevDate = new Date(uniqueDates[i]);
    const diffTime = Math.abs(current.getTime() - prevDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      streak++;
      current = prevDate;
    } else if (diffDays > 1) {
      break;
    }
  }
  return streak;
};

// ─── Navigation ───────────────────────────────────────────────────────────────

function Nav({ page, setPage }: { page: Page; setPage: (p: Page) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isLoggedIn, setIsLoggedIn } = useAuth();
  const [stats, setStats] = useState({ points: 150, level: "Sprout Citizen" });

  const fetchStats = async () => {
    if (isLoggedIn) {
      const uStats = await db.getUserStats("current_user");
      setStats({ points: uStats.points, level: uStats.level });
    }
  };

  useEffect(() => {
    fetchStats();
  }, [isLoggedIn, page]);

  const navLinks: { label: string; page: Page }[] = [
    { label: "Front Page", page: "home" },
    { label: "Sustainability Desk", page: "dashboard" },
    { label: "Archives", page: "reports" },
    { label: "Editorial Board", page: "about" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-card border-b border-primary/30 font-sans select-none">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          <button onClick={() => setPage("home")} className="focus:outline-none">
            <Logo size="sm" />
          </button>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((l) => (
              <button
                key={l.page}
                onClick={() => setPage(l.page)}
                className={`text-xs font-bold tracking-widest uppercase transition-colors pb-1 border-b-2 ${
                  page === l.page ? "text-secondary border-secondary" : "text-primary border-transparent hover:text-secondary"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                <div className="bg-background border border-primary/35 px-2.5 py-1 rounded-none text-[10px] font-bold uppercase tracking-wider text-primary">
                  🏆 {stats.points} PTS | {stats.level.toUpperCase()}
                </div>
                <button
                  onClick={() => { setIsLoggedIn(false); setPage("home"); }}
                  className="text-[10px] font-bold text-secondary uppercase border border-secondary px-2.5 py-1 rounded-none hover:bg-secondary hover:text-white transition tracking-widest"
                >
                  Logout
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setPage("login")}
                  className="text-[10px] font-black text-primary uppercase hover:underline tracking-widest"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setPage("signup")}
                  className="text-[10px] font-black text-white bg-primary px-3 py-1.5 rounded-none uppercase hover:opacity-90 transition tracking-widest border border-primary"
                >
                  Subscribe
                </button>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden p-2 text-primary" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-primary/20 py-3 space-y-1 bg-card">
            {navLinks.map((l) => (
              <button
                key={l.page}
                onClick={() => { setPage(l.page); setMenuOpen(false); }}
                className={`w-full text-left px-4 py-2 text-xs font-bold uppercase tracking-wider ${
                  page === l.page ? "bg-accent text-secondary" : "text-primary hover:bg-accent/40"
                }`}
              >
                {l.label}
              </button>
            ))}
            <div className="flex flex-col gap-2 px-4 pt-3 border-t border-primary/20">
              {isLoggedIn ? (
                <>
                  <div className="bg-background border border-primary/30 px-3 py-1.5 text-center text-[10px] font-bold uppercase tracking-wider text-primary">
                    🏆 {stats.points} Pts | {stats.level.toUpperCase()}
                  </div>
                  <button
                    onClick={() => { setIsLoggedIn(false); setPage("home"); setMenuOpen(false); }}
                    className="w-full text-center text-[10px] font-bold text-secondary uppercase border border-secondary py-1.5 rounded-none hover:bg-secondary hover:text-white transition tracking-widest"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { setPage("login"); setMenuOpen(false); }}
                    className="w-full py-1.5 text-center text-[10px] font-bold border border-primary/20 text-primary uppercase hover:bg-accent/50 rounded-none tracking-widest"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => { setPage("signup"); setMenuOpen(false); }}
                    className="w-full py-1.5 text-center text-[10px] font-bold bg-secondary text-white uppercase rounded-none tracking-widest"
                  >
                    Subscribe
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

// ─── Footer Component ─────────────────────────────────────────────────────────

function Footer({ setPage }: { setPage: (p: Page) => void }) {
  return (
    <footer className="bg-card border-t-2 border-double border-primary/40 mt-12 font-sans select-none">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <Logo size="sm" />
            <p className="text-[10px] text-muted-foreground mt-2 max-w-xs font-serif italic text-justify leading-relaxed">
              An independent sustainability journal monitoring consumer carbon footprinting and promoting local ecological alternatives.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-[9px] font-bold uppercase text-muted-foreground tracking-widest">
            {(["about", "home"] as Page[]).map((p) => (
              <button key={p} onClick={() => setPage(p)} className="hover:text-secondary transition-colors">
                {p === "home" ? "Contact Desk" : "About the Gazette"}
              </button>
            ))}
            <a href="#" className="hover:text-secondary">Privacy Policy</a>
            <a href="#" className="hover:text-secondary">Subscription Terms</a>
          </div>
          <a href="https://github.com" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-secondary transition-colors">
            <Github className="w-4 h-4" />
          </a>
        </div>
        <div className="mt-8 pt-5 border-t border-primary/20 text-center text-[9px] text-muted-foreground font-serif uppercase tracking-widest">
          © 2026 The Carbon Footprint Gazette. Printed Digitally. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}

// ─── Camera Scanner Component ───────────────────────────────────────────────

function CameraScanner({ onCapture, onCancel }: { onCapture: (file: File) => void; onCancel: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState("");

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (err) {
      console.error(err);
      setError("Webcam access denied. Please allow camera permissions or upload a receipt file.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const handleSnap = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `receipt_${Date.now()}.jpg`, { type: "image/jpeg" });
            onCapture(file);
          }
        }, "image/jpeg");
      }
    }
  };

  return (
    <div className="flex flex-col items-center bg-card rounded-none p-5 border border-primary/20 text-center select-none">
      <h3 className="text-sm font-bold mb-4 font-serif text-primary uppercase tracking-wider">[ Receipt viewfinder Lens ]</h3>
      {error ? (
        <div className="text-red-800 text-xs text-center p-3 bg-red-50 border border-red-200 rounded-none max-w-sm font-sans">
          <AlertCircle className="w-5 h-5 mx-auto mb-2 text-red-600" />
          {error}
        </div>
      ) : (
        <div className="relative w-full max-w-xs aspect-[3/4] bg-black rounded-none overflow-hidden border border-primary shadow-sm">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          <div className="absolute inset-4 border border-dashed border-white/50 pointer-events-none flex items-center justify-center">
            <span className="text-[9px] text-white bg-black/70 px-2 py-0.5 rounded-none font-mono uppercase tracking-widest">Receipt Guide</span>
          </div>
        </div>
      )}
      <div className="flex gap-4 mt-5 font-sans">
        <button onClick={onCancel} className="px-4 py-1.5 border border-primary/30 rounded-none text-[10px] font-bold text-primary bg-background uppercase tracking-wider">
          Cancel
        </button>
        {!error && (
          <button onClick={handleSnap} className="px-4 py-1.5 bg-secondary text-white rounded-none text-[10px] font-bold uppercase hover:opacity-90 flex items-center gap-1.5 shadow-sm border border-secondary">
            <Camera className="w-3.5 h-3.5" /> Snap Photo
          </button>
        )}
      </div>
    </div>
  );
}

// ─── QR Scanner Component ───────────────────────────────────────────────────

function QrScanner({ onScan, onCancel }: { onScan: (text: string) => void; onCancel: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setError("");
      processQrFile(f);
    }
  };

  const processQrFile = (file: File) => {
    setScanning(true);
    let container = document.getElementById("qr-reader-dummy");
    if (!container) {
      container = document.createElement("div");
      container.id = "qr-reader-dummy";
      container.style.display = "none";
      document.body.appendChild(container);
    }

    const html5QrCode = new Html5Qrcode("qr-reader-dummy");
    html5QrCode.scanFile(file, true)
      .then((decodedText) => {
        setScanning(false);
        onScan(decodedText);
      })
      .catch((err) => {
        console.error(err);
        setScanning(false);
        setError("Decoding failure. Please select a clear QR code image.");
      });
  };

  return (
    <div className="flex flex-col items-center bg-card rounded-none p-5 border border-primary/20 text-center select-none font-serif">
      <h3 className="text-sm font-bold mb-1.5 text-primary uppercase tracking-wider">[ QR bulletin reader ]</h3>
      <p className="text-xs text-muted-foreground max-w-xs mb-5 font-serif italic">
        Import e-receipt data instantly by uploading receipt QR code graphics.
      </p>
      
      <div 
        onClick={() => inputRef.current?.click()}
        className="w-full max-w-xs border border-dashed border-primary/30 rounded-none p-6 bg-background cursor-pointer hover:bg-muted/30 transition flex flex-col items-center gap-3"
      >
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        {scanning ? (
          <div className="flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 text-primary animate-spin" />
            <p className="text-[9px] font-bold font-sans uppercase text-muted-foreground tracking-wider">Decoding QR Code...</p>
          </div>
        ) : file ? (
          <div className="text-[10px]">
            <CheckCircle className="w-6 h-6 text-emerald-700 mx-auto mb-1.5" />
            <p className="font-mono font-bold text-gray-700">{file.name}</p>
            <p className="text-muted-foreground mt-1 uppercase text-[8px] font-sans font-bold">Select another image</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-gray-500 font-sans">
            <Upload className="w-6 h-6 text-muted-foreground" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Browse QR Image</p>
            <p className="text-[9px] text-muted-foreground italic font-serif">PNG, JPG, JPEG formats</p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 text-red-800 text-[10px] bg-red-50 border border-red-200 rounded-none p-2 max-w-xs flex items-center gap-1 justify-center">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" /> {error}
        </div>
      )}

      <div className="flex gap-4 mt-5 font-sans">
        <button onClick={onCancel} className="px-4 py-1.5 border border-primary/30 rounded-none text-[10px] font-bold text-primary bg-background uppercase tracking-wider">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── AI Chatbot Component ───────────────────────────────────────────────────

function EcoChatbot({ receiptContext }: { receiptContext?: { items: any[]; total_carbon: number } }) {
  const [messages, setMessages] = useState<{ sender: "user" | "bot"; text: string }[]>([
    { sender: "bot", text: "Welcome to the Editorial Desk of The Carbon Footprint Gazette. I am your Eco-Editor. Ask me anything about sustainable living, receipt alternatives, or carbon footprints!" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input;
    setInput("");
    setMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          history: messages.map((m) => ({ role: m.sender === "user" ? "user" : "assistant", content: m.text })),
          receipt_context: receiptContext || null
        })
      });
      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => [...prev, { sender: "bot", text: data.response }]);
      } else {
        throw new Error("Chat failed");
      }
    } catch (err) {
      console.error(err);
      let reply = "I apologize, but I couldn't reach the newsroom database. Please check if the FastAPI backend is running! Generally, substituting meat/dairy for plant protein (like Tofu or Soy Milk) cuts receipt carbon by over 60%.";
      if (userText.toLowerCase().includes("milk")) {
        reply = "Dairy milk emits about 3.2 kg CO₂ per liter due to cattle methane release. Swapping to Soy Milk reduces this to ~1.2 kg CO₂ (a saving of 2.0 kg CO₂!). Oat and Almond milk are also excellent options.";
      } else if (userText.toLowerCase().includes("chicken") || userText.toLowerCase().includes("tofu")) {
        reply = "Chicken has a carbon footprint of roughly 6.9 kg CO₂ per kg. Tofu emits only 1.5 kg CO₂ per kg. Swapping chicken with tofu on your receipts yields a massive 4.8 kg CO₂ saving!";
      } else if (userText.toLowerCase().includes("recipe")) {
        reply = "Here is a quick Eco-Editor stir-fry recipe: Sauté 200g of cubed tofu with fresh local ginger, garlic, tomatoes, and vegetables. Serve over steamed millets or local rice. Delicious and emits under 1.0 kg CO₂ total!";
      }
      setMessages((prev) => [...prev, { sender: "bot", text: reply }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-card border border-primary/30 rounded-none p-4 font-serif shadow-sm">
      <div className="newspaper-masthead text-center py-2 mb-3">
        <h3 className="text-sm font-bold tracking-tight uppercase flex items-center justify-center gap-1.5 text-primary">
          <Sparkles className="w-3.5 h-3.5 text-secondary" /> Editorial Desk: Ask the Editor
        </h3>
        <p className="text-[8px] text-muted-foreground italic uppercase tracking-widest mt-0.5">Resolving Reader Inquiries on Sourcing</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-4 text-xs scrollbar-thin">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
            <div 
              className={`max-w-[85%] rounded-none border p-3 leading-relaxed ${
                msg.sender === "user" 
                  ? "bg-primary border-primary text-primary-foreground font-sans" 
                  : "bg-background border-primary/20 text-foreground font-serif"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-background border border-primary/20 rounded-none p-3 text-muted-foreground italic flex items-center gap-2">
              <RefreshCw className="w-3 h-3 animate-spin" /> Editor typing...
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2 font-sans">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the editor a question..."
          className="flex-1 px-3 py-2 bg-background border border-primary/30 rounded-none text-xs text-foreground focus:border-primary focus:outline-none"
        />
        <button 
          type="submit" 
          disabled={loading || !input.trim()}
          className="px-4 bg-primary border border-primary text-background rounded-none hover:bg-secondary hover:border-secondary transition disabled:opacity-50 flex items-center justify-center shadow-sm"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}

// ─── Upload Drop Zone ─────────────────────────────────────────────────────────

function UploadZone({ onScanResult }: { onScanResult: (data: any) => void }) {
  const [dragging, setDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [scanMode, setScanMode] = useState<"file" | "camera" | "qr">("file");
  const { uploaded, setUploaded, setReceiptItems, setTotalCarbon, setDone } = useReceipt();
  const { isLoggedIn } = useAuth();

  const inputRef = useRef<HTMLInputElement>(null);

  const awardPoints = async (itemCount: number) => {
    if (!isLoggedIn) return;
    try {
      const stats = await db.getUserStats("current_user");
      const basePoints = 50;
      const itemPoints = itemCount * 10;
      const earned = basePoints + itemPoints;
      const newPoints = stats.points + earned;
      
      let newLevel = "Sprout Citizen";
      if (newPoints >= 2000) newLevel = "Earth Guardian";
      else if (newPoints >= 1000) newLevel = "Forest Guardian";
      else if (newPoints >= 500) newLevel = "Eco Warrior";
      else if (newPoints >= 200) newLevel = "Green Advocate";

      const todayStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      const newReceiptLog = {
        id: `RPT-${Date.now()}`,
        date: todayStr,
        store: uploaded ? uploaded.replace(/\.[^/.]+$/, "") : "Local Sourced Groceries",
        items: itemCount,
        totalCo2: 12.0,
        score: 75
      };

      await db.saveReceipt("current_user", newReceiptLog);
      
      const receipts = await db.getReceipts("current_user");
      const realStreak = calculateRealStreak(receipts);

      const updated = {
        ...stats,
        points: newPoints,
        level: newLevel,
        streak: realStreak,
        lastScanDate: new Date().toISOString()
      };
      await db.saveUserStats("current_user", updated);

      const leaderboard = await db.getLeaderboard();
      const updatedLeaderboard = leaderboard.map((user: any) => {
        if (user.name === "You" || user.name === "You (Suriya)") {
          return { ...user, points: newPoints, level: newLevel };
        }
        return user;
      });
      localStorage.setItem("leaderboard", JSON.stringify(updatedLeaderboard));

      confetti({
        particleCount: 100,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleFile = useCallback(async (file: File) => {
    if (!file) return;

    setUploaded(file.name);
    setAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      setReceiptItems(data.items);
      setTotalCarbon(data.total_carbon);
      setDone(true);
      
      await awardPoints(data.items.length);
      onScanResult(data);
    } catch (error) {
      console.error(error);
      alert("Failed to analyze receipt. Verify if FastAPI backend is running.");
    } finally {
      setAnalyzing(false);
    }
  }, [isLoggedIn, onScanResult, uploaded]);

  const handleQrScan = async (decodedText: string) => {
    try {
      const data = JSON.parse(decodedText);
      if (data.items && data.total_carbon !== undefined) {
        setUploaded("QR Code Receipt");
        setReceiptItems(data.items);
        setTotalCarbon(data.total_carbon);
        setDone(true);
        await awardPoints(data.items.length);
        onScanResult(data);
      } else {
        throw new Error("Invalid format");
      }
    } catch (e) {
      console.error(e);
      alert("Decoded data is not a valid Carbon Receipt QR payload.");
    }
  };

  if (scanMode === "camera") {
    return <CameraScanner onCapture={(f) => { handleFile(f); setScanMode("file"); }} onCancel={() => setScanMode("file")} />;
  }

  if (scanMode === "qr") {
    return <QrScanner onScan={(txt) => { handleQrScan(txt); setScanMode("file"); }} onCancel={() => setScanMode("file")} />;
  }

  return (
    <div className="flex flex-col gap-4 font-sans text-xs select-none">
      <div className="flex justify-center gap-2">
        <button 
          onClick={() => setScanMode("file")} 
          className={`px-3 py-1.5 rounded-none border border-primary text-[9px] font-bold uppercase tracking-wider transition ${scanMode === "file" ? "bg-primary text-background" : "bg-card text-primary hover:bg-muted/40"}`}
        >
          Upload Printout
        </button>
        <button 
          onClick={() => setScanMode("camera")} 
          className={`px-3 py-1.5 rounded-none border border-primary text-[9px] font-bold uppercase tracking-wider transition flex items-center gap-1 ${scanMode === "camera" ? "bg-primary text-background" : "bg-card text-primary hover:bg-muted/40"}`}
        >
          <Camera className="w-3 h-3" /> Live Lens
        </button>
        <button 
          onClick={() => setScanMode("qr")} 
          className={`px-3 py-1.5 rounded-none border border-primary text-[9px] font-bold uppercase tracking-wider transition flex items-center gap-1 ${scanMode === "qr" ? "bg-primary text-background" : "bg-card text-primary hover:bg-muted/40"}`}
        >
          <Sparkles className="w-3 h-3" /> QR Reader
        </button>
      </div>

      <div
        className={`border border-dashed rounded-none p-8 flex flex-col items-center gap-3 transition cursor-pointer ${
          dragging ? "border-secondary bg-muted" : "border-primary/30 bg-card hover:border-secondary hover:bg-muted/20"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        onClick={() => inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

        {analyzing ? (
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="w-8 h-8 border-2 border-muted border-t-secondary animate-spin rounded-none" />
            <p className="font-semibold text-primary uppercase text-[10px] tracking-wider">Analyzing {uploaded}…</p>
            <p className="text-[9px] text-muted-foreground font-serif italic">Calculating lifecycle emissions from printout logs</p>
          </div>
        ) : (
          <>
            <div className="w-10 h-10 bg-muted flex items-center justify-center text-primary border border-primary/20 rounded-none">
              <Upload className="w-5 h-5" />
            </div>
            <div className="text-center font-serif">
              <p className="font-bold text-primary uppercase tracking-tight text-xs">Drop Shopping Receipt Copy Here</p>
              <p className="text-[9px] text-muted-foreground mt-0.5 font-sans uppercase font-bold tracking-wider">Supports JPG, PNG, PDF</p>
            </div>
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 border border-primary/30 bg-background text-[9px] font-bold uppercase tracking-widest text-primary shadow-sm hover:bg-muted/40 rounded-none"
              onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
            >
              <FileText className="w-3.5 h-3.5 text-secondary" />
              Browse Files
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Carbon Calculator Component ──────────────────────────────────────────────

function CarbonCalculator() {
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState("beef");
  const [weight, setWeight] = useState(1.0);
  const [items, setItems] = useState<{ name: string; category: string; weight: number; carbon: number; alternative: string; saving: number }[]>([]);

  const categories: Record<string, { label: string; carbon: number; alternative: string; saving: number }> = {
    beef: { label: "Beef / Lamb / Pork Slices", carbon: 27.0, alternative: "Tofu / Lentil Burger", saving: 25.5 },
    poultry: { label: "Chicken / Turkey cuts", carbon: 6.9, alternative: "Tofu cubes / Tempeh", saving: 5.4 },
    seafood: { label: "Fish / Shrimp Sourcing", carbon: 5.4, alternative: "Seaweed / Plant-based fillet", saving: 3.9 },
    dairy: { label: "Milk / Cheese / Butter", carbon: 3.2, alternative: "Soy Milk / Oat Milk", saving: 2.0 },
    egg: { label: "Eggs Carton", carbon: 4.5, alternative: "Plant-based scramble egg", saving: 3.1 },
    grain: { label: "Rice / Bread / Pasta grains", carbon: 2.5, alternative: "Millets / Organic Quinoa", saving: 1.5 },
    veg: { label: "Vegetables (General)", carbon: 0.8, alternative: "Local Organic Greens", saving: 0.4 },
    fruit: { label: "Fruits (General)", carbon: 0.6, alternative: "Local Seasonal Produce", saving: 0.3 },
    beverage: { label: "Soda / Coffee / Beverages", carbon: 1.5, alternative: "Filter Tap Water / Green Tea", saving: 1.0 }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const catInfo = categories[category];
    const itemCarbon = catInfo.carbon * weight;
    const itemSaving = catInfo.saving * weight;
    setItems((prev) => [
      ...prev,
      {
        name: itemName.trim() || catInfo.label,
        category,
        weight,
        carbon: itemCarbon,
        alternative: catInfo.alternative,
        saving: itemSaving
      }
    ]);
    setItemName("");
    setWeight(1.0);
  };

  const totalCarbon = items.reduce((sum, item) => sum + item.carbon, 0);
  const totalSavings = items.reduce((sum, item) => sum + item.saving, 0);

  return (
    <div className="bg-card border border-primary/30 rounded-none p-5 font-serif shadow-sm">
      <h3 className="text-sm font-bold uppercase text-primary border-b border-primary/20 pb-1.5 mb-4 text-center tracking-wider">
        [ Sourcing Emission Calculator ]
      </h3>
      <form onSubmit={handleAdd} className="space-y-3.5 text-xs font-sans">
        <div>
          <label className="block font-bold text-primary mb-1 uppercase text-[9px] tracking-widest">Item Description (Optional)</label>
          <input
            type="text"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="e.g. Grass-fed Steak"
            className="w-full px-2.5 py-1.5 bg-background border border-primary/35 rounded-none text-xs text-foreground focus:border-primary focus:outline-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block font-bold text-primary mb-1 uppercase text-[9px] tracking-widest">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-background border border-primary/35 rounded-none text-xs text-foreground focus:border-primary focus:outline-none"
            >
              {Object.entries(categories).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-bold text-primary mb-1 uppercase text-[9px] tracking-widest">Weight (kg)</label>
            <input
              type="number"
              step="0.05"
              min="0.05"
              value={weight}
              onChange={(e) => setWeight(parseFloat(e.target.value) || 0.1)}
              className="w-full px-2.5 py-1.5 bg-background border border-primary/35 rounded-none text-xs text-foreground focus:border-primary focus:outline-none"
            />
          </div>
        </div>
        <button type="submit" className="w-full py-2 bg-primary border border-primary text-background font-bold uppercase rounded-none hover:bg-secondary hover:border-secondary transition tracking-widest text-[9px]">
          Add To Virtual Cart
        </button>
      </form>

      {items.length > 0 && (
        <div className="mt-5 border-t border-primary/20 pt-4">
          <div className="flex justify-between items-center mb-2 font-serif">
            <h4 className="font-bold text-xs text-primary uppercase tracking-tight">[ Virtual Slip ]</h4>
            <button onClick={() => setItems([])} className="text-[9px] text-secondary hover:underline uppercase font-sans font-bold tracking-widest">Clear All</button>
          </div>
          
          {/* Classic Thermal Receipt Styled Virtual Cart */}
          <div className="bg-white border-2 border-black/15 p-4 rounded-none text-black font-mono text-[10px] shadow-sm max-w-xs mx-auto select-none">
            <div className="text-center mb-2 font-bold uppercase">
              <p className="text-xs">*** ESTIMATE SLIP ***</p>
              <p className="text-[8px] tracking-wider mt-0.5">THE CARBON GAZETTE DESK</p>
              <div className="border-t border-dashed border-black/35 my-1.5" />
            </div>
            <div className="space-y-1">
              {items.map((it, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>{it.name.toUpperCase().substring(0, 18)} ({it.weight}KG)</span>
                  <span>{it.carbon.toFixed(1)} KG</span>
                </div>
              ))}
            </div>
            <div className="border-t border-dashed border-black/35 my-2" />
            <div className="flex justify-between font-bold text-xs">
              <span>TOTAL CARBON</span>
              <span>{totalCarbon.toFixed(1)} KG</span>
            </div>
            <div className="flex justify-between text-emerald-800 font-bold">
              <span>SAVINGS POTENTIAL</span>
              <span>-{totalSavings.toFixed(1)} KG</span>
            </div>
            <div className="border-t border-dashed border-black/35 my-2" />
            <p className="text-[8px] text-center italic text-gray-500 leading-normal">
              * Swap estimations represent replacing animal proteins with organic millets & legumes.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE: HOME
// ═══════════════════════════════════════════════════════════════════════════════

function HomePage({ setPage }: { setPage: (p: Page) => void }) {
  return (
    <div className="max-w-6xl mx-auto px-6 py-6 select-none font-serif">
      {/* Newspaper Header Masthead */}
      <div className="newspaper-masthead text-center select-text">
        <h1 className="text-4xl md:text-6xl font-serif font-black uppercase tracking-tighter text-primary">
          THE CARBON FOOTPRINT GAZETTE
        </h1>
        <div className="flex justify-between items-center border-y-2 border-double border-primary/40 py-2 mt-4 text-[9px] uppercase font-bold tracking-widest text-muted-foreground font-sans">
          <span>Vol. CIV No. 192</span>
          <span>Chennai, Friday, July 10, 2026</span>
          <span>Price: ₹5.00 Digital</span>
        </div>
      </div>

      {/* Hero Layout */}
      <section className="grid md:grid-cols-3 gap-8 py-8 items-start border-b border-primary/20">
        {/* Left Columns (Editorial Summary) */}
        <div className="md:col-span-2 space-y-4 border-r border-primary/20 md:pr-8 text-justify">
          <div className="inline-flex items-center gap-1 bg-secondary/15 border border-secondary/35 text-secondary text-[8px] font-bold px-2 py-0.5 rounded-none uppercase font-sans tracking-widest">
            Special Sustainability Dispatch
          </div>
          <h2 className="text-2xl md:text-3xl font-serif font-black text-primary leading-tight uppercase tracking-tight">
            How Much Carbon is Hidden Inside Your Weekly Grocery Receipt?
          </h2>
          <p className="text-foreground leading-relaxed text-sm">
            <span className="float-left text-4xl font-serif font-bold text-secondary mr-2 line-height-none">C</span>
            onsumer products represent over 60% of global greenhouse emissions. Yet, carbon values remain opaque on standard receipts. The Gazette’s AI-powered analyzer extracts purchase logs and calculates immediate lifecycle footprint statistics to help shoppers choose ecological alternatives.
          </p>
          <div className="flex flex-wrap gap-3 pt-3 font-sans">
            <button
              onClick={() => setPage("dashboard")}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary border border-primary text-background text-[10px] font-bold uppercase rounded-none shadow-sm hover:bg-secondary hover:border-secondary transition tracking-widest"
            >
              <Upload className="w-3.5 h-3.5" /> Sustainability Desk
            </button>
            <button 
              onClick={() => setPage("reports")}
              className="flex items-center gap-1 px-4 py-2 border border-primary/45 bg-card text-primary text-[10px] font-bold uppercase rounded-none hover:bg-muted/40 transition tracking-widest"
            >
              Log Archives
              <ChevronRight className="w-3.5 h-3.5 text-secondary" />
            </button>
          </div>
        </div>

        {/* Right Column: Cartoon Feature Box */}
        <div className="bg-card border-4 border-double border-primary/30 p-5 rounded-none space-y-4 select-text">
          <h3 className="font-serif font-bold text-sm text-primary border-b border-primary/20 pb-2 uppercase tracking-wide">
            [ Weekly Carbon Bulletin ]
          </h3>
          <div className="aspect-[4/3] bg-muted/40 rounded-none flex items-center justify-center p-4 border border-primary/25 relative overflow-hidden">
            <div className="text-center font-serif z-10">
              <Leaf className="w-10 h-10 mx-auto text-primary mb-2 animate-pulse" />
              <p className="text-xl font-black text-secondary uppercase">2.4 Tons CO₂</p>
              <p className="text-[8px] font-sans font-bold uppercase tracking-wider text-muted-foreground mt-1">Avg. Indian Household Sourcing</p>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-background/70 to-transparent" />
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed font-serif italic">
            "An average citizen can eliminate up to 45% of grocery emissions simply by substituting beef, dairy, and heavy logistics products for locally sourced organic grains."
          </p>
        </div>
      </section>

      {/* Highlights / Features Row */}
      <section className="grid md:grid-cols-3 gap-8 py-8 border-b border-primary/20">
        {[
          {
            title: "Camera Receipt Lens",
            desc: "Open the live camera lens, snap a clear picture of your store receipt, and immediately load items for analysis.",
            icon: <Camera className="w-4 h-4 text-secondary" />
          },
          {
            title: "QR Code e-Receipts",
            desc: "Read generated digital QR receipt graphics to load inventory and calculate greenhouse footprint indices without manual paper.",
            icon: <FileText className="w-4 h-4 text-secondary" />
          },
          {
            title: "Gamification & Green Rewards",
            desc: "Accumulate eco points for sustainable swaps, complete weekly check-in streaks, and redeem coupons for eco-vouchers.",
            icon: <Award className="w-4 h-4 text-secondary" />
          }
        ].map((f) => (
          <div key={f.title} className="space-y-2 border-r border-primary/10 last:border-none md:pr-4">
            <div className="w-8 h-8 rounded-none bg-muted flex items-center justify-center text-primary border border-primary/20 shadow-sm">
              {f.icon}
            </div>
            <h3 className="font-serif font-bold text-sm uppercase tracking-wide text-primary mt-3">{f.title}</h3>
            <p className="text-[10px] text-muted-foreground leading-relaxed font-serif italic text-justify">{f.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE: DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════

interface DashboardPageProps {
  setPage: (p: Page) => void;
  initialTab?: "scan" | "archives";
}

function DashboardPage({ setPage, initialTab = "scan" }: DashboardPageProps) {
  const { receiptItems, totalCarbon, uploaded, done, setDone, setReceiptItems, setTotalCarbon, setUploaded } = useReceipt();
  const [activeTab, setActiveTab] = useState<"scan" | "archives" | "rewards" | "calculator" | "chat">(initialTab);
  
  const [userStats, setUserStats] = useState({ points: 150, streak: 2, level: "Sprout Citizen", challenges: [] as any[] });
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [myReceipts, setMyReceipts] = useState<any[]>([]);
  const [myRewards, setMyRewards] = useState<any[]>([]);
  const [summaryBrief, setSummaryBrief] = useState("");
  const [loadingSummary, setLoadingSummary] = useState(false);

  const [dailyTasks, setDailyTasks] = useState([
    { id: "T1", label: "Scan 1 Grocery Receipt print copy", points: 50, done: false },
    { id: "T2", label: "Substitute dairy/beef for legume alternatives", points: 30, done: false },
    { id: "T3", label: "Consult the Eco-Editor Chatbot about carbon values", points: 20, done: false },
    { id: "T4", label: "Calculate custom food emissions on the Estimator", points: 20, done: false }
  ]);

  const handleCompleteTask = async (taskId: string) => {
    setDailyTasks((prev) =>
      prev.map((task) => {
        if (task.id === taskId && !task.done) {
          const earned = task.points;
          const newPoints = userStats.points + earned;

          let newLevel = "Sprout Citizen";
          if (newPoints >= 2000) newLevel = "Earth Guardian";
          else if (newPoints >= 1000) newLevel = "Forest Guardian";
          else if (newPoints >= 500) newLevel = "Eco Warrior";
          else if (newPoints >= 200) newLevel = "Green Advocate";

          const updatedStats = { ...userStats, points: newPoints, level: newLevel };
          setUserStats(updatedStats);

          db.saveUserStats("current_user", updatedStats).then(() => {
            db.getLeaderboard().then((leaders) => {
              const updatedLeaderboard = leaders.map((u: any) => {
                if (u.name === "You" || u.name === "You (Suriya)") {
                  return { ...u, points: newPoints, level: newLevel };
                }
                return u;
              }).sort((a: any, b: any) => b.points - a.points);
              setLeaderboard(updatedLeaderboard);
            });
          });

          confetti({
            particleCount: 80,
            spread: 50,
            origin: { y: 0.6 }
          });

          return { ...task, done: true };
        }
        return task;
      })
    );
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);

  const fetchUserData = async () => {
    const stats = await db.getUserStats("current_user");
    const receipts = await db.getReceipts("current_user");
    const rewards = await db.getUserRewards("current_user");
    const leaders = await db.getLeaderboard();

    const realStreak = calculateRealStreak(receipts);
    
    const updatedStats = { ...stats, streak: realStreak };
    await db.saveUserStats("current_user", updatedStats);

    setUserStats(updatedStats);
    setMyReceipts(receipts);
    setMyRewards(rewards);

    const updatedLeaderboard = leaders.map((u: any) => {
      if (u.name === "You" || u.name === "You (Suriya)") {
        return { ...u, points: stats.points, level: stats.level };
      }
      return u;
    }).sort((a: any, b: any) => b.points - a.points);
    setLeaderboard(updatedLeaderboard);
  };

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    fetchUserData();
  }, [activeTab, done]);

  const generateSummary = async (items: any[], carbon: number) => {
    if (items.length === 0) return;
    setLoadingSummary(true);
    try {
      const res = await fetch(`${API_BASE}/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, total_carbon: carbon })
      });
      if (res.ok) {
        const data = await res.json();
        setSummaryBrief(data.summary);
      } else {
        throw new Error("API failed");
      }
    } catch (e) {
      console.error(e);
      const savings = items.reduce((sum, i) => sum + (i.saving || 0), 0);
      const topItem = [...items].sort((a, b) => b.carbon - a.carbon)[0];
      const percent = Math.round((savings / (carbon || 1)) * 100);
      setSummaryBrief(`This grocery trip produced an estimated ${carbon.toFixed(1)} kg CO₂. The leading carbon contributor was "${topItem?.name || "Unknown Item"}" (${topItem?.carbon || 0} kg CO₂). By swapping dairy and animal products for suggested local alternatives (such as replacing ${topItem?.name} with ${topItem?.alternative}), you could reduce your carbon footprint by ${savings.toFixed(1)} kg CO₂ (a decrease of ${percent}%). This saving is equivalent to the carbon absorbed by ${((savings * 0.1) || 0.1).toFixed(2)} mature trees in a year.`);
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleScanSuccess = (data: any) => {
    generateSummary(data.items, data.total_carbon);
  };

  const handleRedeem = async (reward: { id: string; title: string; cost: number }) => {
    if (userStats.points < reward.cost) {
      alert("Insufficient eco-points for this reward.");
      return;
    }

    try {
      const newPoints = userStats.points - reward.cost;
      const updatedStats = { ...userStats, points: newPoints };
      await db.saveUserStats("current_user", updatedStats);
      await db.addReward("current_user", { title: reward.title, code: `ECO-${Math.floor(1000 + Math.random() * 9000)}` });
      
      const leaderboardList = await db.getLeaderboard();
      const updatedLeaderboard = leaderboardList.map((user: any) => {
        if (user.name === "You" || user.name === "You (Suriya)") {
          return { ...user, points: newPoints };
        }
        return user;
      });
      localStorage.setItem("leaderboard", JSON.stringify(updatedLeaderboard));

      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.5 }
      });
      
      alert(`🎉 Successfully redeemed "${reward.title}"! Voucher saved to archives.`);
      fetchUserData();
    } catch (err) {
      console.error(err);
    }
  };

  const calculateTotalSavings = () => {
    return receiptItems.reduce((acc, curr) => acc + (curr.saving || 0), 0);
  };

  const filteredReceipts = myReceipts.filter((receipt) => {
    const matchesSearch = receipt.store.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMonth = selectedMonth ? receipt.date.includes(selectedMonth) : true;
    return matchesSearch && matchesMonth;
  });

  return (
    <div className="max-w-6xl mx-auto px-6 py-6 select-none font-serif">
      {/* Title */}
      <div className="text-center mb-6 border-b border-primary/30 pb-3">
        <h1 className="text-xl md:text-2xl font-black text-primary uppercase tracking-tight">
          {activeTab === "archives" ? "THE GAZETTE DIGITAL ARCHIVES" : "THE ACTIVE SUSTAINABILITY DESK"}
        </h1>
        <p className="text-[10px] text-muted-foreground uppercase font-sans font-bold tracking-widest mt-1">
          {activeTab === "archives" ? "Historical Sourcing Logs & Analytics Database" : "Receipt Scanning, Challenges, & Green Estimator"}
        </p>
      </div>

      {/* Tabs list styled like newspaper sections */}
      <div className="flex flex-wrap gap-2 mb-6 border-y border-primary/20 py-2 text-[10px] font-bold uppercase font-sans">
        {[
          { id: "scan", label: "Scanner & Active Receipt", icon: <Upload className="w-3 h-3" /> },
          { id: "calculator", label: "Green Calculator", icon: <BarChart2 className="w-3 h-3" /> },
          { id: "rewards", label: "Challenges & Rank", icon: <Award className="w-3 h-3" /> },
          { id: "chat", label: "Ask the Editor", icon: <Sparkles className="w-3 h-3" /> },
          { id: "archives", label: "Logs Archives", icon: <FileText className="w-3 h-3" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as any); setSelectedReceipt(null); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 border border-primary/30 rounded-none transition font-sans ${
              activeTab === tab.id
                ? "bg-primary text-background border-primary"
                : "bg-card text-primary hover:bg-muted/40"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Render Active Tab */}
      {activeTab === "scan" && (
        <div className="grid md:grid-cols-3 gap-8 items-start">
          {/* Main workspace */}
          <div className="md:col-span-2 space-y-6 border-r border-primary/15 md:pr-8">
            <UploadZone onScanResult={handleScanSuccess} />
            
            {done && receiptItems.length > 0 && (
              <div className="mt-6">
                {/* Classic Thermal Whitepaper Receipt */}
                <div className="bg-white border-2 border-black/15 p-6 shadow-md max-w-sm mx-auto text-black font-mono text-[10px] relative select-none">
                  {/* Scissor cuts indicator */}
                  <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-b from-gray-200/80 to-transparent pointer-events-none" />
                  <div className="text-center font-bold mb-4 uppercase tracking-tighter">
                    <p className="text-xs">*** e-RECEIPT ANALYZED ***</p>
                    <p className="text-[8px] tracking-widest mt-0.5">THE CARBON GAZETTE DESK</p>
                    <div className="border-t border-dashed border-black/35 my-2" />
                    <div className="text-left font-normal text-[9px] space-y-0.5">
                      <p>STORE : {uploaded ? uploaded.replace(/\.[^/.]+$/, "").toUpperCase() : "GENERAL GROCERY"}</p>
                      <p>DATE  : {new Date().toLocaleDateString("en-US", { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute:'2-digit' })}</p>
                      <p>TICKET: #{Math.floor(200000 + Math.random() * 700000)}</p>
                    </div>
                    <div className="border-b-2 border-double border-black/35 my-2" />
                  </div>

                  {/* Items Table */}
                  <table className="w-full text-[10px] font-mono mb-4">
                    <thead>
                      <tr className="border-b border-dashed border-black/35 text-left uppercase text-[9px] font-bold">
                        <th className="pb-1.5">ITEM DESCRIPTION</th>
                        <th className="pb-1.5 text-right">PRICE</th>
                        <th className="pb-1.5 text-right">CO₂ (KG)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receiptItems.map((item, idx) => (
                        <tr key={idx} className="align-top">
                          <td className="py-1 uppercase">{item.name}</td>
                          <td className="py-1 text-right">₹{item.price.toFixed(2)}</td>
                          <td className="py-1 text-right">{item.carbon.toFixed(1)}</td>
                        </tr>
                      ))}
                      <tr className="border-t border-dashed border-black/35 font-bold text-xs">
                        <td className="pt-2 uppercase text-[9px]">TOTAL EMISSIONS</td>
                        <td className="pt-2 text-right"></td>
                        <td className="pt-2 text-right">{totalCarbon.toFixed(1)} kg</td>
                      </tr>
                      <tr className="text-emerald-800 font-bold">
                        <td className="pt-1 uppercase text-[9px]">CO₂ SAVINGS POSSIBLE</td>
                        <td className="pt-1 text-right"></td>
                        <td className="pt-1 text-right">-{calculateTotalSavings().toFixed(1)} kg</td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="border-t border-dashed border-black/35 my-3" />

                  {/* Subscriptions / Alternatives print list */}
                  <div>
                    <p className="font-bold text-[9px] text-center uppercase tracking-wider mb-2">=== RECOMMENDED SWAPS ===</p>
                    <div className="space-y-2">
                      {receiptItems.map((item, idx) => (
                        item.alternative !== "No suggestion" && (
                          <div key={idx} className="text-[9px] leading-normal pb-1.5 border-b border-dotted border-black/20 last:border-none">
                            <div className="flex justify-between font-bold">
                              <span>[REPLACE] {item.name.toUpperCase()}</span>
                              <span>SAVE {item.saving.toFixed(1)} KG</span>
                            </div>
                            <p className="text-gray-600">↳ SWAP WITH: {item.alternative.toUpperCase()}</p>
                          </div>
                        )
                      ))}
                    </div>
                  </div>

                  <div className="border-t-2 border-double border-black/35 my-3" />
                  <div className="text-center text-[9px] uppercase tracking-wide text-gray-500">
                    <p>Thank you for shopping green</p>
                    <p className="font-bold mt-0.5">*** END OF BILL ***</p>
                    <p className="text-[8px] mt-0.5 text-gray-400 font-sans">- - - - ✄ - - - - - - - - - - - -</p>
                  </div>
                </div>

                {/* Print button */}
                <div className="mt-4 flex justify-center">
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-4 py-2 border border-primary/30 bg-card text-[10px] font-bold uppercase rounded-none text-primary hover:bg-muted/40 transition font-sans tracking-widest"
                  >
                    <Printer className="w-3.5 h-3.5 text-secondary" /> Print Thermal Invoice
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Editorial Side Panel */}
          <div className="space-y-6">
            <div className="bg-card border-4 border-double border-primary/30 p-5 rounded-none font-serif shadow-sm">
              <h3 className="text-sm font-black text-primary border-b border-primary/20 pb-1.5 uppercase tracking-tight flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-secondary" /> Carbon Summary
              </h3>
              <p className="text-[8px] text-muted-foreground italic uppercase tracking-wider mb-4">Official Sourcing Briefing</p>
              
              {loadingSummary ? (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <RefreshCw className="w-6 h-6 text-secondary animate-spin" />
                  <p className="text-[10px] italic text-muted-foreground">Drafting summary...</p>
                </div>
              ) : summaryBrief ? (
                <div className="space-y-4">
                  <p className="text-[11px] leading-relaxed text-foreground text-justify whitespace-pre-wrap first-letter:text-2xl first-letter:font-bold first-letter:text-secondary first-letter:float-left first-letter:mr-1.5">
                    {summaryBrief}
                  </p>
                  <div className="border-t border-primary/20 pt-2.5 mt-4 text-[9px] text-muted-foreground uppercase font-sans font-bold flex justify-between">
                    <span>Editor: Gazette AI</span>
                    <span>Review: Passed</span>
                  </div>
                </div>
              ) : (
                <p className="text-[10px] italic text-muted-foreground text-center py-4">
                  No summary drafted. Upload a receipt log to generate briefing.
                </p>
              )}
            </div>
            
            <button
              onClick={() => setActiveTab("chat")}
              className="w-full py-2.5 bg-secondary text-white text-[10px] font-bold uppercase rounded-none hover:opacity-90 transition flex items-center justify-center gap-1.5 tracking-widest font-sans shadow-sm border border-secondary"
            >
              <Sparkles className="w-3.5 h-3.5" /> Consult the Editor
            </button>
          </div>
        </div>
      )}

      {activeTab === "calculator" && (
        <div className="max-w-xl mx-auto">
          <CarbonCalculator />
        </div>
      )}

      {activeTab === "rewards" && (
        <div className="grid md:grid-cols-3 gap-8 font-serif items-start">
          {/* User Stats and Daily Challenges (2 cols) */}
          <div className="md:col-span-2 space-y-6 border-r border-primary/15 md:pr-8">
            <div className="bg-card border-4 border-double border-primary/30 p-5 rounded-none flex flex-col md:flex-row items-center justify-around gap-6 text-center select-text">
              <div>
                <Award className="w-8 h-8 text-secondary mx-auto mb-1 animate-bounce" />
                <p className="text-xl font-black text-primary">{userStats.points}</p>
                <p className="text-[9px] uppercase font-bold text-muted-foreground font-sans mt-0.5 tracking-wider">Eco Points</p>
              </div>
              <div className="h-px md:h-10 w-10 md:w-px bg-primary/20" />
              <div>
                <Zap className="w-8 h-8 text-amber-700 mx-auto mb-1" />
                <p className="text-xl font-black text-primary">{userStats.streak} Days</p>
                <p className="text-[9px] uppercase font-bold text-muted-foreground font-sans mt-0.5 tracking-wider">Consecutive Streaks</p>
              </div>
              <div className="h-px md:h-10 w-10 md:w-px bg-primary/20" />
              <div>
                <Star className="w-8 h-8 text-primary mx-auto mb-1" />
                <p className="text-sm font-black text-primary uppercase">{userStats.level}</p>
                <p className="text-[9px] uppercase font-bold text-muted-foreground font-sans mt-0.5 tracking-wider">Sourcing Rank</p>
              </div>
            </div>

            {/* Daily Gazette Sourcing Checklist */}
            <div className="border border-primary/25 p-4 rounded-none bg-card select-none">
              <h3 className="text-xs font-bold text-primary mb-2.5 uppercase tracking-wide border-b border-primary/20 pb-1.5 flex items-center gap-1 font-serif">
                <CheckCircle className="w-4 h-4 text-secondary animate-pulse" /> [ Daily Sourcing Tasks ]
              </h3>
              <div className="space-y-2 text-xs font-sans">
                {dailyTasks.map((task) => (
                  <div 
                    key={task.id} 
                    onClick={() => handleCompleteTask(task.id)}
                    className={`flex items-center justify-between p-2 border border-primary/20 bg-background cursor-pointer hover:bg-muted/30 transition select-none ${
                      task.done ? "opacity-60 line-through text-muted-foreground bg-muted/10 cursor-default" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        checked={task.done} 
                        readOnly 
                        className="rounded-none text-primary border-primary/30 focus:ring-0 w-3.5 h-3.5" 
                      />
                      <span className="font-semibold text-gray-800 text-[10.5px] leading-tight text-left">{task.label}</span>
                    </div>
                    <span className="font-mono text-[9px] font-bold text-secondary bg-secondary/15 border border-secondary/20 px-1.5 py-0.5 rounded-none flex-shrink-0">
                      +{task.points} Pts
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rewards shop */}
            <div>
              <h3 className="text-sm font-bold text-primary mb-3 border-b border-primary/20 pb-1 uppercase tracking-wider">[ Eco Reward Classifieds ]</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { id: "R1", title: "10% Off Local Farmers Market", desc: "Unlock a coupon code for ecological farmer markets.", cost: 100 },
                  { id: "R2", title: "Free Compostable Shopping Bag", desc: "Claim an organic jute tote bag at participating retailers.", cost: 300 },
                  { id: "R3", title: "Free Sapling Donation", desc: "Donate and plant a local tree sapling in your name.", cost: 500 },
                  { id: "R4", title: "Zero-Waste Soap Refill Ref", desc: "Redeem for a complimentary package-free shampoo block.", cost: 700 }
                ].map((rew) => (
                  <div key={rew.id} className="bg-card border border-primary/25 rounded-none p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition">
                    <div>
                      <span className="inline-block border border-primary/30 text-primary text-[8px] font-bold font-sans px-2 py-0.5 rounded-none uppercase tracking-wide">
                        Cost: {rew.cost} Pts
                      </span>
                      <h4 className="font-bold text-xs text-primary mt-2 uppercase tracking-wide">{rew.title}</h4>
                      <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed italic">{rew.desc}</p>
                    </div>
                    <button
                      onClick={() => handleRedeem(rew)}
                      disabled={userStats.points < rew.cost}
                      className="mt-3.5 w-full py-1.5 bg-primary text-background border border-primary disabled:bg-muted disabled:text-muted-foreground text-[9px] font-bold uppercase rounded-none transition hover:opacity-90 font-sans tracking-widest"
                    >
                      Redeem Reward
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar leaderboard & coupons */}
          <div className="space-y-6">
            <div className="bg-card border-4 border-double border-primary/30 p-5 rounded-none">
              <h3 className="font-black text-primary border-b border-primary/25 pb-1.5 uppercase text-sm text-center tracking-wider">Honor Roll</h3>
              <p className="text-[8px] text-muted-foreground italic uppercase tracking-wider text-center mb-3">Highest Eco-Scorers of the Week</p>

              <div className="space-y-3 text-[11px]">
                {leaderboard.map((user, idx) => (
                  <div key={idx} className="flex justify-between items-center pb-2 border-b border-dashed border-primary/20 last:border-none">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-secondary font-mono text-[10px]">#{idx+1}</span>
                      <span className="font-semibold text-gray-800">{user.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{user.points} Pts</p>
                      <p className="text-[8px] text-muted-foreground uppercase tracking-wide font-sans">{user.level}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card border border-primary/25 p-5 rounded-none">
              <h3 className="font-bold text-primary border-b border-primary/20 pb-1.5 uppercase text-xs tracking-wider">My Unlocked Vouchers</h3>
              {myRewards.length === 0 ? (
                <p className="text-[10px] italic text-muted-foreground text-center py-3">No coupons redeemed yet. Browse classifieds to swap points.</p>
              ) : (
                <div className="mt-3 space-y-2.5">
                  {myRewards.map((v, i) => (
                    <div key={i} className="bg-background border border-dashed border-secondary/60 rounded-none p-2.5 font-mono text-[10px]">
                      <p className="font-bold text-primary">{v.title.toUpperCase()}</p>
                      <p className="text-secondary font-bold text-xs tracking-wider mt-1">{v.code}</p>
                      <p className="text-[8px] text-muted-foreground mt-0.5 uppercase">Claimed: {v.redeemedAt}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "chat" && (
        <div className="max-w-2xl mx-auto">
          <EcoChatbot receiptContext={done ? { items: receiptItems, total_carbon: totalCarbon } : undefined} />
        </div>
      )}

      {activeTab === "archives" && (
        <div className="space-y-6 font-serif">
          {/* Dashboard Analytics summary logs */}
          <div className="grid md:grid-cols-3 gap-6 items-start">
            <div className="md:col-span-2 bg-card rounded-none p-5 border border-primary/25 shadow-sm">
              <h3 className="font-bold text-primary mb-3 text-xs uppercase tracking-wide">Carbon Sourcing Ledgers (Monthly Trend)</h3>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="co2grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={WOOD_DARK} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={WOOD_DARK} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e6dfd3" />
                  <XAxis dataKey="month" tick={{ fontSize: 9, fontFamily: "sans-serif" }} />
                  <YAxis tick={{ fontSize: 9, fontFamily: "sans-serif" }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="co2" stroke={WOOD_DARK} fill="url(#co2grad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-card rounded-none p-5 border border-primary/25 shadow-sm flex flex-col justify-between h-[210px]">
              <h3 className="font-bold text-primary mb-1 text-xs uppercase text-center tracking-wide">Category Distribution</h3>
              <ResponsiveContainer width="100%" height={100}>
                <RPieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={30} outerRadius={48} paddingAngle={4} dataKey="value">
                    {categoryData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                </RPieChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-2 font-sans text-[9px] uppercase font-bold tracking-wide">
                {categoryData.map((c) => (
                  <div key={c.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-none flex-shrink-0" style={{ background: c.color }} />
                      <span className="text-gray-700">{c.name}</span>
                    </div>
                    <span className="text-primary">{c.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Search, filters, and list */}
          <div className="bg-card border border-primary/25 rounded-none p-5 shadow-sm">
            <h3 className="font-bold text-primary uppercase text-xs border-b border-primary/20 pb-1.5 mb-4 tracking-wider">
              [ Archives Repository Inventory ]
            </h3>
            
            <div className="flex flex-col sm:flex-row gap-3 mb-5 select-text">
              <div className="flex-1 relative font-sans">
                <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search receipt by store name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-background border border-primary/30 rounded-none text-xs focus:outline-none"
                />
              </div>
              <div className="flex gap-2 font-sans">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-2.5 py-1.5 bg-background border border-primary/30 rounded-none text-xs focus:outline-none text-primary"
                >
                  <option value="">All Months</option>
                  <option value="Jan">January</option>
                  <option value="Feb">February</option>
                  <option value="Mar">March</option>
                  <option value="Apr">April</option>
                  <option value="May">May</option>
                  <option value="Jun">June</option>
                  <option value="Jul">July</option>
                </select>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 border border-primary/30 bg-primary text-background font-bold text-[10px] uppercase rounded-none hover:opacity-90 flex items-center gap-1.5 tracking-widest"
                >
                  <Download className="w-3 h-3" /> Export Logs
                </button>
              </div>
            </div>

            {filteredReceipts.length === 0 ? (
              <p className="text-[10px] text-muted-foreground italic text-center py-6">No historical receipt entries found matching search filters.</p>
            ) : (
              <div className="overflow-x-auto select-text">
                <table className="w-full text-xs text-left border-collapse font-serif">
                  <thead>
                    <tr className="border-b border-primary/25 font-sans uppercase font-bold text-muted-foreground text-[9px] tracking-wider">
                      <th className="py-2 px-3">Receipt ID</th>
                      <th className="py-2 px-3">Scan Date</th>
                      <th className="py-2 px-3">Retailer Store</th>
                      <th className="py-2 px-3 text-right">Items</th>
                      <th className="py-2 px-3 text-right">CO₂ Sourced</th>
                      <th className="py-2 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReceipts.map((rec) => (
                      <tr key={rec.id} className="border-b border-primary/10 hover:bg-muted/15 transition">
                        <td className="py-2 px-3 font-mono text-[9px] text-muted-foreground">{rec.id}</td>
                        <td className="py-2 px-3">{rec.date}</td>
                        <td className="py-2 px-3 font-bold text-primary">{rec.store}</td>
                        <td className="py-2 px-3 text-right">{rec.items}</td>
                        <td className="py-2 px-3 text-right font-bold text-secondary font-mono">{rec.totalCo2.toFixed(1)} KG</td>
                        <td className="py-2 px-3 text-center">
                          <button
                            onClick={() => setSelectedReceipt(rec)}
                            className="px-2.5 py-0.5 border border-primary/30 bg-background text-[8px] font-sans font-bold uppercase rounded-none hover:bg-muted/40 tracking-widest"
                          >
                            Review Slip
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Historical Checkout Slip Modal Popup */}
          {selectedReceipt && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-card border-4 border-double border-primary/30 p-5 rounded-none shadow-xl max-w-xs w-full relative select-none">
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="absolute right-3 top-3 p-1 rounded-none bg-muted border border-primary/20 text-primary hover:text-secondary"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                {/* Print layout checkout slip */}
                <div className="bg-white border border-black/15 p-4 text-black font-mono text-[10px] select-none mt-4 max-h-[60vh] overflow-y-auto">
                  <div className="text-center font-bold mb-4 uppercase tracking-tighter">
                    <p className="text-xs">*** HISTORICAL LOG ***</p>
                    <p className="text-[8px] tracking-widest mt-0.5">THE CARBON GAZETTE ARCHIVES</p>
                    <div className="border-t border-dashed border-black/35 my-2" />
                    <div className="text-left font-normal text-[9px] space-y-0.5">
                      <p>STORE : {selectedReceipt.store.toUpperCase()}</p>
                      <p>DATE  : {selectedReceipt.date}</p>
                      <p>TICKET: {selectedReceipt.id}</p>
                    </div>
                    <div className="border-b-2 border-double border-black/35 my-2" />
                  </div>
                  <div className="flex justify-between font-bold text-[9px] uppercase">
                    <span>SCANNED INVENTORY</span>
                    <span>{selectedReceipt.items} ITEMS</span>
                  </div>
                  <div className="border-t border-dashed border-black/35 my-2" />
                  <div className="flex justify-between font-bold text-[10px]">
                    <span>AGGREGATE CARBON</span>
                    <span>{selectedReceipt.totalCo2.toFixed(1)} KG</span>
                  </div>
                  <div className="border-t-2 border-double border-black/35 my-3" />
                  <div className="text-center text-[8px] uppercase tracking-wide text-gray-400">
                    <p>Scanned via Gazette Reader</p>
                    <p className="font-bold mt-0.5">*** COPY OF RECORD ***</p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2 font-sans">
                  <button
                    onClick={() => window.print()}
                    className="flex-1 py-1.5 border border-primary/30 bg-background text-[9px] font-bold uppercase rounded-none text-primary hover:bg-muted/40 transition flex items-center justify-center gap-1 shadow-sm tracking-wider"
                  >
                    <Printer className="w-3 h-3" /> Print Copy
                  </button>
                  <button
                    onClick={() => setSelectedReceipt(null)}
                    className="flex-1 py-1.5 bg-primary border border-primary text-background text-[9px] font-bold uppercase rounded-none hover:opacity-90 transition shadow-sm tracking-wider"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE: ABOUT
// ═══════════════════════════════════════════════════════════════════════════════

function AboutPage({ setPage }: { setPage: (p: Page) => void }) {
  const team = [
    { name: "Suriya.A", emoji: "✍️" },
    { name: "Sudharsan.V", emoji: "🔍" },
    { name: "Varun.S", emoji: "📖" },
    { name: "Udhayakumar.V", emoji: "📰" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-6 select-none font-serif text-justify">
      <div className="newspaper-masthead text-center mb-6 select-text">
        <h1 className="text-2xl font-black uppercase text-primary tracking-tight">EDITORIAL BOARD & MISSION</h1>
        <p className="text-[10px] text-muted-foreground uppercase font-sans font-bold tracking-widest mt-1">Foundational Ethics of the Gazette</p>
      </div>

      <section className="grid md:grid-cols-3 gap-8 items-start border-b border-primary/20 pb-8 select-text">
        <div className="md:col-span-2 space-y-4 border-r border-primary/20 md:pr-8">
          <h2 className="text-xl font-bold text-primary uppercase tracking-tight">Making Sourcing Transparent, One Receipt at a Time</h2>
          <div className="space-y-4 text-xs text-foreground leading-relaxed">
            <p>
              It started with a simple question: "How much carbon does my weekly grocery run actually produce?" The answer was surprisingly hard to find — buried in academic papers and supply chain reports.
            </p>
            <p>
              We built Carbon Footprint Receipt to surface that data instantly, right at the moment you shop. By combining large-language models with validated lifecycle assessment databases, we turn a crumpled receipt into actionable sustainability intelligence.
            </p>
            <p>
              Our goal isn't to make you feel guilty — it's to give you the knowledge to nudge your habits toward a lower-carbon future, consistently and effortlessly.
            </p>
          </div>
        </div>

        <div className="bg-card border-4 border-double border-primary/30 p-5 rounded-none space-y-4">
          <h3 className="font-bold text-primary uppercase text-xs border-b border-primary/20 pb-1.5 tracking-wider">[ Journal Statistics ]</h3>
          <div className="space-y-4 text-center">
            {[
              { num: "120K+", label: "Receipts Analyzed" },
              { num: "4.8M kg", label: "CO₂ Tracked" },
              { num: "98%", label: "Accuracy Rate" },
            ].map((s, idx) => (
              <div key={idx}>
                <p className="text-xl font-black text-secondary uppercase">{s.num}</p>
                <p className="text-[8px] uppercase font-bold text-muted-foreground font-sans mt-0.5 tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8 border-b border-primary/20 select-text">
        <h2 className="text-sm font-bold text-primary text-center mb-6 uppercase tracking-wider">[ The Editorial Board ]</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {team.map((m) => (
            <div key={m.name} className="bg-card rounded-none p-5 text-center border border-primary/20 shadow-sm hover:shadow-md transition">
              <div className="w-10 h-10 rounded-none mx-auto mb-3 flex items-center justify-center text-xl bg-muted border border-primary/10">
                {m.emoji}
              </div>
              <p className="font-bold text-sm text-primary">{m.name}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-8 text-center select-text font-sans">
        <h2 className="text-xs font-bold text-primary mb-1 uppercase tracking-widest">Want to partner with us?</h2>
        <p className="text-[10px] text-muted-foreground mb-4 max-w-xs mx-auto italic font-serif">We work with local organic retailers, environmental NGOs, and sustainability teams worldwide.</p>
        <button
          onClick={() => setPage("signup")}
          className="px-4 py-2 bg-primary border border-primary text-background font-bold text-[9px] uppercase rounded-none hover:bg-secondary hover:border-secondary transition tracking-widest shadow-sm"
        >
          Contact the Publisher
        </button>
      </section>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE: LOGIN
// ═══════════════════════════════════════════════════════════════════════════════

function LoginPage({ setPage }: { setPage: (p: Page) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const { setIsLoggedIn } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Please fill in all fields."); return; }
    if (!email.includes("@")) { setError("Please enter a valid email."); return; }
    setLoading(true);
    setTimeout(() => { 
      setLoading(false); 
      setSuccess(true); 
      setIsLoggedIn(true); 
    }, 1200);
  };

  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6 font-serif select-none">
        <div className="text-center max-w-xs bg-card border-4 border-double border-primary/30 p-6 rounded-none shadow-sm">
          <div className="w-10 h-10 rounded-none bg-muted flex items-center justify-center mx-auto mb-4 border border-primary/20 text-emerald-700">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h2 className="text-sm font-bold text-primary mb-2 uppercase border-b border-primary/20 pb-1.5 tracking-wider">Subscription Confirmed</h2>
          <p className="text-[10px] text-muted-foreground mt-2 mb-5">Welcome back to the Gazette database desk.</p>
          <button onClick={() => setPage("dashboard")} className="px-4 py-2 bg-primary border border-primary text-background text-[10px] font-bold uppercase rounded-none tracking-widest shadow-sm font-sans hover:bg-secondary">
            Go to Desk
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 py-10 font-serif select-none">
      <div className="w-full max-w-sm">
        <div className="bg-card rounded-none border-4 border-double border-primary/30 p-6 shadow-sm">
          <div className="text-center mb-6 border-b border-primary/20 pb-3">
            <Logo size="sm" />
            <h1 className="text-base font-black text-primary uppercase mt-3 tracking-wide">Subscriber Log In</h1>
            <p className="text-[9px] text-muted-foreground uppercase tracking-widest mt-0.5">Unlock ecological reporting archive</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 font-sans text-[10px]">
            <div>
              <label className="block font-bold uppercase text-primary mb-1 tracking-wider">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-2.5 py-1.5 bg-background border border-primary/30 rounded-none text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold uppercase text-primary mb-1 tracking-wider">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-2.5 py-1.5 bg-background border border-primary/30 rounded-none text-xs text-foreground focus:border-primary focus:outline-none pr-10"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary">
                  {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-1.5 text-red-800 text-[10px] bg-red-50 border border-red-200 rounded-none p-1.5">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" /> {error}
              </div>
            )}

            <div className="flex items-center justify-between font-serif text-[8px] uppercase font-bold text-muted-foreground tracking-wider">
              <label className="flex items-center gap-1 cursor-pointer">
                <input type="checkbox" className="rounded-none text-primary border-primary/30 focus:ring-0" /> Remember Log
              </label>
              <a href="#" className="hover:underline text-secondary">Forgot password?</a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-primary text-background border border-primary font-bold uppercase rounded-none shadow-sm hover:bg-secondary hover:border-secondary transition flex items-center justify-center gap-1.5 text-[9px] tracking-widest"
            >
              {loading ? <div className="w-3.5 h-3.5 border-2 border-background/50 border-t-background rounded-none animate-spin" /> : <LogIn className="w-3.5 h-3.5" />}
              {loading ? "Verifying..." : "Sign In"}
            </button>
          </form>

          <p className="text-center font-serif text-[10px] text-muted-foreground mt-5 uppercase border-t border-primary/20 pt-3 tracking-wider">
            No subscription?{" "}
            <button onClick={() => setPage("signup")} className="font-bold text-secondary hover:underline">
              Subscribe
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── SIGN UP PAGE ────────────────────────────────────────────────────────────

function SignUpPage({ setPage }: { setPage: (p: Page) => void }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState(1);
  const { setIsLoggedIn } = useAuth();

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Full name is required.";
    if (!form.email.includes("@")) e.email = "Valid email required.";
    return e;
  };

  const validateStep2 = () => {
    const e: Record<string, string> = {};
    if (form.password.length < 8) e.password = "Min 8 characters required.";
    if (form.password !== form.confirm) e.confirm = "Passwords do not match.";
    return e;
  };

  const nextStep = () => {
    const e = validateStep1();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setStep(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const e2 = validateStep2();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    setErrors({});
    setLoading(true);
    setTimeout(() => { 
      setLoading(false);
      setSuccess(true);
      setIsLoggedIn(true); 
    }, 1500);
  };

  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6 font-serif select-none">
        <div className="text-center max-w-xs bg-card border-4 border-double border-primary/30 p-6 rounded-none shadow-sm">
          <div className="w-10 h-10 rounded-none bg-muted flex items-center justify-center mx-auto mb-4 border border-primary/20 text-emerald-700">
            <Leaf className="w-6 h-6" />
          </div>
          <h2 className="text-sm font-bold text-primary mb-2 uppercase border-b border-primary/20 pb-1.5 tracking-wider">Subscribed! 🌱</h2>
          <p className="text-[10px] text-muted-foreground mt-2 mb-5">Welcome to the Carbon Gazette team, <strong>{form.name}</strong>.</p>
          <button onClick={() => setPage("dashboard")} className="px-5 py-2 bg-primary border border-primary text-background text-[10px] font-bold uppercase rounded-none tracking-widest shadow-sm font-sans hover:bg-secondary">
            Open Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 py-10 font-serif select-none">
      <div className="w-full max-w-sm">
        <div className="bg-card rounded-none border-4 border-double border-primary/30 p-6 shadow-sm">
          <div className="text-center mb-4 border-b border-primary/20 pb-3">
            <Logo size="sm" />
            <h1 className="text-base font-black text-primary uppercase mt-3 tracking-wide">Free Subscription</h1>
            <p className="text-[9px] text-muted-foreground uppercase tracking-widest mt-0.5">Join thousands of ecological shoppers</p>
          </div>

          <div className="flex items-center gap-1 mb-3 font-sans text-xs">
            {[1, 2].map((s) => (
              <div key={s} className={`flex-1 h-1 rounded-none transition ${step >= s ? "bg-secondary" : "bg-muted"}`} />
            ))}
          </div>
          <p className="text-[8px] uppercase font-bold font-sans text-muted-foreground mb-4 text-center tracking-widest">Step {step} of 2</p>

          <form onSubmit={step === 1 ? (e) => { e.preventDefault(); nextStep(); } : handleSubmit} className="space-y-4 font-sans text-[10px]">
            {step === 1 ? (
              <>
                <div>
                  <label className="block font-bold uppercase text-primary mb-1 tracking-wider">Full Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder="Suriya"
                    className="w-full px-2.5 py-1.5 bg-background border border-primary/30 rounded-none text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                  {errors.name && <p className="text-[9px] text-red-600 mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block font-bold uppercase text-primary mb-1 tracking-wider">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-2.5 py-1.5 bg-background border border-primary/30 rounded-none text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                  {errors.email && <p className="text-[9px] text-red-600 mt-1">{errors.email}</p>}
                </div>
                <button type="submit" className="w-full py-2.5 bg-primary border border-primary text-background font-bold uppercase rounded-none hover:bg-secondary tracking-widest text-[9px]">
                  Continue
                </button>
              </>
            ) : (
              <>
                <div>
                  <label className="block font-bold uppercase text-primary mb-1 tracking-wider">Password</label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => update("password", e.target.value)}
                      placeholder="Min 8 characters"
                      className="w-full px-2.5 py-1.5 bg-background border border-primary/30 rounded-none text-xs text-foreground focus:border-primary focus:outline-none pr-10"
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-[9px] text-red-600 mt-1">{errors.password}</p>}
                </div>
                <div>
                  <label className="block font-bold uppercase text-primary mb-1 tracking-wider">Confirm Password</label>
                  <input
                    type="password"
                    value={form.confirm}
                    onChange={(e) => update("confirm", e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full px-2.5 py-1.5 bg-background border border-primary/30 rounded-none text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                  {errors.confirm && <p className="text-[9px] text-red-600 mt-1">{errors.confirm}</p>}
                </div>
                <div className="flex items-start gap-1.5 text-[8px] font-serif text-muted-foreground leading-normal uppercase font-bold tracking-wider">
                  <input type="checkbox" required className="mt-0.5 rounded-none text-primary border-primary/30 focus:ring-0" />
                  <span>I agree to the <a href="#" className="underline text-secondary">Terms of Service</a> & <a href="#" className="underline text-secondary">Privacy Code</a></span>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setStep(1)} className="flex-1 py-2.5 border border-primary/30 text-primary font-bold uppercase rounded-none hover:bg-muted/40 transition tracking-widest text-[9px]">
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2.5 bg-primary border border-primary text-background font-bold uppercase rounded-none hover:bg-secondary transition disabled:opacity-60 text-[9px] tracking-widest flex items-center justify-center gap-1"
                  >
                    {loading ? <div className="w-3.5 h-3.5 border-2 border-background/50 border-t-background rounded-none animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                    {loading ? "Saving..." : "Subscribe"}
                  </button>
                </div>
              </>
            )}
          </form>

          <p className="text-center font-serif text-[10px] text-muted-foreground mt-5 uppercase border-t border-primary/20 pt-3 tracking-wider">
            Subscribed already?{" "}
            <button onClick={() => setPage("login")} className="font-bold text-secondary hover:underline">Sign in</button>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── ROOT APP ────────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState<Page>("home");

  const renderPage = () => {
    switch (page) {
      case "home": return <HomePage setPage={setPage} />;
      case "dashboard": return <DashboardPage setPage={setPage} initialTab="scan" />;
      case "reports": return <DashboardPage setPage={setPage} initialTab="archives" />;
      case "about": return <AboutPage setPage={setPage} />;
      case "login": return <LoginPage setPage={setPage} />;
      case "signup": return <SignUpPage setPage={setPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-background font-serif text-foreground">
      <Nav page={page} setPage={setPage} />
      {/* Newspaper News Ticker Marquee */}
      {page !== "login" && page !== "signup" && (
        <div className="relative flex overflow-x-hidden border-b border-primary/20 bg-card py-1.5 text-[9px] font-sans font-bold uppercase tracking-wider text-secondary select-none">
          <div className="animate-marquee whitespace-nowrap flex gap-10">
            <span>BULLETIN: Substituting beef with tofu reduces household emissions by 25kg CO₂ per swap •</span>
            <span>UPDATE: Local farmer markets in Chennai accept Gazette eco-coupons •</span>
            <span>TIP: Millets and organic grains require 70% less water than rice crops •</span>
            <span>NOTICE: Scanned 120,000+ grocery receipts across South India •</span>
            <span>ALERT: Switch to paperless e-receipts to save over 15g carbon footprint per check •</span>
          </div>
          <div className="absolute top-1.5 left-0 animate-marquee whitespace-nowrap flex gap-10 select-none pointer-events-none">
            <span>BULLETIN: Substituting beef with tofu reduces household emissions by 25kg CO₂ per swap •</span>
            <span>UPDATE: Local farmer markets in Chennai accept Gazette eco-coupons •</span>
            <span>TIP: Millets and organic grains require 70% less water than rice crops •</span>
            <span>NOTICE: Scanned 120,000+ grocery receipts across South India •</span>
            <span>ALERT: Switch to paperless e-receipts to save over 15g carbon footprint per check •</span>
          </div>
        </div>
      )}
      <main className="min-h-[75vh]">{renderPage()}</main>
      {page !== "login" && page !== "signup" && <Footer setPage={setPage} />}
    </div>
  );
}
