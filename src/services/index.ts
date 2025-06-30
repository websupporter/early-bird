// API Services
export { RedditApiService } from './RedditApiService';
export { WordPressApiService } from './WordPressApiService';
export { RssFeedApiService } from './RssFeedApiService';
export { KeywordService } from './KeywordService';
export { BinanceApiService } from './BinanceApiService';
export { GreedFearIndexService } from './GreedFearIndexService';

// Type exports
export type { RedditPost, RedditComment } from './RedditApiService';
export type { WordPressPost, WordPressUser, WordPressCategory, WordPressTag } from './WordPressApiService';
export type { RssFeedItem, RssFeedData } from './RssFeedApiService';
export type { KeywordAnalysisResult, ContentKeywordLink } from './KeywordService';
export type { BinanceKline, BinanceTicker24hr, BinanceInterval } from './BinanceApiService';
export type { GreedFearData } from './GreedFearIndexService';

// Imports for internal use
import { RedditApiService } from './RedditApiService';
import { WordPressApiService } from './WordPressApiService';
import { RssFeedApiService } from './RssFeedApiService';
import { KeywordService } from './KeywordService';
import { BinanceApiService } from './BinanceApiService';
import { GreedFearIndexService } from './GreedFearIndexService';

// Service Factory
export class ServiceFactory {
  private static instances: Map<string, any> = new Map();

  static getRedditApiService(): RedditApiService {
    if (!this.instances.has('RedditApiService')) {
      this.instances.set('RedditApiService', new RedditApiService());
    }
    return this.instances.get('RedditApiService');
  }

  static getWordPressApiService(siteUrl: string, apiKey?: string): WordPressApiService {
    const key = `WordPressApiService_${siteUrl}`;
    if (!this.instances.has(key)) {
      this.instances.set(key, new WordPressApiService(siteUrl, apiKey));
    }
    return this.instances.get(key);
  }

  static getBinanceApiService(): BinanceApiService {
    if (!this.instances.has('BinanceApiService')) {
      this.instances.set('BinanceApiService', new BinanceApiService());
    }
    return this.instances.get('BinanceApiService');
  }

  static getGreedFearIndexService(): GreedFearIndexService {
    if (!this.instances.has('GreedFearIndexService')) {
      this.instances.set('GreedFearIndexService', new GreedFearIndexService());
    }
    return this.instances.get('GreedFearIndexService');
  }

  static getRssFeedApiService(): RssFeedApiService {
    if (!this.instances.has('RssFeedApiService')) {
      this.instances.set('RssFeedApiService', new RssFeedApiService());
    }
    return this.instances.get('RssFeedApiService');
  }

  static getKeywordService(): KeywordService {
    if (!this.instances.has('KeywordService')) {
      this.instances.set('KeywordService', new KeywordService());
    }
    return this.instances.get('KeywordService');
  }

  static clearInstances(): void {
    this.instances.clear();
  }
}