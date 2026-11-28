import mongoose, { Schema, Document } from 'mongoose';

export interface IMentor extends Document {
  mentorId: string;
  name: string;
  role: string;
  skills: string[];
  fee: number;
  durationMin: number;
  description: string;
  availabilitySlots: string[];
}

const MentorSchema = new Schema<IMentor>(
  {
    mentorId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    role: { type: String, required: true },
    skills: [{ type: String }],
    fee: { type: Number, required: true },
    durationMin: { type: Number, required: true },
    description: { type: String, required: true },
    availabilitySlots: {
      type: [String],
      default: ['09:00', '11:00', '14:00', '16:00', '19:00'],
    },
  },
  { timestamps: true },
);

export const MentorModel = mongoose.model<IMentor>('Mentor', MentorSchema);
