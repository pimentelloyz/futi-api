export interface ListInvitationCodesInput {
  teamId: string;
  isActive?: boolean;
}

export interface ListInvitationCodesOutput {
  invitationCodes: Array<{
    id: string;
    code: string;
    teamId: string;
    createdBy: string | null;
    maxUses: number;
    uses: number;
    isActive: boolean;
    expiresAt: Date | null;
    createdAt: Date;
  }>;
}
