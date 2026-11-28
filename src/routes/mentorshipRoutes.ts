import { Router, Request, Response } from 'express';
import { isDbConnected } from '../config/db.js';
import { MentorModel } from '../models/Mentor.js';
import { SessionModel, type SessionStatus } from '../models/Session.js';
import {
  UserRewardModel,
  calculateDiscountPctForRank,
} from '../models/Reward.js';
import {
  mentors as mockMentors,
  sessions as mockSessions,
  rewardSummary as mockRewards,
  Session,
} from '../data/mockData.js';

const router = Router();
const DEFAULT_SLOTS = ['09:00', '11:00', '14:00', '16:00', '19:00'];

// GET /api/mentors?search=...
router.get('/mentors', async (req: Request, res: Response) => {
  try {
    const search = String(req.query.search || '').trim().toLowerCase();

    const allMentors = isDbConnected()
      ? (await MentorModel.find().lean()).map((m) => ({
          id: m.mentorId,
          name: m.name,
          role: m.role,
          skills: m.skills,
          fee: m.fee,
          durationMin: m.durationMin,
          description: m.description,
          availabilitySlots: m.availabilitySlots ?? DEFAULT_SLOTS,
        }))
      : mockMentors.map((m) => ({ ...m, availabilitySlots: DEFAULT_SLOTS }));

    if (!search) {
      return res.json({ mentors: allMentors });
    }

    const filtered = allMentors.filter((mentor) =>
      [mentor.name, mentor.role, ...mentor.skills]
        .join(' ')
        .toLowerCase()
        .includes(search),
    );

    return res.json({ mentors: filtered });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to load mentors.',
    });
  }
});

// GET /api/mentors/:mentorId/availability?date=YYYY-MM-DD
router.get('/mentors/:mentorId/availability', async (req: Request, res: Response) => {
  try {
    const { mentorId } = req.params;
    const date = String(req.query.date || '').trim();

    if (!date) {
      return res.status(400).json({ error: 'date query parameter is required.' });
    }

    let slots = DEFAULT_SLOTS;
    let bookedTimes: string[] = [];

    if (isDbConnected()) {
      const mentor = await MentorModel.findOne({ mentorId }).lean();
      if (!mentor) {
        return res.status(404).json({ error: 'Mentor not found.' });
      }
      slots = mentor.availabilitySlots?.length ? mentor.availabilitySlots : DEFAULT_SLOTS;

      const existing = await SessionModel.find({
        mentorId,
        date,
        status: { $ne: 'Cancelled' },
      }).lean();
      bookedTimes = existing.map((s) => s.time);
    } else {
      const mentor = mockMentors.find((m) => m.id === mentorId);
      if (!mentor) {
        return res.status(404).json({ error: 'Mentor not found.' });
      }
      bookedTimes = mockSessions
        .filter((s) => s.mentorId === mentorId && s.date === date && s.status !== 'Cancelled')
        .map((s) => s.time);
    }

    const availableSlots = slots.filter((slot) => !bookedTimes.includes(slot));
    return res.json({
      mentorId,
      date,
      allSlots: slots,
      bookedTimes,
      availableSlots,
    });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to check availability.',
    });
  }
});

// GET /api/sessions?status=...
router.get('/sessions', async (req: Request, res: Response) => {
  try {
    const status = String(req.query.status || '').trim();

    if (isDbConnected()) {
      const query =
        status && status !== 'All' ? { status: status as SessionStatus } : {};
      const docs = await SessionModel.find(query).sort({ createdAt: -1 }).lean();
      const mapped = docs.map((s) => ({
        id: s.sessionId,
        mentorId: s.mentorId,
        topic: s.topic,
        date: s.date,
        time: s.time,
        duration: s.duration,
        status: s.status,
        fee: s.fee,
        discountApplied: s.discountApplied,
      }));
      return res.json({ sessions: mapped });
    }

    if (!status || status === 'All') {
      return res.json({ sessions: mockSessions });
    }

    return res.json({
      sessions: mockSessions.filter((s) => s.status === status),
    });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to load sessions.',
    });
  }
});

// POST /api/book-mentor
router.post('/book-mentor', async (req: Request, res: Response) => {
  try {
    const { mentorId, date, time, topic, applyDiscount } = req.body as {
      mentorId?: string;
      date?: string;
      time?: string;
      topic?: string;
      applyDiscount?: boolean;
    };

    if (!mentorId || !date || !time || !topic?.trim()) {
      return res.status(400).json({
        error: 'mentorId, date, time, and topic are required.',
      });
    }

    if (isDbConnected()) {
      const mentor = await MentorModel.findOne({ mentorId }).lean();
      if (!mentor) {
        return res.status(404).json({ error: 'Mentor not found.' });
      }

      const conflict = await SessionModel.findOne({
        mentorId,
        date,
        time,
        status: { $ne: 'Cancelled' },
      }).lean();

      if (conflict) {
        return res.status(409).json({
          error: `Time slot ${time} on ${date} is already booked for ${mentor.name}.`,
        });
      }

      let discountPct = 0;
      const userReward = await UserRewardModel.findOne({ userId: 'default-user' });
      const activeReward = userReward?.availableRewards?.[0];

      if (applyDiscount && activeReward) {
        discountPct = activeReward.discountPct || calculateDiscountPctForRank(userReward.rank);
      }

      const discountApplied = Math.round((mentor.fee * discountPct) / 100);
      const sessionId = `session-${Date.now()}`;

      const created = await SessionModel.create({
        sessionId,
        mentorId: mentor.mentorId,
        topic: topic.trim(),
        date,
        time,
        duration: mentor.durationMin,
        status: 'Upcoming',
        fee: mentor.fee - discountApplied,
        discountApplied,
        paymentStatus: 'Demo',
      });

      if (applyDiscount && activeReward && userReward) {
        userReward.availableRewards.shift();
        userReward.usedRewards.unshift({
          id: `used-${Date.now()}`,
          title: activeReward.title,
          usedOn: new Date().toISOString().slice(0, 10),
          mentor: mentor.name,
          topic: topic.trim(),
          saved: discountApplied,
        });
        await userReward.save();
      }

      return res.status(201).json({
        message: 'Session booked successfully.',
        session: {
          id: created.sessionId,
          mentorId: created.mentorId,
          topic: created.topic,
          date: created.date,
          time: created.time,
          duration: created.duration,
          status: created.status,
          fee: created.fee,
          discountApplied: created.discountApplied,
        },
      });
    }

    // Fallback in-memory path
    const mentor = mockMentors.find((m) => m.id === mentorId);
    if (!mentor) {
      return res.status(404).json({ error: 'Mentor not found.' });
    }

    const conflict = mockSessions.find(
      (s) => s.mentorId === mentorId && s.date === date && s.time === time && s.status !== 'Cancelled',
    );
    if (conflict) {
      return res.status(409).json({
        error: `Time slot ${time} on ${date} is already booked for ${mentor.name}.`,
      });
    }

    const activeReward = mockRewards.availableRewards[0];
    const discountPct =
      applyDiscount && activeReward
        ? activeReward.discountPct || calculateDiscountPctForRank(mockRewards.rank)
        : 0;
    const discountApplied = Math.round((mentor.fee * discountPct) / 100);

    const newSession: Session = {
      id: `session-${Date.now()}`,
      mentorId: mentor.id,
      topic: topic.trim(),
      date,
      time,
      duration: mentor.durationMin,
      status: 'Upcoming',
      fee: mentor.fee - discountApplied,
      discountApplied,
    };

    mockSessions.unshift(newSession);

    if (applyDiscount && activeReward) {
      mockRewards.availableRewards.shift();
      mockRewards.usedRewards.unshift({
        id: `used-${Date.now()}`,
        title: activeReward.title,
        usedOn: new Date().toISOString().slice(0, 10),
        mentor: mentor.name,
        topic: topic.trim(),
        saved: discountApplied,
      });
    }

    return res.status(201).json({
      message: 'Session booked successfully (in-memory mode).',
      session: newSession,
    });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to book session.',
    });
  }
});

// PATCH /api/sessions/:sessionId/cancel
router.patch('/sessions/:sessionId/cancel', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    if (isDbConnected()) {
      const session = await SessionModel.findOne({ sessionId });
      if (!session) {
        return res.status(404).json({ error: 'Session not found.' });
      }
      session.status = 'Cancelled';
      await session.save();
      return res.json({
        message: 'Session cancelled.',
        session: {
          id: session.sessionId,
          mentorId: session.mentorId,
          topic: session.topic,
          date: session.date,
          time: session.time,
          duration: session.duration,
          status: session.status,
          fee: session.fee,
          discountApplied: session.discountApplied,
        },
      });
    }

    const session = mockSessions.find((s) => s.id === sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }
    session.status = 'Cancelled';
    return res.json({ message: 'Session cancelled.', session });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to cancel session.',
    });
  }
});

export default router;
