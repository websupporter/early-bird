import { BaseRepository } from './BaseRepository';
import { KeywordContentLink, ContentType } from '../entities/KeywordContentLink';

export class KeywordContentLinkRepository extends BaseRepository<KeywordContentLink> {
  constructor() {
    super(KeywordContentLink);
  }

  async findByKeywordId(keywordId: number, limit: number = 100): Promise<KeywordContentLink[]> {
    return await this.repository.find({
      where: { keywordId },
      order: { relevanceScore: 'DESC', createdAt: 'DESC' },
      take: limit,
      relations: ['keyword']
    });
  }

  async findByContentId(contentId: number, contentType: ContentType): Promise<KeywordContentLink[]> {
    return await this.repository.find({
      where: { contentId, contentType },
      order: { relevanceScore: 'DESC' },
      relations: ['keyword']
    });
  }

  async findByContentType(contentType: ContentType, limit: number = 100): Promise<KeywordContentLink[]> {
    return await this.repository.find({
      where: { contentType },
      order: { relevanceScore: 'DESC', createdAt: 'DESC' },
      take: limit,
      relations: ['keyword']
    });
  }

  async findTopKeywordsForContent(
    contentId: number, 
    contentType: ContentType, 
    limit: number = 10
  ): Promise<KeywordContentLink[]> {
    return await this.repository.find({
      where: { contentId, contentType },
      order: { relevanceScore: 'DESC', frequency: 'DESC' },
      take: limit,
      relations: ['keyword']
    });
  }

  async findContentByKeywords(
    keywordIds: number[], 
    contentType?: ContentType,
    limit: number = 50
  ): Promise<KeywordContentLink[]> {
    const queryBuilder = this.repository.createQueryBuilder('link')
      .leftJoinAndSelect('link.keyword', 'keyword')
      .where('link.keywordId IN (:...keywordIds)', { keywordIds })
      .orderBy('link.relevanceScore', 'DESC')
      .addOrderBy('link.createdAt', 'DESC')
      .take(limit);

    if (contentType) {
      queryBuilder.andWhere('link.contentType = :contentType', { contentType });
    }

    return await queryBuilder.getMany();
  }

  async createOrUpdateLink(
    keywordId: number,
    contentId: number,
    contentType: ContentType,
    frequency: number = 1,
    sentimentScore: number = 0.0,
    context?: string
  ): Promise<KeywordContentLink> {
    let link = await this.repository.findOne({
      where: { keywordId, contentId, contentType }
    });

    if (link) {
      // Update existing link
      link.frequency += frequency;
      link.sentimentScore = sentimentScore;
      if (context) link.context = context;
    } else {
      // Create new link
      link = KeywordContentLink.createLink(keywordId, contentId, contentType, frequency, sentimentScore);
      if (context) link.context = context;
    }

    return await this.repository.save(link);
  }

  async bulkCreateLinks(links: Partial<KeywordContentLink>[]): Promise<KeywordContentLink[]> {
    const entities = this.repository.create(links);
    return await this.repository.save(entities);
  }

  async findHighRelevanceLinks(minScore: number = 0.7, limit: number = 100): Promise<KeywordContentLink[]> {
    return await this.repository
      .createQueryBuilder('link')
      .leftJoinAndSelect('link.keyword', 'keyword')
      .where('link.relevanceScore >= :minScore', { minScore })
      .orderBy('link.relevanceScore', 'DESC')
      .addOrderBy('link.frequency', 'DESC')
      .take(limit)
      .getMany();
  }

  async findLinksBySentimentRange(
    minSentiment: number, 
    maxSentiment: number, 
    contentType?: ContentType,
    limit: number = 100
  ): Promise<KeywordContentLink[]> {
    const queryBuilder = this.repository.createQueryBuilder('link')
      .leftJoinAndSelect('link.keyword', 'keyword')
      .where('link.sentimentScore >= :minSentiment', { minSentiment })
      .andWhere('link.sentimentScore <= :maxSentiment', { maxSentiment })
      .orderBy('link.relevanceScore', 'DESC')
      .take(limit);

    if (contentType) {
      queryBuilder.andWhere('link.contentType = :contentType', { contentType });
    }

    return await queryBuilder.getMany();
  }

  async getKeywordFrequencyByContent(contentType: ContentType): Promise<{
    keywordId: number;
    keyword: string;
    totalFrequency: number;
    contentCount: number;
  }[]> {
    return await this.repository
      .createQueryBuilder('link')
      .leftJoin('link.keyword', 'keyword')
      .select('link.keywordId', 'keywordId')
      .addSelect('keyword.keyword', 'keyword')
      .addSelect('SUM(link.frequency)', 'totalFrequency')
      .addSelect('COUNT(DISTINCT link.contentId)', 'contentCount')
      .where('link.contentType = :contentType', { contentType })
      .groupBy('link.keywordId')
      .addGroupBy('keyword.keyword')
      .orderBy('totalFrequency', 'DESC')
      .getRawMany();
  }

  async deleteByContentId(contentId: number, contentType: ContentType): Promise<number> {
    const result = await this.repository.delete({ contentId, contentType });
    return result.affected || 0;
  }

  async deleteOldLinks(daysOld: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.repository
      .createQueryBuilder()
      .delete()
      .from(KeywordContentLink)
      .where('createdAt < :cutoffDate', { cutoffDate })
      .execute();

    return result.affected || 0;
  }

  async existsLink(keywordId: number, contentId: number, contentType: ContentType): Promise<boolean> {
    return await super.exists({ keywordId, contentId, contentType });
  }

  async getContentTypeStats(): Promise<{
    contentType: ContentType;
    linkCount: number;
    uniqueKeywords: number;
    avgRelevance: number;
  }[]> {
    return await this.repository
      .createQueryBuilder('link')
      .select('link.contentType', 'contentType')
      .addSelect('COUNT(*)', 'linkCount')
      .addSelect('COUNT(DISTINCT link.keywordId)', 'uniqueKeywords')
      .addSelect('AVG(link.relevanceScore)', 'avgRelevance')
      .groupBy('link.contentType')
      .getRawMany();
  }
}