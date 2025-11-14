import { prisma } from '../src/infra/prisma/client';

async function main(){
  const leagues = await prisma.league.findMany({ include: { teams: true, groups: true } }).catch((e)=>{ console.error('error', e); process.exit(1)});
  console.log('leagues.count=', leagues.length);
  for(const l of leagues){
    console.log('LEAGUE', l.id, l.slug, 'teams=', (l as any).teams?.length, 'groups=', (l as any).groups?.length);
  }
  await prisma.$disconnect();
}

main();
