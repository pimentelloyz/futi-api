export interface CreateLeagueInvitationInput {
  leagueId: string;
  createdBy: string | null;
  maxUses?: number;
  expiresAt?: Date | null;
}

export interface CreateLeagueInvitationOutput {
  id: string;
  code: string;
}
