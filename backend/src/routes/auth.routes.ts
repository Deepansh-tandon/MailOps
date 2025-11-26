import { Router, Request, Response } from 'express';
import { getAuthUrl, getTokens } from '../config/googleOAuth.js';

const router = Router();

router.get('/google', (req: Request, res: Response) => {
  try {
    const authUrl = getAuthUrl();
    res.json({ authUrl });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to generate auth URL' });
  }
});

router.post('/exchange-token', async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    const tokens = await getTokens(code);
    res.json({ tokens });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to exchange tokens' });
  }
});

export default router;

