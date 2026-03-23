// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {AgentWallet} from "../src/AgentWallet.sol";
import {MockERC20} from "../src/mocks/MockERC20.sol";

contract AgentWalletTest is Test {
    AgentWallet public wallet;
    MockERC20 public usdc;
    MockERC20 public dai;

    address public owner = makeAddr("owner");
    address public operator = makeAddr("operator");
    address public recipient = makeAddr("recipient");
    address public nobody = makeAddr("nobody");

    uint256 constant INITIAL_BALANCE = 1_000_000e6; // 1M USDC
    uint256 constant ETH_BALANCE = 10 ether;

    function setUp() public {
        usdc = new MockERC20("USD Coin", "USDC", 6);
        dai = new MockERC20("Dai", "DAI", 18);

        vm.prank(owner);
        wallet = new AgentWallet(owner, operator);

        // Fund the wallet
        usdc.mint(address(wallet), INITIAL_BALANCE);
        dai.mint(address(wallet), 1_000_000e18);
        vm.deal(address(wallet), ETH_BALANCE);

        // Owner configures allowlist, caps, and limits
        vm.startPrank(owner);
        wallet.setAllowlisted(address(usdc), true);
        wallet.setAllowlisted(address(0), true); // ETH
        wallet.setTransactionCap(address(usdc), 10_000e6);
        wallet.setDailyLimit(address(usdc), 50_000e6);
        wallet.setTransactionCap(address(0), 1 ether);
        wallet.setDailyLimit(address(0), 5 ether);
        vm.stopPrank();
    }

    // ═══════════════════════════════════════════════════
    //                  CONSTRUCTOR
    // ═══════════════════════════════════════════════════

    function test_constructor_setsOwnerAndOperator() public view {
        assertEq(wallet.owner(), owner);
        assertEq(wallet.operator(), operator);
    }

    function test_constructor_revertsZeroOperator() public {
        vm.expectRevert(AgentWallet.ZeroAddress.selector);
        new AgentWallet(owner, address(0));
    }

    // ═══════════════════════════════════════════════════
    //                  OWNER: setOperator
    // ═══════════════════════════════════════════════════

    function test_setOperator() public {
        address newOp = makeAddr("newOp");
        vm.prank(owner);
        wallet.setOperator(newOp);
        assertEq(wallet.operator(), newOp);
    }

    function test_setOperator_emitsEvent() public {
        address newOp = makeAddr("newOp");
        vm.expectEmit(true, true, false, false);
        emit AgentWallet.OperatorUpdated(operator, newOp);
        vm.prank(owner);
        wallet.setOperator(newOp);
    }

    function test_setOperator_revertsZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(AgentWallet.ZeroAddress.selector);
        wallet.setOperator(address(0));
    }

    function test_setOperator_revertsNonOwner() public {
        vm.prank(nobody);
        vm.expectRevert();
        wallet.setOperator(nobody);
    }

    // ═══════════════════════════════════════════════════
    //                  OWNER: allowlist
    // ═══════════════════════════════════════════════════

    function test_setAllowlisted() public {
        vm.prank(owner);
        wallet.setAllowlisted(address(dai), true);
        assertTrue(wallet.allowlisted(address(dai)));
    }

    function test_setAllowlisted_remove() public {
        vm.prank(owner);
        wallet.setAllowlisted(address(usdc), false);
        assertFalse(wallet.allowlisted(address(usdc)));
    }

    function test_setAllowlisted_emitsEvent() public {
        vm.expectEmit(true, false, false, true);
        emit AgentWallet.TokenAllowlisted(address(dai), true);
        vm.prank(owner);
        wallet.setAllowlisted(address(dai), true);
    }

    function test_setAllowlisted_revertsNonOwner() public {
        vm.prank(operator);
        vm.expectRevert();
        wallet.setAllowlisted(address(dai), true);
    }

    // ═══════════════════════════════════════════════════
    //                  OWNER: caps & limits
    // ═══════════════════════════════════════════════════

    function test_setTransactionCap() public {
        vm.prank(owner);
        wallet.setTransactionCap(address(usdc), 5_000e6);
        assertEq(wallet.transactionCap(address(usdc)), 5_000e6);
    }

    function test_setTransactionCap_emitsEvent() public {
        vm.expectEmit(true, false, false, true);
        emit AgentWallet.TransactionCapUpdated(address(usdc), 5_000e6);
        vm.prank(owner);
        wallet.setTransactionCap(address(usdc), 5_000e6);
    }

    function test_setDailyLimit() public {
        vm.prank(owner);
        wallet.setDailyLimit(address(usdc), 100_000e6);
        assertEq(wallet.dailyLimit(address(usdc)), 100_000e6);
    }

    function test_setDailyLimit_emitsEvent() public {
        vm.expectEmit(true, false, false, true);
        emit AgentWallet.DailyLimitUpdated(address(usdc), 100_000e6);
        vm.prank(owner);
        wallet.setDailyLimit(address(usdc), 100_000e6);
    }

    // ═══════════════════════════════════════════════════
    //                  OWNER: pause
    // ═══════════════════════════════════════════════════

    function test_pause_unpause() public {
        vm.startPrank(owner);
        wallet.pause();
        assertTrue(wallet.paused());
        wallet.unpause();
        assertFalse(wallet.paused());
        vm.stopPrank();
    }

    function test_pause_revertsNonOwner() public {
        vm.prank(operator);
        vm.expectRevert();
        wallet.pause();
    }

    // ═══════════════════════════════════════════════════
    //                  OPERATOR: spend ERC-20
    // ═══════════════════════════════════════════════════

    function test_spend_success() public {
        uint256 amount = 1_000e6;
        vm.prank(operator);
        wallet.spend(address(usdc), recipient, amount);
        assertEq(usdc.balanceOf(recipient), amount);
        assertEq(usdc.balanceOf(address(wallet)), INITIAL_BALANCE - amount);
    }

    function test_spend_emitsEvent() public {
        uint256 amount = 500e6;
        vm.expectEmit(true, true, false, true);
        emit AgentWallet.Spent(address(usdc), recipient, amount);
        vm.prank(operator);
        wallet.spend(address(usdc), recipient, amount);
    }

    function test_spend_revertsNotOperator() public {
        vm.prank(nobody);
        vm.expectRevert(AgentWallet.NotOperator.selector);
        wallet.spend(address(usdc), recipient, 100e6);
    }

    function test_spend_revertsOwnerNotOperator() public {
        vm.prank(owner);
        vm.expectRevert(AgentWallet.NotOperator.selector);
        wallet.spend(address(usdc), recipient, 100e6);
    }

    function test_spend_revertsTokenNotAllowed() public {
        vm.prank(operator);
        vm.expectRevert(abi.encodeWithSelector(AgentWallet.TokenNotAllowed.selector, address(dai)));
        wallet.spend(address(dai), recipient, 100e18);
    }

    function test_spend_revertsZeroAddress() public {
        vm.prank(operator);
        vm.expectRevert(AgentWallet.ZeroAddress.selector);
        wallet.spend(address(usdc), address(0), 100e6);
    }

    function test_spend_revertsZeroAmount() public {
        vm.prank(operator);
        vm.expectRevert(AgentWallet.ZeroAmount.selector);
        wallet.spend(address(usdc), recipient, 0);
    }

    function test_spend_revertsExceedsTransactionCap() public {
        uint256 amount = 10_001e6; // cap is 10_000e6
        vm.prank(operator);
        vm.expectRevert(
            abi.encodeWithSelector(AgentWallet.ExceedsTransactionCap.selector, amount, 10_000e6)
        );
        wallet.spend(address(usdc), recipient, amount);
    }

    function test_spend_revertsExceedsDailyLimit() public {
        // Spend up to the daily limit across multiple txns
        vm.startPrank(operator);
        for (uint256 i = 0; i < 5; i++) {
            wallet.spend(address(usdc), recipient, 10_000e6);
        }
        // Now daily limit (50_000e6) is exhausted
        vm.expectRevert(
            abi.encodeWithSelector(AgentWallet.ExceedsDailyLimit.selector, 1e6, 0)
        );
        wallet.spend(address(usdc), recipient, 1e6);
        vm.stopPrank();
    }

    function test_spend_revertsWhenPaused() public {
        vm.prank(owner);
        wallet.pause();

        vm.prank(operator);
        vm.expectRevert();
        wallet.spend(address(usdc), recipient, 100e6);
    }

    function test_spend_noCapIfZero() public {
        // Set cap to 0 (unlimited)
        vm.prank(owner);
        wallet.setTransactionCap(address(usdc), 0);

        vm.prank(operator);
        wallet.spend(address(usdc), recipient, 50_000e6); // exceeds old cap, should work
        assertEq(usdc.balanceOf(recipient), 50_000e6);
    }

    function test_spend_noDailyLimitIfZero() public {
        // Set daily limit to 0 (unlimited)
        vm.prank(owner);
        wallet.setDailyLimit(address(usdc), 0);

        // Set cap to 0 too so we can spend large amounts
        vm.prank(owner);
        wallet.setTransactionCap(address(usdc), 0);

        vm.prank(operator);
        wallet.spend(address(usdc), recipient, 500_000e6);
        assertEq(usdc.balanceOf(recipient), 500_000e6);
    }

    // ═══════════════════════════════════════════════════
    //                  OPERATOR: spend ETH
    // ═══════════════════════════════════════════════════

    function test_spendETH_success() public {
        uint256 amount = 0.5 ether;
        vm.prank(operator);
        wallet.spendETH(payable(recipient), amount);
        assertEq(recipient.balance, amount);
        assertEq(address(wallet).balance, ETH_BALANCE - amount);
    }

    function test_spendETH_emitsEvent() public {
        vm.expectEmit(true, true, false, true);
        emit AgentWallet.Spent(address(0), recipient, 0.5 ether);
        vm.prank(operator);
        wallet.spendETH(payable(recipient), 0.5 ether);
    }

    function test_spendETH_revertsNotOperator() public {
        vm.prank(nobody);
        vm.expectRevert(AgentWallet.NotOperator.selector);
        wallet.spendETH(payable(recipient), 0.1 ether);
    }

    function test_spendETH_revertsExceedsTransactionCap() public {
        vm.prank(operator);
        vm.expectRevert(
            abi.encodeWithSelector(AgentWallet.ExceedsTransactionCap.selector, 2 ether, 1 ether)
        );
        wallet.spendETH(payable(recipient), 2 ether);
    }

    function test_spendETH_revertsExceedsDailyLimit() public {
        vm.startPrank(operator);
        for (uint256 i = 0; i < 5; i++) {
            wallet.spendETH(payable(recipient), 1 ether);
        }
        vm.expectRevert(
            abi.encodeWithSelector(AgentWallet.ExceedsDailyLimit.selector, 0.1 ether, 0)
        );
        wallet.spendETH(payable(recipient), 0.1 ether);
        vm.stopPrank();
    }

    function test_spendETH_revertsInsufficientBalance() public {
        // Set high cap/limit so balance is the constraint
        vm.startPrank(owner);
        wallet.setTransactionCap(address(0), 0);
        wallet.setDailyLimit(address(0), 0);
        vm.stopPrank();

        vm.prank(operator);
        vm.expectRevert(
            abi.encodeWithSelector(
                AgentWallet.InsufficientBalance.selector, 100 ether, ETH_BALANCE
            )
        );
        wallet.spendETH(payable(recipient), 100 ether);
    }

    function test_spendETH_revertsZeroAddress() public {
        vm.prank(operator);
        vm.expectRevert(AgentWallet.ZeroAddress.selector);
        wallet.spendETH(payable(address(0)), 0.1 ether);
    }

    function test_spendETH_revertsZeroAmount() public {
        vm.prank(operator);
        vm.expectRevert(AgentWallet.ZeroAmount.selector);
        wallet.spendETH(payable(recipient), 0);
    }

    function test_spendETH_revertsWhenPaused() public {
        vm.prank(owner);
        wallet.pause();

        vm.prank(operator);
        vm.expectRevert();
        wallet.spendETH(payable(recipient), 0.1 ether);
    }

    function test_spendETH_revertsNotAllowed() public {
        // Remove ETH from allowlist
        vm.prank(owner);
        wallet.setAllowlisted(address(0), false);

        vm.prank(operator);
        vm.expectRevert(abi.encodeWithSelector(AgentWallet.TokenNotAllowed.selector, address(0)));
        wallet.spendETH(payable(recipient), 0.1 ether);
    }

    // ═══════════════════════════════════════════════════
    //                  DAILY LIMIT RESET
    // ═══════════════════════════════════════════════════

    function test_dailyLimit_resetsAfter24Hours() public {
        // Exhaust the daily limit
        vm.startPrank(operator);
        for (uint256 i = 0; i < 5; i++) {
            wallet.spend(address(usdc), recipient, 10_000e6);
        }
        vm.stopPrank();

        // Warp forward 1 day
        vm.warp(block.timestamp + 1 days);

        // Should be able to spend again
        vm.prank(operator);
        wallet.spend(address(usdc), recipient, 10_000e6);
        assertEq(usdc.balanceOf(recipient), 60_000e6);
    }

    function test_dailyRemaining_fullLimit() public view {
        assertEq(wallet.dailyRemaining(address(usdc)), 50_000e6);
    }

    function test_dailyRemaining_afterSpend() public {
        vm.prank(operator);
        wallet.spend(address(usdc), recipient, 5_000e6);
        assertEq(wallet.dailyRemaining(address(usdc)), 45_000e6);
    }

    function test_dailyRemaining_exhausted() public {
        vm.startPrank(operator);
        for (uint256 i = 0; i < 5; i++) {
            wallet.spend(address(usdc), recipient, 10_000e6);
        }
        vm.stopPrank();
        assertEq(wallet.dailyRemaining(address(usdc)), 0);
    }

    function test_dailyRemaining_unlimited() public view {
        // DAI has no daily limit set
        assertEq(wallet.dailyRemaining(address(dai)), type(uint256).max);
    }

    function test_dailyRemaining_resetsAfterNewDay() public {
        vm.prank(operator);
        wallet.spend(address(usdc), recipient, 10_000e6);
        assertEq(wallet.dailyRemaining(address(usdc)), 40_000e6);

        vm.warp(block.timestamp + 1 days);
        assertEq(wallet.dailyRemaining(address(usdc)), 50_000e6);
    }

    // ═══════════════════════════════════════════════════
    //              OWNER: withdraw / sweep
    // ═══════════════════════════════════════════════════

    function test_withdrawToken() public {
        vm.prank(owner);
        wallet.withdrawToken(address(usdc), recipient, 100_000e6);
        assertEq(usdc.balanceOf(recipient), 100_000e6);
    }

    function test_withdrawToken_revertsNonOwner() public {
        vm.prank(operator);
        vm.expectRevert();
        wallet.withdrawToken(address(usdc), recipient, 100e6);
    }

    function test_withdrawToken_revertsZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(AgentWallet.ZeroAddress.selector);
        wallet.withdrawToken(address(usdc), address(0), 100e6);
    }

    function test_withdrawETH() public {
        uint256 amount = 2 ether;
        vm.prank(owner);
        wallet.withdrawETH(payable(recipient), amount);
        assertEq(recipient.balance, amount);
    }

    function test_withdrawETH_emitsEvent() public {
        vm.expectEmit(true, false, false, true);
        emit AgentWallet.EthWithdrawn(recipient, 1 ether);
        vm.prank(owner);
        wallet.withdrawETH(payable(recipient), 1 ether);
    }

    function test_withdrawETH_revertsInsufficientBalance() public {
        vm.prank(owner);
        vm.expectRevert(
            abi.encodeWithSelector(
                AgentWallet.InsufficientBalance.selector, 100 ether, ETH_BALANCE
            )
        );
        wallet.withdrawETH(payable(recipient), 100 ether);
    }

    function test_withdrawETH_revertsZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(AgentWallet.ZeroAddress.selector);
        wallet.withdrawETH(payable(address(0)), 1 ether);
    }

    function test_withdrawETH_revertsNonOwner() public {
        vm.prank(operator);
        vm.expectRevert();
        wallet.withdrawETH(payable(recipient), 1 ether);
    }

    // ═══════════════════════════════════════════════════
    //                  RECEIVE ETH
    // ═══════════════════════════════════════════════════

    function test_receive_acceptsETH() public {
        vm.deal(nobody, 1 ether);
        vm.prank(nobody);
        (bool ok,) = address(wallet).call{value: 1 ether}("");
        assertTrue(ok);
        assertEq(address(wallet).balance, ETH_BALANCE + 1 ether);
    }

    function test_receive_emitsDeposited() public {
        vm.deal(nobody, 1 ether);
        vm.expectEmit(true, true, false, true);
        emit AgentWallet.Deposited(address(0), nobody, 1 ether);
        vm.prank(nobody);
        (bool ok,) = address(wallet).call{value: 1 ether}("");
        assertTrue(ok);
    }

    // ═══════════════════════════════════════════════════
    //              REENTRANCY PROTECTION
    // ═══════════════════════════════════════════════════

    function test_spendETH_reentrancyProtected() public {
        ReentrantRecipient attacker = new ReentrantRecipient(wallet);
        vm.deal(address(wallet), 10 ether);

        // Set high limits so reentrancy is the only barrier
        vm.startPrank(owner);
        wallet.setTransactionCap(address(0), 0);
        wallet.setDailyLimit(address(0), 0);
        vm.stopPrank();

        vm.prank(operator);
        // The attacker contract tries to re-enter spendETH on receive.
        // ReentrancyGuard should prevent the re-entrant call.
        wallet.spendETH(payable(address(attacker)), 1 ether);

        // Attacker should have received only 1 ether (re-entrant call reverted)
        assertEq(address(attacker).balance, 1 ether);
    }

    // ═══════════════════════════════════════════════════
    //                  FUZZ TESTS
    // ═══════════════════════════════════════════════════

    function testFuzz_spend_withinCap(uint256 amount) public {
        amount = bound(amount, 1, 10_000e6);
        vm.prank(operator);
        wallet.spend(address(usdc), recipient, amount);
        assertEq(usdc.balanceOf(recipient), amount);
    }

    function testFuzz_spend_exceedsCap(uint256 amount) public {
        amount = bound(amount, 10_001e6, type(uint128).max);
        vm.prank(operator);
        vm.expectRevert();
        wallet.spend(address(usdc), recipient, amount);
    }

    function testFuzz_spendETH_withinCap(uint256 amount) public {
        amount = bound(amount, 1, 1 ether);
        vm.prank(operator);
        wallet.spendETH(payable(recipient), amount);
        assertEq(recipient.balance, amount);
    }
}

// ═══════════════════════════════════════════════════════
//          HELPER: reentrancy attacker contract
// ═══════════════════════════════════════════════════════

contract ReentrantRecipient {
    AgentWallet private immutable _wallet;
    bool private _attacked;

    constructor(AgentWallet w) {
        _wallet = w;
    }

    receive() external payable {
        if (!_attacked) {
            _attacked = true;
            // Attempt re-entrant call — should revert with ReentrancyGuardReentrantCall
            try _wallet.spendETH(payable(address(this)), 1 ether) {} catch {}
        }
    }
}
