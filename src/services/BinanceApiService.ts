import axios, { AxiosInstance } from 'axios';

export interface BinanceKline {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteAssetVolume: string;
  numberOfTrades: number;
  takerBuyBaseAssetVolume: string;
  takerBuyQuoteAssetVolume: string;
}

export interface BinanceTicker24hr {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  lastPrice: string;
  lastQty: string;
  bidPrice: string;
  bidQty: string;
  askPrice: string;
  askQty: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  firstId: number;
  lastId: number;
  count: number;
}

export interface BinanceSymbolInfo {
  symbol: string;
  status: string;
  baseAsset: string;
  baseAssetPrecision: number;
  quoteAsset: string;
  quotePrecision: number;
  quoteAssetPrecision: number;
  orderTypes: string[];
  icebergAllowed: boolean;
  ocoAllowed: boolean;
  isSpotTradingAllowed: boolean;
  isMarginTradingAllowed: boolean;
  filters: Array<{
    filterType: string;
    minPrice?: string;
    maxPrice?: string;
    tickSize?: string;
    minQty?: string;
    maxQty?: string;
    stepSize?: string;
    limit?: number;
    minNotional?: string;
    applyToMarket?: boolean;
    avgPriceMins?: number;
  }>;
}

export type BinanceInterval = 
  | '1s' | '1m' | '3m' | '5m' | '15m' | '30m' | '1h' | '2h' | '4h' | '6h' | '8h' | '12h' 
  | '1d' | '3d' | '1w' | '1M';

export class BinanceApiService {
  private client: AxiosInstance;
  private baseUrl = 'https://api.binance.com';

  constructor() {
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CryptoTraders Bot v1.0'
      }
    });
  }

  async getKlines(
    symbol: string,
    interval: BinanceInterval,
    startTime?: number,
    endTime?: number,
    limit: number = 500
  ): Promise<BinanceKline[]> {
    try {
      const params: any = {
        symbol: symbol.toUpperCase(),
        interval,
        limit
      };

      if (startTime) params.startTime = startTime;
      if (endTime) params.endTime = endTime;

      const response = await this.client.get('/api/v3/klines', { params });
      
      return response.data.map((kline: any[]) => ({
        openTime: kline[0],
        open: kline[1],
        high: kline[2],
        low: kline[3],
        close: kline[4],
        volume: kline[5],
        closeTime: kline[6],
        quoteAssetVolume: kline[7],
        numberOfTrades: kline[8],
        takerBuyBaseAssetVolume: kline[9],
        takerBuyQuoteAssetVolume: kline[10]
      }));
    } catch (error) {
      console.error(`Error fetching klines for ${symbol}:`, error);
      throw new Error(`Failed to fetch klines for ${symbol}: ${axios.isAxiosError(error) ? error.message : 'Unknown error'}`);
    }
  }

  async get24hrTicker(symbol?: string): Promise<BinanceTicker24hr | BinanceTicker24hr[]> {
    try {
      const params: any = {};
      if (symbol) params.symbol = symbol.toUpperCase();

      const response = await this.client.get('/api/v3/ticker/24hr', { params });
      return response.data;
    } catch (error) {
      console.error(`Error fetching 24hr ticker for ${symbol || 'all symbols'}:`, error);
      throw new Error(`Failed to fetch 24hr ticker: ${axios.isAxiosError(error) ? error.message : 'Unknown error'}`);
    }
  }

  async getCurrentPrice(symbol: string): Promise<{ symbol: string; price: string }> {
    try {
      const response = await this.client.get('/api/v3/ticker/price', {
        params: { symbol: symbol.toUpperCase() }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching current price for ${symbol}:`, error);
      throw new Error(`Failed to fetch current price for ${symbol}: ${axios.isAxiosError(error) ? error.message : 'Unknown error'}`);
    }
  }

  async getExchangeInfo(): Promise<{
    timezone: string;
    serverTime: number;
    symbols: BinanceSymbolInfo[];
  }> {
    try {
      const response = await this.client.get('/api/v3/exchangeInfo');
      return response.data;
    } catch (error) {
      console.error('Error fetching exchange info:', error);
      throw new Error(`Failed to fetch exchange info: ${axios.isAxiosError(error) ? error.message : 'Unknown error'}`);
    }
  }

  async getSymbolInfo(symbol: string): Promise<BinanceSymbolInfo | null> {
    try {
      const exchangeInfo = await this.getExchangeInfo();
      return exchangeInfo.symbols.find(s => s.symbol === symbol.toUpperCase()) || null;
    } catch (error) {
      console.error(`Error fetching symbol info for ${symbol}:`, error);
      return null;
    }
  }

  async getCryptoSymbols(): Promise<string[]> {
    try {
      const exchangeInfo = await this.getExchangeInfo();
      return exchangeInfo.symbols
        .filter(symbol => 
          symbol.status === 'TRADING' && 
          symbol.isSpotTradingAllowed &&
          (symbol.quoteAsset === 'USDT' || symbol.quoteAsset === 'BUSD' || symbol.quoteAsset === 'USDC')
        )
        .map(symbol => symbol.symbol)
        .sort();
    } catch (error) {
      console.error('Error fetching crypto symbols:', error);
      throw new Error(`Failed to fetch crypto symbols: ${axios.isAxiosError(error) ? error.message : 'Unknown error'}`);
    }
  }

  async getTopVolumePairs(quoteAsset: string = 'USDT', limit: number = 20): Promise<BinanceTicker24hr[]> {
    try {
      const tickers = await this.get24hrTicker() as BinanceTicker24hr[];
      
      return tickers
        .filter(ticker => ticker.symbol.endsWith(quoteAsset))
        .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
        .slice(0, limit);
    } catch (error) {
      console.error(`Error fetching top volume pairs for ${quoteAsset}:`, error);
      throw new Error(`Failed to fetch top volume pairs: ${axios.isAxiosError(error) ? error.message : 'Unknown error'}`);
    }
  }

  async getRecentKlines(symbol: string, interval: BinanceInterval, limit: number = 100): Promise<BinanceKline[]> {
    return await this.getKlines(symbol, interval, undefined, undefined, limit);
  }

  async getHistoricalKlines(
    symbol: string,
    interval: BinanceInterval,
    startTime: Date,
    endTime?: Date,
    limit: number = 1000
  ): Promise<BinanceKline[]> {
    const start = startTime.getTime();
    const end = endTime ? endTime.getTime() : Date.now();
    
    return await this.getKlines(symbol, interval, start, end, limit);
  }

  // Helper method to convert interval to milliseconds
  intervalToMs(interval: BinanceInterval): number {
    const intervals: Record<BinanceInterval, number> = {
      '1s': 1000,
      '1m': 60000,
      '3m': 180000,
      '5m': 300000,
      '15m': 900000,
      '30m': 1800000,
      '1h': 3600000,
      '2h': 7200000,
      '4h': 14400000,
      '6h': 21600000,
      '8h': 28800000,
      '12h': 43200000,
      '1d': 86400000,
      '3d': 259200000,
      '1w': 604800000,
      '1M': 2592000000
    };
    return intervals[interval];
  }

  // Calculate price change percentage
  calculatePriceChange(oldPrice: string, newPrice: string): number {
    const old = parseFloat(oldPrice);
    const current = parseFloat(newPrice);
    return ((current - old) / old) * 100;
  }

  // Convert Binance kline to OHLCV format
  klineToOHLCV(kline: BinanceKline): {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  } {
    return {
      timestamp: kline.openTime,
      open: parseFloat(kline.open),
      high: parseFloat(kline.high),
      low: parseFloat(kline.low),
      close: parseFloat(kline.close),
      volume: parseFloat(kline.volume)
    };
  }

  // Batch processing for multiple symbols
  async batchGetTickers(symbols: string[]): Promise<BinanceTicker24hr[]> {
    const results: BinanceTicker24hr[] = [];
    const batchSize = 10;
    
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(symbol => this.get24hrTicker(symbol))
      );
      
      for (const result of batchResults) {
        if (result.status === 'fulfilled' && !Array.isArray(result.value)) {
          results.push(result.value);
        }
      }
      
      // Rate limiting delay
      if (i + batchSize < symbols.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }
}