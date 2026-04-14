/**
 * Genesis AI 价格服务
 * 支持: Binance (实时), CoinGecko (免费), 测试/模拟数据
 * 更新频率: 秒级
 */

// 价格缓存
const priceCache: Map<string, PriceData> = new Map();
const lastUpdate: Map<string, number> = new Map();

// 是否为测试环境
const IS_TEST = process.env.NODE_ENV === "test" || process.env.PRICE_TEST_MODE === "true";

// 测试/模拟数据
const MOCK_PRICES: Record<string, PriceData> = {
  "sBTC": { symbol: "sBTC", price: 67542.30, change24h: 1245.50, changePercent24h: 1.88, high24h: 68200, low24h: 66100, volume24h: 28500000000, timestamp: Date.now(), source: "mock" },
  "sETH": { symbol: "sETH", price: 3456.78, change24h: 45.32, changePercent24h: 1.33, high24h: 3512, low24h: 3401, volume24h: 15200000000, timestamp: Date.now(), source: "mock" },
  "sSOL": { symbol: "sSOL", price: 142.56, change24h: -2.34, changePercent24h: -1.62, high24h: 147, low24h: 140.5, volume24h: 2100000000, timestamp: Date.now(), source: "mock" },
  "sXAU": { symbol: "sXAU", price: 2314.50, change24h: 12.30, changePercent24h: 0.53, high24h: 2328, low24h: 2298, volume24h: 85000000000, timestamp: Date.now(), source: "mock" },
  "sXAG": { symbol: "sXAG", price: 27.45, change24h: -0.23, changePercent24h: -0.83, high24h: 27.89, low24h: 27.12, volume24h: 450000000, timestamp: Date.now(), source: "mock" },
  "sTSLA": { symbol: "sTSLA", price: 245.67, change24h: 5.43, changePercent24h: 2.26, high24h: 248, low24h: 239.5, volume24h: 85000000, timestamp: Date.now(), source: "mock" },
  "sAAPL": { symbol: "sAAPL", price: 178.32, change24h: 1.87, changePercent24h: 1.06, high24h: 179.5, low24h: 176.2, volume24h: 62000000, timestamp: Date.now(), source: "mock" },
  "sNVDA": { symbol: "sNVDA", price: 875.42, change24h: 23.56, changePercent24h: 2.77, high24h: 882, low24h: 851, volume24h: 45000000, timestamp: Date.now(), source: "mock" },
  "sGOOGL": { symbol: "sGOOGL", price: 142.35, change24h: -0.87, changePercent24h: -0.61, high24h: 144, low24h: 141.5, volume24h: 28000000, timestamp: Date.now(), source: "mock" },
  "sAMZN": { symbol: "sAMZN", price: 185.67, change24h: 2.15, changePercent24h: 1.17, high24h: 187, low24h: 183, volume24h: 35000000, timestamp: Date.now(), source: "mock" }
};

export interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  timestamp: number;
  source: string;
}

// Binance API 响应类型
interface BinanceTickerResponse {
  symbol?: string;
  code?: string;
  lastPrice: string;
  priceChange: string;
  priceChangePercent: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
}

// CoinGecko API 响应类型
interface CoinGeckoPriceResponse {
  [coinId: string]: {
    usd: number;
    usd_24h_change?: number;
  };
}

interface SymbolMapping {
  binance: string;
  coingecko: string;
}

const SYMBOL_MAP: Record<string, SymbolMapping> = {
  "sBTC": { binance: "btcusdt", coingecko: "bitcoin" },
  "sETH": { binance: "ethusdt", coingecko: "ethereum" },
  "sSOL": { binance: "solusdt", coingecko: "solana" },
  "sXAU": { binance: "xauusd", coingecko: "gold" },
  "sXAG": { binance: "xagusd", coingecko: "silver" },
  "sTSLA": { binance: "tsla", coingecko: "tesla" },
  "sAAPL": { binance: "aapl", coingecko: "apple" },
  "sNVDA": { binance: "nvda", coingecko: "nvidia" },
  "sGOOGL": { binance: "googl", coingecko: "alphabet" },
  "sAMZN": { binance: "amzn", coingecko: "amazon" },
};

// HTTP 错误类型
class HttpError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = "HttpError";
  }
}

async function httpGet<T>(url: string, timeoutMs: number = 5000): Promise<T> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") 
      ? (require("https") as typeof import("https"))
      : (require("http") as typeof import("http"));
    
    const req = client.get(url, (res: import("http").IncomingMessage) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 200) {
        reject(new HttpError(`HTTP ${res.statusCode}`, res.statusCode));
        return;
      }

      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => chunks.push(chunk));
      res.on("end", () => {
        const data = Buffer.concat(chunks).toString("utf8");
        try {
          resolve(JSON.parse(data) as T);
        } catch {
          reject(new Error("Invalid JSON response"));
        }
      });
    });

    req.on("error", (err) => reject(err));
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });
  });
}

async function fetchFromBinance(symbol: string): Promise<PriceData | null> {
  try {
    const mapping = SYMBOL_MAP[symbol];
    if (!mapping) return null;
    
    const url = `https://api.binance.com/api/v3/ticker/24hr?symbol=${mapping.binance.toUpperCase()}`;
    const data = await httpGet<BinanceTickerResponse>(url);
    
    if (data.code || !data.lastPrice) return null;
    
    const price = parseFloat(data.lastPrice);
    const changePercent = parseFloat(data.priceChangePercent);
    
    return {
      symbol,
      price,
      change24h: parseFloat(data.priceChange),
      changePercent24h: changePercent,
      high24h: parseFloat(data.highPrice),
      low24h: parseFloat(data.lowPrice),
      volume24h: parseFloat(data.volume),
      timestamp: Date.now(),
      source: "binance"
    };
  } catch (error) {
    console.warn(`Binance fetch failed for ${symbol}:`, error instanceof Error ? error.message : "Unknown error");
    return null;
  }
}

async function fetchFromCoinGecko(symbol: string): Promise<PriceData | null> {
  try {
    const cgId = SYMBOL_MAP[symbol]?.coingecko;
    if (!cgId) return null;
    
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${cgId}&vs_currencies=usd&include_24hr_change=true`;
    const data = await httpGet<CoinGeckoPriceResponse>(url);
    
    const coinData = data[cgId];
    if (!coinData?.usd) return null;
    
    const price = coinData.usd;
    const changePercent = coinData.usd_24h_change || 0;
    
    return {
      symbol,
      price,
      change24h: price * (changePercent / 100),
      changePercent24h: changePercent,
      high24h: price * 1.02,
      low24h: price * 0.98,
      volume24h: 0,
      timestamp: Date.now(),
      source: "coingecko"
    };
  } catch (error) {
    console.warn(`CoinGecko fetch failed for ${symbol}:`, error instanceof Error ? error.message : "Unknown error");
    return null;
  }
}

export async function getPrice(symbol: string): Promise<PriceData | null> {
  // 测试模式：返回模拟数据
  if (IS_TEST) {
    const mockData = MOCK_PRICES[symbol];
    if (mockData) {
      // 添加小幅随机波动模拟真实价格
      const randomFactor = 1 + (Math.random() - 0.5) * 0.001;
      const price: PriceData = {
        ...mockData,
        price: mockData.price * randomFactor,
        timestamp: Date.now()
      };
      priceCache.set(symbol, price);
      return price;
    }
    return null;
  }

  // 优先从 Binance 获取
  let price = await fetchFromBinance(symbol);
  
  // 降级到 CoinGecko
  if (!price) {
    price = await fetchFromCoinGecko(symbol);
  }
  
  if (price) {
    priceCache.set(symbol, price);
    lastUpdate.set(symbol, Date.now());
  }
  
  return price;
}

export async function getPrices(symbols: string[]): Promise<Map<string, PriceData>> {
  const results = new Map<string, PriceData>();
  
  // 并行获取所有价格
  const pricePromises = symbols.map(async (symbol) => {
    const price = await getPrice(symbol);
    if (price) {
      results.set(symbol, price);
    }
  });
  
  await Promise.all(pricePromises);
  return results;
}

export async function getAllPrices(): Promise<PriceData[]> {
  const prices = await getPrices(Object.keys(SYMBOL_MAP));
  return Array.from(prices.values());
}

export function getCachedPrice(symbol: string): PriceData | undefined {
  return priceCache.get(symbol);
}

export function getAllCachedPrices(): PriceData[] {
  return Array.from(priceCache.values());
}

export function getLastUpdateTime(symbol: string): number | undefined {
  return lastUpdate.get(symbol);
}

let updateInterval: ReturnType<typeof setInterval> | null = null;

export function startPriceUpdates(intervalMs: number = 3000): void {
  if (updateInterval) {
    clearInterval(updateInterval);
  }
  
  // 初始加载
  getAllPrices().catch((err) => {
    console.error("Initial price fetch failed:", err instanceof Error ? err.message : "Unknown error");
  });
  
  // 定时更新
  updateInterval = setInterval(async () => {
    try {
      await getAllPrices();
    } catch (err) {
      console.error("Price update failed:", err instanceof Error ? err.message : "Unknown error");
    }
  }, intervalMs);
  
  console.log(`✅ 价格服务启动 (${IS_TEST ? "模拟模式" : "实盘模式"}, ${intervalMs}ms)`);
}

export function stopPriceUpdates(): void {
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
    console.log("价格服务已停止");
  }
}
