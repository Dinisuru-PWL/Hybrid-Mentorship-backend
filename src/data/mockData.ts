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

export type CoinPackage = {
  id: string;
  coins: number;
  price: number;
  note?: string;
};

export type ActivityType = 'allocation' | 'ai' | 'purchase';

export type CoinActivity = {
  id: string;
  date: string;
  type: ActivityType;
  label: string;
  coins: number;
  description: string;
};

export type Reward = {
  id: string;
  title: string;
  meta: string[];
  description: string;
  originalPrice: number;
  discountPct: number;
};

export type UsedReward = {
  id: string;
  title: string;
  usedOn: string;
  mentor: string;
  topic: string;
  saved: number;
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

export const walletSummary = {
  available: 65,
  dailyFree: 15,
  purchased: 50,
  usedToday: 5,
  usedThisWeek: 20,
};

export const coinPackages: CoinPackage[] = [
  { id: 'pack-1', coins: 25, price: 500, note: 'Starter pack' },
  { id: 'pack-2', coins: 60, price: 1000, note: 'Most popular' },
  { id: 'pack-3', coins: 150, price: 2200, note: 'Best value' },
];

export const coinActivity: CoinActivity[] = [
  {
    id: 'act-1',
    date: '2026-11-18',
    type: 'allocation',
    label: 'Daily free coins',
    coins: 15,
    description: 'Automatic daily coin allocation',
  },
  {
    id: 'act-2',
    date: '2026-11-18',
    type: 'ai',
    label: 'AI Mentor query',
    coins: -5,
    description: 'Debugging React useEffect dependency loop',
  },
  {
    id: 'act-3',
    date: '2026-11-16',
    type: 'purchase',
    label: 'Coin package top-up',
    coins: 60,
    description: 'Purchased 60 coins via PayHere',
  },
  {
    id: 'act-4',
    date: '2026-11-15',
    type: 'ai',
    label: 'AI Mentor query',
    coins: -5,
    description: 'Explaining Express middleware error handling',
  },
];

export const rewardSummary = {
  xp: 2450,
  rank: 12,
  availableRewards: [
    {
      id: 'rew-1',
      title: '20% Off 1:1 Mentor Session',
      meta: ['Top 15 Leaderboard Tier', 'Valid for 30-min or 60-min sessions'],
      description:
        'Earned by maintaining a Top 15 position on the global DevCraft XP leaderboard.',
      originalPrice: 2500,
      discountPct: 20,
    },
  ] as Reward[],
  usedRewards: [
    {
      id: 'used-1',
      title: '15% Off 1:1 Mentor Session',
      usedOn: '2026-11-10',
      mentor: 'Amaya',
      topic: 'Connecting frontend and backend',
      saved: 375,
    },
  ] as UsedReward[],
};
