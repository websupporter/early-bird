import { BaseRepository } from './BaseRepository';
import { RedditSource } from '../entities/RedditSource';

export class RedditSourceRepository extends BaseRepository<RedditSource> {
  constructor() {
    super(RedditSource);
  }

  async findBySubredditName(subredditName: string): Promise<RedditSource | null> {
    return await this.repository.findOne({ where: { subredditName } });
  }

  async findActiveSources(): Promise<RedditSource[]> {
    return await this.repository.find({ 
      where: { isActive: true },
      order: { subredditName: 'ASC' }
    });
  }

  async findSourcesReadyForCrawl(): Promise<RedditSource[]> {
    const now = new Date();
    
    return await this.repository
      .createQueryBuilder('source')
      .where('source.isActive = true')
      .andWhere(
        '(source.lastCrawledAt IS NULL OR DATE_ADD(source.lastCrawledAt, INTERVAL source.crawlIntervalHours HOUR) <= :now)',
        { now }
      )
      .orderBy('source.lastCrawledAt', 'ASC')
      .getMany();
  }

  async updateLastCrawledAt(sourceId: number): Promise<RedditSource | null> {
    const source = await this.findById(sourceId);
    if (!source) return null;

    source.lastCrawledAt = new Date();
    return await this.repository.save(source);
  }

  async updateCrawlStats(sourceId: number, newPostsCount: number, averageSentiment: number): Promise<RedditSource | null> {
    const source = await this.findById(sourceId);
    if (!source) return null;

    source.totalPostsCrawled += newPostsCount;
    source.averageSentiment = averageSentiment;
    source.lastCrawledAt = new Date();

    return await this.repository.save(source);
  }

  async recordCrawlError(sourceId: number, error: string): Promise<RedditSource | null> {
    const source = await this.findById(sourceId);
    if (!source) return null;

    source.recordCrawlError(error);
    return await this.repository.save(source);
  }

  async updateReliabilityScore(sourceId: number, correctPredictions: number, totalPredictions: number): Promise<RedditSource | null> {
    const source = await this.findById(sourceId);
    if (!source) return null;

    source.updateReliabilityScore(correctPredictions, totalPredictions);
    return await this.repository.save(source);
  }

  async deactivateSource(sourceId: number): Promise<boolean> {
    const result = await this.repository.update(sourceId, { isActive: false });
    return result.affected !== undefined && result.affected > 0;
  }

  async reactivateSource(sourceId: number): Promise<boolean> {
    const result = await this.repository.update(sourceId, { isActive: true });
    return result.affected !== undefined && result.affected > 0;
  }

  async updateCrawlInterval(sourceId: number, intervalHours: number): Promise<RedditSource | null> {
    const result = await this.repository.update(sourceId, { crawlIntervalHours: intervalHours });
    if (result.affected === 0) return null;
    
    return await this.findById(sourceId);
  }

  async findTopReliableSources(limit: number = 10): Promise<RedditSource[]> {
    return await this.repository.find({
      where: { isActive: true },
      order: { reliabilityScore: 'DESC' },
      take: limit
    });
  }

  async existsBySubredditName(subredditName: string): Promise<boolean> {
    return await super.exists({ subredditName });
  }
}