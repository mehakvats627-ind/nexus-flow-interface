import { createFileRoute } from "@tanstack/react-router";
import { Bell, Globe2, RotateCcw, Settings2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/nexus/app-shell";
import { Button } from "@/components/ui/button";
import { CopyValue, Panel, PanelTitle, Stat } from "@/components/nexus/ui";
import {
  AGENT_ADDRESS,
  CONTRACT_ADDRESS,
  NETWORK,
  OWNER_ADDRESS,
  SERVICES,
  formatUSD,
  getBudget,
  resetDemo,
  shortHash,
} from "@/lib/nexus/mock-service";
import { useNexusVersion } from "@/lib/nexus/use-nexus";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — NEXUS" },
      {
        name: "description",
        content: "Budget cap, agent wallet, service providers and network configuration for the NEXUS agent.",
      },
      { property: "og:title", content: "Settings — NEXUS" },
      {
        property: "og:description",
        content: "Budget cap, agent wallet, service providers and network configuration for the NEXUS agent.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  useNexusVersion();
  const budget = getBudget();

  return (
    <AppShell breadcrumb="Settings">
      <Panel>
        <PanelTitle
          icon={Settings2}
          title="Budget Configuration"
          aside={<span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Owner controlled</span>}
        />
        <div className="grid gap-4 p-5 sm:grid-cols-3">
          <Stat label="Total budget" value={formatUSD(budget.total)} tone="primary" hint="Hard cap enforced on-chain" />
          <Stat label="Spent" value={formatUSD(budget.spent)} hint={`${budget.spentPct.toFixed(0)}% used`} />
          <Stat label="Remaining" value={formatUSD(budget.remaining)} tone="success" hint="Agent spend allowance" />
        </div>
      </Panel>

      <section className="grid gap-4 lg:grid-cols-2">
        <Panel delay={100}>
          <PanelTitle icon={Wallet} title="Wallets & Contract" />
          <dl className="space-y-2.5 p-5 text-xs">
            <Row k="Agent address" v={<CopyValue value={AGENT_ADDRESS} display={shortHash(AGENT_ADDRESS, 6)} label="Agent address" />} />
            <Row k="Owner wallet" v={<CopyValue value={OWNER_ADDRESS} display={shortHash(OWNER_ADDRESS, 6)} label="Owner wallet" />} />
            <Row k="Budget contract" v={<CopyValue value={CONTRACT_ADDRESS} display={shortHash(CONTRACT_ADDRESS, 6)} label="Contract address" />} />
          </dl>
        </Panel>

        <Panel delay={160}>
          <PanelTitle icon={Globe2} title="Network" />
          <dl className="space-y-2.5 p-5 text-xs">
            <Row k="Chain" v={<span className="text-primary">{NETWORK}</span>} />
            <Row k="Settlement currency" v="USDC (test)" />
            <Row k="Payment protocol" v="x402 (simulated)" />
            <Row k="Enforcement" v={<span className="text-success">Smart Contract</span>} />
          </dl>
        </Panel>
      </section>

      <Panel delay={220}>
        <PanelTitle icon={Bell} title="Service Providers" />
        <div className="grid gap-4 p-5 sm:grid-cols-3">
          {SERVICES.map((s, i) => (
            <div
              key={s.id}
              className="rise rounded-xl border border-border bg-secondary/40 p-4"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <p className="font-display text-sm font-semibold">{s.name}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{s.provider}</p>
              <p className="mt-3 font-display text-lg font-semibold text-primary">{formatUSD(s.price)}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel delay={280}>
        <PanelTitle icon={RotateCcw} title="Demo Controls" />
        <div className="flex flex-wrap items-center justify-between gap-4 p-5">
          <p className="max-w-lg text-xs text-muted-foreground">
            Reset the simulation to its starting state — budget, transactions, receipts and activity are all restored.
          </p>
          <Button
            variant="outline"
            className="shadow-glow"
            onClick={() => {
              resetDemo();
              toast.success("Demo reset", { description: "Budget and history restored." });
            }}
          >
            <RotateCcw className="size-4" />
            Reset demo data
          </Button>
        </div>
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
