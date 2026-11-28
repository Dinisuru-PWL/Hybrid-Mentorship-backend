import { isDbConnected } from './db.js';
import { MentorModel } from '../models/Mentor.js';
import { SessionModel } from '../models/Session.js';
import { WalletModel, CoinActivityModel } from '../models/Wallet.js';
import { UserRewardModel } from '../models/Reward.js';
import {
  mentors,
  sessions,
  walletSummary,
  coinActivity,
  rewardSummary,
} from '../data/mockData.js';

export async function seedDatabase(): Promise<void> {
  if (!isDbConnected()) return;

  const mentorCount = await MentorModel.countDocuments();
  if (mentorCount === 0) {
    await MentorModel.insertMany(
      mentors.map((m) => ({
        mentorId: m.id,
        name: m.name,
        role: m.role,
        skills: m.skills,
        fee: m.fee,
        durationMin: m.durationMin,
        description: m.description,
      })),
    );
    console.log('Seeded initial mentors into MongoDB.');
  }

  const sessionCount = await SessionModel.countDocuments();
  if (sessionCount === 0) {
    await SessionModel.insertMany(
      sessions.map((s) => ({
        sessionId: s.id,
        mentorId: s.mentorId,
        topic: s.topic,
        date: s.date,
        time: s.time,
        duration: s.duration,
        status: s.status,
        fee: s.fee,
        discountApplied: s.discountApplied,
        paymentStatus: 'Demo',
      })),
    );
    console.log('Seeded initial sessions into MongoDB.');
  }

  const walletExists = await WalletModel.findOne({ userId: 'default-user' });
  if (!walletExists) {
    await WalletModel.create({
      userId: 'default-user',
      dailyFree: walletSummary.dailyFree,
      purchased: walletSummary.purchased,
      usedToday: walletSummary.usedToday,
      usedThisWeek: walletSummary.usedThisWeek,
      lastResetDate: new Date().toISOString().slice(0, 10),
    });
    console.log('Seeded default user wallet into MongoDB.');
  }

  const activityCount = await CoinActivityModel.countDocuments({ userId: 'default-user' });
  if (activityCount === 0) {
    await CoinActivityModel.insertMany(
      coinActivity.map((a) => ({
        activityId: a.id,
        userId: 'default-user',
        date: a.date,
        type: a.type,
        label: a.label,
        coins: a.coins,
        description: a.description,
      })),
    );
  }

  const rewardExists = await UserRewardModel.findOne({ userId: 'default-user' });
  if (!rewardExists) {
    await UserRewardModel.create({
      userId: 'default-user',
      xp: rewardSummary.xp,
      rank: rewardSummary.rank,
      availableRewards: rewardSummary.availableRewards,
      usedRewards: rewardSummary.usedRewards,
    });
    console.log('Seeded default user rewards into MongoDB.');
  }
}
