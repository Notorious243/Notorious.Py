import { ArrowLeft, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type PythonLoadingVariant = "auth" | "project" | "shared";

interface PythonLoadingScreenProps {
  title?: string;
  subtitle?: string;
  variant?: PythonLoadingVariant;
  showBackAction?: boolean;
  onBack?: () => void;
  backLabel?: string;
}

const VARIANT_LABELS: Record<PythonLoadingVariant, string> = {
  auth: "Authentification",
  project: "Workspace",
  shared: "Projet partage",
};

const FLOATING_ICONS = [
  { top: "12%", left: "6%", delay: "0s" },
  { top: "20%", right: "8%", delay: "0.5s" },
  { bottom: "22%", left: "10%", delay: "0.9s" },
  { bottom: "14%", right: "9%", delay: "1.2s" },
];

export function PythonLoadingScreen({
  title = "Chargement...",
  subtitle = "Preparation de votre espace Notorious.PY",
  variant = "project",
  showBackAction = false,
  onBack,
  backLabel = "Retour",
}: PythonLoadingScreenProps) {
  return (
    <div className="python-loader-screen">
      <div className="python-loader-lines" aria-hidden />
      <div className="python-loader-grid" aria-hidden />

      {FLOATING_ICONS.map((item, index) => (
        <div
          key={index}
          className="python-loader-sigil"
          style={{ ...item, animationDelay: item.delay }}
          aria-hidden
        >
          🐍
        </div>
      ))}

      {showBackAction && onBack ? (
        <button type="button" onClick={onBack} className="python-loader-back">
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </button>
      ) : null}

      <div className="python-loader-card">
        <div className="python-loader-badge">{VARIANT_LABELS[variant]}</div>
        <div className="python-loader-spinner-wrap">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
        <h2 className={cn("python-loader-title", title.length > 28 && "text-[18px]")}>{title}</h2>
        <p className="python-loader-subtitle">{subtitle}</p>
      </div>
    </div>
  );
}

