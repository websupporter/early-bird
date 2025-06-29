import { WordPressApiService } from '../services/WordPressApiService';
import { RepositoryFactory } from '../repositories';
import { WordPressContentStatus } from '../entities/WordPressContent';
import { WordPressUser } from '../entities/WordPressUser';
import { WordPressSource } from '../entities/WordPressSource';
import { User } from '../entities/User';

export interface WordPressCrawlResult {
  sourceId: number;
  newPosts: number;
  newUsers: number;
  errors: string[];
  startTime: Date;
  endTime: Date;
}

export class WordPressCrawlerService {
  private wordpressContentRepo = RepositoryFactory.getWordPressContentRepository();
  private wordpressSourceRepo = RepositoryFactory.getWordPressSourceRepository();
  private userRepo = RepositoryFactory.getUserRepository();

  async crawlSource(sourceId: number): Promise<WordPressCrawlResult> {
    const startTime = new Date();
    const result: WordPressCrawlResult = {
      sourceId,
      newPosts: 0,
      newUsers: 0,
      errors: [],
      startTime,
      endTime: new Date()
    };

    try {
      const source = await this.wordpressSourceRepo.findById(sourceId);
      if (!source) {
        throw new Error(`WordPress source with ID ${sourceId} not found`);
      }

      if (!source.isActive) {
        throw new Error(`WordPress source ${source.siteName} is not active`);
      }

      console.log(`Starting crawl for WordPress site: ${source.siteName}`);

      // Create WordPress API service for this source
      const wordpressApi = new WordPressApiService(source.siteUrl, source.apiKey || undefined);

      // Test connection first
      const isConnected = await wordpressApi.testConnection();
      if (!isConnected) {
        throw new Error(`Cannot connect to WordPress site: ${source.siteUrl}`);
      }

      // Get recent posts (last 7 days)
      const posts = await wordpressApi.getRecentPosts(7, 100);
      
      for (const post of posts) {
        try {
          // Check if post already exists
          const existingPost = await this.wordpressContentRepo.findByWordPressId(post.id.toString());
          if (existingPost) continue;

          // Process author
          let authorUser: User;
          let wordpressUser: WordPressUser;
          
          if (post._embedded?.author && post._embedded.author.length > 0) {
            const author = post._embedded.author[0];
            authorUser = await this.processUser(author.name);
            wordpressUser = await this.processWordPressUser(author, authorUser.id, source.id);
          } else {
            // Fallback for posts without embedded author data
            try {
              const author = await wordpressApi.getUser(post.author);
              authorUser = await this.processUser(author.name);
              wordpressUser = await this.processWordPressUser(author, authorUser.id, source.id);
            } catch (authorError) {
              // Create anonymous user if author fetch fails
              authorUser = await this.processUser('Anonymous');
              wordpressUser = await this.createAnonymousWordPressUser(authorUser.id, source.id);
            }
          }

          // Extract categories and tags
          const categories: string[] = [];
          const tags: string[] = [];

          if (post._embedded?.['wp:term']) {
            for (const termGroup of post._embedded['wp:term']) {
              for (const term of termGroup) {
                if (term.taxonomy === 'category') {
                  categories.push(term.name);
                } else if (term.taxonomy === 'post_tag') {
                  tags.push(term.name);
                }
              }
            }
          }

          // Clean HTML content
          const cleanContent = wordpressApi.stripHtml(post.content.rendered);
          const cleanExcerpt = wordpressApi.stripHtml(post.excerpt.rendered);

          // Create content entry
          await this.wordpressContentRepo.create({
            wordpressId: post.id.toString(),
            title: wordpressApi.stripHtml(post.title.rendered),
            content: cleanContent,
            excerpt: cleanExcerpt,
            url: post.link,
            status: post.status as WordPressContentStatus,
            categories: JSON.stringify(categories),
            tags: JSON.stringify(tags),
            viewCount: 0, // WordPress API doesn't provide view count by default
            commentCount: 0, // Would need separate API call
            publishedAt: new Date(post.date),
            modifiedAt: new Date(post.modified),
            authorId: wordpressUser.id,
            sourceId: source.id,
            isAnalyzed: false,
            sentimentScore: 0
          });

          result.newPosts++;

        } catch (postError) {
          result.errors.push(`Error processing post ${post.id}: ${postError instanceof Error ? postError.message : 'Unknown error'}`);
        }
      }

      // Update source statistics
      await this.updateSourceStats(source, result.newPosts);

      console.log(`Crawl completed for ${source.siteName}: ${result.newPosts} posts`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(`Crawl failed: ${errorMessage}`);
      console.error(`Error crawling WordPress source ${sourceId}:`, error);
      
      // Record error in source
      try {
        await this.wordpressSourceRepo.recordCrawlError(sourceId, errorMessage);
      } catch (recordError) {
        console.error('Failed to record crawl error:', recordError);
      }
    }

    result.endTime = new Date();
    return result;
  }

  async crawlAllActiveSources(): Promise<WordPressCrawlResult[]> {
    console.log('Starting crawl of all active WordPress sources');
    
    const sources = await this.wordpressSourceRepo.findSourcesReadyForCrawl();
    const results: WordPressCrawlResult[] = [];

    for (const source of sources) {
      try {
        const result = await this.crawlSource(source.id);
        results.push(result);
        
        // Rate limiting between sources
        await this.delay(3000);
      } catch (error) {
        console.error(`Failed to crawl WordPress source ${source.id}:`, error);
        results.push({
          sourceId: source.id,
          newPosts: 0,
          newUsers: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
          startTime: new Date(),
          endTime: new Date()
        });
      }
    }

    console.log(`Completed crawling ${sources.length} WordPress sources`);
    return results;
  }

  private async processUser(username: string): Promise<User> {
    // Check if user already exists
    let user = await this.userRepo.findByUsername(username);
    
    if (!user) {
      // Create new user
      user = await this.userRepo.create({
        username,
        bio: '',
        reputationScore: 0,
        totalPredictions: 0,
        correctPredictions: 0,
        accuracyRate: 0,
        isActive: true
      });
    }

    return user;
  }

  private async processWordPressUser(
    wpUser: { id: number; name: string; slug: string; avatar_urls: Record<string, string>; description?: string; url?: string },
    userId: number,
    _sourceId: number
  ): Promise<WordPressUser> {
    // For now, we'll create a simplified implementation
    // In a real implementation, we'd have a proper WordPressUserRepository
    
    return {
      id: Math.floor(Math.random() * 1000000), // Temporary ID generation
      wordpressUsername: wpUser.name,
      wordpressUserId: wpUser.id.toString(),
      email: '',
      avatar: wpUser.avatar_urls['96'] || wpUser.avatar_urls['48'] || '',
      websiteUrl: wpUser.url || '',
      postCount: 0,
      isActive: true,
      userId,
      createdAt: new Date(),
      updatedAt: new Date()
    } as WordPressUser;
  }

  private async createAnonymousWordPressUser(userId: number, _sourceId: number): Promise<WordPressUser> {
    return {
      id: Math.floor(Math.random() * 1000000),
      wordpressUsername: 'Anonymous',
      wordpressUserId: '0',
      email: '',
      avatar: '',
      websiteUrl: '',
      postCount: 0,
      isActive: true,
      userId,
      createdAt: new Date(),
      updatedAt: new Date()
    } as WordPressUser;
  }

  private async updateSourceStats(source: WordPressSource, newPostsCount: number): Promise<void> {
    try {
      // Calculate average sentiment (simplified for now)
      const averageSentiment = await this.wordpressContentRepo.getAverageSentimentBySource(source.id);
      
      await this.wordpressSourceRepo.updateCrawlStats(source.id, newPostsCount, averageSentiment);
    } catch (error) {
      console.error(`Failed to update stats for WordPress source ${source.id}:`, error);
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Sync site categories and tags
  async syncSiteMetadata(sourceId: number): Promise<void> {
    try {
      const source = await this.wordpressSourceRepo.findById(sourceId);
      if (!source) {
        throw new Error(`WordPress source with ID ${sourceId} not found`);
      }

      const wordpressApi = new WordPressApiService(source.siteUrl, source.apiKey || undefined);
      
      // Fetch categories
      const categories = await wordpressApi.getCategories({ per_page: 100 });
      const categoryNames = categories.map(cat => cat.name);
      
      // Update allowed categories if not set
      if (!source.allowedCategories) {
        source.setAllowedCategoriesArray(categoryNames);
        await this.wordpressSourceRepo.updateCrawlStats(source.id, 0, source.averageSentiment);
      }

      console.log(`Synced metadata for ${source.siteName}: ${categories.length} categories`);
    } catch (error) {
      console.error(`Failed to sync metadata for source ${sourceId}:`, error);
    }
  }

  // Health check method
  async getStatus(): Promise<{
    isHealthy: boolean;
    activeSources: number;
    sourcesReadyForCrawl: number;
    lastCrawlErrors: string[];
  }> {
    try {
      const activeSources = await this.wordpressSourceRepo.findActiveSources();
      const readySources = await this.wordpressSourceRepo.findSourcesReadyForCrawl();
      
      return {
        isHealthy: true,
        activeSources: activeSources.length,
        sourcesReadyForCrawl: readySources.length,
        lastCrawlErrors: []
      };
    } catch (error) {
      return {
        isHealthy: false,
        activeSources: 0,
        sourcesReadyForCrawl: 0,
        lastCrawlErrors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }
}