export interface GetPendingEvaluationsInput {
  userId: string;
}

export interface PendingEvaluationItem {
  id: string;
  matchId: string;
  targetPlayerId: string;
  targetName: string;
}

export interface GetPendingEvaluationsOutput {
  items: PendingEvaluationItem[];
}
