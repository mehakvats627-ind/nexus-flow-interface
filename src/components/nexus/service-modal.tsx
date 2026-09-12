import { Check, Copy, Loader2, Lock, Receipt as ReceiptIcon, ShieldAlert, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CopyValue } from "@/components/nexus/ui";
import {
  formatUSD, getBudget, getFlow, getService, processPayment, requestService, resetFlow,
  shortHash, type FlowStage, type ServiceId,
} from "@/lib/nexus/mock-service";
import { useNexusVersion } from "@/lib/nexus/use-nexus";

const STEPS: { key: FlowStage; label: string }[] = [
  { key: "request", label: "Request Sent" },
  { key: "payment-required", label: "Payment Required" },
  { key: "processing", label: "Processing" },
  { key: "paid", label: "Payment Successful" },
  { key: "delivered", label: "Service Delivered" },
  { key: "receipt", label: "Receipt Generated" },
];

const order = (s: FlowStage) => STEPS.findIndex((x) => x.key === s);

export function ServiceModal({
  serviceId,
  onOpenChange,
}: { serviceId: ServiceId | null; onOpenChange: (open: boolean) => void }) {
  useNexusVersion();
  const [replayId, setReplayId] = useState("");
  const flow = getFlow();
  const budget = getBudget();
  const service = serviceId ? getService(serviceId) : null;

  useEffect(() => {
    if (serviceId) {
      setReplayId("");
      resetFlow();
    }
  }, [serviceId]);

  if (!service) return null;

  const running = ["request", "payment-required", "processing", "paid", "delivered"].includes(flow.stage);
  const done = flow.stage === "receipt";
  const blocked = flow.stage === "blocked";
  const duplicate = flow.stage === "duplicate";
  const currentIdx = order(flow.stage);

  const start = async () => {
    requestService(service.id, replayId || undefined);
    await new Promise((r) => setTimeout(r, 450));
    await processPayment();
  };

  return (
    <Dialog open={!!serviceId} onOpenChange={(o) => { if (!o) resetFlow(); onOpenChange(o); }}>
      <DialogContent className="glass-panel max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2 text-base">
            <span className="grid size-8 place-items-center rounded-md bg-primary/10 text-primary">
              <Zap className="size-4" />
            </span>
            Request {service.name}
          </DialogTitle>
          <DialogDescription className="text-xs">{service.description}</DialogDescription>
        </DialogHeader>

        <dl className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-secondary/40 p-4 text-xs">
          <div><dt className="text-muted-foreground">Provider</dt><dd className="mt-0.5">{service.provider}</dd></div>
          <div><dt className="text-muted-foreground">Price</dt><dd className="mt-0.5 font-display text-primary">{formatUSD(service.price)} USDC</dd></div>
          <div><dt className="text-muted-foreground">Remaining budget</dt><dd className="mt-0.5">{formatUSD(budget.remaining)}</dd></div>
          <div>
            <dt className="text-muted-foreground">Request ID</dt>
            <dd className="mt-0.5 font-mono">{flow.requestId ?? "auto-generated"}</dd>
          </div>
        </dl>

        {flow.stage === "idle" && (
          <div className="space-y-2">
            <label htmlFor="replay-id" className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Replay an existing Request ID (optional)
            </label>
            <Input
              id="replay-id"
              value={replayId}
              onChange={(e) => setReplayId(e.target.value)}
              placeholder="e.g. req-001 — tests duplicate protection"
              className="font-mono text-xs"
            />
          </div>
        )}

        {(running || done) && (
          <ol className="space-y-2.5">
            {STEPS.map((step, i) => {
              const state = i < currentIdx ? "done" : i === currentIdx ? "current" : "todo";
              return (
                <li key={step.key} className="flex items-center gap-3 text-xs">
                  <span
                    className={`grid size-6 shrink-0 place-items-center rounded-full border ${
                      state === "todo"
                        ? "border-border bg-secondary text-muted-foreground"
                        : state === "current"
                          ? "border-primary bg-primary/20 text-primary shadow-glow"
                          : "border-primary/60 bg-primary/15 text-primary"
                    }`}
                  >
                    {state === "current" && !done ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : state === "todo" ? (
                      <span className="size-1.5 rounded-full bg-current" />
                    ) : (
                      <Check className="size-3" />
                    )}
                  </span>
                  <span className={state === "todo" ? "text-muted-foreground" : ""}>{step.label}</span>
                </li>
              );
            })}
          </ol>
        )}

        {blocked && (
          <div className="relative overflow-hidden rounded-lg border border-destructive/40 bg-destructive/10 p-5 text-center">
            <span className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-destructive/20 blur-2xl" />
            <Lock className="mx-auto size-7 text-destructive" />
            <p className="mt-3 font-display text-lg font-semibold tracking-[0.1em] text-destructive">PAYMENT BLOCKED</p>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-destructive/80">Budget Exceeded</p>
            <p className="mt-3 text-xs text-muted-foreground">
              Requested: <strong className="text-foreground">{formatUSD(flow.amount)}</strong>
              <span className="mx-2 text-border">|</span>
              Remaining: <strong className="text-foreground">{formatUSD(flow.remainingAtRequest)}</strong>
            </p>
            <p className="mt-3 flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-destructive">
              <ShieldAlert className="size-3.5" /> Enforcement: Smart Contract
            </p>
          </div>
        )}

        {duplicate && (
          <div className="rounded-lg border border-warning/40 bg-warning/10 p-5 text-center">
            <Copy className="mx-auto size-7 text-warning" />
            <p className="mt-3 font-display text-lg font-semibold tracking-[0.1em] text-warning">DUPLICATE REQUEST</p>
            <p className="mt-1 text-xs text-muted-foreground">Already processed. No second charge.</p>
            <p className="mt-2 font-mono text-xs">{flow.requestId}</p>
          </div>
        )}

        {done && flow.receipt && (
          <div className="rounded-lg border border-success/30 bg-success/8 p-4">
            <p className="flex items-center gap-2 font-display text-sm font-semibold text-success">
              <ReceiptIcon className="size-4" /> Receipt {flow.receipt.receiptId}
            </p>
            <dl className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Amount</dt><dd>{formatUSD(flow.receipt.amount)} USDC</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Request ID</dt>
                <dd><CopyValue value={flow.receipt.requestId} label="Request ID" /></dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Transaction Hash</dt>
                <dd><CopyValue value={flow.receipt.txHash} display={shortHash(flow.receipt.txHash, 6)} label="Transaction hash" /></dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Content Hash</dt>
                <dd><CopyValue value={flow.receipt.contentHash} display={shortHash(flow.receipt.contentHash, 6)} label="Content hash" /></dd></div>
            </dl>
            <p className="mt-3 break-words rounded-md border border-border bg-background/50 p-3 font-mono text-[11px] text-muted-foreground">
              {flow.receipt.output}
            </p>
          </div>
        )}

        <div className="flex gap-2">
          {flow.stage === "idle" && (
            <Button className="flex-1 shadow-glow" onClick={start}>
              Send Request · {formatUSD(service.price)}
            </Button>
          )}
          {running && (
            <Button className="flex-1" disabled>
              <Loader2 className="size-4 animate-spin" /> Processing…
            </Button>
          )}
          {(done || blocked || duplicate) && (
            <>
              <Button variant="outline" className="flex-1" onClick={() => resetFlow()}>New Request</Button>
              <Button className="flex-1" onClick={() => { resetFlow(); onOpenChange(false); }}>Close</Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
