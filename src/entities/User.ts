import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { RedditUser } from './RedditUser';
import { WordPressUser } from './WordPressUser';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  bio: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0.0 })
  reputationScore: number;

  @Column({ type: 'int', default: 0 })
  totalPredictions: number;

  @Column({ type: 'int', default: 0 })
  correctPredictions: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0.0 })
  accuracyRate: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => RedditUser, redditUser => redditUser.user)
  redditUsers: RedditUser[];

  @OneToMany(() => WordPressUser, wordpressUser => wordpressUser.user)
  wordpressUsers: WordPressUser[];

  // Methods
  calculateAccuracyRate(): void {
    if (this.totalPredictions > 0) {
      this.accuracyRate = (this.correctPredictions / this.totalPredictions) * 100;
    } else {
      this.accuracyRate = 0;
    }
  }

  updateReputationScore(): void {
    // Simple reputation calculation based on accuracy and volume
    const baseScore = this.accuracyRate;
    const volumeBonus = Math.min(this.totalPredictions * 0.1, 20); // Max 20 points bonus
    this.reputationScore = Math.min(baseScore + volumeBonus, 100); // Cap at 100
  }
}