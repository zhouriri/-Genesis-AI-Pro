import { ethers } from "hardhat";
import dotenv from "dotenv";

dotenv.config();

/**
 * Genesis AI 智能合约部署脚本
 * 部署顺序：GenesisSynth -> RiskManager -> GenesisVault -> AIPermission
 */
async function main() {
  console.log("=====================================");
  console.log("🚀 Genesis AI 合约部署开始");
  console.log("=====================================");

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log("\n📋 部署信息:");
  console.log(`   部署地址: ${deployer.address}`);
  console.log(`   链名称: ${network.name}`);
  console.log(`   Chain ID: ${network.chainId}`);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`   余额: ${ethers.formatEther(balance)} ETH\n`);

  // ========================================
  // 1. 部署 GenesisSynth 合成资产合约
  // ========================================
  console.log("📦 [1/4] 部署 GenesisSynth 合成资产合约...");
  const GenesisSynth = await ethers.getContractFactory("GenesisSynth");
  
  // 直接使用地址字符串，ethers 会自动处理
  const pythAddress = process.env.PYTH_ADDRESS || "0x4305FB66699C3B2702D4d05CF36551390A4c6936";
  
  const synth = await GenesisSynth.deploy(pythAddress);
  await synth.waitForDeployment();
  const synthAddress = await synth.getAddress();
  
  console.log(`   ✅ GenesisSynth 已部署: ${synthAddress}`);

  // ========================================
  // 2. 部署 RiskManager 风险管理合约
  // ========================================
  console.log("\n📦 [2/4] 部署 RiskManager 风险管理合约...");
  const RiskManager = await ethers.getContractFactory("RiskManager");
  
  const riskManager = await RiskManager.deploy(synthAddress, synthAddress);
  await riskManager.waitForDeployment();
  const riskManagerAddress = await riskManager.getAddress();
  
  console.log(`   ✅ RiskManager 已部署: ${riskManagerAddress}`);

  // ========================================
  // 3. 部署 GenesisVault 资金库合约
  // ========================================
  console.log("\n📦 [3/4] 部署 GenesisVault 资金库合约...");
  const GenesisVault = await ethers.getContractFactory("GenesisVault");
  
  const usdcAddress = process.env.USDC_ADDRESS || "0xA8CE8aee21bC2A48a5EF670afCc927bC7bAd2E65";
  
  const vault = await GenesisVault.deploy(usdcAddress, synthAddress, riskManagerAddress);
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  
  console.log(`   ✅ GenesisVault 已部署: ${vaultAddress}`);

  // ========================================
  // 4. 部署 AIPermission AI授权管理合约
  // ========================================
  console.log("\n📦 [4/4] 部署 AIPermission AI授权管理合约...");
  const AIPermission = await ethers.getContractFactory("AIPermission");
  
  const aiPermission = await AIPermission.deploy();
  await aiPermission.waitForDeployment();
  const aiPermissionAddress = await aiPermission.getAddress();
  
  console.log(`   ✅ AIPermission 已部署: ${aiPermissionAddress}`);

  // ========================================
  // 5. 配置合约权限和关联
  // ========================================
  console.log("\n⚙️  配置合约关联和权限...");

  // 设置 Vault 地址到 Synth 合约（授权铸造/销毁）
  console.log("   ⤵️  授权 Vault 在 Synth 合约的铸造/销毁权限...");
  const setVaultTx = await synth.setVault(vaultAddress);
  await setVaultTx.wait();
  console.log("   ✅ Vault 权限已设置");

  // 授权 AI Agent 在 Vault 合约
  console.log("   ⤵️  授权 AI Agent 在 Vault 合约...");
  const aiAgentAddress = process.env.AI_AGENT_ADDRESS || deployer.address;
  const authorizeAITx = await vault.authorizeAI(aiAgentAddress);
  await authorizeAITx.wait();
  console.log(`   ✅ AI Agent ${aiAgentAddress} 已授权`);

  // ========================================
  // 6. 注册合成资产
  // ========================================
  console.log("\n📊 注册合成资产...");

  // Pyth Price Feed IDs (主要资产)
  const assets = [
    {
      name: "Synthetic Bitcoin",
      symbol: "sBTC",
      priceFeedId: "0xe6df13221efc3f3e9faa75728f8b382503f7ca11e6521c83989a70be8c448231",
      maxSupply: ethers.parseEther("1000000")
    },
    {
      name: "Synthetic Ethereum",
      symbol: "sETH",
      priceFeedId: "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d6c4809fc42103f7aa",
      maxSupply: ethers.parseEther("5000000")
    },
    {
      name: "Synthetic Gold",
      symbol: "sXAU",
      priceFeedId: "0x33231c8c9da86258a2fbc4c7259e5f404f2a23b7fb588b70dd35ed8c870d6c4",
      maxSupply: ethers.parseEther("1000000")
    },
    {
      name: "Synthetic Tesla",
      symbol: "sTSLA",
      priceFeedId: "0x5c841b7db30f2a793beeb418a178cfb89bce3a481f2ef28df7595d9095c5b034",
      maxSupply: ethers.parseEther("1000000")
    },
    {
      name: "Synthetic Apple",
      symbol: "sAAPL",
      priceFeedId: "0x24b81dba8f5af9e9b7d6b22d7373139742e9ba7497dc0e5573c9fa276497087d",
      maxSupply: ethers.parseEther("1000000")
    }
  ];

  const registeredAssets: string[] = [];

  for (const asset of assets) {
    console.log(`   ⤵️  注册 ${asset.symbol} (${asset.name})...`);
    try {
      const tx = await synth.registerAsset(
        asset.priceFeedId,
        asset.name,
        asset.symbol,
        asset.maxSupply
      );
      await tx.wait();
      const assetAddress = await synth.getAssetBySymbol(asset.symbol);
      registeredAssets.push(`${asset.symbol}: ${assetAddress}`);
      console.log(`   ✅ ${asset.symbol} 已注册: ${assetAddress}`);
    } catch (error) {
      console.log(`   ❌ ${asset.symbol} 注册失败: ${(error as Error).message}`);
    }
  }

  // ========================================
  // 7. 输出部署摘要
  // ========================================
  console.log("\n" + "=".repeat(45));
  console.log("✅ 部署完成！合约地址汇总:");
  console.log("=".repeat(45));
  console.log(`   GenesisSynth:   ${synthAddress}`);
  console.log(`   RiskManager:    ${riskManagerAddress}`);
  console.log(`   GenesisVault:   ${vaultAddress}`);
  console.log(`   AIPermission:   ${aiPermissionAddress}`);
  console.log("\n📊 已注册合成资产:");
  registeredAssets.forEach(asset => console.log(`   ${asset}`));
  console.log("=".repeat(45));

  console.log("\n🎉 所有任务完成！");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
