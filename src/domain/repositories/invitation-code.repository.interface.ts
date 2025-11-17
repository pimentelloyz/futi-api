import { InvitationCode } from '../entities/invitation-code.entity.js';

export interface IInvitationCodeRepository {
  create(data: {
    code: string;
    teamId: string;
    createdBy: string | null;
    maxUses: number;
    expiresAt: Date | null;
  }): Promise<InvitationCode>;

  findByCode(code: string): Promise<InvitationCode | null>;

  findById(id: string): Promise<InvitationCode | null>;

  listByTeam(teamId: string, isActive?: boolean): Promise<InvitationCode[]>;

  incrementUse(id: string): Promise<void>;

  revoke(id: string): Promise<void>;
}
