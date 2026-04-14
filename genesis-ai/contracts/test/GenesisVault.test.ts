import { expect } from "chai";
import pkg from "hardhat";
const { ethers } = pkg;

describe("GenesisVault", function () {
  let vault: any;
  let usdc: any;
  let synth: any;
  let pyth: any;
  let owner: any;
  let user: any;
  let aiAgent: any;

  beforeEach(async function () {
    [owner, user, aiAgent] = await ethers.getSigners();

    // 部署 Mock USDC
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    usdc = await MockERC20.deploy("USD Coin", "USDC", 6);
    await usdc.waitForDeployment();

    // 部署 Mock Pyth
    const MockPyth = await ethers.getContractFactory("MockPyth");
    pyth = await MockPyth.deploy();
    await pyth.waitForDeployment();

    // 部署 GenesisSynth
    const GenesisSynth = await ethers.getContractFactory("GenesisSynth");
    synth = await GenesisSynth.deploy(await pyth.getAddress());
    await synth.waitForDeployment();

    // 注册测试资产
    await synth.registerAsset(
      ethers.encodeBytes32String("BTC/USD"),
      "Synthetic Bitcoin",
      "sBTC",
      ethers.parseUnits("1000000", 18)
    );

    // 部署 RiskManager
    const RiskManager = await ethers.getContractFactory("RiskManager");
    const riskManager = await RiskManager.deploy(
      await synth.getAddress(),
      await synth.getAddress()
    );
    await riskManager.waitForDeployment();

    // 部署 GenesisVault
    const GenesisVault = await ethers.getContractFactory("GenesisVault");
    vault = await GenesisVault.deploy(
      await usdc.getAddress(),
      await synth.getAddress(),
      await riskManager.getAddress()
    );
    await vault.waitForDeployment();

    // 配置权限
    await synth.setVault(await vault.getAddress());
    await vault.authorizeAI(aiAgent.address);

    // 给用户铸造测试 USDC
    await usdc.mint(user.address, ethers.parseUnits("1000", 6));
    await usdc.connect(user).approve(await vault.getAddress(), ethers.MaxUint256);
  });

  it("should deposit minimum amount", async function () {
    const amount = ethers.parseUnits("10", 6);
    await vault.connect(user).deposit(amount);
    
    const userInfo = await vault.users(user.address);
    expect(userInfo.totalDeposited).to.equal(amount);
  });

  it("should reject below minimum deposit", async function () {
    const amount = ethers.parseUnits("5", 6);
    await expect(vault.connect(user).deposit(amount)).to.be.reverted;
  });

  it("should allow withdrawal", async function () {
    const depositAmount = ethers.parseUnits("100", 6);
    const withdrawAmount = ethers.parseUnits("50", 6);
    
    await vault.connect(user).deposit(depositAmount);
    await vault.connect(user).withdraw(withdrawAmount);
    
    const userInfo = await vault.users(user.address);
    expect(userInfo.totalWithdrawn).to.be.closeTo(withdrawAmount, ethers.parseUnits("0.1", 6));
  });

  it("should authorize AI agent", async function () {
    const newAgent = (await ethers.getSigners())[3];
    await vault.authorizeAI(newAgent.address);
    expect(await vault.authorizedAI(newAgent.address)).to.be.true;
  });

  it("should revoke AI agent", async function () {
    await vault.revokeAIAccess(aiAgent.address);
    expect(await vault.authorizedAI(aiAgent.address)).to.be.false;
  });

  it("should reject unauthorized AI operations", async function () {
    const attacker = (await ethers.getSigners())[4];
    const sBTCAddress = await synth.getAssetBySymbol("sBTC");
    
    await expect(
      vault.connect(attacker).openPosition(
        user.address,
        sBTCAddress,
        ethers.parseUnits("100", 6),
        ethers.parseUnits("1", 18),
        2,
        true
      )
    ).to.be.reverted;
  });
});
