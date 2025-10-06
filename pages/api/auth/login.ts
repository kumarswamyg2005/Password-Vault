import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '../../../lib/mongo';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email+password required' });

  const db = await getDb();
  const users = db.collection('users');
  const user = await users.findOne({ email });

  if (!user) return res.status(401).json({ error: 'invalid' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'invalid' });

  const token = jwt.sign({ sub: user._id.toString(), email: user.email }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

  res.status(200).json({
    token,
    encSalt: user.encSalt,
    encIterations: user.encIterations,
  });
}
