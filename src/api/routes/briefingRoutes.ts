import { Router, Request, Response } from 'express';
import { MorningBriefingService } from '../../services/MorningBriefingService';
import { MasterCrawlerService } from '../../crawlers/MasterCrawlerService';

const router = Router();
const briefingService = new MorningBriefingService();
const crawlerService = new MasterCrawlerService();

// Generate new morning briefing
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const options = req.body || {};
    const briefing = await briefingService.generateMorningBriefing(options);
    
    res.json({
      success: true,
      data: briefing
    });
  } catch (error) {
    console.error('Error generating briefing:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate morning briefing',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get quick sentiment overview
router.get('/sentiment', async (req: Request, res: Response) => {
  try {
    const overview = await briefingService.getQuickSentimentOverview();
    
    res.json({
      success: true,
      data: overview
    });
  } catch (error) {
    console.error('Error getting sentiment overview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sentiment overview',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get historical briefings
router.get('/history', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const briefings = await briefingService.getHistoricalBriefings(days);
    
    res.json({
      success: true,
      data: briefings
    });
  } catch (error) {
    console.error('Error getting historical briefings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get historical briefings',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Batch analyze unanalyzed content
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.body.limit) || 100;
    const result = await briefingService.batchAnalyzeUnanalyzedContent(limit);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error batch analyzing content:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze content',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get system status
router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = await crawlerService.getOverallStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting system status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get system status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;