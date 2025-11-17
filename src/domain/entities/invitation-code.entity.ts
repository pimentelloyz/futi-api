export class InvitationCode {
  constructor(
    public readonly id: string,
    public readonly code: string,
    public readonly teamId: string,
    public readonly createdBy: string | null,
    public readonly maxUses: number,
    public readonly uses: number,
    public readonly isActive: boolean,
    public readonly expiresAt: Date | null,
    public readonly createdAt: Date,
  ) {}

  isExpired(): boolean {
    if (!this.expiresAt) return false;
    return this.expiresAt <= new Date();
  }

  isValid(): boolean {
    return this.isActive && !this.isExpired() && this.hasAvailableUses();
  }

  hasAvailableUses(): boolean {
    return this.uses < this.maxUses;
  }

  shouldBeRevoked(): boolean {
    return this.uses >= this.maxUses;
  }

  canBeUsedBy(playerId: string, existingTeamIds: string[]): boolean {
    return this.isValid() && !existingTeamIds.includes(this.teamId);
  }
}
