import type { Request, Response, NextFunction } from 'express';

import { jwtService } from '../../infra/security/jwt-service.js';

export function jwtAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'unauthorized' });
    const payload = jwtService.verify(token);
    req.user = { id: payload.sub, firebaseUid: payload.uid };
    next();
  } catch {
    return res.status(401).json({ error: 'unauthorized' });
  }
}
