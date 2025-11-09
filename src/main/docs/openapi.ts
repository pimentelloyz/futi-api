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
  },
  components: {},
};
