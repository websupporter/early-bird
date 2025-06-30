import { BaseRepository } from './BaseRepository';
import { FeedSource } from '../entities/FeedSource';

export class FeedSourceRepository extends BaseRepository<FeedSource> {
  constructor() {
    super(FeedSource);
  }

  async findByFeedUrl(feedUrl: string): Promise<FeedSource | null> {
    return await this.repository.findOne({ where: { feedUrl } });
  }

  async findActiveSources(): Promise<FeedSource[]> {
    return await this.repository.find({
      where: { isActive: true },
      order: { name: 'ASC' }
    });
  }

  async findSourcesDueForCrawling(): Promise<FeedSource[]> {
    const now = new Date();
    
    return await this.repository
      .createQueryBuilder('source')
      .where('source.isActive = :isActive', { isActive: true })
      .andWhere('source.consecutiveFailures <= :maxFailures', { maxFailures: 5 })
      .andWhere(
        '(source.lastCrawledAt IS NULL OR TIMESTAMPDIFF(MINUTE, source.lastCrawledAt, :now) >= source.crawlIntervalMinutes)',
        { now }
      )
      .orderBy('source.lastCrawledAt', 'ASC')
      .getMany();
  }

  async findByCategory(category: string): Promise<FeedSource[]> {
    return await this.repository.find({
      where: { category, isActive: true },
      order: { name: 'ASC' }
    });
  }

  async findByLanguage(language: string): Promise<FeedSource[]> {
    return await this.repository.find({
      where: { language, isActive: true },
      order: { name: 'ASC' }
    });
  }

  async updateCrawlStatus(sourceId: number, success: boolean, error?: string): Promise<FeedSource | null> {
    const source = await this.findById(sourceId);
    if (!source) return null;

    source.lastCrawledAt = new Date();
    
    if (success) {
      source.recordSuccessfulCrawl();
    } else if (error) {
      source.recordCrawlError(error);
    }

    return await this.repository.save(source);
  }

  async updateAverageSentiment(sourceId: number, sentiment: number): Promise<FeedSource | null> {
    const source = await this.findById(sourceId);
    if (!source) return null;

    source.averageSentiment = sentiment;
    return await this.repository.save(source);
  }

  async incrementArticleCount(sourceId: number): Promise<FeedSource | null> {
    const source = await this.findById(sourceId);
    if (!source) return null;

    source.totalArticlesCrawled++;
    return await this.repository.save(source);
  }

  async getHealthySourcesCount(): Promise<number> {
    return await this.repository.count({
      where: { isActive: true, consecutiveFailures: 0 }
    });
  }

  async getUnhealthySourcesCount(): Promise<number> {
    return await this.repository
      .createQueryBuilder('source')
      .where('source.isActive = :isActive', { isActive: true })
      .andWhere('source.consecutiveFailures > :minFailures', { minFailures: 3 })
      .getCount();
  }

  async existsByFeedUrl(feedUrl: string): Promise<boolean> {
    return await super.exists({ feedUrl });
  }

  async resetFailedSources(): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .update(FeedSource)
      .set({ consecutiveFailures: 0 })
      .where('consecutiveFailures > :threshold', { threshold: 0 })
      .execute();
  }

  async deactivateFailedSources(threshold: number = 10): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .update(FeedSource)
      .set({ isActive: false })
      .where('consecutiveFailures >= :threshold', { threshold })
      .execute();
  }
}