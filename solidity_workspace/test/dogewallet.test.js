const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("IdentityRegistry", function () {
  async function deployRegistryFixture() {
    const [a, b, c] = await ethers.getSigners();
    const Registry = await ethers.getContractFactory("IdentityRegistry");
    const registry = await Registry.deploy();
    await registry.waitForDeployment();
    return { registry, a, b, c };
  }

  it("1. registers a valid name; resolve and nameOf return correctly; event emitted", async function () {
    const { registry, a } = await loadFixture(deployRegistryFixture);
    const name = "much-wow42";
    const hash = ethers.keccak256(ethers.toUtf8Bytes(name));
    await expect(registry.connect(a).register(name))
      .to.emit(registry, "NameRegistered")
      .withArgs(a.address, hash, name);
    expect(await registry.resolve(name)).to.equal(a.address);
    expect(await registry.nameOf(a.address)).to.equal(name);
    expect(await registry.totalRegistered()).to.equal(1n);
  });

  it("2. rejects duplicate name from a second wallet (NameTaken)", async function () {
    const { registry, a, b } = await loadFixture(deployRegistryFixture);
    await registry.connect(a).register("shibe");
    await expect(registry.connect(b).register("shibe")).to.be.revertedWithCustomError(registry, "NameTaken");
  });

  it("3. rejects a second registration from same wallet (AlreadyRegistered)", async function () {
    const { registry, a } = await loadFixture(deployRegistryFixture);
    await registry.connect(a).register("shibe");
    await expect(registry.connect(a).register("doge")).to.be.revertedWithCustomError(registry, "AlreadyRegistered");
  });

  it("4. rejects invalid names (InvalidName)", async function () {
    const { registry, a } = await loadFixture(deployRegistryFixture);
    const bad = ["Doge", "ab", "-doge", "doge-", "do--ge", "doge!", "doge_1", "a".repeat(21)];
    for (const n of bad) {
      expect(await registry.isValidName(n)).to.equal(false);
      await expect(registry.connect(a).register(n)).to.be.revertedWithCustomError(registry, "InvalidName");
    }
    expect(await registry.isValidName("abc")).to.equal(true);
    expect(await registry.isValidName("a-b-c-123")).to.equal(true);
    expect(await registry.isValidName("a".repeat(20))).to.equal(true);
  });

  it("5. isAvailable reflects state; resolve of unknown name returns zero address", async function () {
    const { registry, a } = await loadFixture(deployRegistryFixture);
    expect(await registry.isAvailable("wowdoge")).to.equal(true);
    expect(await registry.isAvailable("WowDoge")).to.equal(false);
    expect(await registry.resolve("wowdoge")).to.equal(ethers.ZeroAddress);
    expect(await registry.nameOf(a.address)).to.equal("");
    await registry.connect(a).register("wowdoge");
    expect(await registry.isAvailable("wowdoge")).to.equal(false);
  });

  it("6. registration only binds msg.sender", async function () {
    const { registry, a, b } = await loadFixture(deployRegistryFixture);
    await registry.connect(b).register("bobdoge");
    expect(await registry.resolve("bobdoge")).to.equal(b.address);
    expect(await registry.nameOf(a.address)).to.equal("");
    expect(await registry.nameOf(b.address)).to.equal("bobdoge");
  });
});

describe("SavingsVault", function () {
  const ONE = ethers.parseEther("1");

  async function deployVaultFixture() {
    const [owner, other] = await ethers.getSigners();
    const Vault = await ethers.getContractFactory("SavingsVault");
    const vault = await Vault.deploy();
    await vault.waitForDeployment();
    return { vault, owner, other };
  }

  async function vaultWithGoalFixture() {
    const base = await deployVaultFixture();
    await base.vault.connect(base.owner).createGoalAndDeposit("Moon Fund", ONE * 10n, { value: ONE * 2n });
    return base;
  }

  it("7. createGoalAndDeposit credits exact msg.value; totalHeld and contract balance match", async function () {
    const { vault, owner } = await loadFixture(deployVaultFixture);
    const amt = ONE * 3n;
    await expect(vault.connect(owner).createGoalAndDeposit("Rocket", ONE * 100n, { value: amt }))
      .to.emit(vault, "GoalCreated")
      .withArgs(0n, owner.address, "Rocket", ONE * 100n)
      .and.to.emit(vault, "Deposited")
      .withArgs(0n, owner.address, amt, amt);
    const g = await vault.getGoal(0);
    expect(g.owner).to.equal(owner.address);
    expect(g.balance).to.equal(amt);
    expect(g.totalDeposited).to.equal(amt);
    expect(await vault.totalHeld()).to.equal(amt);
    expect(await ethers.provider.getBalance(await vault.getAddress())).to.equal(amt);
    expect(await vault.goalCount()).to.equal(1n);
    expect(await vault.goalsOf(owner.address)).to.deep.equal([0n]);
    const [goals, ids] = await vault.getGoalsOf(owner.address);
    expect(goals.length).to.equal(1);
    expect(ids[0]).to.equal(0n);
  });

  it("8. deposit accounting accumulates correctly", async function () {
    const { vault, owner } = await loadFixture(vaultWithGoalFixture);
    await expect(vault.connect(owner).deposit(0, { value: ONE }))
      .to.emit(vault, "Deposited")
      .withArgs(0n, owner.address, ONE, ONE * 3n);
    await vault.connect(owner).deposit(0, { value: ONE / 2n });
    const g = await vault.getGoal(0);
    const expected = ONE * 2n + ONE + ONE / 2n;
    expect(g.balance).to.equal(expected);
    expect(g.totalDeposited).to.equal(expected);
    expect(await vault.totalHeld()).to.equal(expected);
    await expect(vault.connect(owner).deposit(0, { value: 0 })).to.be.revertedWithCustomError(vault, "ZeroAmount");
  });

  it("9. owner withdraws successfully and receives DOGE", async function () {
    const { vault, owner } = await loadFixture(vaultWithGoalFixture);
    const before = await ethers.provider.getBalance(owner.address);
    const tx = await vault.connect(owner).withdraw(0, ONE);
    const rc = await tx.wait();
    const gas = rc.gasUsed * rc.gasPrice;
    const after = await ethers.provider.getBalance(owner.address);
    expect(after).to.equal(before + ONE - gas);
    expect(after).to.be.gte(before + ONE - gas * 2n);
    await expect(tx).to.emit(vault, "Withdrawn").withArgs(0n, owner.address, ONE, ONE);
    const g = await vault.getGoal(0);
    expect(g.balance).to.equal(ONE);
    expect(g.totalWithdrawn).to.equal(ONE);
    expect(await vault.totalHeld()).to.equal(ONE);
    expect(await ethers.provider.getBalance(await vault.getAddress())).to.equal(ONE);
  });

  it("10. non-owner withdraw reverts NotGoalOwner", async function () {
    const { vault, other } = await loadFixture(vaultWithGoalFixture);
    await expect(vault.connect(other).withdraw(0, ONE)).to.be.revertedWithCustomError(vault, "NotGoalOwner");
  });

  it("11. over-withdrawal reverts InsufficientBalance", async function () {
    const { vault, owner } = await loadFixture(vaultWithGoalFixture);
    await expect(vault.connect(owner).withdraw(0, ONE * 3n)).to.be.revertedWithCustomError(vault, "InsufficientBalance");
  });

  it("12. non-owner deposit reverts NotGoalOwner", async function () {
    const { vault, other } = await loadFixture(vaultWithGoalFixture);
    await expect(vault.connect(other).deposit(0, { value: ONE })).to.be.revertedWithCustomError(vault, "NotGoalOwner");
  });

  it("13. direct DOGE transfer to vault reverts", async function () {
    const { vault, owner } = await loadFixture(deployVaultFixture);
    const addr = await vault.getAddress();
    await expect(owner.sendTransaction({ to: addr, value: ONE })).to.be.revertedWithCustomError(vault, "DirectTransferNotAllowed");
    await expect(owner.sendTransaction({ to: addr, value: ONE, data: "0x12345678" })).to.be.revertedWithCustomError(vault, "DirectTransferNotAllowed");
  });

  it("14. closeGoal refunds remaining balance and blocks further deposits", async function () {
    const { vault, owner } = await loadFixture(vaultWithGoalFixture);
    const before = await ethers.provider.getBalance(owner.address);
    const tx = await vault.connect(owner).closeGoal(0);
    const rc = await tx.wait();
    const gas = rc.gasUsed * rc.gasPrice;
    await expect(tx).to.emit(vault, "GoalClosed").withArgs(0n, owner.address, ONE * 2n);
    expect(await ethers.provider.getBalance(owner.address)).to.equal(before + ONE * 2n - gas);
    const g = await vault.getGoal(0);
    expect(g.closed).to.equal(true);
    expect(g.balance).to.equal(0n);
    expect(await vault.totalHeld()).to.equal(0n);
    expect(await ethers.provider.getBalance(await vault.getAddress())).to.equal(0n);
    await expect(vault.connect(owner).deposit(0, { value: ONE })).to.be.revertedWithCustomError(vault, "GoalClosedError");
  });
});
