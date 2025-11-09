export type AddTeamInput = {
  name: string;
  icon?: string | null;
  description?: string | null;
  isActive?: boolean;
};

export interface AddTeam {
  add(input: AddTeamInput): Promise<{ id: string }>;
}
