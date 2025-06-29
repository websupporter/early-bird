import axios, { AxiosInstance } from 'axios';

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

  constructor(siteUrl: string, apiKey?: string) {
    this.baseUrl = this.normalizeUrl(siteUrl);
    
    this.client = axios.create({
      baseURL: `${this.baseUrl}/wp-json/wp/v2`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CryptoTraders Bot v1.0'
      }
    });

    if (apiKey) {
      this.client.defaults.headers.common['Authorization'] = `Bearer ${apiKey}`;
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
    try {
      const defaultParams = {
        per_page: 100,
        page: 1,
        status: 'publish',
        embed: true,
        ...params
      };

      const response = await this.client.get('/posts', { params: defaultParams });
      return response.data;
    } catch (error) {
      console.error(`Error fetching posts from ${this.baseUrl}:`, error);
      throw new Error(`Failed to fetch posts: ${axios.isAxiosError(error) ? error.message : 'Unknown error'}`);
    }
  }

  async getPost(postId: number, embed: boolean = true): Promise<WordPressPost> {
    try {
      const response = await this.client.get(`/posts/${postId}`, {
        params: { _embed: embed }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching post ${postId}:`, error);
      throw new Error(`Failed to fetch post ${postId}: ${axios.isAxiosError(error) ? error.message : 'Unknown error'}`);
    }
  }

  async getUsers(params: {
    per_page?: number;
    page?: number;
  } = {}): Promise<WordPressUser[]> {
    try {
      const defaultParams = {
        per_page: 100,
        page: 1,
        ...params
      };

      const response = await this.client.get('/users', { params: defaultParams });
      return response.data;
    } catch (error) {
      console.error(`Error fetching users from ${this.baseUrl}:`, error);
      throw new Error(`Failed to fetch users: ${axios.isAxiosError(error) ? error.message : 'Unknown error'}`);
    }
  }

  async getUser(userId: number): Promise<WordPressUser> {
    try {
      const response = await this.client.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching user ${userId}:`, error);
      throw new Error(`Failed to fetch user ${userId}: ${axios.isAxiosError(error) ? error.message : 'Unknown error'}`);
    }
  }

  async getCategories(params: {
    per_page?: number;
    page?: number;
  } = {}): Promise<WordPressCategory[]> {
    try {
      const defaultParams = {
        per_page: 100,
        page: 1,
        ...params
      };

      const response = await this.client.get('/categories', { params: defaultParams });
      return response.data;
    } catch (error) {
      console.error(`Error fetching categories from ${this.baseUrl}:`, error);
      throw new Error(`Failed to fetch categories: ${axios.isAxiosError(error) ? error.message : 'Unknown error'}`);
    }
  }

  async getTags(params: {
    per_page?: number;
    page?: number;
  } = {}): Promise<WordPressTag[]> {
    try {
      const defaultParams = {
        per_page: 100,
        page: 1,
        ...params
      };

      const response = await this.client.get('/tags', { params: defaultParams });
      return response.data;
    } catch (error) {
      console.error(`Error fetching tags from ${this.baseUrl}:`, error);
      throw new Error(`Failed to fetch tags: ${axios.isAxiosError(error) ? error.message : 'Unknown error'}`);
    }
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

  // Test API connectivity
  async testConnection(): Promise<boolean> {
    try {
      await this.client.get('/');
      return true;
    } catch (error) {
      console.error(`Connection test failed for ${this.baseUrl}:`, error);
      return false;
    }
  }

  // Get site information
  async getSiteInfo(): Promise<{
    name: string;
    description: string;
    url: string;
    home: string;
    gmt_offset: number;
    timezone_string: string;
  }> {
    try {
      const response = await this.client.get('/settings');
      return {
        name: response.data.title,
        description: response.data.description,
        url: response.data.url,
        home: response.data.home,
        gmt_offset: response.data.gmt_offset,
        timezone_string: response.data.timezone_string
      };
    } catch (error) {
      // Fallback if settings endpoint is not accessible
      return {
        name: this.baseUrl,
        description: '',
        url: this.baseUrl,
        home: this.baseUrl,
        gmt_offset: 0,
        timezone_string: 'UTC'
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