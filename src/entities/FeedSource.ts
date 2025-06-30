import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

@Entity('feed_sources')
export class FeedSource {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 500, unique: true })
  feedUrl!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  websiteUrl!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category!: string; // e.g., "News", "Blog", "Analysis"

  @Column({ type: 'varchar', length: 50, nullable: true })
  language!: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'int', default: 60 })
  crawlIntervalMinutes!: number;

  @Column({ type: 'datetime', nullable: true })
  lastCrawledAt!: Date;

  @Column({ type: 'datetime', nullable: true })
  lastSuccessfulCrawlAt!: Date;

  @Column({ type: 'int', default: 0 })
  totalArticlesCrawled!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0.0 })
  averageSentiment!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0.0 })
  reliabilityScore!: number;

  @Column({ type: 'int', default: 0 })
  consecutiveFailures!: number;

  @Column({ type: 'text', nullable: true })
  crawlErrors!: string; // JSON string of recent errors

  @Column({ type: 'varchar', length: 100, nullable: true })
  etag!: string; // For HTTP caching

  @Column({ type: 'varchar', length: 100, nullable: true })
  lastModified!: string; // For HTTP caching

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @OneToMany('FeedContent', 'source')
  content!: any[];

  // Methods
  getNextCrawlTime(): Date {
    if (!this.lastCrawledAt) {
      return new Date();
    }
    
    const nextCrawl = new Date(this.lastCrawledAt);
    nextCrawl.setMinutes(nextCrawl.getMinutes() + this.crawlIntervalMinutes);
    
    return nextCrawl;
  }

  shouldCrawlNow(): boolean {
    if (!this.isActive) return false;
    
    // Don't crawl if too many consecutive failures
    if (this.consecutiveFailures > 5) return false;
    
    const nextCrawlTime = this.getNextCrawlTime();
    return new Date() >= nextCrawlTime;
  }

  updateReliabilityScore(correctPredictions: number, totalPredictions: number): void {
    if (totalPredictions > 0) {
      this.reliabilityScore = (correctPredictions / totalPredictions) * 100;
    }
  }

  recordCrawlError(error: string): void {
    const errors = this.crawlErrors ? JSON.parse(this.crawlErrors) : [];
    errors.push({
      timestamp: new Date().toISOString(),
      error: error
    });
    
    // Keep only last 10 errors
    if (errors.length > 10) {
      errors.splice(0, errors.length - 10);
    }
    
    this.crawlErrors = JSON.stringify(errors);
    this.consecutiveFailures++;
  }

  recordSuccessfulCrawl(): void {
    this.lastSuccessfulCrawlAt = new Date();
    this.consecutiveFailures = 0;
  }

  isHealthy(): boolean {
    return this.isActive && this.consecutiveFailures <= 3;
  }
}