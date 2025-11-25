import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Configurando MATCH_MANAGER...\n');

  const userId = 'cd0d23bd-fe57-48c6-b0c8-c0cf64edbe6d';

  // 1. Verificar se usuário existe
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, displayName: true }
  });

  if (!user) {
    console.error('❌ Usuário não encontrado!');
    return;
  }

  console.log('👤 Usuário encontrado:');
  console.log(`   Email: ${user.email}`);
  console.log(`   Nome: ${user.displayName}\n`);

  // 2. Buscar uma partida para atualizar
  const matches = await prisma.match.findMany({
    where: {
      status: { in: ['SCHEDULED', 'IN_PROGRESS'] }
    },
    include: {
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
      league: { select: { name: true } }
    },
    orderBy: { scheduledAt: 'desc' },
    take: 1
  });

  if (matches.length === 0) {
    console.error('❌ Nenhuma partida encontrada!');
    return;
  }

  const match = matches[0];
  console.log('🏟️  Partida selecionada:');
  console.log(`   ${match.homeTeam.name} x ${match.awayTeam.name}`);
  console.log(`   Liga: ${match.league?.name || 'N/A'}\n`);

  // 3. Criar AccessMembership com role MATCH_MANAGER para essa partida
  const existingAccess = await prisma.accessMembership.findFirst({
    where: {
      userId,
      matchId: match.id,
      role: 'MATCH_MANAGER'
    }
  });

  if (!existingAccess) {
    await prisma.accessMembership.create({
      data: {
        userId,
        matchId: match.id,
        role: 'MATCH_MANAGER'
      }
    });
    console.log('✅ Role MATCH_MANAGER adicionada para a partida\n');
  } else {
    console.log('ℹ️  Usuário já tem acesso MATCH_MANAGER nessa partida\n');
  }

  // 4. Atualizar horário da partida para estar acontecendo agora
  const now = new Date();
  
  const updatedMatch = await prisma.match.update({
    where: { id: match.id },
    data: {
      scheduledAt: now,
      status: 'IN_PROGRESS'
    }
  });

  console.log(`✅ Partida atualizada:`);
  console.log(`   ID: ${updatedMatch.id}`);
  console.log(`   Status: ${updatedMatch.status}`);
  console.log(`   Horário: ${updatedMatch.scheduledAt.toLocaleString('pt-BR')}`);
  console.log(`\n🎮 Pronto! Você pode agora registrar eventos nessa partida até 14:00!`);
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
