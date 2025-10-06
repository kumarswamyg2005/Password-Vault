import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '../../../lib/mongo';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

function getUserIdFromReq(req: NextApiRequest) {
  const auth = req.headers.authorization;
  if (!auth) return null;
  const parts = auth.split(' ');
  if (parts.length !== 2) return null;
  const token = parts[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
    return payload.sub;
  } catch (e) {
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = getUserIdFromReq(req);
  if (!userId) return res.status(401).json({ error: 'unauth' });

  const db = await getDb();
  const col = db.collection('vault');

  if (req.method === 'GET') {
    const items = await col.find({ userId: new ObjectId(userId) }).sort({ createdAt: -1 }).toArray();
    return res.status(200).json(items);
  }

  if (req.method === 'POST') {
    const { ciphertext, iv } = req.body;
    if (!ciphertext || !iv) return res.status(400).json({ error: 'ciphertext+iv required' });

    const now = new Date();
    const result = await col.insertOne({
      userId: new ObjectId(userId),
      ciphertext,
      iv,
      createdAt: now,
      updatedAt: now,
    });
    const inserted = await col.findOne({ _id: result.insertedId });
    return res.status(201).json(inserted);
  }

  return res.status(405).end();
}
