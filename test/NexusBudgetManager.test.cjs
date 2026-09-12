const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NexusBudgetManager Smart Contract Test Suite", function () {
  let owner;
  let agent;
  let unauthorized;
  let providerTreasury;
  let budgetManager;
  let mockUSDC;

  const INITIAL_BUDGET = ethers.parseUnits("10", 6); // 10 USDC (6 decimals)
  const ONE_USDC = ethers.parseUnits("1", 6);
  const TWO_USDC = ethers.parseUnits("2", 6);
  const NINE_USDC = ethers.parseUnits("9", 6);

  beforeEach(async function () {
    [owner, agent, unauthorized, providerTreasury] = await ethers.getSigners();

    // Deploy Mock USDC token
    const MockUSDCFactory = await ethers.getContractFactory(
      "contracts/test/NexusBudgetManager.t.sol:MockUSDC",
    );
    mockUSDC = await MockUSDCFactory.deploy();
    await mockUSDC.waitForDeployment();

    // Deploy NexusBudgetManager contract
    const NexusBudgetManagerFactory = await ethers.getContractFactory("NexusBudgetManager");
    budgetManager = await NexusBudgetManagerFactory.deploy(
      INITIAL_BUDGET,
      agent.address,
      await mockUSDC.getAddress(),
    );
    await budgetManager.waitForDeployment();

    // Fund agent with 100 USDC and approve budget manager to spend
    await mockUSDC.mint(agent.address, ethers.parseUnits("100", 6));
    await mockUSDC.connect(agent).approve(await budgetManager.getAddress(), ethers.MaxUint256);
    await mockUSDC.connect(owner).approve(await budgetManager.getAddress(), ethers.MaxUint256);
  });

  describe("1. Initialization & Authorization", function () {
    it("Should correctly initialize owner, agent, budget and USDC token", async function () {
      expect(await budgetManager.owner()).to.equal(owner.address);
      expect(await budgetManager.agent()).to.equal(agent.address);
      expect(await budgetManager.totalBudget()).to.equal(INITIAL_BUDGET);
      expect(await budgetManager.totalSpent()).to.equal(0n);
      expect(await budgetManager.getRemainingBudget()).to.equal(INITIAL_BUDGET);
      expect(await budgetManager.usdcToken()).to.equal(await mockUSDC.getAddress());
    });

    it("Should allow owner to authorize a new agent and emit AgentAuthorized event", async function () {
      const newAgent = unauthorized.address;
      await expect(budgetManager.connect(owner).authorizeAgent(newAgent))
        .to.emit(budgetManager, "AgentAuthorized")
        .withArgs(agent.address, newAgent);

      expect(await budgetManager.agent()).to.equal(newAgent);
    });

    it("Should reject agent authorization from non-owner", async function () {
      await expect(
        budgetManager.connect(unauthorized).authorizeAgent(unauthorized.address),
      ).to.be.revertedWithCustomError(budgetManager, "OnlyOwner");
    });

    it("Should reject zero address agent authorization", async function () {
      await expect(
        budgetManager.connect(owner).authorizeAgent(ethers.ZeroAddress),
      ).to.be.revertedWithCustomError(budgetManager, "InvalidAddress");
    });

    it("Should allow owner to transfer ownership", async function () {
      await expect(budgetManager.connect(owner).transferOwnership(unauthorized.address))
        .to.emit(budgetManager, "OwnershipTransferred")
        .withArgs(owner.address, unauthorized.address);

      expect(await budgetManager.owner()).to.equal(unauthorized.address);
    });
  });

  describe("2. Budget Management & Views", function () {
    it("Should allow owner to update total budget", async function () {
      const newBudget = ethers.parseUnits("25", 6);
      await expect(budgetManager.connect(owner).setBudget(newBudget))
        .to.emit(budgetManager, "BudgetUpdated")
        .withArgs(INITIAL_BUDGET, newBudget);

      expect(await budgetManager.totalBudget()).to.equal(newBudget);
      expect(await budgetManager.getRemainingBudget()).to.equal(newBudget);
    });

    it("Should return accurate getBudgetSummary()", async function () {
      const [total, spent, remaining] = await budgetManager.getBudgetSummary();
      expect(total).to.equal(INITIAL_BUDGET);
      expect(spent).to.equal(0n);
      expect(remaining).to.equal(INITIAL_BUDGET);
    });
  });

  describe("3. Payment Settlement & USDC ERC20 Transfer", function () {
    it("Should settle payment successfully, transfer USDC and emit PaymentSettled", async function () {
      const requestId = "req-001";
      const serviceId = "translation";
      const providerName = "TranslatePro";
      const content = "« Bonjour, le paiement autonome req-001 est validé sur Sepolia. »";
      const contentHash = ethers.keccak256(ethers.toUtf8Bytes(content));

      const initialAgentBal = await mockUSDC.balanceOf(agent.address);
      const initialOwnerBal = await mockUSDC.balanceOf(owner.address);

      const tx = await budgetManager
        .connect(agent)
        .settlePayment(requestId, serviceId, providerName, ONE_USDC, contentHash);

      await expect(tx)
        .to.emit(budgetManager, "PaymentSettled")
        .withArgs(
          requestId,
          agent.address,
          ONE_USDC,
          ONE_USDC,
          contentHash,
          serviceId,
          providerName,
          (await ethers.provider.getBlock("latest")).timestamp,
        );

      // Verify token balances changed
      const finalAgentBal = await mockUSDC.balanceOf(agent.address);
      const finalOwnerBal = await mockUSDC.balanceOf(owner.address);
      expect(finalAgentBal).to.equal(initialAgentBal - ONE_USDC);
      expect(finalOwnerBal).to.equal(initialOwnerBal + ONE_USDC);

      // Verify budget state
      expect(await budgetManager.totalSpent()).to.equal(ONE_USDC);
      expect(await budgetManager.getRemainingBudget()).to.equal(INITIAL_BUDGET - ONE_USDC);
      expect(await budgetManager.isProcessed(requestId)).to.be.true;
      expect(await budgetManager.getPaymentCount()).to.equal(1n);

      // Verify stored record
      const [rId, rAgent, rAmount, rService, rProvider, rContentHash, rTimestamp] =
        await budgetManager.getPayment(requestId);
      expect(rId).to.equal(requestId);
      expect(rAgent).to.equal(agent.address);
      expect(rAmount).to.equal(ONE_USDC);
      expect(rService).to.equal(serviceId);
      expect(rProvider).to.equal(providerName);
      expect(rContentHash).to.equal(contentHash);
      expect(rTimestamp).to.be.gt(0);
    });

    it("Should support settlePaymentWithRecipient to direct funds to provider treasury", async function () {
      const requestId = "req-recipient-test";
      const contentHash = ethers.keccak256(ethers.toUtf8Bytes("code snippet"));

      const initialTreasuryBal = await mockUSDC.balanceOf(providerTreasury.address);

      await budgetManager
        .connect(agent)
        .settlePaymentWithRecipient(
          requestId,
          "code",
          "CodeForge AI",
          providerTreasury.address,
          TWO_USDC,
          contentHash,
        );

      const finalTreasuryBal = await mockUSDC.balanceOf(providerTreasury.address);
      expect(finalTreasuryBal).to.equal(initialTreasuryBal + TWO_USDC);
    });

    it("Should reject settlement from unauthorized caller", async function () {
      const contentHash = ethers.keccak256(ethers.toUtf8Bytes("hello"));
      await expect(
        budgetManager
          .connect(unauthorized)
          .settlePayment("req-unauth", "translation", "TranslatePro", ONE_USDC, contentHash),
      ).to.be.revertedWithCustomError(budgetManager, "OnlyAuthorizedAgent");
    });
  });

  describe("4. Hard Budget Enforcement & Rejections", function () {
    it("Should reject payments exceeding remaining budget and emit PaymentBlocked", async function () {
      const contentHash = ethers.keccak256(ethers.toUtf8Bytes("expensive"));

      // 1. Spend 9 of 10 USDC
      await budgetManager
        .connect(agent)
        .settlePayment("req-spend-9", "code", "CodeForge AI", NINE_USDC, contentHash);

      expect(await budgetManager.getRemainingBudget()).to.equal(ONE_USDC);

      // 2. Try to spend 2 USDC (budget remaining is only 1 USDC)
      await expect(
        budgetManager
          .connect(agent)
          .settlePayment("req-exceed", "image", "PixelMind", TWO_USDC, contentHash),
      )
        .to.be.revertedWithCustomError(budgetManager, "BudgetExceeded")
        .withArgs(TWO_USDC, ONE_USDC);

      // Verify no state change or tokens charged
      expect(await budgetManager.totalSpent()).to.equal(NINE_USDC);
      expect(await budgetManager.isProcessed("req-exceed")).to.be.false;
      expect(await budgetManager.getPaymentCount()).to.equal(1n);
    });

    it("Should reject payment with 0 amount", async function () {
      const contentHash = ethers.keccak256(ethers.toUtf8Bytes("zero"));
      await expect(
        budgetManager
          .connect(agent)
          .settlePayment("req-zero", "translation", "TranslatePro", 0n, contentHash),
      ).to.be.revertedWithCustomError(budgetManager, "InvalidAmount");
    });
  });

  describe("5. Idempotency & Duplicate Request Protection", function () {
    it("Should reject duplicate requestId without charging again", async function () {
      const requestId = "req-idempotency-1";
      const contentHash = ethers.keccak256(ethers.toUtf8Bytes("content-1"));

      // First call succeeds
      await budgetManager
        .connect(agent)
        .settlePayment(requestId, "translation", "TranslatePro", ONE_USDC, contentHash);

      const agentBalAfterFirst = await mockUSDC.balanceOf(agent.address);
      const spentAfterFirst = await budgetManager.totalSpent();

      // Second call with same requestId MUST revert on-chain
      await expect(
        budgetManager
          .connect(agent)
          .settlePayment(requestId, "translation", "TranslatePro", ONE_USDC, contentHash),
      )
        .to.be.revertedWithCustomError(budgetManager, "DuplicateRequest")
        .withArgs(requestId);

      // Verify no extra tokens were transferred and totalSpent stayed the same
      const agentBalAfterSecond = await mockUSDC.balanceOf(agent.address);
      const spentAfterSecond = await budgetManager.totalSpent();

      expect(agentBalAfterSecond).to.equal(agentBalAfterFirst);
      expect(spentAfterSecond).to.equal(spentAfterFirst);
      expect(await budgetManager.getPaymentCount()).to.equal(1n);
    });
  });

  describe("6. Audit Trail & Content Verification", function () {
    it("Should maintain accurate sequential list of all request IDs", async function () {
      const h1 = ethers.keccak256(ethers.toUtf8Bytes("output 1"));
      const h2 = ethers.keccak256(ethers.toUtf8Bytes("output 2"));

      await budgetManager
        .connect(agent)
        .settlePayment("req-a", "translation", "TranslatePro", ONE_USDC, h1);
      await budgetManager
        .connect(agent)
        .settlePayment("req-b", "code", "CodeForge AI", TWO_USDC, h2);

      const allIds = await budgetManager.getAllRequestIds();
      expect(allIds.length).to.equal(2);
      expect(allIds[0]).to.equal("req-a");
      expect(allIds[1]).to.equal("req-b");
    });

    it("Should revert RequestNotFound for unknown requestId", async function () {
      await expect(budgetManager.getPayment("req-unknown")).to.be.revertedWithCustomError(
        budgetManager,
        "RequestNotFound",
      );
    });
  });
});
