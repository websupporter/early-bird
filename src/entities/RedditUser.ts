import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './User';
import { RedditContent } from './RedditContent';

@Entity('reddit_users')
export class RedditUser {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  redditUsername: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  redditUserId: string;

  @Column({ type: 'text', nullable: true })
  avatar: string;

  @Column({ type: 'int', default: 0 })
  karmaCount: number;

  @Column({ type: 'int', default: 0 })
  postCount: number;

  @Column({ type: 'int', default: 0 })
  commentCount: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @Column({ nullable: true })
  userId: number;

  @ManyToOne(() => User, user => user.redditUsers)
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => RedditContent, content => content.author)
  posts: RedditContent[];
}