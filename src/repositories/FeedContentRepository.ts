import { BaseRepository } from './BaseRepository';
import { FeedContent } from '../entities/FeedContent';

export class FeedContentRepository extends BaseRepository<FeedContent> {
  constructor() {
    super(FeedContent);
  }

  async findByGuid(guid: string): Promise<FeedContent | null> {
    return await this.repository.findOne({ where: { guid } });
  }

  async findBySourceId(sourceId: number, limit: number = 100): Promise<FeedContent[]> {
    return await this.repository.find({
      where: { sourceId },
      order: { publishedAt: 'DESC' },
      take: limit,
      relations: ['source']
    });
  }

  async findUnanalyzedContent(limit: number = 50): Promise<FeedContent[]> {
    return await this.repository.find({
      where: { isAnalyzed: false },
      order: { publishedAt: 'ASC' },
      take: limit,
      relations: ['source']
    });
  }

  async findByDateRange(startDate: Date, endDate: Date, sourceId?: number): Promise<FeedContent[]> {
    const queryBuilder = this.repository.createQueryBuilder('content')
      .leftJoinAndSelect('content.source', 'source')
      .where('content.publishedAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .orderBy('content.publishedAt', 'DESC');

    if (sourceId) {
      queryBuilder.andWhere('content.sourceId = :sourceId', { sourceId });
    }

    return await queryBuilder.getMany();
  }

  async findBySentimentScore(minScore: number, maxScore: number = 1.0, limit: number = 50): Promise<FeedContent[]> {
    return await this.repository
      .createQueryBuilder('content')
      .leftJoinAndSelect('content.source', 'source')
      .where('content.sentimentScore >= :minScore', { minScore })
      .andWhere('content.sentimentScore <= :maxScore', { maxScore })
      .andWhere('content.isAnalyzed = true')
      .orderBy('content.sentimentScore', 'DESC')
      .addOrderBy('content.publishedAt', 'DESC')
      .take(limit)
      .getMany();
  }

  async findByCategory(category: string, limit: number = 50): Promise<FeedContent[]> {
    return await this.repository.find({
      where: { category },
      order: { publishedAt: 'DESC' },
      take: limit,
      relations: ['source']
    });
  }

  async findHighRelevanceContent(minScore: number = 0.7, limit: number = 20): Promise<FeedContent[]> {
    return await this.repository
      .createQueryBuilder('content')
      .leftJoinAndSelect('content.source', 'source')
      .where('content.confidenceScore >= :minScore', { minScore })
      .andWhere('content.isAnalyzed = true')
      .orderBy('content.confidenceScore', 'DESC')
      .addOrderBy('content.publishedAt', 'DESC')
      .take(limit)
      .getMany();
  }

  async findByKeywords(keywords: string[], limit: number = 50): Promise<FeedContent[]> {
    const queryBuilder = this.repository.createQueryBuilder('content')
      .leftJoinAndSelect('content.source', 'source')
      .where('content.isAnalyzed = true');

    keywords.forEach((keyword, index) => {
      queryBuilder.andWhere(
        `(content.title LIKE :keyword${index} OR content.content LIKE :keyword${index} OR content.extractedKeywords LIKE :keyword${index})`,
        { [`keyword${index}`]: `%${keyword}%` }
      );
    });

    return await queryBuilder
      .orderBy('content.publishedAt', 'DESC')
      .take(limit)
      .getMany();
  }

  async markAsAnalyzed(
    contentId: number, 
    sentimentScore: number, 
    sentimentLabel: string, 
    confidenceScore: number, 
    keywords: string[]
  ): Promise<FeedContent | null> {
    const content = await this.findById(contentId);
    if (!content) return null;

    content.isAnalyzed = true;
    content.sentimentScore = sentimentScore;
    content.sentimentLabel = sentimentLabel;
    content.confidenceScore = confidenceScore;
    content.extractedKeywords = JSON.stringify(keywords);

    return await this.repository.save(content);
  }

  async getAverageSentimentBySource(sourceId: number): Promise<number> {
    const result = await this.repository
      .createQueryBuilder('content')
      .select('AVG(content.sentimentScore)', 'averageSentiment')
      .where('content.sourceId = :sourceId AND content.isAnalyzed = true', { sourceId })
      .getRawOne();

    return result?.averageSentiment || 0;
  }

  async getContentCountBySource(sourceId: number, hours: number = 24): Promise<number> {
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - hours);

    return await this.repository.count({
      where: {
        sourceId,
        publishedAt: { $gte: startDate } as any
      }
    });
  }

  async findTopContentBySentiment(
    sentiment: 'bullish' | 'bearish' | 'neutral',
    limit: number = 10
  ): Promise<FeedContent[]> {
    const scoreRange = sentiment === 'bullish' 
      ? { min: 0.3, max: 1.0 } 
      : sentiment === 'bearish' 
        ? { min: -1.0, max: -0.3 }
        : { min: -0.3, max: 0.3 };

    return await this.repository
      .createQueryBuilder('content')
      .leftJoinAndSelect('content.source', 'source')
      .where('content.sentimentScore BETWEEN :min AND :max', scoreRange)
      .andWhere('content.isAnalyzed = true')
      .orderBy('content.confidenceScore', 'DESC')
      .addOrderBy('content.publishedAt', 'DESC')
      .take(limit)
      .getMany();
  }

  async existsByGuid(guid: string): Promise<boolean> {
    return await super.exists({ guid });
  }

  async deleteOldContent(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.repository
      .createQueryBuilder()
      .delete()
      .from(FeedContent)
      .where('publishedAt < :cutoffDate', { cutoffDate })
      .execute();

    return result.affected || 0;
  }
}