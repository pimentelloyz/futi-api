import { PrismaClient } from '@prisma/client';

/**
 * Seed de formulários de avaliação
 * 
 * Cria os formulários de avaliação para diferentes posições (Atacante, Meio Campo, Defesa, Goleiro)
 */

export async function seedEvaluationForms(prisma: PrismaClient, goalkeeperPlayerId?: string) {
  console.log('\n[seed-evaluation-forms] ========================================');
  console.log('[seed-evaluation-forms] Iniciando seed de formulários de avaliação');
  console.log('[seed-evaluation-forms] ========================================\n');

  async function upsertForm(
    params: {
      name: string;
      positionType: 'LINE' | 'GOALKEEPER';
      isActive: boolean;
      version?: number;
    },
    criteria: Array<{ key: string; name: string; weight: number; min?: number; max?: number }>,
  ) {
    const version = params.version ?? 1;
    
    let form = await prisma.evaluationForm.findFirst({
      where: { 
        name: params.name, 
        positionType: params.positionType, 
        version 
      },
    });
    
    if (!form) {
      form = await prisma.evaluationForm.create({
        data: {
          name: params.name,
          positionType: params.positionType,
          version,
          isActive: params.isActive,
        },
      });
      console.log('[seed-evaluation-forms]   ✓ Formulário criado:', form.name);
    } else if (form.isActive !== params.isActive) {
      form = await prisma.evaluationForm.update({
        where: { id: form.id },
        data: { isActive: params.isActive },
      });
      console.log('[seed-evaluation-forms]   ✓ Formulário atualizado:', form.name);
    } else {
      console.log('[seed-evaluation-forms]   ℹ Formulário já existe:', form.name);
    }

    // Substituir critérios para manter sincronizado
    await prisma.evaluationCriteria.deleteMany({ where: { formId: form.id } });
    await prisma.evaluationCriteria.createMany({
      data: criteria.map((c) => ({
        formId: form.id,
        key: c.key,
        name: c.name,
        weight: c.weight,
        minValue: c.min ?? 0,
        maxValue: c.max ?? 100,
      })),
    });
    
    console.log(`[seed-evaluation-forms]   ✓ ${criteria.length} critérios criados para ${form.name}`);
    return form;
  }

  // ATACANTE (ativo)
  await upsertForm(
    { name: 'Linha - Atacante', positionType: 'LINE', isActive: true },
    [
      { key: 'PAC', name: 'Ritmo (PAC)', weight: 0.25 },
      { key: 'SHO', name: 'Finalização (SHO)', weight: 0.4 },
      { key: 'PAS', name: 'Passe (PAS)', weight: 0.15 },
      { key: 'DRI', name: 'Drible (DRI)', weight: 0.2 },
      { key: 'DEF', name: 'Defesa (DEF)', weight: 0.0 },
      { key: 'PHY', name: 'Físico (PHY)', weight: 0.1 },
      { key: 'DIS', name: 'Disciplina (DIS)', weight: 0.1 },
    ],
  );

  // MEIO CAMPO (inativo)
  await upsertForm(
    { name: 'Linha - Meio campo', positionType: 'LINE', isActive: false },
    [
      { key: 'PAC', name: 'Ritmo (PAC)', weight: 0.2 },
      { key: 'SHO', name: 'Finalização (SHO)', weight: 0.25 },
      { key: 'PAS', name: 'Passe (PAS)', weight: 0.3 },
      { key: 'DRI', name: 'Drible (DRI)', weight: 0.1 },
      { key: 'DEF', name: 'Defesa (DEF)', weight: 0.15 },
      { key: 'PHY', name: 'Físico (PHY)', weight: 0.0 },
      { key: 'DIS', name: 'Disciplina (DIS)', weight: 0.1 },
    ],
  );

  // DEFESA (inativo)
  await upsertForm(
    { name: 'Linha - Defesa', positionType: 'LINE', isActive: false },
    [
      { key: 'PAC', name: 'Ritmo (PAC)', weight: 0.1 },
      { key: 'SHO', name: 'Finalização (SHO)', weight: 0.05 },
      { key: 'PAS', name: 'Passe (PAS)', weight: 0.15 },
      { key: 'DRI', name: 'Drible (DRI)', weight: 0.0 },
      { key: 'DEF', name: 'Defesa (DEF)', weight: 0.4 },
      { key: 'PHY', name: 'Físico (PHY)', weight: 0.3 },
      { key: 'DIS', name: 'Disciplina (DIS)', weight: 0.1 },
    ],
  );

  // GOLEIRO (ativo)
  const formGoleiro = await upsertForm(
    { name: 'Goleiro', positionType: 'GOALKEEPER', isActive: true },
    [
      { key: 'REF', name: 'Reflexo (REF)', weight: 0.25 },
      { key: 'COL', name: 'Colocação (COL)', weight: 0.1 },
      { key: 'MAO', name: 'Mãos (MAO)', weight: 0.3 },
      { key: 'MER', name: 'Mergulho (MER)', weight: 0.15 },
      { key: 'JCP', name: 'Jogo com os pés (JCP)', weight: 0.2 },
      { key: 'PHY', name: 'Físico (PHY)', weight: 0.0 },
      { key: 'DIS', name: 'Disciplina (DIS)', weight: 0.1 },
    ],
  );

  // Agregado inicial para o goleiro (Overall 81)
  if (goalkeeperPlayerId && formGoleiro) {
    await prisma.playerEvaluationAggregate.upsert({
      where: { 
        playerId_formId: { 
          playerId: goalkeeperPlayerId, 
          formId: formGoleiro.id 
        } 
      },
      create: { 
        playerId: goalkeeperPlayerId, 
        formId: formGoleiro.id, 
        count: 1, 
        weightedSum: 81, 
        average: 81 
      },
      update: { 
        count: { increment: 0 }, 
        weightedSum: { increment: 0 }, 
        average: 81 
      },
      select: { playerId: true },
    });
    console.log('[seed-evaluation-forms] ✓ Agregado inicial criado para goleiro (Overall 81)');
  }

  console.log('\n[seed-evaluation-forms] ========================================');
  console.log('[seed-evaluation-forms] Seed de formulários concluído!');
  console.log('[seed-evaluation-forms] Total: 4 formulários (Atacante, Meio Campo, Defesa, Goleiro)');
  console.log('[seed-evaluation-forms] ========================================\n');
}

// Execução standalone
if (require.main === module) {
  const prisma = new PrismaClient();
  seedEvaluationForms(prisma)
    .then(async () => {
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
