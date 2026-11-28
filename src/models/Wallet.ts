import mongoose, { Schema, Document } from 'mongoose';

export interface IWallet extends Document {
  userId: string;
  dailyFree: number;
  purchased: number;
  usedToday: number;
  usedThisWeek: number;
  lastResetDate: string;
}

const WalletSchema = new Schema<IWallet>(
  {
    userId: { type: String, required: true, unique: true, default: 'default-user' },
    dailyFree: { type: Number, default: 15 },
    purchased: { type: Number, default: 50 },
    usedToday: { type: Number, default: 0 },
    usedThisWeek: { type: Number, default: 0 },
    lastResetDate: {
      type: String,
      default: () => new Date().toISOString().slice(0, 10),
    },
  },
  { timestamps: true },
);

export const WalletModel = mongoose.model<IWallet>('Wallet', WalletSchema);

export interface ICoinActivity extends Document {
  activityId: string;
  userId: string;
  date: string;
  type: 'allocation' | 'ai' | 'purchase';
  label: string;
  coins: number;
  description: string;
}

const CoinActivitySchema = new Schema<ICoinActivity>(
  {
    activityId: { type: String, required: true, unique: true },
    userId: { type: String, required: true, default: 'default-user' },
    date: { type: String, required: true },
    type: { type: String, enum: ['allocation', 'ai', 'purchase'], required: true },
    label: { type: String, required: true },
    coins: { type: Number, required: true },
    description: { type: String, required: true },
  },
  { timestamps: true },
);

export const CoinActivityModel = mongoose.model<ICoinActivity>(
  'CoinActivity',
  CoinActivitySchema,
);
