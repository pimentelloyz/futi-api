import { randomUUID } from 'node:crypto';

import type { NextFunction, Request, Response } from 'express';

export function requestContext() {
  return (req: Request, _res: Response, next: NextFunction) => {
    const ctx = { id: randomUUID(), cache: new Map<string, unknown>(), startedAt: Date.now() };
    (req as Request & { ctx: typeof ctx }).ctx = ctx;
    next();
  };
}

export async function getFromReqCache<T>(
  req: Request,
  key: string,
  fetcher: () => Promise<T>,
): Promise<T> {
  const ctx = (req as Request & { ctx?: { cache: Map<string, unknown> } }).ctx;
  if (!ctx) return fetcher();
  if (ctx.cache.has(key)) return ctx.cache.get(key) as T;
  const value = await fetcher();
  ctx.cache.set(key, value);
  return value;
}
