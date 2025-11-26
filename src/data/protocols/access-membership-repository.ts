export type AccessRole = 'MASTER' | 'ADMIN' | 'MANAGER' | 'ASSISTANT' | 'PLAYER' | 'LEAGUE_MANAGER' | 'MATCH_MANAGER' | 'REFEREE_COMMISSION' | 'FAN';

export interface AccessMembership {
  id: string;
  userId: string;
  teamId: string | null;
  leagueId?: string | null;
  role: AccessRole;
  createdAt: Date;
}

export interface TeamSummary {
  id: string;
  name: string;
  icon: string | null;
  description: string | null;
  isActive: boolean;
}

export interface AccessMembershipWithTeam extends AccessMembership {
  team: TeamSummary | null;
}

export interface AccessMembershipRepository {
  grant(
    userId: string,
    role: AccessRole,
    teamId?: string | null,
    leagueId?: string | null,
  ): Promise<AccessMembership>;
  revoke(
    userId: string,
    role: AccessRole,
    teamId?: string | null,
    leagueId?: string | null,
  ): Promise<void>;
  hasRole(
    userId: string,
    role: AccessRole,
    teamId?: string | null,
    leagueId?: string | null,
  ): Promise<boolean>;
  listByUser(userId: string): Promise<AccessMembership[]>;
  listByUserWithTeam(userId: string): Promise<AccessMembershipWithTeam[]>;
}
