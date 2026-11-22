export type Mentor = {
  id: string;
  name: string;
  role: string;
  skills: string[];
  fee: number;
  durationMin: number;
  description: string;
};

export type SessionStatus = 'Upcoming' | 'Completed' | 'Cancelled';

export type Session = {
  id: string;
  mentorId: string;
  topic: string;
  date: string;
  time: string;
  duration: number;
  status: SessionStatus;
  fee: number;
  discountApplied: number;
};

export const mentors: Mentor[] = [
  {
    id: 'mentor-1',
    name: 'Nethmi',
    role: 'Frontend Developer',
    skills: ['React', 'JavaScript', 'CSS'],
    fee: 2000,
    durationMin: 30,
    description:
      'Get help with React components, responsive layouts, and frontend projects.',
  },
  {
    id: 'mentor-2',
    name: 'Kavindu',
    role: 'Backend Developer',
    skills: ['Node.js', 'Express', 'MongoDB'],
    fee: 2500,
    durationMin: 45,
    description:
      'Learn how to build APIs, structure backend applications, and work with databases.',
  },
  {
    id: 'mentor-3',
    name: 'Amaya',
    role: 'Full Stack Developer',
    skills: ['React', 'Node.js', 'MongoDB'],
    fee: 3000,
    durationMin: 60,
    description:
      'Get guidance on connecting your frontend and backend into a complete application.',
  },
];

export const sessions: Session[] = [
  {
    id: 'session-1',
    mentorId: 'mentor-1',
    topic: 'Building reusable React components',
    date: '2026-12-10',
    time: '09:00',
    duration: 30,
    status: 'Upcoming',
    fee: 2000,
    discountApplied: 0,
  },
  {
    id: 'session-2',
    mentorId: 'mentor-2',
    topic: 'Creating my first Express API',
    date: '2026-12-12',
    time: '14:00',
    duration: 45,
    status: 'Upcoming',
    fee: 2500,
    discountApplied: 0,
  },
  {
    id: 'session-3',
    mentorId: 'mentor-3',
    topic: 'Connecting frontend and backend',
    date: '2026-11-10',
    time: '11:00',
    duration: 60,
    status: 'Completed',
    fee: 2500,
    discountApplied: 375,
  },
];
