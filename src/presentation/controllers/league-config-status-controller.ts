import type {
  League,
  LeagueFormat,
  LeaguePhaseConfig,
  LeaguePhase,
  Match,
  LeagueTeam,
  Team,
} from '@prisma/client';

import { prisma } from '../../infra/prisma/client.js';
import type { HttpRequest, HttpResponse } from '../protocols/http.js';

interface ConfigStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
  order: number;
}

interface ConfigStatusResponse {
  leagueId: string;
  leagueName: string;
  formatName: string;
  formatType: string;
  isConfigured: boolean;
  completionPercentage: number;
  steps: ConfigStep[];
}

type LeagueWithRelations = League & {
  format: (LeagueFormat & { phases: LeaguePhaseConfig[] }) | null;
  phases: LeaguePhase[];
  matches: Match[];
};

type LeagueTeamWithTeam = LeagueTeam & { team: Team };

export class LeagueConfigStatusController {
  async handle(request: HttpRequest): Promise<HttpResponse> {
    try {
      const { id: leagueId } = request.params as { id: string };

      if (!leagueId) {
        return {
          statusCode: 400,
          body: { error: 'league_id_required' },
        };
      }

      // Buscar liga com formato e times
      const league = await prisma.league.findUnique({
        where: { id: leagueId },
        include: {
          format: {
            include: {
              phases: {
                orderBy: { order: 'asc' },
              },
            },
          },
          phases: {
            orderBy: { order: 'asc' },
          },
          matches: true,
        },
      });

      // Buscar times vinculados à liga via LeagueTeam
      const leagueTeams = await prisma.leagueTeam.findMany({
        where: { leagueId },
        include: { team: true },
      });

      if (!league) {
        return {
          statusCode: 404,
          body: { error: 'league_not_found' },
        };
      }

      if (!league.format) {
        return {
          statusCode: 400,
          body: { error: 'league_format_not_configured' },
        };
      }

      // Buscar convites ativos
      const activeInvites = await prisma.leagueInvitation.count({
        where: {
          leagueId,
          isActive: true,
        },
      });

      const steps = this.generateSteps(league, leagueTeams, activeInvites);
      const completedSteps = steps.filter((s) => s.completed && s.required).length;
      const requiredSteps = steps.filter((s) => s.required).length;
      const completionPercentage =
        requiredSteps > 0 ? Math.round((completedSteps / requiredSteps) * 100) : 0;
      const isConfigured = completedSteps === requiredSteps;

      const response: ConfigStatusResponse = {
        leagueId: league.id,
        leagueName: league.name,
        formatName: league.format.name,
        formatType: league.format.type,
        isConfigured,
        completionPercentage,
        steps,
      };

      return {
        statusCode: 200,
        body: response,
      };
    } catch (error) {
      console.error('[league_config_status_error]', error);
      return {
        statusCode: 500,
        body: { error: 'internal_error' },
      };
    }
  }

  private generateSteps(
    league: LeagueWithRelations,
    leagueTeams: LeagueTeamWithTeam[],
    activeInvites: number,
  ): ConfigStep[] {
    const steps: ConfigStep[] = [];
    const formatType = league.format.type;
    const phaseConfigs = league.format.phases || [];

    // Step 1: Liga criada (sempre completo se chegou aqui)
    steps.push({
      id: 'league_created',
      title: 'Liga criada',
      description: 'A liga foi criada com sucesso',
      completed: true,
      required: true,
      order: 1,
    });

    // Step 2: Formato selecionado (sempre completo se chegou aqui)
    steps.push({
      id: 'format_selected',
      title: 'Formato selecionado',
      description: `Formato "${league.format.name}" configurado`,
      completed: true,
      required: true,
      order: 2,
    });

    // Step 3: Times convidados/confirmados
    const requiredTeams = this.getRequiredTeamsCount(formatType, phaseConfigs);
    const currentTeams = leagueTeams.length;
    const teamsComplete = currentTeams >= requiredTeams;

    steps.push({
      id: 'teams_confirmed',
      title: 'Times confirmados',
      description: `${currentTeams}/${requiredTeams} times confirmados na liga`,
      completed: teamsComplete,
      required: true,
      order: 3,
    });

    // Step 4: Convites ativos (opcional, mas recomendado se times incompletos)
    if (!teamsComplete) {
      steps.push({
        id: 'invites_created',
        title: 'Criar convites',
        description:
          activeInvites > 0
            ? `${activeInvites} convite(s) ativo(s) criado(s)`
            : 'Crie convites para convidar times',
        completed: activeInvites > 0,
        required: false,
        order: 4,
      });
    }

    // Steps específicos por formato
    switch (formatType) {
      case 'ROUND_ROBIN':
        this.addRoundRobinSteps(steps, league, teamsComplete);
        break;
      case 'KNOCKOUT':
        this.addKnockoutSteps(steps, league, teamsComplete);
        break;
      case 'MIXED':
        this.addMixedSteps(steps, league, teamsComplete, phaseConfigs);
        break;
      case 'LEAGUE_PHASE':
        this.addLeaguePhaseSteps(steps, league, teamsComplete);
        break;
      case 'CUSTOM':
        this.addCustomSteps(steps, league, teamsComplete);
        break;
    }

    return steps.sort((a, b) => a.order - b.order);
  }

  private getRequiredTeamsCount(formatType: string, phaseConfigs: LeaguePhaseConfig[]): number {
    // Valores padrão por formato
    const defaults: Record<string, number> = {
      ROUND_ROBIN: 20, // Brasileirão
      KNOCKOUT: 64, // Copa do Brasil (primeira fase)
      MIXED: 32, // Libertadores
      LEAGUE_PHASE: 36, // Champions League novo formato
      CUSTOM: 8,
    };

    // Se houver configuração de fase, usar o teamsCount da primeira fase
    if (phaseConfigs.length > 0 && phaseConfigs[0].teamsCount) {
      return phaseConfigs[0].teamsCount;
    }

    return defaults[formatType] || 8;
  }

  private addRoundRobinSteps(
    steps: ConfigStep[],
    league: LeagueWithRelations,
    teamsComplete: boolean,
  ): void {
    const hasMatches = (league.matches?.length || 0) > 0;
    const hasPhases = (league.phases?.length || 0) > 0;

    steps.push({
      id: 'create_phase',
      title: 'Criar fase da liga',
      description: hasPhases
        ? 'Fase de pontos corridos criada'
        : 'Crie a fase única de pontos corridos',
      completed: hasPhases,
      required: true,
      order: 10,
    });

    steps.push({
      id: 'generate_fixtures',
      title: 'Gerar calendário de jogos',
      description: hasMatches
        ? `${league.matches.length} partida(s) gerada(s)`
        : 'Gere as partidas de ida e volta (opcional: definir datas)',
      completed: hasMatches,
      required: true,
      order: 11,
    });

    steps.push({
      id: 'define_tiebreaker',
      title: 'Definir critérios de desempate',
      description: 'Configure regras: pontos, saldo de gols, confronto direto, gols marcados, etc',
      completed: false, // TODO: implementar verificação de tiebreak rules
      required: false,
      order: 12,
    });

    steps.push({
      id: 'start_league',
      title: 'Iniciar liga',
      description:
        teamsComplete && hasMatches
          ? 'Tudo pronto! Inicie a competição'
          : 'Complete os passos anteriores para iniciar',
      completed: false,
      required: true,
      order: 20,
    });
  }

  private addKnockoutSteps(
    steps: ConfigStep[],
    league: LeagueWithRelations,
    teamsComplete: boolean,
  ): void {
    const hasPhases = (league.phases?.length || 0) > 0;
    const hasMatches = (league.matches?.length || 0) > 0;

    steps.push({
      id: 'define_bracket',
      title: 'Definir chaveamento',
      description: hasPhases
        ? 'Chaveamento definido (Oitavas, Quartas, Semi, Final)'
        : 'Crie as fases: Oitavas de Final, Quartas, Semifinais, Final',
      completed: hasPhases,
      required: true,
      order: 10,
    });

    steps.push({
      id: 'seed_teams',
      title: 'Sortear/distribuir times',
      description: 'Distribua os times pelas chaves do mata-mata',
      completed: false, // TODO: implementar verificação de seeding
      required: true,
      order: 11,
    });

    steps.push({
      id: 'generate_matches',
      title: 'Gerar confrontos',
      description: hasMatches
        ? `${league.matches.length} confronto(s) gerado(s)`
        : 'Gere os jogos de ida e volta (se aplicável)',
      completed: hasMatches,
      required: true,
      order: 12,
    });

    steps.push({
      id: 'configure_rules',
      title: 'Configurar regras',
      description: 'Defina: gol fora, prorrogação, pênaltis',
      completed: false, // TODO: verificar se rules estão definidas
      required: false,
      order: 13,
    });

    steps.push({
      id: 'start_league',
      title: 'Iniciar copa',
      description:
        teamsComplete && hasMatches
          ? 'Tudo pronto! Inicie a competição'
          : 'Complete os passos anteriores',
      completed: false,
      required: true,
      order: 20,
    });
  }

  private addMixedSteps(
    steps: ConfigStep[],
    league: LeagueWithRelations,
    teamsComplete: boolean,
    phaseConfigs: LeaguePhaseConfig[],
  ): void {
    const hasPhases = (league.phases?.length || 0) > 0;
    const hasMatches = (league.matches?.length || 0) > 0;

    // Fase de grupos
    const groupPhaseConfig = phaseConfigs.find((p) => p.type === 'GROUP_STAGE');
    const groupsCount = groupPhaseConfig?.groupsCount || 8;

    steps.push({
      id: 'create_groups',
      title: 'Criar grupos',
      description: `Crie ${groupsCount} grupos (A, B, C, D, etc) para a fase inicial`,
      completed: false, // TODO: verificar se grupos foram criados
      required: true,
      order: 10,
    });

    steps.push({
      id: 'distribute_teams',
      title: 'Distribuir times nos grupos',
      description: 'Sortear ou distribuir manualmente os times pelos grupos',
      completed: false, // TODO: verificar distribuição
      required: true,
      order: 11,
    });

    steps.push({
      id: 'generate_group_matches',
      title: 'Gerar jogos da fase de grupos',
      description: 'Criar partidas de ida e volta dentro de cada grupo',
      completed: hasMatches && hasPhases,
      required: true,
      order: 12,
    });

    steps.push({
      id: 'define_advancement',
      title: 'Definir classificação',
      description: 'Configure quantos times avançam de cada grupo (ex: top 2)',
      completed: false, // TODO: verificar advancement rules
      required: true,
      order: 13,
    });

    steps.push({
      id: 'create_knockout_phases',
      title: 'Criar fases eliminatórias',
      description: 'Defina: Oitavas, Quartas, Semifinais, Final',
      completed: hasPhases && league.phases.length > 1,
      required: true,
      order: 14,
    });

    steps.push({
      id: 'start_league',
      title: 'Iniciar competição',
      description:
        teamsComplete && hasMatches
          ? 'Tudo pronto! Inicie a fase de grupos'
          : 'Complete os passos anteriores',
      completed: false,
      required: true,
      order: 20,
    });
  }

  private addLeaguePhaseSteps(
    steps: ConfigStep[],
    league: LeagueWithRelations,
    teamsComplete: boolean,
  ): void {
    const hasPhases = (league.phases?.length || 0) > 0;
    const hasMatches = (league.matches?.length || 0) > 0;

    steps.push({
      id: 'create_league_phase',
      title: 'Criar fase de liga',
      description: 'Criar fase única onde todos jogam contra todos (turno único)',
      completed: hasPhases,
      required: true,
      order: 10,
    });

    steps.push({
      id: 'generate_fixtures',
      title: 'Gerar calendário',
      description: hasMatches
        ? `${league.matches.length} partida(s) gerada(s)`
        : 'Gerar jogos em turno único (sem ida e volta)',
      completed: hasMatches,
      required: true,
      order: 11,
    });

    steps.push({
      id: 'define_playoffs',
      title: 'Definir playoffs (opcional)',
      description: 'Configure se haverá mata-mata para os classificados',
      completed: false,
      required: false,
      order: 12,
    });

    steps.push({
      id: 'start_league',
      title: 'Iniciar liga',
      description:
        teamsComplete && hasMatches ? 'Tudo pronto! Inicie a liga' : 'Complete os passos',
      completed: false,
      required: true,
      order: 20,
    });
  }

  private addCustomSteps(
    steps: ConfigStep[],
    league: LeagueWithRelations,
    teamsComplete: boolean,
  ): void {
    const hasPhases = (league.phases?.length || 0) > 0;
    const hasMatches = (league.matches?.length || 0) > 0;

    steps.push({
      id: 'define_structure',
      title: 'Definir estrutura personalizada',
      description: 'Configure fases, grupos e regras customizadas',
      completed: hasPhases,
      required: true,
      order: 10,
    });

    steps.push({
      id: 'create_matches',
      title: 'Criar partidas',
      description: hasMatches
        ? `${league.matches.length} partida(s) criada(s)`
        : 'Crie manualmente as partidas ou use gerador',
      completed: hasMatches,
      required: true,
      order: 11,
    });

    steps.push({
      id: 'start_league',
      title: 'Iniciar liga',
      description: teamsComplete && hasMatches ? 'Tudo pronto!' : 'Complete os passos',
      completed: false,
      required: true,
      order: 20,
    });
  }
}
