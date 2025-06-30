// Base Repository
export { BaseRepository } from './BaseRepository';

// User Repositories
export { UserRepository } from './UserRepository';

// Reddit Repositories
export { RedditContentRepository } from './RedditContentRepository';
export { RedditSourceRepository } from './RedditSourceRepository';

// WordPress Repositories
export { WordPressContentRepository } from './WordPressContentRepository';
export { WordPressSourceRepository } from './WordPressSourceRepository';
export { WordPressUserRepository } from './WordPressUserRepository';

// Import für interne Verwendung
import { UserRepository } from './UserRepository';
import { RedditContentRepository } from './RedditContentRepository';
import { RedditSourceRepository } from './RedditSourceRepository';
import { WordPressContentRepository } from './WordPressContentRepository';
import { WordPressSourceRepository } from './WordPressSourceRepository';
import { WordPressUserRepository } from './WordPressUserRepository';

// Repository Factory für einfache Instanziierung
export class RepositoryFactory {
  private static instances: Map<string, any> = new Map();

  static getUserRepository(): UserRepository {
    if (!this.instances.has('UserRepository')) {
      this.instances.set('UserRepository', new UserRepository());
    }
    return this.instances.get('UserRepository');
  }

  static getRedditContentRepository(): RedditContentRepository {
    if (!this.instances.has('RedditContentRepository')) {
      this.instances.set('RedditContentRepository', new RedditContentRepository());
    }
    return this.instances.get('RedditContentRepository');
  }

  static getRedditSourceRepository(): RedditSourceRepository {
    if (!this.instances.has('RedditSourceRepository')) {
      this.instances.set('RedditSourceRepository', new RedditSourceRepository());
    }
    return this.instances.get('RedditSourceRepository');
  }

  static getWordPressContentRepository(): WordPressContentRepository {
    if (!this.instances.has('WordPressContentRepository')) {
      this.instances.set('WordPressContentRepository', new WordPressContentRepository());
    }
    return this.instances.get('WordPressContentRepository');
  }

  static getWordPressSourceRepository(): WordPressSourceRepository {
    if (!this.instances.has('WordPressSourceRepository')) {
      this.instances.set('WordPressSourceRepository', new WordPressSourceRepository());
    }
    return this.instances.get('WordPressSourceRepository');
  }

  static getWordPressUserRepository(): WordPressUserRepository {
    if (!this.instances.has('WordPressUserRepository')) {
      this.instances.set('WordPressUserRepository', new WordPressUserRepository());
    }
    return this.instances.get('WordPressUserRepository');
  }

  // Methode zum Zurücksetzen aller Instanzen (nützlich für Tests)
  static clearInstances(): void {
    this.instances.clear();
  }
}