import { PrismaClient } from '@prisma/client';

/**
 * Script para pré-alimentar apenas o essencial para criar uma pelada
 * 
 * Popula:
 * 1. Position - Posições dos jogadores (GK, CB, ST, etc.)
 * 2. LeagueFormat - Formato "Rachão / Pelada" 
 * 
 * Após executar este script, o fluxo completo é:
 * 1. Usuários fazem login via Firebase (cria User automaticamente)
 * 2. Usuários criam perfil de jogador: POST /api/players/me
 * 3. Manager cria time: POST /api/teams
 * 4. Manager cria liga: POST /api/leagues (escolhe formato "rachao-pelada")
 * 5. Times entram na liga: POST /api/leagues/:id/teams
 * 6. Criar partidas recorrentes: POST /api/matches/recurring
 */

const prisma = new PrismaClient();

/**
 * Seed de posições dos jogadores
 */
async function seedPositions() {
  console.log('\n[seed-positions] ========================================');
  console.log('[seed-positions] Iniciando seed de posições');
  console.log('[seed-positions] ========================================\n');

  const positions: Array<{ slug: string; name: string; description: string }> = [
    { slug: 'GK', name: 'Goalkeeper', description: 'Goleiro' },
    { slug: 'CB', name: 'Centre Back', description: 'Zagueiro central' },
    { slug: 'LB', name: 'Left Back', description: 'Lateral-esquerdo' },
    { slug: 'RB', name: 'Right Back', description: 'Lateral-direito' },
    { slug: 'CDM', name: 'Central Defensive Midfielder', description: 'Volante / meio-campista defensivo' },
    { slug: 'CM', name: 'Central Midfielder', description: 'Meio-campista central' },
    { slug: 'CAM', name: 'Central Attacking Midfielder', description: 'Meia ofensivo / armador' },
    { slug: 'LM', name: 'Left Midfielder', description: 'Meia-esquerda' },
    { slug: 'RM', name: 'Right Midfielder', description: 'Meia-direita' },
    { slug: 'LW', name: 'Left Winger', description: 'Ponta-esquerda' },
    { slug: 'RW', name: 'Right Winger', description: 'Ponta-direita' },
    { slug: 'ST', name: 'Striker', description: 'Centroavante' },
    { slug: 'CF', name: 'Centre Forward', description: 'Segundo atacante / centroavante recuado' },
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
  console.log('[seed-positions] Seed de posições concluído!\n');
}

/**
 * Seed do formato "Rachão / Pelada"
 */
async function seedPeladaFormat() {
  console.log('[seed-formats] ========================================');
  console.log('[seed-formats] Criando formato: Rachão / Pelada');
  console.log('[seed-formats] ========================================\n');

  const rachao = await prisma.leagueFormat.upsert({
    where: { slug: 'rachao-pelada' },
    create: {
      name: 'Rachão / Pelada',
      slug: 'rachao-pelada',
      description: 'Formato flexível: pontos corridos simples ou com fase final (configurável)',
      type: 'CUSTOM',
      isTemplate: true,
      phases: {
        create: [
          {
            name: 'Fase de Classificação',
            order: 1,
            type: 'LEAGUE',
            teamsCount: null,
            hasHomeAway: false,
            hasExtraTime: false,
            hasPenalties: false,
            hasAwayGoal: false,
            advancingTeams: 4,
            advancingFrom: 'TOP_4',
            tiebreakRules: {
              create: [
                { order: 1, criterion: 'POINTS' },
                { order: 2, criterion: 'HEAD_TO_HEAD_POINTS' },
                { order: 3, criterion: 'GOAL_DIFFERENCE' },
                { order: 4, criterion: 'GOALS_FOR' },
                { order: 5, criterion: 'DRAW' },
              ],
            },
          },
          {
            name: 'Semifinal (Opcional)',
            order: 2,
            type: 'KNOCKOUT',
            teamsCount: 4,
            hasHomeAway: false,
            hasExtraTime: false,
            hasPenalties: true,
            hasAwayGoal: false,
            advancingTeams: 2,
            advancingFrom: 'WINNERS',
          },
          {
            name: 'Final (Opcional)',
            order: 3,
            type: 'KNOCKOUT',
            teamsCount: 2,
            hasHomeAway: false,
            hasExtraTime: false,
            hasPenalties: true,
            hasAwayGoal: false,
            advancingTeams: 1,
            advancingFrom: 'WINNER',
          },
        ],
      },
    },
    update: {},
  });

  console.log(`[seed-formats] ✓ Formato criado: ${rachao.name} (${rachao.slug})`);
  console.log('[seed-formats] Seed de formato concluído!\n');
}

async function main() {
  console.log('\n🏃 ========================================');
  console.log('🏃 SEED ESSENCIAL PARA PELADA');
  console.log('🏃 ========================================\n');
  
  const startTime = Date.now();

  try {
    // 1. Posições dos jogadores
    console.log('📍 [1/2] Alimentando tabela Position...');
    await seedPositions();
    
    // 2. Formato Rachão/Pelada
    console.log('\n🏆 [2/2] Alimentando tabela LeagueFormat...');
    await seedPeladaFormat();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('\n✅ ========================================');
    console.log('✅ SEED CONCLUÍDO COM SUCESSO!');
    console.log(`✅ Tempo total: ${duration}s`);
    console.log('✅ ========================================\n');
    
    console.log('📋 PRÓXIMOS PASSOS (via API):');
    console.log('   1. 👤 Login Firebase → POST /api/auth/firebase/exchange');
    console.log('   2. 🏃 Criar perfil jogador → POST /api/players/me');
    console.log('   3. 👥 Manager cria time → POST /api/teams');
    console.log('   4. 🏆 Manager cria liga → POST /api/leagues');
    console.log('      - Escolher formatId do "rachao-pelada"');
    console.log('   5. 🤝 Adicionar times à liga → POST /api/leagues/:id/teams');
    console.log('   6. ⚽ Criar partidas recorrentes → POST /api/matches/recurring');
    console.log('      - Exemplo: toda segunda às 19h por 10 semanas\n');
    
    console.log('💡 DICA: Para ver os formatos disponíveis:');
    console.log('   SELECT id, name, slug FROM "LeagueFormat" WHERE slug = \'rachao-pelada\';\n');
    
  } catch (error) {
    console.error('\n❌ Erro durante o seed:', error);
    throw error;
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('👋 Conexão com banco encerrada.\n');
  })
  .catch(async (e) => {
    console.error('❌ Erro fatal:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
