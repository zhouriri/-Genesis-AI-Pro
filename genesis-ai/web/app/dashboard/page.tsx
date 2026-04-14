'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount, useConnect } from 'wagmi';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { formatCurrency, formatPercent, cn } from '@/lib/utils';
import { portfolioApi, pricesApi, strategiesApi } from '@/lib/api';
import type { PortfolioSummary, Price, Strategy, Signal } from '@/lib/api';
import { ThemeToggle } from '../theme-provider';
import { LanguageToggle } from '@/lib/i18n/provider';
import { useWebSocketPrices, ConnectionStatus, type PriceUpdate } from '@/components/websocket-prices';

// 创建 QueryClient 实例
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30秒内数据视为新鲜
      gcTime: 5 * 60 * 1000, // 缓存5分钟
      retry: 2, // 失败重试2次
      refetchOnWindowFocus: true, // 窗口聚焦时刷新
    },
  },
});

// 骨架屏组件
function StatSkeleton() {
  return (
    <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--card)]" role="status" aria-label="加载统计中">
      <div className="w-16 h-3 rounded skeleton mb-3" />
      <div className="w-24 h-6 rounded skeleton" />
    </div>
  );
}

function AssetCardSkeleton() {
  return (
    <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--card)]" role="status" aria-label="加载资产中">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full skeleton" />
          <div className="w-20 h-4 rounded skeleton" />
        </div>
      </div>
      <div className="w-20 h-6 rounded skeleton mb-1" />
      <div className="w-12 h-3 rounded skeleton" />
    </div>
  );
}

function SignalSkeleton() {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--card)]" role="status" aria-label="加载信号中">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg skeleton" />
        <div className="w-24 h-4 rounded skeleton" />
      </div>
      <div className="w-8 h-4 rounded skeleton" />
    </div>
  );
}

function StrategySkeleton() {
  return (
    <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--card)]" role="status" aria-label="加载策略中">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-24 h-5 rounded skeleton" />
            <div className="w-12 h-4 rounded skeleton" />
          </div>
          <div className="w-48 h-3 rounded skeleton mb-3" />
          <div className="flex gap-6 text-xs text-gray-500">
            <div className="w-16 h-3 rounded skeleton" />
            <div className="w-12 h-3 rounded skeleton" />
          </div>
        </div>
        <div className="w-20 h-6 rounded skeleton" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <DashboardContent />
    </QueryClientProvider>
  );
}

function DashboardContent() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const [activeTab, setActiveTab] = useState<'overview' | 'trade' | 'strategies'>('overview');
  const [realtimePrices, setRealtimePrices] = useState<Map<string, PriceUpdate>>(new Map());

  // WebSocket 实时价格
  const { prices: wsPrices, isConnected: wsConnected, lastUpdate, reconnect } = useWebSocketPrices({
    symbols: ['sBTC', 'sETH', 'sSOL', 'sXAU'],
    onPriceUpdate: (update) => {
      setRealtimePrices(prev => {
        const next = new Map(prev);
        next.set(update.symbol, update);
        return next;
      });
    },
  });

  // 使用 React Query 管理数据获取
  const { 
    data: portfolio, 
    isLoading: portfolioLoading, 
    error: portfolioError,
    refetch: refetchPortfolio 
  } = useQuery({
    queryKey: ['portfolio'],
    queryFn: () => portfolioApi.getSummary(),
    enabled: isConnected,
  });

  const { 
    data: prices = [], 
    isLoading: pricesLoading, 
    refetch: refetchPrices 
  } = useQuery({
    queryKey: ['prices'],
    queryFn: () => pricesApi.list(),
    enabled: isConnected,
    staleTime: 10 * 1000,
  });

  const { 
    data: strategies = [], 
    isLoading: strategiesLoading 
  } = useQuery({
    queryKey: ['strategies'],
    queryFn: () => strategiesApi.list(),
    enabled: isConnected,
  });

  const { 
    data: signals = [], 
    isLoading: signalsLoading 
  } = useQuery({
    queryKey: ['signals'],
    queryFn: () => strategiesApi.getSignals(),
    enabled: isConnected,
  });

  // 手动刷新所有数据
  async function refreshAll() {
    await Promise.all([
      refetchPortfolio(),
      refetchPrices(),
    ]);
  }

  const isLoading = portfolioLoading || pricesLoading;

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md animate-fade-in">
          <div className="text-5xl mb-6 animate-float" role="img" aria-label="Genesis AI logo">🧬</div>
          <h1 className="text-2xl font-bold mb-3">连接你的钱包</h1>
          <p className="text-gray-400 mb-8">
            连接钱包以访问 Genesis AI 仪表板
          </p>
          <div className="space-y-3">
            {connectors.map((connector) => (
              <button
                key={connector.uid}
                onClick={() => connect({ connector })}
                className="w-full px-6 py-3 rounded-xl border border-[var(--border)] hover:border-[var(--primary)] transition font-medium flex items-center justify-center gap-3 focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)]"
                aria-label={`使用 ${connector.name} 连接钱包`}
              >
                <span>👛</span>
                {connector.name}
              </button>
            ))}
          </div>
          <p className="mt-6 text-xs text-gray-600">
            首次使用将创建 Session Key 并授权 AI Agent
          </p>
        </div>
      </div>
    );
  }

  const p = portfolio;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header 
        className="border-b border-[var(--border)] glass"
        role="banner"
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition" aria-label="返回首页">
              <span className="text-2xl" role="img" aria-label="DNA logo">🧬</span>
              <span className="font-bold text-lg">Genesis AI</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {/* 快速操作 */}
            <Link
              href="/trade"
              className="px-3 py-1.5 text-sm rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20 transition"
              aria-label="充币/提币"
            >
              💰 充提
            </Link>
            <ConnectionStatus 
              isConnected={wsConnected} 
              lastUpdate={lastUpdate}
              onReconnect={reconnect}
            />
            <LanguageToggle />
            <ThemeToggle />
            <span className="text-xs text-gray-500 font-mono" aria-label="钱包地址">
              {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}
            </span>
            <div 
              className="w-2 h-2 rounded-full bg-green-400 animate-pulse" 
              aria-label="已连接状态"
              role="status"
              aria-live="polite"
            />
            <span className="text-xs text-green-400">已连接</span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Refresh Button */}
        <div className="flex justify-end mb-6 animate-fade-in">
          <button
            onClick={refreshAll}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg border border-[var(--border)] hover:border-[var(--primary)] transition text-sm disabled:opacity-50 focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)]"
            aria-label="刷新所有数据"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                刷新中...
              </span>
            ) : (
              '🔄 刷新数据'
            )}
          </button>
        </div>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {portfolioLoading ? (
            Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={`stat-skeleton-${i}`} />)
          ) : p ? (
            [
              { label: '总资产', value: `$${formatCurrency(p.totalValue)}`, color: 'text-white', icon: '💰' },
              { label: '总盈亏', value: formatPercent(p.totalPnLPercent), color: parseFloat(p.totalPnL) >= 0 ? 'text-green-400' : 'text-red-400', icon: parseFloat(p.totalPnL) >= 0 ? '📈' : '📉' },
              { label: '现金余额', value: `$${formatCurrency(p.cashBalance)}`, color: 'text-white', icon: '💵' },
              { label: '活跃仓位', value: String(p.activePositions), color: 'text-white', icon: '📊' },
            ].map((item) => (
              <div 
                key={item.label} 
                className="p-5 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/30 transition card-hover animate-scale-in"
              >
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                  <span role="img" aria-label={item.icon}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                <div className={`text-xl font-bold ${item.color}`}>{item.value}</div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-gray-500 animate-fade-in">
              加载投资组合数据失败
            </div>
          )}
        </div>

        {/* Tabs */}
        <nav 
          className="flex gap-1 mb-6 border-b border-[var(--border)]" 
          role="tablist"
          aria-label="仪表板视图"
        >
          {(['overview', 'trade', 'strategies'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-5 py-3 text-sm font-medium border-b-2 transition -mb-px focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--primary)]',
                activeTab === tab
                  ? 'border-[var(--primary)] text-[var(--primary)]'
                  : 'border-transparent text-gray-500 hover:text-white'
              )}
              role="tab"
              aria-selected={activeTab === tab}
              aria-controls={`${tab}-panel`}
            >
              {tab === 'overview' ? '总览' : tab === 'trade' ? '交易' : '策略'}
            </button>
          ))}
        </nav>

        {/* Overview Tab */}
        <section 
          id="overview-panel" 
          role="tabpanel"
          aria-labelledby="overview"
          className={activeTab === 'overview' ? 'block' : 'hidden'}
        >
          <div className="space-y-6 animate-fade-in">
            {/* Performance */}
            {p && (
              <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--card)]">
                <h3 className="font-semibold mb-4">收益表现</h3>
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: '24小时', value: p.performance.last24h },
                    { label: '7天', value: p.performance.last7d },
                    { label: '30天', value: p.performance.last30d },
                    { label: '90天', value: p.performance.last90d },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="text-xs text-gray-500 mb-1">{item.label}</div>
                      <div className={item.value.startsWith('+') ? 'text-green-400' : 'text-red-400'}>
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Live Signals */}
            {signalsLoading ? (
              Array.from({ length: 3 }).map((_, i) => <SignalSkeleton key={`signal-skeleton-${i}`} />)
            ) : signals.length > 0 ? (
              <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--card)]">
                <h3 className="font-semibold mb-4">🔥 AI 信号</h3>
                <div className="space-y-3" role="list" aria-label="AI 交易信号">
                  {signals.map((s) => (
                    <div 
                      key={s.id} 
                      className="flex items-center justify-between p-3 rounded-lg bg-[var(--card)] hover:border-[var(--primary)]/30 transition cursor-pointer"
                      role="listitem"
                      tabIndex={0}
                      aria-label={`${s.asset} ${s.action.toUpperCase()} 信号，置信度 ${Math.round(s.confidence * 100)}%`}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold',
                            s.action === 'buy' ? 'bg-green-500/20 text-green-400' :
                            s.action === 'sell' ? 'bg-red-500/20 text-red-400' :
                            'bg-yellow-500/20 text-yellow-400'
                          )}
                          aria-hidden="true"
                        >
                          {s.action === 'buy' ? 'BUY' : s.action === 'sell' ? 'SELL' : 'HOLD'}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{s.asset}</div>
                          <div className="text-xs text-gray-500">{s.reason}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{Math.round(s.confidence * 100)}%</div>
                        <div className="text-xs text-gray-500">置信度</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                暂无 AI 信号
              </div>
            )}
          </div>
        </section>

        {/* Trade Tab */}
        <section 
          id="trade-panel" 
          role="tabpanel"
          aria-labelledby="trade"
          className={activeTab === 'trade' ? 'block' : 'hidden'}
        >
          <div className="animate-fade-in">
            <h3 className="font-semibold mb-4">可交易资产</h3>
            {pricesLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => <AssetCardSkeleton key={`asset-skeleton-${i}`} />)}
              </div>
            ) : prices.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {prices.map((price) => (
                  <div
                    key={price.symbol}
                    className="p-5 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/30 transition cursor-pointer group card-hover"
                    role="article"
                    tabIndex={0}
                    aria-label={`${price.symbol} - ${price.name}，价格 ${price.price}，24小时${price.changePercent24h}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[var(--primary)]/20 flex items-center justify-center text-sm">
                          {price.symbol[1]}
                        </div>
                        <div>
                          <div className="font-semibold">{price.symbol}</div>
                          <div className="text-xs text-gray-500">{price.name}</div>
                        </div>
                      </div>
                      <button 
                        className="opacity-0 group-hover:opacity-100 px-3 py-1 rounded-lg bg-[var(--primary)] text-white text-xs font-medium transition focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)]"
                        aria-label={`交易 ${price.symbol}`}
                      >
                        交易
                      </button>
                    </div>
                    <div className="text-xl font-bold mb-1">${formatCurrency(price.price)}</div>
                    <div className={price.changePercent24h.startsWith('+') ? 'text-green-400 text-sm' : 'text-red-400 text-sm'}>
                      {price.changePercent24h}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                暂无交易资产
              </div>
            )}
          </div>
        </section>

        {/* Strategies Tab */}
        <section 
          id="strategies-panel" 
          role="tabpanel"
          aria-labelledby="strategies"
          className={activeTab === 'strategies' ? 'block' : 'hidden'}
        >
          <div className="space-y-4 animate-fade-in">
            {strategiesLoading ? (
              Array.from({ length: 3 }).map((_, i) => <StrategySkeleton key={`strategy-skeleton-${i}`} />)
            ) : strategies.length > 0 ? (
              strategies.map((s) => (
                <div 
                  key={s.id} 
                  className="p-6 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/30 transition card-hover"
                  role="article"
                  aria-label={`${s.name} 策略，风险等级 ${s.riskLevel}，总收益 ${s.performance}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{s.name}</h3>
                        <span className={cn(
                          'px-2 py-0.5 rounded text-xs font-medium',
                          s.riskLevel === 'high' ? 'bg-red-500/20 text-red-400' :
                          s.riskLevel === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-green-500/20 text-green-400'
                        )}>
                          {s.riskLevel === 'high' ? '高风险' : s.riskLevel === 'medium' ? '中风险' : '低风险'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mb-3">{s.description}</p>
                      <div className="flex gap-6 text-xs text-gray-500">
                        <span>AUM: {s.aum}</span>
                        <span>订阅者: {s.subscribers}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-400">{s.performance}</div>
                      <div className="text-xs text-gray-500 mb-3">总收益</div>
                      <button 
                        className="px-4 py-2 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-sm font-medium transition focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)]"
                        aria-label={`激活 ${s.name} 策略`}
                      >
                        激活
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500">
                暂无可用策略
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
