import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Removendo formatos existentes...\n');
  
  const deleted = await prisma.leagueFormat.deleteMany({});
  
  console.log(`✓ ${deleted.count} formato(s) removido(s)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
