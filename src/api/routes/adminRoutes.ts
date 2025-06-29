import { Router, Request, Response } from 'express';
import { RepositoryFactory } from '../../repositories';
import { MasterCrawlerService } from '../../crawlers/MasterCrawlerService';
import { RedditCrawlerService } from '../../crawlers/RedditCrawlerService';
import { WordPressCrawlerService } from '../../crawlers/WordPressCrawlerService';

const router = Router();
const redditSourceRepo = RepositoryFactory.getRedditSourceRepository();
const wordpressSourceRepo = RepositoryFactory.getWordPressSourceRepository();
const crawlerService = new MasterCrawlerService();
const redditCrawler = new RedditCrawlerService();
const wordpressCrawler = new WordPressCrawlerService();

// Reddit Sources Management
router.get('/reddit/sources', async (_req: Request, res: Response) => {
  try {
    const sources = await redditSourceRepo.findAll();
    res.json({ success: true, data: sources });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get Reddit sources',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/reddit/sources', async (req: Request, res: Response) => {
  try {
    const { subredditName, description, crawlIntervalHours } = req.body;
    
    if (!subredditName) {
      res.status(400).json({
        success: false,
        error: 'Subreddit name is required'
      });
      return;
    }

    // Check if source already exists
    const existing = await redditSourceRepo.existsBySubredditName(subredditName);
    if (existing) {
      res.status(400).json({
        success: false,
        error: 'Reddit source already exists'
      });
      return;
    }

    const source = await redditSourceRepo.create({
      subredditName,
      description: description || '',
      subscriberCount: 0,
      isActive: true,
      crawlIntervalHours: crawlIntervalHours || 24,
      totalPostsCrawled: 0,
      averageSentiment: 0,
      reliabilityScore: 0
    });

    res.status(201).json({ success: true, data: source });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create Reddit source',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.put('/reddit/sources/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const updates = req.body;
    
    const source = await redditSourceRepo.update(id, updates);
    if (!source) {
      res.status(404).json({
        success: false,
        error: 'Reddit source not found'
      });
      return;
    }

    res.json({ success: true, data: source });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update Reddit source',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.delete('/reddit/sources/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await redditSourceRepo.delete(id);
    
    if (!deleted) {
      res.status(404).json({
        success: false,
        error: 'Reddit source not found'
      });
      return;
    }

    res.json({ success: true, message: 'Reddit source deleted' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete Reddit source',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// WordPress Sources Management
router.get('/wordpress/sources', async (_req: Request, res: Response) => {
  try {
    const sources = await wordpressSourceRepo.findAll();
    res.json({ success: true, data: sources });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get WordPress sources',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/wordpress/sources', async (req: Request, res: Response) => {
  try {
    const { siteUrl, siteName, description, apiKey, crawlIntervalHours } = req.body;
    
    if (!siteUrl || !siteName) {
      res.status(400).json({
        success: false,
        error: 'Site URL and site name are required'
      });
      return;
    }

    // Check if source already exists
    const existing = await wordpressSourceRepo.existsBySiteUrl(siteUrl);
    if (existing) {
      res.status(400).json({
        success: false,
        error: 'WordPress source already exists'
      });
      return;
    }

    const source = await wordpressSourceRepo.create({
      siteUrl,
      siteName,
      description: description || '',
      apiEndpoint: `${siteUrl}/wp-json/wp/v2`,
      apiKey: apiKey || '',
      isActive: true,
      crawlIntervalHours: crawlIntervalHours || 12,
      totalPostsCrawled: 0,
      averageSentiment: 0,
      reliabilityScore: 0
    });

    res.status(201).json({ success: true, data: source });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create WordPress source',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.put('/wordpress/sources/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const updates = req.body;
    
    const source = await wordpressSourceRepo.update(id, updates);
    if (!source) {
      res.status(404).json({
        success: false,
        error: 'WordPress source not found'
      });
      return;
    }

    res.json({ success: true, data: source });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update WordPress source',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.delete('/wordpress/sources/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await wordpressSourceRepo.delete(id);
    
    if (!deleted) {
      res.status(404).json({
        success: false,
        error: 'WordPress source not found'
      });
      return;
    }

    res.json({ success: true, message: 'WordPress source deleted' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete WordPress source',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Crawler Management
router.post('/crawl/full', async (_req: Request, res: Response) => {
  try {
    const result = await crawlerService.runFullCrawl();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to run full crawl',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/crawl/reddit', async (_req: Request, res: Response) => {
  try {
    const result = await redditCrawler.crawlAllActiveSources();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to crawl Reddit sources',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/crawl/reddit/:id', async (req: Request, res: Response) => {
  try {
    const sourceId = parseInt(req.params.id);
    const result = await redditCrawler.crawlSource(sourceId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to crawl Reddit source',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/crawl/wordpress', async (_req: Request, res: Response) => {
  try {
    const result = await wordpressCrawler.crawlAllActiveSources();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to crawl WordPress sources',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/crawl/wordpress/:id', async (req: Request, res: Response) => {
  try {
    const sourceId = parseInt(req.params.id);
    const result = await wordpressCrawler.crawlSource(sourceId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to crawl WordPress source',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/crawl/market', async (_req: Request, res: Response) => {
  try {
    const result = await crawlerService.runMarketDataUpdate();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update market data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// System Statistics
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const [redditSources, wordpressSources] = await Promise.all([
      redditSourceRepo.findActiveSources(),
      wordpressSourceRepo.findActiveSources()
    ]);

    const stats = {
      redditSources: redditSources.length,
      wordpressSources: wordpressSources.length,
      totalSources: redditSources.length + wordpressSources.length,
      topRedditSources: redditSources
        .sort((a, b) => b.totalPostsCrawled - a.totalPostsCrawled)
        .slice(0, 5)
        .map(s => ({ name: s.subredditName, posts: s.totalPostsCrawled })),
      topWordPressSources: wordpressSources
        .sort((a, b) => b.totalPostsCrawled - a.totalPostsCrawled)
        .slice(0, 5)
        .map(s => ({ name: s.siteName, posts: s.totalPostsCrawled }))
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;