// API Services
export { RedditApiService } from './RedditApiService';
export { WordPressApiService } from './WordPressApiService';
export { BinanceApiService } from './BinanceApiService';
export { GreedFearIndexService } from './GreedFearIndexService';

// Type exports
export type { RedditPost, RedditComment } from './RedditApiService';
export type { WordPressPost, WordPressUser, WordPressCategory, WordPressTag } from './WordPressApiService';
export type { BinanceKline, BinanceTicker24hr, BinanceInterval } from './BinanceApiService';
export type { GreedFearData } from './GreedFearIndexService';

// Imports for internal use
import { RedditApiService } from './RedditApiService';
import { WordPressApiService } from './WordPressApiService';
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

  static clearInstances(): void {
    this.instances.clear();
  }
}