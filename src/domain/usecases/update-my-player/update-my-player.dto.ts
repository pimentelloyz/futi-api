export interface UpdateMyPlayerInput {
  userId: string;
  name?: string;
  positionSlug?: string | null;
  number?: number | null;
}

export interface UpdateMyPlayerOutput {
  id: string;
  name: string;
  photo: string | null;
  positionSlug: string | null;
  number: number | null;
  isActive: boolean;
  position: {
    slug: string;
    name: string;
    description: string | null;
  } | null;
}
