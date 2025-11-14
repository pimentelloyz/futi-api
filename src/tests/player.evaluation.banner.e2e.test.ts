import request from 'supertest';
import { describe, it, expect, beforeAll } from 'vitest';

import { app } from '../main/app.js';
import { prisma } from '../infra/prisma/client.js';

// This E2E test assumes seed has created a player and at least one match within a window; adjust if necessary.
// It focuses on response shape and authorization behavior.

describe('GET /api/players/me/evaluation/banner', () => {
  let authToken: string | undefined;

  beforeAll(async () => {
    // Reuse existing user with player (take first player with userId)
    const player = await prisma.player.findFirst({
      where: { userId: { not: null } },
      select: { user: { select: { id: true, firebaseUid: true } }, id: true },
    });
    if (!player || !player.user) throw new Error('Seeded player with user not found');
    // Exchange firebase token (mock: using firebaseUid directly if exchange endpoint exists)
    // Fallback: build JWT manually is out of scope; assume /api/auth/exchange returns token.
    const exchange = await request(app)
      .post('/api/auth/exchange')
      .send({ firebaseToken: player.user.firebaseUid });
    expect(exchange.status).toBe(200);
    authToken = exchange.body.accessToken;
    expect(authToken).toBeDefined();
  });

  it('should return 401 without auth', async () => {
    const res = await request(app).get('/api/players/me/evaluation/banner');
    expect(res.status).toBe(401);
  });

  it('should return evaluationBanner key (null or object) when authenticated', async () => {
    const res = await request(app)
      .get('/api/players/me/evaluation/banner')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('evaluationBanner');
    if (res.body.evaluationBanner) {
      expect(res.body.evaluationBanner).toHaveProperty('match');
      expect(res.body.evaluationBanner).toHaveProperty('pendingCount');
      expect(res.body.evaluationBanner).toHaveProperty('expiresAt');
    }
  });

  it('should include players when includePlayers=true and banner exists', async () => {
    const res = await request(app)
      .get('/api/players/me/evaluation/banner?includePlayers=true')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    if (res.body.evaluationBanner && res.body.evaluationBanner.players) {
      expect(Array.isArray(res.body.evaluationBanner.players)).toBe(true);
      if (res.body.evaluationBanner.players.length) {
        const p = res.body.evaluationBanner.players[0];
        expect(p).toHaveProperty('id');
        expect(p).toHaveProperty('name');
      }
    }
  });
});

describe('GET /api/players/me/evaluations/pending', () => {
  let authToken: string | undefined;
  beforeAll(async () => {
    const player = await prisma.player.findFirst({
      where: { userId: { not: null } },
      select: { user: { select: { id: true, firebaseUid: true } }, id: true },
    });
    if (!player || !player.user) throw new Error('Seeded player with user not found');
    const exchange = await request(app)
      .post('/api/auth/exchange')
      .send({ firebaseToken: player.user.firebaseUid });
    expect(exchange.status).toBe(200);
    authToken = exchange.body.accessToken;
  });

  it('should return 401 without auth', async () => {
    const res = await request(app).get('/api/players/me/evaluations/pending');
    expect(res.status).toBe(401);
  });

  it('should return either 404 or a valid payload with players', async () => {
    const res = await request(app)
      .get('/api/players/me/evaluations/pending')
      .set('Authorization', `Bearer ${authToken}`);
    // Acceptable statuses: 200 (has match), 404 (no match), 410 (expired)
    expect([200, 404, 410]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body).toHaveProperty('match');
      expect(res.body).toHaveProperty('players');
      expect(Array.isArray(res.body.players)).toBe(true);
    }
  });
});
