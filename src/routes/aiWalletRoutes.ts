import { Router, Request, Response } from 'express';
import {
  coinActivity,
  coinPackages,
  rewardSummary,
  walletSummary,
} from '../data/mockData.js';

const router = Router();
const QUERY_COIN_COST = 5;

// GET /api/wallet
router.get('/wallet', (_req: Request, res: Response) => {
  res.json({
    wallet: walletSummary,
    packages: coinPackages,
    activity: coinActivity,
  });
});

// POST /api/wallet/topup
router.post('/wallet/topup', (req: Request, res: Response) => {
  const { packageId } = req.body as { packageId?: string };

  const selected = coinPackages.find((pack) => pack.id === packageId);
  if (!selected) {
    return res.status(404).json({ error: 'Coin package not found.' });
  }

  walletSummary.purchased += selected.coins;
  walletSummary.available = walletSummary.dailyFree + walletSummary.purchased;

  const today = new Date().toISOString().slice(0, 10);
  coinActivity.unshift({
    id: `act-${Date.now()}`,
    date: today,
    type: 'purchase',
    label: 'Coin package top-up',
    coins: selected.coins,
    description: `Purchased ${selected.coins} coins via PayHere (demo)`,
  });

  res.status(201).json({
    message: `Added ${selected.coins} coins to your wallet.`,
    wallet: walletSummary,
    activity: coinActivity,
  });
});

// POST /api/ai-query
router.post('/ai-query', (req: Request, res: Response) => {
  const { message } = req.body as { message?: string };
  const prompt = message?.trim();

  if (!prompt) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  if (walletSummary.available < QUERY_COIN_COST) {
    return res.status(402).json({
      error: 'Insufficient coins. Top up your Coin Wallet or book a human mentor.',
      wallet: walletSummary,
    });
  }

  if (walletSummary.dailyFree >= QUERY_COIN_COST) {
    walletSummary.dailyFree -= QUERY_COIN_COST;
  } else {
    const remainder = QUERY_COIN_COST - walletSummary.dailyFree;
    walletSummary.dailyFree = 0;
    walletSummary.purchased -= remainder;
  }

  walletSummary.available = walletSummary.dailyFree + walletSummary.purchased;
  walletSummary.usedToday += QUERY_COIN_COST;
  walletSummary.usedThisWeek += QUERY_COIN_COST;

  const today = new Date().toISOString().slice(0, 10);
  coinActivity.unshift({
    id: `act-${Date.now()}`,
    date: today,
    type: 'ai',
    label: 'AI Mentor query',
    coins: -QUERY_COIN_COST,
    description: prompt.slice(0, 60),
  });

  const reply = `Here is a quick breakdown for "${prompt}":\n\n1. Check your component props/state or Express route handler parameters.\n2. Verify your API request URL and JSON payload in the Network tab.\n3. If you're still stuck, click "Find Mentors" for a 1:1 session.`;

  res.json({
    reply,
    coinsDeducted: QUERY_COIN_COST,
    wallet: walletSummary,
  });
});

// GET /api/rewards
router.get('/rewards', (_req: Request, res: Response) => {
  res.json(rewardSummary);
});

export default router;
