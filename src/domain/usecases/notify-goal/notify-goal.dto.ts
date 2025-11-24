export interface NotifyGoalInput {
  matchId: string;
  teamId: string;
  playerName: string;
  minute: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
}

export interface NotifyGoalOutput {
  success: boolean;
  notificationsSent: number;
}
