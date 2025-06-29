import { RedditCrawlerService, CrawlResult } from './RedditCrawlerService';
import { WordPressCrawlerService, WordPressCrawlResult } from './WordPressCrawlerService';
import { BinanceApiService } from '../services/BinanceApiService';
import { GreedFearIndexService } from '../services/GreedFearIndexService';
// import { logger } from '../config/logger';

export interface MasterCrawlResult {
  startTime: Date;
  endTime: Date;
  reddit: {
    totalSources: number;
    totalPosts: number;
    totalComments: number;
    totalUsers: number;
    errors: string[];
  };
  wordpress: {
    totalSources: number;
    totalPosts: number;
    totalUsers: number;
    errors: string[];
  };
  binance: {
    symbolsUpdated: number;
    errors: string[];
  };
  greedFear: {
    updated: boolean;
    currentValue?: number;
    errors: string[];
  };
  totalErrors: number;
  isSuccessful: boolean;
}

export class MasterCrawlerService {
  private redditCrawler: RedditCrawlerService;
  private wordpressCrawler: WordPressCrawlerService;
  private binanceService: BinanceApiService;
  private greedFearService: GreedFearIndexService;

  constructor() {
    this.redditCrawler = new RedditCrawlerService();
    this.wordpressCrawler = new WordPressCrawlerService();
    this.binanceService = new BinanceApiService();
    this.greedFearService = new GreedFearIndexService();
  }

  async runFullCrawl(): Promise<MasterCrawlResult> {
    const startTime = new Date();
    console.log('Starting full crawl cycle');

    const result: MasterCrawlResult = {
      startTime,
      endTime: new Date(),
      reddit: {
        totalSources: 0,
        totalPosts: 0,
        totalComments: 0,
        totalUsers: 0,
        errors: []
      },
      wordpress: {
        totalSources: 0,
        totalPosts: 0,
        totalUsers: 0,
        errors: []
      },
      binance: {
        symbolsUpdated: 0,
        errors: []
      },
      greedFear: {
        updated: false,
        errors: []
      },
      totalErrors: 0,
      isSuccessful: false
    };

    // Run all crawls in parallel for efficiency
    const [redditResults, wordpressResults, binanceResult, greedFearResult] = await Promise.allSettled([
      this.crawlReddit(),
      this.crawlWordPress(),
      this.updateBinanceData(),
      this.updateGreedFearIndex()
    ]);

    // Process Reddit results
    if (redditResults.status === 'fulfilled') {
      const redditData = redditResults.value;
      result.reddit.totalSources = redditData.length;
      result.reddit.totalPosts = redditData.reduce((sum, r) => sum + r.newPosts, 0);
      result.reddit.totalComments = redditData.reduce((sum, r) => sum + r.newComments, 0);
      result.reddit.totalUsers = redditData.reduce((sum, r) => sum + r.newUsers, 0);
      result.reddit.errors = redditData.flatMap(r => r.errors);
    } else {
      result.reddit.errors.push(redditResults.reason?.message || 'Reddit crawl failed');
    }

    // Process WordPress results
    if (wordpressResults.status === 'fulfilled') {
      const wpData = wordpressResults.value;
      result.wordpress.totalSources = wpData.length;
      result.wordpress.totalPosts = wpData.reduce((sum, r) => sum + r.newPosts, 0);
      result.wordpress.totalUsers = wpData.reduce((sum, r) => sum + r.newUsers, 0);
      result.wordpress.errors = wpData.flatMap(r => r.errors);
    } else {
      result.wordpress.errors.push(wordpressResults.reason?.message || 'WordPress crawl failed');
    }

    // Process Binance results
    if (binanceResult.status === 'fulfilled') {
      result.binance.symbolsUpdated = binanceResult.value;
    } else {
      result.binance.errors.push(binanceResult.reason?.message || 'Binance update failed');
    }

    // Process Greed & Fear results
    if (greedFearResult.status === 'fulfilled') {
      result.greedFear.updated = true;
      result.greedFear.currentValue = greedFearResult.value;
    } else {
      result.greedFear.errors.push(greedFearResult.reason?.message || 'Greed & Fear update failed');
    }

    // Calculate totals
    result.totalErrors = result.reddit.errors.length + result.wordpress.errors.length + 
                        result.binance.errors.length + result.greedFear.errors.length;
    result.isSuccessful = result.totalErrors === 0;
    result.endTime = new Date();

    const duration = result.endTime.getTime() - result.startTime.getTime();
    console.log(`Full crawl completed in ${duration}ms`, {
      redditPosts: result.reddit.totalPosts,
      redditComments: result.reddit.totalComments,
      wordpressPosts: result.wordpress.totalPosts,
      binanceSymbols: result.binance.symbolsUpdated,
      greedFearUpdated: result.greedFear.updated,
      totalErrors: result.totalErrors
    });

    return result;
  }

  private async crawlReddit(): Promise<CrawlResult[]> {
    try {
      console.log('Starting Reddit crawl');
      return await this.redditCrawler.crawlAllActiveSources();
    } catch (error) {
      console.error('Reddit crawl failed', error);
      throw error;
    }
  }

  private async crawlWordPress(): Promise<WordPressCrawlResult[]> {
    try {
      console.log('Starting WordPress crawl');
      return await this.wordpressCrawler.crawlAllActiveSources();
    } catch (error) {
      console.error('WordPress crawl failed', error);
      throw error;
    }
  }

  private async updateBinanceData(): Promise<number> {
    try {
      console.log('Starting Binance data update');
      
      // Get top trading pairs
      const topPairs = await this.binanceService.getTopVolumePairs('USDT', 50);
      
      // For now, we'll just return the count
      // In a real implementation, we'd store this data in a CandleStick entity
      console.log(`Updated ${topPairs.length} Binance trading pairs`);
      return topPairs.length;
    } catch (error) {
      console.error('Binance data update failed', error);
      throw error;
    }
  }

  private async updateGreedFearIndex(): Promise<number> {
    try {
      console.log('Starting Greed & Fear Index update');
      
      const currentIndex = await this.greedFearService.getCurrentIndex();
      const indexValue = parseInt(currentIndex.value);
      
      // In a real implementation, we'd store this in a GreedFearEntity
      console.log(`Updated Greed & Fear Index: ${indexValue} (${currentIndex.value_classification})`);
      return indexValue;
    } catch (error) {
      console.error('Greed & Fear Index update failed', error);
      throw error;
    }
  }

  // Quick status check
  async getOverallStatus(): Promise<{
    reddit: { isHealthy: boolean; activeSources: number; readyForCrawl: number };
    wordpress: { isHealthy: boolean; activeSources: number; readyForCrawl: number };
    binance: { isHealthy: boolean };
    greedFear: { isHealthy: boolean };
  }> {
    const [redditStatus, wordpressStatus, binanceStatus, greedFearStatus] = await Promise.allSettled([
      this.redditCrawler.getStatus(),
      this.wordpressCrawler.getStatus(),
      this.checkBinanceHealth(),
      this.checkGreedFearHealth()
    ]);

    return {
      reddit: redditStatus.status === 'fulfilled' ? 
        { isHealthy: redditStatus.value.isHealthy, activeSources: redditStatus.value.activeSources, readyForCrawl: redditStatus.value.sourcesReadyForCrawl } : 
        { isHealthy: false, activeSources: 0, readyForCrawl: 0 },
      wordpress: wordpressStatus.status === 'fulfilled' ? 
        { isHealthy: wordpressStatus.value.isHealthy, activeSources: wordpressStatus.value.activeSources, readyForCrawl: wordpressStatus.value.sourcesReadyForCrawl } : 
        { isHealthy: false, activeSources: 0, readyForCrawl: 0 },
      binance: binanceStatus.status === 'fulfilled' ? { isHealthy: binanceStatus.value } : { isHealthy: false },
      greedFear: greedFearStatus.status === 'fulfilled' ? { isHealthy: greedFearStatus.value } : { isHealthy: false }
    };
  }

  private async checkBinanceHealth(): Promise<boolean> {
    try {
      await this.binanceService.getCurrentPrice('BTCUSDT');
      return true;
    } catch {
      return false;
    }
  }

  private async checkGreedFearHealth(): Promise<boolean> {
    try {
      await this.greedFearService.getCurrentIndex();
      return true;
    } catch {
      return false;
    }
  }

  // Schedule methods for cron jobs
  async runLightCrawl(): Promise<Partial<MasterCrawlResult>> {
    console.log('Starting light crawl (Reddit + Greed&Fear only)');
    
    const [redditResults, greedFearResult] = await Promise.allSettled([
      this.crawlReddit(),
      this.updateGreedFearIndex()
    ]);

    const result: Partial<MasterCrawlResult> = {
      startTime: new Date(),
      reddit: {
        totalSources: 0,
        totalPosts: 0,
        totalComments: 0,
        totalUsers: 0,
        errors: []
      },
      greedFear: {
        updated: false,
        errors: []
      }
    };

    if (redditResults.status === 'fulfilled') {
      const redditData = redditResults.value;
      result.reddit!.totalSources = redditData.length;
      result.reddit!.totalPosts = redditData.reduce((sum, r) => sum + r.newPosts, 0);
      result.reddit!.totalComments = redditData.reduce((sum, r) => sum + r.newComments, 0);
      result.reddit!.totalUsers = redditData.reduce((sum, r) => sum + r.newUsers, 0);
      result.reddit!.errors = redditData.flatMap(r => r.errors);
    }

    if (greedFearResult.status === 'fulfilled') {
      result.greedFear!.updated = true;
      result.greedFear!.currentValue = greedFearResult.value;
    }

    result.endTime = new Date();
    return result;
  }

  async runMarketDataUpdate(): Promise<{ binance: number; greedFear: number }> {
    console.log('Starting market data update');
    
    const [binanceResult, greedFearResult] = await Promise.allSettled([
      this.updateBinanceData(),
      this.updateGreedFearIndex()
    ]);

    return {
      binance: binanceResult.status === 'fulfilled' ? binanceResult.value : 0,
      greedFear: greedFearResult.status === 'fulfilled' ? greedFearResult.value : 0
    };
  }
}