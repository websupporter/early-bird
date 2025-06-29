import Snoowrap from 'snoowrap';
import { RedditContent, RedditContentType } from '../entities/RedditContent';
import { RedditUser } from '../entities/RedditUser';
import { RedditSource } from '../entities/RedditSource';

export interface RedditPost {
  id: string;
  title: string;
  selftext: string;
  url: string;
  ups: number;
  downs: number;
  num_comments: number;
  created_utc: number;
  author: {
    name: string;
    id?: string;
  };
  subreddit: {
    display_name: string;
  };
}

export interface RedditComment {
  id: string;
  body: string;
  ups: number;
  downs: number;
  created_utc: number;
  author: {
    name: string;
    id?: string;
  };
  parent_id: string;
}

export class RedditApiService {
  private reddit: Snoowrap;

  constructor() {
    this.reddit = new Snoowrap({
      userAgent: process.env.REDDIT_USER_AGENT || 'CryptoTraders Bot v1.0',
      clientId: process.env.REDDIT_CLIENT_ID || '',
      clientSecret: process.env.REDDIT_CLIENT_SECRET || '',
      username: process.env.REDDIT_USERNAME || '',
      password: process.env.REDDIT_PASSWORD || ''
    });
  }

  async getSubredditPosts(subredditName: string, limit: number = 100, timeFilter: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all' = 'day'): Promise<RedditPost[]> {
    try {
      const subreddit = await this.reddit.getSubreddit(subredditName);
      const posts = await subreddit.getHot({ limit, time: timeFilter });
      
      return posts.map(post => ({
        id: post.id,
        title: post.title,
        selftext: post.selftext || '',
        url: post.url,
        ups: post.ups,
        downs: post.downs || 0,
        num_comments: post.num_comments,
        created_utc: post.created_utc,
        author: {
          name: post.author.name,
          id: post.author.id
        },
        subreddit: {
          display_name: post.subreddit.display_name
        }
      }));
    } catch (error) {
      console.error(`Error fetching posts from r/${subredditName}:`, error);
      throw new Error(`Failed to fetch posts from r/${subredditName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPostComments(postId: string, limit: number = 50): Promise<RedditComment[]> {
    try {
      const post = await this.reddit.getSubmission(postId);
      await post.expandReplies({ limit, depth: 2 });
      
      const comments: RedditComment[] = [];
      
      const extractComments = (commentList: any[]) => {
        for (const comment of commentList) {
          if (comment.body && comment.body !== '[deleted]' && comment.body !== '[removed]') {
            comments.push({
              id: comment.id,
              body: comment.body,
              ups: comment.ups,
              downs: comment.downs || 0,
              created_utc: comment.created_utc,
              author: {
                name: comment.author ? comment.author.name : '[deleted]',
                id: comment.author ? comment.author.id : undefined
              },
              parent_id: comment.parent_id
            });
          }
          
          if (comment.replies && comment.replies.length > 0) {
            extractComments(comment.replies);
          }
        }
      };
      
      if (post.comments) {
        extractComments(post.comments);
      }
      
      return comments.slice(0, limit);
    } catch (error) {
      console.error(`Error fetching comments for post ${postId}:`, error);
      throw new Error(`Failed to fetch comments for post ${postId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getSubredditInfo(subredditName: string): Promise<{
    name: string;
    title: string;
    description: string;
    subscribers: number;
    created_utc: number;
  }> {
    try {
      const subreddit = await this.reddit.getSubreddit(subredditName);
      
      return {
        name: subreddit.display_name,
        title: subreddit.title,
        description: subreddit.public_description || subreddit.description || '',
        subscribers: subreddit.subscribers || 0,
        created_utc: subreddit.created_utc
      };
    } catch (error) {
      console.error(`Error fetching subreddit info for r/${subredditName}:`, error);
      throw new Error(`Failed to fetch subreddit info for r/${subredditName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getUserInfo(username: string): Promise<{
    name: string;
    id: string;
    created_utc: number;
    comment_karma: number;
    link_karma: number;
    is_suspended?: boolean;
  }> {
    try {
      const user = await this.reddit.getUser(username);
      
      return {
        name: user.name,
        id: user.id,
        created_utc: user.created_utc,
        comment_karma: user.comment_karma || 0,
        link_karma: user.link_karma || 0,
        is_suspended: user.is_suspended || false
      };
    } catch (error) {
      console.error(`Error fetching user info for u/${username}:`, error);
      throw new Error(`Failed to fetch user info for u/${username}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Rate limiting helper
  async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Batch processing with rate limiting
  async processInBatches<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    batchSize: number = 10,
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
        await this.delay(delayMs);
      }
    }
    
    return results;
  }
}