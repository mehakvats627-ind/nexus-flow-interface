import { serverBlockchain } from "./blockchain";
import { handleProviderRequest } from "./provider";
import { handleAgentRun } from "./agent";

export async function handleApiRoute(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // 1. Live Sepolia Blockchain Status Endpoint
  if (pathname === "/api/sepolia/status" || pathname === "/api/sepolia") {
    try {
      const status = await serverBlockchain.getStatus();
      return new Response(JSON.stringify(status), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return new Response(JSON.stringify({ error: msg, connected: false }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // 2. x402 Provider Endpoint
  if (pathname === "/api/provider") {
    return await handleProviderRequest(request);
  }

  // 3. AI Agent Autonomous Execution Endpoint
  if (pathname === "/api/agent/run") {
    return await handleAgentRun(request);
  }

  return null;
}
