export type EnsurePlayerForUserInput = {
  userId: string;
  name: string;
  position?: string | null;
  number?: number | null;
  teamIds?: string[];
};

export interface EnsurePlayerForUser {
  ensure(input: EnsurePlayerForUserInput): Promise<{ id: string }>;
}
