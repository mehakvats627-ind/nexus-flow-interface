import { Check, Copy, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { TxStatus } from "@/lib/nexus/mock-service";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="relative grid size-9 place-items-center">
        <span className="absolute inset-1 rotate-45 border border-primary/60" />
        <Zap className="size-5 fill-primary/20 text-primary" />
      </span>
      {!compact && (
        <span>
          <strong className="font-display text-lg font-semibold tracking-[0.18em]">NEXUS</strong>
          <small className="block text-[8px] uppercase tracking-[0.2em] text-muted-foreground">
            AI agents. Real payments. Human control.
          </small>
        </span>
      )}
    </div>
  );
}

export function Panel({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <section
      className={`glass-panel lift rise rounded-xl ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </section>
  );
}

export function PanelTitle({
  icon: Icon,
  title,
  aside,
  tone = "primary",
}: {
  icon: React.ElementType;
  title: string;
  aside?: React.ReactNode;
  tone?: "primary" | "danger";
}) {
  const danger = tone === "danger";
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
      <div className="flex items-center gap-2.5">
        <span
          className={`grid size-8 place-items-center rounded-md ${danger ? "bg-destructive/15 text-destructive" : "bg-primary/10 text-primary"}`}
        >
          <Icon className="size-4" />
        </span>
        <h2 className={`font-display text-sm font-semibold ${danger ? "text-destructive" : ""}`}>
          {title}
        </h2>
      </div>
      {aside}
    </div>
  );
}

export function CopyValue({
  value,
  display,
  label = "Value",
  className = "",
}: {
  value: string;
  display?: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      /* clipboard unavailable */
    }
    setCopied(true);
    toast.success(`${label} copied`, { description: value });
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <button
      type="button"
      onClick={copy}
      title={value}
      className={`group inline-flex max-w-full items-center gap-1.5 font-mono text-primary transition-colors hover:text-cyan-200 ${className}`}
    >
      <span className="truncate">{display ?? value}</span>
      {copied ? (
        <Check className="size-3 shrink-0 text-success" />
      ) : (
        <Copy className="size-3 shrink-0 text-muted-foreground group-hover:text-primary" />
      )}
    </button>
  );
}

export function StatusPill({ status }: { status: TxStatus }) {
  const tone =
    status === "Success"
      ? "bg-success/10 text-success border-success/25"
      : status === "Blocked"
        ? "bg-destructive/15 text-destructive border-destructive/30"
        : "bg-warning/10 text-warning border-warning/25";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium ${tone}`}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "primary" | "danger" | "success";
}) {
  const color =
    tone === "primary"
      ? "text-primary"
      : tone === "danger"
        ? "text-destructive"
        : tone === "success"
          ? "text-success"
          : "";
  return (
    <div className="glass-panel lift rounded-xl p-4">
      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className={`mt-2 font-display text-2xl font-semibold ${color}`}>{value}</p>
      {hint && <p className="mt-1 text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
