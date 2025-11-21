/**
 * OpenAPI Documentation - Referee Commission (Comissão de Arbitragem)
 *
 * Documentação dos endpoints para comissão de arbitragem
 * Permissões: Visualizar partidas, eventos disciplinares, suspensões (SOMENTE LEITURA)
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

export const openapiRefereeCommission: OpenAPIObject = {
  openapi: '3.1.0',
  info: {
    title: 'futi-api - Referee Commission',
    version: '0.1.0',
    description:
      'Endpoints para comissão de arbitragem - Visualização de partidas e questões disciplinares (SOMENTE LEITURA)',
  },
  servers: [{ url: 'http://localhost:3000' }],
  tags: [
    { name: 'Health', description: 'Healthcheck' },
    { name: 'Auth', description: 'Autenticação' },
    { name: 'Access', description: 'Controle de acesso' },
    { name: 'Matches', description: 'Visualização de partidas' },
    { name: 'Match Events', description: 'Visualização de eventos disciplinares' },
    { name: 'Discipline', description: 'Regras e suspensões' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          '🔐 **Autenticação via JWT**: Sua role (REFEREE_COMMISSION) está incluída automaticamente no token JWT obtido via `/api/auth/firebase/exchange`. Não é necessário passar a role manualmente - ela é extraída do token pelo servidor. Endpoints protegidos verificam se você tem a role adequada (somente leitura).',
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

    // ==================== MATCHES (READ-ONLY) ====================
    '/api/matches': {
      get: {
        summary: 'Listar partidas',
        tags: ['Matches'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'leagueId',
            in: 'query',
            schema: { type: 'string' },
          },
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string', enum: ['SCHEDULED', 'LIVE', 'FINISHED', 'CANCELLED'] },
          },
        ],
        responses: {
          '200': { description: 'Lista de partidas' },
        },
      },
    },
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
    },

    // ==================== MATCH EVENTS (READ-ONLY) ====================
    '/api/matches/{matchId}/events': {
      get: {
        summary: 'Listar eventos da partida (filtro por cartões)',
        tags: ['Match Events'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'matchId', in: 'path', required: true, schema: { type: 'string' } },
          {
            name: 'type',
            in: 'query',
            schema: { type: 'string', enum: ['YELLOW_CARD', 'RED_CARD'] },
            description: 'Filtrar eventos disciplinares',
          },
        ],
        responses: {
          '200': { description: 'Lista de eventos' },
        },
      },
    },

    // ==================== DISCIPLINE (READ-ONLY) ====================
    '/api/leagues/{leagueId}/discipline-rules': {
      get: {
        summary: 'Obter regras disciplinares da liga',
        tags: ['Discipline'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'leagueId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Regras disciplinares' },
        },
      },
    },
    '/api/leagues/{leagueId}/players/{playerId}/suspension-check': {
      get: {
        summary: 'Verificar suspensão de jogador',
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
                    yellowCards: { type: 'integer' },
                    redCards: { type: 'integer' },
                    gamesRemaining: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};
