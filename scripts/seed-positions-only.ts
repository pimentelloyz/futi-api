import { PrismaClient } from '@prisma/client';

const POSITIONS: Array<{ slug: string; name: string; description?: string | null }> = [
  { slug: 'GK', name: 'Goalkeeper' },
  { slug: 'CB', name: 'Centre Back' },
  { slug: 'LCB', name: 'Left Centre Back' },
  { slug: 'RCB', name: 'Right Centre Back' },
  { slug: 'LB', name: 'Left Back' },
  { slug: 'RB', name: 'Right Back' },
  { slug: 'LWB', name: 'Left Wing Back' },
  { slug: 'RWB', name: 'Right Wing Back' },
  { slug: 'CDM', name: 'Central Defensive Midfielder' },
  { slug: 'CM', name: 'Central Midfielder' },
  { slug: 'CAM', name: 'Central Attacking Midfielder' },
  { slug: 'LM', name: 'Left Midfielder' },
  { slug: 'RM', name: 'Right Midfielder' },
  { slug: 'LW', name: 'Left Winger' },
  { slug: 'RW', name: 'Right Winger' },
  { slug: 'CF', name: 'Centre Forward' },
  { slug: 'LF', name: 'Left Forward' },
  { slug: 'RF', name: 'Right Forward' },
  { slug: 'ST', name: 'Striker' },
  { slug: 'SW', name: 'Sweeper' },
];

async function main() {
  const prisma = new PrismaClient();
  try {
    console.log('[seed:positions] Upserting default positions...');
    const db = prisma as unknown as {
      position: {
        upsert: (args: {
          where: { slug: string };
          create: { slug: string; name: string; description?: string | null };
          update: { name?: string; description?: string | null };
          select: { slug: true };
        }) => Promise<{ slug: string }>;
        findMany: (args: { orderBy: { slug: 'asc' } }) => Promise<Array<{ slug: string }>>;
      };
    };

    for (const p of POSITIONS) {
      await db.position.upsert({
        where: { slug: p.slug },
        create: { slug: p.slug, name: p.name, description: p.description ?? null },
        update: { name: p.name, description: p.description ?? null },
        select: { slug: true },
      });
    }

    const all = await db.position.findMany({ orderBy: { slug: 'asc' } });
    console.log(`[seed:positions] Done. Positions count: ${all.length}`);
  } catch (e) {
    console.error('[seed:positions] Error:', (e as Error).message);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
