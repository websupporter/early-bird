import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';

@Entity('keywords')
@Index(['keyword'], { unique: true })
export class Keyword {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  keyword!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  normalizedKeyword!: string; // Lowercase, trimmed version

  @Column({ type: 'varchar', length: 50, nullable: true })
  category!: string; // 'crypto', 'market', 'technology', 'regulation', etc.

  @Column({ type: 'int', default: 0 })
  frequency!: number; // How often this keyword appears

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0.0 })
  averageSentiment!: number; // Average sentiment of content containing this keyword

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0.0 })
  relevanceScore!: number; // How relevant this keyword is to crypto trading

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @OneToMany('KeywordContentLink', 'keyword')
  contentLinks!: any[];

  // Methods
  incrementFrequency(): void {
    this.frequency++;
  }

  updateAverageSentiment(newSentiment: number): void {
    // Simple moving average - in production, use more sophisticated approach
    this.averageSentiment = (this.averageSentiment * 0.9) + (newSentiment * 0.1);
  }

  categorizeKeyword(): string {
    const keyword = this.normalizedKeyword.toLowerCase();
    
    // Crypto-specific keywords
    if (this.isCryptoKeyword(keyword)) {
      return 'crypto';
    } else if (this.isMarketKeyword(keyword)) {
      return 'market';
    } else if (this.isTechnologyKeyword(keyword)) {
      return 'technology';
    } else if (this.isRegulationKeyword(keyword)) {
      return 'regulation';
    }
    
    return 'general';
  }

  private isCryptoKeyword(keyword: string): boolean {
    const cryptoKeywords = [
      'bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 'cryptocurrency',
      'blockchain', 'defi', 'nft', 'altcoin', 'stablecoin', 'mining',
      'wallet', 'exchange', 'token', 'coin', 'satoshi', 'wei', 'gwei'
    ];
    return cryptoKeywords.some(crypto => keyword.includes(crypto));
  }

  private isMarketKeyword(keyword: string): boolean {
    const marketKeywords = [
      'price', 'market', 'trading', 'bull', 'bear', 'pump', 'dump',
      'volume', 'capitalization', 'volatility', 'trend', 'analysis',
      'support', 'resistance', 'breakout', 'correction', 'rally'
    ];
    return marketKeywords.some(market => keyword.includes(market));
  }

  private isTechnologyKeyword(keyword: string): boolean {
    const techKeywords = [
      'protocol', 'consensus', 'proof', 'stake', 'work', 'hash',
      'smart', 'contract', 'dapp', 'layer', 'scaling', 'interoperability',
      'decentralized', 'distributed', 'node', 'validator'
    ];
    return techKeywords.some(tech => keyword.includes(tech));
  }

  private isRegulationKeyword(keyword: string): boolean {
    const regulationKeywords = [
      'regulation', 'legal', 'compliance', 'law', 'government',
      'sec', 'cftc', 'treasury', 'ban', 'approve', 'legislation',
      'policy', 'cbdc', 'institutional', 'etf'
    ];
    return regulationKeywords.some(reg => keyword.includes(reg));
  }

  calculateRelevanceScore(): number {
    // Combine frequency and sentiment to calculate relevance
    const frequencyScore = Math.min(this.frequency / 100, 1.0); // Normalize to 0-1
    const sentimentScore = Math.abs(this.averageSentiment); // Neutral sentiment is less relevant
    
    this.relevanceScore = (frequencyScore * 0.7) + (sentimentScore * 0.3);
    return this.relevanceScore;
  }

  static normalizeKeyword(keyword: string): string {
    return keyword.toLowerCase().trim().replace(/[^\w\s]/g, '');
  }
}