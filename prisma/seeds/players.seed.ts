import { PrismaClient } from '@prisma/client';

/**
 * Seed de jogadores
 * 
 * Cria jogadores específicos para o time padrão (Renan, Bruno, Laércio, Matheus e André Pimentel)
 */

export async function seedPlayers(
  prisma: PrismaClient, 
  adminUserId: string, 
  teamId: string
) {
  console.log('\n[seed-players] ========================================');
  console.log('[seed-players] Iniciando seed de jogadores');
  console.log('[seed-players] ========================================\n');

  // Helper para criar/atualizar jogador
  async function upsertPlayer(opts: { name: string; userId?: string }) {
    const existing = await prisma.player.findFirst({ where: { name: opts.name } });
    let player = existing;
    
    if (!existing) {
      player = await prisma.player.create({
        data: { 
          name: opts.name, 
          isActive: true,
          ...(opts.userId && { userId: opts.userId })
        },
      });
      
      try {
        await prisma.playersOnTeams.create({ 
          data: { playerId: player.id, teamId } 
        });
      } catch {
        // Já vinculado
      }
      
      console.log('[seed-players]   ✓ Jogador criado:', opts.name);
    } else {
      const existingLink = await prisma.playersOnTeams.findUnique({
        where: { playerId_teamId: { playerId: existing.id, teamId } },
      });
      
      if (!existingLink) {
        await prisma.playersOnTeams.create({ 
          data: { playerId: existing.id, teamId } 
        });
      }
      
      console.log('[seed-players]   ℹ Jogador já existe:', opts.name);
    }
    
    return player!;
  }

  // Helper para criar/atualizar habilidades de jogador de linha
  async function upsertLinePlayerSkill(
    playerId: string, 
    skill: {
      pace: number;
      shooting: number;
      passing: number;
      dribbling: number;
      defense: number;
      physical: number;
    }
  ) {
    const existing = await prisma.playerSkill.findUnique({ where: { playerId } });
    
    const data = {
      playerId,
      preferredFoot: 'RIGHT' as const,
      pace: skill.pace,
      shooting: skill.shooting,
      passing: skill.passing,
      dribbling: skill.dribbling,
      defense: skill.defense,
      physical: skill.physical,
      ballControl: Math.round((skill.dribbling + skill.passing) / 2),
      attack: Math.round((skill.shooting + skill.dribbling + skill.pace) / 3),
    };
    
    if (!existing) {
      await prisma.playerSkill.create({ data });
      console.log('[seed-players]   ✓ Habilidades criadas para jogador:', playerId);
    } else {
      await prisma.playerSkill.update({
        where: { id: existing.id },
        data,
      });
      console.log('[seed-players]   ✓ Habilidades atualizadas para jogador:', playerId);
    }
  }

  // Criar jogador para o usuário admin (André Pimentel)
  let adminPlayer = await prisma.player.findUnique({ where: { userId: adminUserId } });
  
  if (!adminPlayer) {
    const user = await prisma.user.findUnique({ where: { id: adminUserId } });
    const playerName = user?.displayName || user?.email?.split('@')[0] || 'Seed Player';
    
    adminPlayer = await prisma.player.create({
      data: { 
        name: playerName, 
        isActive: true, 
        userId: adminUserId 
      },
    });
    
    try {
      await prisma.playersOnTeams.create({ 
        data: { playerId: adminPlayer.id, teamId } 
      });
    } catch {
      // Já vinculado
    }
    
    console.log('[seed-players] ✓ Jogador criado para usuário admin:', playerName);
  } else {
    const existingLink = await prisma.playersOnTeams.findUnique({
      where: { playerId_teamId: { playerId: adminPlayer.id, teamId } },
    });
    
    if (!existingLink) {
      await prisma.playersOnTeams.create({ 
        data: { playerId: adminPlayer.id, teamId } 
      });
    }
    
    console.log('[seed-players] ℹ Jogador já existe para usuário admin');
  }

  // Habilidades do André Pimentel
  if (adminPlayer) {
    await upsertLinePlayerSkill(adminPlayer.id, {
      pace: 76,
      shooting: 78,
      passing: 80,
      dribbling: 79,
      defense: 74,
      physical: 75,
    });
  }

  // Jogadores de linha específicos
  const renan = await upsertPlayer({ name: 'Renan Martins Moreira' });
  await upsertLinePlayerSkill(renan.id, {
    pace: 78,
    shooting: 81,
    passing: 83,
    dribbling: 86,
    defense: 70,
    physical: 74,
  });

  const bruno = await upsertPlayer({ name: 'Bruno Rholing Moreira' });
  await upsertLinePlayerSkill(bruno.id, {
    pace: 75,
    shooting: 83,
    passing: 83,
    dribbling: 78,
    defense: 85,
    physical: 73,
  });

  const laercio = await upsertPlayer({ name: 'Laercio' });
  await upsertLinePlayerSkill(laercio.id, {
    pace: 70,
    shooting: 78,
    passing: 80,
    dribbling: 77,
    defense: 85,
    physical: 78,
  });

  // Goleiro (sem habilidades específicas, só a posição)
  const matheus = await upsertPlayer({ name: 'Matheus Amaral' });

  console.log('\n[seed-players] ========================================');
  console.log('[seed-players] Seed de jogadores concluído!');
  console.log('[seed-players] Total: 5 jogadores (4 de linha + 1 goleiro)');
  console.log('[seed-players] ========================================\n');

  return { adminPlayer, renan, bruno, laercio, matheus };
}
