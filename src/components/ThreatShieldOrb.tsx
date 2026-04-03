import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";

type ThreatLevel = "Safe" | "Suspicious" | "Malicious" | "Unknown";

type ThemeConfig = {
    label: string;
    icon: JSX.Element;
    orbClass: string;
    particleClass: string;
    textClass: string;
    ringClass: string;
    glowClass: string;
    beamClass: string;
};

const THEMES: Record<ThreatLevel, ThemeConfig> = {
    Safe: {
        label: "SAFE",
        icon: <CheckCircle2 className="w-12 h-12 text-white" />,
        orbClass: "bg-green-500/20 border-green-500",
        particleClass: "bg-green-400",
        textClass: "text-green-400",
        ringClass: "border-green-500/40",
        glowClass: "shadow-[0_0_90px_rgba(34,197,94,0.45)]",
        beamClass: "from-green-500/0 via-green-400/30 to-green-500/0",
    },
    Suspicious: {
        label: "SUSPICIOUS",
        icon: <AlertTriangle className="w-12 h-12 text-white" />,
        orbClass: "bg-yellow-500/20 border-yellow-500",
        particleClass: "bg-yellow-300",
        textClass: "text-yellow-300",
        ringClass: "border-yellow-500/40",
        glowClass: "shadow-[0_0_90px_rgba(234,179,8,0.45)]",
        beamClass: "from-yellow-500/0 via-yellow-300/30 to-yellow-500/0",
    },
    Malicious: {
        label: "MALICIOUS",
        icon: <ShieldAlert className="w-12 h-12 text-white" />,
        orbClass: "bg-red-500/20 border-red-500",
        particleClass: "bg-red-400",
        textClass: "text-red-400",
        ringClass: "border-red-500/40",
        glowClass: "shadow-[0_0_100px_rgba(239,68,68,0.5)]",
        beamClass: "from-red-500/0 via-red-400/30 to-red-500/0",
    },
    Unknown: {
        label: "UNKNOWN",
        icon: <AlertTriangle className="w-12 h-12 text-white" />,
        orbClass: "bg-cyan-500/20 border-cyan-500",
        particleClass: "bg-cyan-300",
        textClass: "text-cyan-300",
        ringClass: "border-cyan-500/40",
        glowClass: "shadow-[0_0_90px_rgba(34,211,238,0.35)]",
        beamClass: "from-cyan-500/0 via-cyan-300/30 to-cyan-500/0",
    },
};

const particles = [
    { className: "top-[8%] left-[12%]", duration: 4.8 },
    { className: "top-[14%] right-[10%]", duration: 5.3 },
    { className: "bottom-[12%] left-[10%]", duration: 5.9 },
    { className: "bottom-[10%] right-[12%]", duration: 4.7 },
    { className: "top-[48%] left-[4%]", duration: 4.4 },
    { className: "top-[52%] right-[4%]", duration: 5.1 },
    { className: "top-[22%] left-[26%]", duration: 4.9 },
    { className: "bottom-[24%] right-[25%]", duration: 5.8 },
    { className: "top-[68%] left-[22%]", duration: 4.6 },
    { className: "top-[32%] right-[24%]", duration: 5.6 },
];

export default function ThreatShieldOrb({
    threatLevel = "Unknown",
}: {
    threatLevel?: ThreatLevel;
}) {
    const theme = THEMES[threatLevel] || THEMES.Unknown;

    return (
        <div className="relative w-full h-full min-h-[300px] overflow-hidden rounded-3xl border border-cyan-500/20 bg-black">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,255,0.08),transparent_55%)]" />
            <div
                className="absolute inset-0 opacity-20"
                style={{
                    backgroundImage:
                        "linear-gradient(rgba(34,211,238,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.12) 1px, transparent 1px)",
                    backgroundSize: "28px 28px",
                }}
            />

            <motion.div
                className={`absolute inset-x-0 top-1/2 h-px bg-gradient-to-r ${theme.beamClass}`}
                animate={{ opacity: [0.25, 0.8, 0.25], scaleX: [0.85, 1.02, 0.85] }}
                transition={{ duration: 2.8, repeat: Infinity }}
            />
            <motion.div
                className={`absolute inset-y-0 left-1/2 w-px bg-gradient-to-b ${theme.beamClass}`}
                animate={{ opacity: [0.15, 0.5, 0.15], scaleY: [0.85, 1.02, 0.85] }}
                transition={{ duration: 3.2, repeat: Infinity }}
            />

            {particles.map((particle, index) => (
                <motion.span
                    key={index}
                    className={`absolute w-2.5 h-2.5 rounded-full blur-[1px] ${particle.className} ${theme.particleClass}`}
                    animate={{
                        x: [0, 18, -12, 0],
                        y: [0, -20, 10, 0],
                        scale: [1, 1.4, 0.8, 1],
                        opacity: [0.25, 1, 0.35, 0.25],
                    }}
                    transition={{
                        duration: particle.duration,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
            ))}

            <div className="absolute top-4 left-4 text-[10px] tracking-[0.35em] text-cyan-400/70">
                CORE VISUALIZER
            </div>
            <div className="absolute top-4 right-4 text-[10px] tracking-[0.35em] text-cyan-400/70">
                LIVE SIGNAL
            </div>

            <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                    className={`absolute w-60 h-60 rounded-full border ${theme.ringClass}`}
                    animate={{ rotate: 360, scale: [1, 1.04, 1] }}
                    transition={{
                        rotate: { duration: 10, repeat: Infinity, ease: "linear" },
                        scale: { duration: 4, repeat: Infinity },
                    }}
                />
                <motion.div
                    className={`absolute w-48 h-48 rounded-full border ${theme.ringClass} opacity-70`}
                    animate={{ rotate: -360, scale: [1, 0.96, 1] }}
                    transition={{
                        rotate: { duration: 7, repeat: Infinity, ease: "linear" },
                        scale: { duration: 3, repeat: Infinity },
                    }}
                />
                <motion.div
                    className={`absolute w-36 h-36 rounded-full border ${theme.ringClass} opacity-30`}
                    animate={{ scale: [1, 1.7], opacity: [0.55, 0] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
                />
                <motion.div
                    className={`absolute w-24 h-24 rounded-full border ${theme.ringClass} opacity-20`}
                    animate={{ scale: [1, 2.3], opacity: [0.5, 0] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut", delay: 0.6 }}
                />
                <motion.div
                    className={`relative w-32 h-32 rounded-full border flex items-center justify-center ${theme.orbClass} ${theme.glowClass}`}
                    animate={{
                        y: [0, -8, 0, 8, 0],
                        rotate: [0, 2, 0, -2, 0],
                        scale: [1, 1.03, 1],
                    }}
                    transition={{
                        duration: 4.8,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                >
                    <motion.div
                        className="absolute inset-2 rounded-full border border-white/20"
                        animate={{ opacity: [0.15, 0.6, 0.15] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                    {theme.icon}
                </motion.div>
            </div>

            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-center">
                <motion.p
                    className={`text-sm font-semibold tracking-[0.45em] ${theme.textClass}`}
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                >
                    {theme.label}
                </motion.p>
                <p className="mt-2 text-[11px] tracking-[0.3em] text-cyan-400/60">
                    CINEMATIC HACKER MODE
                </p>
            </div>
        </div>
    );
}