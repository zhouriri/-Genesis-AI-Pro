// API 客户端配置
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const json: ApiResponse<T> = await res.json();

  if (!json.success) {
    throw new Error(json.error?.message || 'API Error');
  }

  return json.data as T;
}

// Portfolio API
export const portfolioApi = {
  getSummary: () => request<PortfolioSummary>('/api/v1/portfolio'),

  deposit: (amount: string, chain: string) =>
    request<DepositOrder>('/api/v1/portfolio/deposit', {
      method: 'POST',
      body: JSON.stringify({ amount, chain }),
    }),

  withdraw: (amount: string, chain: string, destinationAddress: string) =>
    request<WithdrawalOrder>('/api/v1/portfolio/withdraw', {
      method: 'POST',
      body: JSON.stringify({ amount, chain, destinationAddress }),
    }),

  getPosition: (id: string) =>
    request<Position>('/api/v1/portfolio/positions/' + id),

  closePosition: (id: string) =>
    request<{ positionId: string; status: string; realizedPnl: string; closedAt: string }>(
      '/api/v1/portfolio/positions/' + id,
      { method: 'DELETE' }
    ),
};

// Strategies API
export const strategiesApi = {
  list: () => request<Strategy[]>('/api/v1/strategies'),

  activate: (strategyId: string) =>
    request<{ status: string }>('/api/v1/strategies/activate', {
      method: 'POST',
      body: JSON.stringify({ strategyId }),
    }),

  deactivate: (strategyId: string) =>
    request<{ status: string }>('/api/v1/strategies/deactivate', {
      method: 'POST',
      body: JSON.stringify({ strategyId }),
    }),

  getSignals: () => request<Signal[]>('/api/v1/strategies/signals'),
};

// Prices API
export const pricesApi = {
  list: () => request<Price[]>('/api/v1/prices'),
};

// Types
export interface PortfolioSummary {
  totalValue: string;
  totalPnL: string;
  totalPnLPercent: string;
  cashBalance: string;
  activePositions: number;
  totalDeposited: string;
  performance: {
    last24h: string;
    last7d: string;
    last30d: string;
    last90d: string;
  };
  lastUpdated: string;
}

export interface Position {
  id: string;
  assetSymbol: string;
  side: 'long' | 'short';
  entryPrice: string;
  currentPrice: string;
  size: string;
  collateral: string;
  leverage: number;
  unrealizedPnl: string;
  openedAt: string;
}

export interface DepositOrder {
  id: string;
  amount: string;
  chain: string;
  status: string;
  createdAt: string;
}

export interface WithdrawalOrder {
  id: string;
  amount: string;
  fee: string;
  netAmount: string;
  chain: string;
  destinationAddress: string;
  status: string;
  estimatedTime: string;
  createdAt: string;
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
  aum: string;
  performance: string;
  subscribers: number;
}

export interface Signal {
  id: string;
  asset: string;
  action: 'buy' | 'sell' | 'hold';
  confidence: number;
  reason: string;
  timestamp: string;
}

export interface Price {
  symbol: string;
  name: string;
  price: string;
  change24h: string;
  changePercent24h: string;
  volume24h: string;
  marketCap: string;
}
