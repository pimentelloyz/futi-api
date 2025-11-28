import type { PrismaClient } from '@prisma/client';

export interface CreateRecurringMatchesInput {
  homeTeamId: string;
  awayTeamId: string;
  venue?: string;
  startDate: Date;
  pattern: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
  occurrences?: number; // Número de ocorrências (ex: 10 jogos)
  endDate?: Date; // Ou data final
  daysOfWeek?: number[]; // Para padrão WEEKLY: [1, 3, 5] = Segunda, Quarta, Sexta
  time: string; // Horário: "19:00"
  userId: string;
}

export interface CreateRecurringMatchesOutput {
  matches: Array<{
    id: string;
    scheduledAt: Date;
    homeTeamId: string;
    awayTeamId: string;
  }>;
  message: string;
}

/**
 * Use case para criar partidas recorrentes
 * 
 * Exemplos:
 * - Pelada toda segunda às 19h por 3 meses
 * - Rachão toda terça e quinta às 20h (10 jogos)
 * - Amistoso semanal aos sábados às 15h até fim do ano
 */
export class CreateRecurringMatchesUseCase {
  constructor(private readonly prisma: PrismaClient) {}

  async execute(input: CreateRecurringMatchesInput): Promise<CreateRecurringMatchesOutput> {
    const { homeTeamId, awayTeamId, venue, startDate, pattern, occurrences, endDate, daysOfWeek, time, userId } = input;

    // 1. Validar times
    const [homeTeam, awayTeam] = await Promise.all([
      this.prisma.team.findUnique({ where: { id: homeTeamId } }),
      this.prisma.team.findUnique({ where: { id: awayTeamId } }),
    ]);

    if (!homeTeam || !awayTeam) {
      throw new Error('TEAMS_NOT_FOUND');
    }

    // 2. Verificar permissões (usuário deve ser manager de pelo menos um dos times ou ADMIN/LEAGUE_MANAGER)
    const hasPermission = await this.prisma.accessMembership.findFirst({
      where: {
        userId,
        OR: [
          { teamId: homeTeamId, role: { in: ['MANAGER', 'ASSISTANT'] } },
          { teamId: awayTeamId, role: { in: ['MANAGER', 'ASSISTANT'] } },
          { role: { in: ['ADMIN', 'LEAGUE_MANAGER'] } },
        ],
      },
    });

    if (!hasPermission) {
      throw new Error('UNAUTHORIZED');
    }

    // 3. Gerar datas das partidas baseado no padrão
    const matchDates = this.generateMatchDates({
      startDate,
      pattern,
      occurrences,
      endDate,
      daysOfWeek,
      time,
    });

    // 4. Criar partidas em batch
    const matches = await Promise.all(
      matchDates.map((scheduledAt) =>
        this.prisma.match.create({
          data: {
            homeTeamId,
            awayTeamId,
            scheduledAt,
            venue,
            status: 'SCHEDULED',
            homeScore: 0,
            awayScore: 0,
          },
          select: {
            id: true,
            scheduledAt: true,
            homeTeamId: true,
            awayTeamId: true,
          },
        })
      )
    );

    // 5. Atribuir MATCH_MANAGER aos managers dos times
    const managers = await this.prisma.accessMembership.findMany({
      where: {
        OR: [
          { teamId: homeTeamId, role: 'MANAGER' },
          { teamId: awayTeamId, role: 'MANAGER' },
        ],
      },
      select: { userId: true },
    });

    // Criar AccessMembership para cada partida e cada manager
    const matchManagerAssignments = matches.flatMap((match) =>
      managers.map((manager) => ({
        userId: manager.userId,
        matchId: match.id,
        role: 'MATCH_MANAGER' as const,
      }))
    );

    if (matchManagerAssignments.length > 0) {
      await this.prisma.accessMembership.createMany({
        data: matchManagerAssignments,
        skipDuplicates: true,
      });
    }

    return {
      matches,
      message: `${matches.length} matches created successfully`,
    };
  }

  private generateMatchDates(params: {
    startDate: Date;
    pattern: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
    occurrences?: number;
    endDate?: Date;
    daysOfWeek?: number[];
    time: string;
  }): Date[] {
    const { startDate, pattern, occurrences, endDate, daysOfWeek, time } = params;
    const dates: Date[] = [];
    
    // Parse time (HH:mm)
    const [hours, minutes] = time.split(':').map(Number);
    
    let currentDate = new Date(startDate);
    currentDate.setHours(hours, minutes, 0, 0);
    
    let count = 0;
    const maxIterations = 1000; // Proteção contra loops infinitos
    
    while (count < maxIterations) {
      // Verificar condições de parada
      if (occurrences && dates.length >= occurrences) break;
      if (endDate && currentDate > endDate) break;
      if (!occurrences && !endDate && dates.length >= 52) break; // Default: 1 ano (52 semanas)
      
      // Verificar se a data atual atende aos critérios
      let shouldAdd = false;
      
      switch (pattern) {
        case 'DAILY':
          shouldAdd = true;
          break;
          
        case 'WEEKLY':
          if (daysOfWeek && daysOfWeek.length > 0) {
            shouldAdd = daysOfWeek.includes(currentDate.getDay());
          } else {
            // Se não especificar dias, usa o mesmo dia da semana do startDate
            shouldAdd = currentDate.getDay() === startDate.getDay();
          }
          break;
          
        case 'BIWEEKLY':
          // A cada 2 semanas no mesmo dia
          const weeksDiff = Math.floor((currentDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
          shouldAdd = weeksDiff % 2 === 0 && currentDate.getDay() === startDate.getDay();
          break;
          
        case 'MONTHLY':
          // Mesmo dia do mês
          shouldAdd = currentDate.getDate() === startDate.getDate();
          break;
      }
      
      if (shouldAdd && currentDate >= startDate) {
        dates.push(new Date(currentDate));
      }
      
      // Avançar para próximo dia
      currentDate.setDate(currentDate.getDate() + 1);
      count++;
    }
    
    return dates;
  }
}
