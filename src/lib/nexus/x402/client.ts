import { blockchainEngine, SettlementResult } from "../blockchain/client";
import { computeContentHash, verifyContentHash } from "../blockchain/crypto";
import { generateServiceOutput, getService, ServiceId } from "../services/providers";
import { CONTRACT_ADDRESS, NETWORK } from "../blockchain/contracts";

export interface X402PaymentChallenge {
  statusCode: 402;
  message: "Payment Required";
  headers: {
    "WWW-Authenticate": string;
    "X-Payment-Contract": string;
    "X-Payment-Network": string;
    "X-Payment-Amount": number;
    "X-Request-Id": string;
  };
  details: {
    serviceId: ServiceId;
    price: number;
    provider: string;
    contractAddress: string;
    network: string;
  };
}

export interface X402Receipt {
  receiptId: string;
  requestId: string;
  service: string;
  amount: number;
  provider: string;
  txHash: string;
  contentHash: string;
  deliveredAt: number;
  output: string;
}

export interface X402ExecutionResult {
  success: boolean;
  stage: "receipt" | "blocked" | "duplicate";
  txHash: string | null;
  contentHash: string | null;
  receipt: X402Receipt | null;
  error: string | null;
  challenge: X402PaymentChallenge;
}

/**
 * Generates an HTTP 402 Payment Required challenge for a requested service.
 */
export function createPaymentChallenge(serviceId: ServiceId, requestId: string): X402PaymentChallenge {
  const svc = getService(serviceId);
  return {
    statusCode: 402,
    message: "Payment Required",
    headers: {
      "WWW-Authenticate": `L402 token="nexus-req", contract="${CONTRACT_ADDRESS}", price="${svc.price}", currency="USDC", network="${NETWORK}"`,
      "X-Payment-Contract": CONTRACT_ADDRESS,
      "X-Payment-Network": NETWORK,
      "X-Payment-Amount": svc.price,
      "X-Request-Id": requestId,
    },
    details: {
      serviceId: svc.id,
      price: svc.price,
      provider: svc.provider,
      contractAddress: CONTRACT_ADDRESS,
      network: NETWORK,
    },
  };
}

/**
 * Executes full x402 Protocol Settlement Flow:
 * Request -> 402 Challenge -> Blockchain Contract Payment -> Delivery -> Content Hash Verification -> Receipt.
 */
export async function executeX402PaymentFlow(
  serviceId: ServiceId,
  requestId: string,
  onStageChange?: (stage: "request" | "payment-required" | "processing" | "paid" | "delivered" | "receipt" | "blocked" | "duplicate") => void
): Promise<X402ExecutionResult> {
  const svc = getService(serviceId);
  const challenge = createPaymentChallenge(serviceId, requestId);

  // Step 1: Request sent
  onStageChange?.("request");
  await new Promise((r) => setTimeout(r, 350));

  // Step 2: HTTP 402 Payment Required Challenge Received
  onStageChange?.("payment-required");
  await new Promise((r) => setTimeout(r, 450));

  // Step 3: Processing payment on-chain
  onStageChange?.("processing");
  await new Promise((r) => setTimeout(r, 550));

  // Prepare expected service output
  const output = generateServiceOutput(serviceId, requestId);

  // Execute on-chain settlement via Solidity NexusBudgetManager engine
  const settlement: SettlementResult = await blockchainEngine.settlePayment(
    requestId,
    svc.id,
    svc.provider,
    svc.price,
    output
  );

  if (!settlement.success) {
    if (settlement.status === "Blocked") {
      onStageChange?.("blocked");
      return {
        success: false,
        stage: "blocked",
        txHash: null,
        contentHash: null,
        receipt: null,
        error: settlement.error || "Payment Blocked: Hard spending cap exceeded.",
        challenge,
      };
    } else {
      onStageChange?.("duplicate");
      return {
        success: false,
        stage: "duplicate",
        txHash: null,
        contentHash: null,
        receipt: null,
        error: settlement.error || "Duplicate Request: Already processed. No second charge.",
        challenge,
      };
    }
  }

  // Step 4: Payment confirmed on-chain
  onStageChange?.("paid");
  await new Promise((r) => setTimeout(r, 450));

  // Step 5: Service Delivered & Content Hash Proof Verified
  onStageChange?.("delivered");
  await new Promise((r) => setTimeout(r, 400));

  const contentHash = settlement.contentHash!;
  const isValid = verifyContentHash(output, contentHash);
  if (!isValid) {
    throw new Error("Content hash verification failed against delivered payload!");
  }

  const receiptId = `rcpt-${requestId.replace("req-", "")}-${contentHash.slice(2, 8).toUpperCase()}`;

  const receipt: X402Receipt = {
    receiptId,
    requestId,
    service: svc.name,
    amount: svc.price,
    provider: svc.provider,
    txHash: settlement.txHash!,
    contentHash,
    deliveredAt: Date.now(),
    output,
  };

  onStageChange?.("receipt");

  return {
    success: true,
    stage: "receipt",
    txHash: settlement.txHash,
    contentHash,
    receipt,
    error: null,
    challenge,
  };
}
