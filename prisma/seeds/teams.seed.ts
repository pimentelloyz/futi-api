import { PrismaClient } from '@prisma/client';

/**
 * Seed de times
 * 
 * Cria ou atualiza o time padrão do seed
 */

export async function seedTeams(prisma: PrismaClient, adminUserId: string) {
  console.log('\n[seed-teams] ========================================');
  console.log('[seed-teams] Iniciando seed de times');
  console.log('[seed-teams] ========================================\n');

  const SEED_TEAM_NAME = process.env.SEED_TEAM_NAME ?? 'Futi FC';
  const SEED_TEAM_ICON = process.env.SEED_TEAM_ICON || undefined;
  const SEED_TEAM_DESCRIPTION = process.env.SEED_TEAM_DESCRIPTION || undefined;

  // Ensure default team exists
  let team = await prisma.team.findFirst({ where: { name: SEED_TEAM_NAME } });
  
  if (!team) {
    team = await prisma.team.create({
      data: { 
        name: SEED_TEAM_NAME, 
        icon: SEED_TEAM_ICON, 
        description: SEED_TEAM_DESCRIPTION 
      },
    });
    console.log('[seed-teams] ✓ Time criado:', { id: team.id, name: team.name });
  } else {
    team = await prisma.team.update({
      where: { id: team.id },
      data: { 
        icon: SEED_TEAM_ICON, 
        description: SEED_TEAM_DESCRIPTION 
      },
    });
    console.log('[seed-teams] ✓ Time atualizado:', { id: team.id, name: team.name });
  }

  // Ensure opponent team
  let opponentTeam = await prisma.team.findFirst({ where: { name: 'Adversário FC' } });
  if (!opponentTeam) {
    opponentTeam = await prisma.team.create({
      data: { name: 'Adversário FC' },
    });
    console.log('[seed-teams] ✓ Time adversário criado:', { id: opponentTeam.id });
  }

  // Ensure MANAGER access for admin user on default team
  const existingTeamAccess = await prisma.accessMembership.findFirst({
    where: { userId: adminUserId, teamId: team.id },
  });
  
  if (!existingTeamAccess) {
    await prisma.accessMembership.create({
      data: { userId: adminUserId, teamId: team.id, role: 'MANAGER' },
    });
    console.log('[seed-teams] ✓ Permissão MANAGER concedida para o time');
  } else if (existingTeamAccess.role !== 'MANAGER') {
    await prisma.accessMembership.update({
      where: { id: existingTeamAccess.id },
      data: { role: 'MANAGER' },
    });
    console.log('[seed-teams] ✓ Permissão atualizada para MANAGER');
  } else {
    console.log('[seed-teams] ℹ Permissão MANAGER já existe');
  }

  console.log('\n[seed-teams] ========================================');
  console.log('[seed-teams] Seed de times concluído!');
  console.log(`[seed-teams] Times criados: ${team.name}, ${opponentTeam.name}`);
  console.log('[seed-teams] ========================================\n');

  return { team, opponentTeam };
}
