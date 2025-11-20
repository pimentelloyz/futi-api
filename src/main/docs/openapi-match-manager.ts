/**
 * OpenAPI Documentation - Match Manager (Gestor de Partida)
 *
 * Documentação dos endpoints para gestores de partida
 * Permissões: Gerenciar eventos da partida (gols, cartões, substituições)
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

export const openapiMatchManager: OpenAPIObject = {
  openapi: '3.1.0',
  info: {
    title: 'futi-api - Match Manager',
    version: '0.1.0',
    description: 'Endpoints para gestores de partida - Gerenciamento de eventos da partida',
  },
  servers: [{ url: 'http://localhost:3000' }],
  tags: [
    { name: 'Health', description: 'Healthcheck' },
    { name: 'Auth', description: 'Autenticação' },
    { name: 'Access', description: 'Controle de acesso' },
    { name: 'Matches', description: 'Gerenciamento de partidas' },
    { name: 'Match Events', description: 'Eventos da partida (gols, cartões, substituições)' },
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
    '/health': {
      get: {
        summary: 'Health check',
        tags: ['Health'],
        responses: {
          '200': { description: 'OK' },
        },
      },
    },
    '/api/auth/firebase/exchange': {
      post: {
        summary: 'Exchange Firebase idToken for internal JWT',
        tags: ['Auth'],
        responses: {
          '200': { description: 'Successful exchange' },
        },
      },
    },
    '/api/auth/refresh': {
      post: {
        summary: 'Refresh access token',
        tags: ['Auth'],
        responses: {
          '200': { description: 'Tokens refreshed' },
        },
      },
    },
    '/api/auth/logout': {
      post: {
        summary: 'Logout',
        tags: ['Auth'],
        responses: {
          '200': { description: 'OK' },
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
        },
      },
    },
    '/api/access/me': {
      get: {
        summary: 'Minhas permissões',
        tags: ['Access'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Memberships' },
        },
      },
    },

    // ==================== MATCHES ====================
    '/api/matches/{id}': {
      get: {
        summary: 'Detalhes da partida',
        tags: ['Matches'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Detalhes da partida' },
        },
      },
      patch: {
        summary: 'Atualizar partida (iniciar, finalizar, etc)',
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
                  status: { type: 'string', enum: ['SCHEDULED', 'LIVE', 'FINISHED', 'CANCELLED'] },
                  homeScore: { type: ['integer', 'null'] },
                  awayScore: { type: ['integer', 'null'] },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Partida atualizada' },
          '403': { description: 'Forbidden' },
        },
      },
    },

    // ==================== MATCH EVENTS ====================
    '/api/matches/{matchId}/events': {
      post: {
        summary: 'Registrar evento na partida (gol, cartão, substituição)',
        tags: ['Match Events'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'matchId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  type: {
                    type: 'string',
                    enum: ['GOAL', 'YELLOW_CARD', 'RED_CARD', 'SUBSTITUTION'],
                  },
                  playerId: { type: 'string' },
                  teamId: { type: 'string' },
                  minute: { type: 'integer' },
                  description: { type: ['string', 'null'] },
                },
                required: ['type', 'playerId', 'teamId', 'minute'],
              },
            },
          },
        },
        responses: {
          '201': { description: 'Evento registrado' },
          '400': { description: 'Invalid request' },
          '403': { description: 'Forbidden' },
        },
      },
      get: {
        summary: 'Listar eventos da partida',
        tags: ['Match Events'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'matchId', in: 'path', required: true, schema: { type: 'string' } },
          {
            name: 'type',
            in: 'query',
            schema: { type: 'string', enum: ['GOAL', 'YELLOW_CARD', 'RED_CARD', 'SUBSTITUTION'] },
          },
        ],
        responses: {
          '200': { description: 'Lista de eventos' },
        },
      },
    },
    '/api/matches/{matchId}/events/{eventId}': {
      delete: {
        summary: 'Remover evento da partida',
        tags: ['Match Events'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'matchId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'eventId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Evento removido' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Evento não encontrado' },
        },
      },
    },
  },
};
