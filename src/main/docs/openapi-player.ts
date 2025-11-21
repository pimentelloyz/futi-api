/**
 * OpenAPI Documentation - Player App
 *
 * Documentação dos endpoints específicos para o aplicativo do jogador
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

export const openapiPlayer: OpenAPIObject = {
  openapi: '3.1.0',
  info: {
    title: 'futi-api - Player App',
    version: '0.1.0',
    description: 'Endpoints do aplicativo do jogador',
  },
  servers: [{ url: 'http://localhost:3000' }],
  tags: [
    { name: 'Auth', description: 'Autenticação e tokens para jogadores' },
    { name: 'Teams', description: 'Gerenciamento de times' },
    { name: 'Players', description: 'Gerenciamento de jogadores' },
    { name: 'Access', description: 'Controle de acesso e permissões' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          '🔐 **Autenticação via JWT**: Sua role (PLAYER, FAN, etc) está incluída automaticamente no token JWT obtido via `/api/auth/firebase/exchange`. Não é necessário passar a role manualmente - ela é extraída do token pelo servidor. Endpoints protegidos verificam se você tem a role adequada.',
      },
    },
  },
  paths: {
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
    '/api/teams': {
      post: {
        summary: 'Criar time',
        tags: ['Teams'],
        security: [{ bearerAuth: [] }],
        description:
          '**Roles permitidas**: FAN, PLAYER, MANAGER, ADMIN\n\nJogadores e torcedores podem criar seus próprios times. O criador automaticamente recebe a role MANAGER do time.\n\n⚠️ **Importante**: A role é verificada automaticamente através do token JWT - não envie a role no body da request.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', description: 'Nome do time' },
                  icon: { type: ['string', 'null'], description: 'URL do ícone do time' },
                  description: {
                    type: ['string', 'null'],
                    description: 'Descrição do time',
                  },
                },
                required: ['name'],
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Time criado com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    icon: { type: ['string', 'null'] },
                    description: { type: ['string', 'null'] },
                    isActive: { type: 'boolean' },
                    createdAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
          '400': { description: 'Dados inválidos' },
          '401': { description: 'Não autenticado' },
          '403': { description: 'Sem permissão' },
        },
      },
    },
    '/api/players': {
      post: {
        summary: 'Create a player',
        tags: ['Players'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  positionSlug: { type: 'string' },
                  number: { type: 'integer' },
                  isActive: { type: 'string', enum: ['true', 'false'] },
                  teamId: { type: 'string', description: 'Single team ID (preferred)' },
                  teamIds: { type: 'string', description: 'Comma-separated team IDs (deprecated)' },
                  file: { type: 'string', format: 'binary', description: 'PNG/JPEG/WEBP, <=2MB' },
                },
                required: ['name'],
              },
            },
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  positionSlug: { type: ['string', 'null'] },
                  number: { type: ['integer', 'null'] },
                  isActive: { type: 'boolean' },
                  teamId: { type: 'string', description: 'Single team ID (preferred)' },
                  teamIds: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Optional list of team IDs to associate (deprecated)',
                  },
                },
                required: ['name'],
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { id: { type: 'string' } },
                },
              },
            },
          },
          '400': { description: 'Bad Request' },
          '401': { description: 'Unauthorized' },
          '500': { description: 'Internal Error' },
        },
      },
    },
    '/api/players/me': {
      get: {
        summary: 'Get my player profile',
        tags: ['Players'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Player profile',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    photo: { type: ['string', 'null'] },
                    positionSlug: { type: ['string', 'null'] },
                    position: {
                      type: ['object', 'null'],
                      properties: {
                        slug: { type: 'string' },
                        name: { type: 'string' },
                        description: { type: ['string', 'null'] },
                      },
                    },
                    number: { type: ['integer', 'null'] },
                    isActive: { type: 'boolean' },
                  },
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Player not found' },
        },
      },
      patch: {
        summary: 'Update my player profile',
        tags: ['Players'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  positionSlug: { type: ['string', 'null'] },
                  number: {
                    type: ['integer', 'null'],
                    description: "Também aceita o alias 'numero' (pt-BR)",
                  },
                },
                additionalProperties: false,
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Updated profile',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    photo: { type: ['string', 'null'] },
                    positionSlug: { type: ['string', 'null'] },
                    position: {
                      type: ['object', 'null'],
                      properties: {
                        slug: { type: 'string' },
                        name: { type: 'string' },
                        description: { type: ['string', 'null'] },
                      },
                    },
                    number: { type: ['integer', 'null'] },
                    isActive: { type: 'boolean' },
                  },
                },
              },
            },
          },
          '400': { description: 'Bad Request' },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Player not found' },
        },
      },
      post: {
        summary: 'Create my player if missing (idempotent)',
        tags: ['Players'],
        description:
          'Cria o perfil de jogador para o usuário autenticado caso ainda não exista. Alternativamente, o perfil pode ser criado automaticamente via /api/auth/firebase/exchange com role=PLAYER ou via /api/users/init com role=PLAYER.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  positionSlug: { type: 'string' },
                  number: { type: 'integer' },
                  teamId: { type: 'string', description: 'Single team ID (preferred)' },
                  teamIds: { type: 'string', description: 'Comma-separated team IDs (deprecated)' },
                  file: { type: 'string', format: 'binary', description: 'PNG/JPEG/WEBP, <=2MB' },
                },
                required: ['name'],
              },
            },
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  positionSlug: { type: ['string', 'null'] },
                  number: { type: ['integer', 'null'] },
                  teamId: { type: 'string', description: 'Single team ID (preferred)' },
                  teamIds: { type: 'array', items: { type: 'string' }, description: 'Deprecated' },
                },
                required: ['name'],
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Created or already existed',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { id: { type: 'string' } } },
              },
            },
          },
          '400': { description: 'Bad Request' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/players/me/exists': {
      get: {
        summary: 'Check if my player exists',
        tags: ['Players'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Player exists' },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Player not found' },
        },
      },
    },
    '/api/players/{id}/photo': {
      post: {
        summary: 'Upload player profile photo',
        description:
          'Substitui a foto anterior do jogador. O arquivo é salvo com nome determinístico em players/{id}/{id}.{ext} (ext: png/jpg/webp) e uma URL estável é retornada. Para evitar cache agressivo no cliente, usamos cache-control: no-cache, max-age=0. Envie o arquivo no campo multipart "file" (PNG/JPEG/WEBP, até 2MB).',
        tags: ['Players'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file: { type: 'string', format: 'binary', description: 'PNG/JPEG/WEBP, <=2MB' },
                },
                required: ['file'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Photo uploaded',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { photoUrl: { type: 'string' } } },
              },
            },
          },
          '400': { description: 'Invalid request' },
          '401': { description: 'Unauthorized' },
          '415': { description: 'Unsupported media type' },
          '500': { description: 'Internal Error' },
        },
      },
    },
    '/api/players/me/skills': {
      post: {
        summary: 'Upsert my player skills (graph metrics)',
        tags: ['Players'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  preferredFoot: { type: 'string', enum: ['LEFT', 'RIGHT', 'BOTH'] },
                  attack: { type: 'integer', minimum: 0, maximum: 100 },
                  defense: { type: 'integer', minimum: 0, maximum: 100 },
                  shooting: { type: 'integer', minimum: 0, maximum: 100 },
                  ballControl: { type: 'integer', minimum: 0, maximum: 100 },
                  pace: { type: 'integer', minimum: 0, maximum: 100 },
                  passing: { type: 'integer', minimum: 0, maximum: 100 },
                  dribbling: { type: 'integer', minimum: 0, maximum: 100 },
                  physical: { type: 'integer', minimum: 0, maximum: 100 },
                },
                required: ['preferredFoot', 'attack', 'defense', 'shooting', 'ballControl', 'pace'],
              },
            },
          },
        },
        responses: {
          '201': { description: 'Created/Updated' },
          '400': { description: 'Invalid' },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Player not found' },
        },
      },
    },
    '/api/players/me/graph': {
      get: {
        summary: 'Get my player graph data',
        tags: ['Players'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Graph metrics',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    preferredFoot: { type: 'string' },
                    attack: { type: 'integer' },
                    defense: { type: 'integer' },
                    shooting: { type: 'integer' },
                    ballControl: { type: 'integer' },
                    pace: { type: 'integer' },
                    passing: { type: 'integer' },
                    dribbling: { type: 'integer' },
                    physical: { type: 'integer' },
                    updatedAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Player/skills not found' },
        },
      },
    },
    '/api/players/me/team/overview': {
      get: {
        summary: 'Overview of my team: recent matches and next game',
        tags: ['Players'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'teamId', in: 'query', schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'Team overview payload',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    team: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        icon: { type: ['string', 'null'] },
                        description: { type: ['string', 'null'] },
                        isActive: { type: 'boolean' },
                      },
                    },
                    players: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          positionSlug: { type: ['string', 'null'] },
                          number: { type: ['integer', 'null'] },
                          isActive: { type: 'boolean' },
                        },
                      },
                    },
                    recentMatches: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          scheduledAt: { type: 'string', format: 'date-time' },
                          status: { type: 'string' },
                          venue: { type: ['string', 'null'] },
                          homeTeamId: { type: 'string' },
                          awayTeamId: { type: 'string' },
                          homeScore: { type: 'integer' },
                          awayScore: { type: 'integer' },
                        },
                      },
                    },
                    next_game: {
                      oneOf: [
                        {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            scheduledAt: { type: 'string', format: 'date-time' },
                            venue: { type: ['string', 'null'] },
                            homeTeamId: { type: 'string' },
                            awayTeamId: { type: 'string' },
                          },
                        },
                        { type: 'null' },
                      ],
                    },
                    evaluationBanner: {
                      oneOf: [
                        { type: 'null' },
                        {
                          type: 'object',
                          properties: {
                            match: {
                              type: 'object',
                              properties: {
                                id: { type: 'string' },
                                scheduledAt: { type: 'string', format: 'date-time' },
                                status: { type: 'string' },
                                venue: { type: ['string', 'null'] },
                                homeTeamId: { type: 'string' },
                                awayTeamId: { type: 'string' },
                                homeScore: { type: 'integer' },
                                awayScore: { type: 'integer' },
                              },
                              required: [
                                'id',
                                'scheduledAt',
                                'status',
                                'homeTeamId',
                                'awayTeamId',
                                'homeScore',
                                'awayScore',
                              ],
                            },
                            pendingCount: { type: 'integer', minimum: 0 },
                            expiresAt: { type: 'string', format: 'date-time' },
                            players: {
                              type: ['array', 'null'],
                              items: {
                                type: 'object',
                                properties: {
                                  id: { type: 'string' },
                                  name: { type: 'string' },
                                  positionSlug: { type: ['string', 'null'] },
                                  number: { type: ['integer', 'null'] },
                                  isActive: { type: 'boolean' },
                                },
                                required: ['id', 'name', 'isActive'],
                              },
                            },
                          },
                          required: ['match', 'pendingCount', 'expiresAt'],
                        },
                      ],
                    },
                  },
                  required: ['team', 'players', 'recentMatches', 'next_game'],
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Player not found / No team' },
        },
      },
    },
    '/api/players/me/evaluation/banner': {
      get: {
        summary: 'Get evaluation banner for my recent match (last 24h)',
        tags: ['Players'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'teamId', in: 'query', schema: { type: 'string' } },
          { name: 'includePlayers', in: 'query', schema: { type: 'boolean' } },
        ],
        responses: {
          '200': {
            description: 'Evaluation banner or null',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    evaluationBanner: {
                      oneOf: [
                        { type: 'null' },
                        {
                          type: 'object',
                          properties: {
                            match: {
                              type: 'object',
                              properties: {
                                id: { type: 'string' },
                                scheduledAt: { type: 'string', format: 'date-time' },
                                status: { type: 'string' },
                                venue: { type: ['string', 'null'] },
                                homeTeamId: { type: 'string' },
                                awayTeamId: { type: 'string' },
                                homeScore: { type: 'integer' },
                                awayScore: { type: 'integer' },
                              },
                              required: [
                                'id',
                                'scheduledAt',
                                'status',
                                'homeTeamId',
                                'awayTeamId',
                                'homeScore',
                                'awayScore',
                              ],
                            },
                            pendingCount: { type: 'integer', minimum: 0 },
                            expiresAt: { type: 'string', format: 'date-time' },
                            players: {
                              type: ['array', 'null'],
                              items: {
                                type: 'object',
                                properties: {
                                  id: { type: 'string' },
                                  name: { type: 'string' },
                                  positionSlug: { type: ['string', 'null'] },
                                  number: { type: ['integer', 'null'] },
                                  isActive: { type: 'boolean' },
                                },
                                required: ['id', 'name', 'isActive'],
                              },
                            },
                          },
                          required: ['match', 'pendingCount', 'expiresAt'],
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Player not found / No team memberships' },
        },
      },
    },
    '/api/players/me/evaluations/pending': {
      get: {
        summary: 'List pending evaluations context (recent match within 24h)',
        tags: ['Players'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Pending evaluations context',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    match: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        scheduledAt: { type: 'string', format: 'date-time' },
                        status: { type: 'string' },
                        venue: { type: ['string', 'null'] },
                        homeTeamId: { type: 'string' },
                        awayTeamId: { type: 'string' },
                        homeScore: { type: 'integer' },
                        awayScore: { type: 'integer' },
                      },
                      required: [
                        'id',
                        'scheduledAt',
                        'status',
                        'homeTeamId',
                        'awayTeamId',
                        'homeScore',
                        'awayScore',
                      ],
                    },
                    teamId: { type: 'string' },
                    evaluatorPlayerId: { type: 'string' },
                    expiresAt: { type: 'string', format: 'date-time' },
                    players: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          positionSlug: { type: ['string', 'null'] },
                          number: { type: ['integer', 'null'] },
                          isActive: { type: 'boolean' },
                        },
                        required: ['id', 'name', 'isActive'],
                      },
                    },
                  },
                  required: ['match', 'teamId', 'evaluatorPlayerId', 'expiresAt', 'players'],
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Player not found / No team / No recent match' },
          '410': { description: 'Evaluation expired' },
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
  },
};
