import type { Request, Response, NextFunction } from 'express';

import { verifyIdToken } from '../../infra/firebase/admin.js';

export async function firebaseAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
    if (!token) return res.status(401).json({ error: 'unauthorized' });
    const decoded = await verifyIdToken(token);
    // @ts-expect-error attach user to request
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'unauthorized' });
  }
}
