import { LeagueInvitation } from '../entities/league-invitation.entity.js';

export interface ILeagueInvitationRepository {
  create(data: {
    code: string;
    leagueId: string;
    createdBy: string | null;
    maxUses: number;
    expiresAt: Date | null;
  }): Promise<LeagueInvitation>;

  findByCode(code: string): Promise<LeagueInvitation | null>;

  findById(id: string): Promise<LeagueInvitation | null>;

  listByLeague(leagueId: string, isActive?: boolean): Promise<LeagueInvitation[]>;

  incrementUse(id: string): Promise<void>;

  revoke(id: string): Promise<void>;
}
