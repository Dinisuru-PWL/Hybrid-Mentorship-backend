import cron from 'node-cron';
import { isDbConnected } from '../config/db.js';
import { WalletModel, CoinActivityModel } from '../models/Wallet.js';
import { walletSummary, coinActivity } from '../data/mockData.js';

const DAILY_FREE_COINS = 15;

export async function resetDailyFreeCoins(): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);

  if (isDbConnected()) {
    const wallets = await WalletModel.find({ lastResetDate: { $ne: today } });
    for (const wallet of wallets) {
      wallet.dailyFree = DAILY_FREE_COINS;
      wallet.usedToday = 0;
      wallet.lastResetDate = today;
      await wallet.save();

      await CoinActivityModel.create({
        activityId: `act-${Date.now()}`,
        userId: wallet.userId,
        date: today,
        type: 'allocation',
        label: 'Daily free coins',
        coins: DAILY_FREE_COINS,
        description: 'Automatic daily coin allocation',
      });
    }
    return;
  }

  walletSummary.dailyFree = DAILY_FREE_COINS;
  walletSummary.available = walletSummary.dailyFree + walletSummary.purchased;
  walletSummary.usedToday = 0;
  coinActivity.unshift({
    id: `act-${Date.now()}`,
    date: today,
    type: 'allocation',
    label: 'Daily free coins',
    coins: DAILY_FREE_COINS,
    description: 'Automatic daily coin allocation',
  });
}

export function startDailyCoinCron(): void {
  // Runs every day at 00:00 server time
  cron.schedule('0 0 * * *', () => {
    resetDailyFreeCoins().catch((err) => {
      console.error('Daily coin reset cron failed:', err);
    });
  });
}
