import axios from 'axios';
import * as xml2js from 'xml2js';
import logger from '../config/logger';

export interface RssFeedItem {
  guid: string;
  title: string;
  content: string;
  summary?: string;
  url: string;
  author?: string;
  category?: string;
  tags?: string[];
  language?: string;
  publishedAt: Date;
}

export interface RssFeedData {
  title: string;
  description?: string;
  url: string;
  language?: string;
  items: RssFeedItem[];
}

export class RssFeedApiService {
  private static readonly DEFAULT_TIMEOUT = 30000; // 30 seconds
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000; // 1 second

  async fetchFeed(feedUrl: string, etag?: string, lastModified?: string): Promise<{
    data: RssFeedData | null;
    etag?: string;
    lastModified?: string;
    notModified: boolean;
  }> {
    try {
      logger.info(`Fetching RSS feed: ${feedUrl}`);

      const headers: any = {
        'User-Agent': 'CryptoTradersBot/1.0',
        'Accept': 'application/rss+xml, application/xml, text/xml',
        'Accept-Encoding': 'gzip, deflate'
      };

      // Add caching headers if available
      if (etag) {
        headers['If-None-Match'] = etag;
      }
      if (lastModified) {
        headers['If-Modified-Since'] = lastModified;
      }

      const response = await axios.get(feedUrl, {
        headers,
        timeout: RssFeedApiService.DEFAULT_TIMEOUT,
        responseType: 'text'
      });

      // Handle 304 Not Modified
      if (response.status === 304) {
        logger.info(`Feed not modified: ${feedUrl}`);
        return {
          data: null,
          notModified: true
        };
      }

      const xmlData = response.data;
      const feedData = await this.parseXmlFeed(xmlData, feedUrl);

      return {
        data: feedData,
        etag: response.headers.etag,
        lastModified: response.headers['last-modified'],
        notModified: false
      };

    } catch (error: any) {
      if (error.response?.status === 304) {
        return {
          data: null,
          notModified: true
        };
      }

      logger.error(`Error fetching RSS feed ${feedUrl}:`, error.message);
      throw new Error(`Failed to fetch RSS feed: ${error.message}`);
    }
  }

  private async parseXmlFeed(xmlData: string, feedUrl: string): Promise<RssFeedData> {
    try {
      const parser = new xml2js.Parser({
        explicitArray: false,
        ignoreAttrs: false,
        mergeAttrs: true,
        trim: true
      });

      const result = await parser.parseStringPromise(xmlData);

      // Handle RSS 2.0 format
      if (result.rss) {
        return this.parseRss2Feed(result.rss, feedUrl);
      }

      // Handle Atom format
      if (result.feed) {
        return this.parseAtomFeed(result.feed, feedUrl);
      }

      throw new Error('Unsupported feed format');

    } catch (error: any) {
      logger.error(`Error parsing RSS feed XML:`, error.message);
      throw new Error(`Failed to parse RSS feed: ${error.message}`);
    }
  }

  private parseRss2Feed(rss: any, feedUrl: string): RssFeedData {
    const channel = rss.channel;
    const items: RssFeedItem[] = [];

    const rawItems = Array.isArray(channel.item) ? channel.item : [channel.item];

    for (const item of rawItems) {
      if (!item) continue;

      const feedItem: RssFeedItem = {
        guid: item.guid?._ || item.guid || item.link || `${feedUrl}-${Date.now()}-${Math.random()}`,
        title: this.cleanText(item.title || 'Untitled'),
        content: this.extractContent(item),
        summary: this.cleanText(item.description),
        url: item.link || feedUrl,
        author: this.extractAuthor(item),
        category: this.extractCategory(item),
        tags: this.extractTags(item),
        language: channel.language || 'en',
        publishedAt: this.parseDate(item.pubDate || item.published || new Date())
      };

      items.push(feedItem);
    }

    return {
      title: this.cleanText(channel.title || 'Unknown Feed'),
      description: this.cleanText(channel.description),
      url: channel.link || feedUrl,
      language: channel.language || 'en',
      items: items.filter(item => item.title && item.content)
    };
  }

  private parseAtomFeed(feed: any, feedUrl: string): RssFeedData {
    const items: RssFeedItem[] = [];
    const entries = Array.isArray(feed.entry) ? feed.entry : [feed.entry];

    for (const entry of entries) {
      if (!entry) continue;

      const feedItem: RssFeedItem = {
        guid: entry.id || `${feedUrl}-${Date.now()}-${Math.random()}`,
        title: this.cleanText(entry.title?._ || entry.title || 'Untitled'),
        content: this.extractAtomContent(entry),
        summary: this.cleanText(entry.summary?._ || entry.summary),
        url: this.extractAtomLink(entry) || feedUrl,
        author: this.extractAtomAuthor(entry),
        category: this.extractAtomCategory(entry),
        tags: this.extractAtomTags(entry),
        language: feed['xml:lang'] || 'en',
        publishedAt: this.parseDate(entry.published || entry.updated || new Date())
      };

      items.push(feedItem);
    }

    return {
      title: this.cleanText(feed.title?._ || feed.title || 'Unknown Feed'),
      description: this.cleanText(feed.subtitle?._ || feed.subtitle),
      url: this.extractAtomLink(feed) || feedUrl,
      language: feed['xml:lang'] || 'en',
      items: items.filter(item => item.title && item.content)
    };
  }

  private extractContent(item: any): string {
    // Try different content fields
    const contentFields = [
      'content:encoded',
      'description',
      'summary',
      'content'
    ];

    for (const field of contentFields) {
      const content = item[field];
      if (content) {
        return this.cleanHtml(typeof content === 'object' ? content._ || content : content);
      }
    }

    return '';
  }

  private extractAtomContent(entry: any): string {
    if (entry.content) {
      const content = entry.content;
      return this.cleanHtml(typeof content === 'object' ? content._ || content : content);
    }
    
    if (entry.summary) {
      const summary = entry.summary;
      return this.cleanHtml(typeof summary === 'object' ? summary._ || summary : summary);
    }

    return '';
  }

  private extractAuthor(item: any): string | undefined {
    return item.author || item['dc:creator'] || undefined;
  }

  private extractAtomAuthor(entry: any): string | undefined {
    if (entry.author) {
      if (typeof entry.author === 'object') {
        return entry.author.name || entry.author.email;
      }
      return entry.author;
    }
    return undefined;
  }

  private extractCategory(item: any): string | undefined {
    if (item.category) {
      return Array.isArray(item.category) ? item.category[0] : item.category;
    }
    return undefined;
  }

  private extractAtomCategory(entry: any): string | undefined {
    if (entry.category) {
      const category = Array.isArray(entry.category) ? entry.category[0] : entry.category;
      return typeof category === 'object' ? category.term : category;
    }
    return undefined;
  }

  private extractTags(item: any): string[] {
    const tags: string[] = [];
    
    if (item.category) {
      const categories = Array.isArray(item.category) ? item.category : [item.category];
      tags.push(...categories);
    }

    return tags;
  }

  private extractAtomTags(entry: any): string[] {
    const tags: string[] = [];
    
    if (entry.category) {
      const categories = Array.isArray(entry.category) ? entry.category : [entry.category];
      for (const cat of categories) {
        const term = typeof cat === 'object' ? cat.term : cat;
        if (term) tags.push(term);
      }
    }

    return tags;
  }

  private extractAtomLink(atomObject: any): string | undefined {
    if (atomObject.link) {
      const links = Array.isArray(atomObject.link) ? atomObject.link : [atomObject.link];
      
      // Look for html link first
      for (const link of links) {
        if (typeof link === 'object' && link.type === 'text/html' && link.href) {
          return link.href;
        }
      }
      
      // Fallback to first available link
      const firstLink = links[0];
      if (typeof firstLink === 'object' && firstLink.href) {
        return firstLink.href;
      } else if (typeof firstLink === 'string') {
        return firstLink;
      }
    }
    
    return undefined;
  }

  private parseDate(dateString: string | Date): Date {
    if (dateString instanceof Date) {
      return dateString;
    }

    try {
      return new Date(dateString);
    } catch {
      return new Date();
    }
  }

  private cleanText(text: string | undefined): string {
    if (!text) return '';
    
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .trim();
  }

  private cleanHtml(html: string): string {
    if (!html) return '';

    // Remove HTML tags but preserve some basic formatting
    return html
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  async validateFeedUrl(feedUrl: string): Promise<boolean> {
    try {
      const response = await axios.head(feedUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'CryptoTradersBot/1.0'
        }
      });

      const contentType = response.headers['content-type'] || '';
      return contentType.includes('xml') || contentType.includes('rss') || contentType.includes('atom');
    } catch {
      return false;
    }
  }

  async discoverFeedUrls(websiteUrl: string): Promise<string[]> {
    try {
      const response = await axios.get(websiteUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'CryptoTradersBot/1.0'
        }
      });

      const html = response.data;
      const feedUrls: string[] = [];

      // Look for RSS/Atom feed links in HTML
      const linkRegex = /<link[^>]*(?:type=['"](application\/rss\+xml|application\/atom\+xml)['"]][^>]*href=['"]([^'"]+)['"]|href=['"]([^'"]+)['"][^>]*type=['"](application\/rss\+xml|application\/atom\+xml)['"])[^>]*>/gi;
      
      let match;
      while ((match = linkRegex.exec(html)) !== null) {
        const url = match[2] || match[3];
        if (url) {
          const fullUrl = new URL(url, websiteUrl).toString();
          feedUrls.push(fullUrl);
        }
      }

      // Common RSS/Atom endpoints
      const commonEndpoints = ['/rss', '/feed', '/feeds', '/atom.xml', '/rss.xml', '/index.xml'];
      
      for (const endpoint of commonEndpoints) {
        try {
          const feedUrl = new URL(endpoint, websiteUrl).toString();
          if (await this.validateFeedUrl(feedUrl)) {
            feedUrls.push(feedUrl);
          }
        } catch {
          // Ignore invalid URLs
        }
      }

      return [...new Set(feedUrls)]; // Remove duplicates
    } catch (error: any) {
      logger.warn(`Failed to discover feeds for ${websiteUrl}:`, error.message);
      return [];
    }
  }
}