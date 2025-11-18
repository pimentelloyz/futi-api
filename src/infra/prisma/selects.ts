export const PLAYER_LITE_SELECT = {
  id: true,
  name: true,
  positionSlug: true,
  number: true,
  isActive: true,
} as const;

export type PlayerLiteRow = {
  id: string;
  name: string;
  positionSlug: string | null;
  number: number | null;
  isActive: boolean;
};

export const TEAM_LITE_SELECT = {
  id: true,
  name: true,
  icon: true,
  description: true,
  isActive: true,
} as const;

export type TeamLiteRow = {
  id: string;
  name: string;
  icon: string | null;
  description: string | null;
  isActive: boolean;
};
