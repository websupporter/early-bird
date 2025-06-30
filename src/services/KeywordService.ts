import { RepositoryFactory } from '../repositories';
import { Keyword } from '../entities/Keyword';
import { KeywordContentLink, ContentType } from '../entities/KeywordContentLink';
import logger from '../config/logger';

export interface KeywordAnalysisResult {
  keywords: string[];
  keywordFrequencies: { [keyword: string]: number };
  relevantKeywords: string[];
  cryptoKeywords: string[];
}

export interface ContentKeywordLink {
  keywordId: number;
  keyword: string;
  frequency: number;
  relevanceScore: number;
  context?: string;
}

export class KeywordService {
  private keywordRepository = RepositoryFactory.getKeywordRepository();
  private keywordContentLinkRepository = RepositoryFactory.getKeywordContentLinkRepository();

  // Common crypto-related stopwords to filter out
  private readonly stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'this', 'that', 'these', 'those', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may',
    'might', 'must', 'can', 'cannot', 'it', 'its', 'he', 'she', 'they', 'we', 'you', 'i',
    'me', 'him', 'her', 'them', 'us', 'my', 'your', 'his', 'our', 'their', 'what', 'when',
    'where', 'why', 'how', 'which', 'who', 'whom', 'whose', 'all', 'any', 'some', 'no',
    'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'now', 'here', 'there',
    'then', 'also', 'just', 'more', 'most', 'much', 'many', 'well', 'good', 'new', 'old',
    'first', 'last', 'long', 'great', 'little', 'high', 'right', 'left', 'big', 'small'
  ]);

  async extractKeywordsFromText(text: string, title?: string): Promise<KeywordAnalysisResult> {
    try {
      const fullText = title ? `${title} ${text}` : text;
      const words = this.tokenizeText(fullText);
      const keywords = this.filterKeywords(words);
      const keywordFrequencies = this.calculateFrequencies(keywords);
      
      // Filter for relevant keywords (minimum frequency and length)
      const relevantKeywords = Object.entries(keywordFrequencies)
        .filter(([keyword, freq]) => freq >= 2 && keyword.length >= 4)
        .sort((a, b) => b[1] - a[1])
        .map(([keyword]) => keyword);

      // Identify crypto-specific keywords
      const cryptoKeywords = relevantKeywords.filter(keyword => 
        this.isCryptoRelated(keyword)
      );

      return {
        keywords: Object.keys(keywordFrequencies),
        keywordFrequencies,
        relevantKeywords,
        cryptoKeywords
      };
    } catch (error: any) {
      logger.error('Error extracting keywords from text:', error.message);
      return {
        keywords: [],
        keywordFrequencies: {},
        relevantKeywords: [],
        cryptoKeywords: []
      };
    }
  }

  async processContentKeywords(
    contentId: number,
    contentType: ContentType,
    text: string,
    title?: string,
    sentimentScore: number = 0.0
  ): Promise<ContentKeywordLink[]> {
    try {
      const analysis = await this.extractKeywordsFromText(text, title);
      const contentLinks: ContentKeywordLink[] = [];

      // Process only relevant keywords to avoid noise
      const keywordsToProcess = analysis.relevantKeywords.slice(0, 20); // Limit to top 20

      for (const keywordText of keywordsToProcess) {
        const frequency = analysis.keywordFrequencies[keywordText] || 1;
        
        // Find or create keyword
        const keyword = await this.keywordRepository.findOrCreateKeyword(keywordText);
        
        // Calculate relevance score based on frequency and position
        const relevanceScore = this.calculateRelevanceScore(
          keywordText, 
          text, 
          frequency, 
          analysis.cryptoKeywords.includes(keywordText)
        );

        // Extract context around keyword
        const context = this.extractKeywordContext(text, keywordText);

        // Create or update link
        const link = await this.keywordContentLinkRepository.createOrUpdateLink(
          keyword.id,
          contentId,
          contentType,
          frequency,
          sentimentScore,
          context
        );

        // Update keyword sentiment
        await this.keywordRepository.updateKeywordSentiment(keyword.id, sentimentScore);

        contentLinks.push({
          keywordId: keyword.id,
          keyword: keywordText,
          frequency,
          relevanceScore,
          context
        });
      }

      logger.info(`Processed ${contentLinks.length} keywords for ${contentType} content ${contentId}`);
      return contentLinks;
    } catch (error: any) {
      logger.error(`Error processing keywords for ${contentType} content ${contentId}:`, error.message);
      return [];
    }
  }

  async findContentByKeywords(
    keywords: string[], 
    contentType?: ContentType,
    limit: number = 50
  ): Promise<any[]> {
    try {
      // Find keyword IDs
      const keywordIds: number[] = [];
      
      for (const keyword of keywords) {
        const keywordEntity = await this.keywordRepository.findByNormalizedKeyword(
          Keyword.normalizeKeyword(keyword)
        );
        if (keywordEntity) {
          keywordIds.push(keywordEntity.id);
        }
      }

      if (keywordIds.length === 0) {
        return [];
      }

      // Find content links
      const links = await this.keywordContentLinkRepository.findContentByKeywords(
        keywordIds,
        contentType,
        limit
      );

      return links;
    } catch (error: any) {
      logger.error('Error finding content by keywords:', error.message);
      return [];
    }
  }

  async getTrendingKeywords(limit: number = 20): Promise<Keyword[]> {
    try {
      return await this.keywordRepository.findTrendingKeywords(10, limit);
    } catch (error: any) {
      logger.error('Error getting trending keywords:', error.message);
      return [];
    }
  }

  async getKeywordsByCategory(category: string, limit: number = 50): Promise<Keyword[]> {
    try {
      return await this.keywordRepository.findByCategory(category, limit);
    } catch (error: any) {
      logger.error(`Error getting keywords by category ${category}:`, error.message);
      return [];
    }
  }

  async getKeywordAnalytics(): Promise<{
    totalKeywords: number;
    activeKeywords: number;
    topKeywords: Keyword[];
    categoryDistribution: { [key: string]: number };
    sentimentDistribution: {
      bullish: number;
      bearish: number;
      neutral: number;
    };
  }> {
    try {
      const stats = await this.keywordRepository.getKeywordStats();
      const topKeywords = await this.keywordRepository.findMostRelevant(10);
      
      // Get sentiment distribution
      const bullishKeywords = await this.keywordRepository.findBySentimentRange(0.3, 1.0, 1000);
      const bearishKeywords = await this.keywordRepository.findBySentimentRange(-1.0, -0.3, 1000);
      const neutralKeywords = await this.keywordRepository.findBySentimentRange(-0.3, 0.3, 1000);

      return {
        totalKeywords: stats.totalKeywords,
        activeKeywords: stats.activeKeywords,
        topKeywords,
        categoryDistribution: stats.categoryCounts,
        sentimentDistribution: {
          bullish: bullishKeywords.length,
          bearish: bearishKeywords.length,
          neutral: neutralKeywords.length
        }
      };
    } catch (error: any) {
      logger.error('Error getting keyword analytics:', error.message);
      return {
        totalKeywords: 0,
        activeKeywords: 0,
        topKeywords: [],
        categoryDistribution: {},
        sentimentDistribution: { bullish: 0, bearish: 0, neutral: 0 }
      };
    }
  }

  async cleanupKeywords(): Promise<{
    deactivatedRare: number;
    deletedOldLinks: number;
  }> {
    try {
      const deactivatedRare = await this.keywordRepository.deactivateRareKeywords(2);
      const deletedOldLinks = await this.keywordContentLinkRepository.deleteOldLinks(90);

      logger.info(`Cleaned up ${deactivatedRare} rare keywords and ${deletedOldLinks} old links`);
      
      return {
        deactivatedRare,
        deletedOldLinks
      };
    } catch (error: any) {
      logger.error('Error cleaning up keywords:', error.message);
      return {
        deactivatedRare: 0,
        deletedOldLinks: 0
      };
    }
  }

  private tokenizeText(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  private filterKeywords(words: string[]): string[] {
    return words.filter(word => 
      word.length >= 3 && 
      !this.stopWords.has(word) &&
      !this.isNumeric(word)
    );
  }

  private calculateFrequencies(keywords: string[]): { [keyword: string]: number } {
    const frequencies: { [keyword: string]: number } = {};
    
    for (const keyword of keywords) {
      frequencies[keyword] = (frequencies[keyword] || 0) + 1;
    }
    
    return frequencies;
  }

  private calculateRelevanceScore(
    keyword: string, 
    text: string, 
    frequency: number, 
    isCryptoKeyword: boolean
  ): number {
    // Base score from frequency (normalized)
    const frequencyScore = Math.min(frequency / 10, 1.0);
    
    // Boost for crypto-related keywords
    const cryptoBoost = isCryptoKeyword ? 0.3 : 0.0;
    
    // Position score (keywords appearing early are more relevant)
    const firstOccurrence = text.toLowerCase().indexOf(keyword.toLowerCase());
    const positionScore = firstOccurrence !== -1 ? 
      Math.max(0, 1 - (firstOccurrence / text.length)) : 0;
    
    // Combine scores
    const relevanceScore = (frequencyScore * 0.5) + (positionScore * 0.2) + cryptoBoost;
    
    return Math.min(relevanceScore, 1.0);
  }

  private extractKeywordContext(text: string, keyword: string, contextLength: number = 100): string {
    const keywordIndex = text.toLowerCase().indexOf(keyword.toLowerCase());
    if (keywordIndex === -1) return '';

    const start = Math.max(0, keywordIndex - contextLength / 2);
    const end = Math.min(text.length, keywordIndex + keyword.length + contextLength / 2);
    
    let context = text.substring(start, end);
    
    // Add ellipsis if truncated
    if (start > 0) context = '...' + context;
    if (end < text.length) context = context + '...';
    
    return context.trim();
  }

  private isCryptoRelated(keyword: string): boolean {
    const cryptoKeywords = [
      'bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 'cryptocurrency', 'blockchain',
      'defi', 'nft', 'altcoin', 'stablecoin', 'mining', 'wallet', 'exchange',
      'token', 'coin', 'satoshi', 'wei', 'gwei', 'dapp', 'dao', 'yield',
      'farming', 'staking', 'liquidity', 'protocol', 'smart', 'contract',
      'binance', 'coinbase', 'kraken', 'bybit', 'okx', 'kucoin',
      'bull', 'bear', 'hodl', 'fomo', 'fud', 'pump', 'dump', 'moon',
      'diamond', 'hands', 'paper', 'ape', 'degen', 'ngmi', 'wagmi'
    ];
    
    return cryptoKeywords.some(crypto => 
      keyword.includes(crypto) || crypto.includes(keyword)
    );
  }

  private isNumeric(str: string): boolean {
    return /^\d+$/.test(str);
  }
}