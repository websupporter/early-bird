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
import { WordPressContent } from './WordPressContent';

@Entity('wordpress_users')
export class WordPressUser {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  wordpressUsername: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  wordpressUserId: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  email: string;

  @Column({ type: 'text', nullable: true })
  avatar: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  websiteUrl: string;

  @Column({ type: 'int', default: 0 })
  postCount: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @Column({ nullable: true })
  userId: number;

  @ManyToOne(() => User, user => user.wordpressUsers)
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => WordPressContent, content => content.author)
  posts: WordPressContent[];
}