/**
 * NEXUS mock service layer.
 *
 * This is the ONLY place that knows how payments, budgets and receipts work.
 * It is intentionally framework-free so it can later be swapped for a real
 * Solidity / Sepolia / x402 integration without touching the UI.
 */

export type ServiceId = "translation" | "code" | "image";

export type Service = {
  id: ServiceId;
  name: string;
  price: number;
  provider: string;
  description: string;
};

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
  note?: string;
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

export const AGENT_ADDRESS = "0xB7c4F19a2D63e8A1f05Cb7d3E9a0C41f5d9C4D22";
export const OWNER_ADDRESS = "0xA34f81cB27eE09d4bA6C1e7f0A25b9d3E1c87F2B";
export const NETWORK = "Sepolia Testnet";
export const CONTRACT_ADDRESS = "0x5fE21aB9c07D4e1b83Ac6F0d92B7431aEf08C6D1";

export const SERVICES: Service[] = [
  {
    id: "translation",
    name: "Translation",
    price: 1,
    provider: "TranslatePro",
    description: "Translate any text between 40+ languages with context awareness.",
  },
  {
    id: "code",
    name: "Code Generation",
    price: 2,
    provider: "CodeForge AI",
    description: "Generate production-ready code snippets from a plain prompt.",
  },
  {
    id: "image",
    name: "Image Generation",
    price: 2,
    provider: "PixelMind",
    description: "Create original artwork and visuals from a text description.",
  },
];

export const getServices = (): Service[] => SERVICES;
export const getService = (id: ServiceId): Service =>
  SERVICES.find((s) => s.id === id)!;

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
const hex = (len: number) =>
  "0x" +
  Array.from({ length: len }, () =>
    "0123456789abcdef"[Math.floor(Math.random() * 16)],
  ).join("");

export const newRequestId = () => `req-${String(++counter).padStart(3, "0")}`;
export const newTxHash = () => hex(64);
export const newContentHash = () => hex(64);
export const newReceiptId = () =>
  `rcpt-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

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
  const now = Date.now();
  const mk = (
    serviceId: ServiceId,
    status: TxStatus,
    minsAgo: number,
    note?: string,
  ): Transaction => {
    const svc = getService(serviceId);
    const success = status === "Success";
    const requestId = newRequestId();
    return {
      requestId,
      serviceId,
      service: svc.name,
      provider: svc.provider,
      amount: svc.price,
      status,
      txHash: success ? newTxHash() : null,
      contentHash: success ? newContentHash() : null,
      receiptId: success ? newReceiptId() : null,
      createdAt: now - minsAgo * 60_000,
      note,
    };
  };

  const txs = [
    mk("translation", "Success", 28),
    mk("translation", "Success", 21),
    mk("code", "Success", 12),
  ];

  const receipts: Record<string, Receipt> = {};
  for (const tx of txs) {
    if (tx.status !== "Success" || !tx.receiptId) continue;
    receipts[tx.requestId] = {
      receiptId: tx.receiptId,
      requestId: tx.requestId,
      service: tx.service,
      amount: tx.amount,
      provider: tx.provider,
      txHash: tx.txHash!,
      contentHash: tx.contentHash!,
      deliveredAt: tx.createdAt,
      output: sampleOutput(tx.serviceId),
    };
  }

  return {
    total: TOTAL_BUDGET,
    transactions: txs,
    activities: [
      {
        id: "act-init",
        title: "Agent initialized",
        detail: `Budget set to ${formatUSD(TOTAL_BUDGET)} USDC`,
        tone: "ok",
        createdAt: now - 32 * 60_000,
      },
      ...txs.map((tx) => ({
        id: `act-${tx.requestId}`,
        title: "Payment successful",
        detail: `${tx.service} · ${formatUSD(tx.amount)} · ${tx.requestId}`,
        tone: "ok" as const,
        createdAt: tx.createdAt,
      })),
    ],
    receipts,
    flow: idleFlow(),
  };
}

function sampleOutput(id: ServiceId) {
  switch (id) {
    case "translation":
      return "« Bonjour, le paiement autonome est désormais actif. »";
    case "code":
      return "export const enforceBudget = (spent, cap) => spent <= cap;";
    default:
      return "image://nexus/renders/holographic-cube-4k.png";
  }
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
  const spent = state.transactions
    .filter((t) => t.status === "Success")
    .reduce((sum, t) => sum + t.amount, 0);
  const remaining = Math.max(0, state.total - spent);
  return {
    total: state.total,
    spent,
    remaining,
    spentPct: state.total ? (spent / state.total) * 100 : 0,
    remainingPct: state.total ? (remaining / state.total) * 100 : 0,
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

export const getReceipt = (requestId: string): Receipt | null =>
  state.receipts[requestId] ?? null;

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

export const requestIdExists = (id: string) =>
  state.transactions.some((t) => t.requestId === id && t.status === "Success");

/* -------------------------------- mutations ------------------------------- */

function pushActivity(a: Omit<Activity, "id" | "createdAt">) {
  return {
    ...a,
    id: `act-${Math.random().toString(36).slice(2, 9)}`,
    createdAt: Date.now(),
  } as Activity;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function resetFlow() {
  commit({ flow: idleFlow() });
}

/**
 * Step 1 — the agent asks for a service. Returns the generated request id.
 * If `reuseRequestId` is provided we simulate a replayed request.
 */
export function requestService(
  serviceId: ServiceId,
  reuseRequestId?: string,
): FlowState {
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
 * Step 2 — settle the payment. Enforces duplicate + budget rules, then walks
 * through processing → paid → delivered → receipt.
 */
export async function processPayment(): Promise<FlowState> {
  const flow = state.flow;
  if (!flow.serviceId || !flow.requestId) return flow;
  const svc = getService(flow.serviceId);
  const budget = getBudget();

  // --- duplicate guard -----------------------------------------------------
  if (requestIdExists(flow.requestId)) {
    const tx: Transaction = {
      requestId: flow.requestId,
      serviceId: svc.id,
      service: svc.name,
      provider: svc.provider,
      amount: svc.price,
      status: "Duplicate",
      txHash: null,
      contentHash: null,
      receiptId: null,
      createdAt: Date.now(),
      note: "Already processed. No second charge.",
    };
    commit({
      transactions: [...state.transactions, tx],
      activities: [
        ...state.activities,
        pushActivity({
          title: "Duplicate request",
          detail: `${flow.requestId} already processed — no second charge`,
          tone: "warn",
        }),
      ],
      flow: { ...flow, stage: "duplicate", error: "Already processed. No second charge." },
    });
    return state.flow;
  }

  // --- budget guard --------------------------------------------------------
  if (svc.price > budget.remaining) {
    const tx: Transaction = {
      requestId: flow.requestId,
      serviceId: svc.id,
      service: svc.name,
      provider: svc.provider,
      amount: svc.price,
      status: "Blocked",
      txHash: null,
      contentHash: null,
      receiptId: null,
      createdAt: Date.now(),
      note: `Requested ${formatUSD(svc.price)} · Remaining ${formatUSD(budget.remaining)}`,
    };
    commit({
      transactions: [...state.transactions, tx],
      activities: [
        ...state.activities,
        pushActivity({
          title: "Payment blocked",
          detail: `${formatUSD(svc.price)} exceeds remaining budget of ${formatUSD(budget.remaining)}`,
          tone: "error",
        }),
      ],
      flow: {
        ...flow,
        stage: "blocked",
        remainingAtRequest: budget.remaining,
        error: "Budget exceeded",
      },
    });
    return state.flow;
  }

  // --- happy path ----------------------------------------------------------
  commit({ flow: { ...flow, stage: "payment-required" } });
  await wait(700);
  commit({ flow: { ...state.flow, stage: "processing" } });
  await wait(1100);

  const txHash = newTxHash();
  const contentHash = newContentHash();
  const receiptId = newReceiptId();

  commit({ flow: { ...state.flow, stage: "paid" } });
  await wait(750);
  commit({ flow: { ...state.flow, stage: "delivered" } });
  await wait(650);

  const receipt: Receipt = {
    receiptId,
    requestId: flow.requestId,
    service: svc.name,
    amount: svc.price,
    provider: svc.provider,
    txHash,
    contentHash,
    deliveredAt: Date.now(),
    output: sampleOutput(svc.id),
  };

  const tx: Transaction = {
    requestId: flow.requestId,
    serviceId: svc.id,
    service: svc.name,
    provider: svc.provider,
    amount: svc.price,
    status: "Success",
    txHash,
    contentHash,
    receiptId,
    createdAt: Date.now(),
  };

  commit({
    transactions: [...state.transactions, tx],
    receipts: { ...state.receipts, [flow.requestId]: receipt },
    activities: [
      ...state.activities,
      pushActivity({
        title: "Payment successful",
        detail: `${svc.name} · ${formatUSD(svc.price)} · ${flow.requestId}`,
        tone: "ok",
      }),
      pushActivity({
        title: "Service delivered",
        detail: `Receipt ${receiptId} generated`,
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
  await wait(450);
  return processPayment();
}

export function resetDemo() {
  counter = 0;
  state = seed();
  snapshotVersion++;
  listeners.forEach((l) => l());
}
