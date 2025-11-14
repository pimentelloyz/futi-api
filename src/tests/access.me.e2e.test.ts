import request from 'supertest';
import { describe, it, expect, vi } from 'vitest';

import { app } from '../main/app.js';

// Mock repo to control memberships returned
vi.mock('../infra/repositories/prisma-access-membership-repository.js', () => {
  class PrismaAccessMembershipRepository {
    async listByUserWithTeam(userId: string) {
      return [
        {
          id: 'mem_admin',
          userId,
          teamId: null,
          role: 'ADMIN',
          createdAt: new Date('2025-01-01T00:00:00Z'),
          team: null,
        },
        {
          id: 'mem_manager',
          userId,
          teamId: 'team_1',
          role: 'MANAGER',
          createdAt: new Date('2025-01-02T00:00:00Z'),
          team: {
            id: 'team_1',
            name: 'Futi FC',
            icon: null,
            description: null,
            isActive: true,
          },
        },
      ];
    }
  }
  return { PrismaAccessMembershipRepository };
});

describe('GET /api/access/me', () => {
  it('should return memberships with team data', async () => {
    // get access token via exchange
    const exchange = await request(app)
      .post('/api/auth/firebase/exchange')
      .send({ idToken: 'fake-id-token-long' });
    expect(exchange.status).toBe(200);
    const accessToken = exchange.body.accessToken as string;

    const res = await request(app)
      .get('/api/access/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.memberships)).toBe(true);
    type Role = 'ADMIN' | 'MANAGER' | 'ASSISTANT' | 'PLAYER';
    type Team = {
      id: string;
      name: string;
      icon: string | null;
      description: string | null;
      isActive: boolean;
    } | null;
    type Membership = {
      id: string;
      userId: string;
      teamId: string | null;
      role: Role;
      createdAt: string | Date;
      team: Team;
    };
    const mems: Membership[] = res.body.memberships as Membership[];
    // Should include an ADMIN (global) and MANAGER with team object
    const admin = mems.find((m) => m.role === 'ADMIN');
    const manager = mems.find((m) => m.role === 'MANAGER');
    expect(admin).toBeTruthy();
    expect(admin!.team).toBeNull();
    expect(manager).toBeTruthy();
    expect(manager!.team).toBeTruthy();
    expect(manager!.team!.name).toBe('Futi FC');
  });
});
