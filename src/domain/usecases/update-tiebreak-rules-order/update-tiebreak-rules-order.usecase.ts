import { PrismaClient } from '@prisma/client';
import { UpdateTiebreakRulesOrderInput, UpdateTiebreakRulesOrderOutput } from './update-tiebreak-rules-order.dto.js';

export class UpdateTiebreakRulesOrderUseCase {
  constructor(private readonly prisma: PrismaClient) {}

  async execute(input: UpdateTiebreakRulesOrderInput): Promise<UpdateTiebreakRulesOrderOutput> {
    // Verificar se liga existe
    const league = await this.prisma.league.findUnique({
      where: { id: input.leagueId },
      select: { 
        id: true, 
        startAt: true,
        isActive: true 
      },
    });

    if (!league) {
      throw new Error('league_not_found');
    }

    // Verificar se pode editar (liga não começou)
    const hasStarted = league.startAt ? new Date(league.startAt) <= new Date() : false;
    if (hasStarted) {
      throw new Error('league_already_started');
    }

    // Verificar permissão (LEAGUE_MANAGER ou ADMIN)
    const membership = await this.prisma.accessMembership.findFirst({
      where: {
        userId: input.userId,
        OR: [
          { leagueId: input.leagueId, role: { in: ['LEAGUE_MANAGER', 'ADMIN'] } },
          { teamId: null, leagueId: null, role: { in: ['ADMIN', 'MASTER'] } },
        ],
      },
    });

    if (!membership) {
      throw new Error('unauthorized');
    }

    // Verificar se fase existe
    const phase = await this.prisma.leaguePhase.findUnique({
      where: { id: input.phaseId },
      include: {
        config: {
          include: {
            tiebreakRules: true,
          },
        },
      },
    });

    if (!phase || phase.leagueId !== input.leagueId) {
      throw new Error('phase_not_found');
    }

    if (!phase.config) {
      throw new Error('phase_config_not_found');
    }

    // Atualizar a ordem dos critérios em uma transação
    // Para evitar conflitos com a constraint única (configId, order),
    // primeiro setamos ordens temporárias negativas, depois as ordens finais
    await this.prisma.$transaction(
      async (tx) => {
        // Passo 1: Setar ordens temporárias negativas para evitar conflitos
        await Promise.all(
          input.rules.map((rule, index) =>
            tx.tiebreakRule.update({
              where: { id: rule.id },
              data: { order: -(index + 1) },
            })
          )
        );

        // Passo 2: Setar as ordens finais
        await Promise.all(
          input.rules.map((rule) =>
            tx.tiebreakRule.update({
              where: { id: rule.id },
              data: { order: rule.order },
            })
          )
        );
      },
      {
        timeout: 10000, // 10 segundos de timeout
      }
    );

    return {
      success: true,
      message: 'Tiebreak rules order updated successfully',
    };
  }
}
