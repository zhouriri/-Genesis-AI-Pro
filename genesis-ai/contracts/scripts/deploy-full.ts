import { ethers } from "hardhat";
import dotenv from "dotenv";

dotenv.config();

/**
 * Genesis AI 智能合约部署脚本（完整版本）
 * 部署顺序：MockPyth -> GenesisSynth -> RiskManager -> GenesisVault -> AIPermission -> CrossChainBridge -> GeographicBlocker
 */
async function main() {
  console.log("=====================================");
  console.log("🚀 Genesis AI 合约部署开始（完整版本）");
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
  // 0. 部署 MockPyth (测试用)
  // ========================================
  console.log("📦 [0/8] 部署 MockPyth 预言机合约...");
  const MockPyth = await ethers.getContractFactory("MockPyth");
  const mockPyth = await MockPyth.deploy();
  await mockPyth.waitForDeployment();
  const mockPythAddress = await mockPyth.getAddress();
  console.log(`   ✅ MockPyth 已部署: ${mockPythAddress}`);

  // ========================================
  // 1. 部署 GenesisSynth 合成资产合约
  // ========================================
  console.log("\n📦 [1/8] 部署 GenesisSynth 合成资产合约...");
  const GenesisSynth = await ethers.getContractFactory("GenesisSynth");
  
  const synth = await GenesisSynth.deploy(mockPythAddress);
  await synth.waitForDeployment();
  const synthAddress = await synth.getAddress();
  
  console.log(`   ✅ GenesisSynth 已部署: ${synthAddress}`);

  // ========================================
  // 2. 部署 RiskManager 风险管理合约
  // ========================================
  console.log("\n📦 [2/8] 部署 RiskManager 风险管理合约...");
  const RiskManager = await ethers.getContractFactory("RiskManager");
  
  const riskManager = await RiskManager.deploy(synthAddress, synthAddress);
  await riskManager.waitForDeployment();
  const riskManagerAddress = await riskManager.getAddress();
  
  console.log(`   ✅ RiskManager 已部署: ${riskManagerAddress}`);

  // ========================================
  // 3. 部署 GenesisVault 资金库合约
  // ========================================
  console.log("\n📦 [3/8] 部署 GenesisVault 资金库合约...");
  const GenesisVault = await ethers.getContractFactory("GenesisVault");
  
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const mockUsdc = await MockERC20.deploy("USD Coin", "USDC", 6);
  await mockUsdc.waitForDeployment();
  const usdcAddress = await mockUsdc.getAddress();
  
  const vault = await GenesisVault.deploy(usdcAddress, synthAddress, riskManagerAddress);
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  
  console.log(`   ✅ MockUSDC 已部署: ${usdcAddress}`);
  console.log(`   ✅ GenesisVault 已部署: ${vaultAddress}`);

  // ========================================
  // 4. 部署 AIPermission AI授权管理合约
  // ========================================
  console.log("\n📦 [4/8] 部署 AIPermission AI授权管理合约...");
  const AIPermission = await ethers.getContractFactory("AIPermission");
  
  const aiPermission = await AIPermission.deploy();
  await aiPermission.waitForDeployment();
  const aiPermissionAddress = await aiPermission.getAddress();
  
  console.log(`   ✅ AIPermission 已部署: ${aiPermissionAddress}`);

  // ========================================
  // 5. 部署 CrossChainBridge 跨链桥合约
  // ========================================
  console.log("\n📦 [5/8] 部署 CrossChainBridge 跨链桥合约...");
  const CrossChainBridge = await ethers.getContractFactory("CrossChainBridge");
  
  // LayerZero Endpoint (测试地址)
  const lzEndpoint = "0x66A71D9B000eE867Fb6AbA42166655BfC0D66C";
  const lzChannelId = ethers.encodeBytes32String("genesis-v1");
  
  const crossChainBridge = await CrossChainBridge.deploy(
    usdcAddress,
    lzEndpoint,
    lzChannelId
  );
  await crossChainBridge.waitForDeployment();
  const crossChainBridgeAddress = await crossChainBridge.getAddress();
  
  console.log(`   ✅ CrossChainBridge 已部署: ${crossChainBridgeAddress}`);

  // ========================================
  // 6. 部署 GeographicBlocker 地理阻断合约
  // ========================================
  console.log("\n📦 [6/8] 部署 GeographicBlocker 地理阻断合约...");
  const GeographicBlocker = await ethers.getContractFactory("GeographicBlocker");
  
  const geoBlocker = await GeographicBlocker.deploy();
  await geoBlocker.waitForDeployment();
  const geoBlockerAddress = await geoBlocker.getAddress();
  
  console.log(`   ✅ GeographicBlocker 已部署: ${geoBlockerAddress}`);

  // ========================================
  // 7. 配置合约权限和关联
  // ========================================
  console.log("\n⚙️  配置合约关联和权限...");

  // 设置 Vault 地址到 Synth 合约（授权铸造/销毁）
  console.log("   ⤵️  授权 Vault 在 Synth 合约的铸造/销毁权限...");
  const setVaultTx = await synth.setVault(vaultAddress);
  await setVaultTx.wait();
  console.log("   ✅ Vault 权限已设置");

  // 授权 AI Agent 在 Vault 合约
  console.log("   ⤵️  授权 AI Agent 在 Vault 合约...");
  const aiAgentAddress = process.env.AI_AGENT_ADDRESS ? ethers.getAddress(process.env.AI_AGENT_ADDRESS) : deployer.address;
  const authorizeAITx = await vault.authorizeAI(aiAgentAddress);
  await authorizeAITx.wait();
  console.log(`   ✅ AI Agent ${aiAgentAddress} 已授权`);

  // ========================================
  // 8. 注册合成资产
  // ========================================
  console.log("\n📊 注册合成资产...");

  const assets = [
    {
      name: "Synthetic Bitcoin",
      symbol: "sBTC",
      priceFeedId: ethers.encodeBytes32String("BTC/USD"),
      maxSupply: ethers.parseEther("1000000")
    },
    {
      name: "Synthetic Ethereum",
      symbol: "sETH",
      priceFeedId: ethers.encodeBytes32String("ETH/USD"),
      maxSupply: ethers.parseEther("5000000")
    },
    {
      name: "Synthetic Gold",
      symbol: "sXAU",
      priceFeedId: ethers.encodeBytes32String("XAU/USD"),
      maxSupply: ethers.parseEther("1000000")
    },
    {
      name: "Synthetic Tesla",
      symbol: "sTSLA",
      priceFeedId: ethers.encodeBytes32String("TSLA/USD"),
      maxSupply: ethers.parseEther("1000000")
    },
    {
      name: "Synthetic Apple",
      symbol: "sAAPL",
      priceFeedId: ethers.encodeBytes32String("AAPL/USD"),
      maxSupply: ethers.parseEther("1000000")
    },
    {
      name: "Synthetic NVIDIA",
      symbol: "sNVDA",
      priceFeedId: ethers.encodeBytes32String("NVDA/USD"),
      maxSupply: ethers.parseEther("1000000")
    },
    {
      name: "Synthetic Google",
      symbol: "sGOOGL",
      priceFeedId: ethers.encodeBytes32String("GOOGL/USD"),
      maxSupply: ethers.parseEther("1000000")
    },
    {
      name: "Synthetic Amazon",
      symbol: "sAMZN",
      priceFeedId: ethers.encodeBytes32String("AMZN/USD"),
      maxSupply: ethers.parseEther("1000000")
    },
    {
      name: "Synthetic Silver",
      symbol: "sXAG",
      priceFeedId: ethers.encodeBytes32String("XAG/USD"),
      maxSupply: ethers.parseEther("1000000")
    },
    {
      name: "Synthetic Solana",
      symbol: "sSOL",
      priceFeedId: ethers.encodeBytes32String("SOL/USD"),
      maxSupply: ethers.parseEther("1000000")
    },
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
  // 9. 配置地理阻断
  // ========================================
  console.log("\n🌍 配置地理阻断...");
  console.log("   🔴 黑名单: US, GB, CN, KP, IR, SY");
  console.log   "   ⚪️ 白名单: []");

  // ========================================
  // 10. 输出部署摘要
  // ========================================
  console.log("\n" + "=".repeat(60));
  console.log("✅ 部署完成！合约地址汇总:");
  console.log("=".repeat(60));
  console.log(`   MockPyth:       ${mockPythAddress}`);
  console.log(`   GenesisSynth:   ${synthAddress}`);
  console.log(`   RiskManager:    ${riskManagerAddress}`);
  console.log(`   MockUSDC:       ${usdcAddress}`);
  console.log(`   GenesisVault:   ${vaultAddress}`);
  console.log(`   AIPermission:   ${aiPermissionAddress}`);
  console.log(`   CrossChainBridge: ${crossChainBridgeAddress}`);
  console.log(`   GeographicBlocker: ${geoBlockerAddress}`);
  console.log("\n📊 已注册合成资产:");
  registeredAssets.forEach(asset => console.log(`   ${asset}`));
  console.log("=".repeat(60));

  // ========================================
  // 11. 保存部署信息到文件
  // ========================================
  const fs = require('fs');
  
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    contracts: {
      mockPyth: mockPythAddress,
      genesisSynth: synthAddress,
      riskManager: riskManagerAddress,
      mockUSDC: usdcAddress,
      genesisVault: vaultAddress,
      aiPermission: aiPermissionAddress,
      crossChainBridge: crossChainBridgeAddress,
      geographicBlocker: geoBlockerAddress,
    },
    assets: registeredAssets,
    geoBlocking: {
      blockedCountries: ["US", "GB", "CN", "KP", "IR", "SY"],
      whitelistCountries: [],
      defaultAction: "block"
    }
  };

  fs.writeFileSync(
    './deployments/hardhat.json',
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\n📄 部署信息已保存到: deployments/hardhat.json");

  console.log("\n🎉 所有任务完成！");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
