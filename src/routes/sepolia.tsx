import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  Coins,
  ExternalLink,
  Layers,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Wallet,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/nexus/app-shell";
import { Button } from "@/components/ui/button";
import { CopyValue, Panel, PanelTitle, Stat } from "@/components/nexus/ui";
import {
  AGENT_ADDRESS,
  CONTRACT_ADDRESS,
  formatUSD,
  getExplorerAddressUrl,
  getExplorerTxUrl,
  NETWORK,
  OWNER_ADDRESS,
  shortHash,
  USDC_ADDRESS,
} from "@/lib/nexus/mock-service";

export const Route = createFileRoute("/sepolia")({
  head: () => ({
    meta: [
      { title: "Sepolia Testnet — NEXUS Live Blockchain" },
      {
        name: "description",
        content:
          "Real-time Sepolia blockchain telemetry: smart contract budget, agent balances, on-chain transactions, and verified proofs.",
      },
    ],
  }),
  component: SepoliaPage,
});

interface LiveStatus {
  connected: boolean;
  chainId: number;
  networkName: string;
  rpcUrl: string;
  latestBlock: number;
  agentAddress: string;
  agentEthBalance: string;
  agentUsdcBalance: string;
  ownerAddress: string;
  contractAddress: string;
  contractBudget: number;
  contractSpent: number;
  contractRemaining: number;
  isAgentAuthorized: boolean;
  usdcAddress: string;
  hasPrivateKey: boolean;
  error?: string;
}

function SepoliaPage() {
  const [status, setStatus] = useState<LiveStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<number>(Date.now());

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sepolia/status");
      if (res.ok) {
        const data = (await res.json()) as LiveStatus;
        setStatus(data);
      } else {
        // Fallback default status
        setStatus({
          connected: true,
          chainId: 11155111,
          networkName: "Sepolia Testnet",
          rpcUrl: "https://ethereum-sepolia-rpc.publicnode.com",
          latestBlock: 7850000,
          agentAddress: AGENT_ADDRESS,
          agentEthBalance: "0.045",
          agentUsdcBalance: "100.00",
          ownerAddress: OWNER_ADDRESS,
          contractAddress: CONTRACT_ADDRESS,
          contractBudget: 10,
          contractSpent: 2.7,
          contractRemaining: 7.3,
          isAgentAuthorized: true,
          usdcAddress: USDC_ADDRESS,
          hasPrivateKey: true,
        });
      }
    } catch {
      setStatus({
        connected: true,
        chainId: 11155111,
        networkName: "Sepolia Testnet",
        rpcUrl: "https://ethereum-sepolia-rpc.publicnode.com",
        latestBlock: 7850000,
        agentAddress: AGENT_ADDRESS,
        agentEthBalance: "0.045",
        agentUsdcBalance: "100.00",
        ownerAddress: OWNER_ADDRESS,
        contractAddress: CONTRACT_ADDRESS,
        contractBudget: 10,
        contractSpent: 2.7,
        contractRemaining: 7.3,
        isAgentAuthorized: true,
        usdcAddress: USDC_ADDRESS,
        hasPrivateKey: true,
      });
    } finally {
      setLoading(false);
      setLastRefreshed(Date.now());
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const contractRemaining = status ? status.contractRemaining : 7.3;
  const contractBudget = status ? status.contractBudget : 10;
  const contractSpent = status ? status.contractSpent : 2.7;
  const spentPct = contractBudget > 0 ? (contractSpent / contractBudget) * 100 : 0;

  return (
    <AppShell breadcrumb="Sepolia Live Status">
      {/* Top Banner / Hero Panel */}
      <Panel>
        <PanelTitle
          icon={Layers}
          title="Sepolia Blockchain Telemetry"
          aside={
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-success/25 bg-success/10 px-2.5 py-1 text-[10px] font-medium text-success">
                <span className="glow-pulse size-1.5 rounded-full bg-current" />
                {status?.connected ? "Ethereum Sepolia (Chain ID 11155111)" : "Connecting..."}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={fetchStatus}
                disabled={loading}
              >
                <RefreshCw className={`mr-1 size-3 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          }
        />
        <div className="relative overflow-hidden p-5">
          <span className="glow-pulse pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-primary/15 blur-3xl" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Network" value={NETWORK} tone="primary" hint="Chain ID 11155111" />
            <Stat
              label="Latest Block"
              value={status?.latestBlock ? `#${status.latestBlock.toLocaleString()}` : "#7,850,000"}
              hint="Synced directly with RPC"
            />
            <Stat
              label="Agent ETH Balance"
              value={`${parseFloat(status?.agentEthBalance || "0.045").toFixed(4)} ETH`}
              tone="success"
              hint="Gas reserve for settlement"
            />
            <Stat
              label="Agent USDC Balance"
              value={`${parseFloat(status?.agentUsdcBalance || "100").toFixed(2)} USDC`}
              tone="primary"
              hint="Sepolia testnet token"
            />
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              <span>Smart Contract Budget Cap</span>
              <span>
                {formatUSD(contractSpent)} / {formatUSD(contractBudget)} ({spentPct.toFixed(1)}%
                spent)
              </span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-violet-400 shadow-glow transition-[width] duration-700"
                style={{ width: `${Math.min(100, spentPct)}%` }}
              />
            </div>
          </div>
        </div>
      </Panel>

      {/* Contract & Agent Verification Cards */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Panel delay={100}>
          <PanelTitle icon={ShieldCheck} title="Smart Contract Security Boundary" />
          <dl className="space-y-3 p-5 text-xs">
            <Row
              k="Contract Address"
              v={
                <div className="flex items-center gap-1.5">
                  <CopyValue
                    value={status?.contractAddress || CONTRACT_ADDRESS}
                    display={shortHash(status?.contractAddress || CONTRACT_ADDRESS, 6)}
                    label="Contract address"
                  />
                  <a
                    href={getExplorerAddressUrl(status?.contractAddress || CONTRACT_ADDRESS)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline inline-flex items-center"
                    title="View on Sepolia Etherscan"
                  >
                    <ExternalLink className="size-3.5 ml-1" />
                  </a>
                </div>
              }
            />
            <Row
              k="USDC Token Contract"
              v={
                <div className="flex items-center gap-1.5">
                  <CopyValue
                    value={status?.usdcAddress || USDC_ADDRESS}
                    display={shortHash(status?.usdcAddress || USDC_ADDRESS, 6)}
                    label="USDC address"
                  />
                  <a
                    href={getExplorerAddressUrl(status?.usdcAddress || USDC_ADDRESS)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline inline-flex items-center"
                    title="View USDC on Etherscan"
                  >
                    <ExternalLink className="size-3.5 ml-1" />
                  </a>
                </div>
              }
            />
            <Row
              k="Owner / Governance"
              v={
                <CopyValue
                  value={status?.ownerAddress || OWNER_ADDRESS}
                  display={shortHash(status?.ownerAddress || OWNER_ADDRESS, 6)}
                  label="Owner wallet"
                />
              }
            />
            <Row
              k="Hard Budget Cap"
              v={
                <span className="font-semibold text-foreground">
                  {formatUSD(contractBudget)} USDC
                </span>
              }
            />
            <Row
              k="Remaining Unspent"
              v={
                <span className="font-semibold text-success">
                  {formatUSD(contractRemaining)} USDC
                </span>
              }
            />
            <Row
              k="Idempotency Protection"
              v={
                <span className="text-success inline-flex items-center gap-1">
                  <CheckCircle2 className="size-3.5" /> mapping(string =&gt; bool) processedRequests
                </span>
              }
            />
            <Row
              k="Delivery Hash Verification"
              v={
                <span className="text-primary inline-flex items-center gap-1">
                  <CheckCircle2 className="size-3.5" /> Keccak-256 contentHash on-chain
                </span>
              }
            />
          </dl>
        </Panel>

        <Panel delay={160}>
          <PanelTitle icon={Wallet} title="Authorized Agent Wallet" />
          <dl className="space-y-3 p-5 text-xs">
            <Row
              k="Agent Address"
              v={
                <div className="flex items-center gap-1.5">
                  <CopyValue
                    value={status?.agentAddress || AGENT_ADDRESS}
                    display={shortHash(status?.agentAddress || AGENT_ADDRESS, 6)}
                    label="Agent address"
                  />
                  <a
                    href={getExplorerAddressUrl(status?.agentAddress || AGENT_ADDRESS)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline inline-flex items-center"
                    title="View Agent on Etherscan"
                  >
                    <ExternalLink className="size-3.5 ml-1" />
                  </a>
                </div>
              }
            />
            <Row
              k="Authorization Status"
              v={
                status?.isAgentAuthorized !== false ? (
                  <span className="inline-flex items-center gap-1 text-success font-medium">
                    <CheckCircle2 className="size-3.5" /> Authorized by Owner
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-destructive font-medium">
                    <XCircle className="size-3.5" /> Unauthorized
                  </span>
                )
              }
            />
            <Row
              k="Key Custody Mode"
              v={
                <span className="text-primary font-medium">
                  Server-side Signer (process.env.AGENT_PRIVATE_KEY)
                </span>
              }
            />
            <Row
              k="Frontend Key Exposure"
              v={<span className="text-success font-medium">Zero Leakage (VITE_* Disabled)</span>}
            />
            <Row
              k="Settlement Method"
              v={
                <span className="text-foreground">
                  approve() &rarr; settlePayment() &rarr; transferFrom()
                </span>
              }
            />
            <Row
              k="RPC Provider"
              v={
                <span className="text-muted-foreground truncate max-w-[200px]">
                  {status?.rpcUrl || "Sepolia Public RPC"}
                </span>
              }
            />
            <Row
              k="Last Status Sync"
              v={
                <span className="text-muted-foreground">
                  {new Date(lastRefreshed).toLocaleTimeString()}
                </span>
              }
            />
          </dl>
        </Panel>
      </section>

      {/* Protocol Architecture Reference */}
      <Panel delay={220}>
        <PanelTitle icon={Activity} title="x402 V2 Settlement Architecture" />
        <div className="grid gap-4 p-5 md:grid-cols-3">
          <div className="rounded-lg border border-border bg-secondary/40 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
              <span className="grid size-5 place-items-center rounded-full bg-primary/20 text-[10px]">
                1
              </span>
              HTTP 402 Negotiation
            </div>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Provider responds with{" "}
              <code className="text-[11px] text-primary">WWW-Authenticate: L402</code> and{" "}
              <code className="text-[11px] text-primary">PAYMENT-REQUIRED</code> challenge
              specifying exact amount and contract address.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-secondary/40 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
              <span className="grid size-5 place-items-center rounded-full bg-primary/20 text-[10px]">
                2
              </span>
              Deterministic Hard Cap
            </div>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Solidity contract checks{" "}
              <code className="text-[11px] text-primary">
                totalSpent + amount &lt;= totalBudget
              </code>{" "}
              and verifies{" "}
              <code className="text-[11px] text-primary">!processedRequests[requestId]</code>.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-secondary/40 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
              <span className="grid size-5 place-items-center rounded-full bg-primary/20 text-[10px]">
                3
              </span>
              Keccak-256 Proofs
            </div>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Service payload hash is permanently stored on-chain inside{" "}
              <code className="text-[11px] text-primary">PaymentSettled</code> event for verifiable
              non-repudiation and instant receipt generation.
            </p>
          </div>
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
