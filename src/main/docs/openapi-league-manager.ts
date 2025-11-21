/**
 * OpenAPI Documentation - League Manager (Gestor de Liga)
 *
 * Documentação dos endpoints para gestores de liga
 * Permissões: Gerenciar liga, times da liga, criar partidas, grupos, etc.
 */

interface OpenAPIInfo {
  title: string;
  version: string;
  description?: string;
}

interface OpenAPIServer {
  url: string;
}

interface OpenAPIPathItem {
  [method: string]: unknown;
}

interface OpenAPIObject {
  openapi: string;
  info: OpenAPIInfo;
  servers?: OpenAPIServer[];
  paths: Record<string, OpenAPIPathItem>;
  components?: Record<string, unknown>;
  tags?: Array<{ name: string; description?: string }>;
}

export const openapiLeagueManager: OpenAPIObject = {
  openapi: '3.1.0',
  info: {
    title: 'futi-api - League Manager',
    version: '0.1.0',
    description: 'Endpoints para gestores de liga - Gerenciamento de liga, times, grupos, partidas',
  },
  servers: [{ url: 'http://localhost:3000' }],
  tags: [
    { name: 'Health', description: 'Healthcheck e status do serviço' },
    { name: 'Auth', description: 'Autenticação e tokens' },
    { name: 'Access', description: 'Controle de acesso e permissões' },
    { name: 'Leagues', description: 'Gerenciamento de ligas' },
    { name: 'Teams', description: 'Times da liga' },
    { name: 'Matches', description: 'Gerenciamento de partidas' },
    { name: 'Invites', description: 'Convites para times' },
    { name: 'Discipline', description: 'Regras disciplinares' },
    { name: 'Standings', description: 'Classificação e tabelas' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          '🔐 **Autenticação via JWT**: Sua role (LEAGUE_MANAGER) está incluída automaticamente no token JWT obtido via `/api/auth/firebase/exchange`. Não é necessário passar a role manualmente - ela é extraída do token pelo servidor. Endpoints protegidos verificam se você tem a role adequada.',
      },
    },
  },
  paths: {
    // ==================== COMMON ENDPOINTS ====================
    '/health': {
      get: {
        summary: 'Health check',
        tags: ['Health'],
        responses: {
          '200': { description: 'OK' },
        },
      },
    },
    '/api/auth/firebase/exchange': {
      post: {
        summary: 'Exchange Firebase idToken for internal JWT',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { idToken: { type: 'string' } },
                required: ['idToken'],
              },
            },
          },
        },
        responses: {
          '200': { description: 'Successful exchange' },
          '400': { description: 'Invalid request' },
          '401': { description: 'Invalid token' },
        },
      },
    },
    '/api/auth/refresh': {
      post: {
        summary: 'Refresh access token',
        tags: ['Auth'],
        responses: {
          '200': { description: 'Tokens refreshed' },
        },
      },
    },
    '/api/auth/logout': {
      post: {
        summary: 'Logout',
        tags: ['Auth'],
        responses: {
          '200': { description: 'OK' },
        },
      },
    },
    '/api/auth/logout-all': {
      post: {
        summary: 'Logout de todos dispositivos',
        tags: ['Auth'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'OK' },
        },
      },
    },
    '/api/access/me': {
      get: {
        summary: 'Minhas permissões e memberships',
        tags: ['Access'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Memberships do usuário' },
        },
      },
    },

    // ==================== LEAGUES ====================
    '/api/leagues': {
      get: {
        summary: 'Listar ligas',
        tags: ['Leagues'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Lista de ligas' },
        },
      },
      post: {
        summary: 'Criar liga (apenas LEAGUE_MANAGER com permissão)',
        tags: ['Leagues'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  slug: { type: 'string' },
                  description: { type: ['string', 'null'] },
                  isPublic: { type: 'boolean' },
                  startAt: { type: 'string', format: 'date-time' },
                  endAt: { type: 'string', format: 'date-time' },
                },
                required: ['name', 'slug'],
              },
            },
          },
        },
        responses: {
          '201': { description: 'Liga criada' },
          '400': { description: 'Invalid request' },
          '403': { description: 'Forbidden' },
        },
      },
    },
    '/api/leagues/{id}': {
      get: {
        summary: 'Detalhes da liga',
        tags: ['Leagues'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Detalhes da liga' },
          '404': { description: 'Liga não encontrada' },
        },
      },
      patch: {
        summary: 'Atualizar liga',
        tags: ['Leagues'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: ['string', 'null'] },
                  isActive: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Liga atualizada' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Liga não encontrada' },
        },
      },
    },
    '/api/leagues/{id}/teams': {
      post: {
        summary: 'Adicionar time à liga',
        tags: ['Leagues'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  teamId: { type: 'string' },
                },
                required: ['teamId'],
              },
            },
          },
        },
        responses: {
          '201': { description: 'Time adicionado' },
          '400': { description: 'Invalid request' },
          '403': { description: 'Forbidden' },
        },
      },
    },
    '/api/leagues/{id}/groups': {
      post: {
        summary: 'Criar grupo na liga',
        tags: ['Leagues'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  order: { type: 'integer' },
                },
                required: ['name'],
              },
            },
          },
        },
        responses: {
          '201': { description: 'Grupo criado' },
          '403': { description: 'Forbidden' },
        },
      },
    },
    '/api/leagues/{id}/config-status': {
      get: {
        summary: 'Verificar status de configuração da liga',
        tags: ['Leagues'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Status de configuração' },
          '404': { description: 'Liga não encontrada' },
        },
      },
    },

    // ==================== MATCHES ====================
    '/api/matches': {
      post: {
        summary: 'Criar partida',
        tags: ['Matches'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  leagueId: { type: 'string' },
                  homeTeamId: { type: 'string' },
                  awayTeamId: { type: 'string' },
                  scheduledAt: { type: 'string', format: 'date-time' },
                },
                required: ['leagueId', 'homeTeamId', 'awayTeamId'],
              },
            },
          },
        },
        responses: {
          '201': { description: 'Partida criada' },
          '400': { description: 'Invalid request' },
          '403': { description: 'Forbidden' },
        },
      },
    },

    // ==================== INVITES ====================
    '/api/invites': {
      post: {
        summary: 'Criar convite para time',
        tags: ['Invites'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  leagueId: { type: 'string' },
                  role: { type: 'string', enum: ['MANAGER'] },
                },
                required: ['leagueId', 'role'],
              },
            },
          },
        },
        responses: {
          '201': { description: 'Convite criado' },
          '403': { description: 'Forbidden' },
        },
      },
    },

    // ==================== DISCIPLINE ====================
    '/api/leagues/{leagueId}/discipline-rules': {
      get: {
        summary: 'Obter regras disciplinares da liga',
        tags: ['Discipline'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'leagueId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Regras disciplinares' },
        },
      },
      post: {
        summary: 'Criar/atualizar regras disciplinares',
        tags: ['Discipline'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'leagueId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  yellowCardSuspension: { type: 'integer' },
                  redCardSuspension: { type: 'integer' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Regras criadas/atualizadas' },
          '403': { description: 'Forbidden' },
        },
      },
    },

    // ==================== STANDINGS ====================
    '/api/leagues/{leagueId}/standings': {
      get: {
        summary: 'Obter classificação da liga',
        tags: ['Standings'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'leagueId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Classificação' },
        },
      },
    },
  },
};
