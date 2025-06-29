import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { WordPressUser } from './WordPressUser';
import { WordPressSource } from './WordPressSource';

export enum WordPressContentStatus {
  PUBLISHED = 'published',
  DRAFT = 'draft',
  PRIVATE = 'private',
}

@Entity('wordpress_content')
export class WordPressContent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  wordpressId: string;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'text', nullable: true })
  excerpt: string;

  @Column({ type: 'varchar', length: 1000 })
  url: string;

  @Column({ type: 'enum', enum: WordPressContentStatus, default: WordPressContentStatus.PUBLISHED })
  status: WordPressContentStatus;

  @Column({ type: 'text', nullable: true })
  categories: string; // JSON string of categories

  @Column({ type: 'text', nullable: true })
  tags: string; // JSON string of tags

  @Column({ type: 'int', default: 0 })
  viewCount: number;

  @Column({ type: 'int', default: 0 })
  commentCount: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0.0 })
  sentimentScore: number; // -1.0 to 1.0

  @Column({ type: 'text', nullable: true })
  extractedKeywords: string; // JSON string of keywords

  @Column({ type: 'boolean', default: false })
  isAnalyzed: boolean;

  @Column({ type: 'datetime' })
  publishedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  modifiedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @Column()
  authorId: number;

  @ManyToOne(() => WordPressUser, wordpressUser => wordpressUser.posts)
  @JoinColumn({ name: 'authorId' })
  author: WordPressUser;

  @Column()
  sourceId: number;

  @ManyToOne(() => WordPressSource, source => source.content)
  @JoinColumn({ name: 'sourceId' })
  source: WordPressSource;

  // Methods
  getEngagementScore(): number {
    if (this.viewCount === 0) return 0;
    
    const commentRatio = this.commentCount / this.viewCount;
    const viewVolume = Math.log(this.viewCount + 1);
    
    return commentRatio * viewVolume;
  }

  getCategoriesArray(): string[] {
    return this.categories ? JSON.parse(this.categories) : [];
  }

  getTagsArray(): string[] {
    return this.tags ? JSON.parse(this.tags) : [];
  }

  setCategoriesArray(categories: string[]): void {
    this.categories = JSON.stringify(categories);
  }

  setTagsArray(tags: string[]): void {
    this.tags = JSON.stringify(tags);
  }

  extractKeywordsFromContent(): string[] {
    // Simple keyword extraction - in production use NLP library
    const words = this.content.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    return [...new Set(words)];
  }
}