import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight, ArrowUpRight, Bell, Bot, Box, Check, ChevronRight, CircleDollarSign,
  Code2, Copy, FileText, History, Image, Languages, LayoutDashboard, Lock, Menu,
  PanelsTopLeft, Receipt, Settings, ShieldAlert, ShieldCheck, Settings2,
  WalletCards, Zap,
} from "lucide-react";
import agentHero from "@/assets/nexus-agent-hero.jpg";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NEXUS Dashboard — AI Agent Payments" },
      { name: "description", content: "Monitor your NEXUS AI agent's budget, services, and on-chain payment activity." },
      { property: "og:title", content: "NEXUS Dashboard — AI Agent Payments" },
      { property: "og:description", content: "Monitor your NEXUS AI agent's budget, services, and on-chain payment activity." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const nav = [
  ["Dashboard", LayoutDashboard], ["Transactions", History], ["Services", PanelsTopLeft],
  ["AI Agent", Bot], ["Settings", Settings],
] as const;

const actions = [
  { name: "Translation", price: "$1.00", icon: Languages },
  { name: "Generate Code", price: "$2.00", icon: Code2 },
  { name: "Generate Image", price: "$2.00", icon: Image },
];

const flowSteps = [
  { label: "Request Sent", state: "done" },
  { label: "Payment Verified", state: "current" },
  { label: "Service Delivered", state: "todo" },
  { label: "Receipt Generated", state: "todo" },
] as const;

const receipt = [
  ["Request ID", "req-001"],
  ["Service", "Translation"],
  ["Amount", "$1.00 USDC"],
  ["Provider", "TranslatePro"],
] as const;

const transactions = [
  { service: "Translation", amount: "$1.00", status: "Success", id: "req-001", time: "2 mins ago", hash: "0x3a...1f2b" },
  { service: "Translation", amount: "$1.00", status: "Success", id: "req-002", time: "8 mins ago", hash: "0x7c...9d4e" },
  { service: "Translation", amount: "$1.00", status: "Success", id: "req-003", time: "15 mins ago", hash: "0xa9...0b3f" },
  { service: "Premium API", amount: "$2.00", status: "Blocked", id: "req-004", time: "22 mins ago", hash: "—" },
  { service: "Code Generation", amount: "$2.00", status: "Success", id: "req-005", time: "28 mins ago", hash: "0x4f...6e2a" },
  { service: "Translation", amount: "$1.00", status: "Duplicate", id: "req-002", time: "32 mins ago", hash: "—" },
];

const activities = [
  ["Agent initialized", "Budget set to $10.00 USDC", "12 mins ago", "ok"],
  ["Translation request sent", "$1.00", "10 mins ago", "ok"],
  ["Payment successful", "req-001", "8 mins ago", "ok"],
  ["Payment successful", "req-002", "5 mins ago", "ok"],
  ["Payment successful", "req-003", "2 mins ago", "ok"],
  ["Payment blocked", "Amount $2.00 exceeds remaining budget", "Just now", "error"],
] as const;

function BrandMark({ compact = false }: { compact?: boolean }) {
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

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`glass-panel rounded-xl ${className}`}>{children}</section>;
}

function PanelTitle({
  icon: Icon, title, aside, tone = "primary",
}: { icon: React.ElementType; title: string; aside?: React.ReactNode; tone?: "primary" | "danger" }) {
  const danger = tone === "danger";
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
      <div className="flex items-center gap-2.5">
        <span className={`grid size-8 place-items-center rounded-md ${danger ? "bg-destructive/15 text-destructive" : "bg-primary/10 text-primary"}`}>
          <Icon className="size-4" />
        </span>
        <h2 className={`font-display text-sm font-semibold ${danger ? "text-destructive" : ""}`}>{title}</h2>
      </div>
      {aside}
    </div>
  );
}

function Dashboard() {
  return (
    <div className="grid-surface min-h-screen overflow-x-hidden bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-background/85 px-4 py-6 backdrop-blur-xl lg:flex">
        <div className="px-2"><BrandMark /></div>
        <nav className="mt-10 space-y-1" aria-label="Main navigation">
          {nav.map(([label, Icon], index) => (
            <a
              key={label}
              href="#"
              className={`flex h-11 items-center gap-3 rounded-lg px-3 text-sm transition-colors ${
                index === 0
                  ? "border border-primary/25 bg-primary/12 text-foreground shadow-glow"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <Icon className="size-4" />{label}
            </a>
          ))}
        </nav>
        <div className="mt-auto overflow-hidden rounded-xl border border-primary/20 bg-secondary/55 p-4">
          <div className="mb-8 flex items-center justify-between">
            <Box className="size-5 text-primary" />
            <span className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground">Protocol 01</span>
          </div>
          <p className="font-display text-lg font-semibold leading-tight">
            Empowering the next<br /><span className="text-primary">generation of AI.</span>
          </p>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            More autonomy. More possibilities. More trust.
          </p>
        </div>
        <p className="mt-4 px-2 text-[9px] uppercase tracking-[0.2em] text-muted-foreground/70">v0.1.0 · Hack the Future</p>
      </aside>

      <main className="min-h-screen lg:ml-60">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/75 px-4 backdrop-blur-xl sm:px-7">
          <div className="lg:hidden"><BrandMark compact /><span className="sr-only">NEXUS</span></div>
          <div className="hidden lg:block">
            <p className="text-xs text-muted-foreground">Control center <span className="mx-2 text-border">/</span> <span className="text-foreground">Overview</span></p>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 text-xs">
              <span className="size-2 rounded-full bg-success shadow-[0_0_12px_var(--success)]" />Sepolia Testnet
            </div>
            <Button variant="ghost" size="icon-sm" aria-label="Notifications"><Bell className="size-4" /></Button>
            <div className="hidden h-10 items-center gap-3 rounded-lg border border-border bg-secondary/60 px-2.5 sm:flex">
              <span className="grid size-6 place-items-center rounded-full bg-accent text-xs">U</span>
              <span className="font-mono text-xs">0xA3...7F2B</span>
              <Copy className="size-3 text-muted-foreground" />
            </div>
            <Button variant="ghost" size="icon-sm" className="lg:hidden" aria-label="Open menu"><Menu className="size-4" /></Button>
          </div>
        </header>

        <div className="mx-auto max-w-[1540px] space-y-4 p-3 sm:p-5 lg:p-6">
          {/* Hero */}
          <section className="relative min-h-[320px] overflow-hidden rounded-xl border border-border bg-panel-strong sm:min-h-[380px]">
            <img
              src={agentHero}
              alt="NEXUS autonomous AI payment agent"
              width={1536}
              height={1024}
              className="absolute inset-0 size-full object-cover object-[62%_48%] opacity-80"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--background)_0%,color-mix(in_oklab,var(--background)_92%,transparent)_35%,color-mix(in_oklab,var(--background)_25%,transparent)_72%,var(--background)_110%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(0deg,var(--background)_0%,transparent_38%)]" />
            <div className="relative z-10 flex min-h-[320px] max-w-xl flex-col justify-center px-6 py-10 sm:min-h-[380px] sm:px-10">
              <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">
                AI agents. Real payments. Human control.
              </p>
              <h1 className="font-display text-4xl font-semibold leading-[0.98] sm:text-6xl">
                Give AI <span className="bg-gradient-to-r from-primary via-cyan-300 to-violet-400 bg-clip-text text-transparent">Real</span><br />Purchasing Power.
              </h1>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
                Let your AI agent buy the services it needs — while you stay in control.
              </p>
              <Button size="lg" className="mt-6 w-fit">Run Demo <ArrowRight className="size-4" /></Button>
            </div>
            <div className="pointer-events-none absolute right-8 top-8 z-10 hidden flex-col items-end gap-3 xl:flex">
              {actions.map(({ name, icon: Icon }) => (
                <span key={name} className="agent-drift flex items-center gap-2 rounded-lg border border-primary/25 bg-background/60 px-3 py-2 text-xs backdrop-blur-md">
                  <Icon className="size-3.5 text-primary" />{name}
                </span>
              ))}
              <span className="mt-4 max-w-[190px] text-right text-[10px] uppercase leading-relaxed tracking-[0.2em] text-muted-foreground">
                A safer, more open economy for AI agents.
              </span>
            </div>
          </section>

          {/* Budget / Agent / Quick actions */}
          <section className="grid gap-4 xl:grid-cols-[1.15fr_1fr_1fr]">
            <Panel>
              <PanelTitle icon={WalletCards} title="Budget Overview" aside={<span className="rounded-full border border-border bg-secondary/60 px-2.5 py-1 text-[10px] text-muted-foreground">USDC</span>} />
              <div className="p-5">
                <div className="grid grid-cols-[128px_1fr] items-center gap-5">
                  <div
                    className="relative mx-auto grid size-28 place-items-center rounded-full shadow-glow"
                    style={{ background: "conic-gradient(var(--primary) 0 70%, var(--secondary) 70% 100%)" }}
                  >
                    <div className="grid size-[86px] place-items-center rounded-full bg-panel-strong text-center">
                      <span>
                        <b className="font-display text-2xl">70%</b>
                        <small className="block text-[10px] text-muted-foreground">Remaining</small>
                      </span>
                    </div>
                  </div>
                  <div className="divide-y divide-border/70 text-sm">
                    <div className="flex items-baseline justify-between pb-2.5">
                      <span className="text-xs text-muted-foreground">Total Budget</span>
                      <strong className="font-display">$10.00</strong>
                    </div>
                    <div className="flex items-baseline justify-between py-2.5">
                      <span className="text-xs text-muted-foreground">Spent</span>
                      <strong className="font-display">$3.00</strong>
                    </div>
                    <div className="flex items-baseline justify-between pt-2.5">
                      <span className="text-xs text-muted-foreground">Remaining</span>
                      <strong className="font-display text-lg text-primary">$7.00</strong>
                    </div>
                  </div>
                </div>
                <div className="mt-5 flex items-center gap-4">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full w-[70%] rounded-full bg-gradient-to-r from-primary to-cyan-300 shadow-glow" />
                  </div>
                  <Button variant="outline" size="sm">Manage <ArrowRight className="size-3" /></Button>
                </div>
              </div>
            </Panel>

            <Panel>
              <PanelTitle
                icon={Bot}
                title="AI Agent Status"
                aside={
                  <span className="flex items-center gap-1.5 rounded-full border border-success/25 bg-success/10 px-2.5 py-1 text-[10px] font-semibold text-success">
                    <span className="size-1.5 rounded-full bg-success" />Active
                  </span>
                }
              />
              <div className="flex gap-4 p-5">
                <div className="agent-drift grid size-20 shrink-0 place-items-center rounded-full border border-primary/45 bg-primary/8 shadow-glow">
                  <Bot className="size-10 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <small className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Agent</small>
                  <p className="font-mono text-sm">0xB7...9C4D</p>
                  <div className="mt-3 space-y-2 text-xs">
                    <p className="flex items-center gap-2"><Check className="size-3.5 text-success" />Authorized to spend</p>
                    <p className="flex items-center gap-2"><ShieldCheck className="size-3.5 text-success" />Budget limit enforced</p>
                    <p className="flex items-center gap-2"><Check className="size-3.5 text-success" />Connected to services</p>
                  </div>
                </div>
              </div>
              <div className="px-5 pb-5">
                <Button variant="outline" size="sm" className="w-full justify-between">View Agent Details <ArrowRight className="size-3" /></Button>
              </div>
            </Panel>

            <Panel>
              <PanelTitle icon={Zap} title="Quick Actions" />
              <div className="space-y-2.5 p-4">
                {actions.map(({ name, price, icon: Icon }) => (
                  <button
                    key={name}
                    className="flex w-full items-center gap-3 rounded-lg border border-border bg-secondary/45 p-3 text-left transition-colors hover:border-primary/40 hover:bg-accent"
                  >
                    <span className="grid size-9 place-items-center rounded-md bg-primary/10 text-primary">
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <strong className="block text-xs">{name}</strong>
                      <small className="text-[10px] text-muted-foreground">{price} / request</small>
                    </span>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </Panel>
          </section>

          {/* Live transaction / blocked / receipt */}
          <section className="grid gap-4 xl:grid-cols-3">
            <Panel>
              <PanelTitle
                icon={Languages}
                title="Live Transaction"
                aside={
                  <span className="flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary">
                    <span className="size-1.5 animate-pulse rounded-full bg-primary" />Processing
                  </span>
                }
              />
              <div className="p-5">
                <div className="flex gap-4">
                  <span className="grid size-12 shrink-0 place-items-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
                    <Languages className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <strong className="block text-sm">Requesting Translation Service…</strong>
                    <dl className="mt-2 space-y-1 text-xs text-muted-foreground">
                      <div className="flex gap-3"><dt className="w-20">Provider</dt><dd className="text-foreground">TranslatePro</dd></div>
                      <div className="flex gap-3"><dt className="w-20">Price</dt><dd className="text-foreground">$1.00 USDC</dd></div>
                      <div className="flex gap-3"><dt className="w-20">Request ID</dt><dd className="font-mono text-foreground">req-004</dd></div>
                    </dl>
                  </div>
                </div>
                <ol className="mt-6 grid grid-cols-4 gap-1">
                  {flowSteps.map(({ label, state }, i) => (
                    <li key={label} className="relative text-center">
                      {i < flowSteps.length - 1 && (
                        <span className={`absolute left-1/2 top-[13px] h-px w-full ${state === "todo" ? "bg-border" : "bg-primary/60"}`} />
                      )}
                      <span
                        className={`relative z-10 mx-auto grid size-7 place-items-center rounded-full border ${
                          state === "todo"
                            ? "border-border bg-secondary text-muted-foreground"
                            : state === "current"
                              ? "border-primary bg-primary/20 text-primary shadow-glow"
                              : "border-primary/60 bg-primary/15 text-primary"
                        }`}
                      >
                        {state === "todo" ? <span className="size-1.5 rounded-full bg-current" /> : <Check className="size-3.5" />}
                      </span>
                      <span className={`mt-2 block text-[10px] leading-tight ${state === "todo" ? "text-muted-foreground" : "text-foreground"}`}>
                        {label}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </Panel>

            <Panel className="relative overflow-hidden border-destructive/40 ring-1 ring-destructive/20">
              <span className="pointer-events-none absolute -right-16 -top-16 size-44 rounded-full bg-destructive/15 blur-2xl" />
              <PanelTitle
                icon={Lock}
                tone="danger"
                title="Payment Blocked"
                aside={
                  <span className="rounded-full border border-destructive/30 bg-destructive/15 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-destructive">
                    Budget Exceeded
                  </span>
                }
              />
              <div className="relative p-5">
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Agent attempted to spend more than the remaining budget.
                </p>
                <div className="mt-4 divide-y divide-destructive/20 rounded-lg border border-destructive/25 bg-destructive/8 px-4 text-xs">
                  <div className="flex items-center justify-between py-3">
                    <span className="text-muted-foreground">Requested Amount</span>
                    <strong className="font-display text-sm">$2.00</strong>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <span className="text-muted-foreground">Remaining Budget</span>
                    <strong className="font-display text-sm">$1.00</strong>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <span className="text-muted-foreground">Status</span>
                    <strong className="text-destructive">Rejected by Smart Contract</strong>
                  </div>
                </div>
                <p className="mt-4 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-destructive">
                  <ShieldAlert className="size-4" />Enforced on-chain
                </p>
              </div>
            </Panel>

            <Panel>
              <PanelTitle
                icon={Receipt}
                title="Delivery / Receipt"
                aside={
                  <span className="flex items-center gap-1.5 rounded-full border border-success/25 bg-success/10 px-2.5 py-1 text-[10px] font-semibold text-success">
                    <span className="size-1.5 rounded-full bg-success" />Delivered
                  </span>
                }
              />
              <div className="p-5">
                <div className="flex gap-4">
                  <dl className="min-w-0 flex-1 space-y-2 text-xs">
                    {receipt.map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between gap-3">
                        <dt className="text-muted-foreground">{k}</dt>
                        <dd className="truncate">{v}</dd>
                      </div>
                    ))}
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-muted-foreground">Payment TX</dt>
                      <dd className="flex items-center gap-1.5 font-mono text-primary">0x3a...1f2b <Copy className="size-3 text-muted-foreground" /></dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-muted-foreground">Content Hash</dt>
                      <dd className="flex items-center gap-1.5 font-mono text-primary">0x8a72...91fd <Copy className="size-3 text-muted-foreground" /></dd>
                    </div>
                  </dl>
                  <span className="hidden size-14 shrink-0 place-items-center rounded-lg border border-border bg-secondary/50 text-muted-foreground sm:grid">
                    <FileText className="size-6" />
                  </span>
                </div>
                <div className="mt-4 space-y-1.5 border-t border-border pt-4 text-[11px]">
                  <p className="flex items-center gap-2"><Check className="size-3.5 text-success" />Payment verified</p>
                  <p className="flex items-center gap-2"><Check className="size-3.5 text-success" />Service delivered</p>
                  <p className="flex items-center gap-2"><Check className="size-3.5 text-success" />Hash recorded</p>
                </div>
                <Button variant="outline" size="sm" className="mt-4 w-full justify-between">
                  View on Explorer <ArrowUpRight className="size-3" />
                </Button>
              </div>
            </Panel>
          </section>

          {/* History + activity */}
          <section className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_360px]">
            <Panel className="min-w-0 overflow-hidden">
              <PanelTitle
                icon={History}
                title="Transaction History"
                aside={<Button variant="ghost" size="sm">View All <ArrowRight className="size-3" /></Button>}
              />
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-xs">
                  <thead className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                    <tr>{["#", "Service", "Amount", "Status", "Request ID", "Time", "Tx Hash"].map(h => (
                      <th key={h} className="px-4 py-3 font-medium">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx, i) => (
                      <tr key={`${tx.id}-${i}`} className="border-t border-border/70 transition-colors hover:bg-accent/30">
                        <td className="px-4 py-3.5 text-muted-foreground">{i + 1}</td>
                        <td className="px-4 py-3.5 font-medium">{tx.service}</td>
                        <td className="px-4 py-3.5">{tx.amount}</td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] ${
                            tx.status === "Success"
                              ? "bg-success/10 text-success"
                              : tx.status === "Blocked"
                                ? "bg-destructive/15 text-destructive"
                                : "bg-secondary text-muted-foreground"
                          }`}>
                            <span className="size-1.5 rounded-full bg-current" />{tx.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-muted-foreground">{tx.id}</td>
                        <td className="px-4 py-3.5 text-muted-foreground">{tx.time}</td>
                        <td className="px-4 py-3.5 font-mono text-primary">{tx.hash}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>

            <Panel>
              <PanelTitle
                icon={CircleDollarSign}
                title="Recent Activity"
                aside={
                  <span className="flex items-center gap-1.5 text-[10px] text-success">
                    <span className="size-1.5 rounded-full bg-success" />Live
                  </span>
                }
              />
              <div className="p-5">
                {activities.map(([title, sub, time, state], i) => (
                  <div key={title + time} className="relative flex gap-3 pb-5 last:pb-0">
                    <div className="flex w-3 justify-center">
                      <span className={`relative z-10 mt-1 size-2.5 rounded-full border-2 border-panel-strong ${
                        state === "error"
                          ? "bg-destructive shadow-[0_0_10px_var(--destructive)]"
                          : "bg-success shadow-[0_0_10px_var(--success)]"
                      }`} />
                      {i < activities.length - 1 && <span className="absolute left-[5px] top-3 h-full w-px bg-border" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <strong className={`text-xs ${state === "error" ? "text-destructive" : ""}`}>{title}</strong>
                        <time className={`shrink-0 text-[9px] ${state === "error" ? "text-destructive" : "text-muted-foreground/70"}`}>{time}</time>
                      </div>
                      <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </section>

          <footer className="relative overflow-hidden rounded-xl border border-primary/20 bg-secondary/55 px-6 py-8">
            <span className="pointer-events-none absolute -right-12 -top-28 size-56 rotate-45 border border-primary/20 bg-primary/5" />
            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <BrandMark />
              </div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                Built for a more open economy
              </p>
              <Button variant="outline" size="sm" className="w-fit">
                <Settings2 className="size-3" /> Explore the protocol
              </Button>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
