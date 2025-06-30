import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('feed_content')
export class FeedContent {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 500, unique: true })
  guid!: string; // RSS GUID or unique identifier

  @Column({ type: 'varchar', length: 1000 })
  title!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'text', nullable: true })
  summary!: string;

  @Column({ type: 'varchar', length: 1000 })
  url!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  author!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category!: string;

  @Column({ type: 'text', nullable: true })
  tags!: string; // JSON array of tags

  @Column({ type: 'varchar', length: 100, nullable: true })
  language!: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0.0 })
  sentimentScore!: number; // -1.0 to 1.0

  @Column({ type: 'varchar', length: 50, nullable: true })
  sentimentLabel!: string; // "bullish", "bearish", "neutral"

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0.0 })
  confidenceScore!: number; // 0.0 to 1.0

  @Column({ type: 'text', nullable: true })
  extractedKeywords!: string; // JSON string of keywords

  @Column({ type: 'boolean', default: false })
  isAnalyzed!: boolean;

  @Column({ type: 'int', default: 0 })
  wordCount!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0.0 })
  readabilityScore!: number;

  @Column({ type: 'datetime' })
  publishedAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @Column()
  sourceId!: number;

  @ManyToOne('FeedSource', 'content')
  @JoinColumn({ name: 'sourceId' })
  source!: any;

  // Methods
  getRelevanceScore(): number {
    // Combine sentiment confidence with keyword relevance
    const keywordScore = this.getKeywordRelevanceScore();
    return (this.confidenceScore * 0.6 + keywordScore * 0.4);
  }

  private getKeywordRelevanceScore(): number {
    if (!this.extractedKeywords) return 0;
    
    try {
      const keywords = JSON.parse(this.extractedKeywords);
      const cryptoKeywords = ['bitcoin', 'crypto', 'blockchain', 'ethereum', 'defi', 'nft'];
      const relevantKeywords = keywords.filter((keyword: string) => 
        cryptoKeywords.some(crypto => keyword.toLowerCase().includes(crypto))
      );
      
      return relevantKeywords.length / Math.max(keywords.length, 1);
    } catch {
      return 0;
    }
  }

  extractKeywordsFromContent(): string[] {
    // Simple keyword extraction - combines title and content
    const text = `${this.title} ${this.content}`.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    return [...new Set(text)];
  }

  categorizeContent(): string {
    const content = this.content.toLowerCase();
    const title = this.title.toLowerCase();
    
    // Simple categorization based on keywords
    if (content.includes('price') || content.includes('market') || content.includes('trading')) {
      return 'market-analysis';
    } else if (content.includes('regulation') || content.includes('legal') || content.includes('government')) {
      return 'regulation';
    } else if (content.includes('technology') || content.includes('blockchain') || content.includes('protocol')) {
      return 'technology';
    } else if (content.includes('adoption') || content.includes('institutional') || content.includes('mainstream')) {
      return 'adoption';
    }
    
    return 'general';
  }

  calculateWordCount(): number {
    const text = this.content.replace(/<[^>]*>/g, ''); // Remove HTML tags
    const words = text.split(/\s+/).filter(word => word.length > 0);
    this.wordCount = words.length;
    return this.wordCount;
  }
}