import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';

describe('GET /api/players/me/exists e2e', () => {
  let app: Express;

  beforeAll(async () => {
    const mod = await import('../main/app.js');
    app = mod.app;
  });

  it('should return 404 when user has no player', async () => {
    // exchange without role=PLAYER
    const ex = await request(app)
      .post('/api/auth/firebase/exchange')
      .send({ idToken: 'fake-id-token' });
    expect(ex.status).toBe(200);
    const token = ex.body.accessToken as string;
    const res = await request(app)
      .get('/api/players/me/exists')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('should return 200 when user has a player', async () => {
    const ex = await request(app)
      .post('/api/auth/firebase/exchange')
      .send({ idToken: 'fake-id-token', role: 'PLAYER' });
    expect(ex.status).toBe(200);
    const token = ex.body.accessToken as string;
    const res = await request(app)
      .get('/api/players/me/exists')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});
