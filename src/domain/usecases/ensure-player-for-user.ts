export type EnsurePlayerForUserInput = {
  userId: string;
  name: string;
  positionSlug?: string | null;
  number?: number | null;
  teamIds?: string[];
  photo?: string | null;
};

export interface EnsurePlayerForUser {
  ensure(input: EnsurePlayerForUserInput): Promise<{ id: string }>;
}
