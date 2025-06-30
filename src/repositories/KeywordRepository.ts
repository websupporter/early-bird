import { BaseRepository } from './BaseRepository';
import { Keyword } from '../entities/Keyword';

export class KeywordRepository extends BaseRepository<Keyword> {
  constructor() {
    super(Keyword);
  }

  async findByKeyword(keyword: string): Promise<Keyword | null> {
    return await this.repository.findOne({ 
      where: { keyword } 
    });
  }

  async findByNormalizedKeyword(normalizedKeyword: string): Promise<Keyword | null> {
    return await this.repository.findOne({ 
      where: { normalizedKeyword } 
    });
  }

  async findOrCreateKeyword(keyword: string): Promise<Keyword> {
    const normalizedKeyword = Keyword.normalizeKeyword(keyword);
    
    let keywordEntity = await this.findByNormalizedKeyword(normalizedKeyword);
    
    if (!keywordEntity) {
      keywordEntity = await this.create({
        keyword: keyword,
        normalizedKeyword: normalizedKeyword,
        frequency: 1,
        averageSentiment: 0.0,
        relevanceScore: 0.0,
        isActive: true
      });
      
      // Set category after creation
      keywordEntity.category = keywordEntity.categorizeKeyword();
      keywordEntity = await this.repository.save(keywordEntity);
    } else {
      keywordEntity.incrementFrequency();
      keywordEntity = await this.repository.save(keywordEntity);
    }
    
    return keywordEntity;
  }

  async findByCategory(category: string, limit: number = 50): Promise<Keyword[]> {
    return await this.repository.find({
      where: { category, isActive: true },
      order: { frequency: 'DESC' },
      take: limit
    });
  }

  async findMostFrequent(limit: number = 20): Promise<Keyword[]> {
    return await this.repository.find({
      where: { isActive: true },
      order: { frequency: 'DESC' },
      take: limit
    });
  }

  async findMostRelevant(limit: number = 20): Promise<Keyword[]> {
    return await this.repository.find({
      where: { isActive: true },
      order: { relevanceScore: 'DESC', frequency: 'DESC' },
      take: limit
    });
  }

  async findBySentimentRange(minSentiment: number, maxSentiment: number, limit: number = 50): Promise<Keyword[]> {
    return await this.repository
      .createQueryBuilder('keyword')
      .where('keyword.averageSentiment >= :minSentiment', { minSentiment })
      .andWhere('keyword.averageSentiment <= :maxSentiment', { maxSentiment })
      .andWhere('keyword.isActive = true')
      .orderBy('keyword.frequency', 'DESC')
      .take(limit)
      .getMany();
  }

  async findTrendingKeywords(minFrequency: number = 10, limit: number = 20): Promise<Keyword[]> {
    // Find keywords that have high frequency but were created recently
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 7); // Last 7 days

    return await this.repository
      .createQueryBuilder('keyword')
      .where('keyword.frequency >= :minFrequency', { minFrequency })
      .andWhere('keyword.createdAt >= :recentDate', { recentDate })
      .andWhere('keyword.isActive = true')
      .orderBy('keyword.frequency', 'DESC')
      .addOrderBy('keyword.createdAt', 'DESC')
      .take(limit)
      .getMany();
  }

  async updateKeywordSentiment(keywordId: number, newSentiment: number): Promise<Keyword | null> {
    const keyword = await this.findById(keywordId);
    if (!keyword) return null;

    keyword.updateAverageSentiment(newSentiment);
    keyword.calculateRelevanceScore();
    
    return await this.repository.save(keyword);
  }

  async updateKeywordCategory(keywordId: number): Promise<Keyword | null> {
    const keyword = await this.findById(keywordId);
    if (!keyword) return null;

    keyword.category = keyword.categorizeKeyword();
    return await this.repository.save(keyword);
  }

  async searchKeywords(searchTerm: string, limit: number = 20): Promise<Keyword[]> {
    return await this.repository
      .createQueryBuilder('keyword')
      .where('keyword.keyword LIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .orWhere('keyword.normalizedKeyword LIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .andWhere('keyword.isActive = true')
      .orderBy('keyword.frequency', 'DESC')
      .take(limit)
      .getMany();
  }

  async getKeywordStats(): Promise<{
    totalKeywords: number;
    activeKeywords: number;
    categoryCounts: { [key: string]: number };
    avgFrequency: number;
    avgSentiment: number;
  }> {
    const totalKeywords = await this.repository.count();
    const activeKeywords = await this.repository.count({ where: { isActive: true } });

    const categoryStats = await this.repository
      .createQueryBuilder('keyword')
      .select('keyword.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .where('keyword.isActive = true')
      .groupBy('keyword.category')
      .getRawMany();

    const categoryCounts: { [key: string]: number } = {};
    categoryStats.forEach(stat => {
      categoryCounts[stat.category || 'unknown'] = parseInt(stat.count);
    });

    const avgStats = await this.repository
      .createQueryBuilder('keyword')
      .select('AVG(keyword.frequency)', 'avgFrequency')
      .addSelect('AVG(keyword.averageSentiment)', 'avgSentiment')
      .where('keyword.isActive = true')
      .getRawOne();

    return {
      totalKeywords,
      activeKeywords,
      categoryCounts,
      avgFrequency: parseFloat(avgStats?.avgFrequency || '0'),
      avgSentiment: parseFloat(avgStats?.avgSentiment || '0')
    };
  }

  async deactivateRareKeywords(minFrequency: number = 2): Promise<number> {
    const result = await this.repository
      .createQueryBuilder()
      .update(Keyword)
      .set({ isActive: false })
      .where('frequency < :minFrequency', { minFrequency })
      .execute();

    return result.affected || 0;
  }

  async existsByKeyword(keyword: string): Promise<boolean> {
    return await super.exists({ keyword });
  }
}