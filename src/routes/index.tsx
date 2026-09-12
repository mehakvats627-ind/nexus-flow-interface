import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Activity as ActivityIcon,
  Bot,
  Code2,
  FileText,
  History,
  Image as ImageIcon,
  Languages,
  Lock,
  Receipt as ReceiptIcon,
  ShieldAlert,
  ShieldCheck,
  WalletCards,
  Zap,
} from "lucide-react";
import { useState } from "react";
import agentHero from "@/assets/nexus-agent-hero.jpg";
import cube from "@/assets/nexus-cube.png";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/nexus/app-shell";
import { ServiceModal } from "@/components/nexus/service-modal";
import { TransactionDetail } from "@/components/nexus/transaction-detail";
import { CopyValue, Panel, PanelTitle, StatusPill } from "@/components/nexus/ui";
import {
  AGENT_ADDRESS,
  formatUSD,
  getActivities,
  getBudget,
  getFlow,
  getLatestReceipt,
  getServices,
  getStats,
  getTransactions,
  resetDemo,
  runPurchase,
  shortHash,
  timeAgo,
  type ServiceId,
  type Transaction,
} from "@/lib/nexus/mock-service";
import { useNexusVersion } from "@/lib/nexus/use-nexus";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NEXUS Dashboard — AI Agent Payments" },
      {
        name: "description",
        content: "Monitor your NEXUS AI agent's budget, services, and on-chain payment activity.",
      },
      { property: "og:title", content: "NEXUS Dashboard — AI Agent Payments" },
      {
        property: "og:description",
        content: "Monitor your NEXUS AI agent's budget, services, and on-chain payment activity.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const serviceIcons: Record<ServiceId, React.ElementType> = {
  translation: Languages,
  code: Code2,
  image: ImageIcon,
};

const FLOW_LABELS: Record<string, string> = {
  idle: "Idle — awaiting request",
  request: "Request Sent",
  "payment-required": "Payment Required",
  processing: "Processing",
  paid: "Payment Successful",
  delivered: "Service Delivered",
  receipt: "Receipt Generated",
  blocked: "Payment Blocked",
  duplicate: "Duplicate Request",
};

const FLOW_ORDER = ["request", "payment-required", "processing", "paid", "delivered", "receipt"];

function Dashboard() {
  useNexusVersion();
  const [service, setService] = useState<ServiceId | null>(null);
  const [detail, setDetail] = useState<Transaction | null>(null);

  const budget = getBudget();
  const stats = getStats();
  const flow = getFlow();
  const services = getServices();
  const transactions = getTransactions().slice(0, 6);
  const activities = getActivities().slice(0, 6);
  const receipt = flow.receipt ?? getLatestReceipt();
  const lastBlocked = getTransactions("Blocked")[0];
  const flowIdx = FLOW_ORDER.indexOf(flow.stage);

  return (
    <AppShell breadcrumb="Overview">
      {/* Hero */}
      <section className="relative min-h-[320px] overflow-hidden rounded-xl border border-border bg-panel-strong sm:min-h-[420px]">
        <img
          src={agentHero}
          alt="NEXUS autonomous AI payment agent"
          width={1536}
          height={1024}
          className="absolute inset-0 size-full object-cover object-[48%_45%] opacity-80"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--background)_0%,color-mix(in_oklab,var(--background)_92%,transparent)_32%,color-mix(in_oklab,var(--background)_22%,transparent)_60%,color-mix(in_oklab,var(--background)_88%,transparent)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,var(--background)_0%,transparent_38%)]" />
        <span className="glow-pulse pointer-events-none absolute -left-24 top-1/3 size-72 rounded-full bg-primary/20 blur-[90px]" />
        <span className="glow-pulse pointer-events-none absolute right-1/4 -top-20 size-64 rounded-full bg-violet-500/15 blur-[90px]" />
        <span className="ring-spin pointer-events-none absolute -bottom-40 right-8 size-[420px] rounded-full border border-primary/10" />

        <div className="relative z-10 flex min-h-[320px] max-w-xl flex-col justify-center px-6 py-10 sm:min-h-[420px] sm:px-10">
          <p className="rise mb-4 text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">
            AI agents. Real payments. Human control.
          </p>
          <h1
            className="rise font-display text-4xl font-semibold leading-[0.98] sm:text-6xl"
            style={{ animationDelay: "80ms" }}
          >
            Give AI{" "}
            <span className="bg-gradient-to-r from-primary via-cyan-300 to-violet-400 bg-clip-text text-transparent">
              Real
            </span>
            <br />
            Purchasing Power.
          </h1>
          <p
            className="rise mt-5 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base"
            style={{ animationDelay: "160ms" }}
          >
            Let your AI agent buy the services it needs — while you stay in control.
          </p>
          <div className="rise mt-6 flex flex-wrap gap-3" style={{ animationDelay: "240ms" }}>
            <Button
              size="lg"
              className="group w-fit shadow-glow transition-transform hover:scale-[1.03]"
              onClick={() => runPurchase("translation")}
            >
              Run Demo{" "}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button size="lg" variant="outline" className="w-fit" onClick={() => resetDemo()}>
              Reset
            </Button>
          </div>
        </div>

        <div className="pointer-events-none absolute left-[52%] top-8 z-10 hidden flex-col gap-3 lg:flex">
          {services.map((s, i) => {
            const Icon = serviceIcons[s.id];
            return (
              <span
                key={s.id}
                className="float-slow flex w-fit items-center gap-2 rounded-lg border border-primary/25 bg-background/55 px-3 py-2 text-xs shadow-glow backdrop-blur-md"
                style={{ animationDelay: `${i * 900}ms`, marginLeft: `${i % 2 ? 44 : 0}px` }}
              >
                <Icon className="size-3.5 text-primary" />
                {s.name}
              </span>
            );
          })}
          <span className="mt-2 max-w-[180px] font-display text-sm italic leading-snug text-foreground/80">
            …same AI.
            <br />
            Smarter spending.
          </span>
        </div>

        <div className="pointer-events-none absolute right-6 top-0 z-10 hidden h-full w-[300px] flex-col items-center justify-center gap-3 xl:flex">
          <p className="max-w-[210px] text-center font-display text-sm italic leading-relaxed text-foreground/85">
            “Financial freedom for AI agents, with human control.”
          </p>
          <img
            src={cube}
            alt=""
            loading="lazy"
            width={816}
            height={816}
            className="float-slow size-40 object-contain drop-shadow-[0_0_40px_color-mix(in_oklab,var(--primary)_45%,transparent)]"
          />
          <span className="max-w-[180px] text-center text-[10px] uppercase leading-relaxed tracking-[0.2em] text-muted-foreground">
            Multiple services. One budget.
          </span>
        </div>
      </section>

      {/* Budget / Agent / Quick actions */}
      <section className="grid gap-4 xl:grid-cols-[1.15fr_1fr_1fr]">
        <Panel>
          <PanelTitle
            icon={WalletCards}
            title="Budget Overview"
            aside={
              <span className="rounded-full border border-border bg-secondary/60 px-2.5 py-1 text-[10px] text-muted-foreground">
                USDC
              </span>
            }
          />
          <div className="p-5">
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                ["Total", formatUSD(budget.total), ""],
                ["Spent", formatUSD(budget.spent), "text-violet-300"],
                ["Remaining", formatUSD(budget.remaining), "text-primary"],
              ].map(([label, value, color]) => (
                <div key={label} className="rounded-lg border border-border bg-secondary/40 py-3">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    {label}
                  </p>
                  <p className={`mt-1 font-display text-xl font-semibold ${color}`}>{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-5">
              <div className="mb-2 flex justify-between text-[11px] text-muted-foreground">
                <span>{budget.spentPct.toFixed(0)}% used</span>
                <span>{formatUSD(budget.remaining)} left</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary via-cyan-300 to-violet-400 shadow-glow transition-[width] duration-700"
                  style={{ width: `${Math.min(100, budget.spentPct)}%` }}
                />
              </div>
            </div>
          </div>
        </Panel>

        <Panel delay={80}>
          <PanelTitle icon={Bot} title="AI Agent Status" />
          <div className="space-y-3 p-5 text-xs">
            {[
              ["State", "Active", "text-success"],
              ["Authorization", "Authorized", "text-success"],
              ["Budget enforcement", "On-chain", "text-primary"],
            ].map(([k, v, c]) => (
              <div
                key={k}
                className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 px-3 py-2.5"
              >
                <span className="text-muted-foreground">{k}</span>
                <span className={`flex items-center gap-1.5 font-medium ${c}`}>
                  <span className="size-1.5 rounded-full bg-current shadow-[0_0_10px_currentColor]" />
                  {v}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 px-3 py-2.5">
              <span className="text-muted-foreground">Agent</span>
              <CopyValue
                value={AGENT_ADDRESS}
                display={shortHash(AGENT_ADDRESS)}
                label="Agent address"
              />
            </div>
          </div>
        </Panel>

        <Panel delay={160}>
          <PanelTitle icon={Zap} title="Quick Actions" />
          <div className="space-y-2.5 p-5">
            {services.map((s) => {
              const Icon = serviceIcons[s.id];
              const affordable = s.price <= budget.remaining;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setService(s.id)}
                  className="group flex w-full items-center gap-3 rounded-lg border border-border bg-secondary/40 px-3 py-3 text-left text-sm transition-all hover:border-primary/40 hover:bg-primary/10"
                >
                  <span className="grid size-8 place-items-center rounded-md bg-primary/10 text-primary">
                    <Icon className="size-4" />
                  </span>
                  <span className="flex-1">{s.name}</span>
                  <span
                    className={`font-display text-xs ${affordable ? "text-primary" : "text-destructive"}`}
                  >
                    {formatUSD(s.price)}
                  </span>
                </button>
              );
            })}
          </div>
        </Panel>
      </section>

      {/* Live flow / blocked / receipt */}
      <section className="grid gap-4 xl:grid-cols-3">
        <Panel>
          <PanelTitle
            icon={ActivityIcon}
            title="Live Transaction"
            aside={
              <span className="text-[10px] text-muted-foreground">{FLOW_LABELS[flow.stage]}</span>
            }
          />
          <div className="space-y-3 p-5">
            {FLOW_ORDER.map((stage, i) => {
              const state =
                flowIdx < 0 ? "todo" : i < flowIdx ? "done" : i === flowIdx ? "current" : "todo";
              return (
                <div key={stage} className="flex items-center gap-3 text-xs">
                  <span
                    className={`size-2.5 rounded-full ${
                      state === "done"
                        ? "bg-primary"
                        : state === "current"
                          ? "bg-primary shadow-glow animate-pulse"
                          : "bg-secondary"
                    }`}
                  />
                  <span className={state === "todo" ? "text-muted-foreground" : ""}>
                    {FLOW_LABELS[stage]}
                  </span>
                </div>
              );
            })}
            {flow.stage === "idle" && (
              <p className="pt-1 text-[11px] text-muted-foreground">
                Start a service request to watch the payment flow live.
              </p>
            )}
          </div>
        </Panel>

        <Panel delay={80} className={lastBlocked ? "border-destructive/40" : ""}>
          <PanelTitle icon={ShieldAlert} title="Security Enforcement" tone="danger" />
          <div className="p-5 text-center">
            {lastBlocked ? (
              <div className="relative overflow-hidden rounded-lg border border-destructive/40 bg-destructive/10 p-5">
                <span className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-destructive/20 blur-2xl" />
                <Lock className="mx-auto size-7 text-destructive" />
                <p className="mt-3 font-display text-lg font-semibold tracking-[0.1em] text-destructive">
                  PAYMENT BLOCKED
                </p>
                <p className="text-xs uppercase tracking-[0.2em] text-destructive/80">
                  Budget Exceeded
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  Requested:{" "}
                  <strong className="text-foreground">{formatUSD(lastBlocked.amount)}</strong>
                  <span className="mx-2 text-border">|</span>
                  Remaining:{" "}
                  <strong className="text-foreground">{formatUSD(budget.remaining)}</strong>
                </p>
                <p className="mt-3 flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-destructive">
                  <ShieldAlert className="size-3.5" /> Enforced On-Chain
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-success/30 bg-success/8 p-6">
                <ShieldCheck className="mx-auto size-7 text-success" />
                <p className="mt-3 font-display text-sm font-semibold text-success">
                  All payments within budget
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  The smart contract rejects any request above {formatUSD(budget.remaining)}.
                </p>
              </div>
            )}
          </div>
        </Panel>

        <Panel delay={160}>
          <PanelTitle icon={ReceiptIcon} title="Delivery / Receipt Details" />
          <div className="p-5 text-xs">
            {receipt ? (
              <dl className="space-y-2.5">
                <Row
                  k="Request ID"
                  v={<CopyValue value={receipt.requestId} label="Request ID" />}
                />
                <Row k="Service" v={receipt.service} />
                <Row k="Payment" v={`${formatUSD(receipt.amount)} USDC`} />
                <Row
                  k="Transaction Hash"
                  v={
                    <CopyValue
                      value={receipt.txHash}
                      display={shortHash(receipt.txHash, 6)}
                      label="Transaction hash"
                    />
                  }
                />
                <Row
                  k="Content Hash"
                  v={
                    <CopyValue
                      value={receipt.contentHash}
                      display={shortHash(receipt.contentHash, 6)}
                      label="Content hash"
                    />
                  }
                />
                <Row k="Receipt" v={<CopyValue value={receipt.receiptId} label="Receipt ID" />} />
                <p className="mt-3 break-words rounded-md border border-border bg-background/50 p-3 font-mono text-[11px] text-muted-foreground">
                  {receipt.output}
                </p>
              </dl>
            ) : (
              <p className="text-muted-foreground">No deliveries yet.</p>
            )}
          </div>
        </Panel>
      </section>

      {/* History + Activity */}
      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Panel>
          <PanelTitle
            icon={History}
            title="Transaction History"
            aside={
              <Link to="/transactions" className="text-[11px] text-primary hover:underline">
                View all · {stats.total}
              </Link>
            }
          />
          <div className="divide-y divide-border/70">
            {transactions.map((tx) => (
              <button
                key={`${tx.requestId}-${tx.createdAt}`}
                type="button"
                onClick={() => setDetail(tx)}
                className="flex w-full items-center gap-3 px-5 py-3 text-left text-xs transition-colors hover:bg-accent/50"
              >
                <span className="grid size-8 place-items-center rounded-md bg-primary/10 text-primary">
                  <FileText className="size-3.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{tx.service}</span>
                  <span className="block font-mono text-[10px] text-muted-foreground">
                    {tx.requestId} · {timeAgo(tx.createdAt)}
                  </span>
                </span>
                <span className="font-display">{formatUSD(tx.amount)}</span>
                <StatusPill status={tx.status} />
              </button>
            ))}
          </div>
        </Panel>

        <Panel delay={80}>
          <PanelTitle icon={ActivityIcon} title="Recent Activity" />
          <ol className="space-y-4 p-5">
            {activities.map((a) => (
              <li key={a.id} className="relative pl-5 text-xs">
                <span
                  className={`absolute left-0 top-1 size-2 rounded-full ${
                    a.tone === "ok"
                      ? "bg-success"
                      : a.tone === "error"
                        ? "bg-destructive"
                        : "bg-warning"
                  } shadow-[0_0_10px_currentColor]`}
                />
                <p className="font-medium">{a.title}</p>
                <p className="text-muted-foreground">{a.detail}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground/70">
                  {timeAgo(a.createdAt)}
                </p>
              </li>
            ))}
          </ol>
        </Panel>
      </section>

      <ServiceModal serviceId={service} onOpenChange={(o) => !o && setService(null)} />
      <TransactionDetail tx={detail} onOpenChange={(o) => !o && setDetail(null)} />
    </AppShell>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="min-w-0 truncate text-right">{v}</dd>
    </div>
  );
}
