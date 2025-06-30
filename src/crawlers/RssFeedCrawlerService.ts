import { RssFeedApiService, RssFeedData, RssFeedItem } from '../services/RssFeedApiService';
import { KeywordService } from '../services/KeywordService';
import { OpenAIService } from '../services/OpenAIService';
import { RepositoryFactory } from '../repositories';
import { FeedSource } from '../entities/FeedSource';
import { FeedContent } from '../entities/FeedContent';
import { ContentType } from '../entities/KeywordContentLink';
import logger from '../config/logger';

export interface RssCrawlResult {
  sourceId: number;
  sourceName: string;
  success: boolean;
  articlesProcessed: number;
  newArticles: number;
  errors: string[];
  duration: number;
}

export class RssFeedCrawlerService {
  private feedSourceRepository = RepositoryFactory.getFeedSourceRepository();
  private feedContentRepository = RepositoryFactory.getFeedContentRepository();
  private rssFeedApiService = new RssFeedApiService();
  private keywordService = new KeywordService();
  private openAIService = new OpenAIService();

  async crawlAllFeeds(): Promise<RssCrawlResult[]> {
    const startTime = Date.now();
    logger.info('Starting RSS feed crawling for all sources');

    try {
      const sources = await this.feedSourceRepository.findSourcesDueForCrawling();
      logger.info(`Found ${sources.length} RSS sources due for crawling`);

      const results: RssCrawlResult[] = [];

      // Process sources concurrently but with a limit to avoid overwhelming
      const concurrency = 3;
      for (let i = 0; i < sources.length; i += concurrency) {
        const batch = sources.slice(i, i + concurrency);
        const batchResults = await Promise.all(
          batch.map(source => this.crawlFeedSource(source))
        );
        results.push(...batchResults);
      }

      const duration = Date.now() - startTime;
      const totalArticles = results.reduce((sum, r) => sum + r.articlesProcessed, 0);
      const totalNew = results.reduce((sum, r) => sum + r.newArticles, 0);
      const successful = results.filter(r => r.success).length;

      logger.info(`RSS crawling completed: ${successful}/${results.length} sources, ${totalNew}/${totalArticles} new articles in ${duration}ms`);

      return results;
    } catch (error: any) {
      logger.error('Error in crawlAllFeeds:', error.message);
      return [];
    }
  }

  async crawlFeedSource(source: FeedSource): Promise<RssCrawlResult> {
    const startTime = Date.now();
    const result: RssCrawlResult = {
      sourceId: source.id,
      sourceName: source.name,
      success: false,
      articlesProcessed: 0,
      newArticles: 0,
      errors: [],
      duration: 0
    };

    try {
      logger.info(`Crawling RSS feed: ${source.name} (${source.feedUrl})`);

      // Fetch feed data
      const feedResponse = await this.rssFeedApiService.fetchFeed(
        source.feedUrl,
        source.etag || undefined,
        source.lastModified || undefined
      );

      // Update crawl timestamp
      await this.feedSourceRepository.updateCrawlStatus(source.id, true);

      if (feedResponse.notModified) {
        logger.info(`Feed not modified: ${source.name}`);
        result.success = true;
        result.duration = Date.now() - startTime;
        return result;
      }

      if (!feedResponse.data) {
        throw new Error('No feed data received');
      }

      // Update source metadata
      await this.updateSourceMetadata(source, feedResponse.data, feedResponse.etag, feedResponse.lastModified);

      // Process feed items
      const processedItems = await this.processFeedItems(source.id, feedResponse.data.items);
      result.articlesProcessed = feedResponse.data.items.length;
      result.newArticles = processedItems.newArticles;

      // Update source statistics
      await this.updateSourceStatistics(source.id, processedItems.newArticles);

      result.success = true;
      logger.info(`Successfully crawled ${source.name}: ${result.newArticles}/${result.articlesProcessed} new articles`);

    } catch (error: any) {
      logger.error(`Error crawling RSS feed ${source.name}:`, error.message);
      result.errors.push(error.message);
      
      // Update source with error
      await this.feedSourceRepository.updateCrawlStatus(source.id, false, error.message);
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  private async updateSourceMetadata(
    source: FeedSource, 
    feedData: RssFeedData, 
    etag?: string, 
    lastModified?: string
  ): Promise<void> {
    try {
      source.description = feedData.description || source.description;
      source.language = feedData.language || source.language;
      source.etag = etag || source.etag;
      source.lastModified = lastModified || source.lastModified;

      await this.feedSourceRepository.update(source.id, source);
    } catch (error: any) {
      logger.error(`Error updating source metadata for ${source.name}:`, error.message);
    }
  }

  private async processFeedItems(sourceId: number, items: RssFeedItem[]): Promise<{
    processed: number;
    newArticles: number;
  }> {
    let processed = 0;
    let newArticles = 0;

    for (const item of items) {
      try {
        // Check if article already exists
        const existingContent = await this.feedContentRepository.findByGuid(item.guid);
        
        if (existingContent) {
          processed++;
          continue;
        }

        // Create new content
        const content = await this.createFeedContent(sourceId, item);
        
        if (content) {
          // Process keywords asynchronously
          this.processContentKeywordsAsync(content);
          
          newArticles++;
        }
        
        processed++;
      } catch (error: any) {
        logger.error(`Error processing feed item ${item.guid}:`, error.message);
        processed++;
      }
    }

    return { processed, newArticles };
  }

  private async createFeedContent(sourceId: number, item: RssFeedItem): Promise<FeedContent | null> {
    try {
      const content = await this.feedContentRepository.create({
        guid: item.guid,
        title: item.title,
        content: item.content,
        summary: item.summary,
        url: item.url,
        author: item.author,
        category: item.category,
                 tags: item.tags ? JSON.stringify(item.tags) : undefined,
        language: item.language,
        publishedAt: item.publishedAt,
        sourceId: sourceId,
        wordCount: 0,
        sentimentScore: 0.0,
        confidenceScore: 0.0,
        isAnalyzed: false
      });

      // Calculate word count
      content.calculateWordCount();
      content.category = content.categorizeContent();
      
      return await this.feedContentRepository.update(content.id, content);
    } catch (error: any) {
      logger.error(`Error creating feed content:`, error.message);
      return null;
    }
  }

  private async processContentKeywordsAsync(content: FeedContent): Promise<void> {
    try {
      // Don't await this to avoid blocking the crawling process
      setTimeout(async () => {
        try {
          // Analyze sentiment and extract keywords
          const analysisResult = await this.openAIService.analyzeSentiment(content.content);
          
          if (analysisResult) {
            // Update content with sentiment analysis
            await this.feedContentRepository.markAsAnalyzed(
              content.id,
              analysisResult.score,
              analysisResult.label,
              analysisResult.confidence,
              analysisResult.keywords
            );

            // Process keywords separately
            await this.keywordService.processContentKeywords(
              content.id,
              ContentType.FEED,
              content.content,
              content.title,
              analysisResult.score
            );

            logger.debug(`Processed keywords for feed content ${content.id}`);
          }
        } catch (error: any) {
          logger.error(`Error in async keyword processing for content ${content.id}:`, error.message);
        }
      }, 100); // Small delay to ensure the main process continues
    } catch (error: any) {
      logger.error(`Error setting up async keyword processing:`, error.message);
    }
  }

  private async updateSourceStatistics(sourceId: number, newArticlesCount: number): Promise<void> {
    try {
      if (newArticlesCount > 0) {
        await this.feedSourceRepository.incrementArticleCount(sourceId);
        
        // Update average sentiment after processing
        setTimeout(async () => {
          try {
            const averageSentiment = await this.feedContentRepository.getAverageSentimentBySource(sourceId);
            await this.feedSourceRepository.updateAverageSentiment(sourceId, averageSentiment);
          } catch (error: any) {
            logger.error(`Error updating average sentiment for source ${sourceId}:`, error.message);
          }
        }, 5000); // Delay to allow sentiment analysis to complete
      }
    } catch (error: any) {
      logger.error(`Error updating source statistics:`, error.message);
    }
  }

  async crawlFeedById(sourceId: number): Promise<RssCrawlResult> {
    try {
      const source = await this.feedSourceRepository.findById(sourceId);
      
      if (!source) {
        throw new Error(`Feed source with ID ${sourceId} not found`);
      }

      return await this.crawlFeedSource(source);
    } catch (error: any) {
      logger.error(`Error crawling feed by ID ${sourceId}:`, error.message);
      return {
        sourceId,
        sourceName: 'Unknown',
        success: false,
        articlesProcessed: 0,
        newArticles: 0,
        errors: [error.message],
        duration: 0
      };
    }
  }

  async discoverAndAddFeed(websiteUrl: string, name?: string): Promise<{
    success: boolean;
    feedsFound: number;
    feedsAdded: number;
    errors: string[];
  }> {
    const result = {
      success: false,
      feedsFound: 0,
      feedsAdded: 0,
      errors: [] as string[]
    };

    try {
      logger.info(`Discovering RSS feeds for: ${websiteUrl}`);
      
      const discoveredFeeds = await this.rssFeedApiService.discoverFeedUrls(websiteUrl);
      result.feedsFound = discoveredFeeds.length;

      if (discoveredFeeds.length === 0) {
        result.errors.push('No RSS feeds found on the website');
        return result;
      }

      for (const feedUrl of discoveredFeeds) {
        try {
          // Check if feed already exists
          const existingSource = await this.feedSourceRepository.findByFeedUrl(feedUrl);
          
          if (existingSource) {
            logger.info(`Feed already exists: ${feedUrl}`);
            continue;
          }

          // Test the feed first
          const testFeed = await this.rssFeedApiService.fetchFeed(feedUrl);
          
          if (!testFeed.data) {
            result.errors.push(`Invalid feed: ${feedUrl}`);
            continue;
          }

          // Create new feed source
          const sourceName = name || testFeed.data.title || new URL(websiteUrl).hostname;
          
          const newSource = await this.feedSourceRepository.create({
            feedUrl: feedUrl,
            name: sourceName,
            websiteUrl: websiteUrl,
            description: testFeed.data.description,
            language: testFeed.data.language,
            category: 'news', // Default category
            isActive: true,
            crawlIntervalMinutes: 60, // Default 1 hour
            etag: testFeed.etag,
            lastModified: testFeed.lastModified
          });

          logger.info(`Added new RSS feed source: ${sourceName} (${feedUrl})`);
          result.feedsAdded++;

        } catch (error: any) {
          logger.error(`Error adding feed ${feedUrl}:`, error.message);
          result.errors.push(`Error adding ${feedUrl}: ${error.message}`);
        }
      }

      result.success = result.feedsAdded > 0;
      
      return result;
    } catch (error: any) {
      logger.error(`Error discovering feeds for ${websiteUrl}:`, error.message);
      result.errors.push(error.message);
      return result;
    }
  }

  async getSourceHealthStatus(): Promise<{
    totalSources: number;
    activeSources: number;
    healthySources: number;
    unhealthySources: number;
    recentlyActive: number;
  }> {
    try {
      const totalSources = await this.feedSourceRepository.count();
      const activeSources = await this.feedSourceRepository.count({ where: { isActive: true } });
      const healthySources = await this.feedSourceRepository.getHealthySourcesCount();
      const unhealthySources = await this.feedSourceRepository.getUnhealthySourcesCount();

      // Sources active in last 24 hours
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const recentlyActive = await this.feedSourceRepository.count({
        where: {
          isActive: true,
          lastSuccessfulCrawlAt: { $gte: yesterday } as any
        }
      });

      return {
        totalSources,
        activeSources,
        healthySources,
        unhealthySources,
        recentlyActive
      };
    } catch (error: any) {
      logger.error('Error getting source health status:', error.message);
      return {
        totalSources: 0,
        activeSources: 0,
        healthySources: 0,
        unhealthySources: 0,
        recentlyActive: 0
      };
    }
  }
}