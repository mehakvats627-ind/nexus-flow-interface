import { createFileRoute } from "@tanstack/react-router";
import { Code2, Image as ImageIcon, Languages, PanelsTopLeft, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/nexus/app-shell";
import { ServiceModal } from "@/components/nexus/service-modal";
import { Panel, PanelTitle } from "@/components/nexus/ui";
import { formatUSD, getBudget, getServices, type ServiceId } from "@/lib/nexus/mock-service";
import { useNexusVersion } from "@/lib/nexus/use-nexus";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services — NEXUS" },
      { name: "description", content: "Translation, code generation and image generation the NEXUS agent can buy on demand." },
      { property: "og:title", content: "Services — NEXUS" },
      { property: "og:description", content: "Translation, code generation and image generation the NEXUS agent can buy on demand." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ServicesPage,
});

const icons: Record<ServiceId, React.ElementType> = {
  translation: Languages,
  code: Code2,
  image: ImageIcon,
};

function ServicesPage() {
  useNexusVersion();
  const [selected, setSelected] = useState<ServiceId | null>(null);
  const budget = getBudget();

  return (
    <AppShell breadcrumb="Services">
      <Panel>
        <PanelTitle
          icon={PanelsTopLeft}
          title="Available Services"
          aside={<span className="text-[10px] text-muted-foreground">Remaining {formatUSD(budget.remaining)}</span>}
        />
        <div className="grid gap-4 p-5 lg:grid-cols-3">
          {getServices().map((s, i) => {
            const Icon = icons[s.id];
            const affordable = s.price <= budget.remaining;
            return (
              <article
                key={s.id}
                className="rise lift relative overflow-hidden rounded-xl border border-border bg-secondary/40 p-5"
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <span className="glow-pulse pointer-events-none absolute -right-10 -top-12 size-32 rounded-full bg-primary/15 blur-3xl" />
                <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="size-5" /></span>
                <h3 className="mt-4 font-display text-base font-semibold">{s.name}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.description}</p>
                <p className="mt-4 flex items-baseline gap-2">
                  <span className="font-display text-2xl font-semibold text-primary">{formatUSD(s.price)}</span>
                  <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">per request</span>
                </p>
                <p className="mt-1 text-[10px] text-muted-foreground">Provider · {s.provider}</p>
                <Button
                  className="mt-5 w-full shadow-glow"
                  variant={affordable ? "default" : "outline"}
                  onClick={() => setSelected(s.id)}
                >
                  {affordable ? "Request Service" : "Request (over budget)"}
                </Button>
              </article>
            );
          })}
        </div>
      </Panel>

      <Panel delay={120}>
        <PanelTitle icon={ShieldCheck} title="How enforcement works" />
        <div className="grid gap-4 p-5 text-xs text-muted-foreground sm:grid-cols-3">
          <p>Every request is priced up front and checked against the remaining budget before any payment is settled.</p>
          <p>Requests above the remaining budget are blocked and recorded — no charge ever reaches the provider.</p>
          <p>Replaying a Request ID that already settled returns the original receipt instead of charging twice.</p>
        </div>
      </Panel>

      <ServiceModal serviceId={selected} onOpenChange={(o) => !o && setSelected(null)} />
    </AppShell>
  );
}
