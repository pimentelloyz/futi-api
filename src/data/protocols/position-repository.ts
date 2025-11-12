export type PositionItem = {
  slug: string;
  name: string;
  description: string | null;
};

export interface PositionRepository {
  listAll(): Promise<PositionItem[]>;
  updateBySlug(slug: string, data: { name?: string; description?: string }): Promise<PositionItem>;
  deleteBySlug(slug: string): Promise<void>;
}
