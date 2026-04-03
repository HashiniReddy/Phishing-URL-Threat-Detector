import { verifyOtp } from "@/lib/api";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { KeyRound, ShieldCheck, TerminalSquare, Cpu, Radar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Canvas } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { ParticleField } from "@/components/CyberBackground3D";

type PopupState = {
  show: boolean;
  title: string;
  message: string;
  type: "success" | "error" | "warning";
};

const VerifyOtp = () => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState<PopupState>({
    show: false,
    title: "",
    message: "",
    type: "success",
  });
  const [typedTitle, setTypedTitle] = useState("");

  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTimeoutRef = useRef<number | null>(null);

  const email =
    location.state?.email ||
    localStorage.getItem("pendingOtpEmail") ||
    localStorage.getItem("userEmail") ||
    "";

  useEffect(() => {
    const fullText = "OTP VERIFICATION NODE";
    let index = 0;
    setTypedTitle("");

    const interval = window.setInterval(() => {
      index += 1;
      setTypedTitle(fullText.slice(0, index));
      if (index >= fullText.length) clearInterval(interval);
    }, 70);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!email) navigate("/login", { replace: true });

    return () => {
      if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current);
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, [email, navigate]);

  const speakMessage = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  const showBigPopup = (
    title: string,
    message: string,
    type: "success" | "error" | "warning" = "success"
  ) => {
    setPopup({ show: true, title, message, type });
  };

  const closePopup = () => {
    setPopup((prev) => ({ ...prev, show: false }));
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const trimmedOtp = otp.trim();

    if (!trimmedOtp) {
      toast({
        title: "OTP required",
        description: "Please enter the OTP.",
        variant: "destructive",
      });
      showBigPopup("OTP REQUIRED", "Please enter the OTP.", "error");
      return;
    }

    try {
      setLoading(true);

      const response = await verifyOtp({
        email,
        otp: trimmedOtp,
      });

      if (response.status === "success") {
        if (response.token) {
          localStorage.setItem("token", response.token);
          localStorage.setItem("isLoggedIn", "true");
        }

        localStorage.removeItem("pendingOtpEmail");

        toast({
          title: "Verification successful",
          description: response.message || "OTP verified successfully.",
          duration: 3000,
        });

        showBigPopup(
          "VERIFICATION COMPLETE",
          response.message || "OTP verified successfully. Redirecting to dashboard...",
          "success"
        );
        speakMessage("Verification complete. Redirecting to dashboard.");

        redirectTimeoutRef.current = window.setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 1500);

        return;
      }

      toast({
        title: "Verification failed",
        description: response.message || "Invalid OTP.",
        variant: "destructive",
      });

      showBigPopup("VERIFICATION FAILED", response.message || "Invalid OTP.", "error");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Something went wrong while verifying OTP.",
        variant: "destructive",
      });

      showBigPopup(
        "SYSTEM ERROR",
        error?.message || "Something went wrong while verifying OTP.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-screen bg-black overflow-hidden relative">
      <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
        <fog attach="fog" args={["#020617", 2, 10]} />
        <ambientLight intensity={0.5} />
        <ParticleField />
        
        <Html center wrapperClass="w-screen h-screen flex pointer-events-auto items-center justify-center">
          <div className="w-full max-w-[1400px] h-full text-white relative overflow-hidden flex mx-auto">
            <div className="fixed inset-0 pointer-events-none -z-30 bg-[radial-gradient(circle_at_center,rgba(0,255,255,0.05),transparent_60%)]" />
            <div
              className="fixed inset-0 pointer-events-none -z-20 opacity-20"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(34,211,238,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.12) 1px, transparent 1px)",
                backgroundSize: "32px 32px",
              }}
            />

            {popup.show && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 px-4 backdrop-blur-sm pointer-events-auto">
                <div
                  className={`w-full max-w-md rounded-3xl border p-6 text-center shadow-2xl ${popup.type === "success"
                      ? "bg-green-950/90 border-green-500 text-white"
                      : popup.type === "warning"
                        ? "bg-yellow-950/90 border-yellow-500 text-white"
                        : "bg-red-950/90 border-red-500 text-white"
                    }`}
                >
                  <h2 className="text-2xl font-bold tracking-[0.2em]">{popup.title}</h2>
                  <p className="mt-3 text-sm leading-6 opacity-90">{popup.message}</p>
                  <button
                    onClick={closePopup}
                    className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-white/10 px-5 text-sm font-medium hover:bg-white/20 transition"
                  >
                    OK
                  </button>
                </div>
              </div>
            )}

            <div className="hidden md:flex w-1/2 items-center justify-center p-10 z-10">
              <div className="max-w-xl w-full" style={{ perspective: '1000px' }}>
                <div className="mb-8 rounded-3xl border border-cyan-500/20 bg-black/70 backdrop-blur-sm p-8 shadow-[0_0_50px_rgba(34,211,238,0.10)] transition-transform duration-500 hover:scale-[1.02] hover:-rotate-y-3">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="rounded-2xl bg-cyan-500/10 p-4 border border-cyan-500/30">
                      <ShieldCheck className="h-10 w-10 text-cyan-400" />
                    </div>
                    <div>
                      <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-300 to-cyan-500 bg-clip-text text-transparent">
                        Threat Detection System
                      </h1>
                      <p className="text-cyan-400/70 text-sm tracking-[0.25em] mt-1">
                        SECONDARY AUTHENTICATION
                      </p>
                    </div>
                  </div>

                  <p className="text-2xl leading-10 text-slate-200 mb-8">
                    Complete the one-time password challenge to activate operator access.
                  </p>

                  <div className="space-y-4">
                    <div className="rounded-2xl border border-cyan-500/20 bg-slate-950/80 p-5 flex items-center gap-3">
                      <TerminalSquare className="h-5 w-5 text-cyan-400" />
                      <span className="text-slate-200">One-time passcode validation</span>
                    </div>
                    <div className="rounded-2xl border border-cyan-500/20 bg-slate-950/80 p-5 flex items-center gap-3">
                      <Cpu className="h-5 w-5 text-cyan-400" />
                      <span className="text-slate-200">Multi-step access control</span>
                    </div>
                    <div className="rounded-2xl border border-cyan-500/20 bg-slate-950/80 p-5 flex items-center gap-3">
                      <Radar className="h-5 w-5 text-cyan-400" />
                      <span className="text-slate-200">Secure dashboard entry sequence</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full md:w-1/2 flex items-center justify-center px-6 py-10 z-10">
              <div className="w-full max-w-md" style={{ perspective: '1000px' }}>
                <div className="rounded-3xl border border-cyan-500/20 bg-black/70 backdrop-blur-sm p-8 shadow-[0_0_50px_rgba(34,211,238,0.10)] transition-transform duration-500 hover:scale-[1.02] hover:rotate-y-3">
                  <div className="mb-6">
                    <p className="text-cyan-400/70 text-xs tracking-[0.35em] mb-3 min-h-[16px]">
                      {typedTitle}
                      <span className="animate-pulse">▌</span>
                    </p>
                    <h2 className="text-4xl font-bold bg-gradient-to-r from-cyan-300 to-cyan-500 bg-clip-text text-transparent">
                      Verify OTP
                    </h2>
                    <p className="mt-3 text-sm text-slate-400 break-all">
                      Enter the code sent to {email}
                    </p>
                  </div>

                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-cyan-200" htmlFor="otp">
                        One-time password
                      </label>
                      <input
                        id="otp"
                        type="text"
                        inputMode="numeric"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="Enter OTP"
                        required
                        className="w-full h-12 px-4 rounded-2xl bg-slate-950 border border-cyan-500/20 text-cyan-100 placeholder:text-slate-500 text-sm tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-cyan-500/30 pointer-events-auto"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 mt-2 rounded-2xl bg-cyan-600 text-white font-medium text-sm flex items-center justify-center gap-2 hover:bg-cyan-500 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 pointer-events-auto"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <KeyRound className="w-4 h-4" />
                          Verify OTP
                        </>
                      )}
                    </button>

                    <p className="text-center text-sm text-slate-400 pt-2">
                      Back to{" "}
                      <a 
                        href="/login" 
                        onClick={(e) => {
                          e.preventDefault();
                          navigate("/login");
                        }}
                        className="text-cyan-400 hover:text-cyan-300 font-medium pointer-events-auto cursor-pointer"
                      >
                        login
                      </a>
                    </p>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </Html>
      </Canvas>
    </div>
  );
};

export default VerifyOtp;