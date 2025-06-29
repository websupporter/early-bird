import OpenAI from 'openai';

export interface SentimentAnalysisResult {
  score: number; // -1 to 1
  label: 'negative' | 'neutral' | 'positive';
  confidence: number; // 0 to 1
  keywords: string[];
}

export interface MorningBriefingData {
  redditSentiment: {
    posts: number;
    averageSentiment: number;
    topKeywords: string[];
    trendingTopics: string[];
  };
  wordpressSentiment: {
    articles: number;
    averageSentiment: number;
    topKeywords: string[];
    expertOpinions: string[];
  };
  marketData: {
    greedFearIndex: number;
    greedFearClassification: string;
    topCryptos: Array<{ symbol: string; change24h: number; volume: number }>;
  };
  timeframe: {
    from: Date;
    to: Date;
  };
}

export interface MorningBriefing {
  id: string;
  date: string;
  title: string;
  summary: string;
  marketOverview: string;
  sentimentAnalysis: string;
  keyInsights: string[];
  recommendations: string[];
  riskFactors: string[];
  confidence: number;
  metadata: {
    sourceCount: number;
    dataPoints: number;
    generatedAt: Date;
  };
}

export class OpenAIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
    });
  }

  async analyzeSentiment(text: string): Promise<SentimentAnalysisResult> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a financial sentiment analysis expert. Analyze the sentiment of cryptocurrency-related text and return a JSON response with:
- score: number between -1 (very negative) and 1 (very positive)
- label: "negative", "neutral", or "positive"
- confidence: number between 0 and 1
- keywords: array of relevant financial/crypto keywords found in the text

Focus on market sentiment, price predictions, adoption trends, and regulatory concerns.`
          },
          {
            role: 'user',
            content: `Analyze the sentiment of this text: "${text}"`
          }
        ],
        temperature: 0.1,
        max_tokens: 300
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      try {
        return JSON.parse(content);
      } catch (parseError) {
        // Fallback parsing if JSON is malformed
        return this.fallbackSentimentAnalysis(text);
      }
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      return this.fallbackSentimentAnalysis(text);
    }
  }

  async generateMorningBriefing(data: MorningBriefingData): Promise<MorningBriefing> {
    try {
      const prompt = this.buildBriefingPrompt(data);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are a professional cryptocurrency market analyst creating daily morning briefings for traders. 
Your briefings should be:
- Concise but comprehensive
- Data-driven and objective
- Highlight key trends and sentiment shifts
- Include actionable insights
- Mention potential risks and opportunities
- Professional tone suitable for financial professionals

Return a JSON response with the following structure:
{
  "title": "string",
  "summary": "string (2-3 sentences overview)",
  "marketOverview": "string (market conditions and key metrics)",
  "sentimentAnalysis": "string (community sentiment analysis)",
  "keyInsights": ["string array of 3-5 key insights"],
  "recommendations": ["string array of 2-4 trading/investment recommendations"],
  "riskFactors": ["string array of 2-3 main risk factors"],
  "confidence": number (0-1, overall confidence in analysis)
}`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1500
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      try {
        const briefingData = JSON.parse(content);
        
        return {
          id: this.generateBriefingId(),
          date: new Date().toISOString().split('T')[0],
          title: briefingData.title,
          summary: briefingData.summary,
          marketOverview: briefingData.marketOverview,
          sentimentAnalysis: briefingData.sentimentAnalysis,
          keyInsights: briefingData.keyInsights || [],
          recommendations: briefingData.recommendations || [],
          riskFactors: briefingData.riskFactors || [],
          confidence: briefingData.confidence || 0.7,
          metadata: {
            sourceCount: this.calculateSourceCount(data),
            dataPoints: this.calculateDataPoints(data),
            generatedAt: new Date()
          }
        };
      } catch (parseError) {
        console.error('Error parsing briefing JSON:', parseError);
        return this.generateFallbackBriefing(data);
      }
    } catch (error) {
      console.error('Error generating morning briefing:', error);
      return this.generateFallbackBriefing(data);
    }
  }

  async extractKeywords(text: string, limit: number = 10): Promise<string[]> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Extract the most relevant cryptocurrency and financial keywords from the text. Return only a JSON array of strings, no other text.'
          },
          {
            role: 'user',
            content: `Extract ${limit} key cryptocurrency/financial terms from: "${text.substring(0, 1000)}"`
          }
        ],
        temperature: 0.1,
        max_tokens: 200
      });

      const content = response.choices[0]?.message?.content;
      if (!content) return [];

      try {
        const keywords = JSON.parse(content);
        return Array.isArray(keywords) ? keywords.slice(0, limit) : [];
      } catch {
        return this.fallbackKeywordExtraction(text, limit);
      }
    } catch (error) {
      console.error('Error extracting keywords:', error);
      return this.fallbackKeywordExtraction(text, limit);
    }
  }

  async classifyContent(text: string): Promise<{
    category: 'bullish' | 'bearish' | 'neutral' | 'technical' | 'news' | 'educational';
    subcategory: string;
    relevanceScore: number;
  }> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `Classify cryptocurrency content. Return JSON with:
- category: "bullish", "bearish", "neutral", "technical", "news", or "educational"
- subcategory: more specific classification
- relevanceScore: 0-1 how relevant to crypto trading`
          },
          {
            role: 'user',
            content: `Classify: "${text.substring(0, 500)}"`
          }
        ],
        temperature: 0.1,
        max_tokens: 150
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return { category: 'neutral', subcategory: 'general', relevanceScore: 0.5 };
      }

      try {
        return JSON.parse(content);
      } catch {
        return { category: 'neutral', subcategory: 'general', relevanceScore: 0.5 };
      }
    } catch (error) {
      console.error('Error classifying content:', error);
      return { category: 'neutral', subcategory: 'general', relevanceScore: 0.5 };
    }
  }

  private buildBriefingPrompt(data: MorningBriefingData): string {
    return `Create a cryptocurrency morning briefing based on this data:

**Reddit Community Sentiment:**
- ${data.redditSentiment.posts} posts analyzed
- Average sentiment: ${data.redditSentiment.averageSentiment.toFixed(2)}
- Top keywords: ${data.redditSentiment.topKeywords.join(', ')}
- Trending topics: ${data.redditSentiment.trendingTopics.join(', ')}

**Expert Analysis (WordPress/Blogs):**
- ${data.wordpressSentiment.articles} articles analyzed
- Average sentiment: ${data.wordpressSentiment.averageSentiment.toFixed(2)}
- Key topics: ${data.wordpressSentiment.topKeywords.join(', ')}

**Market Data:**
- Greed & Fear Index: ${data.marketData.greedFearIndex} (${data.marketData.greedFearClassification})
- Top performing cryptos: ${data.marketData.topCryptos.map(c => `${c.symbol} (${c.change24h > 0 ? '+' : ''}${c.change24h.toFixed(2)}%)`).join(', ')}

**Time Period:** ${data.timeframe.from.toLocaleDateString()} to ${data.timeframe.to.toLocaleDateString()}

Please provide a comprehensive morning briefing that synthesizes this information for crypto traders.`;
  }

  private fallbackSentimentAnalysis(text: string): SentimentAnalysisResult {
    // Simple keyword-based sentiment analysis as fallback
    const positiveWords = ['bull', 'bullish', 'pump', 'moon', 'buy', 'hodl', 'bullrun', 'adoption', 'growth'];
    const negativeWords = ['bear', 'bearish', 'dump', 'crash', 'sell', 'dip', 'drop', 'fear', 'fud'];
    
    const words = text.toLowerCase().split(/\s+/);
    let score = 0;
    const foundKeywords: string[] = [];

    words.forEach(word => {
      if (positiveWords.includes(word)) {
        score += 0.1;
        foundKeywords.push(word);
      } else if (negativeWords.includes(word)) {
        score -= 0.1;
        foundKeywords.push(word);
      }
    });

    score = Math.max(-1, Math.min(1, score));
    
    let label: 'negative' | 'neutral' | 'positive' = 'neutral';
    if (score > 0.1) label = 'positive';
    else if (score < -0.1) label = 'negative';

    return {
      score,
      label,
      confidence: 0.6,
      keywords: foundKeywords.slice(0, 5)
    };
  }

  private fallbackKeywordExtraction(text: string, limit: number): string[] {
    const cryptoTerms = ['bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 'blockchain', 'defi', 'nft', 'trading', 'hodl'];
    const words = text.toLowerCase().split(/\s+/);
    const found = words.filter(word => cryptoTerms.includes(word));
    return [...new Set(found)].slice(0, limit);
  }

  private generateFallbackBriefing(data: MorningBriefingData): MorningBriefing {
    return {
      id: this.generateBriefingId(),
      date: new Date().toISOString().split('T')[0],
      title: 'Cryptocurrency Market Briefing',
      summary: 'Market analysis based on community sentiment and recent data.',
      marketOverview: `Greed & Fear Index: ${data.marketData.greedFearIndex} (${data.marketData.greedFearClassification})`,
      sentimentAnalysis: `Analyzed ${data.redditSentiment.posts} Reddit posts and ${data.wordpressSentiment.articles} articles.`,
      keyInsights: ['Limited analysis available due to technical issues'],
      recommendations: ['Monitor market conditions closely'],
      riskFactors: ['High volatility', 'Technical analysis limitations'],
      confidence: 0.4,
      metadata: {
        sourceCount: this.calculateSourceCount(data),
        dataPoints: this.calculateDataPoints(data),
        generatedAt: new Date()
      }
    };
  }

  private generateBriefingId(): string {
    return `briefing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateSourceCount(data: MorningBriefingData): number {
    let count = 0;
    if (data.redditSentiment.posts > 0) count++;
    if (data.wordpressSentiment.articles > 0) count++;
    if (data.marketData.topCryptos.length > 0) count++;
    return count;
  }

  private calculateDataPoints(data: MorningBriefingData): number {
    return data.redditSentiment.posts + data.wordpressSentiment.articles + data.marketData.topCryptos.length;
  }
}