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
  warnings: string[];
  skippedPosts: number;
  apiCapabilities: string[];
  startTime: Date;
  endTime: Date;
}

export class WordPressCrawlerService {
  private wordpressContentRepo = RepositoryFactory.getWordPressContentRepository();
  private wordpressSourceRepo = RepositoryFactory.getWordPressSourceRepository();
  private wordpressUserRepo = RepositoryFactory.getWordPressUserRepository();
  private userRepo = RepositoryFactory.getUserRepository();

  async crawlSource(sourceId: number): Promise<WordPressCrawlResult> {
    const startTime = new Date();
    const result: WordPressCrawlResult = {
      sourceId,
      newPosts: 0,
      newUsers: 0,
      errors: [],
      warnings: [],
      skippedPosts: 0,
      apiCapabilities: [],
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

      // Test connection and get capabilities
      const connectionTest = await wordpressApi.testConnection();
      result.apiCapabilities = connectionTest.capabilities;
      
      if (!connectionTest.isConnected) {
        throw new Error(`Cannot connect to WordPress site: ${source.siteUrl}`);
      }

      // Check if posts endpoint is available
      if (!connectionTest.capabilities.includes('posts')) {
        throw new Error(`WordPress site ${source.siteUrl} does not support posts endpoint`);
      }

      console.log(`WordPress site capabilities: ${connectionTest.capabilities.join(', ')}`);

      // Get recent posts (last 7 days)
      const posts = await wordpressApi.getRecentPosts(7, 100);
      
      if (posts.length === 0) {
        result.warnings.push('No recent posts found in the last 7 days');
      }

      console.log(`Found ${posts.length} posts to process`);
      
      for (const post of posts) {
        try {
          // Validate post data
          if (!this.isValidPost(post)) {
            result.warnings.push(`Post ${post.id} has invalid data structure, skipping`);
            result.skippedPosts++;
            continue;
          }

          // Check if post already exists
          const existingPost = await this.wordpressContentRepo.findByWordPressId(post.id.toString());
          if (existingPost) {
            result.skippedPosts++;
            continue;
          }

          // Process author with graceful fallback
          const { authorUser, wordpressUser } = await this.processAuthorSafely(
            post, 
            wordpressApi, 
            source, 
            result
          );

          // Extract categories and tags safely
          const { categories, tags } = this.extractTermsSafely(post, result);

          // Clean HTML content safely
          const cleanContent = this.cleanContent(post.content?.rendered || '');
          const cleanExcerpt = this.cleanContent(post.excerpt?.rendered || '');
          let cleanTitle = this.cleanContent(post.title?.rendered || 'Untitled');

          // Ensure title fits database constraints
          if (cleanTitle.length > 500) {
            cleanTitle = cleanTitle.substring(0, 497) + '...';
            result.warnings.push(`Post ${post.id} title truncated due to length`);
          }

          // Validate required content
          if (!cleanTitle || !cleanContent) {
            result.warnings.push(`Post ${post.id} has no title or content, skipping`);
            result.skippedPosts++;
            continue;
          }

          // Ensure URL fits database constraints
          let postUrl = post.link || `${source.siteUrl}/?p=${post.id}`;
          if (postUrl.length > 1000) {
            postUrl = postUrl.substring(0, 1000);
            result.warnings.push(`Post ${post.id} URL truncated due to length`);
          }

          // Log original status for debugging
          if (post.status && !['publish', 'published', 'draft', 'private'].includes(post.status.toLowerCase())) {
            console.log(`Post ${post.id} has unusual status: '${post.status}' - mapping to enum value`);
          }

          // Ensure wordpressId is valid
          const wordpressId = post.id.toString();
          if (wordpressId.length > 255) {
            result.warnings.push(`Post ${post.id} has unusually long ID, skipping`);
            result.skippedPosts++;
            continue;
          }

          // Create content entry
          await this.wordpressContentRepo.create({
            wordpressId: wordpressId,
            title: cleanTitle,
            content: cleanContent,
            excerpt: cleanExcerpt,
            url: postUrl,
            status: this.mapWordPressStatus(post.status),
            categories: JSON.stringify(categories),
            tags: JSON.stringify(tags),
            viewCount: 0,
            commentCount: 0,
            publishedAt: this.parseDate(post.date) || new Date(),
            modifiedAt: this.parseDate(post.modified) || new Date(),
            authorId: wordpressUser.id,
            sourceId: source.id,
            isAnalyzed: false,
            sentimentScore: 0
          });

          result.newPosts++;

        } catch (postError) {
          const errorMessage = postError instanceof Error ? postError.message : 'Unknown error';
          result.errors.push(`Error processing post ${post.id}: ${errorMessage}`);
          console.error(`Error processing post ${post.id}:`, postError);
        }
      }

      // Update source statistics
      await this.updateSourceStats(source, result.newPosts);

      // Log completion with summary
      const summary = `Crawl completed for ${source.siteName}: ${result.newPosts} new posts, ${result.skippedPosts} skipped, ${result.errors.length} errors, ${result.warnings.length} warnings`;
      console.log(summary);

      if (result.warnings.length > 0) {
        console.warn(`Warnings for ${source.siteName}:`, result.warnings);
      }

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

  private isValidPost(post: any): boolean {
    return post && 
           typeof post.id === 'number' && 
           post.title && 
           post.content && 
           post.date;
  }

  private async processAuthorSafely(
    post: any, 
    wordpressApi: WordPressApiService, 
    source: WordPressSource, 
    result: WordPressCrawlResult
  ): Promise<{ authorUser: User; wordpressUser: WordPressUser }> {
    let authorUser: User;
    let wordpressUser: WordPressUser;

    try {
      // Try embedded author first
      if (post._embedded?.author && post._embedded.author.length > 0) {
        const author = post._embedded.author[0];
        if (author.name) {
          authorUser = await this.processUser(author.name);
          wordpressUser = await this.processWordPressUser(author, authorUser.id, source.id);
          return { authorUser, wordpressUser };
        }
      }

      // Try to fetch author by ID if available
      if (post.author && typeof post.author === 'number') {
        try {
          const author = await wordpressApi.getUser(post.author);
          if (author && author.name) {
            authorUser = await this.processUser(author.name);
            wordpressUser = await this.processWordPressUser(author, authorUser.id, source.id);
            return { authorUser, wordpressUser };
          }
        } catch (authorFetchError) {
          result.warnings.push(`Failed to fetch author ${post.author} for post ${post.id}: ${authorFetchError instanceof Error ? authorFetchError.message : 'Unknown error'}`);
        }
      }

      // If everything fails, use anonymous user
      result.warnings.push(`Could not fetch author for post ${post.id}, using anonymous`);
      authorUser = await this.processUser('Anonymous');
      wordpressUser = await this.createAnonymousWordPressUser(authorUser.id, source.id);
      
    } catch (authorError) {
      // Final fallback to anonymous user
      result.warnings.push(`Author fetch failed for post ${post.id}: ${authorError instanceof Error ? authorError.message : 'Unknown error'}`);
      authorUser = await this.processUser('Anonymous');
      wordpressUser = await this.createAnonymousWordPressUser(authorUser.id, source.id);
    }

    return { authorUser, wordpressUser };
  }

  private extractTermsSafely(post: any, result: WordPressCrawlResult): { categories: string[]; tags: string[] } {
    const categories: string[] = [];
    const tags: string[] = [];

    try {
      if (post._embedded?.['wp:term']) {
        for (const termGroup of post._embedded['wp:term']) {
          if (Array.isArray(termGroup)) {
            for (const term of termGroup) {
              if (term && term.name && term.taxonomy) {
                if (term.taxonomy === 'category') {
                  categories.push(term.name);
                } else if (term.taxonomy === 'post_tag') {
                  tags.push(term.name);
                }
              }
            }
          }
        }
      }
    } catch (error) {
      result.warnings.push(`Failed to extract terms for post ${post.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return { categories, tags };
  }

  private cleanContent(content: string): string {
    if (!content || typeof content !== 'string') {
      return '';
    }

    try {
      // Use the API service's stripHtml method
      const wordpressApi = new WordPressApiService('temp');
      return wordpressApi.stripHtml(content);
    } catch (error) {
      // Fallback to basic HTML stripping
      return content
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
    }
  }

  private parseDate(dateString: string): Date | null {
    if (!dateString) return null;
    
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? null : date;
    } catch (error) {
      return null;
    }
  }

  private mapWordPressStatus(wpStatus: string): WordPressContentStatus {
    if (!wpStatus || typeof wpStatus !== 'string') {
      return WordPressContentStatus.PUBLISHED;
    }

    // Normalize the status string
    const normalizedStatus = wpStatus.toLowerCase().trim();

    // Map WordPress status values to our enum
    switch (normalizedStatus) {
      case 'publish':
      case 'published':
        return WordPressContentStatus.PUBLISHED;
      
      case 'draft':
      case 'auto-draft':
        return WordPressContentStatus.DRAFT;
      
      case 'private':
        return WordPressContentStatus.PRIVATE;
      
      case 'future':
      case 'pending':
      case 'inherit':
      case 'trash':
      default:
        // For any unrecognized status, default to PUBLISHED
        // This ensures we don't lose content due to unknown status values
        console.warn(`Unknown WordPress status '${wpStatus}', defaulting to PUBLISHED`);
        return WordPressContentStatus.PUBLISHED;
    }
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
          warnings: [],
          skippedPosts: 0,
          apiCapabilities: [],
          startTime: new Date(),
          endTime: new Date()
        });
      }
    }

    const totalPosts = results.reduce((sum, r) => sum + r.newPosts, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
    const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);

    console.log(`Completed crawling ${sources.length} WordPress sources: ${totalPosts} posts, ${totalErrors} errors, ${totalWarnings} warnings`);
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
    // Check if WordPress user already exists
    const existingWpUser = await this.wordpressUserRepo.findByWordPressUserId(wpUser.id.toString());
    
    if (existingWpUser) {
      // Update post count and return existing user
      await this.wordpressUserRepo.updatePostCount(existingWpUser.id);
      return existingWpUser;
    }

    // Create new WordPress user
    const newWpUser = await this.wordpressUserRepo.create({
      wordpressUsername: wpUser.name || 'Unknown',
      wordpressUserId: wpUser.id.toString(),
      email: '',
      avatar: wpUser.avatar_urls?.['96'] || wpUser.avatar_urls?.['48'] || '',
      websiteUrl: wpUser.url || '',
      postCount: 1,
      isActive: true,
      userId
    });

    return newWpUser;
  }

  private async createAnonymousWordPressUser(userId: number, _sourceId: number): Promise<WordPressUser> {
    // Check if anonymous user already exists for this base user
    const existingAnonymous = await this.wordpressUserRepo.findByWordPressUserId('0');
    
    if (existingAnonymous) {
      // Update post count and return existing anonymous user
      await this.wordpressUserRepo.updatePostCount(existingAnonymous.id);
      return existingAnonymous;
    }

    // Create new anonymous WordPress user
    const anonymousUser = await this.wordpressUserRepo.create({
      wordpressUsername: 'Anonymous',
      wordpressUserId: '0',
      email: '',
      avatar: '',
      websiteUrl: '',
      postCount: 1,
      isActive: true,
      userId
    });

    return anonymousUser;
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

  // Enhanced sync method with better error handling
  async syncSiteMetadata(sourceId: number): Promise<void> {
    try {
      const source = await this.wordpressSourceRepo.findById(sourceId);
      if (!source) {
        throw new Error(`WordPress source with ID ${sourceId} not found`);
      }

      const wordpressApi = new WordPressApiService(source.siteUrl, source.apiKey || undefined);
      
      // Test connection first
      const connectionTest = await wordpressApi.testConnection();
      if (!connectionTest.isConnected) {
        throw new Error(`Cannot connect to WordPress site: ${source.siteUrl}`);
      }

      // Check if categories endpoint is available
      if (connectionTest.capabilities.includes('categories')) {
        try {
          const categories = await wordpressApi.getCategories({ per_page: 100 });
          const categoryNames = categories.map(cat => cat.name);
          
          // Update allowed categories if not set
          if (!source.allowedCategories && categoryNames.length > 0) {
            source.setAllowedCategoriesArray(categoryNames);
            await this.wordpressSourceRepo.updateCrawlStats(source.id, 0, source.averageSentiment);
          }

          console.log(`Synced metadata for ${source.siteName}: ${categories.length} categories`);
        } catch (error) {
          console.warn(`Failed to sync categories for ${source.siteName}:`, error);
        }
      } else {
        console.warn(`Categories endpoint not available for ${source.siteName}`);
      }

    } catch (error) {
      console.error(`Failed to sync metadata for source ${sourceId}:`, error);
      throw error;
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