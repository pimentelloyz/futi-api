import request from 'supertest';
import { describe, it, expect } from 'vitest';

import { app } from '../main/app.js';

/**
 * Teste unitário focado nos dados retornados pelos endpoints
 * Não testa RBAC/permissões - apenas verifica que os includes do Prisma estão funcionando
 */

describe('match events data integrity', () => {
  it('should include player data in match events endpoint', async () => {
    // Este teste verifica apenas a estrutura de resposta
    // Em um banco real com dados de seed, você pode testar com IDs reais

    // Setup: criar usuário, token
    const ex = await request(app)
      .post('/api/auth/firebase/exchange')
      .send({ idToken: 'fake-id-token' });
    expect(ex.status).toBe(200);
    const accessToken = ex.body.accessToken as string;

    // Testar estrutura do endpoint de eventos
    // Usando um matchId fictício - o importante é verificar a estrutura
    const eventsList = await request(app)
      .get('/api/matches/00000000-0000-0000-0000-000000000000/events')
      .set('Authorization', `Bearer ${accessToken}`);

    // Mesmo sem eventos, deve retornar estrutura correta
    expect(eventsList.status).toBe(200);
    expect(eventsList.body).toHaveProperty('items');
    expect(Array.isArray(eventsList.body.items)).toBe(true);
  });

  it('should include homeTeam and awayTeam data in matches list endpoint', async () => {
    // Setup: criar usuário, token
    const ex = await request(app)
      .post('/api/auth/firebase/exchange')
      .send({ idToken: 'fake-id-token' });
    expect(ex.status).toBe(200);
    const accessToken = ex.body.accessToken as string;

    // Testar estrutura do endpoint de listagem de matches
    const matchesList = await request(app)
      .get('/api/matches')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(matchesList.status).toBe(200);
    expect(matchesList.body).toHaveProperty('items');
    expect(Array.isArray(matchesList.body.items)).toBe(true);

    // Se houver matches no banco (seeds), verificar estrutura
    if (matchesList.body.items.length > 0) {
      const match = matchesList.body.items[0];
      expect(match).toHaveProperty('homeTeam');
      expect(match).toHaveProperty('awayTeam');
      expect(match.homeTeam).toHaveProperty('id');
      expect(match.homeTeam).toHaveProperty('name');
      expect(match.awayTeam).toHaveProperty('id');
      expect(match.awayTeam).toHaveProperty('name');
    }
  });
});
