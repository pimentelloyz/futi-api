export interface Team {
  id: string;
  name: string;
  icon?: string | null;
  description?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
