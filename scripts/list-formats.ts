import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const formats = await prisma.leagueFormat.findMany({
    select: { 
      slug: true, 
      name: true, 
      isTemplate: true 
    }
  });
  
  console.log('\n📋 Formatos existentes no banco:');
  console.log(`Total: ${formats.length}\n`);
  
  formats.forEach((f, i) => {
    console.log(`${i + 1}. ${f.name} (${f.slug}) - Template: ${f.isTemplate}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
