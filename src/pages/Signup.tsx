import { signupUser } from "@/lib/api";
import SecurityPopup3D from "@/components/ui/SecurityPopup3D";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, ShieldCheck, UserPlus, TerminalSquare, Cpu, Radar } from "lucide-react";
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

const Signup = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
  const redirectTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const fullText = "ACCOUNT CREATION PORTAL";
    let index = 0;
    setTypedTitle("");

    const interval = window.setInterval(() => {
      index++;
      setTypedTitle(fullText.slice(0, index));
      if (index >= fullText.length) clearInterval(interval);
    }, 70);

    return () => clearInterval(interval);
  }, []);

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

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) navigate("/dashboard", { replace: true });

    return () => {
      if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current);
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, [navigate]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    if (!trimmedName || !trimmedEmail || !trimmedPassword || !trimmedConfirmPassword) {
      showBigPopup("INPUT ERROR", "Please fill all required fields.", "error");
      return;
    }

    if (trimmedPassword !== trimmedConfirmPassword) {
      showBigPopup("PASSWORD MISMATCH", "Passwords do not match.", "error");
      return;
    }

    if (trimmedPassword.length < 6) {
      showBigPopup("WEAK PASSWORD", "Password must be at least 6 characters.", "warning");
      return;
    }

    try {
      setLoading(true);

      const response = await signupUser({
        full_name: trimmedName,
        email: trimmedEmail,
        password: trimmedPassword,
      });

      if (response.status === "success") {
        localStorage.setItem("pendingOtpEmail", trimmedEmail);
        localStorage.setItem("userEmail", trimmedEmail);

        showBigPopup(
          "ACCOUNT CREATED",
          "OTP sent. Redirecting...",
          "success"
        );

        speakMessage("Account created successfully");

        redirectTimeoutRef.current = window.setTimeout(() => {
          navigate("/verify-otp", {
            replace: true,
            state: { email: trimmedEmail },
          });
        }, 1500);

        return;
      }

      showBigPopup("SIGNUP FAILED", response.message || "Failed", "error");
    } catch (error: any) {
      showBigPopup("SYSTEM ERROR", error?.message || "Error occurred", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-screen bg-black overflow-hidden relative">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
          <fog attach="fog" args={["#020617", 2, 10]} />
          <ambientLight intensity={0.5} />
          <ParticleField />
        </Canvas>
      </div>
        
      <div className="w-screen h-screen relative z-10 flex pointer-events-auto items-center justify-center overflow-y-auto">
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

            <SecurityPopup3D
              open={popup.show}
              title={popup.title}
              message={popup.message}
              type={popup.type}
              onClose={closePopup}
            />

            <div className="hidden md:flex w-1/2 items-center justify-center p-10 z-10">
              <div className="max-w-xl w-full" style={{ perspective: '1000px' }}>
                <div className="mb-8 rounded-3xl border border-cyan-500/20 bg-black/70 backdrop-blur-sm p-8 shadow-[0_0_50px_rgba(34,211,238,0.10)] transition-transform duration-500 hover:scale-[1.02] hover:-rotate-y-3">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="rounded-2xl bg-cyan-500/10 p-4 border border-cyan-500/30 shadow-[0_0_20px_rgba(34,211,238,0.15)]">
                      <ShieldCheck className="h-10 w-10 text-cyan-400" />
                    </div>
                    <div>
                      <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-300 to-cyan-500 bg-clip-text text-transparent">
                        Threat Detection System
                      </h1>
                      <p className="text-cyan-400/70 text-sm tracking-[0.25em] mt-1">
                        CINEMATIC SECURE ACCESS NODE
                      </p>
                    </div>
                  </div>

                  <p className="text-2xl leading-10 text-slate-200 mb-8">
                    Create an account to monitor URL safety, alerts, reports, and activity.
                  </p>

                  <div className="space-y-4">
                    <div className="rounded-2xl border border-cyan-500/20 bg-slate-950/80 p-5 flex items-center gap-3 shadow-[0_0_20px_rgba(34,211,238,0.05)]">
                      <UserPlus className="h-5 w-5 text-cyan-400" />
                      <span className="text-slate-200">Secure operator registration</span>
                    </div>
                    <div className="rounded-2xl border border-cyan-500/20 bg-slate-950/80 p-5 flex items-center gap-3 shadow-[0_0_20px_rgba(34,211,238,0.05)]">
                      <Cpu className="h-5 w-5 text-cyan-400" />
                      <span className="text-slate-200">OTP verification process</span>
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
                      Create Account
                    </h2>
                    <p className="mt-3 text-sm text-slate-400">
                      Sign up for a secure operator profile
                    </p>
                  </div>

                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-cyan-200" htmlFor="fullName">
                        Full Name
                      </label>
                      <input
                        id="fullName"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="John Doe"
                        required
                        className="w-full h-12 px-4 rounded-2xl bg-slate-950 border border-cyan-500/20 text-cyan-100 placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/40 transition-all pointer-events-auto"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-cyan-200" htmlFor="email">
                        Email
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className="w-full h-12 px-4 rounded-2xl bg-slate-950 border border-cyan-500/20 text-cyan-100 placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/40 transition-all pointer-events-auto"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-cyan-200" htmlFor="password">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your password"
                          required
                          className="w-full h-12 px-4 pr-12 rounded-2xl bg-slate-950 border border-cyan-500/20 text-cyan-100 placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/40 transition-all pointer-events-auto"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-300 transition-colors pointer-events-auto"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-cyan-200" htmlFor="confirmPassword">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm your password"
                          required
                          className="w-full h-12 px-4 pr-12 rounded-2xl bg-slate-950 border border-cyan-500/20 text-cyan-100 placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/40 transition-all pointer-events-auto"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-300 transition-colors pointer-events-auto"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 mt-2 rounded-2xl bg-cyan-600 text-white font-medium text-sm flex items-center justify-center gap-2 hover:bg-cyan-500 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 disabled:pointer-events-none shadow-[0_0_25px_rgba(34,211,238,0.18)] pointer-events-auto"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          Sign Up
                        </>
                      )}
                    </button>

                    <p className="text-center text-sm text-slate-400 pt-2">
                      Already have an account?{" "}
                      <a
                        href="/login"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate("/login");
                        }}
                        className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors pointer-events-auto cursor-pointer"
                      >
                        Sign in
                      </a>
                    </p>
                  </form>
                </div>
              </div>
            </div>
          </div>
      </div>
    </div>
  );
};

export default Signup;