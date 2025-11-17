export interface AcceptLeagueInvitationInput {
  code: string;
  teamId: string;
  userId: string;
}

export interface AcceptLeagueInvitationOutput {
  success: boolean;
  leagueId: string;
  message: string;
}
