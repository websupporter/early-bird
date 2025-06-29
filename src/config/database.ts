import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: 'database.sqlite',
  synchronize: process.env.NODE_ENV === 'development',
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
    console.log('⚠️  Continuing without database connection...');
    // Don't throw the error, allow the app to start without database
  }
};