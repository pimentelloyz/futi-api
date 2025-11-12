import request from 'supertest';
import { describe, it, expect, vi } from 'vitest';

import { app } from '../main/app.js';

// Allow ADMIN actions in this suite
vi.mock('../infra/repositories/prisma-access-membership-repository.js', () => {
  class PrismaAccessMembershipRepository {
    async hasRole(_userId: string, role: string) {
      return role === 'ADMIN';
    }
    async listByUser() {
      return [];
    }
    async grant() {
      throw new Error('not-implemented');
    }
    async revoke() {
      throw new Error('not-implemented');
    }
  }
  return { PrismaAccessMembershipRepository };
});

describe('Positions endpoints', () => {
  it('should list, update and delete positions', async () => {
    // Get access token
    const exchange = await request(app)
      .post('/api/auth/firebase/exchange')
      .send({ idToken: 'fake-id-token-long' });
    expect(exchange.status).toBe(200);
    const accessToken = exchange.body.accessToken as string;

    // List
    const list1 = await request(app)
      .get('/api/positions')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(list1.status).toBe(200);
    expect(Array.isArray(list1.body.items)).toBe(true);
    expect(list1.body.items.length).toBeGreaterThanOrEqual(2);

    // Update GK description
    const patch = await request(app)
      .patch('/api/positions/GK')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ description: 'Goleiro (teste)' });
    expect(patch.status).toBe(200);
    expect(patch.body.item.slug).toBe('GK');
    expect(patch.body.item.description).toBe('Goleiro (teste)');

    // Delete ST
    const del = await request(app)
      .delete('/api/positions/ST')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(del.status).toBe(200);
    expect(del.body.ok).toBe(true);

    // List should not include ST now
    const list2 = await request(app)
      .get('/api/positions')
      .set('Authorization', `Bearer ${accessToken}`);
    const slugs: string[] = (list2.body.items as Array<{ slug: string }>).map((i) => i.slug);
    expect(slugs).not.toContain('ST');
  });
});
