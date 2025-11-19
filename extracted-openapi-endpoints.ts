// Extracted OpenAPI 3.1.0 endpoints from futi-api
// This file contains the complete definitions for specific endpoints

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

export const extractedOpenAPI: OpenAPIObject = {
  openapi: '3.1.0',
  info: {
    title: 'futi-api (Extracted Endpoints)',
    version: '0.1.0',
    description: 'Extracted specific endpoints from Football matches control API',
  },
  servers: [{ url: 'http://localhost:3000' }],
  tags: [
    { name: 'Health', description: 'Healthcheck e status do serviço' },
    { name: 'Auth', description: 'Autenticação e tokens' },
    { name: 'Users', description: 'Gerenciamento de usuários' },
    { name: 'Access', description: 'Controle de acesso e permissões' },
    { name: 'League Formats', description: 'Formatos de campeonato' },
    { name: 'Leagues', description: 'Gerenciamento de ligas' },
    { name: 'Discipline Rules', description: 'Regras disciplinares' },
    { name: 'Standings', description: 'Classificação e tabelas' },
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
    // ==================== HEALTH ====================
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

    // ==================== AUTH ====================
    '/api/auth/firebase/exchange': {
      post: {
        summary: 'Exchange Firebase idToken for internal JWT',
        tags: ['Auth'],
        description:
          'Troca idToken do Firebase por accessToken/refreshToken internos (cookie HttpOnly incluído). Se role=PLAYER for enviado, garante a criação automática do perfil de jogador vinculado ao usuário.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  idToken: { type: 'string' },
                  role: { type: 'string', enum: ['PLAYER'] },
                },
                required: ['idToken'],
              },
              examples: {
                basic: {
                  summary: 'Apenas troca de token',
                  value: { idToken: 'eyJhbGciOiJSUzI1NiIsInR5cCI...' },
                },
                withPlayer: {
                  summary: 'Troca + cria perfil de jogador',
                  value: { idToken: 'eyJhbGciOiJSUzI1NiIsInR5cCI...', role: 'PLAYER' },
                },
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
                  properties: { accessToken: { type: 'string' }, refreshToken: { type: 'string' } },
                },
                examples: {
                  success: {
                    value: {
                      accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                      refreshToken: 'futi_rt_9f0c4e9a-3a52-4f1c-a1ef-3f4b...',
                    },
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

    '/api/auth/firebase/exchange-admin': {
      post: {
        summary: 'Exchange (painel admin) - requer ADMIN/MANAGER/ASSISTANT',
        tags: ['Auth'],
        description:
          'Troca idToken do Firebase por tokens internos APENAS se o usuário possuir uma role administrativa (ADMIN, MANAGER ou ASSISTANT). Não cria perfil de jogador.',
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
              examples: {
                adminPanel: {
                  value: { idToken: 'eyJhbGciOiJSUzI1NiIsInR5cCI...' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Successful exchange (admin panel)',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { accessToken: { type: 'string' }, refreshToken: { type: 'string' } },
                },
                examples: {
                  success: {
                    value: {
                      accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                      refreshToken: 'futi_rt_3b6a1c1d-4d8b-4c35-99fc-2e88...',
                    },
                  },
                },
              },
            },
          },
          '400': { description: 'Invalid request' },
          '401': { description: 'Invalid token' },
          '403': { description: 'Not authorized (requires admin/manager/assistant)' },
        },
      },
    },

    '/api/auth/refresh': {
      post: {
        summary: 'Refresh access token (rotates refresh token)',
        tags: ['Auth'],
        description:
          'Aceita refreshToken no body ou via cookie HttpOnly. Gera novo accessToken e substitui o refreshToken (rotação).',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { refreshToken: { type: 'string' } },
                required: ['refreshToken'],
              },
              examples: {
                body: {
                  summary: 'Via body',
                  value: { refreshToken: 'futi_rt_9f0c4e9a-3a52-4f1c-a1ef-3f4b...' },
                },
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
                  properties: { accessToken: { type: 'string' }, refreshToken: { type: 'string' } },
                },
                examples: {
                  success: {
                    value: {
                      accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                      refreshToken: 'futi_rt_7aa1cdae-5b5f-4e9c-81f1-6a33...',
                    },
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
        description:
          'Aceita refreshToken no body ou usa cookie HttpOnly para revogar o token atual.',
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { refreshToken: { type: 'string' } },
              },
              examples: {
                body: {
                  value: { refreshToken: 'futi_rt_c8b2b6f1-2f4a-46f3-b2f7-1d22...' },
                },
              },
            },
          },
        },
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

    // ==================== USERS ====================
    '/api/users/init': {
      post: {
        summary: 'Inicializa usuário a partir de Firebase idToken (sem emitir tokens)',
        tags: ['Users'],
        description:
          'Cria (ou assegura) um usuário com base no idToken do Firebase e, opcionalmente, cria o perfil de jogador se role=PLAYER for enviado. Não gera tokens; retorna os dados do usuário e playerId quando aplicável. Útil para provisionamento na primeira abertura do app.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  idToken: { type: 'string' },
                  role: {
                    type: 'string',
                    enum: ['PLAYER'],
                    description: 'Se PLAYER, cria perfil de jogador vinculado.',
                  },
                },
                required: ['idToken'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Usuário inicializado',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    firebaseUid: { type: 'string' },
                    email: { type: ['string', 'null'] },
                    displayName: { type: ['string', 'null'] },
                    playerId: { type: ['string', 'null'] },
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

    '/api/users/me': {
      get: {
        summary: 'Get my user profile',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'User profile',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    firebaseUid: { type: 'string' },
                    email: { type: ['string', 'null'] },
                    displayName: { type: ['string', 'null'] },
                    playerId: { type: ['string', 'null'] },
                  },
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
          '404': { description: 'User not found' },
        },
      },
    },

    '/api/users/me/push-tokens': {
      post: {
        summary: 'Register or update a push notification token for the current user',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  token: { type: 'string', minLength: 10 },
                  platform: { type: 'string', enum: ['ios', 'android', 'web'] },
                },
                required: ['token'],
              },
              example: {
                token: 'fcm_device_token_example',
                platform: 'android',
              },
            },
          },
        },
        responses: {
          '204': { description: 'Registered' },
          '400': {
            description: 'Invalid body',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
            },
          },
          '500': {
            description: 'Internal error',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
            },
          },
        },
      },
    },

    // ==================== ACCESS ====================
    '/api/access/grant': {
      post: {
        summary: 'Grant access role',
        tags: ['Access'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  userId: { type: 'string' },
                  role: { type: 'string', enum: ['ADMIN', 'MANAGER', 'ASSISTANT', 'PLAYER'] },
                  teamId: { type: ['string', 'null'] },
                },
                required: ['userId', 'role'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Granted',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { membership: { type: 'object' } } },
              },
            },
          },
          '400': { description: 'Invalid request' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden (admin only)' },
        },
      },
    },

    '/api/access/revoke': {
      post: {
        summary: 'Revoke access role',
        tags: ['Access'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  userId: { type: 'string' },
                  role: { type: 'string', enum: ['ADMIN', 'MANAGER', 'ASSISTANT', 'PLAYER'] },
                  teamId: { type: ['string', 'null'] },
                },
                required: ['userId', 'role'],
              },
            },
          },
        },
        responses: {
          '200': { description: 'Revoked' },
          '400': { description: 'Invalid request' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden (admin only)' },
        },
      },
    },

    '/api/access/me': {
      get: {
        summary: 'List my access memberships',
        tags: ['Access'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'List of memberships with team data',
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
                          userId: { type: 'string' },
                          teamId: { type: ['string', 'null'] },
                          role: {
                            type: 'string',
                            enum: ['ADMIN', 'MANAGER', 'ASSISTANT', 'PLAYER'],
                          },
                          createdAt: { type: 'string', format: 'date-time' },
                          team: {
                            type: ['object', 'null'],
                            properties: {
                              id: { type: 'string' },
                              name: { type: 'string' },
                              icon: { type: ['string', 'null'] },
                              description: { type: ['string', 'null'] },
                              isActive: { type: 'boolean' },
                            },
                          },
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

    // ==================== LEAGUE FORMATS ====================
    '/api/formats': {
      get: {
        summary: 'Listar formatos de campeonato',
        description:
          'Lista todos os formatos de campeonato disponíveis (templates e personalizados)',
        tags: ['League Formats'],
        parameters: [
          {
            name: 'templatesOnly',
            in: 'query',
            schema: { type: 'boolean' },
            description: 'Se true, retorna apenas templates pré-configurados (default: false)',
          },
        ],
        responses: {
          '200': {
            description: 'Lista de formatos',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      slug: { type: 'string' },
                      type: {
                        type: 'string',
                        enum: ['ROUND_ROBIN', 'KNOCKOUT', 'MIXED', 'LEAGUE_PHASE', 'CUSTOM'],
                      },
                      description: { type: ['string', 'null'] },
                      isTemplate: { type: 'boolean' },
                      phases: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            name: { type: 'string' },
                            order: { type: 'integer' },
                            type: {
                              type: 'string',
                              enum: ['GROUP_STAGE', 'KNOCKOUT', 'LEAGUE', 'PLAYOFF'],
                            },
                            teamsCount: { type: ['integer', 'null'] },
                            groupsCount: { type: ['integer', 'null'] },
                            hasHomeAway: { type: 'boolean' },
                            hasExtraTime: { type: 'boolean' },
                            hasPenalties: { type: 'boolean' },
                            advancingTeams: { type: ['integer', 'null'] },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '500': { description: 'Internal Error' },
        },
      },
      post: {
        summary: 'Criar novo formato de campeonato',
        description:
          'Cria um novo formato personalizado com suas fases e regras de desempate (apenas ADMIN)',
        tags: ['League Formats'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'slug', 'type', 'phases'],
                properties: {
                  name: { type: 'string', example: 'Copa Regional' },
                  slug: { type: 'string', example: 'copa-regional' },
                  type: {
                    type: 'string',
                    enum: ['ROUND_ROBIN', 'KNOCKOUT', 'MIXED', 'LEAGUE_PHASE', 'CUSTOM'],
                  },
                  description: { type: ['string', 'null'] },
                  isTemplate: { type: 'boolean', default: true },
                  phases: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['name', 'order', 'type', 'tiebreakRules'],
                      properties: {
                        name: { type: 'string' },
                        order: { type: 'integer', minimum: 1 },
                        type: {
                          type: 'string',
                          enum: ['GROUP_STAGE', 'KNOCKOUT', 'LEAGUE', 'PLAYOFF'],
                        },
                        teamsCount: { type: ['integer', 'null'] },
                        groupsCount: { type: ['integer', 'null'] },
                        hasHomeAway: { type: 'boolean', default: false },
                        hasExtraTime: { type: 'boolean', default: false },
                        hasPenalties: { type: 'boolean', default: false },
                        hasAwayGoal: { type: 'boolean', default: false },
                        advancingTeams: { type: ['integer', 'null'] },
                        tiebreakRules: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              order: { type: 'integer' },
                              criterion: {
                                type: 'string',
                                enum: [
                                  'POINTS',
                                  'WINS',
                                  'GOAL_DIFFERENCE',
                                  'GOALS_FOR',
                                  'HEAD_TO_HEAD_POINTS',
                                  'FAIR_PLAY',
                                  'DRAW',
                                ],
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Formato criado com sucesso' },
          '400': { description: 'Dados inválidos' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden (não é ADMIN)' },
          '409': { description: 'Slug já existe' },
          '500': { description: 'Internal Error' },
        },
      },
    },

    '/api/formats/{id}': {
      get: {
        summary: 'Obter detalhes de um formato',
        tags: ['League Formats'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Formato encontrado' },
          '404': { description: 'Formato não encontrado' },
          '500': { description: 'Internal Error' },
        },
      },
      patch: {
        summary: 'Atualizar metadados de um formato',
        description: 'Atualiza nome, descrição e status de template (apenas ADMIN)',
        tags: ['League Formats'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: ['string', 'null'] },
                  isTemplate: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Formato atualizado' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Formato não encontrado' },
          '500': { description: 'Internal Error' },
        },
      },
      delete: {
        summary: 'Deletar um formato',
        description: 'Remove um formato se não estiver sendo usado por nenhuma liga (apenas ADMIN)',
        tags: ['League Formats'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '204': { description: 'Formato deletado' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Formato não encontrado' },
          '409': { description: 'Formato em uso por ligas' },
          '500': { description: 'Internal Error' },
        },
      },
    },

    '/api/leagues/{leagueId}/apply-format/{formatId}': {
      post: {
        summary: 'Aplicar formato a uma liga',
        description:
          'Aplica um formato template a uma liga, criando automaticamente suas fases (ADMIN ou LEAGUE_MANAGER)',
        tags: ['League Formats'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'leagueId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'formatId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Formato aplicado com sucesso' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Liga ou formato não encontrado' },
          '409': { description: 'Liga já possui um formato' },
          '500': { description: 'Internal Error' },
        },
      },
    },

    // ==================== LEAGUES - CONFIGURATION ====================
    '/api/leagues/{id}/config-status': {
      get: {
        summary: 'Verificar status de configuração da liga',
        description:
          'Retorna lista de steps necessários para configurar a liga baseado no formato escolhido (Pontos Corridos, Copa do Brasil, Libertadores, etc). Cada step indica se foi completado e se é obrigatório.',
        tags: ['Leagues'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'Status de configuração',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    leagueId: { type: 'string' },
                    leagueName: { type: 'string' },
                    formatName: { type: 'string' },
                    formatType: {
                      type: 'string',
                      enum: ['ROUND_ROBIN', 'KNOCKOUT', 'MIXED', 'LEAGUE_PHASE', 'CUSTOM'],
                    },
                    isConfigured: {
                      type: 'boolean',
                      description: 'Se todos os steps obrigatórios foram completados',
                    },
                    completionPercentage: { type: 'integer', minimum: 0, maximum: 100 },
                    steps: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string', description: 'Identificador único do step' },
                          title: { type: 'string', description: 'Título do step' },
                          description: { type: 'string', description: 'Descrição detalhada' },
                          completed: { type: 'boolean', description: 'Se o step foi completado' },
                          required: {
                            type: 'boolean',
                            description: 'Se o step é obrigatório',
                          },
                          order: { type: 'integer', description: 'Ordem de execução' },
                        },
                        required: [
                          'id',
                          'title',
                          'description',
                          'completed',
                          'required',
                          'order',
                        ],
                      },
                    },
                  },
                  required: [
                    'leagueId',
                    'leagueName',
                    'formatName',
                    'formatType',
                    'isConfigured',
                    'completionPercentage',
                    'steps',
                  ],
                },
                example: {
                  leagueId: 'league_123',
                  leagueName: 'Brasileirão 2025',
                  formatName: 'Pontos Corridos',
                  formatType: 'ROUND_ROBIN',
                  isConfigured: false,
                  completionPercentage: 60,
                  steps: [
                    {
                      id: 'league_created',
                      title: 'Liga criada',
                      description: 'A liga foi criada com sucesso',
                      completed: true,
                      required: true,
                      order: 1,
                    },
                    {
                      id: 'format_selected',
                      title: 'Formato selecionado',
                      description: 'Formato "Pontos Corridos" configurado',
                      completed: true,
                      required: true,
                      order: 2,
                    },
                    {
                      id: 'teams_confirmed',
                      title: 'Times confirmados',
                      description: '12/20 times confirmados na liga',
                      completed: false,
                      required: true,
                      order: 3,
                    },
                    {
                      id: 'invites_created',
                      title: 'Criar convites',
                      description: '3 convite(s) ativo(s) criado(s)',
                      completed: true,
                      required: false,
                      order: 4,
                    },
                    {
                      id: 'generate_fixtures',
                      title: 'Gerar calendário de jogos',
                      description: 'Gere as partidas de ida e volta',
                      completed: false,
                      required: true,
                      order: 10,
                    },
                  ],
                },
              },
            },
          },
          '400': { description: 'Liga sem formato configurado' },
          '401': { description: 'Não autorizado' },
          '404': { description: 'Liga não encontrada' },
          '500': { description: 'Erro interno' },
        },
      },
    },

    // ==================== DISCIPLINE ====================
    '/api/leagues/{leagueId}/discipline-rules': {
      get: {
        summary: 'Obter regras de disciplina de uma liga',
        tags: ['Discipline Rules'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'leagueId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'Regras de disciplina',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    leagueId: { type: 'string' },
                    yellowCardsForSuspension: { type: 'integer', example: 3 },
                    yellowCardsAccumulation: { type: 'boolean' },
                    resetYellowsAfterPhaseOrder: { type: ['integer', 'null'] },
                    redCardMinimumGames: { type: 'integer', example: 1 },
                    doubleYellowGames: { type: 'integer', example: 1 },
                  },
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Regras não encontradas' },
          '500': { description: 'Internal Error' },
        },
      },
      post: {
        summary: 'Criar ou atualizar regras de disciplina',
        description: 'Define ou atualiza regras de cartões para uma liga (ADMIN ou LEAGUE_MANAGER)',
        tags: ['Discipline Rules'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'leagueId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  yellowCardsForSuspension: { type: 'integer', example: 3 },
                  resetYellowsAfterPhaseOrder: { type: ['integer', 'null'], example: 4 },
                  redCardMinimumGames: { type: 'integer', example: 1 },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Regras criadas/atualizadas' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Liga não encontrada' },
          '500': { description: 'Internal Error' },
        },
      },
    },

    '/api/leagues/{leagueId}/players/{playerId}/suspension-check': {
      get: {
        summary: 'Verificar se jogador está suspenso',
        description: 'Calcula automaticamente se um jogador está suspenso por acúmulo de cartões',
        tags: ['Discipline Rules'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'leagueId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'playerId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Status de suspensão',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    playerId: { type: 'string' },
                    isSuspended: { type: 'boolean' },
                    reason: { type: ['string', 'null'] },
                    suspensionGames: { type: ['integer', 'null'] },
                    yellowCardsCount: { type: 'integer' },
                  },
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Regras não encontradas' },
          '500': { description: 'Internal Error' },
        },
      },
    },

    // ==================== STANDINGS ====================
    '/api/phases/{phaseId}/standings': {
      get: {
        summary: 'Obter classificação de uma fase',
        description: 'Retorna tabela de classificação ordenada por pontos',
        tags: ['Standings'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'phaseId', in: 'path', required: true, schema: { type: 'string' } },
          {
            name: 'groupId',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filtrar por grupo (opcional)',
          },
        ],
        responses: {
          '200': {
            description: 'Classificação',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      phaseId: { type: 'string' },
                      teamId: { type: 'string' },
                      position: { type: 'integer' },
                      played: { type: 'integer' },
                      wins: { type: 'integer' },
                      draws: { type: 'integer' },
                      losses: { type: 'integer' },
                      goalsFor: { type: 'integer' },
                      goalsAgainst: { type: 'integer' },
                      goalDifference: { type: 'integer' },
                      points: { type: 'integer' },
                      team: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          icon: { type: ['string', 'null'] },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
          '500': { description: 'Internal Error' },
        },
      },
      delete: {
        summary: 'Deletar classificação de uma fase',
        description: 'Remove toda a tabela de classificação (apenas ADMIN)',
        tags: ['Standings'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'phaseId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '204': { description: 'Classificação deletada' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
          '500': { description: 'Internal Error' },
        },
      },
    },

    '/api/phases/{phaseId}/standings/initialize': {
      post: {
        summary: 'Inicializar tabela de classificação',
        description: 'Cria tabela zerada para todos os times de uma fase (ADMIN ou LEAGUE_MANAGER)',
        tags: ['Standings'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'phaseId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  groupId: { type: ['string', 'null'] },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Classificação inicializada' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Fase não encontrada' },
          '500': { description: 'Internal Error' },
        },
      },
    },

    '/api/phases/{phaseId}/standings/process-match': {
      post: {
        summary: 'Processar resultado de partida',
        description:
          'Atualiza classificação automaticamente com resultado de uma partida (ADMIN ou LEAGUE_MANAGER)',
        tags: ['Standings'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'phaseId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['homeTeamId', 'awayTeamId', 'homeScore', 'awayScore'],
                properties: {
                  homeTeamId: { type: 'string' },
                  awayTeamId: { type: 'string' },
                  homeScore: { type: 'integer' },
                  awayScore: { type: 'integer' },
                  homeYellowCards: { type: 'integer', default: 0 },
                  awayYellowCards: { type: 'integer', default: 0 },
                  homeRedCards: { type: 'integer', default: 0 },
                  awayRedCards: { type: 'integer', default: 0 },
                  groupId: { type: ['string', 'null'] },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Resultado processado' },
          '400': { description: 'Dados inválidos' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
          '500': { description: 'Internal Error' },
        },
      },
    },

    '/api/phases/{phaseId}/standings/recalculate': {
      post: {
        summary: 'Recalcular posições da classificação',
        description: 'Reordena a tabela aplicando critérios de desempate (ADMIN ou LEAGUE_MANAGER)',
        tags: ['Standings'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'phaseId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  groupId: { type: ['string', 'null'] },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Posições recalculadas' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
          '500': { description: 'Internal Error' },
        },
      },
    },
  },
};
