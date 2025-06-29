import { Repository, EntityTarget, FindOptionsWhere, FindManyOptions, ObjectLiteral, DeepPartial } from 'typeorm';
import { AppDataSource } from '../config/database';

export abstract class BaseRepository<T extends ObjectLiteral> {
  protected repository: Repository<T>;

  constructor(entity: EntityTarget<T>) {
    this.repository = AppDataSource.getRepository(entity);
  }

  async findAll(options?: FindManyOptions<T>): Promise<T[]> {
    return await this.repository.find(options);
  }

  async findById(id: number): Promise<T | null> {
    return await this.repository.findOne({ where: { id } as FindOptionsWhere<T> });
  }

  async create(entityData: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create(entityData);
    return await this.repository.save(entity);
  }

  async update(id: number, entityData: DeepPartial<T>): Promise<T | null> {
    await this.repository.update(id, entityData as any);
    return await this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected !== null && result.affected !== undefined && result.affected > 0;
  }

  async count(options?: FindManyOptions<T>): Promise<number> {
    return await this.repository.count(options);
  }

  async exists(where: FindOptionsWhere<T>): Promise<boolean> {
    const count = await this.repository.count({ where });
    return count > 0;
  }
}