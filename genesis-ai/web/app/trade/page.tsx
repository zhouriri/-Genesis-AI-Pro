'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useAccount, useConnect, useBalance } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '../theme-provider';
import { LanguageToggle } from '@/lib/i18n/provider';

const queryClient = new QueryClient();

export default function TradePage() {
  return (
    <QueryClientProvider client={queryClient}>
      <TradeContent />
    </QueryClientProvider>
  );
}

function TradeContent() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { data: balance } = useBalance({ address });
  
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [amount, setAmount] = useState('');
  const [selectedChain, setSelectedChain] = useState('polygon');
  const [step, setStep] = useState<'input' | 'confirm' | 'processing' | 'success'>('input');

  const isValidAmount = parseFloat(amount) > 0 && !isNaN(parseFloat(amount));

  const handleDeposit = useCallback(async () => {
    if (!isValidAmount) return;
    setStep('processing');
    await new Promise(resolve => setTimeout(resolve, 2000));
    setStep('success');
  }, [amount, isValidAmount]);

  const handleWithdraw = useCallback(async () => {
    if (!isValidAmount) return;
    setStep('processing');
    await new Promise(resolve => setTimeout(resolve, 2000));
    setStep('success');
  }, [amount, isValidAmount]);

  const handleReset = () => {
    setAmount('');
    setStep('input');
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md animate-fade-in">
          <div className="text-5xl mb-6 animate-float">💰</div>
          <h1 className="text-2xl font-bold mb-3">充币 / 提币</h1>
          <p className="text-gray-400 mb-8">
            连接钱包以进行充币或提币操作
          </p>
          <div className="space-y-3">
            {connectors.map((connector) => (
              <button
                key={connector.uid}
                onClick={() => connect({ connector })}
                className="w-full px-6 py-3 rounded-xl border border-[var(--border)] hover:border-[var(--primary)] transition font-medium flex items-center justify-center gap-3"
              >
                <span>👛</span>
                {connector.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const balanceDisplay = balance 
    ? `${(Number(balance.value) / Math.pow(10, balance.decimals)).toFixed(4)} ${balance.symbol}` 
    : '0.0000 USDC';
  
  const netAmount = amount ? `$${(parseFloat(amount) - 0.01).toFixed(2)}` : '$0.00';

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--border)] glass">
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧬</span>
            <span className="font-bold text-lg">Genesis AI</span>
          </div>
          <div className="flex items-center gap-4">
            <LanguageToggle />
            <ThemeToggle />
            <span className="text-xs text-gray-500 font-mono">
              {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        {/* Balance Card */}
        <div className="mb-8 p-6 rounded-2xl border border-[var(--primary)]/30 bg-gradient-to-br from-[var(--primary)]/10 to-transparent">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-400 mb-1">钱包余额</p>
              <p className="text-3xl font-bold">{balanceDisplay}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400 mb-1">链</p>
              <p className="text-lg font-semibold">Polygon zkEVM</p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 mb-6 p-1 rounded-xl bg-[var(--card)] border border-[var(--border)]">
          <button
            onClick={() => { setActiveTab('deposit'); handleReset(); }}
            className={cn(
              'flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all',
              activeTab === 'deposit'
                ? 'bg-[var(--primary)] text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            )}
          >
            💰 充币
          </button>
          <button
            onClick={() => { setActiveTab('withdraw'); handleReset(); }}
            className={cn(
              'flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all',
              activeTab === 'withdraw'
                ? 'bg-[var(--primary)] text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            )}
          >
            📤 提币
          </button>
        </div>

        {/* Input Step */}
        {step === 'input' && (
          <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] animate-scale-in">
            <h2 className="text-lg font-semibold mb-6">
              {activeTab === 'deposit' ? '充入 USDC' : '提取 USDC'}
            </h2>

            {/* Amount Input */}
            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-2">
                数量 (USDC)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-4 text-2xl font-semibold rounded-xl border border-[var(--border)] bg-[var(--background)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 outline-none transition"
                />
                <button
                  onClick={() => setAmount(balance ? String(Number(balance.value) / Math.pow(10, balance.decimals)) : '0')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 px-3 py-1 text-xs text-[var(--primary)] border border-[var(--primary)] rounded-lg hover:bg-[var(--primary)]/10 transition"
                >
                  MAX
                </button>
              </div>
            </div>

            {/* Chain Selection */}
            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-2">
                目标链
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'polygon', name: 'Polygon', icon: '🔷' },
                  { id: 'arbitrum', name: 'Arbitrum', icon: '🔴' },
                  { id: 'base', name: 'Base', icon: '🔵' },
                ].map((chain) => (
                  <button
                    key={chain.id}
                    onClick={() => setSelectedChain(chain.id)}
                    className={cn(
                      'p-3 rounded-xl border transition-all text-center',
                      selectedChain === chain.id
                        ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                        : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                    )}
                  >
                    <span className="text-xl mb-1 block">{chain.icon}</span>
                    <span className="text-sm font-medium">{chain.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Fee Info */}
            <div className="p-4 rounded-xl bg-[var(--background)] mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">网络费</span>
                <span>~ $0.01</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">到账金额</span>
                <span className="font-semibold text-[var(--primary)]">{netAmount}</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={() => setStep('confirm')}
              disabled={!isValidAmount}
              className={cn(
                'w-full py-4 rounded-xl font-semibold transition-all',
                isValidAmount
                  ? 'bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white shadow-lg shadow-[var(--primary)]/20'
                  : 'bg-[var(--muted)] text-gray-400 cursor-not-allowed'
              )}
            >
              {activeTab === 'deposit' ? '充币' : '提币'}
            </button>
          </div>
        )}

        {/* Confirm Step */}
        {step === 'confirm' && (
          <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] animate-scale-in">
            <h2 className="text-lg font-semibold mb-6">确认交易</h2>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center p-4 rounded-xl bg-[var(--background)]">
                <span className="text-gray-400">类型</span>
                <span className="font-medium">{activeTab === 'deposit' ? '充币' : '提币'}</span>
              </div>
              <div className="flex justify-between items-center p-4 rounded-xl bg-[var(--background)]">
                <span className="text-gray-400">数量</span>
                <span className="font-bold text-xl">{amount} USDC</span>
              </div>
              <div className="flex justify-between items-center p-4 rounded-xl bg-[var(--background)]">
                <span className="text-gray-400">目标链</span>
                <span className="font-medium capitalize">{selectedChain}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('input')}
                className="flex-1 py-4 rounded-xl font-medium border border-[var(--border)] hover:border-gray-500 transition"
              >
                取消
              </button>
              <button
                onClick={activeTab === 'deposit' ? handleDeposit : handleWithdraw}
                className="flex-1 py-4 rounded-xl font-semibold bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white transition"
              >
                确认 {activeTab === 'deposit' ? '充币' : '提币'}
              </button>
            </div>
          </div>
        )}

        {/* Processing Step */}
        {step === 'processing' && (
          <div className="p-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] text-center animate-scale-in">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full border-4 border-[var(--primary)] border-t-transparent animate-spin" />
            <h2 className="text-xl font-semibold mb-2">处理中...</h2>
            <p className="text-gray-400">
              正在{activeTab === 'deposit' ? '充入' : '提取'} {amount} USDC
            </p>
            <p className="text-sm text-gray-500 mt-2">请在钱包中确认交易</p>
          </div>
        )}

        {/* Success Step */}
        {step === 'success' && (
          <div className="p-8 rounded-2xl border border-green-500/30 bg-green-500/10 text-center animate-scale-in">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
              <span className="text-3xl">✅</span>
            </div>
            <h2 className="text-xl font-semibold mb-2 text-green-400">交易成功!</h2>
            <p className="text-gray-400 mb-6">
              {activeTab === 'deposit' ? '已充入' : '已提取'} {amount} USDC
            </p>
            <button
              onClick={handleReset}
              className="px-6 py-3 rounded-xl font-medium border border-[var(--border)] hover:border-gray-500 transition"
            >
              返回
            </button>
          </div>
        )}

        {/* Help Text */}
        <div className="mt-8 p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]/50">
          <h3 className="font-medium mb-2">💡 温馨提示</h3>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>- 充币: USDC 从你的钱包转入 Genesis Vault</li>
            <li>- 提币: USDC 直接回到你的钱包，约 1-3 分钟到账</li>
            <li>- 请确保目标链网络正确，跨链可能需要额外时间</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
