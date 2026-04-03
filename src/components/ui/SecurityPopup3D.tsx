import { motion, AnimatePresence } from "framer-motion";
import {
    AlertTriangle,
    CheckCircle2,
    ShieldAlert,
    X,
    ScanSearch,
    Siren,
} from "lucide-react";
import { useEffect } from "react";

type PopupType = "success" | "error" | "warning";

type SecurityPopup3DProps = {
    open: boolean;
    title: string;
    message: string;
    type?: PopupType;
    onClose: () => void;
};

const themeMap = {
    success: {
        panel: "border-cyan-400/40 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.15),rgba(0,0,0,0.96)_58%)]",
        glow: "shadow-[0_0_90px_rgba(34,211,238,0.25)]",
        ring: "border-cyan-400/30",
        iconWrap: "bg-cyan-500/20 border-cyan-400/40",
        icon: <CheckCircle2 className="h-10 w-10 text-cyan-300" />,
        title: "text-cyan-200",
        accent: "from-cyan-300 via-sky-200 to-cyan-500",
        button: "bg-cyan-500/20 text-cyan-100 border-cyan-400/30 hover:bg-cyan-500/30",
        beam: "from-transparent via-cyan-300/60 to-transparent",
        badge: "bg-cyan-500/15 text-cyan-200 border-cyan-400/25",
        pulse: "bg-cyan-400/20",
    },
    warning: {
        panel: "border-cyan-400/40 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.15),rgba(0,0,0,0.96)_58%)]",
        glow: "shadow-[0_0_90px_rgba(34,211,238,0.25)]",
        ring: "border-cyan-400/30",
        iconWrap: "bg-yellow-500/20 border-yellow-400/40",
        icon: <AlertTriangle className="h-10 w-10 text-yellow-300" />,
        title: "text-yellow-200",
        accent: "from-yellow-300 via-amber-200 to-yellow-500",
        button: "bg-cyan-500/20 text-cyan-100 border-cyan-400/30 hover:bg-cyan-500/30",
        beam: "from-transparent via-cyan-300/60 to-transparent",
        badge: "bg-yellow-500/15 text-yellow-200 border-yellow-400/25",
        pulse: "bg-cyan-400/20",
    },
    error: {
        panel: "border-cyan-400/40 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.15),rgba(0,0,0,0.96)_58%)]",
        glow: "shadow-[0_0_90px_rgba(34,211,238,0.25)]",
        ring: "border-cyan-400/30",
        iconWrap: "bg-red-500/20 border-red-400/40",
        icon: <ShieldAlert className="h-10 w-10 text-red-300" />,
        title: "text-red-200",
        accent: "from-red-300 via-rose-200 to-red-500",
        button: "bg-cyan-500/20 text-cyan-100 border-cyan-400/30 hover:bg-cyan-500/30",
        beam: "from-transparent via-cyan-300/60 to-transparent",
        badge: "bg-red-500/15 text-red-200 border-red-400/25",
        pulse: "bg-cyan-400/20",
    },
} as const;

function usePopupSound(open: boolean, type: PopupType) {
    useEffect(() => {
        if (!open) return;

        const AudioContextClass =
            window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

        if (!AudioContextClass) return;

        const ctx = new AudioContextClass();
        const now = ctx.currentTime;

        const playBeep = (
            time: number,
            frequency: number,
            duration: number,
            gainValue: number,
            wave: OscillatorType = "sine"
        ) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = wave;
            osc.frequency.setValueAtTime(frequency, time);
            gain.gain.setValueAtTime(0.0001, time);
            gain.gain.exponentialRampToValueAtTime(gainValue, time + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(time);
            osc.stop(time + duration + 0.02);
        };

        if (type === "error") {
            playBeep(now, 220, 0.18, 0.04, "sawtooth");
            playBeep(now + 0.22, 180, 0.22, 0.05, "square");
            playBeep(now + 0.5, 140, 0.28, 0.05, "sawtooth");
        } else if (type === "warning") {
            playBeep(now, 520, 0.12, 0.03);
            playBeep(now + 0.18, 520, 0.12, 0.03);
            playBeep(now + 0.36, 420, 0.16, 0.025);
        } else {
            playBeep(now, 700, 0.12, 0.025);
            playBeep(now + 0.16, 880, 0.16, 0.03);
        }

        return () => {
            if (ctx.state !== "closed") {
                ctx.close().catch(() => { });
            }
        };
    }, [open, type]);
}

export default function SecurityPopup3D({
    open,
    title,
    message,
    type = "success",
    onClose,
}: SecurityPopup3DProps) {
    const theme = themeMap[type];
    usePopupSound(open, type);

    const containerAnimation =
        type === "error"
            ? {
                scale: [0.98, 1, 0.995, 1],
                x: [0, -6, 6, -4, 4, 0],
            }
            : {
                scale: [0.96, 1],
                x: 0,
            };

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 px-4 backdrop-blur-md"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.88, rotateX: -14, y: 34 }}
                        animate={containerAnimation}
                        exit={{ opacity: 0, scale: 0.94, y: 18 }}
                        transition={{
                            duration: type === "error" ? 0.45 : 0.35,
                            ease: "easeOut",
                        }}
                        style={{ transformStyle: "preserve-3d", perspective: 1400 }}
                        className={`relative w-full max-w-2xl overflow-hidden rounded-[34px] border ${theme.panel} ${theme.glow}`}
                    >
                        {type === "error" && (
                            <>
                                <motion.div
                                    className="absolute inset-0 bg-red-500/5"
                                    animate={{ opacity: [0.04, 0.14, 0.04] }}
                                    transition={{ duration: 0.5, repeat: 5 }}
                                />
                                <motion.div
                                    className="absolute inset-0"
                                    animate={{ opacity: [0, 0.12, 0] }}
                                    transition={{ duration: 0.18, repeat: 6 }}
                                    style={{
                                        background:
                                            "linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.08) 48%, transparent 52%, transparent 100%)",
                                    }}
                                />
                            </>
                        )}

                        <div className="absolute inset-0 opacity-20">
                            <div
                                className="h-full w-full"
                                style={{
                                    backgroundImage:
                                        "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
                                    backgroundSize: "28px 28px",
                                }}
                            />
                        </div>

                        <motion.div
                            className={`absolute left-0 right-0 top-20 h-px bg-gradient-to-r ${theme.beam}`}
                            animate={{
                                opacity: [0.15, 0.95, 0.15],
                                scaleX: [0.88, 1.04, 0.88],
                                y: [0, 3, 0],
                            }}
                            transition={{ duration: 2.2, repeat: Infinity }}
                        />

                        <motion.div
                            className={`absolute -left-20 top-1/2 h-44 w-44 -translate-y-1/2 rounded-full border ${theme.ring}`}
                            animate={{ rotate: 360 }}
                            transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
                        />
                        <motion.div
                            className={`absolute -right-16 top-10 h-28 w-28 rounded-full border ${theme.ring} opacity-60`}
                            animate={{ rotate: -360 }}
                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        />
                        <motion.div
                            className={`absolute bottom-8 left-10 h-24 w-24 rounded-full border ${theme.ring} opacity-50`}
                            animate={{ scale: [1, 1.22, 1], opacity: [0.22, 0.55, 0.22] }}
                            transition={{ duration: 3, repeat: Infinity }}
                        />

                        <motion.div
                            className={`absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl ${theme.pulse}`}
                            animate={{ scale: [0.9, 1.08, 0.9], opacity: [0.45, 0.7, 0.45] }}
                            transition={{ duration: 2.4, repeat: Infinity }}
                        />

                        <button
                            onClick={onClose}
                            className="absolute right-4 top-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10"
                            aria-label="Close popup"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <div className="relative z-10 p-8 md:p-10">
                            <div className="flex flex-col gap-6 md:flex-row md:items-start">
                                <div className="relative mx-auto md:mx-0">
                                    <motion.div
                                        className={`absolute inset-0 rounded-full blur-xl ${theme.iconWrap}`}
                                        animate={{ scale: [1, 1.22, 1], opacity: [0.45, 0.95, 0.45] }}
                                        transition={{ duration: 1.9, repeat: Infinity }}
                                    />
                                    <motion.div
                                        className={`relative flex h-24 w-24 items-center justify-center rounded-full border ${theme.iconWrap} backdrop-blur-sm`}
                                        animate={{
                                            y: [0, -7, 0],
                                            rotate: [0, 2, 0, -2, 0],
                                        }}
                                        transition={{ duration: 3.5, repeat: Infinity }}
                                    >
                                        {theme.icon}
                                    </motion.div>
                                </div>

                                <div className="flex-1 text-center md:text-left">
                                    <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center">
                                        <span
                                            className={`inline-flex items-center gap-2 self-center rounded-full border px-3 py-1 text-xs tracking-[0.28em] md:self-auto ${theme.badge}`}
                                        >
                                            {type === "error" ? (
                                                <Siren className="h-3.5 w-3.5" />
                                            ) : (
                                                <ScanSearch className="h-3.5 w-3.5" />
                                            )}
                                            SECURITY EVENT
                                        </span>
                                    </div>

                                    <motion.h2
                                        className={`bg-gradient-to-r ${theme.accent} bg-clip-text text-3xl font-extrabold tracking-[0.12em] text-transparent md:text-4xl`}
                                        animate={
                                            type === "error"
                                                ? { opacity: [1, 0.82, 1, 0.9, 1] }
                                                : { opacity: [0.96, 1, 0.96] }
                                        }
                                        transition={{ duration: 1.2, repeat: Infinity }}
                                    >
                                        {title}
                                    </motion.h2>

                                    <p className="mt-4 max-w-xl text-sm leading-7 text-slate-200/90 md:text-base">
                                        {message}
                                    </p>

                                    <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left">
                                            <p className="text-[11px] tracking-[0.25em] text-slate-400">
                                                STATUS
                                            </p>
                                            <p className={`mt-2 text-sm font-semibold ${theme.title}`}>
                                                {type === "success"
                                                    ? "STABLE"
                                                    : type === "warning"
                                                        ? "CAUTION"
                                                        : "CRITICAL"}
                                            </p>
                                        </div>
                                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left">
                                            <p className="text-[11px] tracking-[0.25em] text-slate-400">
                                                ENGINE
                                            </p>
                                            <p className="mt-2 text-sm font-semibold text-cyan-200">
                                                AI MONITOR
                                            </p>
                                        </div>
                                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left">
                                            <p className="text-[11px] tracking-[0.25em] text-slate-400">
                                                RESPONSE
                                            </p>
                                            <p className="mt-2 text-sm font-semibold text-slate-100">
                                                USER ACTION
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                                        <button
                                            onClick={onClose}
                                            className={`inline-flex h-12 items-center justify-center rounded-2xl border px-6 text-sm font-semibold tracking-[0.18em] transition ${theme.button}`}
                                        >
                                            ACKNOWLEDGE
                                        </button>
                                        <button
                                            onClick={onClose}
                                            className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 text-sm font-semibold tracking-[0.18em] text-slate-100 transition hover:bg-white/10"
                                        >
                                            CLOSE
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pointer-events-none absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-300/30 to-transparent" />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}