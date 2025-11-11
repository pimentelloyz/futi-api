import { prisma } from '../src/infra/prisma/client.js';

async function main() {
  const email = 'andre.loyz@gmail.com';
  const firebaseUid = `seed:${email}`;
  const displayName = 'Andre Loyz';

  // Ensure user exists
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: { email, firebaseUid, displayName },
    });
    console.log('[seed] created user:', { id: user.id, email: user.email });
  } else {
    console.log('[seed] user exists:', { id: user.id, email: user.email });
  }

  // Ensure ADMIN global access (teamId = null)
  const existingAdmin = await prisma.accessMembership.findFirst({
    where: { userId: user.id, teamId: null, role: 'ADMIN' },
  });
  if (!existingAdmin) {
    await prisma.accessMembership.create({ data: { userId: user.id, teamId: null, role: 'ADMIN' } });
    console.log('[seed] granted ADMIN (global)');
  } else {
    console.log('[seed] ADMIN already granted (global)');
  }
}

main()
  .catch((e) => {
    console.error('[seed-error]', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
