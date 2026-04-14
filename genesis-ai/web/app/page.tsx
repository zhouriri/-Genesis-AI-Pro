import { useEffect, useState } from 'react';
import Link from 'next/link';
import { pricesApi } from '@/lib/api';
import type { Price } from '@/lib/api';
import { ThemeToggle } from './theme-provider';
import { LanguageToggle, useI18n } from '@/lib/i18n/provider';

interface AssetDisplay {
  symbol: string;
  name: string;
  price: string;
  change: string;
  icon: string;
}

// 骨架屏组件
function AssetSkeleton() {
  return (
    <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]" role="status" aria-label="加载中">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-full skeleton" />
        <div className="w-16 h-4 rounded skeleton" />
      </div>
      <div className="w-20 h-5 rounded skeleton mb-2" />
      <div className="w-12 h-3 rounded skeleton" />
    </div>
  );
}

const ASSET_ICONS: Record<string, string> = {
  'sBTC': '₿',
  'sETH': 'Ξ',
  'sSOL': '◎',
  'sXAU': '🪙',
  'sXAG': '🥈',
  'sTSLA': '🚗',
  'sAAPL': '🍎',
  'sNVDA': '🎮',
  'sGOOGL': '🔍',
  'sAMZN': '📦',
};

const FEATURES = [
  {
    title: 'AI 驱动',
    desc: '自主学习的策略引擎，7×24 小时监控市场机会',
    icon: '🤖',
    ariaLabel: 'AI 驱动 - 自主学习的策略引擎',
  },
  {
    title: 'USDC 一键投资',
    desc: '无需 KYC，无需托管，直接用稳定币投资全球资产',
    icon: '⚡',
    ariaLabel: 'USDC 一键投资 - 无需 KYC 直接投资',
  },
  {
    title: '链上透明',
    desc: '所有操作上链，可验证，无中心化风险',
    icon: '⛓️',
    ariaLabel: '链上透明 - 所有操作可验证',
  },
  {
    title: '跨链自由',
    desc: '支持 Polygon zkEVM、Arbitrum、Base 等多链',
    icon: '🔗',
    ariaLabel: '跨链自由 - 支持多链协议',
  },
];

function formatPrice(price: string | number): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(numPrice)) return price.toString();
  if (numPrice >= 1000) {
    return `$${numPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `$${numPrice.toFixed(2)}`;
}

function formatChange(changePercent: string | number): string {
  const num = typeof changePercent === 'string' ? parseFloat(changePercent) : changePercent;
  if (isNaN(num)) return changePercent.toString();
  const sign = num >= 0 ? '+' : '';
  return `${sign}${num.toFixed(2)}%`;
}

function getPriceChangeClass(value: string): string {
  if (value.startsWith('+')) return 'text-green-400';
  if (value.startsWith('-')) return 'text-red-400';
  return 'text-gray-400';
}

export default function HomePage() {
  const [assets, setAssets] = useState<AssetDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchPrices() {
      try {
        const prices = await pricesApi.list();
        
        if (!isMounted) return;
        
        if (prices && prices.length > 0) {
          const displayAssets = prices.slice(0, 6).map((price: Price) => ({
            symbol: price.symbol,
            name: price.name || price.symbol.replace('s', 'Synthetic '),
            price: formatPrice(price.price),
            change: formatChange(price.changePercent24h),
            icon: ASSET_ICONS[price.symbol] || '📊',
          }));
          setAssets(displayAssets);
          setError(false);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Failed to fetch prices:', err);
        setError(true);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchPrices();
    
    const interval = setInterval(fetchPrices, 60 * 1000);
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <main className="min-h-screen">
      {/* Skip Link for Accessibility */}
      <a href="#main-content" className="skip-link">
        跳到主要内容
      </a>

      {/* Header */}
      <header 
        className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--border)] glass"
        role="banner"
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl" role="img" aria-label="DNA logo">🧬</span>
            <span className="font-bold text-lg">Genesis AI</span>
          </div>
          
          <nav 
            className="hidden md:flex items-center gap-8 text-sm text-gray-400" 
            aria-label="主导航"
          >
            <a href="#assets" className="hover:text-white transition focus:outline-none focus:text-white">
              资产
            </a>
            <a href="#features" className="hover:text-white transition focus:outline-none focus:text-white">
              功能
            </a>
            <a href="#how" className="hover:text-white transition focus:outline-none focus:text-white">
              如何运作
            </a>
          </nav>
          
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <ThemeToggle />
            <Link
              href="/trade"
              className="px-4 py-2 rounded-lg text-sm font-medium border border-[var(--border)] hover:border-[var(--primary)] transition"
              aria-label="充币/提币"
            >
              充提
            </Link>
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-lg text-sm font-medium border border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)]"
              aria-label="连接钱包并开始投资"
            >
              连接钱包
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div id="main-content">
        {/* Hero */}
        <section className="pt-32 pb-20 px-6" aria-labelledby="hero-title">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[var(--primary)]/30 bg-[var(--primary)]/10 text-sm text-[var(--primary)] mb-8 animate-fade-in">
              <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse" aria-hidden="true" />
              <span>Alpha 版本已开放测试</span>
            </div>

            {/* Title */}
            <h1 
              id="hero-title" 
              className="text-5xl md:text-6xl font-bold leading-tight mb-6 animate-fade-in"
            >
              用 USDC 投资
              <br />
              <span className="gradient-text">全球资产</span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto animate-fade-in stagger-1">
              AI Agent 全自动执行交易策略，投资加密货币、美股、黄金——无需 KYC，钱包即可参与。
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in stagger-2">
              <Link
                href="/dashboard"
                className="px-8 py-4 rounded-xl text-lg font-semibold bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white transition shadow-lg shadow-indigo-500/20 animate-pulse-glow focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)]"
                aria-label="立即开始投资"
              >
                开始投资 →
              </Link>
              <a
                href="#how"
                className="px-8 py-4 rounded-xl text-lg font-medium border border-[var(--border)] hover:border-gray-500 transition focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                aria-label="了解平台运作原理"
              >
                了解原理
              </a>
            </div>

            {/* Live Prices Strip */}
            <div 
              className="mt-16" 
              id="assets"
              aria-label="实时资产价格"
            >
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {loading ? (
                  // Skeleton loading state
                  Array.from({ length: 6 }).map((_, i) => (
                    <AssetSkeleton key={`skeleton-${i}`} />
                  ))
                ) : error ? (
                  // Error state
                  <div className="col-span-full text-center py-8 text-gray-500">
                    价格加载失败，请刷新页面重试
                  </div>
                ) : (
                  // Loaded assets
                  assets.map((asset, index) => (
                    <div
                      key={asset.symbol}
                      className={`p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/30 transition cursor-pointer card-hover animate-scale-in stagger-${Math.min(index + 1, 6)}`}
                      role="article"
                      tabIndex={0}
                      aria-label={`${asset.symbol} - ${asset.name}，当前价格 ${asset.price}，24小时涨跌 ${asset.change}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg" role="img" aria-label={asset.symbol}>
                          {asset.icon}
                        </span>
                        <span className="font-semibold text-sm">{asset.symbol}</span>
                      </div>
                      <div className="text-sm font-medium">{asset.price}</div>
                      <div 
                        className={`text-xs ${getPriceChangeClass(asset.change)}`}
                        aria-label={`24小时涨跌：${asset.change}`}
                      >
                        {asset.change}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            {/* Update indicator */}
            <p className="mt-4 text-xs text-gray-600 animate-fade-in" role="status">
              {loading ? '正在加载实时价格...' : error ? '价格加载失败' : '价格每分钟自动更新'}
            </p>
          </div>
        </section>

        {/* Features */}
        <section 
          className="py-20 px-6 border-t border-[var(--border)]" 
          id="features"
          aria-labelledby="features-title"
        >
          <div className="max-w-6xl mx-auto">
            <h2 
              id="features-title"
              className="text-3xl font-bold text-center mb-12 animate-fade-in"
            >
              为什么选择 Genesis AI
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {FEATURES.map((f, index) => (
                <div
                  key={f.title}
                  className={`p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/30 transition card-hover animate-slide-up stagger-${(index % 4) + 1}`}
                  role="article"
                  aria-label={f.ariaLabel}
                >
                  <div className="text-3xl mb-4" role="img" aria-hidden="true">
                    {f.icon}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                  <p className="text-gray-400 text-sm">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section 
          className="py-20 px-6 border-t border-[var(--border)]" 
          id="how"
          aria-labelledby="how-title"
        >
          <div className="max-w-4xl mx-auto">
            <h2 
              id="how-title"
              className="text-3xl font-bold text-center mb-12 animate-fade-in"
            >
              如何运作
            </h2>
            <div className="space-y-6" role="list">
              {[
                { 
                  step: '01', 
                  title: '连接钱包', 
                  desc: '使用 MetaMask 或钱包连接，授权 Session Key 给 AI Agent',
                  aria: '第一步：连接钱包'
                },
                { 
                  step: '02', 
                  title: '存入 USDC', 
                  desc: '从你的钱包转入 USDC，系统自动存入 Genesis Vault',
                  aria: '第二步：存入 USDC'
                },
                { 
                  step: '03', 
                  title: 'AI 接管', 
                  desc: 'AI Agent 根据策略在链上执行交易，实时同步仓位',
                  aria: '第三步：AI 接管交易'
                },
                { 
                  step: '04', 
                  title: '随时提取', 
                  desc: '一键提取本金和收益，USDC 直接回到你的钱包',
                  aria: '第四步：随时提取资金'
                },
              ].map((item, index) => (
                <div 
                  key={item.step} 
                  className={`flex gap-6 items-start p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/30 transition card-hover animate-slide-up stagger-${Math.min(index + 1, 4)}`}
                  role="listitem"
                  aria-label={item.aria}
                >
                  <div 
                    className="w-12 h-12 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] font-bold shrink-0"
                    aria-hidden="true"
                  >
                    {item.step}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                    <p className="text-gray-400 text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-[var(--border)] text-center text-gray-500 text-sm" role="contentinfo">
        <p>© 2026 Genesis AI — Build on Polygon zkEVM</p>
        <p className="mt-1">Powered by AI · Secured by blockchain</p>
      </footer>
    </main>
  );
}
