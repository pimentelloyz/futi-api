import { prisma } from '../prisma/client.js';
import { PositionRepository, PositionItem } from '../../data/protocols/position-repository.js';

type PositionSelect = { slug: boolean; name: boolean; description: boolean };
type PositionOrderBy = { name?: 'asc' | 'desc' };
type PositionWhereUnique = { slug: string };
type PositionUpdateData = { name?: string; description?: string };

type PrismaClientWithPosition = typeof prisma & {
  position: {
    findMany: (args: {
      orderBy?: PositionOrderBy[] | PositionOrderBy;
      select?: PositionSelect;
    }) => Promise<PositionItem[]>;
    update: (args: {
      where: PositionWhereUnique;
      data: PositionUpdateData;
      select: PositionSelect;
    }) => Promise<PositionItem>;
    delete: (args: { where: PositionWhereUnique }) => Promise<void>;
  };
};

export class PrismaPositionRepository implements PositionRepository {
  async listAll(): Promise<PositionItem[]> {
    const db = prisma as PrismaClientWithPosition;
    const items = await db.position.findMany({
      orderBy: [{ name: 'asc' }],
      select: { slug: true, name: true, description: true },
    });
    return items as PositionItem[];
  }

  async updateBySlug(
    slug: string,
    data: { name?: string; description?: string },
  ): Promise<PositionItem> {
    const db = prisma as PrismaClientWithPosition;
    const updated = await db.position.update({
      where: { slug },
      data,
      select: { slug: true, name: true, description: true },
    });
    return updated as PositionItem;
  }

  async deleteBySlug(slug: string): Promise<void> {
    const db = prisma as PrismaClientWithPosition;
    await db.position.delete({ where: { slug } });
  }
}
