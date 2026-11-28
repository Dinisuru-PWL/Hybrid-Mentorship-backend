import mongoose, { Schema, Document } from 'mongoose';

export type SessionStatus = 'Upcoming' | 'Completed' | 'Cancelled';
export type PaymentStatus = 'Pending' | 'Paid' | 'Demo';

export interface ISession extends Document {
  sessionId: string;
  mentorId: string;
  topic: string;
  date: string;
  time: string;
  duration: number;
  status: SessionStatus;
  fee: number;
  discountApplied: number;
  paymentStatus: PaymentStatus;
  paymentRef?: string;
}

const SessionSchema = new Schema<ISession>(
  {
    sessionId: { type: String, required: true, unique: true },
    mentorId: { type: String, required: true, index: true },
    topic: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    duration: { type: Number, required: true },
    status: {
      type: String,
      enum: ['Upcoming', 'Completed', 'Cancelled'],
      default: 'Upcoming',
    },
    fee: { type: Number, required: true },
    discountApplied: { type: Number, default: 0 },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid', 'Demo'],
      default: 'Demo',
    },
    paymentRef: { type: String },
  },
  { timestamps: true },
);

export const SessionModel = mongoose.model<ISession>('Session', SessionSchema);
