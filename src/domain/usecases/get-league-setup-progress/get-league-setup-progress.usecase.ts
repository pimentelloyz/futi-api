import { ILeagueRepository } from '../../repositories/league.repository.interface.js';
import { prisma } from '../../../infra/prisma/client.js';
import {
  GetLeagueSetupProgressInput,
  GetLeagueSetupProgressOutput,
  LeagueSetupStep,
} from './get-league-setup-progress.dto.js';

export class GetLeagueSetupProgressUseCase {
  constructor(private readonly leagueRepository: ILeagueRepository) {}

  async execute(input: GetLeagueSetupProgressInput): Promise<GetLeagueSetupProgressOutput> {
    // 1. Verificar se a liga existe e se o usuário tem acesso
    const league = await this.leagueRepository.findById(input.leagueId);
    if (!league) {
      throw new Error('LEAGUE_NOT_FOUND');
    }

    // 2. Verificar permissão (LEAGUE_MANAGER ou ADMIN)
    const membership = await prisma.accessMembership.findFirst({
      where: {
        userId: input.userId,
        leagueId: input.leagueId,
        role: { in: ['LEAGUE_MANAGER', 'ADMIN'] },
      },
    });

    if (!membership) {
      throw new Error('UNAUTHORIZED');
    }

    // 3. Buscar dados necessários para avaliar o progresso
    const leagueData = await prisma.league.findUnique({
      where: { id: input.leagueId },
      select: {
        formatId: true,
        format: {
          select: { id: true, name: true, createdAt: true },
        },
      },
    });

    const [phases, teams, matches, disciplineRule, phaseConfigs] = await Promise.all([
      prisma.leaguePhase.findMany({
        where: { leagueId: input.leagueId },
        select: {
          id: true,
          order: true,
          createdAt: true,
          config: {
            select: {
              teamsCount: true,
              groupsCount: true,
            },
          },
        },
        orderBy: { order: 'asc' },
      }),
      prisma.leagueTeam.findMany({
        where: { leagueId: input.leagueId },
        select: { id: true, createdAt: true },
      }),
      prisma.match.findMany({
        where: { leagueId: input.leagueId },
        select: { id: true, status: true, createdAt: true },
      }),
      prisma.disciplineRule.findUnique({
        where: { leagueId: input.leagueId },
        select: { id: true, createdAt: true },
      }),
      prisma.leaguePhaseConfig.findMany({
        where: {
          phases: {
            some: {
              leagueId: input.leagueId,
            },
          },
        },
        select: { teamsCount: true },
      }),
    ]);

    const format = leagueData?.format;
    const requiredTeamsCount = phases[0]?.config?.teamsCount || phaseConfigs[0]?.teamsCount || 4;
    const totalTeams = teams.length;

    // 4. Definir os steps e avaliar status
    const steps: LeagueSetupStep[] = [
      {
        step: 1,
        name: 'Liga Criada',
        description: 'Informações básicas da liga configuradas',
        status: 'completed',
        isRequired: true,
        completedAt: league.createdAt,
      },
      {
        step: 2,
        name: 'Formato Aplicado',
        description: 'Definir formato do campeonato (fases, grupos, mata-mata)',
        status: format ? 'completed' : 'current',
        isRequired: true,
        actionRequired: format ? undefined : 'Aplicar um formato template à liga',
        completedAt: format?.createdAt,
      },
      {
        step: 3,
        name: 'Regras de Disciplina',
        description: 'Configurar cartões e suspensões (opcional)',
        status: format
          ? disciplineRule
            ? 'completed'
            : 'current'
          : 'blocked',
        isRequired: false,
        actionRequired: disciplineRule ? undefined : 'Configurar regras de cartões e suspensões',
        completedAt: disciplineRule?.createdAt,
      },
      {
        step: 4,
        name: 'Times Cadastrados',
        description: `Cadastrar pelo menos ${requiredTeamsCount} times na liga`,
        status: format
          ? totalTeams >= requiredTeamsCount
            ? 'completed'
            : 'current'
          : 'blocked',
        isRequired: true,
        actionRequired:
          totalTeams >= requiredTeamsCount
            ? undefined
            : `Cadastrar mais ${requiredTeamsCount - totalTeams} time(s)`,
        completedAt:
          totalTeams >= requiredTeamsCount
            ? teams[requiredTeamsCount - 1]?.createdAt
            : null,
      },
      {
        step: 5,
        name: 'Classificação Inicializada',
        description: 'Inicializar tabelas de classificação por fase',
        status:
          format && totalTeams >= requiredTeamsCount
            ? (await this.checkStandingsInitialized(input.leagueId))
              ? 'completed'
              : 'current'
            : 'blocked',
        isRequired: true,
        actionRequired:
          format && totalTeams >= requiredTeamsCount
            ? (await this.checkStandingsInitialized(input.leagueId))
              ? undefined
              : 'Inicializar classificação para cada fase'
            : undefined,
      },
      {
        step: 6,
        name: 'Calendário de Jogos',
        description: 'Gerar calendário de partidas',
        status:
          format && totalTeams >= requiredTeamsCount
            ? matches.length > 0
              ? 'completed'
              : 'current'
            : 'blocked',
        isRequired: true,
        actionRequired:
          matches.length > 0 ? undefined : 'Gerar calendário de jogos da liga',
        completedAt: matches.length > 0 ? matches[0]?.createdAt : null,
      },
      {
        step: 7,
        name: 'Liga Pronta',
        description: 'Liga configurada e pronta para iniciar',
        status:
          format &&
          totalTeams >= requiredTeamsCount &&
          matches.length > 0 &&
          (await this.checkStandingsInitialized(input.leagueId))
            ? 'completed'
            : 'pending',
        isRequired: true,
        actionRequired:
          format &&
          totalTeams >= requiredTeamsCount &&
          matches.length > 0 &&
          (await this.checkStandingsInitialized(input.leagueId))
            ? undefined
            : 'Completar todos os passos anteriores',
      },
    ];

    // 5. Calcular métricas
    const completedSteps = steps.filter((s) => s.status === 'completed').length;
    const totalSteps = steps.length;
    const currentStepIndex = steps.findIndex((s) => s.status === 'current');
    const currentStep = currentStepIndex >= 0 ? currentStepIndex + 1 : totalSteps;

    const requiredSteps = steps.filter((s) => s.isRequired);
    const completedRequiredSteps = requiredSteps.filter((s) => s.status === 'completed').length;
    const isSetupComplete = completedRequiredSteps === requiredSteps.length;
    const canStartLeague = isSetupComplete && league.isActive;

    const completionPercentage = Math.round((completedSteps / totalSteps) * 100);

    // 6. Determinar próxima ação
    const nextIncompleteStep = steps.find((s) => s.status !== 'completed' && s.status !== 'blocked');
    const nextAction = nextIncompleteStep
      ? {
          step: nextIncompleteStep.step,
          title: nextIncompleteStep.name,
          description: nextIncompleteStep.actionRequired || nextIncompleteStep.description,
          endpoint: this.getEndpointForStep(nextIncompleteStep.step),
        }
      : undefined;

    return {
      leagueId: league.id,
      leagueName: league.name,
      currentStep,
      totalSteps,
      completionPercentage,
      isSetupComplete,
      canStartLeague,
      steps,
      nextAction,
    };
  }

  private async checkStandingsInitialized(leagueId: string): Promise<boolean> {
    const standings = await prisma.leagueStanding.findFirst({
      where: {
        phase: {
          leagueId,
        },
      },
    });
    return !!standings;
  }

  private getEndpointForStep(step: number): string | undefined {
    const endpoints: Record<number, string> = {
      2: 'POST /api/leagues/{leagueId}/apply-format/{formatId}',
      3: 'POST /api/leagues/{leagueId}/discipline-rules',
      4: 'POST /api/leagues/{leagueId}/teams',
      5: 'POST /api/phases/{phaseId}/standings/initialize',
      6: 'POST /api/leagues/{leagueId}/groups/{groupId}/fixtures',
    };
    return endpoints[step];
  }
}
