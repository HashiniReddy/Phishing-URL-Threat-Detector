import { verifyOtp } from "../lib/api";
import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ShieldCheck, RotateCw } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { useToast } from "@/hooks/use-toast";

const VerifyOtp = () => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);

  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || "";

  useEffect(() => {
    if (!email) {
      toast({
        title: "Missing email",
        description: "Please sign up first.",
        variant: "destructive",
      });
      navigate("/signup");
    }
  }, [email, navigate, toast]);

  useEffect(() => {
    if (timer <= 0) {
      setCanResend(true);
      return;
    }

    const interval = setInterval(() => {
      setTimer((t) => t - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);

      if (pasted.length === 0) return;

      const newOtp = ["", "", "", "", "", ""];
      for (let i = 0; i < 6; i++) {
        newOtp[i] = pasted[i] || "";
      }

      setOtp(newOtp);

      const focusIndex = Math.min(pasted.length, 5);
      document.getElementById(`otp-${focusIndex}`)?.focus();
    },
    []
  );

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    const code = otp.join("");

    if (code.length !== 6) {
      toast({
        title: "Incomplete OTP",
        description: "Please enter all 6 digits.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await verifyOtp({
        email: email,
        otp: code,
      });

      if (response.status === "success") {
        toast({
          title: "Verified!",
          description: "Your account has been verified successfully.",
        });

        navigate("/login");
      } else {
        toast({
          title: "Verification failed",
          description: response.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong while verifying OTP.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    setTimer(60);
    setCanResend(false);
    setOtp(["", "", "", "", "", ""]);

    toast({
      title: "Resend not connected yet",
      description: "We will connect real resend OTP next.",
    });
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <AuthLayout
      title="Verify your email"
      subtitle={`Enter the 6-digit code sent to ${email || "your email"}`}
    >
      <form onSubmit={handleVerify} className="space-y-6">
        <div className="flex justify-center gap-3" onPaste={handlePaste}>
          {otp.map((digit, index) => (
            <input
              key={index}
              id={`otp-${index}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-12 h-14 text-center text-xl font-mono font-semibold rounded-lg bg-muted border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all"
            />
          ))}
        </div>

        <div className="text-center">
          {canResend ? (
            <button
              type="button"
              onClick={handleResend}
              className="text-sm text-primary hover:text-primary/80 font-medium flex items-center justify-center gap-1.5 mx-auto transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" />
              Resend OTP
            </button>
          ) : (
            <p className="text-sm text-muted-foreground">
              Resend code in{" "}
              <span className="text-foreground font-mono font-medium">
                {formatTime(timer)}
              </span>
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-medium text-sm flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:pointer-events-none"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              Verify OTP
            </>
          )}
        </button>

        <p className="text-center text-sm text-muted-foreground">
          <Link
            to="/signup"
            className="text-primary hover:text-primary/80 font-medium transition-colors"
          >
            ← Back to signup
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default VerifyOtp;