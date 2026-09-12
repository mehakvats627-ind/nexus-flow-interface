import { ArrowUpRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CopyValue, StatusPill } from "@/components/nexus/ui";
import {
  formatUSD, getReceipt, shortHash, timeAgo, type Transaction,
} from "@/lib/nexus/mock-service";

export function TransactionDetail({
  tx,
  onOpenChange,
}: { tx: Transaction | null; onOpenChange: (open: boolean) => void }) {
  if (!tx) return null;
  const receipt = tx.status === "Success" ? getReceipt(tx.requestId) : null;

  const rows: Array<[string, React.ReactNode]> = [
    ["Service", tx.service],
    ["Amount", `${formatUSD(tx.amount)} USDC`],
    ["Request ID", <CopyValue key="r" value={tx.requestId} label="Request ID" />],
    ["Provider", tx.provider],
    ["Status", <StatusPill key="s" status={tx.status} />],
    [
      "Transaction Hash",
      tx.txHash
        ? <CopyValue key="t" value={tx.txHash} display={shortHash(tx.txHash, 8)} label="Transaction hash" />
        : <span className="text-muted-foreground">—</span>,
    ],
    [
      "Content Hash",
      tx.contentHash
        ? <CopyValue key="c" value={tx.contentHash} display={shortHash(tx.contentHash, 8)} label="Content hash" />
        : <span className="text-muted-foreground">—</span>,
    ],
    [
      "Receipt",
      tx.receiptId
        ? <CopyValue key="rc" value={tx.receiptId} label="Receipt ID" />
        : <span className="text-muted-foreground">Not issued</span>,
    ],
    ["Time", timeAgo(tx.createdAt)],
  ];

  return (
    <Dialog open={!!tx} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-base">Transaction Details</DialogTitle>
          <DialogDescription className="text-xs">
            {tx.note ?? `${tx.service} purchased by the NEXUS agent.`}
          </DialogDescription>
        </DialogHeader>

        <dl className="divide-y divide-border/70 text-xs">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-4 py-2.5">
              <dt className="shrink-0 text-muted-foreground">{k}</dt>
              <dd className="min-w-0 truncate text-right">{v}</dd>
            </div>
          ))}
        </dl>

        {receipt && (
          <div className="rounded-lg border border-border bg-secondary/40 p-4">
            <p className="flex items-center gap-2 text-xs font-semibold"><FileText className="size-3.5 text-primary" /> Delivered output</p>
            <p className="mt-2 break-words font-mono text-[11px] text-muted-foreground">{receipt.output}</p>
          </div>
        )}

        <Button variant="outline" size="sm" className="w-full justify-between" disabled={!tx.txHash}>
          View on Explorer <ArrowUpRight className="size-3" />
        </Button>
      </DialogContent>
    </Dialog>
  );
}
