import ThreatShield3D from "@/components/ThreatShield3D";
import { Canvas } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { ParticleField } from "@/components/CyberBackground3D";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { scanUrl, getScanHistory } from "@/lib/api";
import {
  LogOut,
  Shield,
  Search,
  AlertTriangle,
  CheckCircle2,
  History,
  Volume2,
  VolumeX,
  Filter,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Activity,
  Globe,
  BarChart3,
  ScanLine,
  ChevronRight,
  TerminalSquare,
  Cpu,
  Radar,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import NovuInboxBell from "@/components/NovuInboxBell";

type ScanResult = {
  status: string;
  message?: string;
  url?: string;
  score?: number;
  verdict?: string;
  reasons?: string[];
  explanation?: string | null;
  dns_check?: {
    dns_resolves?: boolean;
  };
  ml_result?: {
    verdict?: string;
    prediction?: number;
    confidence?: number;
    safe_probability?: number;
    malicious_probability?: number;
    reasons?: string[];
  };
  google_safe_browsing?: {
    used?: boolean;
    match?: boolean;
  };
  virustotal?: {
    used?: boolean;
    malicious?: number;
    suspicious?: number;
    harmless?: number;
    undetected?: number;
    status?: string;
  };
};

type QuickCheckResult = {
  status: string;
  message?: string;
  url?: string;
  verdict?: string;
  confidence?: number;
  safe_probability?: number;
  malicious_probability?: number;
  reasons?: string[];
};

type HistoryItem = {
  id?: number;
  url: string;
  score: number;
  verdict: string;
  reasons: string | string[];
  created_at: string;
};

type SecurityAlert = {
  verdict?: string;
  url?: string;
  score?: number;
  reasons?: string[];
} | null;

const Dashboard = () => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [quickChecking, setQuickChecking] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);

  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [quickCheckResult, setQuickCheckResult] = useState<QuickCheckResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [securityAlert, setSecurityAlert] = useState<SecurityAlert>(null);

  const [historySearch, setHistorySearch] = useState("");
  const [historyFilter, setHistoryFilter] = useState<"all" | "safe" | "suspicious" | "malicious">("all");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [typedHeader, setTypedHeader] = useState("");

  const navigate = useNavigate();
  const { toast } = useToast();

  const userFullName = localStorage.getItem("userFullName") || "User";
  const userEmail = localStorage.getItem("userEmail") || "";

  useEffect(() => {
    const fullText = "REAL-TIME CYBER THREAT MONITOR";
    let index = 0;
    setTypedHeader("");

    const interval = window.setInterval(() => {
      index += 1;
      setTypedHeader(fullText.slice(0, index));
      if (index >= fullText.length) clearInterval(interval);
    }, 55);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login", { replace: true });
        return;
      }
      await fetchHistory();
    };

    checkAuthAndLoad();
  }, [navigate]);

  useEffect(() => {
    if (!securityAlert || !voiceEnabled) return;
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    let message = "Scan completed.";
    const verdict = securityAlert.verdict || "";

    if (verdict === "Malicious") {
      message = "Warning. Malicious URL detected. This link may be dangerous.";
    } else if (verdict === "Suspicious") {
      message = "Caution. Suspicious URL detected. Please verify the link before opening it.";
    } else if (verdict === "Safe") {
      message = "Scan complete. The URL appears to be safe.";
    }

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [securityAlert, voiceEnabled]);

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      const response = await getScanHistory();

      if (response.status === "success") {
        setHistory(response.history || []);
      } else {
        toast({
          title: "History load failed",
          description: response.message || "Could not load scan history.",
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load scan history.",
        variant: "destructive",
      });
    } finally {
      setHistoryLoading(false);
    }
  };

  const isValidUrl = (value: string) => {
    try {
      const parsed = new URL(value);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  };

  const handleScan = async () => {
    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      toast({
        title: "URL required",
        description: "Please enter a URL to scan.",
        variant: "destructive",
      });
      return;
    }

    if (!isValidUrl(trimmedUrl)) {
      toast({
        title: "Invalid URL",
        description: "Enter a valid URL starting with http:// or https://",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      setQuickCheckResult(null);
      setSecurityAlert(null);

      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      const response = await scanUrl({ url: trimmedUrl });

      if (response.status === "success") {
        setScanResult(response);

        if (
          response.verdict === "Malicious" ||
          response.verdict === "Suspicious" ||
          response.verdict === "Safe"
        ) {
          setSecurityAlert({
            verdict: response.verdict,
            url: response.url || trimmedUrl,
            score: response.score,
            reasons: response.reasons || [],
          });
        }

        toast({
          title: "Scan completed",
          description: "The URL has been analyzed successfully.",
        });

        fetchHistory();
      } else {
        setScanResult(null);
        toast({
          title: "Scan failed",
          description: response.message || "Unable to scan the URL.",
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
      setScanResult(null);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong while scanning.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickCheck = async () => {
    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      toast({
        title: "URL required",
        description: "Please enter a URL to check.",
        variant: "destructive",
      });
      return;
    }

    if (!isValidUrl(trimmedUrl)) {
      toast({
        title: "Invalid URL",
        description: "Enter a valid URL starting with http:// or https://",
        variant: "destructive",
      });
      return;
    }

    try {
      setQuickChecking(true);
      setScanResult(null);

      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      const response = await scanUrl({ url: trimmedUrl });

      if (response.status === "success") {
        setQuickCheckResult({
          status: "success",
          message: response.message,
          url: response.url,
          verdict: response.ml_result?.verdict || "Unknown",
          confidence: response.ml_result?.confidence ?? 0,
          safe_probability: response.ml_result?.safe_probability ?? 0,
          malicious_probability: response.ml_result?.malicious_probability ?? 0,
          reasons: response.ml_result?.reasons || [],
        });

        toast({
          title: "Quick check completed",
          description: "ML prediction generated successfully.",
        });
      } else {
        setQuickCheckResult(null);
        toast({
          title: "Quick check failed",
          description: response.message || "Unable to check the URL.",
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
      setQuickCheckResult(null);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong while checking.",
        variant: "destructive",
      });
    } finally {
      setQuickChecking(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userFullName");
    localStorage.removeItem("rememberMe");
    localStorage.removeItem("rememberedEmail");
    localStorage.removeItem("pendingOtpEmail");

    toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
    });

    navigate("/login", { replace: true });
  };

  const getVerdictBadge = (verdict?: string) => {
    const value = (verdict || "").toLowerCase();

    if (value === "safe") return "bg-green-500/10 text-green-400 border border-green-500/20";
    if (value === "suspicious") return "bg-yellow-500/10 text-yellow-300 border border-yellow-500/20";
    if (value === "malicious") return "bg-red-500/10 text-red-400 border border-red-500/20";
    return "bg-cyan-500/10 text-cyan-300 border border-cyan-500/20";
  };

  const getVerdictIcon = (verdict?: string) => {
    const value = (verdict || "").toLowerCase();

    if (value === "safe") return <CheckCircle2 className="w-4 h-4" />;
    if (value === "suspicious" || value === "malicious") return <AlertTriangle className="w-4 h-4" />;
    return <Shield className="w-4 h-4" />;
  };

  const formatReasons = (reasons: string | string[]) => {
    if (Array.isArray(reasons)) return reasons.join(", ");
    return reasons;
  };

  const verdictCounts = useMemo(() => {
    const counts = {
      total: history.length,
      safe: 0,
      suspicious: 0,
      malicious: 0,
    };

    history.forEach((item) => {
      const verdict = item.verdict?.toLowerCase();
      if (verdict === "safe") counts.safe += 1;
      else if (verdict === "suspicious") counts.suspicious += 1;
      else if (verdict === "malicious") counts.malicious += 1;
    });

    return counts;
  }, [history]);

  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const matchesSearch =
        !historySearch.trim() ||
        item.url.toLowerCase().includes(historySearch.toLowerCase()) ||
        item.verdict.toLowerCase().includes(historySearch.toLowerCase());

      const matchesFilter =
        historyFilter === "all" || item.verdict.toLowerCase() === historyFilter;

      return matchesSearch && matchesFilter;
    });
  }, [history, historySearch, historyFilter]);

  const currentRisk = Math.max(0, Math.min(scanResult?.score ?? 0, 100));
  const safePct = verdictCounts.total > 0 ? Math.round((verdictCounts.safe / verdictCounts.total) * 100) : 0;
  const suspiciousPct = verdictCounts.total > 0 ? Math.round((verdictCounts.suspicious / verdictCounts.total) * 100) : 0;
  const maliciousPct = verdictCounts.total > 0 ? Math.round((verdictCounts.malicious / verdictCounts.total) * 100) : 0;

  const StatCard = ({
    title,
    value,
    icon,
    accent,
    subtitle,
  }: {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    accent: string;
    subtitle?: string;
  }) => (
    <div className="rounded-3xl border border-cyan-500/20 bg-black/70 backdrop-blur-sm p-5 shadow-[0_0_30px_rgba(34,211,238,0.08)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_0_45px_rgba(34,211,238,0.18)]">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-slate-400 tracking-wide">{title}</p>
        <div className={`rounded-2xl p-2 ${accent}`}>{icon}</div>
      </div>
      <p className="text-3xl font-bold tracking-tight text-cyan-100">{value}</p>
      {subtitle ? <p className="text-xs text-slate-500 mt-2">{subtitle}</p> : null}
    </div>
  );

  return (
    <div className="w-full h-screen bg-black overflow-hidden relative">
      <div className="absolute inset-0 z-0 pointer-events-none fixed">
        <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
          <fog attach="fog" args={["#020617", 2, 10]} />
          <ambientLight intensity={0.5} />
          <ParticleField />
        </Canvas>
      </div>
      
      <div className="w-screen h-screen absolute top-0 left-0 overflow-y-auto overflow-x-hidden pointer-events-auto z-10">
        <div className="min-h-full w-full text-white relative pb-20 mx-auto max-w-[1920px]">
            <div className="fixed inset-0 -z-30 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(0,255,255,0.05),transparent_60%)]" />
            <div
              className="fixed inset-0 pointer-events-none -z-20 opacity-20"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(34,211,238,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.12) 1px, transparent 1px)",
                backgroundSize: "32px 32px",
              }}
            />

      {securityAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md px-4">
          <div
            className="w-full max-w-3xl rounded-[34px] border border-cyan-500/20 bg-black/70 backdrop-blur-md p-8 md:p-10 text-center shadow-[0_0_50px_rgba(34,211,238,0.15)] relative overflow-hidden"
          >
            {/* Cyan background accents */}
            <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.05),transparent_60%)] pointer-events-none" />
            <div
              className="absolute inset-0 z-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(34,211,238,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.12) 1px, transparent 1px)",
                backgroundSize: "32px 32px",
              }}
            />
            
            <div className="relative z-10 flex justify-between items-start gap-4 mb-6">
              <div className="text-left">
                <p className="uppercase tracking-[0.35em] text-xs md:text-sm text-cyan-400/70 mb-3">
                  SECURITY BREACH MONITOR
                </p>
                <h1 className={`text-4xl md:text-6xl font-extrabold leading-tight animate-pulse transition-colors ${
                  securityAlert.verdict === "Malicious" ? "text-red-400" :
                  securityAlert.verdict === "Suspicious" ? "text-yellow-400" :
                  "text-cyan-300"
                }`}>
                  {securityAlert.verdict === "Malicious"
                    ? "🚨 MALICIOUS URL DETECTED"
                    : securityAlert.verdict === "Suspicious"
                      ? "⚠️ SUSPICIOUS URL DETECTED"
                      : "✅ SAFE URL DETECTED"}
                </h1>
              </div>

              <button
                onClick={() => setSecurityAlert(null)}
                className="rounded-xl border border-cyan-500/20 px-4 py-2 text-sm hover:bg-cyan-500/10 text-cyan-100 transition-colors"
              >
                Close
              </button>
            </div>

            <p className="relative z-10 text-lg md:text-2xl break-all mb-6 text-cyan-50 font-medium">
              {securityAlert.url}
            </p>

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="rounded-2xl bg-slate-950/80 border border-cyan-500/20 p-5 shadow-[0_0_20px_rgba(34,211,238,0.05)] text-left">
                <p className="text-xs uppercase tracking-widest text-cyan-400/70 mb-2">Threat Verdict</p>
                <p className={`text-2xl md:text-3xl font-bold ${
                  securityAlert.verdict === "Malicious" ? "text-red-400" :
                  securityAlert.verdict === "Suspicious" ? "text-yellow-400" :
                  "text-cyan-300"
                }`}>{securityAlert.verdict}</p>
              </div>
              <div className="rounded-2xl bg-slate-950/80 border border-cyan-500/20 p-5 shadow-[0_0_20px_rgba(34,211,238,0.05)] text-left">
                <p className="text-xs uppercase tracking-widest text-cyan-400/70 mb-2">Threat Score</p>
                <p className="text-2xl md:text-3xl font-bold text-cyan-100">{securityAlert.score ?? "-"}</p>
              </div>
            </div>

            <div className="relative z-10 max-w-2xl mx-auto rounded-2xl bg-slate-950/80 border border-cyan-500/20 p-5 text-left mb-8 shadow-[0_0_20px_rgba(34,211,238,0.05)] text-cyan-100">
              <h3 className="text-lg md:text-xl font-semibold mb-3 text-cyan-300">Top Reasons</h3>
              {(securityAlert.reasons || []).slice(0, 5).map((reason, index) => (
                <p key={index} className="mb-2 text-sm md:text-base text-slate-300">
                  • {reason}
                </p>
              ))}
            </div>

            <button
              onClick={() => setSecurityAlert(null)}
              className="relative z-10 px-8 py-4 rounded-2xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98] bg-cyan-600 text-white hover:bg-cyan-500 shadow-[0_0_25px_rgba(34,211,238,0.2)] tracking-[0.15em] border border-cyan-400/30"
            >
              ACKNOWLEDGE
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6 md:px-6 lg:px-8">
        <div className="mb-8 rounded-[28px] border border-cyan-500/20 bg-black/70 backdrop-blur-sm p-6 shadow-[0_0_50px_rgba(34,211,238,0.10)]">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
            <div>
              <p className="text-cyan-400 text-sm font-medium mb-2 tracking-[0.35em]">SECURITY WORKSPACE</p>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-cyan-300 to-cyan-500 bg-clip-text text-transparent min-h-[44px]">
                {typedHeader}
                <span className="animate-pulse">▌</span>
              </h1>
              <p className="text-sm text-slate-400 mt-2">
                Operator: {userFullName}
                {userEmail ? ` • ${userEmail}` : ""}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setVoiceEnabled((prev) => !prev)}
                className="inline-flex items-center gap-2 h-11 px-4 rounded-2xl border border-cyan-500/20 bg-black/80 hover:bg-cyan-500/10 hover:scale-105 transition-all"
              >
                {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                {voiceEnabled ? "Voice On" : "Voice Off"}
              </button>

              <NovuInboxBell />

              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 h-11 px-4 rounded-2xl border border-cyan-500/20 bg-black/80 hover:bg-red-500/10 hover:scale-105 transition-all"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
          <StatCard
            title="Total Scans"
            value={verdictCounts.total}
            subtitle="All recorded checks"
            accent="bg-cyan-500/10 text-cyan-400"
            icon={<BarChart3 className="w-5 h-5" />}
          />
          <StatCard
            title="Safe"
            value={verdictCounts.safe}
            subtitle={`${safePct}% of all scans`}
            accent="bg-green-500/10 text-green-400"
            icon={<ShieldCheck className="w-5 h-5" />}
          />
          <StatCard
            title="Suspicious"
            value={verdictCounts.suspicious}
            subtitle={`${suspiciousPct}% of all scans`}
            accent="bg-yellow-500/10 text-yellow-300"
            icon={<AlertTriangle className="w-5 h-5" />}
          />
          <StatCard
            title="Malicious"
            value={verdictCounts.malicious}
            subtitle={`${maliciousPct}% of all scans`}
            accent="bg-red-500/10 text-red-400"
            icon={<ShieldAlert className="w-5 h-5" />}
          />
          <StatCard
            title="Current Risk"
            value={currentRisk}
            subtitle="Latest scan score"
            accent="bg-cyan-500/10 text-cyan-300"
            icon={<Radar className="w-5 h-5" />}
          />
        </div>

        <div className="rounded-3xl border border-cyan-500/20 bg-black/70 backdrop-blur-sm p-5 mb-6 shadow-[0_0_30px_rgba(34,211,238,0.08)]">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold text-cyan-300">Threat Overview</h2>
              <p className="text-sm text-slate-400">Distribution of scan verdicts</p>
            </div>
            <Cpu className="w-5 h-5 text-cyan-400" />
          </div>

          <div className="h-4 w-full rounded-full bg-slate-900 overflow-hidden flex border border-cyan-500/10">
            <div className="bg-green-500 transition-all" style={{ width: `${safePct}%` }} />
            <div className="bg-yellow-500 transition-all" style={{ width: `${suspiciousPct}%` }} />
            <div className="bg-red-500 transition-all" style={{ width: `${maliciousPct}%` }} />
          </div>

          <div className="flex flex-wrap gap-4 mt-4 text-sm">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-3 h-3 rounded-full bg-green-500" />
              Safe {safePct}%
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-3 h-3 rounded-full bg-yellow-500" />
              Suspicious {suspiciousPct}%
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              Malicious {maliciousPct}%
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <div className="rounded-3xl border border-cyan-500/20 bg-black/70 backdrop-blur-sm p-6 shadow-[0_0_35px_rgba(34,211,238,0.10)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_0_50px_rgba(34,211,238,0.18)]">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                  <TerminalSquare className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-cyan-300">URL Threat Scanner</h2>
                  <p className="text-sm text-slate-400">
                    Analyze suspicious links using rules, ML, and live threat intelligence checks.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="url" className="text-sm font-medium text-cyan-200">
                    Enter URL
                  </label>
                  <input
                    id="url"
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="mt-2 w-full h-12 px-4 rounded-2xl bg-slate-950 border border-cyan-500/20 text-sm text-cyan-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleScan}
                    disabled={loading}
                    className="flex-1 h-12 rounded-2xl bg-cyan-600 text-white font-medium flex items-center justify-center gap-2 hover:bg-cyan-500 hover:scale-105 active:scale-95 transition-all disabled:opacity-60"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        Full Scan
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleQuickCheck}
                    disabled={quickChecking}
                    className="flex-1 h-12 rounded-2xl border border-cyan-500/20 bg-slate-950 font-medium flex items-center justify-center gap-2 hover:bg-cyan-500/10 hover:scale-105 active:scale-95 transition-all disabled:opacity-60"
                  >
                    {quickChecking ? (
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Shield className="w-4 h-4" />
                        Quick ML Check
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {scanResult && (
              <>
                <div className="rounded-3xl border border-cyan-500/20 bg-black/70 backdrop-blur-sm p-6 shadow-[0_0_35px_rgba(34,211,238,0.10)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_0_50px_rgba(34,211,238,0.18)]">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-cyan-400" />
                      <h3 className="text-lg font-semibold text-cyan-300">Risk Meter</h3>
                    </div>
                    <span
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${getVerdictBadge(
                        scanResult.verdict
                      )}`}
                    >
                      {getVerdictIcon(scanResult.verdict)}
                      {scanResult.verdict || "Unknown"}
                    </span>
                  </div>

                  <div className="w-full h-[300px] mb-6 pointer-events-none">
                    <ThreatShield3D
                      threatLevel={
                        (scanResult.verdict as "Safe" | "Suspicious" | "Malicious") || "Unknown"
                      }
                    />
                  </div>

                  <div className="w-full h-5 rounded-full bg-slate-900 overflow-hidden border border-cyan-500/10">
                    <div
                      className={`h-full transition-all duration-700 ${currentRisk >= 60 ? "bg-red-500" : currentRisk >= 25 ? "bg-yellow-500" : "bg-green-500"
                        }`}
                      style={{ width: `${currentRisk}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-xs text-slate-400 mt-2">
                    <span>0 Safe</span>
                    <span>25 Suspicious</span>
                    <span>60+ Malicious</span>
                  </div>
                </div>

                <div className="rounded-3xl border border-cyan-500/20 bg-black/70 backdrop-blur-sm p-6 shadow-[0_0_35px_rgba(34,211,238,0.10)] space-y-5 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_0_50px_rgba(34,211,238,0.18)]">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-cyan-300">Full Scan Result</h3>
                      <p className="text-sm text-slate-400 break-all mt-1">{scanResult.url}</p>
                    </div>

                    <div
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium w-fit ${getVerdictBadge(
                        scanResult.verdict
                      )}`}
                    >
                      {getVerdictIcon(scanResult.verdict)}
                      {scanResult.verdict || "Unknown"}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="rounded-2xl border border-cyan-500/10 p-4 bg-slate-950">
                      <p className="text-xs text-slate-400">Threat Score</p>
                      <p className="text-2xl font-bold mt-1 text-cyan-100">{scanResult.score ?? "-"}</p>
                    </div>

                    <div className="rounded-2xl border border-cyan-500/10 p-4 bg-slate-950">
                      <p className="text-xs text-slate-400">ML Prediction</p>
                      <p className="text-lg font-semibold mt-1 text-cyan-100">{scanResult.ml_result?.verdict || "-"}</p>
                    </div>

                    <div className="rounded-2xl border border-cyan-500/10 p-4 bg-slate-950">
                      <p className="text-xs text-slate-400">ML Confidence</p>
                      <p className="text-lg font-semibold mt-1 text-cyan-100">
                        {scanResult.ml_result?.confidence ?? "-"}%
                      </p>
                    </div>

                    <div className="rounded-2xl border border-cyan-500/10 p-4 bg-slate-950">
                      <p className="text-xs text-slate-400">Threat Feeds</p>
                      <p className="text-sm font-medium mt-1 text-cyan-100">
                        GSB: {scanResult.google_safe_browsing?.used ? "Yes" : "No"} | VT:{" "}
                        {scanResult.virustotal?.used ? "Yes" : "No"}
                      </p>
                    </div>
                  </div>

                  {(scanResult.ml_result?.safe_probability !== undefined ||
                    scanResult.ml_result?.malicious_probability !== undefined) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="rounded-2xl border border-cyan-500/10 p-4 bg-slate-950">
                          <p className="text-xs text-slate-400">Safe Probability</p>
                          <p className="text-lg font-semibold mt-1 text-cyan-100">
                            {scanResult.ml_result?.safe_probability ?? "-"}%
                          </p>
                        </div>

                        <div className="rounded-2xl border border-cyan-500/10 p-4 bg-slate-950">
                          <p className="text-xs text-slate-400">Malicious Probability</p>
                          <p className="text-lg font-semibold mt-1 text-cyan-100">
                            {scanResult.ml_result?.malicious_probability ?? "-"}%
                          </p>
                        </div>
                      </div>
                    )}

                  <div className="rounded-2xl border border-cyan-500/10 p-4 bg-slate-950">
                    <h4 className="font-semibold mb-3 text-cyan-300">Reasons</h4>
                    <ul className="space-y-2">
                      {(scanResult.reasons || []).map((reason, index) => (
                        <li key={index} className="text-sm text-slate-300">
                          • {reason}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {scanResult.explanation && (
                    <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-5 h-5 text-cyan-400" />
                        <h4 className="font-semibold text-cyan-300">AI Explanation</h4>
                      </div>
                      <p className="text-sm text-slate-300 leading-6 whitespace-pre-line">
                        {scanResult.explanation}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

            {quickCheckResult && (
              <div className="rounded-3xl border border-cyan-500/20 bg-black/70 backdrop-blur-sm p-6 shadow-[0_0_35px_rgba(34,211,238,0.10)] space-y-5 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_0_50px_rgba(34,211,238,0.18)]">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-cyan-300">Quick ML Check Result</h3>
                    <p className="text-sm text-slate-400 break-all mt-1">{quickCheckResult.url}</p>
                  </div>

                  <div
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium w-fit ${getVerdictBadge(
                      quickCheckResult.verdict
                    )}`}
                  >
                    {getVerdictIcon(quickCheckResult.verdict)}
                    {quickCheckResult.verdict || "Unknown"}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-2xl border border-cyan-500/10 p-4 bg-slate-950">
                    <p className="text-xs text-slate-400">Confidence</p>
                    <p className="text-xl font-semibold mt-1 text-cyan-100">
                      {quickCheckResult.confidence ?? "-"}%
                    </p>
                  </div>

                  <div className="rounded-2xl border border-cyan-500/10 p-4 bg-slate-950">
                    <p className="text-xs text-slate-400">Safe Probability</p>
                    <p className="text-xl font-semibold mt-1 text-cyan-100">
                      {quickCheckResult.safe_probability ?? "-"}%
                    </p>
                  </div>

                  <div className="rounded-2xl border border-cyan-500/10 p-4 bg-slate-950">
                    <p className="text-xs text-slate-400">Malicious Probability</p>
                    <p className="text-xl font-semibold mt-1 text-cyan-100">
                      {quickCheckResult.malicious_probability ?? "-"}%
                    </p>
                  </div>
                </div>

                {quickCheckResult.reasons && quickCheckResult.reasons.length > 0 && (
                  <div className="rounded-2xl border border-cyan-500/10 p-4 bg-slate-950">
                    <h4 className="font-semibold mb-3 text-cyan-300">Model Reasons</h4>
                    <ul className="space-y-2">
                      {quickCheckResult.reasons.map((reason, index) => (
                        <li key={index} className="text-sm text-slate-300">
                          • {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-cyan-500/20 bg-black/70 backdrop-blur-sm p-5 shadow-[0_0_35px_rgba(34,211,238,0.10)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_0_50px_rgba(34,211,238,0.18)]">
              <div className="flex items-center gap-3 mb-4">
                <History className="w-5 h-5 text-cyan-400" />
                <div>
                  <h2 className="text-lg font-semibold text-cyan-300">Scan History</h2>
                  <p className="text-sm text-slate-400">Search and filter recent results</p>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="Search by URL or verdict"
                    className="w-full h-11 pl-10 pr-4 rounded-2xl border border-cyan-500/20 bg-slate-950 text-sm text-cyan-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  />
                </div>

                <div className="relative">
                  <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    value={historyFilter}
                    onChange={(e) =>
                      setHistoryFilter(e.target.value as "all" | "safe" | "suspicious" | "malicious")
                    }
                    className="w-full h-11 pl-10 pr-4 rounded-2xl border border-cyan-500/20 bg-slate-950 text-sm text-cyan-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  >
                    <option value="all">All verdicts</option>
                    <option value="safe">Safe</option>
                    <option value="suspicious">Suspicious</option>
                    <option value="malicious">Malicious</option>
                  </select>
                </div>
              </div>

              {historyLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-cyan-500/10 p-4 bg-slate-950 animate-pulse"
                    >
                      <div className="h-4 w-24 bg-slate-800 rounded mb-3" />
                      <div className="h-4 w-full bg-slate-800 rounded mb-2" />
                      <div className="h-3 w-2/3 bg-slate-800 rounded" />
                    </div>
                  ))}
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-cyan-500/20 bg-slate-950 p-8 text-center">
                  <History className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-300 font-medium">No scan history found</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Try a new scan or adjust the search and filter.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[560px] overflow-auto pr-1">
                  {filteredHistory.map((item, index) => (
                    <div
                      key={`${item.url}-${index}`}
                      className="rounded-2xl border border-cyan-500/10 p-4 bg-slate-950 hover:border-cyan-500/30 transition"
                    >
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getVerdictBadge(
                            item.verdict
                          )}`}
                        >
                          {getVerdictIcon(item.verdict)}
                          {item.verdict}
                        </span>
                        <span className="text-xs text-slate-400">{item.created_at}</span>
                      </div>

                      <p className="text-sm font-medium break-all text-cyan-100">{item.url}</p>
                      <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                        <span>Score: {item.score}</span>
                        <span className="inline-flex items-center gap-1">
                          Details <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        Reasons: {formatReasons(item.reasons)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-cyan-500/20 bg-black/70 backdrop-blur-sm p-5 shadow-[0_0_35px_rgba(34,211,238,0.10)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_0_50px_rgba(34,211,238,0.18)]">
              <h3 className="text-lg font-semibold mb-2 text-cyan-300">Operator Tips</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>• Safe, suspicious, and malicious scans trigger live security alerts</li>
                <li>• Voice messages can be toggled from the top bar</li>
                <li>• Full Scan uses rules, ML, Safe Browsing, and VirusTotal</li>
                <li>• Search and filter help review previous scans quickly</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
</div>
);
};

export default Dashboard;