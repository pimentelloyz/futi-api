# Implementação do Sistema RBAC

## 📋 Status da Implementação

### ✅ Completo

1. **Documentação de Referência**
   - ✅ `RBAC.md` - Guia completo com definições de roles, matriz de permissões, exemplos de uso

2. **Estrutura de Dados**
   - ✅ Schema Prisma atualizado com 8 roles: `FAN`, `PLAYER`, `ASSISTANT`, `MANAGER`, `LEAGUE_MANAGER`, `MATCH_MANAGER`, `REFEREE_COMMISSION`, `ADMIN`
   - ✅ Modelo `AccessMembership` com contexto (teamId, leagueId)

3. **Constantes e Tipos**
   - ✅ `src/domain/constants/rbac-errors.ts` - 7 tipos de erro com códigos, mensagens e hints
   - ✅ `src/domain/constants/access-roles.ts` - Enum de roles, hierarquias, funções auxiliares

4. **Lógica de Negócio**
   - ✅ `src/domain/services/rbac.service.ts` - RBACService com 7 métodos:
     - `hasPermission()` - Verificação principal de permissão com contexto
     - `isAdmin()` - Check rápido de admin
     - `getUserMemberships()` - Busca memberships com filtro de contexto
     - `getHighestRole()` - Determina role com maior prioridade
     - `canWrite()` - Verifica se role permite modificações
     - `getUserTeamIds()` / `getUserLeagueIds()` - Helpers de contexto

5. **Middlewares Express**
   - ✅ `src/presentation/middlewares/rbac.middleware.ts` - 5 middlewares:
     - `requireRole(allowedRoles[])` - Autorização principal
     - `requireWrite()` - Bloqueia roles read-only
     - `requireAdmin()` - Atalho para admin-only
     - `requireTeamContext()` - Valida presença de teamId
     - `requireLeagueContext()` - Valida presença de leagueId

6. **Integração em Rotas**
   - ✅ `/api/leagues` - 12 endpoints protegidos com roles apropriados
   - ✅ `/api/access/me` - Atualizado para retornar informações de role (incluindo FAN padrão)

---

## 🔐 Roles Implementados

| Role               | Prioridade | Escopo  | Read-Only | Contexto Requerido |
| ------------------ | ---------- | ------- | --------- | ------------------ |
| FAN                | 0          | Global  | ❌        | Nenhum             |
| PLAYER             | 10         | Time    | ❌        | teamId             |
| ASSISTANT          | 20         | Time    | ✅        | teamId             |
| MANAGER            | 30         | Time    | ❌        | teamId             |
| MATCH_MANAGER      | 35         | Partida | ❌        | matchId\*          |
| REFEREE_COMMISSION | 40         | Liga    | ✅        | leagueId           |
| LEAGUE_MANAGER     | 50         | Liga    | ❌        | leagueId           |
| ADMIN              | 100        | Global  | ❌        | Nenhum             |

\* _matchId ainda não está no schema - pendente de implementação_

---

## 📍 Endpoints Protegidos - Liga

### Criação e Listagem

```typescript
// POST /api/leagues - Criar liga
// Role: ADMIN apenas
requireRole([AccessRole.ADMIN]);

// GET /api/leagues - Listar todas (público)
// Sem proteção RBAC (acesso público)

// GET /api/leagues/me - Minhas ligas
// Roles: PLAYER, MANAGER, ASSISTANT, LEAGUE_MANAGER, ADMIN
requireRole([
  AccessRole.PLAYER,
  AccessRole.MANAGER,
  AccessRole.ASSISTANT,
  AccessRole.LEAGUE_MANAGER,
  AccessRole.ADMIN,
]);

// GET /api/leagues/me/:id - Detalhes da minha liga
// Roles: PLAYER, MANAGER, ASSISTANT, LEAGUE_MANAGER, ADMIN
requireRole([
  AccessRole.PLAYER,
  AccessRole.MANAGER,
  AccessRole.ASSISTANT,
  AccessRole.LEAGUE_MANAGER,
  AccessRole.ADMIN,
]);

// GET /api/leagues/:id - Obter liga por ID (público)
// Sem proteção RBAC

// GET /api/leagues/:id/teams - Listar times (público)
// Sem proteção RBAC
```

### Gerenciamento

```typescript
// PATCH /api/leagues/:id - Atualizar liga
// Roles: LEAGUE_MANAGER, ADMIN
requireRole([AccessRole.LEAGUE_MANAGER, AccessRole.ADMIN]);

// DELETE /api/leagues/:id - Deletar liga
// Role: ADMIN apenas
requireRole([AccessRole.ADMIN]);

// POST /api/leagues/:id/teams - Adicionar time
// Roles: LEAGUE_MANAGER, ADMIN
requireRole([AccessRole.LEAGUE_MANAGER, AccessRole.ADMIN]);
```

### Uploads

```typescript
// POST /api/leagues/:id/icon - Upload ícone
// Roles: LEAGUE_MANAGER, ADMIN
requireRole([AccessRole.LEAGUE_MANAGER, AccessRole.ADMIN]);

// POST /api/leagues/:id/banner - Upload banner
// Roles: LEAGUE_MANAGER, ADMIN
requireRole([AccessRole.LEAGUE_MANAGER, AccessRole.ADMIN]);
```

### Grupos e Fixtures

```typescript
// POST /api/leagues/:id/groups - Criar grupo
// Roles: LEAGUE_MANAGER, ADMIN
requireRole([AccessRole.LEAGUE_MANAGER, AccessRole.ADMIN]);

// POST /api/leagues/:id/groups/:groupId/teams - Adicionar time ao grupo
// Roles: LEAGUE_MANAGER, ADMIN
requireRole([AccessRole.LEAGUE_MANAGER, AccessRole.ADMIN]);

// POST /api/leagues/:id/groups/:groupId/fixtures - Gerar jogos
// Roles: LEAGUE_MANAGER, ADMIN
requireRole([AccessRole.LEAGUE_MANAGER, AccessRole.ADMIN]);
```

---

## 📝 Endpoint /api/access/me Atualizado

### Resposta Antiga

```json
{
  "memberships": [
    {
      "id": "...",
      "role": "MANAGER",
      "teamId": "...",
      "team": { "id": "...", "name": "..." }
    }
  ]
}
```

### Resposta Nova

```json
{
  "user": {
    "id": "user123",
    "email": "usuario@exemplo.com",
    "displayName": "Nome do Usuário"
  },
  "memberships": [
    {
      "id": "...",
      "role": "MANAGER",
      "teamId": "...",
      "team": { "id": "...", "name": "..." },
      "leagueId": "...",
      "league": { "id": "...", "name": "..." }
    }
  ],
  "defaultRole": null // "FAN" se memberships.length === 0
}
```

**Lógica:**

- Se o usuário **não tem memberships**, `defaultRole` = `"FAN"` (torcedor)
- Se o usuário **tem memberships**, `defaultRole` = `null`
- Campo `user` sempre retorna informações básicas do usuário autenticado

---

## ⚠️ Pendências

### 1. Aplicar RBAC em Outros Módulos

**Times** (`/api/teams`)

- ❌ POST /teams - [MANAGER, ADMIN]
- ❌ GET /teams/:id - [PLAYER, MANAGER, ASSISTANT, ADMIN] + validação de contexto
- ❌ PATCH /teams/:id - [MANAGER, ADMIN] + validação de ownership
- ❌ DELETE /teams/:id - [ADMIN]

**Partidas** (`/api/matches`)

- ❌ POST /matches - [LEAGUE_MANAGER, ADMIN]
- ❌ GET /matches/:id - Público
- ❌ PATCH /matches/:id - [MATCH_MANAGER, LEAGUE_MANAGER, ADMIN]
- ❌ POST /matches/:id/events - [MATCH_MANAGER, ADMIN]
- ❌ POST /matches/:id/lineup - [MANAGER, ADMIN] + validação de time

**Convites** (`/api/invitations`)

- ❌ Já refatorado, mas sem RBAC aplicado
- ❌ POST /invitations - [MANAGER, LEAGUE_MANAGER, ADMIN]
- ❌ PATCH /invitations/:id - Usuário convidado apenas

### 2. Criar Endpoints de Disciplina

Para o role `REFEREE_COMMISSION`:

```typescript
// GET /api/leagues/:leagueId/discipline/cards
// Lista todos os cartões da liga
// Roles: REFEREE_COMMISSION, LEAGUE_MANAGER, ADMIN

// GET /api/leagues/:leagueId/discipline/players/:playerId
// Histórico disciplinar de um jogador em uma liga
// Roles: REFEREE_COMMISSION, LEAGUE_MANAGER, ADMIN

// GET /api/players/:playerId/discipline/history
// Histórico completo de cartões de um jogador (todas as ligas)
// Roles: REFEREE_COMMISSION, ADMIN

// GET /api/matches/:matchId/events?type=YELLOW_CARD,RED_CARD
// Filtrar eventos da partida por tipo
// Roles: Público (já existe, só precisa de filtro)
```

**Arquivos necessários:**

- `src/application/use-cases/discipline/`
  - `list-league-cards-use-case.ts`
  - `get-player-discipline-history-use-case.ts`
- `src/domain/repositories/discipline-repository.ts`
- `src/infra/repositories/prisma-discipline-repository.ts`
- `src/presentation/controllers/discipline/`
  - `list-league-cards-controller.ts`
  - `get-player-discipline-history-controller.ts`
- `src/presentation/routes/discipline-router.ts`

### 3. Adicionar matchId ao Schema

Atualmente, `AccessMembership` não tem campo `matchId`, necessário para o role `MATCH_MANAGER`.

**Mudança no schema:**

```prisma
model AccessMembership {
  id        String   @id @default(cuid())
  userId    String
  role      AccessRole
  teamId    String?
  leagueId  String?
  matchId   String?   // NOVO
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user   User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  team   Team?   @relation(fields: [teamId], references: [id], onDelete: Cascade)
  league League? @relation(fields: [leagueId], references: [id], onDelete: Cascade)
  match  Match?  @relation(fields: [matchId], references: [id], onDelete: Cascade) // NOVO

  @@unique([userId, teamId, leagueId, matchId]) // Atualizar unique constraint
  @@index([userId])
  @@index([teamId])
  @@index([leagueId])
  @@index([matchId]) // NOVO
  @@map("access_membership")
}

model Match {
  // ... campos existentes
  managers AccessMembership[] // NOVO - relação inversa
  // ...
}
```

**Comandos necessários:**

```bash
npx prisma db push
# ou
npx prisma migrate dev --name add_match_id_to_access_membership
```

### 4. Testes de Integração

Criar testes end-to-end para cada role:

```typescript
// src/tests/rbac.e2e.test.ts
describe('RBAC System', () => {
  describe('FAN Role', () => {
    it('should view public leagues', async () => {
      /* ... */
    });
    it('should NOT create league', async () => {
      /* ... */
    });
  });

  describe('PLAYER Role', () => {
    it('should view own team', async () => {
      /* ... */
    });
    it('should NOT view other teams', async () => {
      /* ... */
    });
  });

  describe('ASSISTANT Role (Read-Only)', () => {
    it('should view team data', async () => {
      /* ... */
    });
    it('should NOT modify team', async () => {
      /* ... */
    });
  });

  describe('MANAGER Role', () => {
    it('should manage own team', async () => {
      /* ... */
    });
    it('should send player invites', async () => {
      /* ... */
    });
    it('should NOT manage other teams', async () => {
      /* ... */
    });
  });

  describe('LEAGUE_MANAGER Role', () => {
    it('should manage league', async () => {
      /* ... */
    });
    it('should add teams to league', async () => {
      /* ... */
    });
    it('should NOT manage matches', async () => {
      /* ... */
    });
  });

  describe('MATCH_MANAGER Role', () => {
    it('should record match events', async () => {
      /* ... */
    });
    it('should NOT manage teams', async () => {
      /* ... */
    });
  });

  describe('REFEREE_COMMISSION Role (Read-Only)', () => {
    it('should view discipline data', async () => {
      /* ... */
    });
    it('should view calendar', async () => {
      /* ... */
    });
    it('should NOT modify data', async () => {
      /* ... */
    });
  });

  describe('ADMIN Role', () => {
    it('should have full access', async () => {
      /* ... */
    });
    it('should bypass all restrictions', async () => {
      /* ... */
    });
  });
});
```

### 5. Validação de Contexto nos Controllers

Alguns endpoints precisam validar se o usuário tem acesso ao contexto específico **dentro do controller**, não apenas no middleware.

**Exemplo:** Um PLAYER tentando acessar `/api/teams/:id` precisa verificar se `teamId` está nos seus `getUserTeamIds()`.

```typescript
// src/presentation/controllers/teams/get-team-controller.ts
export class GetTeamController implements Controller {
  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { id: teamId } = request.params;
    const userId = request.user.id;

    // Verificar se usuário tem acesso a este time
    const rbacService = new RBACService(prisma);
    const hasAccess = await rbacService.hasPermission(
      userId,
      [AccessRole.PLAYER, AccessRole.MANAGER, AccessRole.ASSISTANT, AccessRole.ADMIN],
      { teamId },
    );

    if (!hasAccess) {
      return {
        statusCode: 403,
        body: { error: RBAC_ERRORS.WRONG_CONTEXT.code },
      };
    }

    // Continuar com lógica normal...
  }
}
```

---

## 🚀 Próximos Passos (Prioridade)

1. **ALTA** - Criar endpoints de disciplina para REFEREE_COMMISSION
2. **ALTA** - Aplicar RBAC em rotas de `/api/teams`
3. **MÉDIA** - Aplicar RBAC em rotas de `/api/matches`
4. **MÉDIA** - Adicionar `matchId` ao schema AccessMembership
5. **MÉDIA** - Validação de contexto nos controllers (ownership checks)
6. **BAIXA** - Criar testes E2E para RBAC
7. **BAIXA** - Documentar exemplos de uso no frontend

---

## 📚 Recursos

- **Documentação Completa:** `RBAC.md`
- **Códigos de Erro:** `src/domain/constants/rbac-errors.ts`
- **Utilitários:** `src/domain/constants/access-roles.ts`
- **Serviço Principal:** `src/domain/services/rbac.service.ts`
- **Middlewares:** `src/presentation/middlewares/rbac.middleware.ts`

---

## 💡 Dicas de Uso

### Como proteger um endpoint novo:

```typescript
import { requireRole } from '../middlewares/rbac.middleware.js';
import { AccessRole } from '../../domain/constants/access-roles.js';

router.post(
  '/meu-endpoint',
  jwtAuth, // Sempre primeiro
  requireRole([AccessRole.MANAGER, AccessRole.ADMIN]), // Depois RBAC
  async (req, res) => {
    // handler...
  },
);
```

### Como verificar permissão dentro de um controller:

```typescript
import { RBACService } from '../../domain/services/rbac.service.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const rbacService = new RBACService(prisma);

const hasPermission = await rbacService.hasPermission(userId, [AccessRole.MANAGER], { teamId });

if (!hasPermission) {
  return { statusCode: 403, body: { error: 'FORBIDDEN' } };
}
```

### Como bloquear roles read-only:

```typescript
router.patch(
  '/endpoint',
  jwtAuth,
  requireRole([AccessRole.MANAGER, AccessRole.ADMIN]),
  requireWrite(), // Bloqueia ASSISTANT
  async (req, res) => {
    // handler...
  },
);
```

---

**Última atualização:** $(date)
