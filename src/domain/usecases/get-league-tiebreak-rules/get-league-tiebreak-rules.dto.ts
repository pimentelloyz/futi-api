export interface GetLeagueTiebreakRulesInput {
  leagueId: string;
  phaseId?: string;
  userId: string;
}

export interface GetLeagueTiebreakRulesOutput {
  rules: Array<{
    id: string;
    order: number;
    criterion: string;
    criterionLabel: string;
  }>;
  availableCriteria: Array<{
    value: string;
    label: string;
  }>;
}
