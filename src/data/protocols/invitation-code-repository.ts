export type InvitationCodeCreate = {
  code: string;
  teamId: string;
  createdBy?: string | null;
  maxUses?: number;
  expiresAt?: Date | null;
};

export type InvitationCodeModel = {
  id: string;
  code: string;
  teamId: string;
  createdBy?: string | null;
  maxUses: number;
  uses: number;
  isActive: boolean;
  expiresAt?: Date | null;
  createdAt: Date;
};

export interface InvitationCodeRepository {
  create(data: InvitationCodeCreate): Promise<InvitationCodeModel>;
  findByCode(code: string): Promise<InvitationCodeModel | null>;
  incrementUse(id: string): Promise<InvitationCodeModel>;
  listByTeam(teamId: string): Promise<InvitationCodeModel[]>;
  revoke(id: string): Promise<void>;
}
