import { FindOptionsWhere } from 'typeorm';
import { BaseRepository } from './BaseRepository';
import { User } from '../entities/User';

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super(User);
  }

  async findByUsername(username: string): Promise<User | null> {
    return await this.repository.findOne({ where: { username } });
  }

  async findActiveUsers(): Promise<User[]> {
    return await this.repository.find({ where: { isActive: true } });
  }

  async findTopUsersByReputation(limit: number = 10): Promise<User[]> {
    return await this.repository.find({
      where: { isActive: true },
      order: { reputationScore: 'DESC' },
      take: limit
    });
  }

  async findTopUsersByAccuracy(limit: number = 10): Promise<User[]> {
    return await this.repository.find({
      where: { 
        isActive: true,
        totalPredictions: 5 // Minimum predictions required
      },
      order: { accuracyRate: 'DESC' },
      take: limit
    });
  }

  async updateUserStats(userId: number, correctPredictions: number, totalPredictions: number): Promise<User | null> {
    const user = await this.findById(userId);
    if (!user) return null;

    user.correctPredictions = correctPredictions;
    user.totalPredictions = totalPredictions;
    user.calculateAccuracyRate();
    user.updateReputationScore();

    return await this.repository.save(user);
  }

  async deactivateUser(userId: number): Promise<boolean> {
    const result = await this.repository.update(userId, { isActive: false });
    return result.affected !== undefined && result.affected > 0;
  }

  async reactivateUser(userId: number): Promise<boolean> {
    const result = await this.repository.update(userId, { isActive: true });
    return result.affected !== undefined && result.affected > 0;
  }
}