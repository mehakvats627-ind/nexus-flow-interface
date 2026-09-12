import { ethers } from "ethers";
import {
  AGENT_ADDRESS,
  CONTRACT_ABI,
  CONTRACT_ADDRESS,
  ERC20_ABI,
  NETWORK,
  OWNER_ADDRESS,
  PRIVATE_KEY,
  SEPOLIA_RPC_URL,
  USDC_ADDRESS,
} from "./contracts";
import { computeContentHash } from "./crypto";

export interface OnChainPaymentRecord {
  requestId: string;
  agent: string;
  amount: number;
  serviceId: string;
  provider: string;
  recipient?: string;
  contentHash: string;
  timestamp: number;
  txHash: string;
  blockNumber?: number;
}

export interface SettlementResult {
  success: boolean;
  status: "Success" | "Blocked" | "Duplicate";
  txHash: string | null;
  contentHash: string | null;
  blockNumber?: number;
  error?: string;
  record?: OnChainPaymentRecord;
}

/**
 * NexusBlockchainEngine executes live on-chain operations on Sepolia Testnet.
 * Submits real transactions, enforces smart contract budget caps & idempotency,
 * handles real ERC20 USDC token allowance and approvals, and tracks live audit proofs.
 */
export class NexusBlockchainEngine {
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Signer | null = null;
  private contract: ethers.Contract | null = null;
  private usdcContract: ethers.Contract | null = null;

  // Local synced cache for fast UI access & offline resilience
  private totalBudget: number = 10;
  private totalSpent: number = 0;
  private processedMap = new Map<string, boolean>();
  private paymentRecords = new Map<string, OnChainPaymentRecord>();
  private requestIds: string[] = [];
  private isConnected: boolean = false;
  private isInitialized: boolean = false;

  constructor(initialBudget = 10) {
    this.totalBudget = initialBudget;
    this.totalSpent = 0;
    this.provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
    this.init().catch((err) => {
      console.warn("[NEXUS Blockchain] Provider init notice:", err?.message || err);
    });
  }

  /**
   * Initializes real Sepolia provider, wallet signer, and contract instances.
   */
  public async init() {
    if (this.isInitialized) return;

    try {
      this.provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);

      if (
        PRIVATE_KEY &&
        !PRIVATE_KEY.startsWith(
          "0x0000000000000000000000000000000000000000000000000000000000000001",
        )
      ) {
        this.signer = new ethers.Wallet(PRIVATE_KEY, this.provider);
      } else {
        // Deterministic session wallet for agent execution if no external key is supplied
        const deterministicKey = ethers.keccak256(
          ethers.toUtf8Bytes(`nexus-agent-session-${AGENT_ADDRESS}`),
        );
        this.signer = new ethers.Wallet(deterministicKey, this.provider);
      }

      const signerOrProvider = this.signer || this.provider;

      this.contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signerOrProvider);
      this.usdcContract = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, signerOrProvider);

      this.isConnected = true;
      this.isInitialized = true;

      // Sync state from Sepolia contract
      await this.syncFromChain();
    } catch (error) {
      console.warn("[NEXUS Blockchain] Sepolia network connection status:", error);
    }
  }

  /**
   * Synchronizes budget and settled records directly from the Sepolia smart contract.
   */
  public async syncFromChain(): Promise<void> {
    if (!this.contract) return;

    try {
      const [rawBudget, rawSpent, rawRemaining] = await this.contract.getBudgetSummary();
      const decimals = 6; // USDC decimals
      this.totalBudget = Number(ethers.formatUnits(rawBudget, decimals)) || this.totalBudget;
      this.totalSpent = Number(ethers.formatUnits(rawSpent, decimals));

      const count = await this.contract.getPaymentCount();
      const countNum = Number(count);

      if (countNum > 0) {
        const onChainIds: string[] = await this.contract.getAllRequestIds();
        this.requestIds = onChainIds;
        for (const id of onChainIds) {
          this.processedMap.set(id, true);
          try {
            const p = await this.contract.getPayment(id);
            this.paymentRecords.set(id, {
              requestId: p._requestId,
              agent: p._agent,
              amount: Number(ethers.formatUnits(p._amount, decimals)),
              serviceId: p._serviceId,
              provider: p._provider,
              contentHash: p._contentHash,
              timestamp: Number(p._timestamp) * 1000,
              txHash: this.paymentRecords.get(id)?.txHash || ethers.ZeroHash,
            });
          } catch {
            // Ignore single record sync issue
          }
        }
      }
    } catch (err) {
      console.warn("[NEXUS Blockchain] Contract sync notice:", err);
    }
  }

  public getBudgetSummary() {
    const remaining = Math.max(0, this.totalBudget - this.totalSpent);
    return {
      total: this.totalBudget,
      spent: this.totalSpent,
      remaining,
      spentPct: this.totalBudget > 0 ? (this.totalSpent / this.totalBudget) * 100 : 0,
      remainingPct: this.totalBudget > 0 ? (remaining / this.totalBudget) * 100 : 0,
    };
  }

  public isProcessed(requestId: string): boolean {
    return this.processedMap.get(requestId) === true;
  }

  public getPayment(requestId: string): OnChainPaymentRecord | null {
    return this.paymentRecords.get(requestId) || null;
  }

  public getAllPayments(): OnChainPaymentRecord[] {
    return this.requestIds.map((id) => this.paymentRecords.get(id)!).filter(Boolean);
  }

  /**
   * Settle a service payment on Sepolia via NexusBudgetManager smart contract.
   * Performs real allowance check/approval, sends transaction, awaits confirmation receipt.
   */
  public async settlePayment(
    requestId: string,
    serviceId: string,
    provider: string,
    amount: number,
    deliveredContent: string,
    caller: string = AGENT_ADDRESS,
  ): Promise<SettlementResult> {
    await this.init();

    const contentHash = computeContentHash(deliveredContent);
    const remaining = this.getBudgetSummary().remaining;
    const amountInUnits = ethers.parseUnits(amount.toString(), 6);

    // Rule 1: Idempotency check
    if (this.isProcessed(requestId)) {
      return {
        success: false,
        status: "Duplicate",
        txHash: null,
        contentHash: null,
        error: `DuplicateRequest("${requestId}"): Request already processed on-chain. No second charge.`,
      };
    }

    // Rule 2: Hard budget cap check
    if (amount > remaining) {
      return {
        success: false,
        status: "Blocked",
        txHash: null,
        contentHash: null,
        error: `BudgetExceeded: Requested ${amount} USDC exceeds remaining on-chain budget of ${remaining} USDC.`,
      };
    }

    // Settle via server API endpoint if running in client/browser
    if (typeof window !== "undefined") {
      try {
        const response = await fetch("/api/agent/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            serviceId,
            requestId,
            prompt: deliveredContent,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.txHash) {
            this.totalSpent += amount;
            this.processedMap.set(requestId, true);
            const record: OnChainPaymentRecord = {
              requestId,
              agent: caller,
              amount,
              serviceId,
              provider,
              contentHash,
              timestamp: data.deliveredAt || Date.now(),
              txHash: data.txHash,
              blockNumber: data.blockNumber,
            };
            this.paymentRecords.set(requestId, record);
            this.requestIds.push(requestId);

            return {
              success: true,
              status: "Success",
              txHash: data.txHash,
              contentHash: data.contentHash || contentHash,
              blockNumber: data.blockNumber,
              record,
            };
          } else {
            return {
              success: false,
              status:
                data.stage === "blocked"
                  ? "Blocked"
                  : data.stage === "duplicate"
                    ? "Duplicate"
                    : "Blocked",
              txHash: null,
              contentHash: null,
              error: data.error || "On-chain settlement rejected by smart contract.",
            };
          }
        }
      } catch (apiErr) {
        console.warn("[NEXUS Agent API Notice]:", apiErr);
      }
    }

    // Direct RPC contract fallback
    if (this.contract && this.signer) {
      try {
        const contractWithSigner = this.contract.connect(this.signer) as ethers.Contract;
        if (this.usdcContract) {
          const signerAddress = await this.signer.getAddress();
          const allowance: bigint = await this.usdcContract.allowance(
            signerAddress,
            CONTRACT_ADDRESS,
          );
          if (allowance < amountInUnits) {
            const usdcWithSigner = this.usdcContract.connect(this.signer) as ethers.Contract;
            const approveTx = await usdcWithSigner.approve(CONTRACT_ADDRESS, ethers.MaxUint256);
            await approveTx.wait(1);
          }
        }

        const tx = await contractWithSigner.settlePayment(
          requestId,
          serviceId,
          provider,
          amountInUnits,
          contentHash,
        );
        const receipt = await tx.wait(1);
        txHash = receipt.hash;
        blockNumber = receipt.blockNumber;

        this.totalSpent += amount;
        this.processedMap.set(requestId, true);

        const record: OnChainPaymentRecord = {
          requestId,
          agent: caller,
          amount,
          serviceId,
          provider,
          contentHash,
          timestamp: Date.now(),
          txHash,
          blockNumber,
        };

        this.paymentRecords.set(requestId, record);
        this.requestIds.push(requestId);

        return {
          success: true,
          status: "Success",
          txHash,
          contentHash,
          blockNumber,
          record,
        };
      } catch (contractErr: unknown) {
        const errorObj = contractErr as { reason?: string; message?: string } | null;
        const errorMsg = errorObj?.reason || errorObj?.message || String(contractErr);

        if (errorMsg.includes("DuplicateRequest") || errorMsg.includes("duplicate")) {
          return {
            success: false,
            status: "Duplicate",
            txHash: null,
            contentHash: null,
            error: `DuplicateRequest("${requestId}"): Contract reverted duplicate request.`,
          };
        }

        if (
          errorMsg.includes("BudgetExceeded") ||
          errorMsg.includes("budget") ||
          errorMsg.includes("exceeds")
        ) {
          return {
            success: false,
            status: "Blocked",
            txHash: null,
            contentHash: null,
            error: `BudgetExceeded: Smart contract rejected payment exceeding budget cap.`,
          };
        }

        return {
          success: false,
          status: "Blocked",
          txHash: null,
          contentHash: null,
          error: `Blockchain settlement failed: ${errorMsg}`,
        };
      }
    }

    // If transaction could not be executed on blockchain, return failure (NO fake success fallback)
    return {
      success: false,
      status: "Blocked",
      txHash: null,
      contentHash: null,
      error: "Blockchain transaction failed: No active signer connected.",
    };
  }

  public setBudget(newBudget: number) {
    this.totalBudget = newBudget;
  }

  public reset(initialBudget = 10) {
    this.totalBudget = initialBudget;
    this.totalSpent = 0;
    this.processedMap.clear();
    this.paymentRecords.clear();
    this.requestIds = [];
  }
}

export const blockchainEngine = new NexusBlockchainEngine(10);
