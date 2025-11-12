import request from 'supertest';
import { describe, it, expect, beforeAll } from 'vitest';
import type { Express } from 'express';

// E2E: listagem de times com filtro isActive opcional

describe('GET /api/teams e2e', () => {
  let app: Express;
  let accessToken: string;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    const mod = await import('../main/app.js');
    app = mod.app;

    const ex = await request(app)
      .post('/api/auth/firebase/exchange')
      .send({ idToken: 'fake-id-token-list-teams' });
    expect(ex.status).toBe(200);
    accessToken = ex.body.accessToken as string;

    // Criar 3 times (2 ativos, 1 inativo)
    const t1 = await request(app)
      .post('/api/teams')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Alpha', isActive: true });
    expect(t1.status).toBe(201);

    const t2 = await request(app)
      .post('/api/teams')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Beta', isActive: false });
    expect(t2.status).toBe(201);

    const t3 = await request(app)
      .post('/api/teams')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Gamma' }); // default isActive=true
    expect(t3.status).toBe(201);
  });

  it('should list all teams when no filter is provided (sorted by name asc)', async () => {
    const res = await request(app)
      .get('/api/teams')
      .set('Authorization', `Bearer ${accessToken}`)
      .send();
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('items');
    const names = (res.body.items as Array<{ name: string }>).map((t) => t.name);
    // Deve conter todos
    expect(names).toEqual(['Alpha', 'Beta', 'Gamma']);
  });

  it('should filter by isActive=true', async () => {
    const res = await request(app)
      .get('/api/teams')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ isActive: 'true' });
    expect(res.status).toBe(200);
    const names = (res.body.items as Array<{ name: string }>).map((t) => t.name);
    expect(names).toEqual(['Alpha', 'Gamma']);
  });

  it('should filter by isActive=false', async () => {
    const res = await request(app)
      .get('/api/teams')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ isActive: 'false' });
    expect(res.status).toBe(200);
    const names = (res.body.items as Array<{ name: string }>).map((t) => t.name);
    expect(names).toEqual(['Beta']);
  });

  it('should reject invalid isActive value', async () => {
    const res = await request(app)
      .get('/api/teams')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ isActive: 'maybe' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'invalid_query');
  });
});
