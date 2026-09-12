import { createFileRoute } from "@tanstack/react-router";
import { Activity as ActivityIcon, Bot, ShieldCheck, Wallet } from "lucide-react";
import { AppShell } from "@/components/nexus/app-shell";
import { CopyValue, Panel, PanelTitle, Stat } from "@/components/nexus/ui";
import {
  AGENT_ADDRESS,
  CONTRACT_ADDRESS,
  NETWORK,
  OWNER_ADDRESS,
  formatUSD,
  getActivities,
  getBudget,
  getStats,
  shortHash,
  timeAgo,
} from "@/lib/nexus/mock-service";
import { useNexusVersion } from "@/lib/nexus/use-nexus";

export const Route = createFileRoute("/agent")({
  head: () => ({
    meta: [
      { title: "AI Agent — NEXUS" },
      {
        name: "description",
        content: "Live status of the NEXUS autonomous purchasing agent: authorization, budget, spend and enforcement.",
      },
      { property: "og:title", content: "AI Agent — NEXUS" },
      {
        property: "og:description",
        content: "Live status of the NEXUS autonomous purchasing agent: authorization, budget, spend and enforcement.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AgentPage,
});

function AgentPage() {
  useNexusVersion();
  const budget = getBudget();
  const stats = getStats();
  const activities = getActivities().slice(0, 8);

  return (
    <AppShell breadcrumb="AI Agent">
      <Panel>
        <PanelTitle
          icon={Bot}
          title="Agent Status"
          aside={
            <span className="inline-flex items-center gap-1.5 rounded-full border border-success/25 bg-success/10 px-2.5 py-1 text-[10px] font-medium text-success">
              <span className="glow-pulse size-1.5 rounded-full bg-current" />
              Active
            </span>
          }
        />
        <div className="relative overflow-hidden p-5">
          <span className="glow-pulse pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-primary/15 blur-3xl" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Authorization" value="Authorized" tone="success" hint="Signed by owner wallet" />
            <Stat label="Budget" value={formatUSD(budget.total)} tone="primary" hint="Hard cap per session" />
            <Stat label="Spent" value={formatUSD(budget.spent)} hint={`${budget.spentPct.toFixed(0)}% of budget`} />
            <Stat label="Remaining" value={formatUSD(budget.remaining)} tone="success" hint="Available to the agent" />
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              <span>Budget utilisation</span>
              <span>
                {formatUSD(budget.spent)} / {formatUSD(budget.total)}
              </span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-violet-400 shadow-glow transition-[width] duration-700"
                style={{ width: `${Math.min(100, budget.spentPct)}%` }}
              />
            </div>
          </div>
        </div>
      </Panel>

      <section className="grid gap-4 lg:grid-cols-2">
        <Panel delay={100}>
          <PanelTitle icon={Wallet} title="Identity & Enforcement" />
          <dl className="space-y-2.5 p-5 text-xs">
            <Row k="Agent address" v={<CopyValue value={AGENT_ADDRESS} display={shortHash(AGENT_ADDRESS, 6)} label="Agent address" />} />
            <Row k="Owner wallet" v={<CopyValue value={OWNER_ADDRESS} display={shortHash(OWNER_ADDRESS, 6)} label="Owner wallet" />} />
            <Row k="Budget contract" v={<CopyValue value={CONTRACT_ADDRESS} display={shortHash(CONTRACT_ADDRESS, 6)} label="Contract address" />} />
            <Row k="Network" v={<span className="text-primary">{NETWORK}</span>} />
            <Row k="Enforcement" v={<span className="text-success">Smart Contract</span>} />
          </dl>
        </Panel>

        <Panel delay={160}>
          <PanelTitle icon={ShieldCheck} title="Agent Statistics" />
          <div className="grid grid-cols-2 gap-4 p-5">
            <Stat label="Total requests" value={String(stats.total)} />
            <Stat label="Successful" value={String(stats.success)} tone="success" />
            <Stat label="Blocked" value={String(stats.blocked)} tone="danger" />
            <Stat label="Duplicates" value={String(stats.duplicate)} />
          </div>
        </Panel>
      </section>

      <Panel delay={220}>
        <PanelTitle icon={ActivityIcon} title="Agent Activity" />
        <ol className="space-y-4 p-5">
          {activities.map((a, i) => (
            <li key={a.id} className="rise flex gap-3" style={{ animationDelay: `${i * 60}ms` }}>
              <span
                className={`mt-1 size-2 shrink-0 rounded-full ${
                  a.tone === "ok" ? "bg-success" : a.tone === "error" ? "bg-destructive" : "bg-warning"
                }`}
              />
              <div className="min-w-0">
                <p className="text-xs font-medium">{a.title}</p>
                <p className="truncate text-[11px] text-muted-foreground">{a.detail}</p>
              </div>
              <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">{timeAgo(a.createdAt)}</span>
            </li>
          ))}
          {activities.length === 0 && <li className="text-xs text-muted-foreground">No activity yet.</li>}
        </ol>
      </Panel>
    </AppShell>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-2.5 last:border-0 last:pb-0">
      <dt className="shrink-0 text-muted-foreground">{k}</dt>
      <dd className="min-w-0 truncate text-right">{v}</dd>
    </div>
  );
}
