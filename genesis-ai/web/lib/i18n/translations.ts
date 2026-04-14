export interface Translation {
  common: {
    loading: string;
    error: string;
    refresh: string;
    cancel: string;
    confirm: string;
    save: string;
    delete: string;
    edit: string;
    add: string;
    back: string;
    next: string;
    previous: string;
    close: string;
    search: string;
    filter: string;
    sort: string;
    clear: string;
    selectAll: string;
    selected: string;
    noData: string;
    noResults: string;
    pleaseSelect: string;
    pleaseInput: string;
  };
  navigation: {
    home: string;
    dashboard: string;
    assets: string;
    features: string;
    how: string;
  };
  home: {
    title: string;
    subtitle: string;
    alphaBadge: string;
    ctaStart: string;
    ctaHow: string;
    pricesTitle: string;
    featuresTitle: string;
    howTitle: string;
    howSteps: Array<{ title: string; desc: string }>;
  };
  auth: {
    connectWallet: string;
    connectWalletDesc: string;
    connectWith: string;
    connected: string;
    disconnect: string;
    sessionKey: string;
  };
  dashboard: {
    totalValue: string;
    totalPnL: string;
    cashBalance: string;
    activePositions: string;
    performance: string;
    last24h: string;
    last7d: string;
    last30d: string;
    last90d: string;
    aiSignals: string;
    buy: string;
    sell: string;
    hold: string;
    confidence: string;
    trade: string;
    tradeAssets: string;
    strategies: string;
    activate: string;
    riskLevel: {
      low: string;
      medium: string;
      high: string;
    };
    aum: string;
    subscribers: string;
    totalReturn: string;
  };
  theme: {
    light: string;
    dark: string;
    system: string;
  };
  errors: {
    priceLoadFailed: string;
    portfolioLoadFailed: string;
    noSignals: string;
    noAssets: string;
    noStrategies: string;
  };
}

// 中文翻译
export const zh: Translation = {
  common: {
    loading: '加载中...',
    error: '加载失败',
    refresh: '刷新',
    cancel: '取消',
    confirm: '确认',
    save: '保存',
    delete: '删除',
    edit: '编辑',
    add: '添加',
    back: '返回',
    next: '下一步',
    previous: '上一步',
    close: '关闭',
    search: '搜索',
    filter: '筛选',
    sort: '排序',
    clear: '清空',
    selectAll: '全选',
    selected: '已选择',
    noData: '暂无数据',
    noResults: '没有找到匹配的结果',
    pleaseSelect: '请选择',
    pleaseInput: '请输入',
  },
  navigation: {
    home: '首页',
    dashboard: '仪表板',
    assets: '资产',
    features: '功能',
    how: '如何运作',
  },
  home: {
    title: '用 USDC 投资全球资产',
    subtitle: 'AI Agent 全自动执行交易策略，投资加密货币、美股、黄金——无需 KYC，钱包即可参与。',
    alphaBadge: 'Alpha 版本已开放测试',
    ctaStart: '开始投资 →',
    ctaHow: '了解原理',
    pricesTitle: '实时资产价格',
    featuresTitle: '为什么选择 Genesis AI',
    howTitle: '如何运作',
    howSteps: [
      { title: '连接钱包', desc: '使用 MetaMask 或钱包连接，授权 Session Key 给 AI Agent' },
      { title: '存入 USDC', desc: '从你的钱包转入 USDC，系统自动存入 Genesis Vault' },
      { title: 'AI 接管', desc: 'AI Agent 根据策略在链上执行交易，实时同步仓位' },
      { title: '随时提取', desc: '一键提取本金和收益，USDC 直接回到你的钱包' },
    ],
  },
  auth: {
    connectWallet: '连接钱包',
    connectWalletDesc: '连接钱包以访问 Genesis AI 仪表板',
    connectWith: '使用 {{name}} 连接',
    connected: '已连接',
    disconnect: '断开连接',
    sessionKey: '首次使用将创建 Session Key 并授权 AI Agent',
  },
  dashboard: {
    totalValue: '总资产',
    totalPnL: '总盈亏',
    cashBalance: '现金余额',
    activePositions: '活跃仓位',
    performance: '收益表现',
    last24h: '24小时',
    last7d: '7天',
    last30d: '30天',
    last90d: '90天',
    aiSignals: '🔥 AI 信号',
    buy: '买入',
    sell: '卖出',
    hold: '持有',
    confidence: '置信度',
    trade: '交易',
    tradeAssets: '可交易资产',
    strategies: '策略',
    activate: '激活',
    riskLevel: {
      low: '低风险',
      medium: '中风险',
      high: '高风险',
    },
    aum: 'AUM',
    subscribers: '订阅者',
    totalReturn: '总收益',
  },
  theme: {
    light: '亮色模式',
    dark: '暗色模式',
    system: '跟随系统',
  },
  errors: {
    priceLoadFailed: '价格加载失败，请刷新页面重试',
    portfolioLoadFailed: '加载投资组合数据失败',
    noSignals: '暂无 AI 信号',
    noAssets: '暂无交易资产',
    noStrategies: '暂无可用策略',
  },
} as const;

// 英文翻译
export const en: Translation = {
  common: {
    loading: 'Loading...',
    error: 'Failed to load',
    refresh: 'Refresh',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    close: 'Close',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    clear: 'Clear',
    selectAll: 'Select All',
    selected: 'Selected',
    noData: 'No data',
    noResults: 'No matching results found',
    pleaseSelect: 'Please select',
    pleaseInput: 'Please input',
  },
  navigation: {
    home: 'Home',
    dashboard: 'Dashboard',
    assets: 'Assets',
    features: 'Features',
    how: 'How It Works',
  },
  home: {
    title: 'Invest in Global Assets with USDC',
    subtitle: 'AI Agent automatically executes trading strategies, invest in crypto, US stocks, gold - no KYC required, just your wallet.',
    alphaBadge: 'Alpha Version is Live',
    ctaStart: 'Start Investing →',
    ctaHow: 'Learn How It Works',
    pricesTitle: 'Live Asset Prices',
    featuresTitle: 'Why Choose Genesis AI',
    howTitle: 'How It Works',
    howSteps: [
      { title: 'Connect Wallet', desc: 'Connect with MetaMask or your wallet, authorize Session Key to AI Agent' },
      { title: 'Deposit USDC', desc: 'Transfer USDC from your wallet, system auto-deposits to Genesis Vault' },
      { title: 'AI Takes Over', desc: 'AI Agent executes trades on-chain based on strategies, real-time position sync' },
      { title: 'Withdraw Anytime', desc: 'One-click withdraw principal and profits, USDC directly back to your wallet' },
    ],
  },
  auth: {
    connectWallet: 'Connect Wallet',
    connectWalletDesc: 'Connect your wallet to access Genesis AI Dashboard',
    connectWith: 'Connect with {{name}}',
    connected: 'Connected',
    disconnect: 'Disconnect',
    sessionKey: 'First use will create Session Key and authorize AI Agent',
  },
  dashboard: {
    totalValue: 'Total Value',
    totalPnL: 'Total PnL',
    cashBalance: 'Cash Balance',
    activePositions: 'Active Positions',
    performance: 'Performance',
    last24h: '24h',
    last7d: '7d',
    last30d: '30d',
    last90d: '90d',
    aiSignals: '🔥 AI Signals',
    buy: 'BUY',
    sell: 'SELL',
    hold: 'HOLD',
    confidence: 'Confidence',
    trade: 'Trade',
    tradeAssets: 'Tradeable Assets',
    strategies: 'Strategies',
    activate: 'Activate',
    riskLevel: {
      low: 'Low Risk',
      medium: 'Medium Risk',
      high: 'High Risk',
    },
    aum: 'AUM',
    subscribers: 'Subscribers',
    totalReturn: 'Total Return',
  },
  theme: {
    light: 'Light Mode',
    dark: 'Dark Mode',
    system: 'System Default',
  },
  errors: {
    priceLoadFailed: 'Failed to load prices, please refresh and try again',
    portfolioLoadFailed: 'Failed to load portfolio data',
    noSignals: 'No AI signals yet',
    noAssets: 'No tradeable assets available',
    noStrategies: 'No strategies available',
  },
} as const;

export type Locale = 'zh' | 'en';

export const translations: Record<Locale, Translation> = {
  zh,
  en,
};
