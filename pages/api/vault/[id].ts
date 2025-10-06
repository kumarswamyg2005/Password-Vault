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
  const id = req.query.id as string;
  if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'bad id' });

  const objId = new ObjectId(id);

  if (req.method === 'GET') {
    const item = await col.findOne({ _id: objId, userId: new ObjectId(userId) });
    if (!item) return res.status(404).json({ error: 'not found' });
    return res.status(200).json(item);
  }

  if (req.method === 'PUT') {
    const { ciphertext, iv } = req.body;
    if (!ciphertext || !iv) return res.status(400).json({ error: 'ciphertext+iv required' });
    await col.updateOne({ _id: objId, userId: new ObjectId(userId) }, { $set: { ciphertext, iv, updatedAt: new Date() } });
    const updated = await col.findOne({ _id: objId });
    return res.status(200).json(updated);
  }

  if (req.method === 'DELETE') {
    await col.deleteOne({ _id: objId, userId: new ObjectId(userId) });
    return res.status(204).end();
  }

  return res.status(405).end();
}
