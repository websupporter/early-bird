import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USER || 'cryptouser',
  password: process.env.DB_PASSWORD || 'cryptopass123',
  database: process.env.DB_NAME || 'cryptotraders',
  synchronize: true, // TODO: Remove this in production
  logging: process.env.NODE_ENV === 'development',
  entities: [
    process.env.NODE_ENV === 'production' 
      ? 'dist/entities/**/*.js'
      : 'src/entities/**/*.ts'
  ],
  migrations: [
    process.env.NODE_ENV === 'production' 
      ? 'dist/migrations/**/*.js'
      : 'src/migrations/**/*.ts'
  ],
  subscribers: [
    process.env.NODE_ENV === 'production' 
      ? 'dist/subscribers/**/*.js'
      : 'src/subscribers/**/*.ts'
  ],
  extra: {
    connectionLimit: 10,
  },
});

export const initializeDatabase = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();
    console.log('Database connection established successfully');
  } catch (error) {
    console.error('Error during database initialization:', error);
    throw error;
  }
};