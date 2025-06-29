import { RedditApiService } from '../services/RedditApiService';
import { RepositoryFactory } from '../repositories';
import { RedditContentType } from '../entities/RedditContent';
import { RedditUser } from '../entities/RedditUser';
import { RedditSource } from '../entities/RedditSource';
import { User } from '../entities/User';

export interface CrawlResult {
  sourceId: number;
  newPosts: number;
  newComments: number;
  newUsers: number;
  errors: string[];
  startTime: Date;
  endTime: Date;
}

export class RedditCrawlerService {
  private redditApi: RedditApiService;
  private redditContentRepo = RepositoryFactory.getRedditContentRepository();
  private redditUserRepo = RepositoryFactory.getRedditSourceRepository(); // Will create RedditUserRepository later
  private redditSourceRepo = RepositoryFactory.getRedditSourceRepository();
  private userRepo = RepositoryFactory.getUserRepository();

  constructor() {
    this.redditApi = new RedditApiService();
  }

  async crawlSource(sourceId: number): Promise<CrawlResult> {
    const startTime = new Date();
    const result: CrawlResult = {
      sourceId,
      newPosts: 0,
      newComments: 0,
      newUsers: 0,
      errors: [],
      startTime,
      endTime: new Date()
    };

    try {
      const source = await this.redditSourceRepo.findById(sourceId);
      if (!source) {
        throw new Error(`Reddit source with ID ${sourceId} not found`);
      }

      if (!source.isActive) {
        throw new Error(`Reddit source ${source.subredditName} is not active`);
      }

      console.log(`Starting crawl for r/${source.subredditName}`);

      // Fetch recent posts
      const posts = await this.redditApi.getSubredditPosts(source.subredditName, 100, 'day');
      
      for (const post of posts) {
        try {
          // Check if post already exists
          const existingPost = await this.redditContentRepo.findByRedditId(post.id);
          if (existingPost) continue;

          // Process author
          const authorUser = await this.processUser(post.author.name, post.author.id);
          const redditUser = await this.processRedditUser(post.author.name, post.author.id, authorUser.id);

          // Create content entry
          await this.redditContentRepo.create({
            redditId: post.id,
            type: RedditContentType.POST,
            title: post.title,
            content: post.selftext || '',
            url: post.url,
            upvotes: post.ups,
            downvotes: post.downs,
            commentCount: post.num_comments,
            postedAt: new Date(post.created_utc * 1000),
            authorId: redditUser.id,
            sourceId: source.id,
            isAnalyzed: false,
            sentimentScore: 0
          });

          result.newPosts++;

          // Crawl comments for this post (limit to prevent overwhelming)
          if (post.num_comments > 0 && post.num_comments <= 100) {
            try {
              const comments = await this.redditApi.getPostComments(post.id, 20);
              
              for (const comment of comments) {
                try {
                  const existingComment = await this.redditContentRepo.findByRedditId(comment.id);
                  if (existingComment) continue;

                  const commentAuthor = await this.processUser(comment.author.name, comment.author.id);
                  const redditCommentUser = await this.processRedditUser(comment.author.name, comment.author.id, commentAuthor.id);

                  await this.redditContentRepo.create({
                    redditId: comment.id,
                    type: RedditContentType.COMMENT,
                    title: `Comment on: ${post.title}`,
                    content: comment.body,
                    url: `${post.url}#${comment.id}`,
                    upvotes: comment.ups,
                    downvotes: comment.downs,
                    commentCount: 0,
                    postedAt: new Date(comment.created_utc * 1000),
                    authorId: redditCommentUser.id,
                    sourceId: source.id,
                    isAnalyzed: false,
                    sentimentScore: 0
                  });

                  result.newComments++;
                } catch (commentError) {
                  result.errors.push(`Error processing comment ${comment.id}: ${commentError instanceof Error ? commentError.message : 'Unknown error'}`);
                }
              }
            } catch (commentsError) {
              result.errors.push(`Error fetching comments for post ${post.id}: ${commentsError instanceof Error ? commentsError.message : 'Unknown error'}`);
            }
          }

        } catch (postError) {
          result.errors.push(`Error processing post ${post.id}: ${postError instanceof Error ? postError.message : 'Unknown error'}`);
        }
      }

      // Update source statistics
      await this.updateSourceStats(source, result.newPosts);

      console.log(`Crawl completed for r/${source.subredditName}: ${result.newPosts} posts, ${result.newComments} comments`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(`Crawl failed: ${errorMessage}`);
      console.error(`Error crawling source ${sourceId}:`, error);
      
      // Record error in source
      try {
        await this.redditSourceRepo.recordCrawlError(sourceId, errorMessage);
      } catch (recordError) {
        console.error('Failed to record crawl error:', recordError);
      }
    }

    result.endTime = new Date();
    return result;
  }

  async crawlAllActiveSources(): Promise<CrawlResult[]> {
    console.log('Starting crawl of all active Reddit sources');
    
    const sources = await this.redditSourceRepo.findSourcesReadyForCrawl();
    const results: CrawlResult[] = [];

    for (const source of sources) {
      try {
        const result = await this.crawlSource(source.id);
        results.push(result);
        
        // Rate limiting between sources
        await this.delay(2000);
      } catch (error) {
        console.error(`Failed to crawl source ${source.id}:`, error);
        results.push({
          sourceId: source.id,
          newPosts: 0,
          newComments: 0,
          newUsers: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
          startTime: new Date(),
          endTime: new Date()
        });
      }
    }

    console.log(`Completed crawling ${sources.length} Reddit sources`);
    return results;
  }

  private async processUser(username: string, _redditUserId?: string): Promise<User> {
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
      
      // Increment new users counter in calling method
      // This is handled in the calling method
    }

    return user;
  }

  private async processRedditUser(username: string, redditUserId: string | undefined, userId: number): Promise<RedditUser> {
    // For now, we'll create a simple implementation
    // Later we should create a proper RedditUserRepository
    const redditUserRepo = this.redditUserRepo as any; // Temporary cast
    
    // Check if Reddit user already exists
    const existingRedditUser = await redditUserRepo.findOne?.({ where: { redditUsername: username } });
    
    if (existingRedditUser) {
      return existingRedditUser;
    }

    // Create new Reddit user (simplified for now)
    return {
      id: Math.floor(Math.random() * 1000000), // Temporary ID generation
      redditUsername: username,
      redditUserId: redditUserId || '',
      avatar: '',
      karmaCount: 0,
      postCount: 0,
      commentCount: 0,
      isActive: true,
      userId,
      createdAt: new Date(),
      updatedAt: new Date()
    } as RedditUser;
  }

  private async updateSourceStats(source: RedditSource, newPostsCount: number): Promise<void> {
    try {
      // Calculate average sentiment (simplified for now)
      const averageSentiment = await this.redditContentRepo.getAverageSentimentBySource(source.id);
      
      await this.redditSourceRepo.updateCrawlStats(source.id, newPostsCount, averageSentiment);
    } catch (error) {
      console.error(`Failed to update stats for source ${source.id}:`, error);
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Health check method
  async getStatus(): Promise<{
    isHealthy: boolean;
    activeSources: number;
    sourcesReadyForCrawl: number;
    lastCrawlErrors: string[];
  }> {
    try {
      const activeSources = await this.redditSourceRepo.findActiveSources();
      const readySources = await this.redditSourceRepo.findSourcesReadyForCrawl();
      
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