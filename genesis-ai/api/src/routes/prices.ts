import { Router } from "express";
import { getPrice, getPrices, getAllPrices, getCachedPrice, getAllCachedPrices, startPriceUpdates, PriceData } from "../services/price-service";

const router = Router();

startPriceUpdates(3000);

// GET /api/v1/prices - 获取所有支持资产的价格
router.get("/", async (req, res) => {
  try {
    const symbols = req.query.symbols as string;
    let prices: PriceData[];

    if (symbols) {
      const priceMap = await getPrices(symbols.split(","));
      prices = Array.from(priceMap.values());
    } else {
      prices = await getAllPrices();
    }

    res.json({ success: true, data: { prices, timestamp: Date.now() } });
  } catch (error) {
    const cached = getAllCachedPrices();
    res.json({ success: true, data: { prices: cached, timestamp: Date.now(), cached: true } });
  }
});

// GET /api/v1/prices/synthetic/:symbol - 获取合成资产价格
router.get("/synthetic/:symbol", async (req, res) => {
  const { symbol } = req.params;
  const price = await getPrice(`s${symbol.toUpperCase()}`) || getCachedPrice(`s${symbol.toUpperCase()}`);

  if (!price) {
    res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: `Synthetic asset not found: ${symbol}` } });
    return;
  }

  res.json({
    success: true,
    data: { symbol: symbol.toUpperCase(), price: price.price, change24h: price.change24h, changePercent24h: price.changePercent24h, source: price.source, timestamp: price.timestamp }
  });
});

// GET /api/v1/prices/:symbol - 获取单个资产价格
router.get("/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;
    const upperSymbol = symbol.toUpperCase();
    // 自动添加 s 前缀
    const fullSymbol = upperSymbol.startsWith("S") ? upperSymbol : `s${upperSymbol}`;
    let price = await getPrice(fullSymbol);
    if (!price) { const cached = getCachedPrice(fullSymbol); if (cached) price = cached; }

    if (!price) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: `Price not found for symbol: ${symbol}` } });
      return;
    }

    res.json({ success: true, data: { price } });
  } catch (error) {
    const upperSymbol = req.params.symbol.toUpperCase();
    const fullSymbol = upperSymbol.startsWith("S") ? upperSymbol : `s${upperSymbol}`;
    const cached = getCachedPrice(fullSymbol);
    if (cached) {
      res.json({ success: true, data: { price: cached, cached: true } });
      return;
    }
    res.status(500).json({ success: false, error: { code: "FETCH_ERROR", message: (error as Error).message } });
  }
});

// POST /api/v1/prices/portfolio - 获取投资组合价格
router.post("/portfolio", async (req, res) => {
  try {
    const { assets } = req.body;
    if (!assets || !Array.isArray(assets)) {
      res.status(400).json({ success: false, error: { code: "INVALID_REQUEST", message: "assets array required" } });
      return;
    }

    const symbols = assets.map((a: any) => a.symbol);
    const priceMap = await getPrices(symbols);

    const portfolio = assets.map((asset: any) => {
      const price = priceMap.get(asset.symbol);
      return { symbol: asset.symbol, amount: asset.amount, price: price?.price || 0, value: (price?.price || 0) * asset.amount, change24h: price?.change24h || 0, source: price?.source || "unknown" };
    });

    res.json({ success: true, data: { portfolio, totalValue: portfolio.reduce((sum: number, p: any) => sum + p.value, 0), timestamp: Date.now() } });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: "FETCH_ERROR", message: (error as Error).message } });
  }
});

export default router;
