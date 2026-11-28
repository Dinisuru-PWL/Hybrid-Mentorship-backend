import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB, isDbConnected } from './config/db.js';
import { seedDatabase } from './config/seed.js';
import { startDailyCoinCron } from './services/cronService.js';
import mentorshipRoutes from './routes/mentorshipRoutes.js';
import aiWalletRoutes from './routes/aiWalletRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
].filter(Boolean) as string[];

app.use(
  cors({
    origin: allowedOrigins,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'devcraft-mentorship-backend',
    database: isDbConnected() ? 'mongodb' : 'in-memory-fallback',
    aiConfigured: Boolean(process.env.GEMINI_API_KEY?.trim()),
    payhereConfigured: Boolean(
      process.env.PAYHERE_MERCHANT_ID?.trim() &&
        process.env.PAYHERE_MERCHANT_SECRET?.trim(),
    ),
  });
});

app.use('/api', mentorshipRoutes);
app.use('/api', aiWalletRoutes);
app.use('/api', paymentRoutes);

async function startServer() {
  await connectDB();
  await seedDatabase();
  startDailyCoinCron();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
