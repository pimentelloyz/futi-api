/**
 * OpenAPI Documentation - Assistant (Auxiliar Técnico)
 *
 * Documentação dos endpoints para auxiliares técnicos
 * Permissões: Mesmas do MANAGER mas SOMENTE LEITURA (read-only)
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

export const openapiAssistant: OpenAPIObject = {
  openapi: '3.1.0',
  info: {
    title: 'futi-api - Assistant (Auxiliar Técnico)',
    version: '0.1.0',
    description:
      'Endpoints para auxiliares técnicos - Visualização de times, jogadores e avaliações (SOMENTE LEITURA)',
  },
  servers: [{ url: 'http://localhost:3000' }],
  tags: [
    { name: 'Health', description: 'Healthcheck e status do serviço' },
    { name: 'Auth', description: 'Autenticação e tokens' },
    { name: 'Access', description: 'Controle de acesso e permissões' },
    { name: 'Teams', description: 'Visualização de times' },
    { name: 'Players', description: 'Visualização de jogadores' },
    { name: 'Invites', description: 'Visualização de convites' },
    { name: 'Evaluations', description: 'Visualização de avaliações' },
    { name: 'Leagues', description: 'Visualização de ligas' },
    { name: 'Matches', description: 'Visualização de partidas' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
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
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  refreshToken: { type: 'string' },
                },
                required: ['refreshToken'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Tokens refreshed',
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
          '401': { description: 'Invalid refresh token' },
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

    // ==================== TEAMS (READ-ONLY) ====================
    '/api/teams': {
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

    // ==================== PLAYERS (READ-ONLY) ====================
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

    // ==================== INVITES (READ-ONLY) ====================
    '/api/invites': {
      get: {
        summary: 'Listar convites do time',
        tags: ['Invites'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'teamId',
            in: 'query',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'Lista de convites' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
        },
      },
    },

    // ==================== EVALUATIONS (READ-ONLY) ====================
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

    // ==================== LEAGUES (READ-ONLY) ====================
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

    // ==================== MATCHES (READ-ONLY) ====================
    '/api/matches': {
      get: {
        summary: 'Listar partidas',
        tags: ['Matches'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Lista de partidas' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/matches/{id}': {
      get: {
        summary: 'Detalhes da partida',
        tags: ['Matches'],
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
          '200': { description: 'Detalhes da partida' },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Partida não encontrada' },
        },
      },
    },
  },
};
