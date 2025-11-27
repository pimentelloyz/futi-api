import type { PrismaClient } from '@prisma/client';

export interface GenerateGroupsInput {
  leagueId: string;
  userId: string;
  count?: number; // Número de grupos (opcional, usa default do formato)
  namingPattern?: 'LETTER' | 'NUMBER'; // Padrão de nomenclatura (A,B,C... ou 1,2,3...)
}

export interface GenerateGroupsOutput {
  leagueId: string;
  groups: Array<{
    id: string;
    name: string;
  }>;
  message: string;
}

/**
 * Use case para gerar grupos automaticamente baseado no formato da liga
 * 
 * Regras:
 * - Se count não for passado, usa o default baseado no formato:
 *   - Copa do Mundo: 8 grupos
 *   - Champions League: 8 grupos  
 *   - Libertadores: 8 grupos
 *   - Copa do Brasil: 0 grupos (mata-mata direto)
 *   - Brasileirão: 0 grupos (pontos corridos)
 *   - Estadual: 4 grupos
 *   - Rachão: 2 grupos
 * 
 * - Naming pattern LETTER: A, B, C, D, E, F, G, H, I, J...
 * - Naming pattern NUMBER: Grupo 1, Grupo 2, Grupo 3...
 * 
 * - Apenas LEAGUE_MANAGER ou ADMIN podem gerar grupos
 * - Não permite gerar grupos se já existirem grupos na liga
 */
export class GenerateGroupsUseCase {
  constructor(private readonly prisma: PrismaClient) {}

  async execute(input: GenerateGroupsInput): Promise<GenerateGroupsOutput> {
    const { leagueId, userId, count, namingPattern = 'LETTER' } = input;

    // 1. Verificar se a liga existe
    const league = await this.prisma.league.findUnique({
      where: { id: leagueId },
      include: {
        format: true,
        accessMemberships: {
          where: { userId },
        },
      },
    });

    if (!league) {
      throw new Error('LEAGUE_NOT_FOUND');
    }

    // 2. Verificar permissões (LEAGUE_MANAGER ou ADMIN)
    const hasAccess = league.accessMemberships.some(
      (access) => access.role === 'LEAGUE_MANAGER' || access.role === 'ADMIN',
    );

    if (!hasAccess) {
      throw new Error('UNAUTHORIZED');
    }

    // 3. Verificar se já existem grupos
    const existingGroups = await this.prisma.leagueGroup.count({
      where: { leagueId },
    });

    if (existingGroups > 0) {
      throw new Error('GROUPS_ALREADY_EXIST');
    }

    // 4. Determinar quantidade de grupos baseado no formato
    let groupCount = count;

    if (!groupCount && league.format) {
      // Default baseado no formato
      const formatDefaults: Record<string, number> = {
        'Copa do Mundo': 8,
        'Champions League': 8,
        'Libertadores': 8,
        'Copa do Brasil': 0,
        'Brasileirão': 0,
        'Estadual': 4,
        'Rachão': 2,
      };

      groupCount = formatDefaults[league.format.name] ?? 4; // Default: 4 grupos
    }

    if (!groupCount) {
      throw new Error('FORMAT_NOT_CONFIGURED');
    }

    if (groupCount <= 0) {
      return {
        leagueId,
        groups: [],
        message: 'This format does not use groups',
      };
    }

    // 5. Criar grupos
    const groups = [];
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    for (let i = 0; i < groupCount; i++) {
      const name = namingPattern === 'LETTER' 
        ? letters[i] || `Grupo ${i + 1}` // Fallback se passar de 26 grupos
        : `Grupo ${i + 1}`;

      const group = await this.prisma.leagueGroup.create({
        data: {
          leagueId,
          name,
        },
      });

      groups.push({
        id: group.id,
        name: group.name,
      });
    }

    return {
      leagueId,
      groups,
      message: `${groupCount} groups created successfully`,
    };
  }
}
