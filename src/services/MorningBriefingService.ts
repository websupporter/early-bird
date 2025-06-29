import { OpenAIService, MorningBriefingData, MorningBriefing } from './OpenAIService';
import { RepositoryFactory } from '../repositories';
import { BinanceApiService } from './BinanceApiService';
import { GreedFearIndexService } from './GreedFearIndexService';
import { RedditContent } from '../entities/RedditContent';
import { WordPressContent } from '../entities/WordPressContent';

export interface BriefingGenerationOptions {
  hoursBack?: number;
  includeWeekendData?: boolean;
  minContentThreshold?: number;
  maxContentAnalyzed?: number;
}

export class MorningBriefingService {
  private openaiService: OpenAIService;
  private redditContentRepo = RepositoryFactory.getRedditContentRepository();
  private wordpressContentRepo = RepositoryFactory.getWordPressContentRepository();
  private binanceService: BinanceApiService;
  private greedFearService: GreedFearIndexService;

  constructor() {
    this.openaiService = new OpenAIService();
    this.binanceService = new BinanceApiService();
    this.greedFearService = new GreedFearIndexService();
  }

  async generateMorningBriefing(options: BriefingGenerationOptions = {}): Promise<MorningBriefing> {
    const {
      hoursBack = 24,
      includeWeekendData = true,
      minContentThreshold = 10,
      maxContentAnalyzed = 500
    } = options;

    console.log('Starting morning briefing generation...');

    // Calculate time range
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - (hoursBack * 60 * 60 * 1000));

    // Gather data from all sources
    const [redditData, wordpressData, marketData] = await Promise.allSettled([
      this.analyzeRedditSentiment(startTime, endTime, maxContentAnalyzed),
      this.analyzeWordPressSentiment(startTime, endTime, maxContentAnalyzed),
      this.gatherMarketData()
    ]);

    // Prepare briefing data
    const briefingData: MorningBriefingData = {
      redditSentiment: redditData.status === 'fulfilled' ? redditData.value : this.getEmptyRedditSentiment(),
      wordpressSentiment: wordpressData.status === 'fulfilled' ? wordpressData.value : this.getEmptyWordPressSentiment(),
      marketData: marketData.status === 'fulfilled' ? marketData.value : this.getEmptyMarketData(),
      timeframe: {
        from: startTime,
        to: endTime
      }
    };

    // Check if we have enough data
    const totalContent = briefingData.redditSentiment.posts + briefingData.wordpressSentiment.articles;
    if (totalContent < minContentThreshold) {
      console.warn(`Insufficient data for briefing: ${totalContent} items (minimum: ${minContentThreshold})`);
    }

    // Generate AI briefing
    const briefing = await this.openaiService.generateMorningBriefing(briefingData);

    console.log(`Morning briefing generated: ${briefing.title}`);
    return briefing;
  }

  private async analyzeRedditSentiment(startTime: Date, endTime: Date, maxContent: number) {
    console.log('Analyzing Reddit sentiment...');

    const redditContent = await this.redditContentRepo.findContentByDateRange(startTime, endTime);
    const limitedContent = redditContent.slice(0, maxContent);

    const sentimentResults = await Promise.allSettled(
      limitedContent.map(async (content) => {
        try {
          const text = `${content.title} ${content.content}`.substring(0, 1000);
          const sentiment = await this.openaiService.analyzeSentiment(text);
          
          // Update content with sentiment analysis
          await this.redditContentRepo.markAsAnalyzed(content.id, sentiment.score, sentiment.keywords);
          
          return sentiment;
        } catch (error) {
          console.error(`Error analyzing Reddit content ${content.id}:`, error);
          return null;
        }
      })
    );

    const validSentiments = sentimentResults
      .filter(result => result.status === 'fulfilled' && result.value !== null)
      .map(result => (result as PromiseFulfilledResult<any>).value);

    const averageSentiment = validSentiments.length > 0 
      ? validSentiments.reduce((sum, s) => sum + s.score, 0) / validSentiments.length 
      : 0;

    const allKeywords = validSentiments.flatMap(s => s.keywords);
    const keywordCounts = this.countKeywords(allKeywords);
    const topKeywords = Object.entries(keywordCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([keyword]) => keyword);

    const trendingTopics = this.extractTrendingTopics(limitedContent);

    return {
      posts: limitedContent.length,
      averageSentiment,
      topKeywords,
      trendingTopics
    };
  }

  private async analyzeWordPressSentiment(startTime: Date, endTime: Date, maxContent: number) {
    console.log('Analyzing WordPress sentiment...');

    const wordpressContent = await this.wordpressContentRepo.findContentByDateRange(startTime, endTime);
    const limitedContent = wordpressContent.slice(0, maxContent);

    const sentimentResults = await Promise.allSettled(
      limitedContent.map(async (content) => {
        try {
          const text = `${content.title} ${content.content}`.substring(0, 1500);
          const sentiment = await this.openaiService.analyzeSentiment(text);
          
          // Update content with sentiment analysis
          await this.wordpressContentRepo.markAsAnalyzed(content.id, sentiment.score, sentiment.keywords);
          
          return sentiment;
        } catch (error) {
          console.error(`Error analyzing WordPress content ${content.id}:`, error);
          return null;
        }
      })
    );

    const validSentiments = sentimentResults
      .filter(result => result.status === 'fulfilled' && result.value !== null)
      .map(result => (result as PromiseFulfilledResult<any>).value);

    const averageSentiment = validSentiments.length > 0 
      ? validSentiments.reduce((sum, s) => sum + s.score, 0) / validSentiments.length 
      : 0;

    const allKeywords = validSentiments.flatMap(s => s.keywords);
    const keywordCounts = this.countKeywords(allKeywords);
    const topKeywords = Object.entries(keywordCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([keyword]) => keyword);

    const expertOpinions = limitedContent
      .map(content => content.title)
      .slice(0, 5);

    return {
      articles: limitedContent.length,
      averageSentiment,
      topKeywords,
      expertOpinions
    };
  }

  private async gatherMarketData() {
    console.log('Gathering market data...');

    const [greedFearData, topCryptos] = await Promise.allSettled([
      this.greedFearService.getCurrentIndex(),
      this.binanceService.getTopVolumePairs('USDT', 10)
    ]);

    const greedFear = greedFearData.status === 'fulfilled' ? greedFearData.value : null;
    const cryptos = topCryptos.status === 'fulfilled' ? topCryptos.value : [];

    return {
      greedFearIndex: greedFear ? parseInt(greedFear.value) : 50,
      greedFearClassification: greedFear ? greedFear.value_classification : 'Neutral',
      topCryptos: cryptos.map(crypto => ({
        symbol: crypto.symbol,
        change24h: parseFloat(crypto.priceChangePercent),
        volume: parseFloat(crypto.quoteVolume)
      }))
    };
  }

  private countKeywords(keywords: string[]): Record<string, number> {
    const counts: Record<string, number> = {};
    keywords.forEach(keyword => {
      const normalized = keyword.toLowerCase().trim();
      if (normalized.length > 2) {
        counts[normalized] = (counts[normalized] || 0) + 1;
      }
    });
    return counts;
  }

  private extractTrendingTopics(content: (RedditContent | WordPressContent)[]): string[] {
    // Simple trending topic extraction based on title frequency
    const titleWords = content
      .flatMap(c => c.title.toLowerCase().split(/\s+/))
      .filter(word => word.length > 4 && !this.isStopWord(word));

    const wordCounts = this.countKeywords(titleWords);
    return Object.entries(wordCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  }

  private isStopWord(word: string): boolean {
    const stopWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her', 'was', 'one', 'our', 'had', 'but', 'words', 'from', 'they', 'this', 'that', 'with', 'have', 'this', 'will', 'your', 'from', 'they', 'know', 'want', 'been', 'good', 'much', 'some', 'time'];
    return stopWords.includes(word.toLowerCase());
  }

  private getEmptyRedditSentiment() {
    return {
      posts: 0,
      averageSentiment: 0,
      topKeywords: [],
      trendingTopics: []
    };
  }

  private getEmptyWordPressSentiment() {
    return {
      articles: 0,
      averageSentiment: 0,
      topKeywords: [],
      expertOpinions: []
    };
  }

  private getEmptyMarketData() {
    return {
      greedFearIndex: 50,
      greedFearClassification: 'Neutral',
      topCryptos: []
    };
  }

  // Get historical briefings (if we store them)
  async getHistoricalBriefings(days: number = 7): Promise<MorningBriefing[]> {
    // In a real implementation, we'd store briefings in a database
    // For now, return empty array
    return [];
  }

  // Quick sentiment overview without full briefing
  async getQuickSentimentOverview(): Promise<{
    redditSentiment: number;
    wordpressSentiment: number;
    greedFearIndex: number;
    lastUpdated: Date;
  }> {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - (6 * 60 * 60 * 1000)); // Last 6 hours

    const [redditData, wordpressData, greedFearData] = await Promise.allSettled([
      this.analyzeRedditSentiment(startTime, endTime, 50),
      this.analyzeWordPressSentiment(startTime, endTime, 20),
      this.greedFearService.getCurrentIndex()
    ]);

    return {
      redditSentiment: redditData.status === 'fulfilled' ? redditData.value.averageSentiment : 0,
      wordpressSentiment: wordpressData.status === 'fulfilled' ? wordpressData.value.averageSentiment : 0,
      greedFearIndex: greedFearData.status === 'fulfilled' ? parseInt(greedFearData.value.value) : 50,
      lastUpdated: endTime
    };
  }

  // Batch analyze unanalyzed content
  async batchAnalyzeUnanalyzedContent(limit: number = 100): Promise<{
    redditAnalyzed: number;
    wordpressAnalyzed: number;
    errors: string[];
  }> {
    console.log('Starting batch analysis of unanalyzed content...');
    
    const [unanalyzedReddit, unanalyzedWordPress] = await Promise.all([
      this.redditContentRepo.findUnanalyzedContent(limit),
      this.wordpressContentRepo.findUnanalyzedContent(limit)
    ]);

    const errors: string[] = [];
    let redditAnalyzed = 0;
    let wordpressAnalyzed = 0;

    // Analyze Reddit content
    for (const content of unanalyzedReddit) {
      try {
        const text = `${content.title} ${content.content}`.substring(0, 1000);
        const sentiment = await this.openaiService.analyzeSentiment(text);
        await this.redditContentRepo.markAsAnalyzed(content.id, sentiment.score, sentiment.keywords);
        redditAnalyzed++;
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        errors.push(`Reddit content ${content.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Analyze WordPress content
    for (const content of unanalyzedWordPress) {
      try {
        const text = `${content.title} ${content.content}`.substring(0, 1500);
        const sentiment = await this.openaiService.analyzeSentiment(text);
        await this.wordpressContentRepo.markAsAnalyzed(content.id, sentiment.score, sentiment.keywords);
        wordpressAnalyzed++;
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        errors.push(`WordPress content ${content.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log(`Batch analysis completed: ${redditAnalyzed} Reddit + ${wordpressAnalyzed} WordPress content analyzed`);

    return {
      redditAnalyzed,
      wordpressAnalyzed,
      errors
    };
  }
}