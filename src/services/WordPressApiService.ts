import axios, { AxiosInstance, AxiosError } from 'axios';

export interface WordPressPost {
  id: number;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
  };
  excerpt: {
    rendered: string;
  };
  link: string;
  status: string;
  date: string;
  modified: string;
  author: number;
  categories: number[];
  tags: number[];
  comment_status: string;
  _embedded?: {
    author?: Array<{
      id: number;
      name: string;
      slug: string;
      avatar_urls: Record<string, string>;
    }>;
    'wp:term'?: Array<Array<{
      id: number;
      name: string;
      slug: string;
      taxonomy: string;
    }>>;
  };
}

export interface WordPressUser {
  id: number;
  name: string;
  slug: string;
  avatar_urls: Record<string, string>;
  description: string;
  url: string;
}

export interface WordPressCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  count: number;
}

export interface WordPressTag {
  id: number;
  name: string;
  slug: string;
  description: string;
  count: number;
}

export class WordPressApiService {
  private client: AxiosInstance;
  private baseUrl: string;
  private endpointCapabilities: Map<string, boolean> = new Map();

  constructor(siteUrl: string, apiKey?: string) {
    this.baseUrl = this.normalizeUrl(siteUrl);
    
    this.client = axios.create({
      baseURL: `${this.baseUrl}/wp-json/wp/v2`,
      timeout: 15000, // Reduced timeout for faster error detection
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CryptoTraders Bot v1.0'
      }
    });

    if (apiKey) {
      this.client.defaults.headers.common['Authorization'] = `Bearer ${apiKey}`;
    }

    // Add response interceptor for better error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        this.handleApiError(error);
        return Promise.reject(error);
      }
    );
  }

  private handleApiError(error: AxiosError): void {
    if (error.response) {
      const status = error.response.status;
      const endpoint = error.config?.url || 'unknown';
      
      switch (status) {
        case 404:
          console.warn(`WordPress endpoint not found: ${endpoint} (${this.baseUrl})`);
          this.endpointCapabilities.set(endpoint, false);
          break;
        case 403:
          console.warn(`WordPress endpoint forbidden: ${endpoint} (${this.baseUrl})`);
          break;
        case 401:
          console.warn(`WordPress authentication failed: ${endpoint} (${this.baseUrl})`);
          break;
        case 500:
        case 502:
        case 503:
          console.warn(`WordPress server error: ${status} for ${endpoint} (${this.baseUrl})`);
          break;
        default:
          console.warn(`WordPress API error: ${status} for ${endpoint} (${this.baseUrl})`);
      }
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.error(`WordPress site unreachable: ${this.baseUrl}`);
    } else if (error.code === 'ECONNABORTED') {
      console.warn(`WordPress API timeout: ${this.baseUrl}`);
    }
  }

  private async checkEndpointExists(endpoint: string): Promise<boolean> {
    // Check cache first
    if (this.endpointCapabilities.has(endpoint)) {
      return this.endpointCapabilities.get(endpoint)!;
    }

    try {
      await this.client.head(endpoint);
      this.endpointCapabilities.set(endpoint, true);
      return true;
    } catch (error) {
      this.endpointCapabilities.set(endpoint, false);
      return false;
    }
  }

  private validateResponse<T>(data: any, requiredFields: string[]): T | null {
    if (!data || typeof data !== 'object') {
      return null;
    }

    // Check if required fields exist
    for (const field of requiredFields) {
      if (!(field in data)) {
        console.warn(`Missing required field '${field}' in WordPress response`);
        return null;
      }
    }

    return data as T;
  }

  private async safeApiCall<T>(
    endpoint: string, 
    params: any = {}, 
    requiredFields: string[] = [],
    fallbackValue: T | null = null
  ): Promise<T | null> {
    try {
      // Check if endpoint exists first
      if (!(await this.checkEndpointExists(endpoint))) {
        console.warn(`Endpoint ${endpoint} does not exist, returning fallback`);
        return fallbackValue;
      }

      const response = await this.client.get(endpoint, { params });
      
      if (requiredFields.length > 0) {
        return this.validateResponse<T>(response.data, requiredFields);
      }
      
      return response.data;
    } catch (error) {
      console.error(`Safe API call failed for ${endpoint}:`, error);
      return fallbackValue;
    }
  }

  private normalizeUrl(url: string): string {
    // Remove trailing slash and ensure https
    let normalized = url.replace(/\/$/, '');
    if (!normalized.startsWith('http')) {
      normalized = `https://${normalized}`;
    }
    return normalized;
  }

  async getPosts(params: {
    per_page?: number;
    page?: number;
    categories?: number[];
    tags?: number[];
    after?: string;
    before?: string;
    status?: string;
    embed?: boolean;
  } = {}): Promise<WordPressPost[]> {
    const defaultParams = {
      per_page: 100,
      page: 1,
      status: 'publish',
      embed: true,
      ...params
    };

    const result = await this.safeApiCall<WordPressPost[]>(
      '/posts', 
      defaultParams, 
      [], 
      []
    );

    // Validate each post has required fields
    if (Array.isArray(result)) {
      return result.filter(post => 
        post && 
        post.id && 
        post.title && 
        post.content &&
        post.date
      );
    }

    return [];
  }

  async getPost(postId: number, embed: boolean = true): Promise<WordPressPost | null> {
    const result = await this.safeApiCall<WordPressPost>(
      `/posts/${postId}`,
      { _embed: embed },
      ['id', 'title', 'content', 'date'],
      null
    );

    return result;
  }

  async getUsers(params: {
    per_page?: number;
    page?: number;
  } = {}): Promise<WordPressUser[]> {
    const defaultParams = {
      per_page: 100,
      page: 1,
      ...params
    };

    const result = await this.safeApiCall<WordPressUser[]>(
      '/users',
      defaultParams,
      [],
      []
    );

    return Array.isArray(result) ? result : [];
  }

  async getUser(userId: number): Promise<WordPressUser | null> {
    const result = await this.safeApiCall<WordPressUser>(
      `/users/${userId}`,
      {},
      ['id', 'name'],
      null
    );

    return result;
  }

  async getCategories(params: {
    per_page?: number;
    page?: number;
  } = {}): Promise<WordPressCategory[]> {
    const defaultParams = {
      per_page: 100,
      page: 1,
      ...params
    };

    const result = await this.safeApiCall<WordPressCategory[]>(
      '/categories',
      defaultParams,
      [],
      []
    );

    return Array.isArray(result) ? result : [];
  }

  async getTags(params: {
    per_page?: number;
    page?: number;
  } = {}): Promise<WordPressTag[]> {
    const defaultParams = {
      per_page: 100,
      page: 1,
      ...params
    };

    const result = await this.safeApiCall<WordPressTag[]>(
      '/tags',
      defaultParams,
      [],
      []
    );

    return Array.isArray(result) ? result : [];
  }

  async getPostsByCategory(categoryId: number, limit: number = 50): Promise<WordPressPost[]> {
    return await this.getPosts({
      categories: [categoryId],
      per_page: limit,
      embed: true
    });
  }

  async getPostsByTag(tagId: number, limit: number = 50): Promise<WordPressPost[]> {
    return await this.getPosts({
      tags: [tagId],
      per_page: limit,
      embed: true
    });
  }

  async getPostsByDateRange(after: string, before: string, limit: number = 100): Promise<WordPressPost[]> {
    return await this.getPosts({
      after,
      before,
      per_page: limit,
      embed: true
    });
  }

  async getRecentPosts(days: number = 1, limit: number = 100): Promise<WordPressPost[]> {
    const after = new Date();
    after.setDate(after.getDate() - days);
    
    return await this.getPosts({
      after: after.toISOString(),
      per_page: limit,
      embed: true
    });
  }

  // Helper method to extract clean text from HTML content
  stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
      .replace(/&amp;/g, '&') // Replace &amp; with &
      .replace(/&lt;/g, '<') // Replace &lt; with <
      .replace(/&gt;/g, '>') // Replace &gt; with >
      .replace(/&quot;/g, '"') // Replace &quot; with "
      .replace(/&#039;/g, "'") // Replace &#039; with '
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
  }

  // Enhanced connection test
  async testConnection(): Promise<{ isConnected: boolean; capabilities: string[] }> {
    const capabilities: string[] = [];
    
    try {
      // Test root endpoint
      await this.client.get('/');
      capabilities.push('root');
      
      // Test common endpoints
      const endpointsToTest = ['/posts', '/users', '/categories', '/tags'];
      
      for (const endpoint of endpointsToTest) {
        try {
          await this.client.head(endpoint);
          capabilities.push(endpoint.substring(1)); // Remove leading slash
          this.endpointCapabilities.set(endpoint, true);
        } catch (error) {
          this.endpointCapabilities.set(endpoint, false);
        }
      }
      
      return { isConnected: true, capabilities };
    } catch (error) {
      console.error(`Connection test failed for ${this.baseUrl}:`, error);
      return { isConnected: false, capabilities: [] };
    }
  }

  // Enhanced site info with better error handling
  async getSiteInfo(): Promise<{
    name: string;
    description: string;
    url: string;
    home: string;
    gmt_offset: number;
    timezone_string: string;
    hasRestApi: boolean;
    apiCapabilities: string[];
  }> {
    try {
      const connectionTest = await this.testConnection();
      
             // Try to get settings
       const settings = await this.safeApiCall<any>('/settings', {}, [], null);
      
      if (settings) {
        return {
          name: settings.title || this.baseUrl,
          description: settings.description || '',
          url: settings.url || this.baseUrl,
          home: settings.home || this.baseUrl,
          gmt_offset: settings.gmt_offset || 0,
          timezone_string: settings.timezone_string || 'UTC',
          hasRestApi: connectionTest.isConnected,
          apiCapabilities: connectionTest.capabilities
        };
      }
      
      // Fallback if settings are not accessible
      return {
        name: this.baseUrl,
        description: '',
        url: this.baseUrl,
        home: this.baseUrl,
        gmt_offset: 0,
        timezone_string: 'UTC',
        hasRestApi: connectionTest.isConnected,
        apiCapabilities: connectionTest.capabilities
      };
    } catch (error) {
      console.error(`Failed to get site info for ${this.baseUrl}:`, error);
      return {
        name: this.baseUrl,
        description: '',
        url: this.baseUrl,
        home: this.baseUrl,
        gmt_offset: 0,
        timezone_string: 'UTC',
        hasRestApi: false,
        apiCapabilities: []
      };
    }
  }

  // Batch processing with rate limiting
  async processInBatches<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    batchSize: number = 5,
    delayMs: number = 1000
  ): Promise<R[]> {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(item => processor(item))
      );
      
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error('Batch processing error:', result.reason);
        }
      }
      
      // Rate limiting delay
      if (i + batchSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    return results;
  }
}