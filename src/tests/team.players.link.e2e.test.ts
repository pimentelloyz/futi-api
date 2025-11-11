import request from 'supertest';
import { describe, it, expect, beforeAll } from 'vitest';
import type { Express } from 'express';

// E2E: vínculo de jogador ao time + paginação/ordenação na listagem

describe('team add player + list pagination e2e', () => {
  let app: Express;
  let accessToken: string;
  let teamId: string;
  const playerIds: string[] = [];

  beforeAll(async () => {
    const mod = await import('../main/app.js');
    app = mod.app;

    const ex = await request(app)
      .post('/api/auth/firebase/exchange')
      .send({ idToken: 'fake-id-token', role: 'PLAYER' });
    expect(ex.status).toBe(200);
    accessToken = ex.body.accessToken as string;

    // Criar time
    const t = await request(app)
      .post('/api/teams')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Team Link Test' });
    expect(t.status).toBe(201);
    teamId = t.body.id as string;

    // Criar 3 jogadores genéricos
    for (const nm of ['Alice', 'Bob', 'Charlie']) {
      const p = await request(app)
        .post('/api/players')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: nm });
      expect(p.status).toBe(201);
      playerIds.push(p.body.id as string);
    }

    // Vincular 2 deles ao time via API
    for (const id of playerIds.slice(0, 2)) {
      const link = await request(app)
        .post(`/api/teams/${teamId}/players`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ playerId: id });
      expect(link.status).toBe(204);
    }
  });

  it('should list with pagination, sorting and include team', async () => {
    const res = await request(app)
      .get(`/api/teams/${teamId}/players`)
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ sort: 'name', order: 'desc', page: 1, limit: 1, includeTeam: 'true' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('items');
    expect(res.body).toHaveProperty('page', 1);
    expect(res.body).toHaveProperty('limit', 1);
    expect(typeof res.body.total).toBe('number');
    expect(res.body.items.length).toBeLessThanOrEqual(1);
    expect(res.body).toHaveProperty('team');
    expect(res.body.team).toHaveProperty('id');
    expect(res.body.team).toHaveProperty('name');
  });
});
