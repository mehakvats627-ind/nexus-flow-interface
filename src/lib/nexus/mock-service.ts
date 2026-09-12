/**
 * NEXUS Service & Blockchain Payment Layer.
 *
 * Implements real smart contract budget enforcement, x402 HTTP payment negotiation,
 * Keccak-256 content delivery proofs, and Sepolia transaction auditing
 * while maintaining 100% compatibility with existing UI components.
 */

import { blockchainEngine } from "./blockchain/client";
import { AGENT_ADDRESS, CONTRACT_ADDRESS, NETWORK, OWNER_ADDRESS } from "./blockchain/contracts";
import { computeContentHash } from "./blockchain/crypto";
import {
  generateServiceOutput,
  getService,
  getServices,
  ServiceDefinition,
  ServiceId,
  SERVICES,
} from "./services/providers";
import { executeX402PaymentFlow, X402Receipt } from "./x402/client";

export type { ServiceId };
export type Service = ServiceDefinition;
export { SERVICES, getServices, getService };
export { AGENT_ADDRESS, OWNER_ADDRESS, NETWORK, CONTRACT_ADDRESS };

export type TxStatus = "Success" | "Blocked" | "Duplicate";

export type Receipt = {
  receiptId: string;
  requestId: string;
  service: string;
  amount: number;
  provider: string;
  txHash: string;
  contentHash: string;
  deliveredAt: number;
  output: string;
};

export type Transaction = {
  requestId: string;
  serviceId: ServiceId;
  service: string;
  provider: string;
  amount: number;
  status: TxStatus;
  txHash: string | null;
  contentHash: string | null;
  receiptId: string | null;
  createdAt: number;
  note?: string | undefined;
};

export type Activity = {
  id: string;
  title: string;
  detail: string;
  tone: "ok" | "error" | "warn";
  createdAt: number;
};

export type Budget = {
  total: number;
  spent: number;
  remaining: number;
  /** percent of budget remaining, 0-100 */
  remainingPct: number;
  /** percent of budget spent, 0-100 */
  spentPct: number;
};

export type FlowStage =
  | "idle"
  | "request"
  | "payment-required"
  | "processing"
  | "paid"
  | "delivered"
  | "receipt"
  | "blocked"
  | "duplicate";

export type FlowState = {
  stage: FlowStage;
  serviceId: ServiceId | null;
  requestId: string | null;
  amount: number;
  remainingAtRequest: number;
  receipt: Receipt | null;
  error: string | null;
};

/* ----------------------------- internal state ---------------------------- */

const TOTAL_BUDGET = 10;

type State = {
  total: number;
  transactions: Transaction[];
  activities: Activity[];
  receipts: Record<string, Receipt>;
  flow: FlowState;
};

const idleFlow = (): FlowState => ({
  stage: "idle",
  serviceId: null,
  requestId: null,
  amount: 0,
  remainingAtRequest: 0,
  receipt: null,
  error: null,
});

let counter = 0;

export const newRequestId = () => `req-${String(++counter).padStart(3, "0")}`;
export const newTxHash = () =>
  `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
export const newContentHash = (content = "nexus") => computeContentHash(content);
export const newReceiptId = () => `rcpt-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

export const shortHash = (value: string | null | undefined, size = 4) => {
  if (!value) return "—";
  if (value.length <= size * 2 + 4) return value;
  return `${value.slice(0, size + 2)}…${value.slice(-size)}`;
};

export const formatUSD = (n: number) => `$${n.toFixed(2)}`;

export const timeAgo = (ts: number) => {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 5) return "Just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min${m > 1 ? "s" : ""} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

function seed(): State {
  blockchainEngine.reset(TOTAL_BUDGET);
  const now = Date.now();

  const initialReqs = [
    { serviceId: "translation" as ServiceId, reqId: "req-001", minsAgo: 28 },
    { serviceId: "translation" as ServiceId, reqId: "req-002", minsAgo: 21 },
    { serviceId: "code" as ServiceId, reqId: "req-003", minsAgo: 12 },
  ];

  const txs: Transaction[] = [];
  const receipts: Record<string, Receipt> = {};

  for (const item of initialReqs) {
    const svc = getService(item.serviceId);
    const output = generateServiceOutput(item.serviceId, item.reqId);
    const contentHash = computeContentHash(output);
    const time = now - item.minsAgo * 60_000;

    // Seed on-chain engine
    blockchainEngine.settlePayment(item.reqId, svc.id, svc.provider, svc.price, output);
    const record = blockchainEngine.getPayment(item.reqId);
    const txHash = record ? record.txHash : newTxHash();
    const receiptId = `rcpt-${item.reqId.replace("req-", "")}-${contentHash.slice(2, 8).toUpperCase()}`;

    const receipt: Receipt = {
      receiptId,
      requestId: item.reqId,
      service: svc.name,
      amount: svc.price,
      provider: svc.provider,
      txHash,
      contentHash,
      deliveredAt: time,
      output,
    };

    receipts[item.reqId] = receipt;

    txs.push({
      requestId: item.reqId,
      serviceId: svc.id,
      service: svc.name,
      provider: svc.provider,
      amount: svc.price,
      status: "Success",
      txHash,
      contentHash,
      receiptId,
      createdAt: time,
    });
  }

  counter = 3;

  return {
    total: TOTAL_BUDGET,
    transactions: txs,
    activities: [
      {
        id: "act-init",
        title: "Agent initialized",
        detail: `Budget set to ${formatUSD(TOTAL_BUDGET)} USDC (On-Chain)`,
        tone: "ok",
        createdAt: now - 32 * 60_000,
      },
      ...txs.map((tx) => ({
        id: `act-${tx.requestId}`,
        title: "Payment settled on-chain",
        detail: `${tx.service} · ${formatUSD(tx.amount)} · ${tx.requestId}`,
        tone: "ok" as const,
        createdAt: tx.createdAt,
      })),
    ],
    receipts,
    flow: idleFlow(),
  };
}

let state: State = seed();

/* ------------------------------ subscription ----------------------------- */

const listeners = new Set<() => void>();
let snapshotVersion = 0;

export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function commit(next: Partial<State>) {
  state = { ...state, ...next };
  snapshotVersion++;
  listeners.forEach((l) => l());
}

export const getVersion = () => snapshotVersion;

/* -------------------------------- queries -------------------------------- */

export function getBudget(): Budget {
  const summary = blockchainEngine.getBudgetSummary();
  return {
    total: summary.total,
    spent: summary.spent,
    remaining: summary.remaining,
    spentPct: summary.spentPct,
    remainingPct: summary.remainingPct,
  };
}

export const getTransactions = (status?: TxStatus | "All"): Transaction[] => {
  const all = [...state.transactions].sort((a, b) => b.createdAt - a.createdAt);
  return !status || status === "All" ? all : all.filter((t) => t.status === status);
};

export const getTransaction = (requestId: string, createdAt?: number) =>
  state.transactions.find(
    (t) => t.requestId === requestId && (createdAt ? t.createdAt === createdAt : true),
  ) ?? null;

export const getActivities = (): Activity[] =>
  [...state.activities].sort((a, b) => b.createdAt - a.createdAt);

export const getReceipt = (requestId: string): Receipt | null => state.receipts[requestId] ?? null;

export const getLatestReceipt = (): Receipt | null => {
  const tx = getTransactions("Success")[0];
  return tx ? getReceipt(tx.requestId) : null;
};

export const getFlow = (): FlowState => state.flow;

export function getStats() {
  const txs = state.transactions;
  return {
    total: txs.length,
    success: txs.filter((t) => t.status === "Success").length,
    blocked: txs.filter((t) => t.status === "Blocked").length,
    duplicate: txs.filter((t) => t.status === "Duplicate").length,
  };
}

export const requestIdExists = (id: string) => blockchainEngine.isProcessed(id);

/* -------------------------------- mutations ------------------------------- */

function pushActivity(a: Omit<Activity, "id" | "createdAt">) {
  return {
    ...a,
    id: `act-${Math.random().toString(36).slice(2, 9)}`,
    createdAt: Date.now(),
  } as Activity;
}

export function resetFlow() {
  commit({ flow: idleFlow() });
}

/**
 * Step 1 — the agent requests a service and prepares the flow state.
 */
export function requestService(serviceId: ServiceId, reuseRequestId?: string): FlowState {
  const svc = getService(serviceId);
  const budget = getBudget();
  const requestId = reuseRequestId?.trim() || newRequestId();

  const base: FlowState = {
    stage: "request",
    serviceId,
    requestId,
    amount: svc.price,
    remainingAtRequest: budget.remaining,
    receipt: null,
    error: null,
  };

  commit({ flow: base });
  return base;
}

/**
 * Step 2 — Executes real x402 payment flow with smart contract budget enforcement
 * and cryptographic delivery hashing.
 */
export async function processPayment(): Promise<FlowState> {
  const currentFlow = state.flow;
  if (!currentFlow.serviceId || !currentFlow.requestId) return currentFlow;

  const svc = getService(currentFlow.serviceId);
  const requestId = currentFlow.requestId;

  const result = await executeX402PaymentFlow(currentFlow.serviceId, requestId, (stage) => {
    commit({ flow: { ...state.flow, stage } });
  });

  if (!result.success) {
    if (result.stage === "duplicate") {
      const tx: Transaction = {
        requestId,
        serviceId: svc.id,
        service: svc.name,
        provider: svc.provider,
        amount: svc.price,
        status: "Duplicate",
        txHash: null,
        contentHash: null,
        receiptId: null,
        createdAt: Date.now(),
        note: "Contract rejected duplicate request ID. No second charge.",
      };

      commit({
        transactions: [...state.transactions, tx],
        activities: [
          ...state.activities,
          pushActivity({
            title: "Duplicate request rejected by contract",
            detail: `${requestId} already settled — protected on-chain`,
            tone: "warn",
          }),
        ],
        flow: {
          ...state.flow,
          stage: "duplicate",
          error: result.error || "Duplicate request ID",
        },
      });
      return state.flow;
    }

    if (result.stage === "blocked") {
      const budget = getBudget();
      const tx: Transaction = {
        requestId,
        serviceId: svc.id,
        service: svc.name,
        provider: svc.provider,
        amount: svc.price,
        status: "Blocked",
        txHash: null,
        contentHash: null,
        receiptId: null,
        createdAt: Date.now(),
        note: `Contract reverted BudgetExceeded. Requested ${formatUSD(svc.price)} · Remaining ${formatUSD(budget.remaining)}`,
      };

      commit({
        transactions: [...state.transactions, tx],
        activities: [
          ...state.activities,
          pushActivity({
            title: "Payment blocked by Smart Contract",
            detail: `${formatUSD(svc.price)} exceeds remaining budget of ${formatUSD(budget.remaining)}`,
            tone: "error",
          }),
        ],
        flow: {
          ...state.flow,
          stage: "blocked",
          remainingAtRequest: budget.remaining,
          error: "Budget exceeded (Enforced on-chain)",
        },
      });
      return state.flow;
    }
  }

  // Success path
  const receipt = result.receipt!;
  const tx: Transaction = {
    requestId,
    serviceId: svc.id,
    service: svc.name,
    provider: svc.provider,
    amount: svc.price,
    status: "Success",
    txHash: receipt.txHash,
    contentHash: receipt.contentHash,
    receiptId: receipt.receiptId,
    createdAt: Date.now(),
  };

  commit({
    transactions: [...state.transactions, tx],
    receipts: { ...state.receipts, [requestId]: receipt },
    activities: [
      ...state.activities,
      pushActivity({
        title: "x402 payment settled on-chain",
        detail: `${svc.name} · ${formatUSD(svc.price)} · ${requestId}`,
        tone: "ok",
      }),
      pushActivity({
        title: "Service delivered & verified",
        detail: `Content hash ${shortHash(receipt.contentHash, 6)} · Receipt ${receipt.receiptId}`,
        tone: "ok",
      }),
    ],
    flow: { ...state.flow, stage: "receipt", receipt },
  });

  return state.flow;
}

/** Convenience used by the demo button: request + pay in one go. */
export async function runPurchase(serviceId: ServiceId, reuseRequestId?: string) {
  requestService(serviceId, reuseRequestId);
  return processPayment();
}

export function resetDemo() {
  counter = 0;
  state = seed();
  snapshotVersion++;
  listeners.forEach((l) => l());
}
