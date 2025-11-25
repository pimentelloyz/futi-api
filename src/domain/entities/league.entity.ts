export type MatchFormat = 'FUTSAL' | 'FUT7' | 'FUT11';

export class League {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly slug: string,
    public readonly description: string | null,
    public readonly icon: string | null,
    public readonly banner: string | null,
    public readonly startAt: Date | null,
    public readonly endAt: Date | null,
    public readonly isActive: boolean,
    public readonly isPublic: boolean,
    public readonly matchFormat: MatchFormat,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  isOngoing(): boolean {
    const now = new Date();
    if (this.startAt && this.startAt > now) return false;
    if (this.endAt && this.endAt < now) return false;
    return true;
  }

  canBeModified(): boolean {
    return this.isActive;
  }
}
