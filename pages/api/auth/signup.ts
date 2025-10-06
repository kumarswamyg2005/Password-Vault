import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '../../../lib/mongo';
import bcrypt from 'bcrypt';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email+password required' });

  const db = await getDb();
  const users = db.collection('users');
  const existing = await users.findOne({ email });
  if (existing) return res.status(409).json({ error: 'user exists' });

  const passwordHash = await bcrypt.hash(password, 12);

  const crypto = require('crypto');
  const encSaltBuf = crypto.randomBytes(16);
  const encSalt = encSaltBuf.toString('base64');
  const encIterations = 200000;

  const createdAt = new Date();
  const result = await users.insertOne({
    email,
    passwordHash,
    encSalt,
    encIterations,
    createdAt,
  });

  res.status(201).json({ ok: true, encSalt, encIterations });
}
