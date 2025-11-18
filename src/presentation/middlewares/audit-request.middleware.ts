import { promises as fs } from 'node:fs';
import path from 'node:path';

import type { NextFunction, Request, Response } from 'express';

const LOG_DIR = path.resolve(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'http-audit.log');

async function ensureLogDir() {
  try {
    await fs.mkdir(LOG_DIR, { recursive: true });
  } catch {}
}

export function auditRequest() {
  return async (req: Request, res: Response, next: NextFunction) => {
    await ensureLogDir();
    const start = Date.now();
    const reqId = (req as Request & { ctx?: { id: string } }).ctx?.id;
    const user = (req as Request & { user?: { id?: string; email?: string } }).user;

    res.on('finish', async () => {
      const durationMs = Date.now() - start;
      const payload = {
        timestamp: new Date().toISOString(),
        reqId,
        method: req.method,
        path: req.originalUrl || req.url,
        statusCode: res.statusCode,
        durationMs,
        userId: user?.id,
        userEmail: user?.email,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      };
      try {
        await fs.appendFile(LOG_FILE, JSON.stringify(payload) + '\n', { encoding: 'utf8' });
      } catch (e) {
        // evita quebrar o fluxo por falha de log

        console.warn('[auditRequest append warn]', (e as Error).message);
      }
    });

    next();
  };
}
