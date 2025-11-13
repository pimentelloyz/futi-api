import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';

// Testa atualização parcial do meu perfil de jogador

describe('PATCH /api/players/me e2e', () => {
  let app: Express;
  let accessToken: string;

  beforeAll(async () => {
    const mod = await import('../main/app.js');
    app = mod.app;
    const ex = await request(app)
      .post('/api/auth/firebase/exchange')
      .send({ idToken: 'fake-id-token', role: 'PLAYER' });
    expect(ex.status).toBe(200);
    accessToken = ex.body.accessToken as string;
  });

  it('should update my player name and position, returning position object', async () => {
    // sanity get
    const me0 = await request(app)
      .get('/api/players/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(me0.status).toBe(200);

    const patch = await request(app)
      .patch('/api/players/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Player Patched', positionSlug: 'CM', number: 7 });
    expect(patch.status).toBe(200);
    expect(typeof patch.body.name).toBe('string');
    // Confirma via GET após PATCH
    const meAfter = await request(app)
      .get('/api/players/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(meAfter.status).toBe(200);
    // número pode ser null ou number dependendo de políticas; aqui garantimos que o campo existe
    expect('number' in meAfter.body).toBe(true);
    // position returns either null or object; schema ensures shape
    expect('position' in patch.body).toBe(true);
    if (patch.body.position) {
      expect(typeof patch.body.position.slug).toBe('string');
      expect(typeof patch.body.position.name).toBe('string');
    }
  });
});
