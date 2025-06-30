import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

export enum ContentType {
  REDDIT = 'reddit',
  WORDPRESS = 'wordpress',
  FEED = 'feed',
}

@Entity('keyword_content_links')
@Index(['keywordId', 'contentId', 'contentType'], { unique: true })
export class KeywordContentLink {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  keywordId!: number;

  @Column()
  contentId!: number;

  @Column({ type: 'enum', enum: ContentType })
  contentType!: ContentType;

  @Column({ type: 'int', default: 1 })
  frequency!: number; // How many times this keyword appears in this content

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0.0 })
  relevanceScore!: number; // 0.0 to 1.0 - how relevant this keyword is to this content

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0.0 })
  sentimentScore!: number; // Sentiment score of the content

  @Column({ type: 'text', nullable: true })
  context!: string; // Surrounding text where keyword appears

  @CreateDateColumn()
  createdAt!: Date;

  // Relations
  @ManyToOne('Keyword', 'contentLinks')
  @JoinColumn({ name: 'keywordId' })
  keyword!: any;

  // Methods
  calculateRelevanceScore(contentLength: number, keywordPositions: number[]): number {
    // Factor in frequency, position, and content length
    const frequencyScore = Math.min(this.frequency / 5, 1.0); // Normalize to 0-1
    
    // Keywords appearing early in content are more relevant
    const averagePosition = keywordPositions.reduce((sum, pos) => sum + pos, 0) / keywordPositions.length;
    const positionScore = Math.max(0, 1 - (averagePosition / contentLength));
    
    this.relevanceScore = (frequencyScore * 0.6) + (positionScore * 0.4);
    return this.relevanceScore;
  }

  extractContext(content: string, keyword: string, contextLength: number = 100): string {
    const keywordIndex = content.toLowerCase().indexOf(keyword.toLowerCase());
    if (keywordIndex === -1) return '';

    const start = Math.max(0, keywordIndex - contextLength / 2);
    const end = Math.min(content.length, keywordIndex + keyword.length + contextLength / 2);
    
    let context = content.substring(start, end);
    
    // Add ellipsis if truncated
    if (start > 0) context = '...' + context;
    if (end < content.length) context = context + '...';
    
    this.context = context;
    return context;
  }

  static createLink(
    keywordId: number,
    contentId: number,
    contentType: ContentType,
    frequency: number = 1,
    sentimentScore: number = 0.0
  ): KeywordContentLink {
    const link = new KeywordContentLink();
    link.keywordId = keywordId;
    link.contentId = contentId;
    link.contentType = contentType;
    link.frequency = frequency;
    link.sentimentScore = sentimentScore;
    return link;
  }
}