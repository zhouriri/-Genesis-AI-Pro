import { expect } from "chai";
import pkg from "hardhat";
const { ethers } = pkg;
import fs from "fs";
import path from "path";

describe("Genesis AI Integration Tests", function () {
  let vault: any;
  let synth: any;
  let riskManager: any;
  let usdc: any;
  let mockPyth: any;
  let owner: any;
  let user: any;
  let aiAgent: any;
  let sBTC: string;

  beforeEach(async function () {
    [owner, user, aiAgent] = await ethers.getSigners();

    // 加载已部署的合约
    const deploymentPath = path.join(__dirname, '../deployments/hardhat.json');
    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));

    mockPyth = await ethers.getContractAt("MockPyth", deploymentInfo.contracts.mockPyth);
    synth = await ethers.getContractAt("GenesisSynth", deploymentInfo.contracts.genesisSynth);
    riskManager = await ethers.getContractAt("RiskManager", deploymentInfo.contracts.riskManager);
    vault = await ethers.getContractAt("GenesisVault", deploymentInfo.contracts.genesisVault);
    usdc = await ethers.getContractAt("MockERC20", deploymentInfo.contracts.mockUSDC);

    // 获取已注册的资产地址
    sBTC = deploymentInfo.assets[0].split(": ")[1];

    // 给用户铸造测试 USDC
    await usdc.mint(user.address, ethers.parseUnits("1000", 6));
    await usdc.connect(user).approve(await vault.getAddress(), ethers.MaxUint256);
  });

  it("基础功能测试: 存款和取款", async function () {
    // 用户存款
    const depositAmount = ethers.parseUnits("100", 6);
    await vault.connect(user).deposit(depositAmount);

    // 验证 USDC 转账到合约
    const vaultBalance = await usdc.balanceOf(await vault.getAddress());
    expect(vaultBalance).to.equal(depositAmount);

    // 用户取款
    const withdrawAmount = ethers.parseUnits("50", 6);
    await vault.connect(user).withdraw(withdrawAmount);

    // 验证取款成功
    const userBalance = await usdc.balanceOf(user.address);
    expect(userBalance).to.be.closeTo(withdrawAmount, ethers.parseUnits("0.1", 6));
  });

  it("AI Agent 权限测试", async function () {
    // 验证 AI Agent 已被授权
    const isAuthorized = await vault.authorizedAI(aiAgent.address);
    expect(isAuthorized).to.be.true;

    // 验证非授权用户无法被授权
    const attacker = (await ethers.getSigners())[3];
    const isAttackerAuthorized = await vault.authorizedAI(attacker.address);
    expect(isAttackerAuthorized).to.be.false;
  });

  it("合成资产注册测试", async function () {
    // 验证 sBTC 已注册
    const sBTCAddress = await synth.getAssetBySymbol("sBTC");
    expect(sBTCAddress).to.not.equal(ethers.ZeroAddress);

    // 验证资产地址匹配
    expect(sBTCAddress.toLowerCase()).to.equal(sBTC.toLowerCase());
  });

  it("风险管理器配置测试", async function () {
    // 验证风险管理器已正确连接
    const vaultRiskManager = await vault.riskManager();
    expect(vaultRiskManager.toLowerCase()).to.equal(await riskManager.getAddress());
  });

  it("权限角色测试", async function () {
    // 验证部署者有 ADMIN_ROLE
    const ADMIN_ROLE = await vault.ADMIN_ROLE();
    const hasAdminRole = await vault.hasRole(ADMIN_ROLE, owner.address);
    expect(hasAdminRole).to.be.true;

    // 验证 AI Agent 没有 ADMIN_ROLE
    const hasAIRole = await vault.hasRole(ADMIN_ROLE, aiAgent.address);
    expect(hasAIRole).to.be.false;
  });

  it("合约关联完整性测试", async function () {
    // 验证 Synth 合约的 Vault 地址设置
    const synthVault = await synth.vault();
    expect(synthVault.toLowerCase()).to.equal(await vault.getAddress());
  });

  it("Mock Pyth 预言机测试", async function () {
    // 设置测试价格
    const priceId = ethers.encodeBytes32String("BTC/USD");
    await mockPyth.setPrice(priceId, 67542000000, 1000000);

    // 读取价格
    const price = await mockPyth.getPrice(priceId);
    expect(price[0]).to.equal(67542000000); // int64 price
    expect(price[1]).to.equal(1000000); // uint64 confidence
  });
});
