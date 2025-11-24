/**
 * OpenAPI Documentation - League Manager (Gestor de Liga)
 *
 * Documentação dos endpoints para gestores de liga
 * Permissões: Gerenciar liga, times da liga, criar partidas, grupos, etc.
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

export const openapiLeagueManager: OpenAPIObject = {
  openapi: '3.1.0',
  info: {
    title: 'futi-api - League Manager',
    version: '0.1.0',
    description: 'Endpoints para gestores de liga - Gerenciamento de liga, times, grupos, partidas',
  },
  servers: [{ url: 'http://localhost:3000' }],
  tags: [
    { name: 'Health', description: 'Healthcheck e status do serviço' },
    { name: 'Auth', description: 'Autenticação e tokens' },
    { name: 'Access', description: 'Controle de acesso e permissões' },
    { name: 'Leagues', description: 'Gerenciamento de ligas' },
    { name: 'Teams', description: 'Times da liga' },
    { name: 'Matches', description: 'Gerenciamento de partidas' },
    { name: 'Invites', description: 'Convites para times' },
    { name: 'Discipline', description: 'Regras disciplinares' },
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
          '🔐 **Autenticação via JWT**: Sua role (LEAGUE_MANAGER) está incluída automaticamente no token JWT obtido via `/api/auth/firebase/exchange`. Não é necessário passar a role manualmente - ela é extraída do token pelo servidor. Endpoints protegidos verificam se você tem a role adequada.',
      },
    },
  },
  paths: {
    // ==================== COMMON ENDPOINTS ====================
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
          '200': { description: 'Successful exchange' },
          '400': { description: 'Invalid request' },
          '401': { description: 'Invalid token' },
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
        summary: 'Minhas permissões e memberships',
        tags: ['Access'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Memberships do usuário' },
        },
      },
    },

    // ==================== LEAGUES ====================
    '/api/leagues': {
      get: {
        summary: 'Listar ligas',
        tags: ['Leagues'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Lista de ligas' },
        },
      },
      post: {
        summary: 'Criar liga (apenas LEAGUE_MANAGER com permissão)',
        tags: ['Leagues'],
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
                  isPublic: { type: 'boolean' },
                  startAt: { type: 'string', format: 'date-time' },
                  endAt: { type: 'string', format: 'date-time' },
                },
                required: ['name', 'slug'],
              },
            },
          },
        },
        responses: {
          '201': { description: 'Liga criada' },
          '400': { description: 'Invalid request' },
          '403': { description: 'Forbidden' },
        },
      },
    },
    '/api/leagues/{id}': {
      get: {
        summary: 'Detalhes da liga',
        tags: ['Leagues'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Detalhes da liga' },
          '404': { description: 'Liga não encontrada' },
        },
      },
      patch: {
        summary: 'Atualizar liga',
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
                  description: { type: ['string', 'null'] },
                  isActive: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Liga atualizada' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Liga não encontrada' },
        },
      },
    },
    '/api/leagues/{id}/teams': {
      post: {
        summary: 'Adicionar time à liga',
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
                  teamId: { type: 'string' },
                },
                required: ['teamId'],
              },
            },
          },
        },
        responses: {
          '201': { description: 'Time adicionado' },
          '400': { description: 'Invalid request' },
          '403': { description: 'Forbidden' },
        },
      },
    },
    '/api/leagues/{id}/groups': {
      post: {
        summary: 'Criar grupo na liga',
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
                  order: { type: 'integer' },
                },
                required: ['name'],
              },
            },
          },
        },
        responses: {
          '201': { description: 'Grupo criado' },
          '403': { description: 'Forbidden' },
        },
      },
    },
    '/api/leagues/{id}/config-status': {
      get: {
        summary: 'Verificar status de configuração da liga',
        tags: ['Leagues'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Status de configuração' },
          '404': { description: 'Liga não encontrada' },
        },
      },
    },

    // ==================== MATCHES ====================
    '/api/matches': {
      post: {
        summary: 'Criar partida',
        tags: ['Matches'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  leagueId: { type: 'string' },
                  homeTeamId: { type: 'string' },
                  awayTeamId: { type: 'string' },
                  scheduledAt: { type: 'string', format: 'date-time' },
                },
                required: ['leagueId', 'homeTeamId', 'awayTeamId'],
              },
            },
          },
        },
        responses: {
          '201': { description: 'Partida criada' },
          '400': { description: 'Invalid request' },
          '403': { description: 'Forbidden' },
        },
      },
    },

    // ==================== INVITES ====================
    '/api/invites': {
      post: {
        summary: 'Criar convite para time',
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
                  role: { type: 'string', enum: ['MANAGER'] },
                },
                required: ['leagueId', 'role'],
              },
            },
          },
        },
        responses: {
          '201': { description: 'Convite criado' },
          '403': { description: 'Forbidden' },
        },
      },
    },

    // ==================== TIEBREAK RULES ====================
    '/api/leagues/{id}/tiebreak-rules': {
      get: {
        summary: 'Obter critérios de desempate da liga',
        description:
          '**Buscar critérios de desempate** - Retorna os critérios de desempate configurados para uma liga/fase específica, ordenados por prioridade. Também retorna todos os critérios disponíveis para uso.\n\n' +
          '**Query Parameters:**\n' +
          '- `phaseId` (opcional): ID da fase específica. Se omitido, retorna da primeira fase.\n\n' +
          '**Exemplo de Response:**\n' +
          '```json\n' +
          '{\n' +
          '  "rules": [\n' +
          '    {"id": "uuid", "order": 1, "criterion": "POINTS", "criterionLabel": "Pontos"},\n' +
          '    {"id": "uuid", "order": 2, "criterion": "GOAL_DIFFERENCE", "criterionLabel": "Saldo de Gols"}\n' +
          '  ],\n' +
          '  "availableCriteria": [\n' +
          '    {"value": "POINTS", "label": "Pontos"},\n' +
          '    {"value": "WINS", "label": "Vitórias"},\n' +
          '    {"value": "GOAL_DIFFERENCE", "label": "Saldo de Gols"},\n' +
          '    {"value": "GOALS_FOR", "label": "Gols Marcados"},\n' +
          '    {"value": "HEAD_TO_HEAD_POINTS", "label": "Confronto Direto (Pontos)"},\n' +
          '    {"value": "AWAY_GOALS", "label": "Gols Fora"},\n' +
          '    {"value": "FAIR_PLAY", "label": "Fair Play"},\n' +
          '    {"value": "DRAW", "label": "Sorteio"},\n' +
          '    ... (16 critérios no total)\n' +
          '  ]\n' +
          '}\n' +
          '```',
        tags: ['Leagues'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          {
            name: 'phaseId',
            in: 'query',
            required: false,
            schema: { type: 'string' },
            description: 'ID da fase específica (opcional)',
          },
        ],
        responses: {
          '200': {
            description: 'Critérios de desempate da liga',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    rules: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          order: { type: 'integer' },
                          criterion: { type: 'string' },
                          criterionLabel: { type: 'string' },
                        },
                      },
                    },
                    availableCriteria: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          value: { type: 'string' },
                          label: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': { description: 'Não autenticado' },
          '403': { description: 'Sem permissão para acessar esta liga' },
          '404': { description: 'Liga ou fase não encontrada' },
        },
      },
    },
    '/api/leagues/{id}/phases/{phaseId}/tiebreak-rules': {
      put: {
        summary: 'Atualizar ordem dos critérios de desempate',
        description:
          '**Reordenar critérios de desempate** - Atualiza a ordem de prioridade dos critérios de desempate de uma fase. Requer permissão de LEAGUE_MANAGER ou ADMIN e a liga não pode ter começado.\n\n' +
          '**Validações:**\n' +
          '- Liga não pode ter começado (startAt > now)\n' +
          '- Requer role LEAGUE_MANAGER ou ADMIN\n' +
          '- Array `rules` deve conter todos os critérios com novos valores de `order`\n\n' +
          '**Exemplo de Request:**\n' +
          '```json\n' +
          '{\n' +
          '  "rules": [\n' +
          '    {"id": "819ac357-9095-493e-aa38-0f5296a02edf", "order": 1},\n' +
          '    {"id": "049eb3b9-5dff-48a0-9bda-b68643afe648", "order": 2},\n' +
          '    {"id": "9d9be9d8-61a8-47a5-b294-84931f33ebe1", "order": 3}\n' +
          '  ]\n' +
          '}\n' +
          '```',
        tags: ['Leagues'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'phaseId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  rules: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', description: 'ID do critério' },
                        order: { type: 'integer', description: 'Nova ordem (1, 2, 3...)' },
                      },
                      required: ['id', 'order'],
                    },
                  },
                },
                required: ['rules'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Ordem atualizada com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
          '400': { description: 'Dados inválidos (rules vazio ou malformado)' },
          '401': { description: 'Não autenticado' },
          '403': {
            description: 'Sem permissão (requer LEAGUE_MANAGER ou ADMIN) ou liga já começou',
          },
          '404': { description: 'Liga, fase ou configuração não encontrada' },
        },
      },
    },

    // ==================== DISCIPLINE ====================
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
      post: {
        summary: 'Criar/atualizar regras disciplinares',
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
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Regras criadas/atualizadas' },
          '403': { description: 'Forbidden' },
        },
      },
    },

    // ==================== STANDINGS ====================
    '/api/leagues/{leagueId}/standings': {
      get: {
        summary: 'Obter classificação da liga',
        tags: ['Standings'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'leagueId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Classificação' },
        },
      },
    },
    ...pushNotificationPaths,
  },
  components: {
    ...openapiLeagueManager.components,
    schemas: {
      ...(openapiLeagueManager.components?.schemas || {}),
      ...pushNotificationComponents.schemas,
    },
  },
};
