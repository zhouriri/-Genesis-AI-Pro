import { testConnection, syncDatabase } from "../database/index";

/**
 * 数据库初始化脚本
 */
console.log("=====================================");
console.log("🗄️  Genesis AI 数据库初始化");
console.log("=====================================");

// 测试连接
console.log("\n📋 步骤 1: 测试数据库连接...");
testConnection()
  .then(async (connected) => {
    if (!connected) {
      console.error("❌ 数据库连接失败，初始化终止");
      process.exit(1);
    }

    // 同步数据库表结构
    console.log("\n📋 步骤 2: 同步数据库表结构...");
    const synced = await syncDatabase(false);

    if (!synced) {
      console.error("❌ 数据库同步失败，初始化终止");
      process.exit(1);
    }

    console.log("\n=====================================");
    console.log("✅ 数据库初始化完成！");
    console.log("=====================================");
  })
  .catch((error) => {
    console.error("❌ 初始化过程中出现错误:", error);
    process.exit(1);
  });
