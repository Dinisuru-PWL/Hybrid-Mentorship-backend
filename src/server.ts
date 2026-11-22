import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mentorshipRoutes from './routes/mentorshipRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
  }),
);
app.use(express.json());

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'devcraft-mentorship-backend',
  });
});

app.use('/api', mentorshipRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
