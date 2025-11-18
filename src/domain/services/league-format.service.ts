import { PrismaClient, LeagueFormatType, PhaseType, TiebreakCriterion } from '@prisma/client';

// ============================================================================
// INTERFACES & TYPES
// ============================================================================

export interface CreateLeagueFormatDTO {
  name: string;
  slug: string;
  description?: string;
  type: LeagueFormatType;
  isTemplate?: boolean;
  phases?: CreatePhaseConfigDTO[];
}

export interface CreatePhaseConfigDTO {
  name: string;
  order: number;
  type: PhaseType;
  teamsCount?: number;
  groupsCount?: number;
  teamsPerGroup?: number;
  hasHomeAway?: boolean;
  hasExtraTime?: boolean;
  hasPenalties?: boolean;
  hasAwayGoal?: boolean;
  advancingTeams?: number;
  advancingFrom?: string;
  tiebreakRules?: CreateTiebreakRuleDTO[];
}

export interface CreateTiebreakRuleDTO {
  order: number;
  criterion: TiebreakCriterion;
}

export interface UpdateLeagueFormatDTO {
  name?: string;
  description?: string;
  type?: LeagueFormatType;
  isTemplate?: boolean;
}

export interface LeagueFormatWithPhases {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: LeagueFormatType;
  isTemplate: boolean;
  createdAt: Date;
  updatedAt: Date;
  phases: PhaseConfigWithRules[];
}

export interface PhaseConfigWithRules {
  id: string;
  name: string;
  order: number;
  type: PhaseType;
  teamsCount: number | null;
  groupsCount: number | null;
  teamsPerGroup: number | null;
  hasHomeAway: boolean;
  hasExtraTime: boolean;
  hasPenalties: boolean;
  hasAwayGoal: boolean;
  advancingTeams: number | null;
  advancingFrom: string | null;
  tiebreakRules: TiebreakRuleDTO[];
}

export interface TiebreakRuleDTO {
  order: number;
  criterion: TiebreakCriterion;
}

// ============================================================================
// SERVICE
// ============================================================================

/**
 * LeagueFormatService - Gerencia formatos/templates de campeonatos
 *
 * Responsabilidades:
 * - Criar e gerenciar formatos de campeonatos (templates)
 * - Validar configurações de fases
 * - Listar formatos disponíveis
 * - Aplicar templates em ligas
 *
 * Princípios SOLID aplicados:
 * - Single Responsibility: Focado apenas em formatos de campeonato
 * - Open/Closed: Extensível para novos tipos de formato sem modificar código existente
 * - Dependency Inversion: Depende de abstrações (PrismaClient interface)
 */
export class LeagueFormatService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Cria um novo formato de campeonato com suas fases e regras
   */
  async createFormat(data: CreateLeagueFormatDTO): Promise<LeagueFormatWithPhases> {
    // Validações
    if (!data.name || !data.slug) {
      throw new Error('Nome e slug são obrigatórios');
    }

    // Verificar se slug já existe
    const existing = await this.prisma.leagueFormat.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      throw new Error('Formato com este slug já existe');
    }

    // Validar fases se fornecidas
    if (data.phases) {
      this.validatePhases(data.phases);
    }

    // Criar formato com fases e regras em transação
    const format = await this.prisma.leagueFormat.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        type: data.type,
        isTemplate: data.isTemplate !== false,
        phases: data.phases
          ? {
              create: data.phases.map((phase) => ({
                name: phase.name,
                order: phase.order,
                type: phase.type,
                teamsCount: phase.teamsCount || null,
                groupsCount: phase.groupsCount || null,
                teamsPerGroup: phase.teamsPerGroup || null,
                hasHomeAway: phase.hasHomeAway !== false,
                hasExtraTime: phase.hasExtraTime || false,
                hasPenalties: phase.hasPenalties || false,
                hasAwayGoal: phase.hasAwayGoal || false,
                advancingTeams: phase.advancingTeams || null,
                advancingFrom: phase.advancingFrom || null,
                tiebreakRules: phase.tiebreakRules
                  ? {
                      create: phase.tiebreakRules.map((rule) => ({
                        order: rule.order,
                        criterion: rule.criterion,
                      })),
                    }
                  : undefined,
              })),
            }
          : undefined,
      },
      include: {
        phases: {
          include: {
            tiebreakRules: {
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    return this.mapToLeagueFormatWithPhases(format);
  }

  /**
   * Busca um formato por ID com todas as suas configurações
   */
  async getFormatById(id: string): Promise<LeagueFormatWithPhases | null> {
    const format = await this.prisma.leagueFormat.findUnique({
      where: { id },
      include: {
        phases: {
          include: {
            tiebreakRules: {
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!format) return null;
    return this.mapToLeagueFormatWithPhases(format);
  }

  /**
   * Busca um formato por slug
   */
  async getFormatBySlug(slug: string): Promise<LeagueFormatWithPhases | null> {
    const format = await this.prisma.leagueFormat.findUnique({
      where: { slug },
      include: {
        phases: {
          include: {
            tiebreakRules: {
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!format) return null;
    return this.mapToLeagueFormatWithPhases(format);
  }

  /**
   * Lista todos os formatos (com opção de filtrar apenas templates)
   */
  async listFormats(templatesOnly = false): Promise<LeagueFormatWithPhases[]> {
    const formats = await this.prisma.leagueFormat.findMany({
      where: templatesOnly ? { isTemplate: true } : undefined,
      include: {
        phases: {
          include: {
            tiebreakRules: {
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    return formats.map((f) => this.mapToLeagueFormatWithPhases(f));
  }

  /**
   * Atualiza um formato existente
   */
  async updateFormat(id: string, data: UpdateLeagueFormatDTO): Promise<LeagueFormatWithPhases> {
    const format = await this.prisma.leagueFormat.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        isTemplate: data.isTemplate,
      },
      include: {
        phases: {
          include: {
            tiebreakRules: {
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    return this.mapToLeagueFormatWithPhases(format);
  }

  /**
   * Deleta um formato (apenas se não estiver sendo usado por nenhuma liga)
   */
  async deleteFormat(id: string): Promise<void> {
    // Verificar se está sendo usado
    const usageCount = await this.prisma.league.count({
      where: { formatId: id },
    });

    if (usageCount > 0) {
      throw new Error(`Formato está sendo usado por ${usageCount} liga(s) e não pode ser deletado`);
    }

    await this.prisma.leagueFormat.delete({
      where: { id },
    });
  }

  /**
   * Aplica um formato/template a uma liga
   */
  async applyFormatToLeague(leagueId: string, formatId: string): Promise<void> {
    const format = await this.getFormatById(formatId);
    if (!format) {
      throw new Error('Formato não encontrado');
    }

    const league = await this.prisma.league.findUnique({
      where: { id: leagueId },
    });

    if (!league) {
      throw new Error('Liga não encontrada');
    }

    // Atualizar liga com o formato
    await this.prisma.league.update({
      where: { id: leagueId },
      data: { formatId },
    });

    // Criar fases para a liga baseadas no formato
    for (const phaseConfig of format.phases) {
      await this.prisma.leaguePhase.create({
        data: {
          leagueId,
          configId: phaseConfig.id,
          name: phaseConfig.name,
          order: phaseConfig.order,
          type: phaseConfig.type,
          hasHomeAway: phaseConfig.hasHomeAway,
          hasExtraTime: phaseConfig.hasExtraTime,
          hasPenalties: phaseConfig.hasPenalties,
        },
      });
    }
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private validatePhases(phases: CreatePhaseConfigDTO[]): void {
    if (phases.length === 0) {
      throw new Error('Ao menos uma fase deve ser fornecida');
    }

    // Validar ordem sequencial
    const orders = phases.map((p) => p.order).sort((a, b) => a - b);
    for (let i = 0; i < orders.length; i++) {
      if (orders[i] !== i + 1) {
        throw new Error('Ordens das fases devem ser sequenciais começando de 1');
      }
    }

    // Validar configurações específicas por tipo
    for (const phase of phases) {
      if (phase.type === 'GROUP_STAGE') {
        if (!phase.groupsCount || !phase.teamsPerGroup) {
          throw new Error('Fase de grupos requer groupsCount e teamsPerGroup');
        }
      }

      // Validar regras de desempate
      if (phase.tiebreakRules) {
        const ruleOrders = phase.tiebreakRules.map((r) => r.order).sort((a, b) => a - b);
        for (let i = 0; i < ruleOrders.length; i++) {
          if (ruleOrders[i] !== i + 1) {
            throw new Error(
              `Ordens das regras de desempate devem ser sequenciais na fase ${phase.name}`,
            );
          }
        }
      }
    }
  }

  private mapToLeagueFormatWithPhases(format: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    type: LeagueFormatType;
    isTemplate: boolean;
    createdAt: Date;
    updatedAt: Date;
    phases: Array<{
      id: string;
      name: string;
      order: number;
      type: PhaseType;
      teamsCount: number | null;
      groupsCount: number | null;
      teamsPerGroup: number | null;
      hasHomeAway: boolean;
      hasExtraTime: boolean;
      hasPenalties: boolean;
      hasAwayGoal: boolean;
      advancingTeams: number | null;
      advancingFrom: string | null;
      tiebreakRules: Array<{
        order: number;
        criterion: TiebreakCriterion;
      }>;
    }>;
  }): LeagueFormatWithPhases {
    return {
      id: format.id,
      name: format.name,
      slug: format.slug,
      description: format.description,
      type: format.type,
      isTemplate: format.isTemplate,
      createdAt: format.createdAt,
      updatedAt: format.updatedAt,
      phases: format.phases.map((p) => ({
        id: p.id,
        name: p.name,
        order: p.order,
        type: p.type,
        teamsCount: p.teamsCount,
        groupsCount: p.groupsCount,
        teamsPerGroup: p.teamsPerGroup,
        hasHomeAway: p.hasHomeAway,
        hasExtraTime: p.hasExtraTime,
        hasPenalties: p.hasPenalties,
        hasAwayGoal: p.hasAwayGoal,
        advancingTeams: p.advancingTeams,
        advancingFrom: p.advancingFrom,
        tiebreakRules: p.tiebreakRules.map((r) => ({
          order: r.order,
          criterion: r.criterion,
        })),
      })),
    };
  }
}
