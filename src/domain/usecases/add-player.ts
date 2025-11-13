export type AddPlayerInput = {
  name: string;
  positionSlug?: string | null;
  number?: number | null;
  isActive?: boolean;
  teamIds?: string[]; // optional list of teams to link
  photo?: string | null; // profile photo URL (optional)
};

export interface AddPlayer {
  add(input: AddPlayerInput): Promise<{ id: string }>;
}
