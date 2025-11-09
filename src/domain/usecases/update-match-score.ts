export interface UpdateMatchScoreInput {
  id: string;
  homeScore: number;
  awayScore: number;
}

export interface UpdateMatchScore {
  updateScore(input: UpdateMatchScoreInput): Promise<{ id: string }>;
}
