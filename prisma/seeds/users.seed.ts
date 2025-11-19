import { PrismaClient } from '@prisma/client';

/**
 * Seed de usuários
 * 
 * Cria ou atualiza o usuário admin principal do sistema
 */

export async function seedUsers(prisma: PrismaClient) {
  console.log('\n[seed-users] ========================================');
  console.log('[seed-users] Iniciando seed de usuários');
  console.log('[seed-users] ========================================\n');

  const SEED_EMAIL = process.env.SEED_EMAIL ?? 'andre.loyz@gmail.com';
  const SEED_DISPLAY_NAME = process.env.SEED_DISPLAY_NAME ?? 'André Pimentel';
  const SEED_FIREBASE_UID = process.env.SEED_FIREBASE_UID ?? 'XUhWGPEJRyeq2TpuZQ9Kr80SlzG2';

  // Ensure user exists
  let user = await prisma.user.findUnique({ where: { email: SEED_EMAIL } });
  if (!user) {
    const byUid = await prisma.user.findUnique({ where: { firebaseUid: SEED_FIREBASE_UID } });
    if (byUid) user = byUid;
  }

  if (!user) {
    user = await prisma.user.create({
      data: { 
        email: SEED_EMAIL, 
        firebaseUid: SEED_FIREBASE_UID, 
        displayName: SEED_DISPLAY_NAME 
      },
    });
    console.log('[seed-users] ✓ Usuário criado:', { id: user.id, email: user.email });
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { 
        email: SEED_EMAIL, 
        displayName: SEED_DISPLAY_NAME, 
        firebaseUid: SEED_FIREBASE_UID 
      },
    });
    console.log('[seed-users] ✓ Usuário atualizado:', { id: user.id, email: user.email });
  }

  // Ensure ADMIN global access
  const existingAdmin = await prisma.accessMembership.findFirst({
    where: { userId: user.id, teamId: null, role: 'ADMIN' },
  });
  
  if (!existingAdmin) {
    await prisma.accessMembership.create({ 
      data: { userId: user.id, teamId: null, role: 'ADMIN' } 
    });
    console.log('[seed-users] ✓ Permissão ADMIN concedida (global)');
  } else {
    console.log('[seed-users] ℹ Permissão ADMIN já existe (global)');
  }

  console.log('\n[seed-users] ========================================');
  console.log('[seed-users] Seed de usuários concluído!');
  console.log('[seed-users] ========================================\n');

  return user;
}
