export interface ListLeagueInvitationsInput {
  leagueId: string;
  isActive?: boolean;
}

export interface ListLeagueInvitationsOutput {
  invitations: Array<{
    id: string;
    code: string;
    leagueId: string;
    createdBy: string | null;
    maxUses: number;
    uses: number;
    isActive: boolean;
    expiresAt: Date | null;
    createdAt: Date;
  }>;
}
