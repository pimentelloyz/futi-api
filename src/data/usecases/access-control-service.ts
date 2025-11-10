import {
  AccessMembershipRepository,
  AccessRole,
} from '../protocols/access-membership-repository.js';

export class AccessControlService {
  constructor(private repo: AccessMembershipRepository) {}

  async isAdmin(userId: string) {
    return this.repo.hasRole(userId, 'ADMIN');
  }

  async canManageTeam(userId: string, teamId: string) {
    if (await this.isAdmin(userId)) return true;
    if (await this.repo.hasRole(userId, 'MANAGER', teamId)) return true;
    return false;
  }

  async canAssistTeam(userId: string, teamId: string) {
    if (await this.canManageTeam(userId, teamId)) return true;
    return this.repo.hasRole(userId, 'ASSISTANT', teamId);
  }

  async canViewTeam(userId: string, teamId: string) {
    if (await this.canAssistTeam(userId, teamId)) return true;
    return this.repo.hasRole(userId, 'PLAYER', teamId);
  }

  async canRemovePlayer(userId: string, teamId: string) {
    // Assistente NÃO pode remover jogador; manager ou admin podem
    if (await this.isAdmin(userId)) return true;
    return this.repo.hasRole(userId, 'MANAGER', teamId);
  }

  async grant(userId: string, role: AccessRole, teamId?: string | null) {
    return this.repo.grant(userId, role, teamId);
  }

  async revoke(userId: string, role: AccessRole, teamId?: string | null) {
    return this.repo.revoke(userId, role, teamId);
  }
}
