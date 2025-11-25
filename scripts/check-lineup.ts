import { prisma } from '../src/infra/prisma/client.js';

async function main() {
  const matchId = '246fdddd-fc8c-4ba6-ad40-fefd26ca1251';
  
  console.log('🔍 Verificando escalação da partida...\n');
  
  const lineup = await prisma.matchLineupEntry.findMany({
    where: { matchId },
    include: {
      player: {
        select: {
          id: true,
          name: true,
          number: true,
        },
      },
      team: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
  
  console.log(`📋 Total de jogadores escalados: ${lineup.length}`);
  
  if (lineup.length === 0) {
    console.log('\n⚠️  Nenhum jogador escalado para esta partida!');
    console.log('💡 Use o endpoint POST /api/matches/:id/lineup para definir a escalação.');
  } else {
    console.log('\n✅ Escalação encontrada:');
    lineup.forEach((entry) => {
      console.log(`   - ${entry.player.name} (#${entry.player.number}) - ${entry.team.name}`);
    });
  }
  
  await prisma.$disconnect();
}

main();
