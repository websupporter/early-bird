import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { RedditUser } from './RedditUser';
import { RedditSource } from './RedditSource';

export enum RedditContentType {
  POST = 'post',
  COMMENT = 'comment',
}

@Entity('reddit_content')
export class RedditContent {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  redditId!: string;

  @Column({ type: 'enum', enum: RedditContentType })
  type!: RedditContentType;

  @Column({ type: 'varchar', length: 500 })
  title!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  url!: string;

  @Column({ type: 'int', default: 0 })
  upvotes!: number;

  @Column({ type: 'int', default: 0 })
  downvotes!: number;

  @Column({ type: 'int', default: 0 })
  commentCount!: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0.0 })
  sentimentScore!: number; // -1.0 to 1.0

  @Column({ type: 'text', nullable: true })
  extractedKeywords!: string; // JSON string of keywords

  @Column({ type: 'boolean', default: false })
  isAnalyzed!: boolean;

  @Column({ type: 'datetime' })
  postedAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @Column()
  authorId!: number;

  @ManyToOne(() => RedditUser, redditUser => redditUser.posts)
  @JoinColumn({ name: 'authorId' })
  author!: RedditUser;

  @Column()
  sourceId!: number;

  @ManyToOne(() => RedditSource, source => source.content)
  @JoinColumn({ name: 'sourceId' })
  source!: RedditSource;

  // Methods
  getEngagementScore(): number {
    const totalVotes = this.upvotes + this.downvotes;
    if (totalVotes === 0) return 0;
    
    const upvoteRatio = this.upvotes / totalVotes;
    const engagementVolume = Math.log(totalVotes + this.commentCount + 1);
    
    return upvoteRatio * engagementVolume;
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