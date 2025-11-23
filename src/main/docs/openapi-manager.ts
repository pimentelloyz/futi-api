/**
 * OpenAPI Documentation - Manager (Técnico)
 *
 * Documentação dos endpoints para técnicos de times
 * Permissões: Gerenciar time, jogadores, convites, escalações
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

export const openapiManager: OpenAPIObject = {
  openapi: '3.1.0',
  info: {
    title: 'futi-api - Manager (Técnico)',
    version: '0.1.0',
    description:
      'Endpoints para técnicos - Gerenciamento de times, jogadores, convites e escalações',
  },
  servers: [{ url: 'http://localhost:3000' }],
  tags: [
    { name: 'Health', description: 'Healthcheck e status do serviço' },
    { name: 'Auth', description: 'Autenticação e tokens' },
    { name: 'Access', description: 'Controle de acesso e permissões' },
    { name: 'Teams', description: 'Gerenciamento de times' },
    { name: 'Players', description: 'Gerenciamento de jogadores' },
    { name: 'Invites', description: 'Convites para jogadores' },
    { name: 'Evaluations', description: 'Avaliações de jogadores' },
    { name: 'Leagues', description: 'Visualização de ligas' },
    { name: 'Matches', description: 'Visualização de partidas e escalações' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          '🔐 **Autenticação via JWT**: Sua role (MANAGER) está incluída automaticamente no token JWT obtido via `/api/auth/firebase/exchange`. Não é necessário passar a role manualmente - ela é extraída do token pelo servidor. Endpoints protegidos verificam se você tem a role adequada.',
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
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string' },
                    timestamp: { type: 'string' },
                  },
                },
              },
            },
          },
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
                properties: {
                  idToken: { type: 'string' },
                },
                required: ['idToken'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Successful exchange',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    accessToken: { type: 'string' },
                    refreshToken: { type: 'string' },
                  },
                },
              },
            },
          },
          '400': { description: 'Invalid request' },
          '401': { description: 'Invalid token' },
        },
      },
    },
    '/api/auth/refresh': {
      post: {
        summary: 'Refresh access token',
        tags: ['Auth'],
        description:
          '**Renovação de Tokens** - Use quando receber 401 EXPIRED_TOKEN.\n\n' +
          '**O que enviar**: `{ "refreshToken": "futi_rt_..." }` ou deixe vazio (cookie HttpOnly automático).\n\n' +
          '**Retorno**: Novo `accessToken` (1h) + novo `refreshToken` (30 dias). O anterior é invalidado.',
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  refreshToken: { type: 'string', description: 'Opcional se enviado via cookie' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Tokens renovados',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    accessToken: { type: 'string', description: 'Novo JWT (1h)' },
                    refreshToken: { type: 'string', description: 'Novo refreshToken (30 dias)' },
                  },
                },
              },
            },
          },
          '400': { description: 'RefreshToken não enviado' },
          '401': { description: 'RefreshToken inválido ou expirado' },
        },
      },
    },
    '/api/auth/logout': {
      post: {
        summary: 'Logout (revoga refresh token atual)',
        tags: ['Auth'],
        responses: {
          '200': { description: 'OK' },
          '400': { description: 'Invalid request' },
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
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/access/me': {
      get: {
        summary: 'Minhas permissões e memberships',
        tags: ['Access'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Memberships do usuário',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    memberships: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          role: { type: 'string' },
                          teamId: { type: ['string', 'null'] },
                          team: { type: ['object', 'null'] },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
        },
      },
    },

    // ==================== TEAMS ====================
    '/api/teams': {
      post: {
        summary: 'Criar time',
        tags: ['Teams'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  icon: { type: ['string', 'null'] },
                  description: { type: ['string', 'null'] },
                },
                required: ['name'],
              },
            },
          },
        },
        responses: {
          '201': { description: 'Time criado' },
          '400': { description: 'Invalid request' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
        },
      },
      get: {
        summary: 'Listar todos os times',
        tags: ['Teams'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Lista de times',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    teams: { type: 'array' },
                  },
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/teams/{id}': {
      get: {
        summary: 'Buscar time por ID',
        tags: ['Teams'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'Time encontrado' },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Time não encontrado' },
        },
      },
      patch: {
        summary: 'Atualizar time',
        tags: ['Teams'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  icon: { type: ['string', 'null'] },
                  description: { type: ['string', 'null'] },
                  isActive: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Time atualizado' },
          '400': { description: 'Invalid request' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Time não encontrado' },
        },
      },
    },
    '/api/teams/{id}/players': {
      get: {
        summary: 'Listar jogadores do time',
        tags: ['Teams'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'Lista de jogadores' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Time não encontrado' },
        },
      },
      post: {
        summary: 'Adicionar jogador ao time',
        tags: ['Teams'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  playerId: { type: 'string' },
                  number: { type: ['integer', 'null'] },
                },
                required: ['playerId'],
              },
            },
          },
        },
        responses: {
          '201': { description: 'Jogador adicionado' },
          '400': { description: 'Invalid request' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Time ou jogador não encontrado' },
        },
      },
    },
    '/api/teams/{id}/players/{playerId}': {
      delete: {
        summary: 'Remover jogador do time',
        tags: ['Teams'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
          {
            name: 'playerId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'Jogador removido' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Time ou jogador não encontrado' },
        },
      },
    },
    '/api/teams/me': {
      get: {
        summary: 'Meus times',
        tags: ['Teams'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Lista de times' },
          '401': { description: 'Unauthorized' },
        },
      },
    },

    // ==================== PLAYERS ====================
    '/api/players': {
      get: {
        summary: 'Listar jogadores',
        tags: ['Players'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Lista de jogadores' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/players/{id}': {
      get: {
        summary: 'Buscar jogador por ID',
        tags: ['Players'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'Jogador encontrado' },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Jogador não encontrado' },
        },
      },
    },

    // ==================== INVITES ====================
    '/api/invites': {
      post: {
        summary: 'Criar convite para jogador participar do time',
        tags: ['Invites'],
        security: [{ bearerAuth: [] }],
        description:
          '**Criar Convite de Time**\n\n' +
          'Gera um código de convite para jogadores participarem do time. O convite pode ser único (1 uso) ou reutilizável (N usos).\n\n' +
          '**Comportamento:**\n' +
          '- `maxUses=1`: Convite único (invalidado após 1 uso)\n' +
          '- `maxUses=N`: Convite reutilizável (pode ser usado N vezes)\n' +
          '- `expiresAt` opcional: Data de expiração do convite\n' +
          '- Código gerado automaticamente pelo backend\n' +
          '- Quando `uses >= maxUses`, o convite é automaticamente invalidado\n\n' +
          '**Permissões:** Requer role MANAGER do time especificado',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  teamId: {
                    type: 'string',
                    format: 'uuid',
                    description: 'ID do time para o qual o convite será criado',
                  },
                  maxUses: {
                    type: 'integer',
                    minimum: 1,
                    default: 1,
                    description: 'Número máximo de usos do convite (padrão: 1)',
                  },
                  expiresAt: {
                    type: 'string',
                    format: 'date-time',
                    description: 'Data de expiração do convite (opcional)',
                  },
                },
                required: ['teamId'],
              },
              examples: {
                uniqueInvite: {
                  summary: 'Convite único',
                  value: {
                    teamId: '4803e1e9-5011-4ef8-8e6c-f222f069a9ca',
                    maxUses: 1,
                  },
                },
                groupInvite: {
                  summary: 'Convite para grupo (reutilizável)',
                  value: {
                    teamId: '4803e1e9-5011-4ef8-8e6c-f222f069a9ca',
                    maxUses: 20,
                    expiresAt: '2025-12-31T23:59:59Z',
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Convite criado com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    code: { type: 'string', description: 'Código do convite (compartilhar com jogadores)' },
                    teamId: { type: 'string', format: 'uuid' },
                    maxUses: { type: 'integer' },
                    uses: { type: 'integer', description: 'Número de usos até o momento' },
                    isActive: { type: 'boolean' },
                    expiresAt: { type: 'string', format: 'date-time', nullable: true },
                    createdAt: { type: 'string', format: 'date-time' },
                  },
                },
                example: {
                  id: 'abc123-def456',
                  code: 'ABC123XYZ',
                  teamId: '4803e1e9-5011-4ef8-8e6c-f222f069a9ca',
                  maxUses: 1,
                  uses: 0,
                  isActive: true,
                  expiresAt: null,
                  createdAt: '2025-11-22T10:30:00Z',
                },
              },
            },
          },
          '400': { description: 'Dados inválidos (teamId obrigatório)' },
          '401': { description: 'Não autenticado' },
          '403': { description: 'Não é MANAGER do time especificado' },
        },
      },
      get: {
        summary: 'Listar convites do time',
        tags: ['Invites'],
        security: [{ bearerAuth: [] }],
        description:
          '**Listar Convites do Time**\n\n' +
          'Retorna todos os convites criados para o time (ativos e inativos).\n\n' +
          '**Informações retornadas:**\n' +
          '- Código do convite\n' +
          '- Status: `uses/maxUses` (ex: 3/10)\n' +
          '- `isActive: false` quando `uses >= maxUses` ou expirado\n' +
          '- Data de criação e expiração\n\n' +
          '**Permissões:** Requer role MANAGER do time especificado',
        parameters: [
          {
            name: 'teamId',
            in: 'query',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'ID do time para listar convites',
            example: '4803e1e9-5011-4ef8-8e6c-f222f069a9ca',
          },
        ],
        responses: {
          '200': {
            description: 'Lista de convites do time',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    invitations: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string', format: 'uuid' },
                          code: { type: 'string' },
                          teamId: { type: 'string', format: 'uuid' },
                          maxUses: { type: 'integer' },
                          uses: { type: 'integer' },
                          isActive: { type: 'boolean' },
                          expiresAt: { type: 'string', format: 'date-time', nullable: true },
                          createdAt: { type: 'string', format: 'date-time' },
                        },
                      },
                    },
                  },
                },
                example: {
                  invitations: [
                    {
                      id: 'abc123',
                      code: 'ABC123XYZ',
                      teamId: '4803e1e9-5011-4ef8-8e6c-f222f069a9ca',
                      maxUses: 1,
                      uses: 0,
                      isActive: true,
                      expiresAt: null,
                      createdAt: '2025-11-22T10:30:00Z',
                    },
                    {
                      id: 'def456',
                      code: 'XYZ789ABC',
                      teamId: '4803e1e9-5011-4ef8-8e6c-f222f069a9ca',
                      maxUses: 10,
                      uses: 3,
                      isActive: true,
                      expiresAt: '2025-12-31T23:59:59Z',
                      createdAt: '2025-11-20T08:00:00Z',
                    },
                  ],
                },
              },
            },
          },
          '401': { description: 'Não autenticado' },
          '403': { description: 'Não é MANAGER do time especificado' },
        },
      },
    },
    '/api/invites/{code}/revoke': {
      post: {
        summary: 'Revogar convite',
        tags: ['Invites'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'code',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'Convite revogado' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Convite não encontrado' },
        },
      },
    },

    // ==================== EVALUATIONS ====================
    '/api/evaluations/team/{teamId}': {
      get: {
        summary: 'Listar avaliações do time',
        tags: ['Evaluations'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'teamId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'Lista de avaliações' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
        },
      },
    },

    // ==================== LEAGUES ====================
    '/api/leagues': {
      get: {
        summary: 'Listar ligas públicas',
        tags: ['Leagues'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Lista de ligas' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/leagues/me': {
      get: {
        summary: 'Minhas ligas',
        tags: ['Leagues'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Lista de ligas' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/leagues/{id}': {
      get: {
        summary: 'Detalhes da liga',
        tags: ['Leagues'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'Detalhes da liga' },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Liga não encontrada' },
        },
      },
    },

    // ==================== MATCHES ====================
    '/api/matches/{matchId}/lineup': {
      post: {
        summary: 'Definir escalação da partida',
        tags: ['Matches'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'matchId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  teamId: { type: 'string' },
                  players: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        playerId: { type: 'string' },
                        positionId: { type: 'string' },
                      },
                    },
                  },
                },
                required: ['teamId', 'players'],
              },
            },
          },
        },
        responses: {
          '201': { description: 'Escalação definida' },
          '400': { description: 'Invalid request' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
        },
      },
    },
  },
};
