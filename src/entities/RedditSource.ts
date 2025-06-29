import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { RedditContent } from './RedditContent';

@Entity('reddit_sources')
export class RedditSource {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  subredditName: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string;

  @Column({ type: 'int', default: 0 })
  subscriberCount: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 24 })
  crawlIntervalHours: number;

  @Column({ type: 'datetime', nullable: true })
  lastCrawledAt: Date;

  @Column({ type: 'int', default: 0 })
  totalPostsCrawled: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0.0 })
  averageSentiment: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0.0 })
  reliabilityScore: number; // Based on prediction accuracy

  @Column({ type: 'text', nullable: true })
  crawlErrors: string; // JSON string of recent errors

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => RedditContent, content => content.source)
  content: RedditContent[];

  // Methods
  getNextCrawlTime(): Date {
    if (!this.lastCrawledAt) {
      return new Date();
    }
    
    const nextCrawl = new Date(this.lastCrawledAt);
    nextCrawl.setHours(nextCrawl.getHours() + this.crawlIntervalHours);
    
    return nextCrawl;
  }

  shouldCrawlNow(): boolean {
    if (!this.isActive) return false;
    
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
  }
}