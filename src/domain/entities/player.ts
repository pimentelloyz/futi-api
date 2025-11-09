export interface Player {
  id: string;
  name: string;
  position?: string | null;
  number?: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
