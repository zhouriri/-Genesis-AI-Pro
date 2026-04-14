const hre = require("hardhat");

task("deploy-all", "部署所有合约").setAction(async () => {
  console.log("=====================================");
  console.log("🚀 Genesis AI 合约部署");
  console.log("=====================================");

  const [deployer] = await hre.ethers.getSigners();
  const network = await hre.ethers.provider.getNetwork();
  
  console.log("\n📋 部署信息:");
  console.log(`   部署地址: ${deployer.address}`);
  console.log(`   链名称: ${network.name}`);
  console.log(`   Chain ID: ${network.chainId.toString()}`);

  const GenesisSynth = await hre.ethers.getContractFactory("GenesisSynth");
  const pythAddress = process.env.PYTH_ADDRESS || "0x4305FB66699C3B2702D4d05CF36551390A4c6936";
  
  console.log("\n📦 [1/4] 部署 GenesisSynth...");
  const synth = await GenesisSynth.deploy(pythAddress);
  await synth.waitForDeployment();
  const synthAddress = await synth.getAddress();
  console.log(`   ✅ ${synthAddress}`);

  const RiskManager = await hre.ethers.getContractFactory("RiskManager");
  console.log("\n📦 [2/4] 部署 RiskManager...");
  const riskManager = await RiskManager.deploy(synthAddress, synthAddress);
  await riskManager.waitForDeployment();
  const riskManagerAddress = await riskManager.getAddress();
  console.log(`   ✅ ${riskManagerAddress}`);

  const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
  console.log("\n📦 [3/4] 部署 Mock USDC...");
  const usdc = await MockERC20.deploy("USD Coin", "USDC", 6);
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log(`   ✅ ${usdcAddress}`);

  const GenesisVault = await hre.ethers.getContractFactory("GenesisVault");
  console.log("\n📦 [4/4] 部署 GenesisVault...");
  const vault = await GenesisVault.deploy(usdcAddress, synthAddress, riskManagerAddress);
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log(`   ✅ ${vaultAddress}`);

  console.log("\n⚙️ 配置合约关联...");
  await synth.setVault(vaultAddress);
  console.log("   ✅ Vault 权限已设置");

  console.log("\n📊 注册合成资产...");
  const assets = [
    {
      priceFeedId: hre.ethers.zeroPadBytes(hre.ethers.toUtf8Bytes("sBTC"), 32),
      name: "Synthetic Bitcoin",
      symbol: "sBTC",
      maxSupply: hre.ethers.parseEther("1000000")
    },
    {
      priceFeedId: hre.ethers.zeroPadBytes(hre.ethers.toUtf8Bytes("sETH"), 32),
      name: "Synthetic Ethereum",
      symbol: "sETH",
      maxSupply: hre.ethers.parseEther("5000000")
    }
  ];

  for (const asset of assets) {
    try {
      await synth.registerAsset(asset.priceFeedId, asset.name, asset.symbol, asset.maxSupply);
      console.log(`   ✅ ${asset.symbol}`);
    } catch (e) {
      console.log(`   ❌ ${asset.symbol}: ${(e.message || '失败').slice(0, 50)}`);
    }
  }

  console.log("\n" + "=".repeat(45));
  console.log("✅ 部署完成！合约地址:");
  console.log("=".repeat(45));
  console.log(`   GenesisSynth:   ${synthAddress}`);
  console.log(`   RiskManager:    ${riskManagerAddress}`);
  console.log(`   Mock USDC:      ${usdcAddress}`);
  console.log(`   GenesisVault:   ${vaultAddress}`);
  console.log("=".repeat(45));
});
