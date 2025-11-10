import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';

// Mocks precisam vir antes de importar o app (rotas importam controllers que importam firebase)

// Firebase já é mockado globalmente em src/tests/setup.ts

async function cleanUser() {
  // Mocks em memória já são reiniciados entre execuções se necessário; placeholder.
}

function findCookie(header: unknown, name: string): string | undefined {
  if (!header) return undefined;
  const arr = Array.isArray(header) ? header : [header];
  const sarr = arr.filter((x): x is string => typeof x === 'string');
  return sarr.find((h) => h.startsWith(`${name}=`));
}

describe('auth e2e (full flow)', () => {
  let app: Express;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    const mod = await import('../main/app.js');
    app = mod.app;
    await cleanUser();
  });

  afterAll(async () => {
    await cleanUser();
  });

  it('should perform exchange → refresh (cookie) → logout → logout-all', async () => {
    // 1) Exchange
    const exchangeRes = await request(app)
      .post('/api/auth/firebase/exchange')
      .send({ idToken: 'fake-id-token' });
    expect(exchangeRes.status).toBe(200);
    expect(exchangeRes.body).toHaveProperty('accessToken');
    expect(exchangeRes.body).toHaveProperty('refreshToken');
    const refreshCookie = findCookie(exchangeRes.headers['set-cookie'], 'refreshToken');
    expect(refreshCookie).toBeTruthy();

    // 2) Refresh via cookie
    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', refreshCookie as string)
      .send({});
    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body).toHaveProperty('accessToken');
    expect(refreshRes.body).toHaveProperty('refreshToken');
    const newRefreshCookie = findCookie(refreshRes.headers['set-cookie'], 'refreshToken');
    expect(newRefreshCookie).toBeTruthy();

    // 3) Logout atual (limpa cookie)
    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', newRefreshCookie as string)
      .send({});
    expect(logoutRes.status).toBe(200);
    const clearedCookie = findCookie(logoutRes.headers['set-cookie'], 'refreshToken');
    expect(clearedCookie).toBeTruthy();

    // 4) Logout de todos (usa access token do refresh anterior)
    const accessToken = refreshRes.body.accessToken as string;
    const logoutAllRes = await request(app)
      .post('/api/auth/logout-all')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({});
    expect(logoutAllRes.status).toBe(200);
  });
});
