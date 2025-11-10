import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';

describe('auth exchange with role PLAYER', () => {
  let app: Express;
  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    const mod = await import('../main/app.js');
    app = mod.app;
  });

  it('should create user and player when role=PLAYER is sent', async () => {
    const res = await request(app)
      .post('/api/auth/firebase/exchange')
      .send({ idToken: 'fake-id-token', role: 'PLAYER' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    // Agora pedir /api/players/me com bearer token
    const accessToken = res.body.accessToken as string;
    const meRes = await request(app)
      .get('/api/players/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(meRes.status).toBe(200);
    expect(meRes.body).toHaveProperty('id');
    expect(meRes.body).toHaveProperty('name');
  });
});
