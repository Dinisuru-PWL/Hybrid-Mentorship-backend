import mongoose, { Schema, Document } from 'mongoose';

export interface IRewardItem {
  id: string;
  title: string;
  meta: string[];
  description: string;
  originalPrice: number;
  discountPct: number;
}

export interface IUsedRewardItem {
  id: string;
  title: string;
  usedOn: string;
  mentor: string;
  topic: string;
  saved: number;
}

export interface IUserReward extends Document {
  userId: string;
  xp: number;
  rank: number;
  availableRewards: IRewardItem[];
  usedRewards: IUsedRewardItem[];
}

const RewardItemSchema = new Schema<IRewardItem>(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    meta: [{ type: String }],
    description: { type: String, required: true },
    originalPrice: { type: Number, required: true },
    discountPct: { type: Number, required: true },
  },
  { _id: false },
);

const UsedRewardItemSchema = new Schema<IUsedRewardItem>(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    usedOn: { type: String, required: true },
    mentor: { type: String, required: true },
    topic: { type: String, required: true },
    saved: { type: Number, required: true },
  },
  { _id: false },
);

const UserRewardSchema = new Schema<IUserReward>(
  {
    userId: { type: String, required: true, unique: true, default: 'default-user' },
    xp: { type: Number, default: 2450 },
    rank: { type: Number, default: 12 },
    availableRewards: { type: [RewardItemSchema], default: [] },
    usedRewards: { type: [UsedRewardItemSchema], default: [] },
  },
  { timestamps: true },
);

export const UserRewardModel = mongoose.model<IUserReward>(
  'UserReward',
  UserRewardSchema,
);

/**
 * Dynamic Discount Rewards Engine:
 * Calculates discount tier from leaderboard rank.
 */
export function calculateDiscountPctForRank(rank: number): number {
  if (rank <= 3) return 30;
  if (rank <= 10) return 25;
  if (rank <= 20) return 20;
  if (rank <= 50) return 10;
  return 0;
}
