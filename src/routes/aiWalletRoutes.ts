import { Router, Request, Response } from 'express';
import { isDbConnected } from '../config/db.js';
import { WalletModel, CoinActivityModel } from '../models/Wallet.js';
import {
  UserRewardModel,
  calculateDiscountPctForRank,
} from '../models/Reward.js';
import { generateMentorReply } from '../services/aiService.js';
import {
  coinActivity as mockActivity,
  coinPackages,
  rewardSummary as mockRewards,
  walletSummary as mockWallet,
} from '../data/mockData.js';

const router = Router();
const QUERY_COIN_COST = 5;
const DAILY_FREE_COINS = 15;

async function getOrResetWalletDoc() {
  const today = new Date().toISOString().slice(0, 10);
  let wallet = await WalletModel.findOne({ userId: 'default-user' });
  if (!wallet) {
    wallet = await WalletModel.create({
      userId: 'default-user',
      dailyFree: DAILY_FREE_COINS,
      purchased: 50,
      usedToday: 0,
      usedThisWeek: 0,
      lastResetDate: today,
    });
  } else if (wallet.lastResetDate !== today) {
    wallet.dailyFree = DAILY_FREE_COINS;
    wallet.usedToday = 0;
    wallet.lastResetDate = today;
    await wallet.save();

    await CoinActivityModel.create({
      activityId: `act-${Date.now()}`,
      userId: 'default-user',
      date: today,
      type: 'allocation',
      label: 'Daily free coins',
      coins: DAILY_FREE_COINS,
      description: 'Automatic daily coin allocation',
    });
  }
  return wallet;
}

function formatWalletResponse(wallet: {
  dailyFree: number;
  purchased: number;
  usedToday: number;
  usedThisWeek: number;
}) {
  return {
    available: wallet.dailyFree + wallet.purchased,
    dailyFree: wallet.dailyFree,
    purchased: wallet.purchased,
    usedToday: wallet.usedToday,
    usedThisWeek: wallet.usedThisWeek,
  };
}

// GET /api/wallet
router.get('/wallet', async (_req: Request, res: Response) => {
  try {
    if (isDbConnected()) {
      const wallet = await getOrResetWalletDoc();
      const activities = await CoinActivityModel.find({ userId: 'default-user' })
        .sort({ createdAt: -1 })
        .limit(30)
        .lean();

      return res.json({
        wallet: formatWalletResponse(wallet),
        packages: coinPackages,
        activity: activities.map((a) => ({
          id: a.activityId,
          date: a.date,
          type: a.type,
          label: a.label,
          coins: a.coins,
          description: a.description,
        })),
      });
    }

    return res.json({
      wallet: mockWallet,
      packages: coinPackages,
      activity: mockActivity,
    });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to load wallet.',
    });
  }
});

// POST /api/wallet/topup
router.post('/wallet/topup', async (req: Request, res: Response) => {
  try {
    const { packageId } = req.body as { packageId?: string };
    const selected = coinPackages.find((pack) => pack.id === packageId);

    if (!selected) {
      return res.status(404).json({ error: 'Coin package not found.' });
    }

    const today = new Date().toISOString().slice(0, 10);

    if (isDbConnected()) {
      const wallet = await getOrResetWalletDoc();
      wallet.purchased += selected.coins;
      await wallet.save();

      await CoinActivityModel.create({
        activityId: `act-${Date.now()}`,
        userId: 'default-user',
        date: today,
        type: 'purchase',
        label: 'Coin package top-up',
        coins: selected.coins,
        description: `Purchased ${selected.coins} coins via PayHere`,
      });

      const activities = await CoinActivityModel.find({ userId: 'default-user' })
        .sort({ createdAt: -1 })
        .limit(30)
        .lean();

      return res.status(201).json({
        message: `Added ${selected.coins} coins to your wallet.`,
        wallet: formatWalletResponse(wallet),
        activity: activities.map((a) => ({
          id: a.activityId,
          date: a.date,
          type: a.type,
          label: a.label,
          coins: a.coins,
          description: a.description,
        })),
      });
    }

    mockWallet.purchased += selected.coins;
    mockWallet.available = mockWallet.dailyFree + mockWallet.purchased;
    mockActivity.unshift({
      id: `act-${Date.now()}`,
      date: today,
      type: 'purchase',
      label: 'Coin package top-up',
      coins: selected.coins,
      description: `Purchased ${selected.coins} coins via PayHere (demo)`,
    });

    return res.status(201).json({
      message: `Added ${selected.coins} coins to your wallet.`,
      wallet: mockWallet,
      activity: mockActivity,
    });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Top-up failed.',
    });
  }
});

// POST /api/ai-query
router.post('/ai-query', async (req: Request, res: Response) => {
  try {
    const { message } = req.body as { message?: string };
    const prompt = message?.trim();

    if (!prompt) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const today = new Date().toISOString().slice(0, 10);

    if (isDbConnected()) {
      const wallet = await getOrResetWalletDoc();
      const available = wallet.dailyFree + wallet.purchased;

      if (available < QUERY_COIN_COST) {
        return res.status(402).json({
          error: 'Insufficient coins. Top up your Coin Wallet or book a human mentor.',
          wallet: formatWalletResponse(wallet),
        });
      }

      const aiResult = await generateMentorReply(prompt);

      if (wallet.dailyFree >= QUERY_COIN_COST) {
        wallet.dailyFree -= QUERY_COIN_COST;
      } else {
        const remainder = QUERY_COIN_COST - wallet.dailyFree;
        wallet.dailyFree = 0;
        wallet.purchased -= remainder;
      }
      wallet.usedToday += QUERY_COIN_COST;
      wallet.usedThisWeek += QUERY_COIN_COST;
      await wallet.save();

      await CoinActivityModel.create({
        activityId: `act-${Date.now()}`,
        userId: 'default-user',
        date: today,
        type: 'ai',
        label: 'AI Mentor query',
        coins: -QUERY_COIN_COST,
        description: prompt.slice(0, 60),
      });

      return res.json({
        reply: aiResult.reply,
        provider: aiResult.provider,
        coinsDeducted: QUERY_COIN_COST,
        wallet: formatWalletResponse(wallet),
      });
    }

    if (mockWallet.available < QUERY_COIN_COST) {
      return res.status(402).json({
        error: 'Insufficient coins. Top up your Coin Wallet or book a human mentor.',
        wallet: mockWallet,
      });
    }

    const aiResult = await generateMentorReply(prompt);

    if (mockWallet.dailyFree >= QUERY_COIN_COST) {
      mockWallet.dailyFree -= QUERY_COIN_COST;
    } else {
      const remainder = QUERY_COIN_COST - mockWallet.dailyFree;
      mockWallet.dailyFree = 0;
      mockWallet.purchased -= remainder;
    }
    mockWallet.available = mockWallet.dailyFree + mockWallet.purchased;
    mockWallet.usedToday += QUERY_COIN_COST;
    mockWallet.usedThisWeek += QUERY_COIN_COST;

    mockActivity.unshift({
      id: `act-${Date.now()}`,
      date: today,
      type: 'ai',
      label: 'AI Mentor query',
      coins: -QUERY_COIN_COST,
      description: prompt.slice(0, 60),
    });

    return res.json({
      reply: aiResult.reply,
      provider: aiResult.provider,
      coinsDeducted: QUERY_COIN_COST,
      wallet: mockWallet,
    });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to process AI query.',
    });
  }
});

// GET /api/rewards
router.get('/rewards', async (_req: Request, res: Response) => {
  try {
    if (isDbConnected()) {
      const rewardDoc = await UserRewardModel.findOne({ userId: 'default-user' }).lean();
      if (rewardDoc) {
        return res.json({
          xp: rewardDoc.xp,
          rank: rewardDoc.rank,
          tierDiscountPct: calculateDiscountPctForRank(rewardDoc.rank),
          availableRewards: rewardDoc.availableRewards,
          usedRewards: rewardDoc.usedRewards,
        });
      }
    }

    return res.json({
      ...mockRewards,
      tierDiscountPct: calculateDiscountPctForRank(mockRewards.rank),
    });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to load rewards.',
    });
  }
});

export default router;
