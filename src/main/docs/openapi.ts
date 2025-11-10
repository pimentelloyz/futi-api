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
    { name: 'Users', description: 'Gestão de usuários' },
    { name: 'Players', description: 'Jogadores e perfil do jogador' },
    { name: 'Teams', description: 'Times e composição' },
    { name: 'Matches', description: 'Partidas e placares' },
    { name: 'Access', description: 'Controle de acesso e roles' },
  ],
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
      post: {
        summary: 'Create a team',
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
                  icon: { type: 'string', format: 'uri', nullable: true },
                  description: { type: 'string', nullable: true },
                  isActive: { type: 'boolean' },
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
          '500': { description: 'Internal Error' },
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
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  position: { type: 'string', nullable: true },
                  number: { type: 'integer', nullable: true },
                  isActive: { type: 'boolean' },
                  teamIds: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Optional list of team IDs to associate',
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
                    position: { type: 'string', nullable: true },
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
      post: {
        summary: 'Create my player if missing (idempotent)',
        tags: ['Players'],
        description:
          'Cria o perfil de jogador para o usuário autenticado caso ainda não exista. Alternativamente, o perfil pode ser criado automaticamente via /api/auth/firebase/exchange com role=PLAYER ou via /api/users/init com role=PLAYER.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  position: { type: 'string', nullable: true },
                  number: { type: 'integer', nullable: true },
                  teamIds: { type: 'array', items: { type: 'string' } },
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
          '200': { description: 'OK' },
          '401': { description: 'Unauthorized' },
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
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
};
