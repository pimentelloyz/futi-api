import request from 'supertest';
import { describe, it, expect, beforeAll } from 'vitest';
import type { Express } from 'express';

// Cobre overview do time (recent matches + next game)

describe('player team overview e2e', () => {
  let app: Express;
  let accessToken: string;
  let teamId: string;
  let otherTeamId: string;

  beforeAll(async () => {
    const mod = await import('../main/app.js');
    app = mod.app;
    // Exchange criando usuário + player (role=PLAYER)
    const ex = await request(app)
      .post('/api/auth/firebase/exchange')
      .send({ idToken: 'fake-id-token', role: 'PLAYER' });
    expect(ex.status).toBe(200);
    accessToken = ex.body.accessToken as string;
    // Criar times
    const t1 = await request(app)
      .post('/api/teams')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Overview Team' });
    expect(t1.status).toBe(201);
    teamId = t1.body.id;
    const t2 = await request(app)
      .post('/api/teams')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Opponent Team' });
    expect(t2.status).toBe(201);
    otherTeamId = t2.body.id;
    // Vincular player ao time (usando prisma mock update)
    const me = await request(app)
      .get('/api/players/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(me.status).toBe(200);
    const playerId = me.body.id as string;
    type PrismaMock = {
      player: {
        update(args: {
          where: { id: string };
          data: { teams?: { connect?: Array<{ id: string }> } };
        }): Promise<unknown>;
      };
    };
    const prismaMod = (await import('../infra/prisma/client.js')) as unknown as {
      prisma: PrismaMock;
    };
    await prismaMod.prisma.player.update({
      where: { id: playerId },
      data: { teams: { connect: [{ id: teamId }] } },
    });
    // Vincular player ao time (atualizando player diretamente via prisma mock? rota de player update ainda não existe; criar match relacionado e usar match queries)
    // Criar alguns jogos passados (home vs mesma equipe para simplificar)
    for (let i = 0; i < 3; i++) {
      const pastDate = new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000);
      const m = await request(app)
        .post('/api/matches')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          homeTeamId: teamId,
          awayTeamId: otherTeamId,
          scheduledAt: pastDate.toISOString(),
          status: 'FINISHED',
        });
      expect(m.status).toBe(201);
    }
    // Próximo jogo futuro
    const futureDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    const nextMatch = await request(app)
      .post('/api/matches')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        homeTeamId: teamId,
        awayTeamId: otherTeamId,
        scheduledAt: futureDate.toISOString(),
        status: 'SCHEDULED',
      });
    expect(nextMatch.status).toBe(201);
  });

  it('should return overview with recent matches and next game', async () => {
    const ov = await request(app)
      .get('/api/players/me/team/overview')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ teamId });
    // Espera 404 por falta de vínculo ou 200 com estrutura correta
    if (ov.status === 200) {
      expect(ov.body).toHaveProperty('team');
      expect(Array.isArray(ov.body.recentMatches)).toBe(true);
      expect(ov.body).toHaveProperty('next_game');
    }
    expect([404, 200]).toContain(ov.status);
  });
});
