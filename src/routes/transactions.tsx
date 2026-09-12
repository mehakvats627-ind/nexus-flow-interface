import { createFileRoute } from "@tanstack/react-router";
import { FileText, History } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/nexus/app-shell";
import { TransactionDetail } from "@/components/nexus/transaction-detail";
import { Panel, PanelTitle, Stat, StatusPill } from "@/components/nexus/ui";
import {
  formatUSD, getStats, getTransactions, shortHash, timeAgo,
  type Transaction, type TxStatus,
} from "@/lib/nexus/mock-service";
import { useNexusVersion } from "@/lib/nexus/use-nexus";

export const Route = createFileRoute("/transactions")({
  head: () => ({
    meta: [
      { title: "Transactions — NEXUS" },
      { name: "description", content: "Every agent payment with success, blocked and duplicate states, hashes and receipts." },
      { property: "og:title", content: "Transactions — NEXUS" },
      { property: "og:description", content: "Every agent payment with success, blocked and duplicate states, hashes and receipts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TransactionsPage,
});

const FILTERS: Array<TxStatus | "All"> = ["All", "Success", "Blocked", "Duplicate"];

function TransactionsPage() {
  useNexusVersion();
  const [filter, setFilter] = useState<TxStatus | "All">("All");
  const [detail, setDetail] = useState<Transaction | null>(null);
  const stats = getStats();
  const rows = getTransactions(filter);

  return (
    <AppShell breadcrumb="Transactions">
      <div className="rise grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total" value={String(stats.total)} />
        <Stat label="Success" value={String(stats.success)} tone="success" />
        <Stat label="Blocked" value={String(stats.blocked)} tone="danger" />
        <Stat label="Duplicate" value={String(stats.duplicate)} />
      </div>

      <Panel>
        <PanelTitle
          icon={History}
          title="Transaction History"
          aside={
            <div className="flex gap-1.5">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`rounded-full border px-3 py-1 text-[10px] transition-colors ${
                    filter === f
                      ? "border-primary/40 bg-primary/15 text-foreground shadow-glow"
                      : "border-border bg-secondary/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          }
        />
        <div className="divide-y divide-border/70">
          {rows.length === 0 && (
            <p className="p-6 text-center text-xs text-muted-foreground">No {filter.toLowerCase()} transactions yet.</p>
          )}
          {rows.map((tx) => (
            <button
              key={`${tx.requestId}-${tx.createdAt}`}
              type="button"
              onClick={() => setDetail(tx)}
              className="flex w-full items-center gap-3 px-5 py-3.5 text-left text-xs transition-colors hover:bg-accent/50"
            >
              <span className="grid size-8 place-items-center rounded-md bg-primary/10 text-primary"><FileText className="size-3.5" /></span>
              <span className="min-w-0 flex-1">
                <span className="block truncate">{tx.service}</span>
                <span className="block font-mono text-[10px] text-muted-foreground">{tx.requestId} · {tx.provider}</span>
              </span>
              <span className="hidden font-mono text-[10px] text-muted-foreground sm:block">{shortHash(tx.txHash)}</span>
              <span className="hidden text-[10px] text-muted-foreground md:block">{timeAgo(tx.createdAt)}</span>
              <span className="font-display">{formatUSD(tx.amount)}</span>
              <StatusPill status={tx.status} />
            </button>
          ))}
        </div>
      </Panel>

      <TransactionDetail tx={detail} onOpenChange={(o) => !o && setDetail(null)} />
    </AppShell>
  );
}
