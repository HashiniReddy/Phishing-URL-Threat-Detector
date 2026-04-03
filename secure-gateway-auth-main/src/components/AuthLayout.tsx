import { Shield } from "lucide-react";
import { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

const AuthLayout = ({ children, title, subtitle }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen bg-background grid-bg flex items-center justify-center p-4">
      {/* Ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md animate-fade-up">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center cyber-glow-sm">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            AI URL Threat Detection
          </span>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-xl p-8 cyber-glow">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-foreground tracking-tight leading-tight">
              {title}
            </h1>
            <p className="text-muted-foreground text-sm mt-1.5">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
