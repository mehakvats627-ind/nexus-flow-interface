// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../NexusBudgetManager.sol";

contract NexusBudgetManagerTest {
    NexusBudgetManager internal manager;
    address internal owner;
    address internal agent = address(0xB7C4F19a2d63e8A1f05Cb7d3e9A0c41F5d9c4d22);

    uint256 internal constant INITIAL_BUDGET = 10;

    event PaymentSettled(
        string indexed requestId,
        address indexed agent,
        uint256 amount,
        uint256 totalSpent,
        bytes32 contentHash,
        string serviceId,
        string provider,
        uint256 timestamp
    );

    function setUp() public {
        owner = address(this);
        manager = new NexusBudgetManager(INITIAL_BUDGET, agent);
    }

    function test_OwnerInitialization() public view {
        require(manager.owner() == address(this), "Owner should be deployer");
        require(manager.agent() == agent, "Agent should be initialized");
        require(manager.totalBudget() == INITIAL_BUDGET, "Budget should match initial");
        require(manager.totalSpent() == 0, "Initial spent should be 0");
        require(manager.getRemainingBudget() == INITIAL_BUDGET, "Remaining should equal total");
    }

    function test_AgentAuthorization() public {
        address newAgent = address(0x9999999999999999999999999999999999999999);
        manager.authorizeAgent(newAgent);
        require(manager.agent() == newAgent, "Agent should be updated");
    }

    function test_RevertZeroAddressAgent() public {
        try manager.authorizeAgent(address(0)) {
            revert("Should revert on zero address");
        } catch {
            // Reverted as expected
        }
    }

    function test_SetBudget() public {
        manager.setBudget(25);
        require(manager.totalBudget() == 25, "Budget should be updated to 25");
        require(manager.getRemainingBudget() == 25, "Remaining should be 25");
    }

    function test_BudgetSummaryView() public {
        (uint256 total, uint256 spent, uint256 remaining) = manager.getBudgetSummary();
        require(total == INITIAL_BUDGET, "Total budget mismatch");
        require(spent == 0, "Initial spent mismatch");
        require(remaining == INITIAL_BUDGET, "Remaining mismatch");

        manager.settlePayment("req-summary", "translation", "TranslatePro", 1, keccak256(abi.encodePacked("test")));
        (total, spent, remaining) = manager.getBudgetSummary();
        require(total == INITIAL_BUDGET, "Total budget should remain constant");
        require(spent == 1, "Spent should be 1");
        require(remaining == 9, "Remaining should be 9");
    }

    function test_SuccessfulPaymentSettlement() public {
        string memory requestId = "req-001";
        string memory serviceId = "translation";
        string memory provider = "TranslatePro";
        uint256 amount = 1;
        bytes32 contentHash = keccak256(abi.encodePacked("Bonjour"));

        bool success = manager.settlePayment(requestId, serviceId, provider, amount, contentHash);
        require(success, "Payment should succeed");

        require(manager.totalSpent() == 1, "Spent should increase by 1");
        require(manager.getRemainingBudget() == INITIAL_BUDGET - 1, "Remaining budget should decrease");
        require(manager.isProcessed(requestId), "RequestId should be marked processed");

        (
            string memory rId,
            address rAgent,
            uint256 rAmount,
            string memory rServiceId,
            string memory rProvider,
            bytes32 rContentHash,
            uint256 rTimestamp
        ) = manager.getPayment(requestId);

        require(keccak256(bytes(rId)) == keccak256(bytes(requestId)), "RequestId mismatch");
        require(rAgent == address(this), "Agent address mismatch");
        require(rAmount == amount, "Amount mismatch");
        require(keccak256(bytes(rServiceId)) == keccak256(bytes(serviceId)), "ServiceId mismatch");
        require(keccak256(bytes(rProvider)) == keccak256(bytes(provider)), "Provider mismatch");
        require(rContentHash == contentHash, "ContentHash mismatch");
        require(rTimestamp > 0, "Timestamp must be set");
    }

    function test_OverspendingRejection() public {
        // First spend 9 out of 10
        manager.settlePayment("req-001", "code", "CodeForge AI", 9, keccak256(abi.encodePacked("code-1")));
        require(manager.getRemainingBudget() == 1, "Remaining should be 1");

        // Attempt to spend 2 (which exceeds remaining 1)
        try manager.settlePayment("req-002", "image", "PixelMind", 2, keccak256(abi.encodePacked("img-1"))) {
            revert("Should have reverted on overspending");
        } catch {
            // Success: call reverted as expected
        }

        // Verify totalSpent did NOT change
        require(manager.totalSpent() == 9, "Total spent must not change after rejected overspend");
        require(manager.getRemainingBudget() == 1, "Remaining budget must stay intact");
        require(!manager.isProcessed("req-002"), "Rejected request must not be marked processed");
    }

    function test_DuplicateRequestIdRejection() public {
        string memory requestId = "req-duplicate-test";
        manager.settlePayment(requestId, "translation", "TranslatePro", 1, keccak256(abi.encodePacked("test")));

        require(manager.totalSpent() == 1, "First payment spent 1");

        // Attempting duplicate request
        try manager.settlePayment(requestId, "translation", "TranslatePro", 1, keccak256(abi.encodePacked("test2"))) {
            revert("Should have reverted on duplicate requestId");
        } catch {
            // Success: call reverted as expected
        }

        // Verify no second charge
        require(manager.totalSpent() == 1, "Total spent must not be charged twice");
    }

    function test_InvalidAmountAndEmptyRequestId() public {
        try manager.settlePayment("", "translation", "TranslatePro", 1, keccak256(abi.encodePacked("empty"))) {
            revert("Should revert on empty requestId");
        } catch {}

        try manager.settlePayment("req-zero", "translation", "TranslatePro", 0, keccak256(abi.encodePacked("zero"))) {
            revert("Should revert on zero amount");
        } catch {}
    }

    function test_AuditTrailAndSequence() public {
        manager.settlePayment("req-a", "translation", "TranslatePro", 1, keccak256(abi.encodePacked("a")));
        manager.settlePayment("req-b", "code", "CodeForge AI", 2, keccak256(abi.encodePacked("b")));

        require(manager.getPaymentCount() == 2, "Payment count should be 2");
        string[] memory ids = manager.getAllRequestIds();
        require(ids.length == 2, "Request IDs array length should be 2");
        require(keccak256(bytes(ids[0])) == keccak256(bytes("req-a")), "First ID should match");
        require(keccak256(bytes(ids[1])) == keccak256(bytes("req-b")), "Second ID should match");
    }

    function test_TransferOwnership() public {
        address newOwner = address(0x8888888888888888888888888888888888888888);
        manager.transferOwnership(newOwner);
        require(manager.owner() == newOwner, "Owner should be updated");
    }
}
