import { BaseRepository } from './BaseRepository';
import { WordPressContent, WordPressContentStatus } from '../entities/WordPressContent';

export class WordPressContentRepository extends BaseRepository<WordPressContent> {
  constructor() {
    super(WordPressContent);
  }

  async findByWordPressId(wordpressId: string): Promise<WordPressContent | null> {
    return await this.repository.findOne({ where: { wordpressId } });
  }

  async findBySourceId(sourceId: number, limit: number = 100): Promise<WordPressContent[]> {
    return await this.repository.find({
      where: { sourceId },
      order: { publishedAt: 'DESC' },
      take: limit,
      relations: ['author', 'source']
    });
  }

  async findByAuthorId(authorId: number, limit: number = 50): Promise<WordPressContent[]> {
    return await this.repository.find({
      where: { authorId },
      order: { publishedAt: 'DESC' },
      take: limit,
      relations: ['author', 'source']
    });
  }

  async findByStatus(status: WordPressContentStatus, limit: number = 100): Promise<WordPressContent[]> {
    return await this.repository.find({
      where: { status },
      order: { publishedAt: 'DESC' },
      take: limit,
      relations: ['author', 'source']
    });
  }

  async findUnanalyzedContent(limit: number = 50): Promise<WordPressContent[]> {
    return await this.repository.find({
      where: { isAnalyzed: false, status: WordPressContentStatus.PUBLISHED },
      order: { publishedAt: 'ASC' },
      take: limit,
      relations: ['author', 'source']
    });
  }

  async findTopEngagingContent(sourceId?: number, limit: number = 20): Promise<WordPressContent[]> {
    const queryBuilder = this.repository.createQueryBuilder('content')
      .leftJoinAndSelect('content.author', 'author')
      .leftJoinAndSelect('content.source', 'source')
      .where('content.status = :status', { status: WordPressContentStatus.PUBLISHED })
      .addSelect('(content.viewCount + content.commentCount)', 'engagement')
      .orderBy('engagement', 'DESC')
      .take(limit);

    if (sourceId) {
      queryBuilder.andWhere('content.sourceId = :sourceId', { sourceId });
    }

    return await queryBuilder.getMany();
  }

  async findContentByDateRange(startDate: Date, endDate: Date, sourceId?: number): Promise<WordPressContent[]> {
    const queryBuilder = this.repository.createQueryBuilder('content')
      .leftJoinAndSelect('content.author', 'author')
      .leftJoinAndSelect('content.source', 'source')
      .where('content.publishedAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('content.status = :status', { status: WordPressContentStatus.PUBLISHED })
      .orderBy('content.publishedAt', 'DESC');

    if (sourceId) {
      queryBuilder.andWhere('content.sourceId = :sourceId', { sourceId });
    }

    return await queryBuilder.getMany();
  }

  async findByCategory(category: string, limit: number = 50): Promise<WordPressContent[]> {
    return await this.repository
      .createQueryBuilder('content')
      .leftJoinAndSelect('content.author', 'author')
      .leftJoinAndSelect('content.source', 'source')
      .where('JSON_CONTAINS(content.categories, :category)', { category: JSON.stringify(category) })
      .andWhere('content.status = :status', { status: WordPressContentStatus.PUBLISHED })
      .orderBy('content.publishedAt', 'DESC')
      .take(limit)
      .getMany();
  }

  async findByTag(tag: string, limit: number = 50): Promise<WordPressContent[]> {
    return await this.repository
      .createQueryBuilder('content')
      .leftJoinAndSelect('content.author', 'author')
      .leftJoinAndSelect('content.source', 'source')
      .where('JSON_CONTAINS(content.tags, :tag)', { tag: JSON.stringify(tag) })
      .andWhere('content.status = :status', { status: WordPressContentStatus.PUBLISHED })
      .orderBy('content.publishedAt', 'DESC')
      .take(limit)
      .getMany();
  }

  async markAsAnalyzed(contentId: number, sentimentScore: number, keywords: string[]): Promise<WordPressContent | null> {
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

  async existsByWordPressId(wordpressId: string): Promise<boolean> {
    return await super.exists({ wordpressId });
  }

  async updateViewCount(contentId: number, viewCount: number): Promise<WordPressContent | null> {
    const result = await this.repository.update(contentId, { viewCount });
    if (result.affected === 0) return null;
    
    return await this.findById(contentId);
  }
}