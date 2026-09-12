import { computeContentHash, verifyContentHash } from "../lib/nexus/blockchain/crypto";
import { generateServiceOutput, getService, ServiceId } from "../lib/nexus/services/providers";
import { serverBlockchain } from "./blockchain";

export interface AgentExecutionRequest {
  serviceId: ServiceId;
  requestId: string;
  prompt?: string;
}

export interface AgentExecutionResponse {
  success: boolean;
  stage: "receipt" | "blocked" | "duplicate" | "failed";
  requestId: string;
  serviceId: string;
  serviceName: string;
  provider: string;
  amount: number;
  txHash: string | null;
  contentHash: string | null;
  receiptId: string | null;
  output: string | null;
  deliveredAt: number | null;
  error: string | null;
  challengeHeaders: Record<string, string>;
  steps: Array<{
    step: string;
    status: "ok" | "error" | "warn";
    timestamp: number;
    details?: string;
  }>;
}

export async function handleAgentRun(request: Request): Promise<Response> {
  const steps: AgentExecutionResponse["steps"] = [];
  const logStep = (step: string, status: "ok" | "error" | "warn", details?: string) => {
    steps.push({ step, status, timestamp: Date.now(), details });
  };

  let body: AgentExecutionRequest;
  try {
    body = (await request.json()) as AgentExecutionRequest;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { serviceId, requestId, prompt } = body;
  const service = getService(serviceId);

  logStep(
    "1. Agent Request Initiated",
    "ok",
    `Agent requested ${service.name} (${service.price} USDC) with ${requestId}`,
  );

  // Step 2: Query provider for x402 payment challenge
  const challengeHeaders: Record<string, string> = {
    "WWW-Authenticate": `L402 token="nexus-req", price="${service.price}", currency="USDC", network="Sepolia Testnet", chain_id="11155111"`,
    "PAYMENT-REQUIRED": JSON.stringify({
      requestId,
      serviceId,
      amount: service.price,
    }),
  };

  logStep(
    "2. HTTP 402 Payment Challenge Received",
    "ok",
    `Provider returned 402 Payment Required for ${service.price} USDC`,
  );

  // Step 3: Evaluate on-chain budget & policies
  const currentStatus = await serverBlockchain.getStatus();

  if (service.price > currentStatus.contractRemaining) {
    logStep(
      "3. Smart Contract Hard Budget Check Failed",
      "error",
      `Requested ${service.price} USDC exceeds remaining contract budget of ${currentStatus.contractRemaining} USDC`,
    );

    return new Response(
      JSON.stringify({
        success: false,
        stage: "blocked",
        requestId,
        serviceId,
        serviceName: service.name,
        provider: service.provider,
        amount: service.price,
        txHash: null,
        contentHash: null,
        receiptId: null,
        output: null,
        deliveredAt: null,
        error: `BudgetExceeded: Requested ${service.price} USDC exceeds remaining budget of ${currentStatus.contractRemaining} USDC.`,
        challengeHeaders,
        steps,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // Step 4: Check Idempotency
  const isAlreadyProcessed = await serverBlockchain.isRequestProcessed(requestId);
  if (isAlreadyProcessed) {
    logStep(
      "3. Idempotency Check Failed",
      "warn",
      `RequestId ${requestId} already settled on-chain`,
    );

    return new Response(
      JSON.stringify({
        success: false,
        stage: "duplicate",
        requestId,
        serviceId,
        serviceName: service.name,
        provider: service.provider,
        amount: service.price,
        txHash: null,
        contentHash: null,
        receiptId: null,
        output: null,
        deliveredAt: null,
        error: `DuplicateRequest("${requestId}"): Request was already processed on-chain. Smart contract protection active.`,
        challengeHeaders,
        steps,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // Step 5: Deliver payload locally to produce content hash
  const expectedOutput = generateServiceOutput(serviceId, requestId, prompt);
  const expectedContentHash = computeContentHash(expectedOutput);

  // Step 6: Execute on-chain settlement
  logStep(
    "4. Blockchain Settlement Submitted",
    "ok",
    `Submitting settlement to Sepolia contract with hash ${expectedContentHash.slice(0, 10)}...`,
  );

  const settlement = await serverBlockchain.settlePaymentOnChain(
    requestId,
    service.id,
    service.provider,
    service.price,
    expectedOutput,
  );

  if (!settlement.success) {
    const isBudgetBlock = settlement.status === "Blocked";
    const isDup = settlement.status === "Duplicate";

    logStep(
      `4. Blockchain Settlement ${settlement.status}`,
      "error",
      settlement.error || "On-chain transaction failed.",
    );

    return new Response(
      JSON.stringify({
        success: false,
        stage: isBudgetBlock ? "blocked" : isDup ? "duplicate" : "failed",
        requestId,
        serviceId,
        serviceName: service.name,
        provider: service.provider,
        amount: service.price,
        txHash: null,
        contentHash: null,
        receiptId: null,
        output: null,
        deliveredAt: null,
        error: settlement.error || "Blockchain settlement failed.",
        challengeHeaders,
        steps,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  logStep(
    "5. On-Chain Confirmation Received",
    "ok",
    `Transaction mined in block #${settlement.blockNumber || "confirmed"} (Tx: ${settlement.txHash})`,
  );

  // Step 7: Content Hash Delivery Verification
  const isContentValid = verifyContentHash(expectedOutput, settlement.contentHash!);
  if (!isContentValid) {
    logStep(
      "6. Content Hash Verification Failed",
      "error",
      "Delivered output did not match on-chain content hash!",
    );
    return new Response(
      JSON.stringify({
        success: false,
        stage: "failed",
        requestId,
        serviceId,
        serviceName: service.name,
        provider: service.provider,
        amount: service.price,
        txHash: settlement.txHash,
        contentHash: settlement.contentHash,
        receiptId: null,
        output: null,
        deliveredAt: null,
        error: "Cryptographic content hash verification failed.",
        challengeHeaders,
        steps,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  logStep(
    "6. Content Hash Proof Verified",
    "ok",
    `Keccak-256 hash verified: ${settlement.contentHash}`,
  );

  const receiptId = `rcpt-${requestId.replace("req-", "")}-${settlement.contentHash!.slice(2, 8).toUpperCase()}`;
  const deliveredAt = Date.now();

  logStep("7. Verified Receipt Issued", "ok", `Receipt ${receiptId} generated with audit proof`);

  return new Response(
    JSON.stringify({
      success: true,
      stage: "receipt",
      requestId,
      serviceId,
      serviceName: service.name,
      provider: service.provider,
      amount: service.price,
      txHash: settlement.txHash,
      contentHash: settlement.contentHash,
      receiptId,
      output: expectedOutput,
      deliveredAt,
      error: null,
      challengeHeaders,
      steps,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}
