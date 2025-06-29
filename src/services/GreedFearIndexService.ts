import axios, { AxiosInstance } from 'axios';

export interface GreedFearData {
  value: string;
  value_classification: string;
  timestamp: string;
  time_until_update?: string;
}

export interface GreedFearResponse {
  name: string;
  data: GreedFearData[];
  metadata: {
    error?: string;
  };
}

export enum GreedFearClassification {
  EXTREME_FEAR = 'Extreme Fear',
  FEAR = 'Fear',
  NEUTRAL = 'Neutral',
  GREED = 'Greed',
  EXTREME_GREED = 'Extreme Greed'
}

export class GreedFearIndexService {
  private client: AxiosInstance;
  private baseUrl = 'https://api.alternative.me';

  constructor() {
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CryptoTraders Bot v1.0'
      }
    });
  }

  async getCurrentIndex(): Promise<GreedFearData> {
    try {
      const response = await this.client.get('/fng/');
      const data: GreedFearResponse = response.data;
      
      if (data.metadata.error) {
        throw new Error(data.metadata.error);
      }
      
      if (!data.data || data.data.length === 0) {
        throw new Error('No data available');
      }
      
      return data.data[0];
    } catch (error) {
      console.error('Error fetching current Greed & Fear Index:', error);
      throw new Error(`Failed to fetch current Greed & Fear Index: ${axios.isAxiosError(error) ? error.message : 'Unknown error'}`);
    }
  }

  async getHistoricalData(limit: number = 30): Promise<GreedFearData[]> {
    try {
      const response = await this.client.get('/fng/', {
        params: { limit }
      });
      const data: GreedFearResponse = response.data;
      
      if (data.metadata.error) {
        throw new Error(data.metadata.error);
      }
      
      return data.data || [];
    } catch (error) {
      console.error(`Error fetching historical Greed & Fear Index data (limit: ${limit}):`, error);
      throw new Error(`Failed to fetch historical data: ${axios.isAxiosError(error) ? error.message : 'Unknown error'}`);
    }
  }

  async getDataForDateRange(startDate: Date, endDate: Date): Promise<GreedFearData[]> {
    try {
      // Calculate days between dates
      const timeDiff = endDate.getTime() - startDate.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      // API doesn't support date range directly, so we get data for the number of days
      const historicalData = await this.getHistoricalData(daysDiff + 10); // Add buffer
      
      // Filter data within the date range
      const startTimestamp = Math.floor(startDate.getTime() / 1000);
      const endTimestamp = Math.floor(endDate.getTime() / 1000);
      
      return historicalData.filter(item => {
        const itemTimestamp = parseInt(item.timestamp);
        return itemTimestamp >= startTimestamp && itemTimestamp <= endTimestamp;
      });
    } catch (error) {
      console.error(`Error fetching Greed & Fear Index for date range:`, error);
      throw new Error(`Failed to fetch data for date range: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Convert numeric value to classification
  getClassificationFromValue(value: number): GreedFearClassification {
    if (value <= 25) return GreedFearClassification.EXTREME_FEAR;
    if (value <= 45) return GreedFearClassification.FEAR;
    if (value <= 55) return GreedFearClassification.NEUTRAL;
    if (value <= 75) return GreedFearClassification.GREED;
    return GreedFearClassification.EXTREME_GREED;
  }

  // Get color representation for UI
  getColorForValue(value: number): string {
    if (value <= 25) return '#ea3943'; // Red - Extreme Fear
    if (value <= 45) return '#fd5353'; // Light Red - Fear
    if (value <= 55) return '#f6d55c'; // Yellow - Neutral
    if (value <= 75) return '#93d741'; // Light Green - Greed
    return '#16c784'; // Green - Extreme Greed
  }

  // Calculate average over period
  calculateAverage(data: GreedFearData[]): number {
    if (data.length === 0) return 0;
    
    const sum = data.reduce((acc, curr) => acc + parseInt(curr.value), 0);
    return Math.round(sum / data.length);
  }

  // Get trend direction
  getTrend(data: GreedFearData[]): 'increasing' | 'decreasing' | 'stable' {
    if (data.length < 2) return 'stable';
    
    // Sort by timestamp (most recent first)
    const sortedData = [...data].sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp));
    
    const recent = parseInt(sortedData[0].value);
    const previous = parseInt(sortedData[1].value);
    
    const difference = recent - previous;
    
    if (Math.abs(difference) <= 2) return 'stable';
    return difference > 0 ? 'increasing' : 'decreasing';
  }

  // Get weekly summary
  async getWeeklySummary(): Promise<{
    current: GreedFearData;
    weekAverage: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    volatility: number;
    classification: GreedFearClassification;
  }> {
    try {
      const weekData = await this.getHistoricalData(7);
      const current = weekData[0];
      const weekAverage = this.calculateAverage(weekData);
      const trend = this.getTrend(weekData);
      
      // Calculate volatility (standard deviation)
      const values = weekData.map(d => parseInt(d.value));
      const mean = weekAverage;
      const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
      const volatility = Math.sqrt(variance);
      
      return {
        current,
        weekAverage,
        trend,
        volatility: Math.round(volatility * 100) / 100,
        classification: this.getClassificationFromValue(weekAverage)
      };
    } catch (error) {
      console.error('Error calculating weekly summary:', error);
      throw new Error(`Failed to calculate weekly summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Convert timestamp to Date
  timestampToDate(timestamp: string): Date {
    return new Date(parseInt(timestamp) * 1000);
  }

  // Format data for charting
  formatForChart(data: GreedFearData[]): Array<{
    date: string;
    value: number;
    classification: string;
    color: string;
  }> {
    return data.map(item => ({
      date: this.timestampToDate(item.timestamp).toISOString().split('T')[0],
      value: parseInt(item.value),
      classification: item.value_classification,
      color: this.getColorForValue(parseInt(item.value))
    }));
  }

  // Get extremes in dataset
  getExtremes(data: GreedFearData[]): {
    highest: { value: number; date: Date; classification: string };
    lowest: { value: number; date: Date; classification: string };
  } {
    if (data.length === 0) {
      throw new Error('No data provided for extremes calculation');
    }

    let highest = data[0];
    let lowest = data[0];

    data.forEach(item => {
      if (parseInt(item.value) > parseInt(highest.value)) {
        highest = item;
      }
      if (parseInt(item.value) < parseInt(lowest.value)) {
        lowest = item;
      }
    });

    return {
      highest: {
        value: parseInt(highest.value),
        date: this.timestampToDate(highest.timestamp),
        classification: highest.value_classification
      },
      lowest: {
        value: parseInt(lowest.value),
        date: this.timestampToDate(lowest.timestamp),
        classification: lowest.value_classification
      }
    };
  }
}