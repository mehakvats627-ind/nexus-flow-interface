import { ethers } from "ethers";
import { CONTRACT_ABI, ERC20_ABI } from "../lib/nexus/blockchain/contracts";
import { computeContentHash } from "../lib/nexus/blockchain/crypto";

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || process.env.VITE_SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";
const CHAIN_ID = Number(process.env.CHAIN_ID || 11155111);
function safeChecksum(addr: string, fallback: string): string { try { return ethers.getAddress(addr.toLowerCase()); } catch { return fallback; } }
const CONTRACT_ADDRESS = safeChecksum(process.env.CONTRACT_ADDRESS || process.env.VITE_CONTRACT_ADDRESS || "0x5fe21ab9c07d4e1b83ac6f0d92b7431aef08c6d1", "0x5fe21aB9C07d4E1B83Ac6F0D92B7431AeF08C6D1");
const USDC_ADDRESS = safeChecksum(process.env.USDC_ADDRESS || process.env.VITE_USDC_ADDRESS || "0x1c7d4b196cb0c7b01d743fbc6116a902379c7238", "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238");
const AGENT_ADDRESS = safeChecksum(process.env.AGENT_ADDRESS || process.env.VITE_AGENT_ADDRESS || "0xb7c4f19a2d63e8a1f05cb7d3e9a0c41f5d9c4d22", "0xB7C4F19a2d63e8A1f05Cb7d3e9A0c41F5d9c4d22");
const OWNER_ADDRESS = safeChecksum(process.env.OWNER_ADDRESS || process.env.VITE_OWNER_ADDRESS || "0xa34f81cb27ee09d4ba6c1e7f0a25b9d3e1c87f2b", "0xa34f81Cb27Ee09d4ba6C1e7f0A25B9d3E1C87F2b");
const AGENT_PRIVATE_KEY = process.env.AGENT_PRIVATE_KEY || process.env.PRIVATE_KEY || "";

export interface SepoliaNetworkStatus { connected: boolean; chainId: number; networkName: string; rpcUrl: string; latestBlock: number; agentAddress: string; agentEthBalance: string; agentUsdcBalance: string; ownerAddress: string; contractAddress: string; contractBudget: number; contractSpent: number; contractRemaining: number; isAgentAuthorized: boolean; usdcAddress: string; hasPrivateKey: boolean; error?: string; }
export interface OnChainSettlementResponse { success: boolean; status: "Success" | "Blocked" | "Duplicate" | "Failed"; txHash: string | null; contentHash: string | null; blockNumber?: number; gasUsed?: string; error?: string; auditRecord?: { requestId: string; agent: string; amount: number; serviceId: string; provider: string; contentHash: string; timestamp: number; txHash: string; blockNumber?: number }; }

export class ServerBlockchainService {
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Wallet | null = null;
  private contract: ethers.Contract;
  private usdcContract: ethers.Contract;
  constructor() {
    this.provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
    if (AGENT_PRIVATE_KEY && AGENT_PRIVATE_KEY.length >= 64) { try { const key = AGENT_PRIVATE_KEY.startsWith("0x") ? AGENT_PRIVATE_KEY : `0x${AGENT_PRIVATE_KEY}`; this.signer = new ethers.Wallet(key, this.provider); } catch (error) { console.warn("[Server Blockchain] Invalid AGENT_PRIVATE_KEY format:", error); } }
    const signerOrProvider = this.signer || this.provider;
    this.contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signerOrProvider);
    this.usdcContract = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, signerOrProvider);
  }
  public getSigner() { return this.signer; }
  public getProvider() { return this.provider; }

  public async getStatus(): Promise<SepoliaNetworkStatus> {
    try {
      const [blockNumber, network] = await Promise.all([this.provider.getBlockNumber(), this.provider.getNetwork()]);
      const activeAgent = this.signer ? await this.signer.getAddress() : AGENT_ADDRESS;
      let ethBal = "0.0", usdcBal = "0.0";
      try { ethBal = ethers.formatEther(await this.provider.getBalance(activeAgent)); } catch {}
      try { usdcBal = ethers.formatUnits(await this.usdcContract.balanceOf(activeAgent), 6); } catch {}
      let totalBudget = 0, totalSpent = 0, isAgentAuthorized = false, onChainOwner = OWNER_ADDRESS;
      try {
        const summary = await this.contract.getBudgetSummary();
        totalBudget = Number(ethers.formatUnits(summary[0], 6));
        totalSpent = Number(ethers.formatUnits(summary[1], 6));
        const authAgent = await this.contract.agent();
        isAgentAuthorized = authAgent.toLowerCase() === activeAgent.toLowerCase();
        onChainOwner = await this.contract.owner();
      } catch {}
      return { connected: true, chainId: Number(network.chainId) || CHAIN_ID, networkName: "Sepolia Testnet", rpcUrl: SEPOLIA_RPC_URL, latestBlock: blockNumber, agentAddress: activeAgent, agentEthBalance: ethBal, agentUsdcBalance: usdcBal, ownerAddress: onChainOwner, contractAddress: CONTRACT_ADDRESS, contractBudget: totalBudget, contractSpent: totalSpent, contractRemaining: Math.max(0, totalBudget - totalSpent), isAgentAuthorized, usdcAddress: USDC_ADDRESS, hasPrivateKey: !!this.signer };
    } catch (err) {
      return { connected: false, chainId: CHAIN_ID, networkName: "Sepolia Testnet", rpcUrl: SEPOLIA_RPC_URL, latestBlock: 0, agentAddress: AGENT_ADDRESS, agentEthBalance: "0.0", agentUsdcBalance: "0.0", ownerAddress: OWNER_ADDRESS, contractAddress: CONTRACT_ADDRESS, contractBudget: 0, contractSpent: 0, contractRemaining: 0, isAgentAuthorized: false, usdcAddress: USDC_ADDRESS, hasPrivateKey: !!this.signer, error: err instanceof Error ? err.message : String(err) };
    }
  }

  public async settlePaymentOnChain(requestId: string, serviceId: string, provider: string, amount: number, deliveredContent: string): Promise<OnChainSettlementResponse> {
    const contentHash = computeContentHash(deliveredContent); const amountInUnits = ethers.parseUnits(amount.toString(), 6);
    try { if (await this.contract.isProcessed(requestId)) return { success: false, status: "Duplicate", txHash: null, contentHash: null, error: `DuplicateRequest("${requestId}"): Request was already processed on-chain.` }; } catch {}
    try { const remaining = Number(ethers.formatUnits(await this.contract.getRemainingBudget(), 6)); if (amount > remaining) return { success: false, status: "Blocked", txHash: null, contentHash: null, error: `BudgetExceeded: Requested amount ${amount} USDC exceeds smart contract remaining budget of ${remaining} USDC.` }; } catch {}
    if (!this.signer) return { success: false, status: "Failed", txHash: null, contentHash: null, error: "AGENT_PRIVATE_KEY is not configured on the server." };
    try {
      const agentAddress = await this.signer.getAddress(); const authAgent = await this.contract.agent();
      if (authAgent.toLowerCase() !== agentAddress.toLowerCase()) return { success: false, status: "Failed", txHash: null, contentHash: null, error: `UnauthorizedAgent: ${agentAddress} is not authorized as agent on contract (${authAgent}).` };
      const usdcBalance: bigint = await this.usdcContract.balanceOf(agentAddress);
      if (usdcBalance < amountInUnits) return { success: false, status: "Failed", txHash: null, contentHash: null, error: `InsufficientUSDC: Agent balance is ${ethers.formatUnits(usdcBalance, 6)} USDC, requested ${amount} USDC.` };
      const allowance: bigint = await this.usdcContract.allowance(agentAddress, CONTRACT_ADDRESS); const usdcWithSigner = this.usdcContract.connect(this.signer) as ethers.Contract;
      if (allowance < amountInUnits) { const approval = await usdcWithSigner.approve(CONTRACT_ADDRESS, ethers.MaxUint256); await approval.wait(1); }
      const contractWithSigner = this.contract.connect(this.signer) as ethers.Contract; const tx = await contractWithSigner.settlePayment(requestId, serviceId, provider, amountInUnits, contentHash); const receipt = await tx.wait(1);
      return { success: true, status: "Success", txHash: receipt.hash, contentHash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed?.toString(), auditRecord: { requestId, agent: agentAddress, amount, serviceId, provider, contentHash, timestamp: Date.now(), txHash: receipt.hash, blockNumber: receipt.blockNumber } };
    } catch (err) {
      const e = err as { reason?: string; shortMessage?: string; message?: string }; const message = e?.reason || e?.shortMessage || e?.message || String(err);
      if (/DuplicateRequest|duplicate/i.test(message)) return { success: false, status: "Duplicate", txHash: null, contentHash: null, error: `DuplicateRequest("${requestId}"): Smart contract rejected duplicate payment.` };
      if (/BudgetExceeded|budget/i.test(message)) return { success: false, status: "Blocked", txHash: null, contentHash: null, error: "BudgetExceeded: Smart contract rejected payment exceeding spending cap." };
      return { success: false, status: "Failed", txHash: null, contentHash: null, error: `Blockchain Settlement Error: ${message}` };
    }
  }
  public async isRequestProcessed(requestId: string) { try { return await this.contract.isProcessed(requestId); } catch { return false; } }
  public async getPaymentDetails(requestId: string) { try { const record = await this.contract.getPayment(requestId); return { requestId: record._requestId, agent: record._agent, amount: Number(ethers.formatUnits(record._amount, 6)), serviceId: record._serviceId, provider: record._provider, contentHash: record._contentHash, timestamp: Number(record._timestamp) * 1000 }; } catch { return null; } }
}
export const serverBlockchain = new ServerBlockchainService();
