import { Link } from "react-router-dom";
import { Shield, LogOut, CheckCircle2 } from "lucide-react";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-background grid-bg">
      {/* Ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Nav */}
      <nav className="relative border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Shield className="w-4.5 h-4.5 text-primary" />
            </div>
            <span className="font-semibold text-foreground tracking-tight">AI URL Threat Detection</span>
          </div>
          <Link
            to="/login"
            className="h-9 px-4 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground/20 flex items-center gap-2 active:scale-[0.97] transition-all"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="relative max-w-5xl mx-auto px-4 py-16">
        <div className="animate-fade-up">
          <div className="bg-card border border-border rounded-xl p-8 md:p-12 cyber-glow max-w-2xl">
            <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
              <CheckCircle2 className="w-7 h-7 text-primary" />
            </div>

            <h1 className="text-3xl font-semibold text-foreground tracking-tight leading-tight mb-2">
              Welcome to Dashboard
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed mb-8">
              You have successfully logged in. Your AI-powered URL threat detection system is ready to use. Start scanning URLs to identify potential security threats.
            </p>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/10">
              <Shield className="w-5 h-5 text-primary flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                <span className="text-foreground font-medium">System Status:</span> All threat detection modules are active and operational.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
