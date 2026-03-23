import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { AgentWallet } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("AgentWallet", function () {
  let wallet: AgentWallet;
  let usdc: any;
  let dai: any;
  let owner: HardhatEthersSigner;
  let agent: HardhatEthersSigner;
  let recipient: HardhatEthersSigner;
  let nobody: HardhatEthersSigner;

  const USDC_DECIMALS = 6;
  const DAI_DECIMALS = 18;
  const INITIAL_USDC = ethers.parseUnits("100000", USDC_DECIMALS);
  const INITIAL_DAI = ethers.parseUnits("100000", DAI_DECIMALS);
  const ETH_ADDRESS = ethers.ZeroAddress;

  const TX_CAP_USDC = ethers.parseUnits("10000", USDC_DECIMALS);
  const DAILY_LIMIT_USDC = ethers.parseUnits("50000", USDC_DECIMALS);
  const TX_CAP_ETH = ethers.parseEther("1");
  const DAILY_LIMIT_ETH = ethers.parseEther("5");

  // Deploy a minimal ERC-20 for testing
  async function deployMockERC20(name: string, symbol: string, decimals: number) {
    const factory = await ethers.getContractFactory("MockERC20");
    const token = await factory.deploy(name, symbol, decimals);
    return token;
  }

  beforeEach(async function () {
    [owner, agent, recipient, nobody] = await ethers.getSigners();

    // Deploy mock tokens
    usdc = await deployMockERC20("USD Coin", "USDC", USDC_DECIMALS);
    dai = await deployMockERC20("Dai", "DAI", DAI_DECIMALS);

    // Deploy wallet
    const WalletFactory = await ethers.getContractFactory("AgentWallet");
    wallet = await WalletFactory.deploy(owner.address, agent.address);

    // Fund wallet with tokens
    await usdc.mint(await wallet.getAddress(), INITIAL_USDC);
    await dai.mint(await wallet.getAddress(), INITIAL_DAI);

    // Fund wallet with ETH
    await owner.sendTransaction({
      to: await wallet.getAddress(),
      value: ethers.parseEther("10"),
    });

    // Owner configures allowlist and limits
    await wallet.connect(owner).setAllowlisted(await usdc.getAddress(), true);
    await wallet.connect(owner).setAllowlisted(await dai.getAddress(), true);
    await wallet.connect(owner).setAllowlisted(ETH_ADDRESS, true);
    await wallet.connect(owner).setTransactionCap(await usdc.getAddress(), TX_CAP_USDC);
    await wallet.connect(owner).setDailyLimit(await usdc.getAddress(), DAILY_LIMIT_USDC);
    await wallet.connect(owner).setTransactionCap(ETH_ADDRESS, TX_CAP_ETH);
    await wallet.connect(owner).setDailyLimit(ETH_ADDRESS, DAILY_LIMIT_ETH);
  });

  // ═══════════════════ Constructor ═══════════════════

  describe("Constructor", function () {
    it("sets owner and operator", async function () {
      expect(await wallet.owner()).to.equal(owner.address);
      expect(await wallet.operator()).to.equal(agent.address);
    });

    it("reverts on zero operator", async function () {
      const WalletFactory = await ethers.getContractFactory("AgentWallet");
      await expect(
        WalletFactory.deploy(owner.address, ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(wallet, "ZeroAddress");
    });
  });

  // ═══════════════════ Receive ETH ═══════════════════

  describe("Receive ETH", function () {
    it("emits Deposited on ETH receive", async function () {
      await expect(
        nobody.sendTransaction({
          to: await wallet.getAddress(),
          value: ethers.parseEther("1"),
        })
      )
        .to.emit(wallet, "Deposited")
        .withArgs(ETH_ADDRESS, nobody.address, ethers.parseEther("1"));
    });
  });

  // ═══════════════════ Owner: setOperator ═══════════════════

  describe("setOperator", function () {
    it("updates operator", async function () {
      await wallet.connect(owner).setOperator(nobody.address);
      expect(await wallet.operator()).to.equal(nobody.address);
    });

    it("emits OperatorUpdated", async function () {
      await expect(wallet.connect(owner).setOperator(nobody.address))
        .to.emit(wallet, "OperatorUpdated")
        .withArgs(agent.address, nobody.address);
    });

    it("reverts on zero address", async function () {
      await expect(
        wallet.connect(owner).setOperator(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(wallet, "ZeroAddress");
    });

    it("reverts for non-owner", async function () {
      await expect(wallet.connect(nobody).setOperator(nobody.address)).to.be.reverted;
    });
  });

  // ═══════════════════ Owner: Allowlist ═══════════════════

  describe("setAllowlisted", function () {
    it("adds token to allowlist", async function () {
      const addr = nobody.address; // arbitrary address as token
      await wallet.connect(owner).setAllowlisted(addr, true);
      expect(await wallet.allowlisted(addr)).to.be.true;
    });

    it("removes token from allowlist", async function () {
      await wallet.connect(owner).setAllowlisted(await usdc.getAddress(), false);
      expect(await wallet.allowlisted(await usdc.getAddress())).to.be.false;
    });

    it("emits TokenAllowlisted", async function () {
      await expect(wallet.connect(owner).setAllowlisted(nobody.address, true))
        .to.emit(wallet, "TokenAllowlisted")
        .withArgs(nobody.address, true);
    });

    it("reverts for non-owner", async function () {
      await expect(
        wallet.connect(nobody).setAllowlisted(await usdc.getAddress(), true)
      ).to.be.reverted;
    });
  });

  // ═══════════════════ Owner: Caps & Limits ═══════════════════

  describe("setTransactionCap", function () {
    it("sets cap", async function () {
      await wallet.connect(owner).setTransactionCap(await usdc.getAddress(), 5000n);
      expect(await wallet.transactionCap(await usdc.getAddress())).to.equal(5000n);
    });

    it("emits TransactionCapUpdated", async function () {
      await expect(
        wallet.connect(owner).setTransactionCap(await usdc.getAddress(), 5000n)
      )
        .to.emit(wallet, "TransactionCapUpdated")
        .withArgs(await usdc.getAddress(), 5000n);
    });
  });

  describe("setDailyLimit", function () {
    it("sets limit", async function () {
      await wallet.connect(owner).setDailyLimit(await usdc.getAddress(), 25000n);
      expect(await wallet.dailyLimit(await usdc.getAddress())).to.equal(25000n);
    });

    it("emits DailyLimitUpdated", async function () {
      await expect(
        wallet.connect(owner).setDailyLimit(await usdc.getAddress(), 25000n)
      )
        .to.emit(wallet, "DailyLimitUpdated")
        .withArgs(await usdc.getAddress(), 25000n);
    });
  });

  // ═══════════════════ Owner: Pause ═══════════════════

  describe("Pause", function () {
    it("pauses and unpauses", async function () {
      await wallet.connect(owner).pause();
      expect(await wallet.paused()).to.be.true;

      await wallet.connect(owner).unpause();
      expect(await wallet.paused()).to.be.false;
    });

    it("reverts pause for non-owner", async function () {
      await expect(wallet.connect(nobody).pause()).to.be.reverted;
    });

    it("reverts unpause for non-owner", async function () {
      await wallet.connect(owner).pause();
      await expect(wallet.connect(nobody).unpause()).to.be.reverted;
    });
  });

  // ═══════════════════ Owner: Withdraw ═══════════════════

  describe("Owner withdrawals", function () {
    it("withdraws ERC-20 tokens", async function () {
      const amount = ethers.parseUnits("1000", USDC_DECIMALS);
      await wallet.connect(owner).withdrawToken(await usdc.getAddress(), recipient.address, amount);
      expect(await usdc.balanceOf(recipient.address)).to.equal(amount);
    });

    it("withdrawToken reverts for non-owner", async function () {
      await expect(
        wallet.connect(nobody).withdrawToken(await usdc.getAddress(), nobody.address, 100n)
      ).to.be.reverted;
    });

    it("withdraws ETH", async function () {
      const before = await ethers.provider.getBalance(recipient.address);
      await wallet.connect(owner).withdrawETH(recipient.address, ethers.parseEther("2"));
      const after = await ethers.provider.getBalance(recipient.address);
      expect(after - before).to.equal(ethers.parseEther("2"));
    });

    it("withdrawETH reverts on insufficient balance", async function () {
      await expect(
        wallet.connect(owner).withdrawETH(recipient.address, ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(wallet, "InsufficientBalance");
    });

    it("withdrawETH reverts on zero address", async function () {
      await expect(
        wallet.connect(owner).withdrawETH(ethers.ZeroAddress, ethers.parseEther("1"))
      ).to.be.revertedWithCustomError(wallet, "ZeroAddress");
    });

    it("withdrawToken reverts on zero address", async function () {
      await expect(
        wallet.connect(owner).withdrawToken(await usdc.getAddress(), ethers.ZeroAddress, 100n)
      ).to.be.revertedWithCustomError(wallet, "ZeroAddress");
    });
  });

  // ═══════════════════ Operator: spend (ERC-20) ═══════════════════

  describe("spend (ERC-20)", function () {
    it("transfers tokens", async function () {
      const amount = ethers.parseUnits("5000", USDC_DECIMALS);
      await wallet.connect(agent).spend(await usdc.getAddress(), recipient.address, amount);
      expect(await usdc.balanceOf(recipient.address)).to.equal(amount);
    });

    it("emits Spent event", async function () {
      const amount = ethers.parseUnits("1000", USDC_DECIMALS);
      await expect(
        wallet.connect(agent).spend(await usdc.getAddress(), recipient.address, amount)
      )
        .to.emit(wallet, "Spent")
        .withArgs(await usdc.getAddress(), recipient.address, amount);
    });

    it("reverts for non-operator", async function () {
      await expect(
        wallet.connect(nobody).spend(await usdc.getAddress(), recipient.address, 100n)
      ).to.be.revertedWithCustomError(wallet, "NotOperator");
    });

    it("reverts when paused", async function () {
      await wallet.connect(owner).pause();
      await expect(
        wallet.connect(agent).spend(await usdc.getAddress(), recipient.address, 100n)
      ).to.be.reverted;
    });

    it("reverts for non-allowlisted token", async function () {
      await expect(
        wallet.connect(agent).spend(nobody.address, recipient.address, 100n)
      ).to.be.revertedWithCustomError(wallet, "TokenNotAllowed");
    });

    it("reverts on zero recipient", async function () {
      await expect(
        wallet.connect(agent).spend(await usdc.getAddress(), ethers.ZeroAddress, 100n)
      ).to.be.revertedWithCustomError(wallet, "ZeroAddress");
    });

    it("reverts on zero amount", async function () {
      await expect(
        wallet.connect(agent).spend(await usdc.getAddress(), recipient.address, 0n)
      ).to.be.revertedWithCustomError(wallet, "ZeroAmount");
    });

    it("reverts when exceeding transaction cap", async function () {
      const amount = ethers.parseUnits("15000", USDC_DECIMALS);
      await expect(
        wallet.connect(agent).spend(await usdc.getAddress(), recipient.address, amount)
      ).to.be.revertedWithCustomError(wallet, "ExceedsTransactionCap");
    });

    it("reverts when exceeding daily limit", async function () {
      const amount = TX_CAP_USDC; // 10k per tx, 50k daily limit
      for (let i = 0; i < 5; i++) {
        await wallet.connect(agent).spend(await usdc.getAddress(), recipient.address, amount);
      }
      // Now at 50k, next should fail
      await expect(
        wallet
          .connect(agent)
          .spend(
            await usdc.getAddress(),
            recipient.address,
            ethers.parseUnits("1000", USDC_DECIMALS)
          )
      ).to.be.revertedWithCustomError(wallet, "ExceedsDailyLimit");
    });

    it("daily limit resets after 1 day", async function () {
      const amount = TX_CAP_USDC;
      for (let i = 0; i < 5; i++) {
        await wallet.connect(agent).spend(await usdc.getAddress(), recipient.address, amount);
      }

      // Advance 1 day
      await time.increase(86400);

      // Should work again
      await wallet
        .connect(agent)
        .spend(
          await usdc.getAddress(),
          recipient.address,
          ethers.parseUnits("5000", USDC_DECIMALS)
        );
      expect(await usdc.balanceOf(recipient.address)).to.equal(
        ethers.parseUnits("55000", USDC_DECIMALS)
      );
    });

    it("no cap / no limit allows unlimited spend", async function () {
      // DAI has no cap or limit set
      const amount = ethers.parseUnits("50000", DAI_DECIMALS);
      await wallet.connect(agent).spend(await dai.getAddress(), recipient.address, amount);
      expect(await dai.balanceOf(recipient.address)).to.equal(amount);
    });
  });

  // ═══════════════════ Operator: spendETH ═══════════════════

  describe("spendETH", function () {
    it("transfers ETH", async function () {
      const before = await ethers.provider.getBalance(recipient.address);
      await wallet.connect(agent).spendETH(recipient.address, ethers.parseEther("0.5"));
      const after = await ethers.provider.getBalance(recipient.address);
      expect(after - before).to.equal(ethers.parseEther("0.5"));
    });

    it("emits Spent event", async function () {
      await expect(
        wallet.connect(agent).spendETH(recipient.address, ethers.parseEther("0.5"))
      )
        .to.emit(wallet, "Spent")
        .withArgs(ETH_ADDRESS, recipient.address, ethers.parseEther("0.5"));
    });

    it("reverts when exceeding transaction cap", async function () {
      await expect(
        wallet.connect(agent).spendETH(recipient.address, ethers.parseEther("2"))
      ).to.be.revertedWithCustomError(wallet, "ExceedsTransactionCap");
    });

    it("reverts when exceeding daily limit", async function () {
      for (let i = 0; i < 5; i++) {
        await wallet.connect(agent).spendETH(recipient.address, ethers.parseEther("1"));
      }
      await expect(
        wallet.connect(agent).spendETH(recipient.address, ethers.parseEther("0.5"))
      ).to.be.revertedWithCustomError(wallet, "ExceedsDailyLimit");
    });

    it("reverts on insufficient balance", async function () {
      await wallet.connect(owner).setTransactionCap(ETH_ADDRESS, ethers.parseEther("100"));
      await wallet.connect(owner).setDailyLimit(ETH_ADDRESS, ethers.parseEther("100"));
      await expect(
        wallet.connect(agent).spendETH(recipient.address, ethers.parseEther("50"))
      ).to.be.revertedWithCustomError(wallet, "InsufficientBalance");
    });

    it("reverts for non-operator", async function () {
      await expect(
        wallet.connect(nobody).spendETH(recipient.address, ethers.parseEther("0.1"))
      ).to.be.revertedWithCustomError(wallet, "NotOperator");
    });

    it("reverts when paused", async function () {
      await wallet.connect(owner).pause();
      await expect(
        wallet.connect(agent).spendETH(recipient.address, ethers.parseEther("0.1"))
      ).to.be.reverted;
    });

    it("reverts when ETH not allowlisted", async function () {
      await wallet.connect(owner).setAllowlisted(ETH_ADDRESS, false);
      await expect(
        wallet.connect(agent).spendETH(recipient.address, ethers.parseEther("0.1"))
      ).to.be.revertedWithCustomError(wallet, "TokenNotAllowed");
    });
  });

  // ═══════════════════ Daily Remaining View ═══════════════════

  describe("dailyRemaining", function () {
    it("returns full limit initially", async function () {
      expect(await wallet.dailyRemaining(await usdc.getAddress())).to.equal(DAILY_LIMIT_USDC);
    });

    it("decreases after spending", async function () {
      await wallet
        .connect(agent)
        .spend(
          await usdc.getAddress(),
          recipient.address,
          ethers.parseUnits("10000", USDC_DECIMALS)
        );
      expect(await wallet.dailyRemaining(await usdc.getAddress())).to.equal(
        ethers.parseUnits("40000", USDC_DECIMALS)
      );
    });

    it("returns max uint256 when no limit set", async function () {
      expect(await wallet.dailyRemaining(await dai.getAddress())).to.equal(ethers.MaxUint256);
    });

    it("resets after 1 day", async function () {
      await wallet
        .connect(agent)
        .spend(
          await usdc.getAddress(),
          recipient.address,
          ethers.parseUnits("10000", USDC_DECIMALS)
        );
      await time.increase(86400);
      expect(await wallet.dailyRemaining(await usdc.getAddress())).to.equal(DAILY_LIMIT_USDC);
    });
  });

  // ═══════════════════ Access Control Matrix ═══════════════════

  describe("Access control matrix", function () {
    it("owner cannot spend", async function () {
      await expect(
        wallet.connect(owner).spend(await usdc.getAddress(), recipient.address, 100n)
      ).to.be.revertedWithCustomError(wallet, "NotOperator");
    });

    it("operator cannot pause", async function () {
      await expect(wallet.connect(agent).pause()).to.be.reverted;
    });

    it("operator cannot set allowlist", async function () {
      await expect(
        wallet.connect(agent).setAllowlisted(await usdc.getAddress(), false)
      ).to.be.reverted;
    });

    it("operator cannot set transaction cap", async function () {
      await expect(
        wallet.connect(agent).setTransactionCap(await usdc.getAddress(), 0n)
      ).to.be.reverted;
    });

    it("operator cannot set daily limit", async function () {
      await expect(
        wallet.connect(agent).setDailyLimit(await usdc.getAddress(), 0n)
      ).to.be.reverted;
    });

    it("operator cannot withdraw tokens", async function () {
      await expect(
        wallet.connect(agent).withdrawToken(await usdc.getAddress(), agent.address, 100n)
      ).to.be.reverted;
    });

    it("operator cannot withdraw ETH", async function () {
      await expect(
        wallet.connect(agent).withdrawETH(agent.address, ethers.parseEther("1"))
      ).to.be.reverted;
    });
  });
});
