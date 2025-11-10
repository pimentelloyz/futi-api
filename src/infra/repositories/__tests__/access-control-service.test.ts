import { describe, it, expect, beforeEach } from 'vitest';

import { AccessControlService } from '../../../data/usecases/access-control-service.js';
import {
  AccessMembershipRepository,
  AccessRole,
} from '../../../data/protocols/access-membership-repository.js';

class InMemoryAccessRepo implements AccessMembershipRepository {
  items: {
    id: string;
    userId: string;
    teamId: string | null;
    role: AccessRole;
    createdAt: Date;
  }[] = [];
  seq = 0;
  async grant(userId: string, role: AccessRole, teamId?: string | null) {
    const existing = this.items.find((i) => i.userId === userId && i.teamId === (teamId ?? null));
    if (existing) {
      existing.role = role;
      return existing;
    }
    const rec = {
      id: `acc_${++this.seq}`,
      userId,
      teamId: teamId ?? null,
      role,
      createdAt: new Date(),
    };
    this.items.push(rec);
    return rec;
  }
  async revoke(userId: string, role: AccessRole, teamId?: string | null) {
    this.items = this.items.filter(
      (i) => !(i.userId === userId && i.role === role && i.teamId === (teamId ?? null)),
    );
  }
  async hasRole(userId: string, role: AccessRole, teamId?: string | null) {
    return !!this.items.find(
      (i) => i.userId === userId && i.role === role && i.teamId === (teamId ?? null),
    );
  }
  async listByUser(userId: string) {
    return this.items.filter((i) => i.userId === userId);
  }
}

describe('AccessControlService', () => {
  let repo: InMemoryAccessRepo;
  let service: AccessControlService;
  const userAdmin = 'u_admin';
  const userManager = 'u_manager';
  const userAssist = 'u_assist';
  const userPlayer = 'u_player';
  const teamA = 'team_a';

  beforeEach(async () => {
    repo = new InMemoryAccessRepo();
    service = new AccessControlService(repo);
    await service.grant(userAdmin, 'ADMIN');
    await service.grant(userManager, 'MANAGER', teamA);
    await service.grant(userAssist, 'ASSISTANT', teamA);
    await service.grant(userPlayer, 'PLAYER', teamA);
  });

  it('admin should manage and remove players', async () => {
    expect(await service.isAdmin(userAdmin)).toBe(true);
    expect(await service.canManageTeam(userAdmin, teamA)).toBe(true);
    expect(await service.canRemovePlayer(userAdmin, teamA)).toBe(true);
  });

  it('manager should manage team and remove players', async () => {
    expect(await service.canManageTeam(userManager, teamA)).toBe(true);
    expect(await service.canAssistTeam(userManager, teamA)).toBe(true);
    expect(await service.canRemovePlayer(userManager, teamA)).toBe(true);
  });

  it('assistant should assist but not remove players', async () => {
    expect(await service.canAssistTeam(userAssist, teamA)).toBe(true);
    expect(await service.canManageTeam(userAssist, teamA)).toBe(false);
    expect(await service.canRemovePlayer(userAssist, teamA)).toBe(false);
  });

  it('player should view but not manage', async () => {
    expect(await service.canViewTeam(userPlayer, teamA)).toBe(true);
    expect(await service.canAssistTeam(userPlayer, teamA)).toBe(false);
    expect(await service.canRemovePlayer(userPlayer, teamA)).toBe(false);
  });
});
