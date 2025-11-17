export interface CreateInvitationCodeInput {
  teamId: string;
  createdBy: string | null;
  maxUses?: number;
  expiresAt?: Date | null;
}

export interface CreateInvitationCodeOutput {
  id: string;
  code: string;
}
