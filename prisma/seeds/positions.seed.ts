import { PrismaClient } from '@prisma/client';

/**
 * Seed de posições
 * 
 * Cria ou atualiza todas as posições do futebol
 */

export async function seedPositions(prisma: PrismaClient) {
  console.log('\n[seed-positions] ========================================');
  console.log('[seed-positions] Iniciando seed de posições');
  console.log('[seed-positions] ========================================\n');

  const positions: Array<{ slug: string; name: string; description: string }> = [
    { slug: 'GK', name: 'Goalkeeper', description: 'Goleiro' },
    { slug: 'CB', name: 'Centre Back', description: 'Zagueiro central' },
    { slug: 'LCB', name: 'Left Centre Back', description: 'Zagueiro central esquerdo' },
    { slug: 'RCB', name: 'Right Centre Back', description: 'Zagueiro central direito' },
    { slug: 'LB', name: 'Left Back', description: 'Lateral-esquerdo' },
    { slug: 'RB', name: 'Right Back', description: 'Lateral-direito' },
    { slug: 'LWB', name: 'Left Wing Back', description: 'Ala-esquerdo / lateral-esquerdo ofensivo' },
    { slug: 'RWB', name: 'Right Wing Back', description: 'Ala-direito / lateral-direito ofensivo' },
    { slug: 'SW', name: 'Sweeper', description: 'Líbero (raro atualmente)' },
    { slug: 'CDM', name: 'Central Defensive Midfielder', description: 'Volante / meio-campista defensivo' },
    { slug: 'CM', name: 'Central Midfielder', description: 'Meio-campista central' },
    { slug: 'CAM', name: 'Central Attacking Midfielder', description: 'Meia ofensivo / armador' },
    { slug: 'LM', name: 'Left Midfielder', description: 'Meia-esquerda' },
    { slug: 'RM', name: 'Right Midfielder', description: 'Meia-direita' },
    { slug: 'CF', name: 'Centre Forward', description: 'Segundo atacante / centroavante recuado' },
    { slug: 'ST', name: 'Striker', description: 'Centroavante' },
    { slug: 'LW', name: 'Left Winger', description: 'Ponta-esquerda' },
    { slug: 'RW', name: 'Right Winger', description: 'Ponta-direita' },
    { slug: 'LF', name: 'Left Forward', description: 'Atacante pela esquerda' },
    { slug: 'RF', name: 'Right Forward', description: 'Atacante pela direita' },
  ];

  for (const p of positions) {
    await prisma.$executeRaw`
      INSERT INTO "Position" ("slug","name","description","createdAt","updatedAt")
      VALUES (${p.slug}, ${p.name}, ${p.description}, NOW(), NOW())
      ON CONFLICT ("slug") DO UPDATE SET 
        "name" = EXCLUDED."name", 
        "description" = EXCLUDED."description", 
        "updatedAt" = NOW()
    `;
  }

  console.log(`[seed-positions] ✓ ${positions.length} posições criadas/atualizadas`);

  console.log('\n[seed-positions] ========================================');
  console.log('[seed-positions] Seed de posições concluído!');
  console.log('[seed-positions] ========================================\n');
}

// Execução standalone
if (require.main === module) {
  const prisma = new PrismaClient();
  seedPositions(prisma)
    .then(async () => {
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
