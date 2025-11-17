/**
 * Documentação RBAC para OpenAPI
 * Componentes e exemplos de erros relacionados ao sistema de controle de acesso
 */

export const rbacComponents = {
  schemas: {
    RBACError: {
      type: 'object',
      properties: {
        error: {
          type: 'string',
          enum: [
            'UNAUTHORIZED',
            'INSUFFICIENT_ROLE',
            'READ_ONLY_ROLE',
            'CONTEXT_REQUIRED',
            'INVALID_CONTEXT',
            'NO_ACCESS_GRANTED',
            'MEMBERSHIP_NOT_FOUND',
          ],
        },
        message: { type: 'string' },
        details: { type: 'object', additionalProperties: true },
        hint: { type: 'string' },
      },
      required: ['error', 'message'],
    },
  },
};

export const rbacExamples = {
  responses: {
    401: {
      description: 'Não autenticado - Token ausente ou inválido',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/RBACError' },
          examples: {
            noToken: {
              summary: 'Token não fornecido',
              value: {
                error: 'UNAUTHORIZED',
                message: 'Token de autenticação ausente',
              },
            },
            invalidToken: {
              summary: 'Token inválido ou expirado',
              value: {
                error: 'UNAUTHORIZED',
                message: 'Token inválido',
              },
            },
          },
        },
      },
    },
    403: {
      description: 'Não autorizado - Permissões insuficientes',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/RBACError' },
          examples: {
            insufficientRole: {
              summary: 'Role insuficiente para acessar o recurso',
              value: {
                error: 'INSUFFICIENT_ROLE',
                message: 'Role insuficiente para acessar este recurso',
                details: {
                  required: ['ADMIN'],
                  current: 'MANAGER',
                },
              },
            },
            readOnlyRole: {
              summary: 'Role somente leitura tentando modificar dados',
              value: {
                error: 'READ_ONLY_ROLE',
                message: 'Role somente leitura não pode modificar dados',
                hint: 'Roles ASSISTANT e REFEREE_COMMISSION são read-only',
              },
            },
            contextRequired: {
              summary: 'Contexto (teamId, leagueId, matchId) obrigatório',
              value: {
                error: 'CONTEXT_REQUIRED',
                message: 'Contexto necessário para verificar permissões',
                details: {
                  requiredContext: ['teamId'],
                },
              },
            },
            noAccessGranted: {
              summary: 'Usuário não tem acesso ao recurso específico',
              value: {
                error: 'NO_ACCESS_GRANTED',
                message: 'Sem acesso ao recurso solicitado',
              },
            },
          },
        },
      },
    },
  },
};

/**
 * Documentação das roles do sistema
 */
export const rbacRolesDocumentation = {
  name: 'RBAC - Sistema de Controle de Acesso',
  description: `
## Sistema de Controle de Acesso Baseado em Roles (RBAC)

Todos os endpoints protegidos exigem autenticação via Bearer Token (JWT).
As permissões são verificadas com base em **roles (papéis)** atribuídas aos usuários.

### 8 Roles Disponíveis

1. **ADMIN** (Administrador Global)
   - Acesso total ao sistema
   - Pode gerenciar ligas, times, jogadores, partidas, disciplina
   - Não precisa de contexto específico (teamId, leagueId)

2. **LEAGUE_MANAGER** (Gestor de Liga)
   - Gerencia uma liga específica
   - Acesso a todas as partidas e times da liga
   - Pode criar e editar times, partidas e jogadores dentro da liga
   - Contexto obrigatório: \`leagueId\`

3. **REFEREE_COMMISSION** (Comissão de Árbitros)
   - **Role SOMENTE LEITURA**
   - Visualiza partidas, times e jogadores
   - NÃO pode modificar dados (endpoints POST/PUT/DELETE bloqueados)
   - Usado para visualização e auditoria

4. **MATCH_MANAGER** (Gestor de Partida)
   - Gerencia partidas específicas
   - Pode editar avaliações, gols, cartões de uma partida
   - Contexto obrigatório: \`matchId\`

5. **MANAGER** (Técnico de Time)
   - Gerencia um time específico
   - Pode editar jogadores, escalações e informações do time
   - Contexto obrigatório: \`teamId\`

6. **ASSISTANT** (Auxiliar Técnico)
   - **Role SOMENTE LEITURA**
   - Visualiza informações do time
   - NÃO pode modificar dados
   - Contexto obrigatório: \`teamId\`

7. **PLAYER** (Jogador)
   - Acesso limitado aos próprios dados
   - Pode visualizar informações do time e partidas
   - Contexto obrigatório: \`teamId\`

8. **FAN** (Torcedor)
   - Acesso público somente leitura
   - Visualiza ligas, times, partidas e estatísticas públicas
   - Role padrão para usuários sem atribuições

### Hierarquia de Permissões

\`\`\`
ADMIN (100) ─── Acesso total
  └─ LEAGUE_MANAGER (50) ─── Liga completa
       ├─ MATCH_MANAGER (35) ─── Partida
       ├─ MANAGER (30) ─── Time (escrita)
       │    └─ ASSISTANT (20) ─── Time (leitura)
       │         └─ PLAYER (10) ─── Jogador
       └─ REFEREE_COMMISSION (40) ─── Sistema (leitura)
            └─ FAN (0) ─── Público (leitura)
\`\`\`

### Roles Somente Leitura (Read-Only)

⚠️ **ASSISTANT** e **REFEREE_COMMISSION** são **read-only**:
- Podem acessar endpoints GET
- Endpoints POST/PUT/PATCH/DELETE retornam **403 READ_ONLY_ROLE**

### Contexto de Acesso

Algumas roles exigem contexto para validação:
- \`teamId\`: MANAGER, ASSISTANT, PLAYER
- \`leagueId\`: LEAGUE_MANAGER
- \`matchId\`: MATCH_MANAGER

O contexto é extraído de:
- \`req.params\` (ex: \`/api/teams/:teamId\`)
- \`req.body\` (ex: POST com \`{ "teamId": "..." }\`)

### Auditoria de Acessos

Todos os acessos (permitidos e negados) são registrados em logs de auditoria:
- Timestamp, userId, endpoint, método HTTP
- Roles requeridas vs role do usuário
- Motivo da negação (se aplicável)
- IP, User-Agent

Admins podem visualizar logs em \`/api/admin/audit\`.

### Cache de Permissões

O sistema utiliza cache in-memory com TTL de 5 minutos para otimizar performance:
- Reduz consultas ao banco de dados
- Cache invalidado automaticamente quando memberships mudam
- Cache por usuário + roles + contexto

### Exemplo de Uso

\`\`\`typescript
// Header obrigatório
Authorization: Bearer <JWT_TOKEN>

// Exemplo: ADMIN criando liga
POST /api/leagues
{ "name": "Liga Exemplo", "isActive": true }
✅ Permitido (ADMIN tem acesso total)

// Exemplo: MANAGER tentando criar liga
POST /api/leagues
{ "name": "Outra Liga" }
❌ Negado (403 INSUFFICIENT_ROLE - requer ADMIN)

// Exemplo: LEAGUE_MANAGER criando time na sua liga
POST /api/teams
{ "name": "Time A", "leagueId": "abc123" }
✅ Permitido (tem LEAGUE_MANAGER na liga abc123)

// Exemplo: ASSISTANT tentando editar time
PUT /api/teams/:teamId
{ "name": "Novo Nome" }
❌ Negado (403 READ_ONLY_ROLE - ASSISTANT é read-only)
\`\`\`

### Endpoints de Auditoria (ADMIN apenas)

- **GET /api/admin/audit/stats** - Estatísticas de acessos
- **GET /api/admin/audit/logs?limit=100** - Logs recentes
- **GET /api/admin/audit/user/:userId** - Logs de usuário
- **GET /api/admin/audit/export** - Exportar todos os logs
- **DELETE /api/admin/audit/old?days=30** - Limpar logs antigos
`,
};

/**
 * Mapeamento de roles por endpoint
 * Formato: { método: [roles permitidas] }
 */
export const endpointRoles: Record<string, Record<string, string[]>> = {
  // LEAGUES
  '/api/leagues': {
    GET: [
      'FAN',
      'PLAYER',
      'ASSISTANT',
      'MANAGER',
      'MATCH_MANAGER',
      'REFEREE_COMMISSION',
      'LEAGUE_MANAGER',
      'ADMIN',
    ],
    POST: ['ADMIN'],
  },
  '/api/leagues/:id': {
    GET: [
      'FAN',
      'PLAYER',
      'ASSISTANT',
      'MANAGER',
      'MATCH_MANAGER',
      'REFEREE_COMMISSION',
      'LEAGUE_MANAGER',
      'ADMIN',
    ],
    PUT: ['ADMIN', 'LEAGUE_MANAGER'],
    DELETE: ['ADMIN'],
  },

  // TEAMS
  '/api/teams': {
    GET: [
      'FAN',
      'PLAYER',
      'ASSISTANT',
      'MANAGER',
      'MATCH_MANAGER',
      'REFEREE_COMMISSION',
      'LEAGUE_MANAGER',
      'ADMIN',
    ],
    POST: ['ADMIN', 'LEAGUE_MANAGER'],
  },
  '/api/teams/:teamId': {
    GET: [
      'FAN',
      'PLAYER',
      'ASSISTANT',
      'MANAGER',
      'MATCH_MANAGER',
      'REFEREE_COMMISSION',
      'LEAGUE_MANAGER',
      'ADMIN',
    ],
    PUT: ['ADMIN', 'LEAGUE_MANAGER', 'MANAGER'],
    DELETE: ['ADMIN', 'LEAGUE_MANAGER'],
  },
  '/api/teams/:teamId/logo': {
    POST: ['ADMIN', 'LEAGUE_MANAGER', 'MANAGER'],
  },
  '/api/teams/:teamId/banner': {
    POST: ['ADMIN', 'LEAGUE_MANAGER', 'MANAGER'],
  },

  // MATCHES
  '/api/matches': {
    GET: [
      'FAN',
      'PLAYER',
      'ASSISTANT',
      'MANAGER',
      'MATCH_MANAGER',
      'REFEREE_COMMISSION',
      'LEAGUE_MANAGER',
      'ADMIN',
    ],
    POST: ['ADMIN', 'LEAGUE_MANAGER'],
  },
  '/api/matches/:matchId': {
    GET: [
      'FAN',
      'PLAYER',
      'ASSISTANT',
      'MANAGER',
      'MATCH_MANAGER',
      'REFEREE_COMMISSION',
      'LEAGUE_MANAGER',
      'ADMIN',
    ],
    PUT: ['ADMIN', 'LEAGUE_MANAGER', 'MATCH_MANAGER'],
    DELETE: ['ADMIN', 'LEAGUE_MANAGER'],
  },
  '/api/matches/:matchId/evaluations': {
    GET: ['PLAYER', 'ASSISTANT', 'MANAGER', 'MATCH_MANAGER', 'LEAGUE_MANAGER', 'ADMIN'],
    POST: ['ADMIN', 'LEAGUE_MANAGER', 'MATCH_MANAGER', 'MANAGER'],
  },

  // DISCIPLINE
  '/api/discipline/cards': {
    GET: [
      'FAN',
      'PLAYER',
      'ASSISTANT',
      'MANAGER',
      'MATCH_MANAGER',
      'REFEREE_COMMISSION',
      'LEAGUE_MANAGER',
      'ADMIN',
    ],
    POST: ['ADMIN', 'LEAGUE_MANAGER', 'MATCH_MANAGER'],
  },
  '/api/discipline/goals': {
    GET: [
      'FAN',
      'PLAYER',
      'ASSISTANT',
      'MANAGER',
      'MATCH_MANAGER',
      'REFEREE_COMMISSION',
      'LEAGUE_MANAGER',
      'ADMIN',
    ],
    POST: ['ADMIN', 'LEAGUE_MANAGER', 'MATCH_MANAGER'],
  },
  '/api/discipline/suspensions': {
    GET: [
      'FAN',
      'PLAYER',
      'ASSISTANT',
      'MANAGER',
      'MATCH_MANAGER',
      'REFEREE_COMMISSION',
      'LEAGUE_MANAGER',
      'ADMIN',
    ],
    POST: ['ADMIN', 'LEAGUE_MANAGER'],
  },
  '/api/discipline/players/:playerId/stats': {
    GET: [
      'FAN',
      'PLAYER',
      'ASSISTANT',
      'MANAGER',
      'MATCH_MANAGER',
      'REFEREE_COMMISSION',
      'LEAGUE_MANAGER',
      'ADMIN',
    ],
  },

  // ACCESS (Gerenciamento de Memberships)
  '/api/access/grant': {
    POST: ['ADMIN', 'LEAGUE_MANAGER'],
  },
  '/api/access/revoke': {
    POST: ['ADMIN', 'LEAGUE_MANAGER'],
  },
  '/api/access/memberships/:userId': {
    GET: ['ADMIN', 'LEAGUE_MANAGER'],
  },

  // AUDIT (ADMIN apenas)
  '/api/admin/audit/stats': {
    GET: ['ADMIN'],
  },
  '/api/admin/audit/logs': {
    GET: ['ADMIN'],
  },
  '/api/admin/audit/user/:userId': {
    GET: ['ADMIN'],
  },
  '/api/admin/audit/export': {
    GET: ['ADMIN'],
  },
  '/api/admin/audit/old': {
    DELETE: ['ADMIN'],
  },
};
