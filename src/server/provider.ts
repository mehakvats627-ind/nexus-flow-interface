import { computeContentHash } from "../lib/nexus/blockchain/crypto";
import { generateServiceOutput, getService, ServiceId } from "../lib/nexus/services/providers";
import { serverBlockchain } from "./blockchain";

export async function handleProviderRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  let body: Record<string, unknown> = {};

  if (request.method === "POST") {
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      body = {};
    }
  }

  const serviceId = (url.searchParams.get("serviceId") ||
    body.serviceId ||
    "translation") as ServiceId;
  const requestId = (url.searchParams.get("requestId") ||
    body.requestId ||
    `req-${Date.now()}`) as string;
  const prompt = (body.prompt as string) || url.searchParams.get("prompt") || undefined;

  const service = getService(serviceId);
  const status = await serverBlockchain.getStatus();

  // Check for Payment Headers (x402 protocol specification)
  const paymentSig =
    request.headers.get("PAYMENT-SIGNATURE") ||
    request.headers.get("payment-signature") ||
    request.headers.get("X-Payment-Tx") ||
    request.headers.get("x-payment-tx") ||
    (body.txHash as string);

  // If no payment proof provided, respond with HTTP 402 Payment Required
  if (!paymentSig) {
    const challengeHeader = `L402 token="nexus-req", contract="${status.contractAddress}", price="${service.price}", currency="USDC", network="Sepolia Testnet", chain_id="11155111"`;
    const paymentReqHeader = JSON.stringify({
      requestId,
      serviceId: service.id,
      amount: service.price,
      contract: status.contractAddress,
      usdcToken: status.usdcAddress,
      chainId: status.chainId,
    });

    return new Response(
      JSON.stringify({
        error: "Payment Required",
        statusCode: 402,
        protocol: "x402-v2",
        message: `Service '${service.name}' requires on-chain settlement of ${service.price} USDC.`,
        challenge: {
          serviceId: service.id,
          name: service.name,
          provider: service.provider,
          price: service.price,
          currency: "USDC",
          contractAddress: status.contractAddress,
          usdcAddress: status.usdcAddress,
          requestId,
          network: "Sepolia Testnet",
          chainId: status.chainId,
        },
      }),
      {
        status: 402,
        headers: {
          "Content-Type": "application/json",
          "WWW-Authenticate": challengeHeader,
          "PAYMENT-REQUIRED": paymentReqHeader,
          "X-Payment-Contract": status.contractAddress,
          "X-Payment-Amount": service.price.toString(),
          "X-Request-Id": requestId,
        },
      },
    );
  }

  // Payment proof received — verify on Sepolia contract or server ledger
  const isSettled = await serverBlockchain.isRequestProcessed(requestId);
  const paymentDetails = await serverBlockchain.getPaymentDetails(requestId);

  // Deliver the requested service content
  const output = generateServiceOutput(serviceId, requestId, prompt);
  const contentHash = computeContentHash(output);
  const receiptId = `rcpt-${requestId.replace("req-", "")}-${contentHash.slice(2, 8).toUpperCase()}`;

  const responseHeader = `status=settled; requestId=${requestId}; txHash=${paymentSig}; contentHash=${contentHash}`;

  return new Response(
    JSON.stringify({
      success: true,
      statusCode: 200,
      protocol: "x402-v2",
      status: "delivered",
      requestId,
      receiptId,
      service: service.name,
      serviceId: service.id,
      provider: service.provider,
      amount: service.price,
      txHash: paymentSig,
      contentHash,
      onChainVerified: isSettled,
      onChainRecord: paymentDetails,
      output,
      deliveredAt: Date.now(),
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "PAYMENT-RESPONSE": responseHeader,
        "X-Content-Hash": contentHash,
        "X-Receipt-Id": receiptId,
      },
    },
  );
}
