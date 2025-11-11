import request from 'supertest';
import { describe, it, expect, beforeAll } from 'vitest';
import type { Express } from 'express';

// Este teste cobre criação de times, partida, adição de eventos e listagem

describe('match events e2e', () => {
  let app: Express;
  let accessToken: string;
  let homeTeamId: string;
  let awayTeamId: string;
  let matchId: string;

  beforeAll(async () => {
    const mod = await import('../main/app.js');
    app = mod.app;
    // Exchange para criar usuário (sem precisar player aqui)
    const ex = await request(app)
      .post('/api/auth/firebase/exchange')
      .send({ idToken: 'fake-id-token' });
    expect(ex.status).toBe(200);
    accessToken = ex.body.accessToken as string;
    // Criar dois times
    const t1 = await request(app)
      .post('/api/teams')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Team A' });
    expect(t1.status).toBe(201);
    homeTeamId = t1.body.id;
    const t2 = await request(app)
      .post('/api/teams')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Team B' });
    expect(t2.status).toBe(201);
    awayTeamId = t2.body.id;
    // Criar match
    const match = await request(app)
      .post('/api/matches')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ homeTeamId, awayTeamId, scheduledAt: new Date().toISOString() });
    expect(match.status).toBe(201);
    matchId = match.body.id;
  });

  it('should add events to match and list them', async () => {
    const ev1 = await request(app)
      .post(`/api/matches/${matchId}/events`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ type: 'GOAL', minute: 10, teamId: homeTeamId });
    expect(ev1.status).toBe(201);
    const ev2 = await request(app)
      .post(`/api/matches/${matchId}/events`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ type: 'YELLOW_CARD', minute: 30, teamId: awayTeamId });
    expect(ev2.status).toBe(201);

    const list = await request(app)
      .get(`/api/matches/${matchId}/events`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body.items)).toBe(true);
    expect(list.body.items.length).toBe(2);
    expect(list.body.items[0]).toHaveProperty('type');
  });
});
