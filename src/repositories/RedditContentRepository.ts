import { BaseRepository } from './BaseRepository';
import { RedditContent, RedditContentType } from '../entities/RedditContent';

export class RedditContentRepository extends BaseRepository<RedditContent> {
  constructor() {
    super(RedditContent);
  }

  async findByRedditId(redditId: string): Promise<RedditContent | null> {
    return await this.repository.findOne({ where: { redditId } });
  }

  async findBySourceId(sourceId: number, limit: number = 100): Promise<RedditContent[]> {
    return await this.repository.find({
      where: { sourceId },
      order: { postedAt: 'DESC' },
      take: limit,
      relations: ['author', 'source']
    });
  }

  async findByAuthorId(authorId: number, limit: number = 50): Promise<RedditContent[]> {
    return await this.repository.find({
      where: { authorId },
      order: { postedAt: 'DESC' },
      take: limit,
      relations: ['author', 'source']
    });
  }

  async findByType(type: RedditContentType, limit: number = 100): Promise<RedditContent[]> {
    return await this.repository.find({
      where: { type },
      order: { postedAt: 'DESC' },
      take: limit,
      relations: ['author', 'source']
    });
  }

  async findUnanalyzedContent(limit: number = 50): Promise<RedditContent[]> {
    return await this.repository.find({
      where: { isAnalyzed: false },
      order: { postedAt: 'ASC' },
      take: limit,
      relations: ['author', 'source']
    });
  }

  async findTopEngagingContent(sourceId?: number, limit: number = 20): Promise<RedditContent[]> {
    const queryBuilder = this.repository.createQueryBuilder('content')
      .leftJoinAndSelect('content.author', 'author')
      .leftJoinAndSelect('content.source', 'source')
      .addSelect('(content.upvotes + content.downvotes + content.commentCount)', 'engagement')
      .orderBy('engagement', 'DESC')
      .take(limit);

    if (sourceId) {
      queryBuilder.where('content.sourceId = :sourceId', { sourceId });
    }

    return await queryBuilder.getMany();
  }

  async findContentByDateRange(startDate: Date, endDate: Date, sourceId?: number): Promise<RedditContent[]> {
    const queryBuilder = this.repository.createQueryBuilder('content')
      .leftJoinAndSelect('content.author', 'author')
      .leftJoinAndSelect('content.source', 'source')
      .where('content.postedAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .orderBy('content.postedAt', 'DESC');

    if (sourceId) {
      queryBuilder.andWhere('content.sourceId = :sourceId', { sourceId });
    }

    return await queryBuilder.getMany();
  }

  async markAsAnalyzed(contentId: number, sentimentScore: number, keywords: string[]): Promise<RedditContent | null> {
    const content = await this.findById(contentId);
    if (!content) return null;

    content.isAnalyzed = true;
    content.sentimentScore = sentimentScore;
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

  async existsByRedditId(redditId: string): Promise<boolean> {
    return await super.exists({ redditId });
  }
}