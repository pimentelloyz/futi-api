import { pushNotificationComponents, pushNotificationPaths } from './push-notifications-openapi.js';

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
    { name: 'Health', description: 'Healthcheck e status do serviço' },
    { name: 'Auth', description: 'Autenticação e tokens' },
    { name: 'Leagues', description: 'Gerenciamento de ligas' },
    { name: 'Teams', description: 'Gerenciamento de times' },
    { name: 'Players', description: 'Gerenciamento de jogadores' },
    { name: 'Positions', description: 'Posições de jogadores' },
    { name: 'Invites', description: 'Convites e participação' },
    { name: 'Push Notifications', description: 'Notificações push via FCM' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          '🔐 **Autenticação via JWT**: Sua role (ADMIN, PLAYER, FAN, MANAGER, etc) está incluída automaticamente no token JWT obtido via `/api/auth/firebase/exchange`. Não é necessário passar a role manualmente - ela é extraída do token pelo servidor. Endpoints protegidos verificam se você tem a role adequada.',
      },
    },
  },
  paths: {
    '/api/leagues': {
      get: {
        summary: 'Listar ligas cadastradas (com filtros e paginação)',
        description:
          'Retorna uma lista paginada (máximo 20 por página) de ligas. Permite filtros por texto (q), nome, slug, status (isActive) e intervalos de datas (startAt, endAt).',
        tags: ['Leagues'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'q',
            in: 'query',
            schema: { type: 'string' },
            description: 'Busca por nome/slug',
          },
          {
            name: 'name',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filtro: name contains (case-insensitive)',
          },
          {
            name: 'slug',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filtro: slug contains (case-insensitive)',
          },
          {
            name: 'isActive',
            in: 'query',
            schema: { type: 'boolean' },
            description: 'Filtrar por status ativo/inativo (true/false)',
          },
          {
            name: 'isPublic',
            in: 'query',
            schema: { type: 'boolean' },
            description:
              'Filtrar por ligas públicas/privadas (true=públicas, false=privadas). Ligas públicas são abertas ao público, ligas privadas são fechadas/por convite.',
          },
          { name: 'startAtFrom', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'startAtTo', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'endAtFrom', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'endAtTo', in: 'query', schema: { type: 'string', format: 'date-time' } },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', minimum: 1 },
            description: 'Página atual (default 1)',
          },
          {
            name: 'pageSize',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 20 },
            description: 'Itens por página (máximo 20, default 20)',
          },
          {
            name: 'orderBy',
            in: 'query',
            schema: { type: 'string', enum: ['name', 'createdAt', 'startAt', 'endAt'] },
            description: 'Campo para ordenação (default createdAt)',
          },
          {
            name: 'order',
            in: 'query',
            schema: { type: 'string', enum: ['asc', 'desc'] },
            description: 'Direção (default depende do campo)',
          },
        ],
        responses: {
          '200': {
            description: 'Lista paginada de ligas',
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
                          slug: { type: 'string' },
                          description: { type: ['string', 'null'] },
                          icon: { type: ['string', 'null'] },
                          banner: { type: ['string', 'null'] },
                          startAt: { type: ['string', 'null'], format: 'date-time' },
                          endAt: { type: ['string', 'null'], format: 'date-time' },
                          isActive: { type: 'boolean' },
                          isPublic: {
                            type: 'boolean',
                            description:
                              'Indica se a liga é pública (aberta) ou privada (fechada/por convite)',
                          },
                          createdAt: { type: 'string', format: 'date-time' },
                          updatedAt: { type: 'string', format: 'date-time' },
                        },
                        required: [
                          'id',
                          'name',
                          'slug',
                          'isActive',
                          'isPublic',
                          'createdAt',
                          'updatedAt',
                        ],
                      },
                    },
                    page: { type: 'integer' },
                    pageSize: { type: 'integer' },
                    total: { type: 'integer' },
                    hasNext: { type: 'boolean' },
                  },
                  required: ['items', 'page', 'pageSize', 'total', 'hasNext'],
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Criar liga',
        description:
          'Aceita JSON ou multipart/form-data. Em multipart, envie arquivos binários para ícone e banner da liga nos campos "icon" e "banner".',
        tags: ['Leagues'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  slug: { type: 'string' },
                  description: { type: ['string', 'null'] },
                  startAt: { type: ['string', 'null'], format: 'date-time' },
                  endAt: { type: ['string', 'null'], format: 'date-time' },
                  isPublic: {
                    type: 'boolean',
                    description:
                      'Define se a liga é pública (true=aberta ao público) ou privada (false=fechada/por convite). Default: false',
                  },
                  isActive: {
                    type: 'boolean',
                    description: 'Define se a liga está ativa. Default: true',
                  },
                  icon: { type: 'string', format: 'binary' },
                  banner: { type: 'string', format: 'binary' },
                },
                required: ['name', 'slug'],
              },
              examples: {
                upload: {
                  summary: 'Criar liga com upload de ícone e banner',
                  value: {
                    name: 'Nova Liga',
                    slug: 'nova-liga',
                    description: 'Liga de testes',
                    // icon e banner são selecionados na UI do Swagger
                  },
                },
              },
            },
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  slug: { type: 'string' },
                  description: { type: ['string', 'null'] },
                  startAt: { type: ['string', 'null'], format: 'date-time' },
                  endAt: { type: ['string', 'null'], format: 'date-time' },
                  isPublic: {
                    type: 'boolean',
                    description:
                      'Define se a liga é pública (true=aberta) ou privada (false=fechada). Default: false',
                  },
                  isActive: {
                    type: 'boolean',
                    description: 'Define se a liga está ativa. Default: true',
                  },
                  icon: { type: ['string', 'null'], format: 'uri' },
                  banner: { type: ['string', 'null'], format: 'uri' },
                },
                required: ['name', 'slug'],
              },
              examples: {
                publicLeague: {
                  summary: 'Liga Pública',
                  value: {
                    name: 'Copa Brasil Amateur',
                    slug: 'copa-brasil-amateur',
                    description: 'Liga aberta ao público',
                    isPublic: true,
                    isActive: true,
                    icon: 'https://example.com/league-icon.png',
                    banner: 'https://example.com/league-banner.png',
                  },
                },
                privateLeague: {
                  summary: 'Liga Privada',
                  value: {
                    name: 'Liga VIP',
                    slug: 'liga-vip',
                    description: 'Liga fechada por convite',
                    isPublic: false,
                    isActive: true,
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Liga criada',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { id: { type: 'string' } },
                  required: ['id'],
                },
              },
            },
          },
          '400': { description: 'Parâmetros ausentes' },
          '409': { description: 'Slug já existente' },
        },
      },
    },
    '/api/leagues/me': {
      get: {
        summary: 'Listar ligas vinculadas ao usuário (resumo)',
        tags: ['Leagues'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Lista de ligas do usuário (sem times/grupos)',
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
                      description: { type: ['string', 'null'] },
                      isActive: { type: ['boolean', 'null'] },
                    },
                    required: ['id', 'name', 'slug'],
                  },
                },
              },
            },
          },
          '401': { description: 'Não autorizado' },
        },
      },
    },
    '/api/leagues/{id}': {
      patch: {
        summary: 'Editar liga (parcial)',
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
                  slug: { type: 'string' },
                  description: { type: ['string', 'null'] },
                  startAt: { type: ['string', 'null'], format: 'date-time' },
                  endAt: { type: ['string', 'null'], format: 'date-time' },
                  isActive: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Atualizado' },
          '401': { description: 'Não autorizado' },
          '404': { description: 'Liga não encontrada' },
          '409': { description: 'Slug já existente' },
        },
      },
      delete: {
        summary: 'Excluir liga (soft delete: isActive=false)',
        tags: ['Leagues'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '204': { description: 'Removida' },
          '401': { description: 'Não autorizado' },
          '404': { description: 'Liga não encontrada' },
        },
      },
    },
    '/api/leagues/{id}/teams': {
      get: {
        summary: 'Listar times de uma liga',
        description:
          'Retorna os vínculos de times (LeagueTeam) da liga, incluindo os dados do Team.',
        tags: ['Leagues'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'Lista de times vinculados à liga',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      leagueId: { type: 'string' },
                      teamId: { type: 'string' },
                      division: { type: ['string', 'null'] },
                      team: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          icon: { type: ['string', 'null'] },
                          description: { type: ['string', 'null'] },
                          isActive: { type: 'boolean' },
                        },
                        required: ['id', 'name', 'isActive'],
                      },
                    },
                    required: ['id', 'leagueId', 'teamId', 'team'],
                  },
                },
              },
            },
          },
          '401': { description: 'Não autorizado' },
          '404': { description: 'Liga não encontrada' },
        },
      },
    },
    '/api/leagues/{id}/icon': {
      post: {
        summary: 'Upload de ícone da liga (multipart/form-data)',
        description:
          'Substitui o ícone anterior desta liga. O arquivo é salvo com nome determinístico em leagues/{id}/{id}-icon.{ext} (ext: png/jpg/webp) e uma URL estável é retornada. Para evitar cache agressivo no cliente, usamos cache-control: no-cache, max-age=0. Envie o arquivo no campo multipart "file" (PNG/JPEG/WEBP, até 2MB).',
        tags: ['Leagues'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: { file: { type: 'string', format: 'binary' } },
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
                schema: { type: 'object', properties: { iconUrl: { type: 'string' } } },
              },
            },
          },
          '400': { description: 'Arquivo ausente' },
          '401': { description: 'Não autorizado' },
          '404': { description: 'Liga não encontrada' },
          '415': { description: 'Tipo de mídia não suportado' },
          '500': { description: 'Erro interno' },
        },
      },
    },
    '/api/leagues/{id}/banner': {
      post: {
        summary: 'Upload de banner da liga (multipart/form-data)',
        description:
          'Substitui o banner anterior desta liga. O arquivo é salvo com nome determinístico em leagues/{id}/{id}-banner.{ext} (ext: png/jpg/webp) e uma URL estável é retornada. Para evitar cache agressivo no cliente, usamos cache-control: no-cache, max-age=0. Envie o arquivo no campo multipart "file" (PNG/JPEG/WEBP, até 2MB).',
        tags: ['Leagues'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: { file: { type: 'string', format: 'binary' } },
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
                schema: { type: 'object', properties: { bannerUrl: { type: 'string' } } },
              },
            },
          },
          '400': { description: 'Arquivo ausente' },
          '401': { description: 'Não autorizado' },
          '404': { description: 'Liga não encontrada' },
          '415': { description: 'Tipo de mídia não suportado' },
          '500': { description: 'Erro interno' },
        },
      },
    },
    '/api/leagues/me/{id}': {
      get: {
        summary: 'Detalhes de uma liga que pertenço (inclui times/grupos)',
        tags: ['Leagues'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'Liga detalhada',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    slug: { type: 'string' },
                    description: { type: ['string', 'null'] },
                    isActive: { type: ['boolean', 'null'] },
                    teams: {
                      type: 'array',
                      items: {
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
                            required: ['id', 'name', 'isActive'],
                          },
                        },
                      },
                    },
                    groups: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          teams: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                team: {
                                  type: 'object',
                                  properties: {
                                    id: { type: 'string' },
                                    name: { type: 'string' },
                                  },
                                  required: ['id', 'name'],
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                  required: ['id', 'name', 'slug'],
                },
              },
            },
          },
          '401': { description: 'Não autorizado' },
          '404': { description: 'Liga não encontrada ou não vinculada' },
        },
      },
    },
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
                        required: ['id', 'title', 'description', 'completed', 'required', 'order'],
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
                  icon: { type: ['string', 'null'], format: 'uri' },
                  description: { type: ['string', 'null'] },
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
                  icon: { type: ['string', 'null'] },
                  description: { type: ['string', 'null'] },
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
                    icon: { type: ['string', 'null'] },
                    description: { type: ['string', 'null'] },
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
        description:
          'Substitui o ícone anterior deste time. O arquivo é salvo com nome determinístico em teams/{id}/{id}.{ext} (ext: png/jpg/webp) e uma URL estável é retornada. Para evitar cache agressivo no cliente, usamos cache-control: no-cache, max-age=0. Envie o arquivo no campo multipart "file" (PNG/JPEG/WEBP, até 2MB).',
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
                          positionSlug: { type: ['string', 'null'] },
                          number: { type: ['integer', 'null'] },
                          isActive: { type: 'boolean' },
                        },
                        required: ['id', 'name', 'isActive'],
                      },
                    },
                    page: { type: 'integer' },
                    limit: { type: 'integer' },
                    total: { type: 'integer' },
                    team: {
                      type: ['object', 'null'],
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
    '/api/invites': {
      post: {
        summary: 'Criar código de convite',
        tags: ['Invites'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  teamId: { type: 'string' },
                  maxUses: { type: ['integer', 'null'] },
                  expiresAt: { type: ['string', 'null'], format: 'date-time' },
                },
                required: ['teamId'],
              },
              example: { teamId: 'team_1', maxUses: 5, expiresAt: '2025-12-31T23:59:59Z' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Criado',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { id: { type: 'string' } } },
              },
            },
          },
          '400': { description: 'Parâmetros inválidos' },
          '401': { description: 'Não autorizado' },
          '500': { description: 'Erro interno' },
        },
      },
      get: {
        summary: 'Listar códigos de convite por time',
        tags: ['Invites'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'teamId', in: 'query', required: true, schema: { type: 'string' } },
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
                          code: { type: 'string' },
                          teamId: { type: 'string' },
                          createdBy: { type: ['string', 'null'] },
                          maxUses: { type: 'integer' },
                          uses: { type: 'integer' },
                          isActive: { type: 'boolean' },
                          expiresAt: { type: ['string', 'null'], format: 'date-time' },
                          createdAt: { type: 'string', format: 'date-time' },
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
    },
    '/api/invites/accept': {
      post: {
        summary: 'Aceitar código de convite (vincular jogador ao time)',
        tags: ['Invites'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { code: { type: 'string' } },
                required: ['code'],
              },
              example: { code: 'ABC123' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Vinculado com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { message: { type: 'string' }, teamId: { type: 'string' } },
                },
              },
            },
          },
          '400': { description: 'Código inválido / expirado' },
          '401': { description: 'Não autorizado' },
          '404': { description: 'Código não encontrado / jogador não encontrado' },
          '409': { description: 'Jogador já pertence ao time' },
          '500': { description: 'Erro interno' },
        },
      },
    },
    '/api/invites/league': {
      post: {
        summary: 'Criar código de convite para liga',
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
                  maxUses: { type: 'integer' },
                  expiresAt: { type: ['string', 'null'], format: 'date-time' },
                },
                required: ['leagueId'],
              },
              example: { leagueId: 'league_1', maxUses: 3 },
            },
          },
        },
        responses: {
          '201': { description: 'Criado' },
          '400': { description: 'Parâmetros inválidos' },
          '401': { description: 'Não autorizado' },
          '404': { description: 'Liga não encontrada' },
          '500': { description: 'Erro interno' },
        },
      },
      get: {
        summary: 'Listar códigos de convite de uma liga',
        tags: ['Invites'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'leagueId', in: 'query', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'OK' },
          '400': { description: 'Parâmetros inválidos' },
          '401': { description: 'Não autorizado' },
          '500': { description: 'Erro interno' },
        },
      },
    },
    '/api/invites/league/{id}': {
      delete: {
        summary: 'Revogar código de convite de liga',
        tags: ['Invites'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '204': { description: 'Revogado com sucesso' },
          '401': { description: 'Não autorizado' },
          '404': { description: 'Código não encontrado' },
          '500': { description: 'Erro interno' },
        },
      },
    },
    '/api/invites/league/accept': {
      post: {
        summary: 'Aceitar convite de liga (vincular time à liga)',
        tags: ['Invites'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { code: { type: 'string' }, teamId: { type: 'string' } },
                required: ['code', 'teamId'],
              },
              example: { code: 'XYZ789', teamId: 'team_1' },
            },
          },
        },
        responses: {
          '200': { description: 'Time vinculado' },
          '400': { description: 'Código inválido/expirado' },
          '401': { description: 'Não autorizado' },
          '403': { description: 'Usuário não é manager do time' },
          '404': { description: 'Código não encontrado' },
          '409': { description: 'Time já na liga' },
          '500': { description: 'Erro interno' },
        },
      },
    },
    '/api/invites/{id}': {
      delete: {
        summary: 'Revogar código de convite',
        tags: ['Invites'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '204': { description: 'Revogado com sucesso' },
          '401': { description: 'Não autorizado' },
          '404': { description: 'Código não encontrado' },
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
                example: {
                  team: {
                    id: 'team_1',
                    name: 'Overview Team',
                    icon: null,
                    description: null,
                    isActive: true,
                  },
                  players: [
                    {
                      id: 'player_10',
                      name: 'Jogador Exemplo',
                      positionSlug: 'CM',
                      number: 8,
                      isActive: true,
                    },
                  ],
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
                  evaluationBanner: {
                    match: {
                      id: 'match_10',
                      scheduledAt: '2025-11-10T12:00:00.000Z',
                      status: 'FINISHED',
                      venue: null,
                      homeTeamId: 'team_1',
                      awayTeamId: 'team_2',
                      homeScore: 2,
                      awayScore: 1,
                    },
                    pendingCount: 2,
                    expiresAt: '2025-11-11T12:00:00.000Z',
                    players: [
                      {
                        id: 'player_11',
                        name: 'Jogador 11',
                        positionSlug: 'ST',
                        number: 9,
                        isActive: true,
                      },
                    ],
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
                example: {
                  evaluationBanner: {
                    match: {
                      id: 'match_10',
                      scheduledAt: '2025-11-14T12:00:00.000Z',
                      status: 'FINISHED',
                      venue: null,
                      homeTeamId: 'team_1',
                      awayTeamId: 'team_2',
                      homeScore: 2,
                      awayScore: 1,
                    },
                    pendingCount: 2,
                    expiresAt: '2025-11-15T12:00:00.000Z',
                    players: [
                      {
                        id: 'player_11',
                        name: 'Jogador 11',
                        positionSlug: 'ST',
                        number: 9,
                        isActive: true,
                      },
                    ],
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
                example: {
                  match: {
                    id: 'match_10',
                    scheduledAt: '2025-11-14T12:00:00.000Z',
                    status: 'FINISHED',
                    venue: null,
                    homeTeamId: 'team_1',
                    awayTeamId: 'team_2',
                    homeScore: 2,
                    awayScore: 1,
                  },
                  teamId: 'team_1',
                  evaluatorPlayerId: 'player_me',
                  expiresAt: '2025-11-15T12:00:00.000Z',
                  players: [
                    {
                      id: 'player_11',
                      name: 'Jogador 11',
                      positionSlug: 'ST',
                      number: 9,
                      isActive: true,
                    },
                  ],
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
                          teamId: { type: ['string', 'null'] },
                          playerId: { type: ['string', 'null'] },
                          minute: { type: ['integer', 'null'] },
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
    '/api/auth/refresh': {
      post: {
        summary: 'Refresh access token (rotates refresh token)',
        tags: ['Auth'],
        description:
          '**Renovação de Tokens**\n\n' +
          'Use este endpoint quando receber erro 401 EXPIRED_TOKEN em requisições autenticadas.\n\n' +
          '**Como funciona:**\n' +
          '- Aceita `refreshToken` via **body JSON** ou **cookie HttpOnly** (automático)\n' +
          '- Valida o refreshToken no banco (validade: 30 dias)\n' +
          '- Gera novo `accessToken` (JWT, expira em 1 hora)\n' +
          '- Gera novo `refreshToken` (expira em 30 dias)\n' +
          '- **Rotação de segurança**: O refreshToken anterior é invalidado\n\n' +
          '**O que enviar:**\n' +
          '- **Via body**: `{ "refreshToken": "futi_rt_..." }`\n' +
          '- **Via cookie**: Nada (o cookie HttpOnly é enviado automaticamente pelo navegador)\n\n' +
          '**Resposta**: Retorna `accessToken` e `refreshToken` novos. Use o novo accessToken no header `Authorization: Bearer <token>`.',
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  refreshToken: {
                    type: 'string',
                    description:
                      'RefreshToken obtido no login (formato: futi_rt_...). Opcional se enviado via cookie HttpOnly.',
                  },
                },
              },
              examples: {
                viaBody: {
                  summary: 'Via body JSON',
                  value: { refreshToken: 'futi_rt_9f0c4e9a-3a52-4f1c-a1ef-3f4b5c6d7e8f' },
                },
                viaCookie: {
                  summary: 'Via cookie (envio automático)',
                  description:
                    'Não envie nada no body. O cookie HttpOnly "refreshToken" é enviado automaticamente.',
                  value: {},
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description:
              'Tokens renovados com sucesso. Use o novo accessToken nas próximas requisições.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    accessToken: {
                      type: 'string',
                      description: 'Novo JWT para autenticação (válido por 1 hora)',
                    },
                    refreshToken: {
                      type: 'string',
                      description:
                        'Novo refreshToken rotacionado (válido por 30 dias). O anterior foi invalidado.',
                    },
                  },
                },
                examples: {
                  success: {
                    value: {
                      accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                      refreshToken: 'futi_rt_7aa1cdae-5b5f-4e9c-81f1-6a332b4c5d6e',
                    },
                  },
                },
              },
            },
          },
          '400': { description: 'RefreshToken não foi enviado (nem via body nem via cookie)' },
          '401': { description: 'RefreshToken inválido, expirado ou já foi usado (rotacionado)' },
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
                            description: { type: ['string', 'null'] },
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
                          description: { type: ['string', 'null'] },
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
                          targetName: { type: ['string', 'null'] },
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
                  comment: { type: ['string', 'null'] },
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
    ...pushNotificationPaths,
  },
  components: {
    ...openapi.components,
    schemas: {
      ...(openapi.components?.schemas || {}),
      ...pushNotificationComponents.schemas,
    },
  },
};
