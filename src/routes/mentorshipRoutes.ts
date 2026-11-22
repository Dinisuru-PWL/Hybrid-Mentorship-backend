import { Router, Request, Response } from 'express';
import { mentors, sessions, Session } from '../data/mockData.js';

const router = Router();

// GET /api/mentors?search=...
router.get('/mentors', (req: Request, res: Response) => {
  const search = String(req.query.search || '').trim().toLowerCase();

  if (!search) {
    return res.json({ mentors });
  }

  const filtered = mentors.filter((mentor) => {
    const searchable = [mentor.name, mentor.role, ...mentor.skills]
      .join(' ')
      .toLowerCase();
    return searchable.includes(search);
  });

  res.json({ mentors: filtered });
});

// GET /api/sessions?status=...
router.get('/sessions', (req: Request, res: Response) => {
  const status = String(req.query.status || '').trim();

  if (!status || status === 'All') {
    return res.json({ sessions });
  }

  const filtered = sessions.filter((s) => s.status === status);
  res.json({ sessions: filtered });
});

// POST /api/book-mentor
router.post('/book-mentor', (req: Request, res: Response) => {
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

  const mentor = mentors.find((m) => m.id === mentorId);
  if (!mentor) {
    return res.status(404).json({ error: 'Mentor not found.' });
  }

  const discountApplied = applyDiscount ? Math.round(mentor.fee * 0.2) : 0;

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

  sessions.unshift(newSession);

  res.status(201).json({
    message: 'Session booked successfully (dummy mode).',
    session: newSession,
  });
});

export default router;
