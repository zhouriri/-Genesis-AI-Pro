import { testConnection, syncDatabase } from "./index";

/**
 * 数据库初始化脚本
 */
async function initializeDatabase() {
  console.log("=====================================");
  console.log("🗄️  Genesis AI 数据库初始化");
  console.log("=====================================");

  // 测试连接
  console.log("\n📋 步骤 1: 测试数据库连接...");
  const connected = await testConnection();
  
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

  // 关闭连接
  process.exit(0);
}

// 如果直接运行此脚本
if (require.main === module) {
  initializeDatabase();
}

export { initializeDatabase };
