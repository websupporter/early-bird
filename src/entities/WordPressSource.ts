import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { WordPressContent } from './WordPressContent';

@Entity('wordpress_sources')
export class WordPressSource {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 500, unique: true })
  siteUrl!: string;

  @Column({ type: 'varchar', length: 255 })
  siteName!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description!: string;

  @Column({ type: 'varchar', length: 1000 })
  apiEndpoint!: string; // WordPress REST API endpoint

  @Column({ type: 'varchar', length: 255, nullable: true })
  apiKey!: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'int', default: 12 })
  crawlIntervalHours!: number;

  @Column({ type: 'datetime', nullable: true })
  lastCrawledAt!: Date;

  @Column({ type: 'int', default: 0 })
  totalPostsCrawled!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0.0 })
  averageSentiment!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0.0 })
  reliabilityScore!: number; // Based on prediction accuracy

  @Column({ type: 'text', nullable: true })
  allowedCategories!: string; // JSON string of categories to crawl

  @Column({ type: 'text', nullable: true })
  excludedCategories!: string; // JSON string of categories to exclude

  @Column({ type: 'text', nullable: true })
  crawlErrors!: string; // JSON string of recent errors

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @OneToMany(() => WordPressContent, content => content.source)
  content!: WordPressContent[];

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

  getAllowedCategoriesArray(): string[] {
    return this.allowedCategories ? JSON.parse(this.allowedCategories) : [];
  }

  getExcludedCategoriesArray(): string[] {
    return this.excludedCategories ? JSON.parse(this.excludedCategories) : [];
  }

  setAllowedCategoriesArray(categories: string[]): void {
    this.allowedCategories = JSON.stringify(categories);
  }

  setExcludedCategoriesArray(categories: string[]): void {
    this.excludedCategories = JSON.stringify(categories);
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