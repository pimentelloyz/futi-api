import { prisma } from '../src/infra/prisma/client.ts';

async function main() {
  const count = await prisma.user.count();
  const first = await prisma.user.findMany({ take: 5, select: { id: true, email: true } });
  console.log(JSON.stringify({ userCount: count, sample: first }, null, 2));
}

main()
  .catch((e) => {
    console.error('[count-users-error]', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
