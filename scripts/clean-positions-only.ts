import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    console.log('[db:clean] Truncating all tables except Position...');
    // Ordem não importa com CASCADE, mas deixo listadas explicitamente
    const tables = [
      '"UserPushToken"',
      '"RefreshToken"',
      '"PlayerSkill"',
      '"MatchLineupEntry"',
      '"MatchEvent"',
      '"PlayerEvaluation"',
      '"MatchPlayerEvaluationAssignment"',
      '"Match"',
      '"AccessMembership"',
      '"Team"',
      '"Player"',
      '"User"'
    ];
    const sql = `TRUNCATE TABLE ${tables.join(', ')} RESTART IDENTITY CASCADE;`;
    await prisma.$executeRawUnsafe(sql);

    const db = prisma as unknown as {
      position: { findMany: (args: { orderBy: { slug: 'asc' } }) => Promise<Array<{ slug: string; name: string }>> };
    };
    const positions: Array<{ slug: string; name: string }> = await db.position.findMany({ orderBy: { slug: 'asc' } });
    console.log(`[db:clean] Done. Remaining positions: ${positions.length}`);
    positions.forEach((p: { slug: string; name: string }) => console.log(` - ${p.slug} :: ${p.name}`));
  } catch (e) {
    console.error('[db:clean] Error:', (e as Error).message);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
