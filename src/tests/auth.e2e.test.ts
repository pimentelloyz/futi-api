import request from 'supertest';
import { describe, it, expect } from 'vitest';

import { app } from '../main/app.js';

describe('auth e2e (lightweight)', () => {
  it('should return 400 on refresh without token (body or cookie)', async () => {
    const res = await request(app).post('/api/auth/refresh').send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'invalid_request');
  });

  it('should return 400 on logout without token (body or cookie)', async () => {
    const res = await request(app).post('/api/auth/logout').send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'invalid_request');
  });

  it('should return 401 on logout-all without JWT', async () => {
    const res = await request(app).post('/api/auth/logout-all').send({});
    expect(res.status).toBe(401);
  });

  it('should serve OpenAPI JSON', async () => {
    const res = await request(app).get('/docs.json');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('openapi');
  });
});
