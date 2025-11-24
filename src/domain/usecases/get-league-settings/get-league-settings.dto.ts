export interface GetLeagueSettingsInput {
  leagueId: string;
  userId: string;
}

export interface GetLeagueSettingsOutput {
  league: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    icon: string | null;
    banner: string | null;
    startAt: Date | null;
    endAt: Date | null;
    isActive: boolean;
    isPublic: boolean;
    hasStarted: boolean;
    canEdit: boolean;
  };
  format: {
    id: string;
    name: string;
    slug: string;
    type: string;
  } | null;
  phases: Array<{
    id: string;
    name: string;
    order: number;
    type: string;
    status: string;
    teamsCount: number | null;
    groupsCount: number | null;
    teamsPerGroup: number | null;
    hasHomeAway: boolean;
    hasExtraTime: boolean;
    hasPenalties: boolean;
    advancingTeams: number | null;
    advancingFrom: string | null;
    tiebreakRules: Array<{
      id: string;
      order: number;
      criterion: string;
      criterionLabel: string;
    }>;
  }>;
  disciplineRule: {
    id: string;
    yellowCardsForSuspension: number;
    yellowCardsAccumulation: boolean;
    resetYellowsAfterPhaseOrder: number | null;
    redCardMinimumGames: number;
    doubleYellowGames: number;
  } | null;
  teams: {
    total: number;
    confirmed: number;
    pending: number;
  };
  matches: {
    total: number;
    scheduled: number;
    inProgress: number;
    finished: number;
  };
}
