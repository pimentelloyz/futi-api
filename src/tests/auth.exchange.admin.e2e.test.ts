import request from 'supertest';
import { describe, it, expect } from 'vitest';
import { vi } from 'vitest';

import { app } from '../main/app.js';

// Para este teste, precisamos simular que o usuário tem role ADMIN para passar na verificação
// Mock direto do repositório de memberships

vi.mock('../infra/repositories/prisma-access-membership-repository.js', () => {
  class PrismaAccessMembershipRepository {
    async grant() {
      throw new Error('not-implemented');
    }
    async revoke() {
      throw new Error('not-implemented');
    }
    async hasRole(userId: string, role: string) {
      if (userId === 'user_1' && ['ADMIN', 'MANAGER', 'ASSISTANT'].includes(role)) return true;
      return false;
    }
    async listByUser() {
      return [];
    }
  }
  return { PrismaAccessMembershipRepository };
});

describe('auth exchange-admin e2e', () => {
  it('should reject when missing idToken', async () => {
    const res = await request(app).post('/api/auth/firebase/exchange-admin').send({});
    expect(res.status).toBe(400);
  });

  it('should perform admin exchange with valid role', async () => {
    const res = await request(app)
      .post('/api/auth/firebase/exchange-admin')
      .send({ idToken: 'fake-id-token-admin' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
  });
});
