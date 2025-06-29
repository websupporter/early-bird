import { BaseRepository } from './BaseRepository';
import { WordPressSource } from '../entities/WordPressSource';

export class WordPressSourceRepository extends BaseRepository<WordPressSource> {
  constructor() {
    super(WordPressSource);
  }

  async findBySiteUrl(siteUrl: string): Promise<WordPressSource | null> {
    return await this.repository.findOne({ where: { siteUrl } });
  }

  async findActiveSources(): Promise<WordPressSource[]> {
    return await this.repository.find({ 
      where: { isActive: true },
      order: { siteName: 'ASC' }
    });
  }

  async findSourcesReadyForCrawl(): Promise<WordPressSource[]> {
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

  async updateLastCrawledAt(sourceId: number): Promise<WordPressSource | null> {
    const source = await this.findById(sourceId);
    if (!source) return null;

    source.lastCrawledAt = new Date();
    return await this.repository.save(source);
  }

  async updateCrawlStats(sourceId: number, newPostsCount: number, averageSentiment: number): Promise<WordPressSource | null> {
    const source = await this.findById(sourceId);
    if (!source) return null;

    source.totalPostsCrawled += newPostsCount;
    source.averageSentiment = averageSentiment;
    source.lastCrawledAt = new Date();

    return await this.repository.save(source);
  }

  async recordCrawlError(sourceId: number, error: string): Promise<WordPressSource | null> {
    const source = await this.findById(sourceId);
    if (!source) return null;

    source.recordCrawlError(error);
    return await this.repository.save(source);
  }

  async updateReliabilityScore(sourceId: number, correctPredictions: number, totalPredictions: number): Promise<WordPressSource | null> {
    const source = await this.findById(sourceId);
    if (!source) return null;

    source.updateReliabilityScore(correctPredictions, totalPredictions);
    return await this.repository.save(source);
  }

  async deactivateSource(sourceId: number): Promise<boolean> {
    const result = await this.repository.update(sourceId, { isActive: false });
    return result.affected !== null && result.affected !== undefined && result.affected > 0;
  }

  async reactivateSource(sourceId: number): Promise<boolean> {
    const result = await this.repository.update(sourceId, { isActive: true });
    return result.affected !== null && result.affected !== undefined && result.affected > 0;
  }

  async updateCrawlInterval(sourceId: number, intervalHours: number): Promise<WordPressSource | null> {
    const result = await this.repository.update(sourceId, { crawlIntervalHours: intervalHours });
    if (result.affected === 0) return null;
    
    return await this.findById(sourceId);
  }

  async findTopReliableSources(limit: number = 10): Promise<WordPressSource[]> {
    return await this.repository.find({
      where: { isActive: true },
      order: { reliabilityScore: 'DESC' },
      take: limit
    });
  }

  async existsBySiteUrl(siteUrl: string): Promise<boolean> {
    return await super.exists({ siteUrl });
  }

  async updateApiKey(sourceId: number, apiKey: string): Promise<WordPressSource | null> {
    const result = await this.repository.update(sourceId, { apiKey });
    if (result.affected === 0) return null;
    
    return await this.findById(sourceId);
  }

  async findSourcesWithCategories(categories: string[]): Promise<WordPressSource[]> {
    return await this.repository
      .createQueryBuilder('source')
      .where('source.isActive = true')
      .andWhere(
        categories.map((_, index) => 
          `JSON_CONTAINS(source.allowedCategories, :category${index})`
        ).join(' OR '),
        Object.fromEntries(
          categories.map((cat, index) => [`category${index}`, JSON.stringify(cat)])
        )
      )
      .getMany();
  }
}