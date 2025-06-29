import { apiClient } from './client';

export interface RedditSource {
  id: string;
  subredditName: string;
  description: string;
  crawlIntervalHours: number;
  isActive: boolean;
  totalPostsCrawled: number;
}

export interface WordPressSource {
  id: string;
  siteUrl: string;
  siteName: string;
  description: string;
  crawlIntervalHours: number;
  isActive: boolean;
  totalPostsCrawled: number;
}

export interface SystemStats {
  totalSources: number;
  redditSources: number;
  wordpressSources: number;
}

export interface CreateRedditSourceData {
  subredditName: string;
  description: string;
  crawlIntervalHours: number;
}

export interface CreateWordPressSourceData {
  siteUrl: string;
  siteName: string;
  description: string;
  crawlIntervalHours: number;
}

export const adminApi = {
  // Statistics
  getStats: async (): Promise<SystemStats> => {
    const response = await apiClient.get('/admin/stats');
    return response.data;
  },

  // Reddit Sources
  getRedditSources: async (): Promise<RedditSource[]> => {
    const response = await apiClient.get('/admin/reddit/sources');
    return response.data;
  },

  createRedditSource: async (data: CreateRedditSourceData): Promise<RedditSource> => {
    const response = await apiClient.post('/admin/reddit/sources', data);
    return response.data;
  },

  updateRedditSource: async (id: string, data: Partial<RedditSource>): Promise<RedditSource> => {
    const response = await apiClient.put(`/admin/reddit/sources/${id}`, data);
    return response.data;
  },

  deleteRedditSource: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/reddit/sources/${id}`);
  },

  // WordPress Sources
  getWordPressSources: async (): Promise<WordPressSource[]> => {
    const response = await apiClient.get('/admin/wordpress/sources');
    return response.data;
  },

  createWordPressSource: async (data: CreateWordPressSourceData): Promise<WordPressSource> => {
    const response = await apiClient.post('/admin/wordpress/sources', data);
    return response.data;
  },

  updateWordPressSource: async (id: string, data: Partial<WordPressSource>): Promise<WordPressSource> => {
    const response = await apiClient.put(`/admin/wordpress/sources/${id}`, data);
    return response.data;
  },

  deleteWordPressSource: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/wordpress/sources/${id}`);
  },

  // Crawling
  runFullCrawl: async (): Promise<void> => {
    await apiClient.post('/admin/crawl/full');
  },

  runRedditCrawl: async (): Promise<void> => {
    await apiClient.post('/admin/crawl/reddit');
  },

  runWordPressCrawl: async (): Promise<void> => {
    await apiClient.post('/admin/crawl/wordpress');
  },

  updateMarketData: async (): Promise<void> => {
    await apiClient.post('/admin/crawl/market');
  },
};