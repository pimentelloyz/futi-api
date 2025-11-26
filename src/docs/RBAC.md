# Sistema de Controle de Acesso (RBAC) - Futi API

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Roles (Funções)](#roles-funções)
3. [Estrutura do Banco de Dados](#estrutura-do-banco-de-dados)
4. [Fluxo de Autenticação](#fluxo-de-autenticação)
5. [Permissões por Role](#permissões-por-role)
6. [Mensagens de Erro](#mensagens-de-erro)
7. [Exemplos de Uso](#exemplos-de-uso)

---

## 🎯 Visão Geral

O sistema implementa **Role-Based Access Control (RBAC)** com 8 níveis de acesso distintos. Cada usuário pode ter múltiplas roles em diferentes contextos (times, ligas, partidas).

### Fluxo de Acesso

```
1. Login (Firebase) → 2. /auth/firebase/exchange → 3. /api/access/me → 4. Endpoints Protegidos
```

---

## 👥 Roles (Funções)

### 1. **FAN** (Torcedor) 🏟️

**Contexto**: Usuário padrão sem memberships  
**Quando**: Logo após login, se não tiver nenhuma role atribuída

**Permissões**:

- ✅ Visualizar ligas públicas (`League.isPublic = true`)
- ✅ Visualizar times públicos
- ✅ Visualizar calendário de partidas públicas
- ❌ Não pode gerenciar nada

**Identificação**: Ausência de `AccessMembership` no banco

---

### 2. **PLAYER** (Jogador) ⚽

**Contexto**: Time específico  
**Atribuído quando**: Jogador aceita convite do time

**Permissões**:

- ✅ Visualizar dados do **próprio time**
- ✅ Visualizar escalações onde está incluído
- ✅ Visualizar suas próprias avaliações
- ✅ Avaliar outros jogadores do time (pós-partida)
- ❌ Não pode gerenciar time
- ❌ Não pode ver dados de outros times

**Endpoints**:

```
GET  /api/teams/:teamId (somente seu time)
GET  /api/teams/:teamId/players (somente seu time)
GET  /api/matches?teamId=:teamId (partidas do seu time)
GET  /api/evaluations/me
POST /api/evaluations (avaliar companheiros)
```

---

### 3. **MANAGER** (Técnico) 👔

**Contexto**: Time específico  
**Atribuído quando**: Criador do time ou promovido por ADMIN

**Permissões**:

- ✅ **TODAS** as permissões do PLAYER
- ✅ Gerenciar jogadores do time (adicionar/remover)
- ✅ Criar e gerenciar convites para jogadores
- ✅ Definir escalações (lineup)
- ✅ Atualizar informações do time
- ✅ Visualizar e gerenciar avaliações do time
- ❌ Não pode deletar o time (somente ADMIN)

**Endpoints**:

```
POST   /api/teams/:teamId/invites
PATCH  /api/teams/:teamId
POST   /api/teams/:teamId/players
DELETE /api/teams/:teamId/players/:playerId
POST   /api/matches/:matchId/lineup
GET    /api/evaluations/team/:teamId
```

---

### 4. **ASSISTANT** (Auxiliar Técnico) 🧑‍🏫

**Contexto**: Time específico  
**Atribuído quando**: MANAGER concede acesso

**Permissões**:

- ✅ **Visualizar TUDO** que o MANAGER vê
- ✅ Mesmos endpoints do MANAGER
- ❌ **Somente leitura** (não pode modificar)
- ❌ Não pode criar convites
- ❌ Não pode modificar escalações

**Endpoints** (somente GET):

```
GET /api/teams/:teamId
GET /api/teams/:teamId/players
GET /api/teams/:teamId/invites
GET /api/matches/:matchId/lineup
GET /api/evaluations/team/:teamId
```

---

### 5. **LEAGUE_MANAGER** (Gestor de Liga) 🏆

**Contexto**: Liga específica  
**Atribuído quando**: Criador da liga ou promovido por ADMIN

**Permissões**:

- ✅ Gerenciar liga (atualizar dados, ativar/desativar)
- ✅ Adicionar/remover times da liga
- ✅ Criar grupos dentro da liga
- ✅ Criar convites para técnicos participarem
- ✅ Gerar fixtures (tabela de jogos)
- ✅ Visualizar todos os times da liga
- ❌ Não pode gerenciar times diretamente
- ❌ Não pode gerenciar partidas (eventos)

**Endpoints**:

```
PATCH  /api/leagues/:leagueId
POST   /api/leagues/:leagueId/teams
DELETE /api/leagues/:leagueId/teams/:teamId
POST   /api/leagues/:leagueId/groups
POST   /api/leagues/:leagueId/groups/:groupId/teams
POST   /api/leagues/:leagueId/groups/:groupId/fixtures
POST   /api/leagues/:leagueId/invites
GET    /api/leagues/:leagueId/teams
```

---

### 6. **MATCH_MANAGER** (Árbitro/Mesário) 🎯

**Contexto**: Partida específica  
**Atribuído quando**: LEAGUE_MANAGER ou ADMIN atribui para a partida

**Permissões**:

- ✅ Registrar eventos da partida (gols, cartões, faltas)
- ✅ Iniciar/finalizar partida
- ✅ Atualizar placar
- ✅ Visualizar escalações
- ❌ Não pode modificar escalações
- ❌ Não pode deletar partida

**Endpoints**:

```
POST  /api/matches/:matchId/events (gols, cartões)
PATCH /api/matches/:matchId/status (iniciar/finalizar)
PATCH /api/matches/:matchId/score
GET   /api/matches/:matchId/lineup
GET   /api/matches/:matchId/events
```

---

### 7. **REFEREE_COMMISSION** (Comissão de Arbitragem) 📊

**Contexto**: Liga específica  
**Atribuído quando**: LEAGUE_MANAGER ou ADMIN concede acesso

**Permissões**:

- ✅ Visualizar calendário completo de jogos
- ✅ Visualizar cartões (amarelos/vermelhos)
- ✅ Visualizar expulsões
- ✅ Visualizar histórico disciplinar de jogadores
- ✅ Gerar relatórios de disciplina
- ❌ **Somente leitura** (não pode modificar)

**Endpoints** (somente GET):

```
GET /api/leagues/:leagueId/matches
GET /api/leagues/:leagueId/discipline/cards
GET /api/leagues/:leagueId/discipline/players/:playerId
GET /api/players/:playerId/discipline/history
GET /api/matches/:matchId/events?type=YELLOW_CARD,RED_CARD
```

---

### 8. **ADMIN** (Administrador) 👑

**Contexto**: Global (sistema inteiro)  
**Atribuído quando**: Manualmente no banco de dados

**Permissões**:

- ✅ **ACESSO TOTAL** a todos os recursos
- ✅ Gerenciar TUDO: ligas, times, jogadores, usuários
- ✅ Atribuir/revogar qualquer role
- ✅ Deletar qualquer recurso
- ✅ Visualizar logs e métricas

**Endpoints**: TODOS

---

## 🗄️ Estrutura do Banco de Dados

### Tabela: `AccessMembership`

```prisma
model AccessMembership {
  id        String     @id @default(uuid())
  userId    String     // Quem tem o acesso
  teamId    String?    // Contexto: time (para PLAYER, MANAGER, ASSISTANT)
  leagueId  String?    // Contexto: liga (para LEAGUE_MANAGER, REFEREE_COMMISSION)
  role      AccessRole // Uma das 8 roles
  createdAt DateTime   @default(now())

  @@unique([userId, teamId, leagueId])
  @@index([userId, role])
}
```

### Enum: `AccessRole`

```prisma
enum AccessRole {
  ADMIN              // Global
  MANAGER            // Por time
  ASSISTANT          // Por time
  PLAYER             // Por time
  LEAGUE_MANAGER     // Por liga
  MATCH_MANAGER      // Por partida (implementar relação matchId)
  REFEREE_COMMISSION // Por liga
  FAN                // Não armazenado no banco (role padrão)
}
```

### Melhorias Necessárias

```prisma
// Adicionar suporte para MATCH_MANAGER
model AccessMembership {
  // ... campos existentes
  matchId String? // Novo: contexto para MATCH_MANAGER
  match   Match?  @relation(fields: [matchId], references: [id])

  @@unique([userId, teamId, leagueId, matchId])
}

// Atualizar Match para ter managers
model Match {
  // ... campos existentes
  managers AccessMembership[] // Relacionamento reverso
}
```

---

## 🔐 Fluxo de Autenticação

### 1. Login e Exchange

```typescript
// 1. Usuário faz login no Firebase
POST / api / auth / firebase / exchange;
Body: {
  firebaseToken: '...';
}
Response: {
  token: 'JWT_TOKEN';
}
```

### 2. Consultar Permissões

```typescript
// 2. App consulta permissões do usuário
GET /api/access/me
Headers: { Authorization: "Bearer JWT_TOKEN" }

Response: {
  user: {
    id: "uuid",
    email: "user@example.com",
    displayName: "João Silva"
  },
  memberships: [
    {
      id: "uuid",
      role: "MANAGER",
      team: {
        id: "team-uuid",
        name: "Time A"
      },
      league: null
    },
    {
      id: "uuid",
      role: "LEAGUE_MANAGER",
      team: null,
      league: {
        id: "league-uuid",
        name: "Liga Paulista"
      }
    }
  ],
  defaultRole: "FAN" // Se memberships estiver vazio
}
```

### 3. Acessar Endpoints Protegidos

```typescript
// 3. App usa JWT + role para acessar recursos
GET /api/teams/team-uuid
Headers: {
  Authorization: "Bearer JWT_TOKEN",
  X-Required-Role: "MANAGER" // Middleware valida
}
```

---

## 🛡️ Permissões por Role

### Matriz de Permissões

| Recurso            | FAN    | PLAYER | ASSISTANT | MANAGER | LEAGUE_MGR | MATCH_MGR | REFEREE | ADMIN |
| ------------------ | ------ | ------ | --------- | ------- | ---------- | --------- | ------- | ----- |
| **LIGAS**          |
| Ver ligas públicas | ✅     | ✅     | ✅        | ✅      | ✅         | ✅        | ✅      | ✅    |
| Ver ligas privadas | ❌     | ✅\*   | ✅\*      | ✅\*    | ✅         | ❌        | ✅      | ✅    |
| Criar liga         | ❌     | ❌     | ❌        | ❌      | ❌         | ❌        | ❌      | ✅    |
| Editar liga        | ❌     | ❌     | ❌        | ❌      | ✅         | ❌        | ❌      | ✅    |
| Deletar liga       | ❌     | ❌     | ❌        | ❌      | ❌         | ❌        | ❌      | ✅    |
| **TIMES**          |
| Ver time           | ✅\*\* | ✅     | ✅        | ✅      | ✅\*\*\*   | ❌        | ❌      | ✅    |
| Criar time         | ❌     | ❌     | ❌        | ✅      | ❌         | ❌        | ❌      | ✅    |
| Editar time        | ❌     | ❌     | ❌        | ✅      | ❌         | ❌        | ❌      | ✅    |
| Deletar time       | ❌     | ❌     | ❌        | ❌      | ❌         | ❌        | ❌      | ✅    |
| Adicionar jogador  | ❌     | ❌     | ❌        | ✅      | ❌         | ❌        | ❌      | ✅    |
| Remover jogador    | ❌     | ❌     | ❌        | ✅      | ❌         | ❌        | ❌      | ✅    |
| **PARTIDAS**       |
| Ver partidas       | ✅     | ✅     | ✅        | ✅      | ✅         | ✅        | ✅      | ✅    |
| Criar partida      | ❌     | ❌     | ❌        | ❌      | ✅         | ❌        | ❌      | ✅    |
| Registrar eventos  | ❌     | ❌     | ❌        | ❌      | ❌         | ✅        | ❌      | ✅    |
| Ver disciplina     | ❌     | ❌     | ❌        | ❌      | ❌         | ❌        | ✅      | ✅    |
| **ESCALAÇÃO**      |
| Ver escalação      | ✅     | ✅     | ✅        | ✅      | ❌         | ✅        | ❌      | ✅    |
| Criar escalação    | ❌     | ❌     | ❌        | ✅      | ❌         | ❌        | ❌      | ✅    |
| **AVALIAÇÕES**     |
| Ver próprias       | ❌     | ✅     | ✅        | ✅      | ❌         | ❌        | ❌      | ✅    |
| Avaliar jogadores  | ❌     | ✅     | ❌        | ✅      | ❌         | ❌        | ❌      | ✅    |
| Ver do time        | ❌     | ❌     | ✅        | ✅      | ❌         | ❌        | ❌      | ✅    |

**Legendas:**

- `*` = Somente se o time estiver na liga
- `**` = Somente times públicos ou do próprio usuário
- `***` = Somente times da liga que gerencia

---

## ❌ Mensagens de Erro

### Códigos de Erro HTTP

```typescript
export const RBAC_ERRORS = {
  // 401 - Não autenticado
  UNAUTHORIZED: {
    code: 'UNAUTHORIZED',
    message: 'Você precisa estar autenticado para acessar este recurso',
    statusCode: 401,
  },

  // 403 - Sem permissão
  FORBIDDEN: {
    code: 'FORBIDDEN',
    message: 'Você não tem permissão para acessar este recurso',
    statusCode: 403,
  },

  // 403 - Role insuficiente
  INSUFFICIENT_ROLE: {
    code: 'INSUFFICIENT_ROLE',
    message: 'Sua função atual não permite esta ação',
    statusCode: 403,
    details: (required: string, current: string) => `Necessário: ${required}, Atual: ${current}`,
  },

  // 403 - Fora do contexto
  WRONG_CONTEXT: {
    code: 'WRONG_CONTEXT',
    message: 'Você não tem permissão neste contexto (time/liga)',
    statusCode: 403,
  },

  // 403 - Somente leitura
  READ_ONLY_ROLE: {
    code: 'READ_ONLY_ROLE',
    message: 'Sua função permite apenas visualização',
    statusCode: 403,
    hint: 'Contate um MANAGER ou ADMIN para realizar esta ação',
  },

  // 404 - Recurso não encontrado
  RESOURCE_NOT_FOUND: {
    code: 'RESOURCE_NOT_FOUND',
    message: 'Recurso não encontrado ou você não tem acesso',
    statusCode: 404,
  },

  // 400 - Contexto inválido
  INVALID_CONTEXT: {
    code: 'INVALID_CONTEXT',
    message: 'Contexto inválido: especifique teamId ou leagueId',
    statusCode: 400,
  },
};
```

### Mensagens Específicas por Role

#### FAN

```json
{
  "error": "INSUFFICIENT_ROLE",
  "message": "Torcedores podem apenas visualizar ligas públicas",
  "hint": "Entre em um time ou ligue para ter mais acesso"
}
```

#### PLAYER

```json
{
  "error": "WRONG_CONTEXT",
  "message": "Você só pode visualizar dados do seu time",
  "yourTeam": "Time A",
  "requestedTeam": "Time B"
}
```

#### ASSISTANT

```json
{
  "error": "READ_ONLY_ROLE",
  "message": "Auxiliares técnicos têm acesso somente leitura",
  "hint": "Solicite ao técnico para realizar esta ação"
}
```

#### MANAGER

```json
{
  "error": "WRONG_CONTEXT",
  "message": "Você só pode gerenciar o time: Time A",
  "requestedAction": "Adicionar jogador ao Time B"
}
```

#### LEAGUE_MANAGER

```json
{
  "error": "INSUFFICIENT_ROLE",
  "message": "Gestores de liga não podem gerenciar eventos de partidas",
  "hint": "Atribua um MATCH_MANAGER para a partida"
}
```

#### MATCH_MANAGER

```json
{
  "error": "WRONG_CONTEXT",
  "message": "Você só pode gerenciar a partida atribuída",
  "yourMatch": "Time A vs Time B - 2025-01-15",
  "requestedMatch": "Time C vs Time D - 2025-01-16"
}
```

#### REFEREE_COMMISSION

```json
{
  "error": "READ_ONLY_ROLE",
  "message": "Comissão de arbitragem tem acesso somente leitura",
  "allowedActions": ["visualizar calendário", "visualizar cartões", "gerar relatórios"]
}
```

---

## 📝 Exemplos de Uso

### Exemplo 1: Fluxo Torcedor → Jogador

```typescript
// 1. Torcedor faz login
POST /api/auth/firebase/exchange
Response: { token: "jwt-token" }

// 2. Verifica permissões (ainda é FAN)
GET /api/access/me
Response: {
  user: { id: "user-1", email: "fan@example.com" },
  memberships: [],
  defaultRole: "FAN"
}

// 3. Tenta criar time (negado)
POST /api/teams
Response: 403 {
  "error": "INSUFFICIENT_ROLE",
  "message": "Torcedores não podem criar times"
}

// 4. Aceita convite de time
POST /api/invitations/accept
Body: { code: "ABC123" }
Response: 200 { message: "Bem-vindo ao Time A!" }

// 5. Verifica permissões novamente (agora é PLAYER)
GET /api/access/me
Response: {
  memberships: [{
    role: "PLAYER",
    team: { id: "team-1", name: "Time A" }
  }]
}

// 6. Agora pode visualizar seu time
GET /api/teams/team-1
Response: 200 { ...dados do time }
```

### Exemplo 2: Manager Gerenciando Time

```typescript
// Manager adiciona jogador
POST /api/teams/team-1/invites
Headers: { Authorization: "Bearer jwt", X-Required-Role: "MANAGER" }
Body: { maxUses: 5, expiresAt: "2025-12-31" }
Response: 200 { code: "XYZ789", expiresAt: "..." }

// Manager tenta adicionar em outro time (negado)
POST /api/teams/team-2/invites
Response: 403 {
  "error": "WRONG_CONTEXT",
  "message": "Você só pode gerenciar o time: Time A"
}

// Manager define escalação
POST /api/matches/match-1/lineup
Body: {
  teamId: "team-1",
  players: ["player-1", "player-2", "player-3"]
}
Response: 200 { message: "Escalação salva" }
```

### Exemplo 3: League Manager Criando Liga

```typescript
// League Manager cria grupo
POST /api/leagues/league-1/groups
Headers: { X-Required-Role: "LEAGUE_MANAGER" }
Body: { name: "Grupo A" }
Response: 201 { id: "group-1", name: "Grupo A" }

// Adiciona times ao grupo
POST /api/leagues/league-1/teams
Body: { teamId: "team-1" }
Response: 201 { message: "Time adicionado à liga" }

// Gera fixtures
POST /api/leagues/league-1/groups/group-1/fixtures
Response: 201 {
  count: 12,
  matches: [...]
}

// Tenta registrar gol (negado)
POST /api/matches/match-1/events
Body: { type: "GOAL", playerId: "player-1" }
Response: 403 {
  "error": "INSUFFICIENT_ROLE",
  "message": "Gestores de liga não podem gerenciar eventos",
  "hint": "Atribua um MATCH_MANAGER"
}
```

### Exemplo 4: Match Manager Durante Jogo

```typescript
// Match Manager registra gol
POST /api/matches/match-1/events
Headers: { X-Required-Role: "MATCH_MANAGER" }
Body: {
  type: "GOAL",
  playerId: "player-1",
  teamId: "team-1",
  minute: 23
}
Response: 201 { id: "event-1", type: "GOAL" }

// Aplica cartão amarelo
POST /api/matches/match-1/events
Body: {
  type: "YELLOW_CARD",
  playerId: "player-2",
  minute: 45
}
Response: 201 { id: "event-2" }

// Finaliza partida
PATCH /api/matches/match-1/status
Body: { status: "FINISHED" }
Response: 200 {
  homeScore: 2,
  awayScore: 1,
  status: "FINISHED"
}
```

### Exemplo 5: Referee Commission Consultando Disciplina

```typescript
// Ver todos os cartões da liga
GET /api/leagues/league-1/discipline/cards
Headers: { X-Required-Role: "REFEREE_COMMISSION" }
Response: 200 {
  yellowCards: [
    {
      player: "João Silva",
      team: "Time A",
      match: "Time A vs Time B",
      date: "2025-01-10"
    }
  ],
  redCards: [...]
}

// Ver histórico de um jogador
GET /api/players/player-1/discipline/history
Response: 200 {
  player: "João Silva",
  yellowCards: 3,
  redCards: 0,
  suspensions: 0,
  lastCard: "2025-01-10"
}

// Tenta aplicar cartão (negado - somente leitura)
POST /api/matches/match-1/events
Response: 403 {
  "error": "READ_ONLY_ROLE",
  "message": "Comissão tem acesso somente leitura"
}
```

---

## 🚀 Implementação

### Middleware de Autorização

```typescript
// src/presentation/middlewares/rbac.middleware.ts
export function requireRole(allowedRoles: AccessRole[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const requiredContext = {
      teamId: req.params.teamId || req.body.teamId,
      leagueId: req.params.leagueId || req.body.leagueId,
      matchId: req.params.matchId || req.body.matchId,
    };

    const hasPermission = await checkPermission(userId, allowedRoles, requiredContext);

    if (!hasPermission) {
      return res.status(403).json({
        error: 'INSUFFICIENT_ROLE',
        message: 'Você não tem permissão para esta ação',
      });
    }

    next();
  };
}

// Uso
router.post(
  '/teams/:teamId/invites',
  jwtAuth,
  requireRole(['MANAGER', 'ADMIN']),
  createInviteController,
);
```

---

## 📊 Próximos Passos

1. ✅ Atualizar schema Prisma com novos roles
2. ⏳ Criar middleware RBAC
3. ⏳ Proteger endpoints existentes
4. ⏳ Criar endpoints de disciplina
5. ⏳ Implementar auditoria de ações
6. ⏳ Adicionar testes de permissão
7. ⏳ Documentar API com roles no OpenAPI

---

**Última atualização**: 17/11/2025  
**Versão**: 1.0.0
