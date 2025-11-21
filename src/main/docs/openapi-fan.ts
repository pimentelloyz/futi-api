/**
 * OpenAPI Documentation - Fan (Torcedor)
 *
 * Documentação dos endpoints para torcedores
 * Permissões: Visualizar ligas públicas, times e partidas (SOMENTE LEITURA)
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

export const openapiFan: OpenAPIObject = {
  openapi: '3.1.0',
  info: {
    title: 'futi-api - Fan (Torcedor)',
    version: '0.1.0',
    description:
      'Endpoints para torcedores - Visualização de ligas públicas e criação de times próprios',
  },
  servers: [{ url: 'http://localhost:3000' }],
  tags: [
    { name: 'Health', description: 'Healthcheck' },
    { name: 'Auth', description: 'Autenticação' },
    { name: 'Access', description: 'Controle de acesso' },
    { name: 'Leagues', description: 'Visualização de ligas públicas' },
    { name: 'Teams', description: 'Visualização de times' },
    { name: 'Matches', description: 'Visualização de partidas' },
    { name: 'Standings', description: 'Classificação' },
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
          '200': { description: 'Memberships (vazio para FAN)' },
        },
      },
    },

    // ==================== LEAGUES (PUBLIC READ-ONLY) ====================
    '/api/leagues': {
      get: {
        summary: 'Listar ligas públicas',
        tags: ['Leagues'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'isPublic',
            in: 'query',
            schema: { type: 'boolean' },
            description: 'Filtrar por ligas públicas (default: true)',
          },
          {
            name: 'q',
            in: 'query',
            schema: { type: 'string' },
            description: 'Busca por nome/slug',
          },
        ],
        responses: {
          '200': { description: 'Lista de ligas públicas' },
        },
      },
    },
    '/api/leagues/{id}': {
      get: {
        summary: 'Detalhes da liga pública',
        tags: ['Leagues'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Detalhes da liga' },
          '403': { description: 'Liga privada - acesso negado' },
          '404': { description: 'Liga não encontrada' },
        },
      },
    },

    // ==================== TEAMS ====================
    '/api/teams': {
      post: {
        summary: 'Criar time',
        tags: ['Teams'],
        security: [{ bearerAuth: [] }],
        description:
          'Torcedores podem criar seus próprios times para participar de ligas. O criador automaticamente recebe a role MANAGER do time.',
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
      get: {
        summary: 'Listar times',
        tags: ['Teams'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Lista de times' },
        },
      },
    },
    '/api/teams/{id}': {
      get: {
        summary: 'Detalhes do time',
        tags: ['Teams'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Detalhes do time' },
        },
      },
    },

    // ==================== MATCHES (READ-ONLY) ====================
    '/api/matches': {
      get: {
        summary: 'Listar partidas públicas',
        tags: ['Matches'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'leagueId',
            in: 'query',
            schema: { type: 'string' },
          },
          {
            name: 'teamId',
            in: 'query',
            schema: { type: 'string' },
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

    // ==================== STANDINGS (READ-ONLY) ====================
    '/api/leagues/{leagueId}/standings': {
      get: {
        summary: 'Classificação da liga',
        tags: ['Standings'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'leagueId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Classificação' },
        },
      },
    },
  },
};
