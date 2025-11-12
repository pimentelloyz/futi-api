export interface ListTeamsInput {
  isActive?: boolean;
}

export type ListTeamsOutput = Array<{
  id: string;
  name: string;
  icon: string | null;
  description: string | null;
  isActive: boolean;
}>;

export interface ListTeams {
  list(input?: ListTeamsInput): Promise<ListTeamsOutput>;
}
