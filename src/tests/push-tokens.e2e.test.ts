import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';

let app: Express;

describe('push tokens e2e', () => {
  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    const mod = await import('../main/app.js');
    app = mod.app;
  });

  it('should reject without JWT', async () => {
    const res = await request(app).post('/api/users/me/push-tokens').send({ token: 'abc' });
    expect(res.status).toBe(401);
  });

  it('should validate body (missing token)', async () => {
    // primeiro obter accessToken
    const auth = await request(app)
      .post('/api/auth/firebase/exchange')
      .send({ idToken: 'fake-id-token' });
    expect(auth.status).toBe(200);
    const accessToken = auth.body.accessToken as string;
    const res = await request(app)
      .post('/api/users/me/push-tokens')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'invalid_body');
  });

  it('should register push token and allow re-register (upsert)', async () => {
    const auth = await request(app)
      .post('/api/auth/firebase/exchange')
      .send({ idToken: 'fake-id-token-2' });
    expect(auth.status).toBe(200);
    const accessToken = auth.body.accessToken as string;
    const tokenValue = 'fcm_token_example_1234567890';
    const first = await request(app)
      .post('/api/users/me/push-tokens')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ token: tokenValue, platform: 'android' });
    expect(first.status).toBe(204);
    const second = await request(app)
      .post('/api/users/me/push-tokens')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ token: tokenValue, platform: 'web' });
    expect(second.status).toBe(204);
  });
});
