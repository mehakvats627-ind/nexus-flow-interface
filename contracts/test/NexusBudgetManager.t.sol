// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../NexusBudgetManager.sol";

contract MockUSDC is IERC20 {
    string public name = "USD Coin";
    string public symbol = "USDC";
    uint8 public decimals = 6;
    uint256 public override totalSupply;

    mapping(address => uint256) public override balanceOf;
    mapping(address => mapping(address => uint256)) public override allowance;

    constructor() {
        _mint(msg.sender, 1000000 * 10**6);
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function _mint(address to, uint256 amount) internal {
        totalSupply += amount;
        balanceOf[to] += amount;
    }

    function transfer(address recipient, uint256 amount) external override returns (bool) {
        require(balanceOf[msg.sender] >= amount, "ERC20: insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[recipient] += amount;
        return true;
    }

    function approve(address spender, uint256 amount) external override returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transferFrom(address sender, address recipient, uint256 amount) external override returns (bool) {
        require(balanceOf[sender] >= amount, "ERC20: insufficient balance");
        if (allowance[sender][msg.sender] != type(uint256).max) {
            require(allowance[sender][msg.sender] >= amount, "ERC20: insufficient allowance");
            allowance[sender][msg.sender] -= amount;
        }
        balanceOf[sender] -= amount;
        balanceOf[recipient] += amount;
        return true;
    }
}

contract NexusBudgetManagerTest {
    NexusBudgetManager internal manager;
    MockUSDC internal usdc;
    address internal owner;
    address internal agent = address(0xB7C4F19a2d63e8A1f05Cb7d3e9A0c41F5d9c4d22);

    uint256 internal constant INITIAL_BUDGET = 10 * 10**6;

    function setUp() public {
        owner = address(this);
        usdc = new MockUSDC();
        manager = new NexusBudgetManager(INITIAL_BUDGET, agent, address(usdc));
        usdc.approve(address(manager), type(uint256).max);
    }

    function test_OwnerInitialization() public view {
        require(manager.owner() == address(this), "Owner should be deployer");
        require(manager.agent() == agent, "Agent should be initialized");
        require(manager.totalBudget() == INITIAL_BUDGET, "Budget should match initial");
        require(manager.totalSpent() == 0, "Initial spent should be 0");
        require(manager.getRemainingBudget() == INITIAL_BUDGET, "Remaining should equal total");
        require(address(manager.usdcToken()) == address(usdc), "USDC token address mismatch");
    }

    function test_AgentAuthorization() public {
        address newAgent = address(0x9999999999999999999999999999999999999999);
        manager.authorizeAgent(newAgent);
        require(manager.agent() == newAgent, "Agent should be updated");
    }

    function test_SetBudget() public {
        manager.setBudget(25 * 10**6);
        require(manager.totalBudget() == 25 * 10**6, "Budget should be updated to 25");
        require(manager.getRemainingBudget() == 25 * 10**6, "Remaining should be 25");
    }

    function test_SuccessfulPaymentSettlement() public {
        string memory requestId = "req-001";
        string memory serviceId = "translation";
        string memory provider = "TranslatePro";
        uint256 amount = 1 * 10**6;
        bytes32 contentHash = keccak256(abi.encodePacked("Bonjour"));

        bool success = manager.settlePayment(requestId, serviceId, provider, amount, contentHash);
        require(success, "Payment should succeed");

        require(manager.totalSpent() == amount, "Spent should increase");
        require(manager.getRemainingBudget() == INITIAL_BUDGET - amount, "Remaining budget should decrease");
        require(manager.isProcessed(requestId), "RequestId should be marked processed");
    }

    function test_OverspendingRejection() public {
        manager.settlePayment("req-001", "code", "CodeForge AI", 9 * 10**6, keccak256(abi.encodePacked("code-1")));
        require(manager.getRemainingBudget() == 1 * 10**6, "Remaining should be 1");

        try manager.settlePayment("req-002", "image", "PixelMind", 2 * 10**6, keccak256(abi.encodePacked("img-1"))) {
            revert("Should have reverted on overspending");
        } catch {}

        require(manager.totalSpent() == 9 * 10**6, "Total spent must not change");
        require(manager.getRemainingBudget() == 1 * 10**6, "Remaining budget must stay intact");
        require(!manager.isProcessed("req-002"), "Rejected request must not be marked processed");
    }

    function test_DuplicateRequestIdRejection() public {
        string memory requestId = "req-duplicate-test";
        manager.settlePayment(requestId, "translation", "TranslatePro", 1 * 10**6, keccak256(abi.encodePacked("test")));

        try manager.settlePayment(requestId, "translation", "TranslatePro", 1 * 10**6, keccak256(abi.encodePacked("test2"))) {
            revert("Should have reverted on duplicate requestId");
        } catch {}

        require(manager.totalSpent() == 1 * 10**6, "Total spent must not be charged twice");
    }
}
