/**
 * Seed Orquestrador Principal
 * 
 * Este arquivo coordena a execução de todos os seeds na ordem correta,
 * respeitando as dependências entre as tabelas.
 * 
 * Ordem de execução:
 * 1. users - Base de usuários (sem dependências)
 * 2. positions - Posições dos jogadores (sem dependências)
 * 3. teams - Times (sem dependências)
 * 4. players - Jogadores (depende de positions e teams)
 * 5. evaluation-forms - Formulários de avaliação (sem dependências específicas)
 * 6. league-formats - Formatos de liga (sem dependências)
 * 7. large-leagues - Ligas grandes com times e jogadores (depende de teams e players)
 * 8. matches - Partidas (depende de teams e leagues)
 */

import { PrismaClient } from '@prisma/client';
import { seedUsers } from './seeds/users.seed.js';
import { seedPositions } from './seeds/positions.seed.js';
import { seedTeams } from './seeds/teams.seed.js';
import { seedPlayers } from './seeds/players.seed.js';
import { seedEvaluationForms } from './seeds/evaluation-forms.seed.js';
import { seedLeagueFormats } from './seeds/league-formats.seed.js';
import { seedLargeLeagues } from './seeds/large-leagues.seed.js';
import { seedMatches } from './seeds/matches.seed.js';

// Configuração do Prisma Client
// Prefer DIRECT_URL (5432) para evitar problemas de PgBouncer (porta 6543) em seeds pesados.
let datasourceUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!datasourceUrl) {
  console.warn('[seed] Nenhuma DIRECT_URL ou DATABASE_URL definida. Verifique o .env antes de continuar.');
} else if (/:6543\b/.test(datasourceUrl)) {
  const directCandidate = datasourceUrl.replace(':6543', ':5432');
  console.log('[seed] Detectado URL pooled (PgBouncer 6543). Usando fallback direto 5432:', directCandidate);
  datasourceUrl = directCandidate;
}

const prisma = new PrismaClient({ datasourceUrl });
console.log('[seed] usando datasourceUrl=', datasourceUrl?.replace(/:[^:@/]*@/,'://***:***@'));

/**
 * Função principal que executa todos os seeds na ordem correta
 */
async function main() {
  console.log('\n🌱 ============================================');
  console.log('🌱 Iniciando processo de seed completo');
  console.log('🌱 ============================================\n');

  const startTime = Date.now();

  try {
    // 1. Users - Base de usuários
    const user = await seedUsers(prisma);

    // 2. Positions - Posições dos jogadores
    await seedPositions(prisma);

    // 3. Teams - Times
    const { team, opponentTeam } = await seedTeams(prisma, user.id);

    // 4. Players - Jogadores (depende de positions e teams)
    await seedPlayers(prisma, user.id, team.id);

    // 5. Evaluation Forms - Formulários de avaliação
    await seedEvaluationForms(prisma);

    // 6. League Formats - Formatos de liga
    await seedLeagueFormats(prisma);

    // 7. Large Leagues - Ligas grandes com times e jogadores
    await seedLargeLeagues(prisma);

    // 8. Matches - Partidas (depende de teams e leagues)
    await seedMatches(prisma, team.id, opponentTeam.id);

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('\n✅ ============================================');
    console.log(`✅ Seed completo executado com sucesso!`);
    console.log(`✅ Tempo total: ${duration}s`);
    console.log('✅ ============================================\n');
  } catch (error) {
    console.error('\n❌ ============================================');
    console.error('❌ Erro durante o processo de seed:');
    console.error('❌ ============================================\n');
    console.error(error);
    throw error;
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
