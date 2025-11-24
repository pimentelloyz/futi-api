/**
 * OpenAPI Documentation - Admin Panel
 *
 * Documentação dos endpoints para o painel administrativo
 */

import { pushNotificationComponents, pushNotificationPaths } from './push-notifications-openapi.js';

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

export const openapiAdmin: OpenAPIObject = {
  openapi: '3.1.0',
  info: {
    title: 'futi-api - Admin Panel',
    version: '0.1.0',
    description: 'Endpoints do painel administrativo para gerenciamento de ligas e competições',
  },
  servers: [{ url: 'http://localhost:3000' }],
  tags: [
    { name: 'Health', description: 'Healthcheck e status do serviço' },
    { name: 'Auth', description: 'Autenticação e tokens' },
    { name: 'Users', description: 'Gerenciamento de usuários' },
    { name: 'Access', description: 'Controle de acesso e permissões' },
    {
      name: 'League Formats',
      description: 'Formatos de campeonato (Libertadores, Copa do Brasil, etc)',
    },
    { name: 'League Config', description: 'Configuração e setup de ligas' },
    { name: 'Discipline', description: 'Regras disciplinares e suspensões' },
    { name: 'Standings', description: 'Classificação e tabelas' },
    { name: 'Push Notifications', description: 'Notificações push via FCM' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          '🔐 **Autenticação via JWT**: Sua role (ADMIN, MASTER, etc) está incluída automaticamente no token JWT obtido via `/api/auth/firebase/exchange`. Não é necessário passar a role manualmente - ela é extraída do token pelo servidor. Endpoints protegidos verificam se você tem a role adequada.',
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
        summary: 'Exchange Firebase idToken for admin token',
        tags: ['Auth'],
        description:
          'Troca idToken do Firebase por tokens com role ADMIN. Exige que o UID do Firebase esteja configurado como ADMIN no sistema.',
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
          '200': {
            description: 'Admin token issued',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { accessToken: { type: 'string' }, refreshToken: { type: 'string' } },
                },
              },
            },
          },
          '400': { description: 'Invalid request' },
          '401': { description: 'Unauthorized - not admin' },
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
                    photoUrl: { type: ['string', 'null'] },
                    createdAt: { type: 'string', format: 'date-time' },
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
                  token: { type: 'string', description: 'FCM/APNS push token' },
                  platform: { type: 'string', enum: ['ios', 'android', 'web'] },
                },
                required: ['token', 'platform'],
              },
            },
          },
        },
        responses: {
          '201': { description: 'Token registered/updated' },
          '400': { description: 'Invalid request' },
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
    },
    '/api/formats': {
      get: {
        summary: 'Listar formatos de campeonato',
        tags: ['League Formats'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Lista de formatos disponíveis',
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
                          type: {
                            type: 'string',
                            enum: ['ROUND_ROBIN', 'KNOCKOUT', 'MIXED', 'LEAGUE_PHASE', 'CUSTOM'],
                          },
                          isTemplate: { type: 'boolean' },
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
      post: {
        summary: 'Criar novo formato de campeonato',
        tags: ['League Formats'],
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
                  type: {
                    type: 'string',
                    enum: ['ROUND_ROBIN', 'KNOCKOUT', 'MIXED', 'LEAGUE_PHASE', 'CUSTOM'],
                  },
                  isTemplate: { type: 'boolean' },
                },
                required: ['name', 'slug', 'type'],
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Formato criado',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { id: { type: 'string' } } },
              },
            },
          },
          '400': { description: 'Invalid request' },
          '401': { description: 'Unauthorized' },
          '409': { description: 'Slug already exists' },
        },
      },
    },
    '/api/formats/{id}': {
      get: {
        summary: 'Obter detalhes de um formato',
        tags: ['League Formats'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'Detalhes do formato',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    slug: { type: 'string' },
                    description: { type: ['string', 'null'] },
                    type: { type: 'string' },
                    isTemplate: { type: 'boolean' },
                    phases: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          order: { type: 'integer' },
                          type: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Format not found' },
        },
      },
      patch: {
        summary: 'Atualizar metadados de um formato',
        tags: ['League Formats'],
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
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Updated' },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Format not found' },
        },
      },
      delete: {
        summary: 'Deletar um formato',
        tags: ['League Formats'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '204': { description: 'Deleted' },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Format not found' },
        },
      },
    },
    '/api/leagues/{leagueId}/apply-format/{formatId}': {
      post: {
        summary: 'Aplicar formato a uma liga',
        tags: ['League Formats'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'leagueId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'formatId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Format applied' },
          '400': { description: 'Invalid request' },
          '401': { description: 'Unauthorized' },
          '404': { description: 'League or format not found' },
        },
      },
    },
    '/api/leagues/{id}/config-status': {
      get: {
        summary: 'Verificar status de configuração da liga',
        description:
          'Retorna lista de steps necessários para configurar a liga baseado no formato escolhido (Pontos Corridos, Copa do Brasil, Libertadores, etc). Cada step indica se foi completado e se é obrigatório.',
        tags: ['League Config'],
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
                          id: { type: 'string' },
                          title: { type: 'string' },
                          description: { type: 'string' },
                          completed: { type: 'boolean' },
                          required: { type: 'boolean' },
                          order: { type: 'integer' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': { description: 'Liga sem formato configurado' },
          '401': { description: 'Não autorizado' },
          '404': { description: 'Liga não encontrada' },
        },
      },
    },
    '/api/leagues/{leagueId}/discipline-rules': {
      get: {
        summary: 'Obter regras de disciplina de uma liga',
        tags: ['Discipline'],
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
                    yellowCardSuspension: { type: 'integer' },
                    redCardSuspension: { type: 'integer' },
                    customRules: { type: 'object' },
                  },
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
          '404': { description: 'League not found' },
        },
      },
      post: {
        summary: 'Criar ou atualizar regras de disciplina',
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
                  customRules: { type: 'object' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Rules updated' },
          '201': { description: 'Rules created' },
          '400': { description: 'Invalid request' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/leagues/{leagueId}/players/{playerId}/suspension-check': {
      get: {
        summary: 'Verificar se jogador está suspenso',
        tags: ['Discipline'],
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
                    isSuspended: { type: 'boolean' },
                    reason: { type: ['string', 'null'] },
                    matchesRemaining: { type: 'integer' },
                  },
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
          '404': { description: 'League or player not found' },
        },
      },
    },
    '/api/phases/{phaseId}/standings': {
      get: {
        summary: 'Obter classificação de uma fase',
        tags: ['Standings'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'phaseId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'Tabela de classificação',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      position: { type: 'integer' },
                      teamId: { type: 'string' },
                      teamName: { type: 'string' },
                      points: { type: 'integer' },
                      played: { type: 'integer' },
                      wins: { type: 'integer' },
                      draws: { type: 'integer' },
                      losses: { type: 'integer' },
                      goalsFor: { type: 'integer' },
                      goalsAgainst: { type: 'integer' },
                      goalDifference: { type: 'integer' },
                    },
                  },
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Phase not found' },
        },
      },
      delete: {
        summary: 'Deletar classificação de uma fase',
        tags: ['Standings'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'phaseId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '204': { description: 'Deleted' },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Phase not found' },
        },
      },
    },
    '/api/phases/{phaseId}/standings/initialize': {
      post: {
        summary: 'Inicializar tabela de classificação',
        tags: ['Standings'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'phaseId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '201': { description: 'Standings initialized' },
          '400': { description: 'Invalid request' },
          '401': { description: 'Unauthorized' },
          '409': { description: 'Standings already exist' },
        },
      },
    },
    '/api/phases/{phaseId}/standings/process-match': {
      post: {
        summary: 'Processar resultado de partida',
        tags: ['Standings'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'phaseId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  matchId: { type: 'string' },
                },
                required: ['matchId'],
              },
            },
          },
        },
        responses: {
          '200': { description: 'Match processed' },
          '400': { description: 'Invalid request' },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Match not found' },
        },
      },
    },
    '/api/phases/{phaseId}/standings/recalculate': {
      post: {
        summary: 'Recalcular posições da classificação',
        tags: ['Standings'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'phaseId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Standings recalculated' },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Phase not found' },
        },
      },
    },
    ...pushNotificationPaths,
  },
  components: {
    ...openapiAdmin.components,
    schemas: {
      ...(openapiAdmin.components?.schemas || {}),
      ...pushNotificationComponents.schemas,
    },
  },
};
