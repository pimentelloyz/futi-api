export interface UpdateTiebreakRulesOrderInput {
  leagueId: string;
  phaseId: string;
  userId: string;
  rules: Array<{
    id: string;
    order: number;
  }>;
}

export interface UpdateTiebreakRulesOrderOutput {
  success: boolean;
  message: string;
}
