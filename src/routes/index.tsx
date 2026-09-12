import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight, Bell, Bot, Box, Check, ChevronRight, CircleDollarSign,
  Code2, Copy, Cpu, Gauge, History, Image, LayoutDashboard, Menu,
  PanelsTopLeft, Settings, ShieldCheck, Sparkle, WalletCards, Zap,
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
  { name: "Translation", price: "$1.00", icon: Sparkle },
  { name: "Code Generation", price: "$2.00", icon: Code2 },
  { name: "Image Generation", price: "$2.00", icon: Image },
];

const transactions = [
  { service: "Translation", amount: "$1.00", status: "Success", id: "req-001", time: "2 mins ago", hash: "0x3a...1f2b" },
  { service: "Translation", amount: "$1.00", status: "Success", id: "req-002", time: "8 mins ago", hash: "0x7c...9d4e" },
  { service: "Translation", amount: "$1.00", status: "Success", id: "req-003", time: "15 mins ago", hash: "0xa9...0b3f" },
  { service: "Translation", amount: "$2.00", status: "Blocked", id: "req-004", time: "22 mins ago", hash: "—" },
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

const metrics = [
  { label: "Successful purchases", value: "3", icon: Check, note: "All settled" },
  { label: "Blocked attempts", value: "1", icon: ShieldCheck, note: "Budget protected" },
  { label: "Services used", value: "2", icon: Cpu, note: "of 3 connected" },
  { label: "Avg. response", value: "1.2s", icon: Gauge, note: "Fast execution" },
];

function BrandMark({ compact = false }: { compact?: boolean }) {
  return <div className="flex items-center gap-3"><span className="relative grid size-9 place-items-center"><span className="absolute inset-1 rotate-45 border border-primary/60" /><Zap className="size-5 fill-primary/20 text-primary" /></span>{!compact && <span><strong className="font-display text-lg font-semibold tracking-[0.18em]">NEXUS</strong><small className="block text-[8px] uppercase tracking-[0.2em] text-muted-foreground">Agent payment protocol</small></span>}</div>;
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`glass-panel rounded-xl ${className}`}>{children}</section>;
}

function PanelTitle({ icon: Icon, title, aside }: { icon: React.ElementType; title: string; aside?: React.ReactNode }) {
  return <div className="flex items-center justify-between border-b border-border px-5 py-4"><div className="flex items-center gap-2.5"><span className="grid size-8 place-items-center rounded-md bg-primary/10 text-primary"><Icon className="size-4" /></span><h2 className="font-display text-sm font-semibold">{title}</h2></div>{aside}</div>;
}

function Dashboard() {
  return (
    <div className="grid-surface min-h-screen overflow-x-hidden bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-background/85 px-4 py-6 backdrop-blur-xl lg:flex">
        <div className="px-2"><BrandMark /></div>
        <nav className="mt-10 space-y-1" aria-label="Main navigation">{nav.map(([label, Icon], index) => <a key={label} href="#" className={`flex h-11 items-center gap-3 rounded-lg px-3 text-sm transition-colors ${index === 0 ? "border border-primary/25 bg-primary/12 text-foreground shadow-glow" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}><Icon className="size-4" />{label}</a>)}</nav>
        <div className="mt-auto overflow-hidden rounded-xl border border-primary/20 bg-secondary/55 p-4">
          <div className="mb-8 flex items-center justify-between"><Box className="size-5 text-primary" /><span className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground">Protocol 01</span></div>
          <p className="font-display text-lg font-semibold leading-tight">Autonomy.<br /><span className="text-primary">Within limits.</span></p>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">Every purchase is verified against your on-chain budget.</p>
        </div>
      </aside>

      <main className="min-h-screen lg:ml-60">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/75 px-4 backdrop-blur-xl sm:px-7">
          <div className="lg:hidden"><BrandMark compact /><span className="sr-only">NEXUS</span></div>
          <div className="hidden lg:block"><p className="text-xs text-muted-foreground">Control center <span className="mx-2 text-border">/</span> <span className="text-foreground">Overview</span></p></div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 text-xs"><span className="size-2 rounded-full bg-success shadow-[0_0_12px_var(--success)]" />Sepolia Testnet</div>
            <Button variant="ghost" size="icon-sm" aria-label="Notifications"><Bell className="size-4" /></Button>
            <div className="hidden h-10 items-center gap-3 rounded-lg border border-border bg-secondary/60 px-2.5 sm:flex"><span className="grid size-6 place-items-center rounded-full bg-accent text-xs">U</span><span className="text-xs">0xA3...7F2B</span><Copy className="size-3 text-muted-foreground" /></div>
            <Button variant="ghost" size="icon-sm" className="lg:hidden" aria-label="Open menu"><Menu className="size-4" /></Button>
          </div>
        </header>

        <div className="mx-auto max-w-[1540px] space-y-3 p-3 sm:p-5 lg:p-6">
          <section className="relative min-h-[320px] overflow-hidden rounded-xl border border-border bg-panel-strong sm:min-h-[360px]">
            <img src={agentHero} alt="NEXUS autonomous AI payment agent holding a digital card" width={1536} height={1024} className="absolute inset-0 size-full object-cover object-[62%_48%] opacity-80" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--background)_0%,color-mix(in_oklab,var(--background)_92%,transparent)_35%,color-mix(in_oklab,var(--background)_25%,transparent)_72%,var(--background)_110%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(0deg,var(--background)_0%,transparent_35%)]" />
            <div className="relative z-10 flex min-h-[320px] max-w-xl flex-col justify-center px-6 py-10 sm:min-h-[360px] sm:px-10">
              <div className="mb-5 flex w-fit items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary"><span className="size-1.5 rounded-full bg-success" /> Autonomous commerce, controlled</div>
              <h1 className="font-display text-4xl font-semibold leading-[0.98] sm:text-6xl">Give AI<br /><span className="bg-gradient-to-r from-primary via-cyan-300 to-violet-400 bg-clip-text text-transparent">Real Purchasing</span><br />Power.</h1>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">Set a budget. Let your AI agent purchase services. Stay in control — on-chain.</p>
              <Button size="lg" className="mt-6 w-fit">Run Demo <ArrowRight className="size-4" /></Button>
            </div>
          </section>

          <section className="grid gap-3 xl:grid-cols-[1.15fr_1fr_1fr]">
            <Panel><PanelTitle icon={WalletCards} title="Budget Overview" aside={<span className="text-[10px] text-muted-foreground">USDC</span>} />
              <div className="grid grid-cols-[130px_1fr] items-center gap-4 p-5"><div className="relative mx-auto grid size-28 place-items-center rounded-full" style={{ background: "conic-gradient(var(--primary) 0 70%, var(--secondary) 70% 100%)" }}><div className="grid size-20 place-items-center rounded-full bg-panel-strong text-center"><span><b className="font-display text-2xl">70%</b><small className="block text-[10px] text-muted-foreground">remaining</small></span></div></div><div className="divide-y divide-border text-sm"><div className="pb-2"><span className="text-xs text-muted-foreground">Total budget</span><strong className="block font-display">$10.00 USDC</strong></div><div className="py-2"><span className="text-xs text-muted-foreground">Spent</span><strong className="block font-display">$3.00 USDC</strong></div><div className="pt-2"><span className="text-xs text-muted-foreground">Remaining</span><strong className="block font-display text-success">$7.00 USDC</strong></div></div></div>
            </Panel>
            <Panel><PanelTitle icon={Bot} title="AI Agent Status" aside={<span className="flex items-center gap-1.5 rounded-full border border-success/25 bg-success/10 px-2.5 py-1 text-[10px] font-semibold text-success"><span className="size-1.5 rounded-full bg-success" />Active</span>} />
              <div className="flex gap-4 p-5"><div className="agent-drift grid size-20 shrink-0 place-items-center rounded-full border border-primary/45 bg-primary/8"><Bot className="size-10 text-primary" /></div><div className="min-w-0 flex-1"><strong className="font-display text-sm">NEXUS Agent 01</strong><p className="mt-1 text-xs text-muted-foreground">0xb7...9C4D</p><div className="mt-3 space-y-2 text-xs"><p className="flex items-center gap-2"><Check className="size-3.5 text-success" />Authorized to spend</p><p className="flex items-center gap-2"><ShieldCheck className="size-3.5 text-success" />Budget limit enforced</p><p className="flex items-center gap-2"><Check className="size-3.5 text-success" />Connected to 3 services</p></div></div></div>
            </Panel>
            <Panel><PanelTitle icon={Zap} title="Quick Actions" /><div className="space-y-2 p-3">{actions.map(({ name, price, icon: Icon }) => <button key={name} className="flex w-full items-center gap-3 rounded-lg border border-border bg-secondary/45 p-3 text-left transition-colors hover:border-primary/40 hover:bg-accent"><span className="grid size-8 place-items-center rounded-md bg-primary/10 text-primary"><Icon className="size-4" /></span><span className="min-w-0 flex-1"><strong className="block text-xs">{name}</strong><small className="text-[10px] text-muted-foreground">{price} / request</small></span><ChevronRight className="size-4 text-muted-foreground" /></button>)}</div></Panel>
          </section>

          <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {metrics.map(({ label, value, icon: Icon, note }) => <Panel key={label} className="p-4"><div className="flex items-start justify-between"><span className="text-xs text-muted-foreground">{label}</span><Icon className="size-4 text-primary" /></div><strong className="mt-3 block font-display text-2xl">{value}</strong><small className="text-[10px] text-muted-foreground">{note}</small></Panel>)}
          </section>

          <section className="grid gap-3 2xl:grid-cols-[minmax(0,1fr)_340px]">
            <Panel className="min-w-0 overflow-hidden"><PanelTitle icon={History} title="Transaction History" aside={<Button variant="ghost" size="sm">View all <ArrowRight className="size-3" /></Button>} /><div className="overflow-x-auto"><table className="w-full min-w-[780px] text-left text-xs"><thead className="text-[10px] text-muted-foreground"><tr>{["#", "Service", "Amount", "Status", "Request ID", "Time", "Tx Hash"].map(h => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead><tbody>{transactions.map((tx, i) => <tr key={`${tx.id}-${i}`} className="border-t border-border/70 hover:bg-accent/30"><td className="px-4 py-3 text-muted-foreground">0{i + 1}</td><td className="px-4 py-3 font-medium">{tx.service}</td><td className="px-4 py-3">{tx.amount}</td><td className="px-4 py-3"><span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] ${tx.status === "Success" ? "bg-success/10 text-success" : tx.status === "Blocked" ? "bg-destructive/15 text-destructive" : "bg-secondary text-muted-foreground"}`}><span className="size-1.5 rounded-full bg-current" />{tx.status}</span></td><td className="px-4 py-3 text-muted-foreground">{tx.id}</td><td className="px-4 py-3 text-muted-foreground">{tx.time}</td><td className="px-4 py-3 font-mono text-primary">{tx.hash}</td></tr>)}</tbody></table></div></Panel>
            <Panel><PanelTitle icon={CircleDollarSign} title="Recent Activity" aside={<span className="flex items-center gap-1.5 text-[10px] text-success"><span className="size-1.5 rounded-full bg-success" />Live</span>} /><div className="p-5">{activities.map(([title, sub, time, state], i) => <div key={title + time} className="relative flex gap-3 pb-4 last:pb-0"><div className="flex w-3 justify-center"><span className={`relative z-10 mt-1 size-2.5 rounded-full border-2 border-panel-strong ${state === "error" ? "bg-destructive shadow-[0_0_10px_var(--destructive)]" : "bg-success shadow-[0_0_10px_var(--success)]"}`} />{i < activities.length - 1 && <span className="absolute left-[5px] top-3 h-full w-px bg-border" />}</div><div className="min-w-0"><strong className={`block text-xs ${state === "error" ? "text-destructive" : ""}`}>{title}</strong><p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">{sub}</p><time className="mt-1 block text-[9px] text-muted-foreground/70">{time}</time></div></div>)}</div></Panel>
          </section>

          <footer className="relative overflow-hidden rounded-xl border border-primary/20 bg-secondary/55 px-6 py-7 sm:flex sm:items-center sm:justify-between"><div className="absolute -right-12 -top-28 size-56 rotate-45 border border-primary/20 bg-primary/5" /><div className="relative"><p className="font-display text-lg font-semibold">A safer, more open economy for AI agents.</p><p className="mt-1 text-xs text-muted-foreground">Real utility. Real control. Powered by programmable payments.</p></div><Button variant="outline" className="relative mt-5 sm:mt-0">Explore the protocol <ArrowRight className="size-4" /></Button></footer>
        </div>
      </main>
    </div>
  );
}