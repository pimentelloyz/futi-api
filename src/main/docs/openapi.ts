// Using a lightweight inline type (avoid runtime dependency for typing only)
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

// OpenAPI 3.1 basic doc for futi-api
export const openapi: OpenAPIObject = {
  openapi: '3.1.0',
  info: {
    title: 'futi-api',
    version: '0.1.0',
    description: 'Football matches control API',
  },
  servers: [{ url: 'http://localhost:3000' }],
  tags: [
    { name: 'Health', description: 'Verificação de status da API' },
    { name: 'Auth', description: 'Fluxos de autenticação e tokens' },
    { name: 'Positions', description: 'Posições de jogadores (tabela de referência)' },
    { name: 'Users', description: 'Gestão de usuários' },
    { name: 'Players', description: 'Jogadores e perfil do jogador' },
    { name: 'Teams', description: 'Times e composição' },
    { name: 'Matches', description: 'Partidas e placares' },
    { name: 'Access', description: 'Controle de acesso e roles' },
  ],
  components: {
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          details: { type: 'object', additionalProperties: true },
        },
      },
    },
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  paths: {
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
    '/api/teams': {
      get: {
        summary: 'Listar times',
        tags: ['Teams'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'isActive',
            in: 'query',
            required: false,
            schema: { type: 'string', enum: ['true', 'false'] },
            description: 'Filtrar por ativo/inativo',
          },
        ],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    items: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          icon: { type: 'string', nullable: true },
                          description: { type: 'string', nullable: true },
                          isActive: { type: 'boolean' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': { description: 'Parâmetros inválidos' },
          '401': { description: 'Não autorizado' },
          '500': { description: 'Erro interno' },
        },
      },
      post: {
        summary: 'Create a team',
        tags: ['Teams'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            // Coloca multipart primeiro para ser o default no Swagger UI
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  file: { type: 'string', format: 'binary' },
                  description: { type: 'string' },
                  isActive: { type: 'string', enum: ['true', 'false'] },
                },
                required: ['name'],
              },
              examples: {
                upload: {
                  summary: 'Criar time com upload de ícone',
                  value: {
                    name: 'Meu Time',
                    description: 'Time de testes',
                    isActive: 'true',
                    // file é selecionado na UI do Swagger
                  },
                },
              },
            },
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  icon: { type: 'string', format: 'uri', nullable: true },
                  description: { type: 'string', nullable: true },
                  isActive: { type: 'boolean' },
                },
                required: ['name'],
              },
              example: {
                name: 'Time JSON',
                description: 'Sem upload, apenas URL',
                icon: 'https://example.com/icon.png',
                isActive: true,
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
          '500': { description: 'Internal Error' },
        },
      },
    },
    '/api/teams/{id}': {
      patch: {
        summary: 'Editar time (parcial)',
        tags: ['Teams'],
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
                  icon: { type: 'string', nullable: true },
                  description: { type: 'string', nullable: true },
                  isActive: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Atualizado',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    icon: { type: 'string', nullable: true },
                    description: { type: 'string', nullable: true },
                    isActive: { type: 'boolean' },
                  },
                },
              },
            },
          },
          '400': { description: 'Corpo inválido' },
          '401': { description: 'Não autorizado' },
          '404': { description: 'Time não encontrado' },
          '500': { description: 'Erro interno' },
        },
      },
      delete: {
        summary: 'Soft delete do time (isActive=false)',
        tags: ['Teams'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '204': { description: 'Removido (soft) com sucesso' },
          '401': { description: 'Não autorizado' },
          '404': { description: 'Time não encontrado' },
          '500': { description: 'Erro interno' },
        },
      },
    },
    '/api/teams/{id}/icon': {
      post: {
        summary: 'Upload de ícone do time (multipart/form-data)',
        tags: ['Teams'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file: { type: 'string', format: 'binary' },
                },
                required: ['file'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Upload concluído',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { iconUrl: { type: 'string' } },
                },
              },
            },
          },
          '400': { description: 'Arquivo ausente' },
          '401': { description: 'Não autorizado' },
          '404': { description: 'Time não encontrado' },
          '415': { description: 'Tipo de mídia não suportado' },
          '500': { description: 'Erro interno' },
        },
      },
    },
    '/api/teams/{id}/players': {
      get: {
        summary: 'Listar jogadores de um time por ID',
        tags: ['Teams'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', minimum: 1 },
            description: 'Página (default: 1)',
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 100 },
            description: 'Itens por página (default: 20, max: 100)',
          },
          {
            name: 'sort',
            in: 'query',
            schema: { type: 'string', enum: ['name', 'number', 'positionSlug', 'isActive'] },
            description: 'Campo de ordenação (default: name)',
          },
          {
            name: 'order',
            in: 'query',
            schema: { type: 'string', enum: ['asc', 'desc'] },
            description: 'Direção (default: asc)',
          },
          {
            name: 'includeTeam',
            in: 'query',
            schema: { type: 'string', enum: ['true', 'false'] },
            description: 'Incluir objeto do time na resposta (default: false)',
          },
        ],
        responses: {
          '200': {
            description: 'Lista paginada de jogadores',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    items: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          positionSlug: { type: 'string', nullable: true },
                          number: { type: 'integer', nullable: true },
                          isActive: { type: 'boolean' },
                        },
                        required: ['id', 'name', 'isActive'],
                      },
                    },
                    page: { type: 'integer' },
                    limit: { type: 'integer' },
                    total: { type: 'integer' },
                    team: {
                      type: 'object',
                      nullable: true,
                      properties: { id: { type: 'string' }, name: { type: 'string' } },
                    },
                  },
                  required: ['items', 'page', 'limit', 'total'],
                },
                example: {
                  items: [
                    {
                      id: 'player_10',
                      name: 'Jogador Exemplo',
                      positionSlug: 'CM',
                      number: 8,
                      isActive: true,
                    },
                  ],
                  page: 1,
                  limit: 20,
                  total: 2,
                  team: { id: 'team_1', name: 'Team List Test' },
                },
              },
            },
          },
          '400': { description: 'ID inválido' },
          '401': { description: 'Não autorizado' },
          '404': { description: 'Time não encontrado' },
          '500': { description: 'Erro interno' },
        },
      },
      post: {
        summary: 'Vincular jogador a um time',
        tags: ['Teams'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  playerId: { type: 'string' },
                },
                required: ['playerId'],
              },
              example: { playerId: 'player_123' },
            },
          },
        },
        responses: {
          '204': { description: 'Vinculado com sucesso' },
          '400': { description: 'Parâmetros inválidos' },
          '401': { description: 'Não autorizado' },
          '404': { description: 'Time ou jogador não encontrado' },
          '500': { description: 'Erro interno' },
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
            // Deixa multipart como padrão (igual Teams)
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
              examples: {
                upload: {
                  summary: 'Criar jogador com upload de foto',
                  value: {
                    name: 'John Doe',
                    positionSlug: 'ST',
                    number: 9,
                    isActive: 'true',
                    teamId: 'team_1',
                  },
                },
              },
            },
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  positionSlug: { type: 'string', nullable: true },
                  number: { type: 'integer', nullable: true },
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
                    positionSlug: { type: 'string', nullable: true },
                    position: {
                      type: 'object',
                      nullable: true,
                      properties: {
                        slug: { type: 'string' },
                        name: { type: 'string' },
                        description: { type: 'string', nullable: true },
                      },
                    },
                    number: { type: 'integer', nullable: true },
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
                  positionSlug: { type: 'string', nullable: true },
                  number: {
                    type: 'integer',
                    nullable: true,
                    description: "Também aceita o alias 'numero' (pt-BR)",
                  },
                },
                additionalProperties: false,
              },
              examples: {
                updateNameAndPosition: {
                  summary: 'Atualizar nome e posição',
                  value: { name: 'Novo Nome', positionSlug: 'CM' },
                },
                updateNumberAlias: {
                  summary: "Atualizar número usando alias 'numero'",
                  value: { numero: 7 },
                },
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
                    positionSlug: { type: 'string', nullable: true },
                    position: {
                      type: 'object',
                      nullable: true,
                      properties: {
                        slug: { type: 'string' },
                        name: { type: 'string' },
                        description: { type: 'string', nullable: true },
                      },
                    },
                    number: { type: 'integer', nullable: true },
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
            // Deixa multipart como padrão (igual Teams)
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
              examples: {
                upload: {
                  summary: 'Criar meu jogador com upload de foto',
                  value: {
                    name: 'John Doe',
                    positionSlug: 'CM',
                    number: 8,
                    teamId: 'team_1',
                  },
                },
              },
            },
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  positionSlug: { type: 'string', nullable: true },
                  number: { type: 'integer', nullable: true },
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
                      properties: { id: { type: 'string' }, name: { type: 'string' } },
                    },
                    recentMatches: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          scheduledAt: { type: 'string', format: 'date-time' },
                          status: { type: 'string' },
                          venue: { type: 'string', nullable: true },
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
                            venue: { type: 'string', nullable: true },
                            homeTeamId: { type: 'string' },
                            awayTeamId: { type: 'string' },
                          },
                        },
                        { type: 'null' },
                      ],
                    },
                  },
                  required: ['team', 'recentMatches', 'next_game'],
                },
                example: {
                  team: { id: 'team_1', name: 'Overview Team' },
                  recentMatches: [
                    {
                      id: 'match_10',
                      scheduledAt: '2025-11-10T12:00:00.000Z',
                      status: 'FINISHED',
                      venue: null,
                      homeTeamId: 'team_1',
                      awayTeamId: 'team_2',
                      homeScore: 2,
                      awayScore: 1,
                    },
                  ],
                  next_game: {
                    id: 'match_12',
                    scheduledAt: '2025-11-13T12:00:00.000Z',
                    venue: null,
                    homeTeamId: 'team_1',
                    awayTeamId: 'team_2',
                  },
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Player not found / No team' },
        },
      },
    },
    '/api/matches/{id}/events': {
      get: {
        summary: 'List events for a match',
        tags: ['Matches'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'List of events',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    items: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          matchId: { type: 'string' },
                          teamId: { type: 'string', nullable: true },
                          playerId: { type: 'string', nullable: true },
                          minute: { type: 'integer', nullable: true },
                          type: {
                            type: 'string',
                            enum: ['GOAL', 'FOUL', 'YELLOW_CARD', 'RED_CARD', 'OWN_GOAL'],
                          },
                          createdAt: { type: 'string', format: 'date-time' },
                        },
                      },
                    },
                  },
                  required: ['items'],
                },
                example: {
                  items: [
                    {
                      id: 'event_1',
                      matchId: 'match_1',
                      teamId: 'team_1',
                      playerId: null,
                      minute: 10,
                      type: 'GOAL',
                      createdAt: '2025-11-11T12:00:00.000Z',
                    },
                  ],
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
        },
      },
      post: {
        summary: 'Add an event to a match',
        tags: ['Matches'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  type: {
                    type: 'string',
                    enum: ['GOAL', 'FOUL', 'YELLOW_CARD', 'RED_CARD', 'OWN_GOAL'],
                  },
                  minute: { type: 'integer' },
                  teamId: { type: 'string' },
                  playerId: { type: 'string' },
                },
                required: ['type'],
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Event created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { id: { type: 'string' } },
                  required: ['id'],
                },
                example: { id: 'event_123' },
              },
            },
          },
          '400': { description: 'Invalid' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
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
                    email: { type: 'string', nullable: true },
                    displayName: { type: 'string', nullable: true },
                    playerId: { type: 'string', nullable: true },
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
                  teamId: { type: 'string', nullable: true },
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
                  teamId: { type: 'string', nullable: true },
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
                          teamId: { type: 'string', nullable: true },
                          role: {
                            type: 'string',
                            enum: ['ADMIN', 'MANAGER', 'ASSISTANT', 'PLAYER'],
                          },
                          createdAt: { type: 'string', format: 'date-time' },
                          team: {
                            type: 'object',
                            nullable: true,
                            properties: {
                              id: { type: 'string' },
                              name: { type: 'string' },
                              icon: { type: 'string', nullable: true },
                              description: { type: 'string', nullable: true },
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
      '/api/positions': {
        get: {
          summary: 'List positions',
          tags: ['Positions'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'List of positions',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      items: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            slug: { type: 'string' },
                            name: { type: 'string' },
                            description: { type: 'string', nullable: true },
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
      '/api/positions/{slug}': {
        patch: {
          summary: 'Update a position (admin)',
          tags: ['Positions'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    description: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Updated',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      item: {
                        type: 'object',
                        properties: {
                          slug: { type: 'string' },
                          name: { type: 'string' },
                          description: { type: 'string', nullable: true },
                        },
                      },
                    },
                  },
                },
              },
            },
            '401': { description: 'Unauthorized' },
            '403': { description: 'Forbidden' },
            '404': { description: 'Not found' },
          },
        },
        delete: {
          summary: 'Delete a position (admin)',
          tags: ['Positions'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': {
              description: 'Deleted',
              content: {
                'application/json': {
                  schema: { type: 'object', properties: { ok: { type: 'boolean' } } },
                },
              },
            },
            '401': { description: 'Unauthorized' },
            '403': { description: 'Forbidden' },
            '404': { description: 'Not found' },
          },
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
                    email: { type: 'string', nullable: true },
                    displayName: { type: 'string', nullable: true },
                    playerId: { type: 'string', nullable: true },
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
    '/api/matches': {
      post: {
        summary: 'Create a match',
        tags: ['Matches'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  homeTeamId: { type: 'string' },
                  awayTeamId: { type: 'string' },
                  scheduledAt: { type: 'string', format: 'date-time' },
                  status: {
                    type: 'string',
                    enum: ['SCHEDULED', 'IN_PROGRESS', 'FINISHED', 'CANCELED'],
                  },
                  homeScore: { type: 'integer', minimum: 0 },
                  awayScore: { type: 'integer', minimum: 0 },
                },
                required: ['homeTeamId', 'awayTeamId', 'scheduledAt'],
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
      get: {
        summary: 'List matches',
        tags: ['Matches'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string', enum: ['SCHEDULED', 'IN_PROGRESS', 'FINISHED', 'CANCELED'] },
          },
          { name: 'teamId', in: 'query', schema: { type: 'string' } },
          { name: 'from', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'to', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100 } },
        ],
        responses: {
          '200': {
            description: 'List of matches',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    items: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          homeTeamId: { type: 'string' },
                          awayTeamId: { type: 'string' },
                          scheduledAt: { type: 'string', format: 'date-time' },
                          status: { type: 'string' },
                          homeScore: { type: 'integer' },
                          awayScore: { type: 'integer' },
                        },
                      },
                    },
                    page: { type: 'integer' },
                    limit: { type: 'integer' },
                    total: { type: 'integer' },
                  },
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/matches/{id}/score': {
      patch: {
        summary: 'Update match score',
        tags: ['Matches'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  homeScore: { type: 'integer', minimum: 0 },
                  awayScore: { type: 'integer', minimum: 0 },
                },
                required: ['homeScore', 'awayScore'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Score updated',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { id: { type: 'string' } } },
              },
            },
          },
          '400': { description: 'Bad Request' },
          '401': { description: 'Unauthorized' },
          '500': { description: 'Internal Error' },
        },
      },
    },
    '/api/matches/{id}/status': {
      patch: {
        summary: 'Update match status',
        tags: ['Matches'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: {
                    type: 'string',
                    enum: ['SCHEDULED', 'IN_PROGRESS', 'FINISHED', 'CANCELED'],
                  },
                },
                required: ['status'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Status updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { id: { type: 'string' }, status: { type: 'string' } },
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
    '/api/matches/{id}/lineup': {
      post: {
        summary: 'Definir lineup (home/away) de uma partida',
        tags: ['Matches'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  home: { type: 'array', items: { type: 'string' } },
                  away: { type: 'array', items: { type: 'string' } },
                },
                required: ['home', 'away'],
              },
            },
          },
        },
        responses: {
          '204': { description: 'Lineup definida' },
          '400': { description: 'Body inválido' },
          '401': { description: 'Não autorizado' },
          '404': { description: 'Partida não encontrada' },
          '500': { description: 'Erro interno' },
        },
      },
      get: {
        summary: 'Obter lineup (home/away) de uma partida',
        tags: ['Matches'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'Lineup atual',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    home: { type: 'array', items: { type: 'string' } },
                    away: { type: 'array', items: { type: 'string' } },
                  },
                  required: ['home', 'away'],
                },
              },
            },
          },
          '401': { description: 'Não autorizado' },
          '404': { description: 'Partida não encontrada' },
          '500': { description: 'Erro interno' },
        },
      },
    },
    '/api/evaluations/pending': {
      get: {
        summary: 'List pending player evaluation assignments for current player',
        tags: ['Matches'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'List of pending assignments',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    items: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          matchId: { type: 'string' },
                          targetPlayerId: { type: 'string' },
                          targetName: { type: 'string', nullable: true },
                          createdAt: { type: 'string', format: 'date-time' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Player not found' },
          '500': { description: 'Internal Error' },
        },
      },
    },
    '/api/evaluations/{assignmentId}': {
      post: {
        summary: 'Submit evaluation for an assignment',
        tags: ['Matches'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'assignmentId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  rating: { type: 'integer', minimum: 0, maximum: 10 },
                  comment: { type: 'string', nullable: true },
                },
                required: ['rating'],
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Evaluation submitted',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { id: { type: 'string' } } },
              },
            },
          },
          '400': { description: 'Invalid request / already completed' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden (not evaluator)' },
          '404': { description: 'Assignment or player not found' },
          '500': { description: 'Internal Error' },
        },
      },
    },
  },
};
