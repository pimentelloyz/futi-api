import request from 'supertest';
import { describe, it, expect, beforeAll } from 'vitest';
import type { Express } from 'express';

// Firebase and env mocked in setup

describe('player skills e2e', () => {
  let app: Express;
  let accessToken: string;

  beforeAll(async () => {
    const mod = await import('../main/app.js');
    app = mod.app;
    // exchange to create user and player
    const ex = await request(app)
      .post('/api/auth/firebase/exchange')
      .send({ idToken: 'fake-id-token', role: 'PLAYER' });
    expect(ex.status).toBe(200);
    accessToken = ex.body.accessToken as string;
  });

  it('should upsert my skills and return graph data', async () => {
    const up = await request(app)
      .post('/api/players/me/skills')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        preferredFoot: 'RIGHT',
        attack: 70,
        defense: 60,
        shooting: 75,
        ballControl: 68,
        pace: 80,
      });
    expect(up.status).toBe(201);

    const gr = await request(app)
      .get('/api/players/me/graph')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(gr.status).toBe(200);
    expect(gr.body).toHaveProperty('attack', 70);
    expect(gr.body).toHaveProperty('pace', 80);
  });
});
