import { useEffect, useRef, useState, useCallback } from 'react';

export interface PriceUpdate {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  timestamp: number;
}

interface UseWebSocketPricesOptions {
  symbols?: string[];
  onPriceUpdate?: (update: PriceUpdate) => void;
  onConnectionChange?: (connected: boolean) => void;
  reconnectInterval?: number;
}

export function useWebSocketPrices({
  symbols = ['sBTC', 'sETH', 'sSOL'],
  onPriceUpdate,
  onConnectionChange,
  reconnectInterval = 5000,
}: UseWebSocketPricesOptions = {}) {
  const [prices, setPrices] = useState<Map<string, PriceUpdate>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const getBinanceSymbol = (symbol: string): string => {
    const mapping: Record<string, string> = {
      'sBTC': 'btcusdt',
      'sETH': 'ethusdt',
      'sSOL': 'solusdt',
    };
    return mapping[symbol] || symbol.toLowerCase();
  };

  const parseBinanceMessage = useCallback((data: any): PriceUpdate | null => {
    try {
      if (data.e !== '24hrTicker') return null;
      const rawSymbol = data.s;
      const sSymbol = 's' + rawSymbol.replace('USDT', '').replace('USD', '');
      return {
        symbol: sSymbol,
        price: parseFloat(data.c),
        change24h: parseFloat(data.p),
        changePercent24h: parseFloat(data.P),
        timestamp: data.E,
      };
    } catch {
      return null;
    }
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const streams = symbols.map(s => getBinanceSymbol(s) + '@ticker').join('/');
    const wsUrl = 'wss://stream.binance.com:9443/stream?streams=' + streams;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
        onConnectionChange?.(true);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const update = parseBinanceMessage(message.data);
          if (update) {
            setPrices(prev => new Map(prev).set(update.symbol, update));
            setLastUpdate(new Date());
            onPriceUpdate?.(update);
          }
        } catch (err) {
          console.error('WebSocket parse error:', err);
        }
      };

      ws.onerror = () => console.error('WebSocket error');
      ws.onclose = () => {
        setIsConnected(false);
        onConnectionChange?.(false);
        if (reconnectAttemptsRef.current < 5) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, reconnectInterval);
        }
      };
    } catch (err) {
      console.error('WebSocket create error:', err);
    }
  }, [symbols, onPriceUpdate, onConnectionChange, parseBinanceMessage, reconnectInterval]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    if (wsRef.current) wsRef.current.close();
    setIsConnected(false);
    onConnectionChange?.(false);
  }, [onConnectionChange]);

  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect, disconnect]);

  useEffect(() => {
    connect();
    return () => { disconnect(); };
  }, [connect, disconnect]);

  return { prices, isConnected, lastUpdate, reconnect, disconnect };
}

export function ConnectionStatus({ 
  isConnected, 
  lastUpdate, 
  onReconnect 
}: { 
  isConnected: boolean; 
  lastUpdate: Date | null;
  onReconnect?: () => void;
}) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
      <div style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: isConnected ? '#22c55e' : '#ef4444',
        animation: isConnected ? 'pulse 2s infinite' : 'none'
      }} />
      <span style={{ color: isConnected ? '#22c55e' : '#ef4444' }}>
        {isConnected ? '实时' : '离线'}
      </span>
      {lastUpdate && (
        <span style={{ color: '#6b7280' }}>· {formatTime(lastUpdate)}</span>
      )}
      {!isConnected && onReconnect && (
        <button
          onClick={onReconnect}
          style={{
            marginLeft: '8px',
            padding: '4px 8px',
            borderRadius: '4px',
            backgroundColor: 'rgba(99, 102, 241, 0.2)',
            color: '#6366f1',
            border: 'none',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          重连
        </button>
      )}
    </div>
  );
}

export function PriceDisplay({ 
  value, 
  changePercent, 
  className = '',
  showChange = true 
}: { 
  value: string | number; 
  changePercent: string | number;
  className?: string;
  showChange?: boolean;
}) {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  const numChange = typeof changePercent === 'string' ? parseFloat(changePercent) : changePercent;
  const isPositive = numChange >= 0;
  
  const formattedPrice = numValue >= 1000 
    ? '$' + numValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '$' + numValue.toFixed(numValue < 1 ? 4 : 2);
    
  const formattedChange = (isPositive ? '+' : '') + numChange.toFixed(2) + '%';

  return (
    <div className={className}>
      <div className="text-lg font-bold">{formattedPrice}</div>
      {showChange && (
        <div className={isPositive ? 'text-green-400 text-sm' : 'text-red-400 text-sm'}>
          {formattedChange}
        </div>
      )}
    </div>
  );
}
