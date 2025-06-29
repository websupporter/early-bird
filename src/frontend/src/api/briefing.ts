import { apiClient } from './client';

export interface BriefingData {
  id?: string;
  title: string;
  summary: string;
  marketOverview: string;
  sentimentAnalysis: string;
  keyInsights: string[];
  recommendations: string[];
  confidence: number;
  date: string;
  metadata?: {
    sourceCount: number;
    dataPoints: number;
  };
}

export interface SentimentOverview {
  redditSentiment: number;
  wordpressSentiment: number;
  greedFearIndex: number;
}

export interface SystemStatus {
  reddit?: {
    activeSources: number;
  };
  wordpress?: {
    activeSources: number;
  };
}

export interface AnalysisResult {
  redditAnalyzed: number;
  wordpressAnalyzed: number;
}

export const briefingApi = {
  generateBriefing: async (options?: any): Promise<BriefingData> => {
    const response = await apiClient.post('/briefing/generate', options);
    return response.data;
  },

  getSentiment: async (): Promise<SentimentOverview> => {
    const response = await apiClient.get('/briefing/sentiment');
    return response.data;
  },

  getStatus: async (): Promise<SystemStatus> => {
    const response = await apiClient.get('/briefing/status');
    return response.data;
  },

  getHistory: async (days: number = 7): Promise<BriefingData[]> => {
    const response = await apiClient.get(`/briefing/history?days=${days}`);
    return response.data;
  },

  analyzeContent: async (limit: number = 100): Promise<AnalysisResult> => {
    const response = await apiClient.post('/briefing/analyze', { limit });
    return response.data;
  },
};