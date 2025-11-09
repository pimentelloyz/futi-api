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
