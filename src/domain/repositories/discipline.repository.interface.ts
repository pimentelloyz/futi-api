export interface DisciplineCard {
  id: string;
  matchId: string;
  playerId: string;
  teamId: string;
  type: 'YELLOW_CARD' | 'RED_CARD';
  minute?: number;
  createdAt: Date;
  player: {
    id: string;
    name: string;
  };
  team: {
    id: string;
    name: string;
  };
  match: {
    id: string;
    homeTeamId: string;
    awayTeamId: string;
    scheduledFor: Date;
    homeTeam: {
      id: string;
      name: string;
    };
    awayTeam: {
      id: string;
      name: string;
    };
  };
}

export interface PlayerDisciplineHistory {
  playerId: string;
  playerName: string;
  totalYellowCards: number;
  totalRedCards: number;
  cards: DisciplineCard[];
}

export interface IDisciplineRepository {
  listLeagueCards(leagueId: string): Promise<DisciplineCard[]>;
  getPlayerLeagueDiscipline(playerId: string, leagueId: string): Promise<PlayerDisciplineHistory>;
  getPlayerFullDiscipline(playerId: string): Promise<PlayerDisciplineHistory>;
}
