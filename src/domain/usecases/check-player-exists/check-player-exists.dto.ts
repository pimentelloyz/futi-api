export interface CheckPlayerExistsInput {
  userId: string;
}

export interface CheckPlayerExistsOutput {
  exists: boolean;
  playerId?: string;
}
