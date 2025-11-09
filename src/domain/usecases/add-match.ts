export type AddMatchInput = {
  homeTeamId: string;
  awayTeamId: string;
  scheduledAt: Date;
  status?: 'SCHEDULED' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELED';
  homeScore?: number;
  awayScore?: number;
};

export interface AddMatch {
  add(input: AddMatchInput): Promise<{ id: string }>; // return created id only for now
}
