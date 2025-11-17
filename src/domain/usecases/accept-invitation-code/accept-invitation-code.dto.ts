export interface AcceptInvitationCodeInput {
  code: string;
  userId: string;
}

export interface AcceptInvitationCodeOutput {
  success: boolean;
  teamId: string;
  message: string;
}
