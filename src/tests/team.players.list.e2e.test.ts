import request from 'supertest';
import { describe, it, expect, beforeAll } from 'vitest';
import type { Express } from 'express';

// E2E: listar jogadores de um time por ID

describe('teams players list e2e', () => {
  let app: Express;
  let accessToken: string;
  let teamId: string;
  let myPlayerId: string;
  let teammateId: string;

  beforeAll(async () => {
    const mod = await import('../main/app.js');
    app = mod.app;

    // Exchange criando usuário + (possível) player (role=PLAYER)
    const ex = await request(app)
      .post('/api/auth/firebase/exchange')
      .send({ idToken: 'fake-id-token', role: 'PLAYER' });
    expect(ex.status).toBe(200);
    accessToken = ex.body.accessToken as string;

    // Criar time
    const t = await request(app)
      .post('/api/teams')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Team List Test' });
    expect(t.status).toBe(201);
    teamId = t.body.id as string;

    // Obter meu player
    const me = await request(app)
      .get('/api/players/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect([200, 404]).toContain(me.status);
    if (me.status === 404) {
      // cria meu player caso não exista
      const created = await request(app)
        .post('/api/players/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Me Player' });
      expect([200, 201]).toContain(created.status);
      myPlayerId = created.body.id as string;
    } else {
      myPlayerId = me.body.id as string;
    }

    // Criar outro jogador (teammate)
    const p2 = await request(app)
      .post('/api/players')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Teammate', positionSlug: 'CM', number: 8 });
    expect(p2.status).toBe(201);
    teammateId = p2.body.id as string;

    // Vincular ambos ao time via API
    await request(app)
      .post(`/api/teams/${teamId}/players`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ playerId: myPlayerId })
      .expect(204);
    await request(app)
      .post(`/api/teams/${teamId}/players`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ playerId: teammateId })
      .expect(204);
  });

  it('should return players of the team', async () => {
    const res = await request(app)
      .get(`/api/teams/${teamId}/players`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    // Deve conter pelo menos 2 jogadores
    expect(res.body.items.length).toBeGreaterThanOrEqual(2);
    const ids = res.body.items.map((p: { id: string }) => p.id);
    expect(ids).toContain(myPlayerId);
    expect(ids).toContain(teammateId);
    // Estrutura básica
    const sample = res.body.items[0];
    expect(sample).toHaveProperty('id');
    expect(sample).toHaveProperty('name');
    expect(sample).toHaveProperty('isActive');
  });
});
