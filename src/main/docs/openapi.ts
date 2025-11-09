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
  paths: {
    '/health': {
      get: {
        summary: 'Health check',
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
            description: 'Successful exchange',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { accessToken: { type: 'string' } },
                },
              },
            },
          },
          '400': { description: 'Invalid request' },
          '401': { description: 'Invalid token' },
        },
      },
    },
    '/api/matches': {
      post: {
        summary: 'Create a match',
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
