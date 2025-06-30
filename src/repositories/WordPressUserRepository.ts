import { BaseRepository } from './BaseRepository';
import { WordPressUser } from '../entities/WordPressUser';

export class WordPressUserRepository extends BaseRepository<WordPressUser> {
  constructor() {
    super(WordPressUser);
  }

  async findByWordPressUserId(wordpressUserId: string): Promise<WordPressUser | null> {
    return await this.repository.findOne({ where: { wordpressUserId } });
  }

  async findByWordPressUsername(username: string): Promise<WordPressUser | null> {
    return await this.repository.findOne({ where: { wordpressUsername: username } });
  }

  async findByUserId(userId: number): Promise<WordPressUser[]> {
    return await this.repository.find({ 
      where: { userId },
      order: { createdAt: 'DESC' }
    });
  }

  async findActiveUsers(): Promise<WordPressUser[]> {
    return await this.repository.find({
      where: { isActive: true },
      order: { postCount: 'DESC' }
    });
  }

  async updatePostCount(wordpressUserId: number): Promise<WordPressUser | null> {
    const user = await this.findById(wordpressUserId);
    if (!user) return null;

    user.postCount++;
    user.updatedAt = new Date();
    
    return await this.repository.save(user);
  }

  async deactivateUser(wordpressUserId: number): Promise<boolean> {
    const result = await this.repository.update(wordpressUserId, { 
      isActive: false,
      updatedAt: new Date()
    });
    return result.affected !== null && result.affected !== undefined && result.affected > 0;
  }

  async reactivateUser(wordpressUserId: number): Promise<boolean> {
    const result = await this.repository.update(wordpressUserId, { 
      isActive: true,
      updatedAt: new Date()
    });
    return result.affected !== null && result.affected !== undefined && result.affected > 0;
  }

  async existsByWordPressUserId(wordpressUserId: string): Promise<boolean> {
    return await super.exists({ wordpressUserId });
  }

  async findTopActiveUsers(limit: number = 10): Promise<WordPressUser[]> {
    return await this.repository.find({
      where: { isActive: true },
      order: { postCount: 'DESC' },
      take: limit
    });
  }

  async updateUserProfile(
    wordpressUserId: number, 
    updates: Partial<Pick<WordPressUser, 'email' | 'avatar' | 'websiteUrl'>>
  ): Promise<WordPressUser | null> {
    const result = await this.repository.update(wordpressUserId, {
      ...updates,
      updatedAt: new Date()
    });
    
    if (result.affected === 0) return null;
    return await this.findById(wordpressUserId);
  }
} 