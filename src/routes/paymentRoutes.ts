import crypto from 'crypto';
import { Router, Request, Response } from 'express';
import { isDbConnected } from '../config/db.js';
import { WalletModel, CoinActivityModel } from '../models/Wallet.js';
import { SessionModel } from '../models/Session.js';
import {
  coinPackages,
  coinActivity as mockActivity,
  walletSummary as mockWallet,
  sessions as mockSessions,
} from '../data/mockData.js';

const router = Router();

function md5Upper(value: string): string {
  return crypto.createHash('md5').update(value).digest('hex').toUpperCase();
}

// POST /api/payment/initiate
router.post('/payment/initiate', (req: Request, res: Response) => {
  const { type, packageId, sessionId, amount, itemTitle } = req.body as {
    type?: 'coin_topup' | 'mentor_booking';
    packageId?: string;
    sessionId?: string;
    amount?: number;
    itemTitle?: string;
  };

  if (!type || typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'Valid type and positive amount are required.' });
  }

  const orderId = `${type === 'coin_topup' ? 'COIN' : 'SESS'}-${Date.now()}`;
  const merchantId = process.env.PAYHERE_MERCHANT_ID?.trim();
  const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET?.trim();

  if (!merchantId || !merchantSecret) {
    return res.json({
      mode: 'demo',
      orderId,
      amount,
      message: 'PayHere sandbox keys not configured — using instant demo checkout.',
    });
  }

  const currency = 'LKR';
  const amountFormatted = amount.toFixed(2);
  const hashedSecret = md5Upper(merchantSecret);
  const hash = md5Upper(`${merchantId}${orderId}${amountFormatted}${currency}${hashedSecret}`);

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const appUrl = process.env.APP_URL || 'http://localhost:5000';
  const returnPath = type === 'coin_topup' ? '/mentorship/wallet' : '/mentorship/sessions';

  return res.json({
    mode: 'payhere',
    checkoutUrl: 'https://sandbox.payhere.lk/pay/checkout',
    payload: {
      merchant_id: merchantId,
      return_url: `${clientUrl}${returnPath}?payment=success`,
      cancel_url: `${clientUrl}${returnPath}?payment=cancelled`,
      notify_url: `${appUrl}/api/payment/notify`,
      order_id: orderId,
      items: itemTitle || (type === 'coin_topup' ? 'DevCraft AI Coin Package' : 'DevCraft 1:1 Mentor Session'),
      currency,
      amount: amountFormatted,
      first_name: 'DevCraft',
      last_name: 'Learner',
      email: 'learner@devcraft.lk',
      phone: '0770000000',
      address: 'University of Moratuwa',
      city: 'Moratuwa',
      country: 'Sri Lanka',
      custom_1: type,
      custom_2: packageId || sessionId || '',
      hash,
    },
  });
});

// POST /api/payment/notify (PayHere IPN webhook)
router.post('/payment/notify', async (req: Request, res: Response) => {
  try {
    const {
      merchant_id,
      order_id,
      payment_id,
      payhere_amount,
      payhere_currency,
      status_code,
      md5sig,
      custom_1,
      custom_2,
    } = req.body as Record<string, string>;

    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET?.trim();
    if (!merchantSecret) {
      return res.status(400).send('PayHere merchant secret not configured.');
    }

    const localMd5Sig = md5Upper(
      `${merchant_id}${order_id}${payhere_amount}${payhere_currency}${status_code}${md5Upper(merchantSecret)}`,
    );

    if (localMd5Sig !== md5sig) {
      return res.status(400).send('Invalid PayHere signature.');
    }

    // status_code === '2' means payment completed
    if (status_code === '2') {
      const today = new Date().toISOString().slice(0, 10);

      if (custom_1 === 'coin_topup' && custom_2) {
        const pack = coinPackages.find((p) => p.id === custom_2);
        if (pack) {
          if (isDbConnected()) {
            const wallet = await WalletModel.findOne({ userId: 'default-user' });
            if (wallet) {
              wallet.purchased += pack.coins;
              await wallet.save();
              await CoinActivityModel.create({
                activityId: `act-${Date.now()}`,
                userId: 'default-user',
                date: today,
                type: 'purchase',
                label: 'Coin package top-up',
                coins: pack.coins,
                description: `Purchased ${pack.coins} coins via PayHere (${payment_id || order_id})`,
              });
            }
          } else {
            mockWallet.purchased += pack.coins;
            mockWallet.available = mockWallet.dailyFree + mockWallet.purchased;
            mockActivity.unshift({
              id: `act-${Date.now()}`,
              date: today,
              type: 'purchase',
              label: 'Coin package top-up',
              coins: pack.coins,
              description: `Purchased ${pack.coins} coins via PayHere (${payment_id || order_id})`,
            });
          }
        }
      } else if (custom_1 === 'mentor_booking' && custom_2) {
        if (isDbConnected()) {
          await SessionModel.findOneAndUpdate(
            { sessionId: custom_2 },
            { paymentStatus: 'Paid', paymentRef: payment_id || order_id },
          );
        } else {
          const sess = mockSessions.find((s) => s.id === custom_2);
          if (sess) {
            // In-memory demo session updated
            sess.status = 'Upcoming';
          }
        }
      }
    }

    return res.status(200).send('OK');
  } catch (error) {
    return res.status(500).send(
      error instanceof Error ? error.message : 'Payment notification error.',
    );
  }
});

export default router;
