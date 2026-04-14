// 格式化工具函数

export function formatCurrency(value: string | number, decimals = 2): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

export function formatPercent(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  const sign = num >= 0 ? '+' : '';
  return `${sign}${num.toFixed(2)}%`;
}

export function formatCompact(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

export function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function getPnLColor(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (num > 0) return 'text-green-400';
  if (num < 0) return 'text-red-400';
  return 'text-gray-400';
}

export function getPnLSign(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (num > 0) return '+';
  return '';
}
