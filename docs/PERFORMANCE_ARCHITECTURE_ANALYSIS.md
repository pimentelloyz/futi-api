# Relatório de Análise: Performance, Arquitetura e Testes

**Data:** 26 de novembro de 2025  
**Escopo:** Análise de routers, queries e cobertura de testes

---

## 🔴 PROBLEMAS CRÍTICOS IDENTIFICADOS

### 1. Routers com Lógica de Negócio Embarcada (Anti-Pattern)

Os seguintes routers **NÃO estão usando controllers** e possuem lógica de negócio diretamente nas rotas:

#### **evaluations-router.ts** (156 linhas)
- ✅ `GET /pending` - REFATORADO: controller + use case + testes (5 testes unitários) + N+1 otimizado
- ❌ `GET /:assignmentId/form` - lógica inline (pendente)
- ❌ `POST /submit` - lógica inline (pendente)
- ❌ Sem camada de repository completa
- **Impacto:** Alto → Médio (1 de 3 rotas refatoradas, N+1 query eliminado)

#### **players-router.ts** (500 linhas - reduzido de 617)
- ✅ `GET /me/exists` - REFATORADO: controller + use case + testes (3 testes unitários)
- ✅ `PATCH /me` - REFATORADO: controller + use case + testes (7 testes unitários)
- ❌ `POST /me` - criação de player com upload inline (pendente)
- ❌ `POST /:id/photo` - upload de foto com Firebase inline (pendente)
- ❌ `GET /me/team/overview` - queries complexas inline (120+ linhas) (pendente)
- ❌ `POST /me/skills` - manipulação de skills inline (pendente)
- ❌ Upload de arquivo misturado com lógica de negócio
- **Impacto:** Crítico → Médio (2 de 10+ rotas refatoradas, redução de 19% no tamanho)

#### **invitation-codes-router.ts**
- ✅ Todas as 8 rotas já usam controllers via factories
- ❌ Sem testes unitários para os use cases
- **Impacto:** Baixo - estrutura correta, faltam apenas testes

#### **access-router.ts**
- ✅ Todas as 3 rotas já usam controllers
- ❌ Sem testes unitários para os controllers
- **Impacto:** Baixo - estrutura correta, faltam apenas testes

---

## ⚠️ PROBLEMAS DE PERFORMANCE

### 2. N+1 Query Problems

#### **evaluations-router.ts - GET /pending**
✅ **RESOLVIDO** - Implementado join otimizado usando relação `target` do Prisma

**Antes (N+1 query):**
```typescript
// ❌ PROBLEMA: 2+ queries (1 para assignments + 1 para players)
const assignments = await prisma.matchPlayerEvaluationAssignment.findMany({
  where: { evaluatorPlayerId: mePlayer.id, completedAt: null },
  select: { id: true, matchId: true, targetPlayerId: true },
});

const targetIds = Array.from(new Set(assignments.map((a) => a.targetPlayerId)));
const targets = await prisma.player.findMany({
  where: { id: { in: targetIds } },
  select: { id: true, name: true },
});
```

**Depois (Query Otimizada):**
```typescript
// ✅ SOLUÇÃO: Join único via relação Prisma
const assignments = await prisma.matchPlayerEvaluationAssignment.findMany({
  where: { evaluatorPlayerId: mePlayer.id, completedAt: null },
  select: {
    id: true,
    matchId: true,
    targetPlayerId: true,
    target: {  // ✅ Join único
      select: { id: true, name: true }
    }
  },
});
```

**Ganho de Performance:** 50% menos queries (2 → 1 query no banco)

#### **players-router.ts - GET /me/team/overview**
```typescript
// ❌ PROBLEMA: Múltiplas queries sequenciais
const memberships = await prisma.accessMembership.findMany({ ... });
const mePlayer = await prisma.player.findUnique({ ... });
const playerTeams = await prisma.team.findMany({ ... });
// Loop com query por time
for (const tm of playerTeams) {
  const fullTeam = await prisma.team.findUnique({ ... });
}
```

**Solução:** Usar `include` e buscar tudo em 1-2 queries

### 3. Queries sem Índices Apropriados

Verificar se existem índices para:
- `AccessMembership.userId + role` ✅ (existe)
- `Player.userId` ⚠️ (verificar)
- `MatchPlayerEvaluationAssignment.evaluatorPlayerId + completedAt` ⚠️ (verificar)

---

## 📊 COBERTURA DE TESTES

### Routers **SEM** testes unitários:
- ❌ `evaluations-router.ts` (0% cobertura)
- ❌ `players-router.ts` rotas inline (0% cobertura)
- ❌ `invitation-codes-router.ts` (0% cobertura)
- ❌ `access-router.ts` (0% cobertura)
- ❌ `auth-router.ts` (0% cobertura - crítico!)
- ❌ `topics-router.ts` (0% cobertura)
- ❌ `audit-router.ts` (0% cobertura)

### Controllers **COM** testes:
- ✅ `create-league.usecase.test.ts` (5/5 testes)
- ✅ Alguns controllers de league

**Cobertura estimada:** ~15-20% do código

---

## 🎯 PLANO DE AÇÃO PRIORITÁRIO

### **Fase 1: Crítico (1-2 semanas)**

1. **Refatorar players-router.ts**
   - Extrair lógicas inline para controllers/use cases
   - Criar repositories para isolamento de dados
   - Adicionar testes unitários
   - **Impacto:** Arquivo de 617 linhas → 50 linhas

2. **Refatorar evaluations-router.ts**
   - Criar `EvaluationsRepository`
   - Criar controllers: `GetPendingEvaluationsController`, `GetEvaluationFormController`, `SubmitEvaluationController`
   - Adicionar testes unitários
   - Otimizar query N+1

3. **Adicionar testes para auth-router.ts**
   - Testes de autenticação críticos para segurança
   - Mock de Firebase Admin

### **Fase 2: Importante (2-3 semanas)**

4. **Refatorar invitation-codes-router.ts**
   - Extrair para controllers
   - Adicionar testes

5. **Refatorar access-router.ts**
   - Extrair para controllers
   - Adicionar testes

6. **Otimizar queries complexas**
   - `GET /me/team/overview` em players
   - Adicionar índices faltantes

### **Fase 3: Manutenção (ongoing)**

7. **Aumentar cobertura de testes**
   - Meta: 80% de cobertura
   - Focar em casos críticos (autenticação, RBAC, pagamentos)

8. **Monitoramento de performance**
   - Adicionar APM (Datadog/New Relic)
   - Monitorar queries lentas

---

## 📝 CHECKLIST DE REFATORAÇÃO

Para cada router a ser refatorado:

- [ ] Identificar todas as rotas com lógica inline
- [ ] Criar interfaces de repository
- [ ] Implementar repositories com Prisma
- [ ] Criar DTOs (input/output)
- [ ] Criar use cases
- [ ] Criar controllers
- [ ] Atualizar router para usar controllers
- [ ] Adicionar testes unitários (>80% cobertura)
- [ ] Adicionar testes de integração
- [ ] Otimizar queries (verificar explain plans)
- [ ] Adicionar índices necessários
- [ ] Documentar no OpenAPI

---

## 🔍 QUERIES QUE PRECISAM DE ÍNDICES

Verificar e adicionar se não existirem:

```sql
-- Player
CREATE INDEX IF NOT EXISTS idx_player_user_id ON "Player"("userId");

-- MatchPlayerEvaluationAssignment
CREATE INDEX IF NOT EXISTS idx_eval_assignment_evaluator_completed 
  ON "MatchPlayerEvaluationAssignment"("evaluatorPlayerId", "completedAt");

-- InvitationCode
CREATE INDEX IF NOT EXISTS idx_invitation_code_team_status 
  ON "InvitationCode"("teamId", "isActive");

-- AccessMembership (já existe userId + role)
-- Verificar se existe índice composto para queries com leagueId/teamId
CREATE INDEX IF NOT EXISTS idx_access_membership_user_league 
  ON "AccessMembership"("userId", "leagueId") WHERE "leagueId" IS NOT NULL;
```

---

## 📈 MÉTRICAS DE SUCESSO

Após refatoração completa:

- **Cobertura de testes:** 15% → 80%
- **Complexidade de routers:** 617 linhas → <100 linhas por arquivo
- **Performance queries:** Redução de 50% em queries N+1
- **Manutenibilidade:** Código testável e reutilizável
- **Time to market:** Features novas 2x mais rápidas

---

## 🚀 PRÓXIMOS PASSOS IMEDIATOS

1. **Hoje:** Criar branch `refactor/players-router`
2. **Amanhã:** Extrair primeira rota (`GET /me/exists`) para controller
3. **Esta semana:** Completar refatoração de `players-router.ts`
4. **Próxima semana:** Refatorar `evaluations-router.ts`

---

## 💡 RECOMENDAÇÕES ARQUITETURAIS

### Padrão a seguir (já usado em leagues):

```typescript
// ✅ BOM: leagues-router.ts
leaguesRouter.get('/:id/settings', 
  requireRole([AccessRole.LEAGUE_MANAGER, AccessRole.ADMIN]),
  async (req, res) => {
    const controller = makeGetLeagueSettingsController();
    return controller.handleExpress(req, res);
  }
);
```

### Anti-padrão a evitar:

```typescript
// ❌ RUIM: players-router.ts
playersRouter.patch('/me', async (req, res) => {
  try {
    // 100+ linhas de lógica aqui
    const player = await prisma.player.findUnique(...);
    // validações
    // transformações
    // queries
    // ...
    return res.json(result);
  } catch (e) {
    // ...
  }
});
```

---

## 🎓 BENEFÍCIOS DA REFATORAÇÃO

1. **Testabilidade:** 100% do código testável unitariamente
2. **Manutenibilidade:** Mudanças isoladas, sem side effects
3. **Reusabilidade:** Use cases podem ser chamados de múltiplos lugares
4. **Performance:** Queries otimizadas e monitoráveis
5. **Documentação:** Código auto-documentado com tipos fortes
6. **Onboarding:** Novos desenvolvedores entendem estrutura facilmente
7. **Debugging:** Erros isolados por camada
8. **Deploy:** Confiança para fazer releases frequentes

---

**Status:** 🔴 Ação necessária  
**Prioridade:** Alta  
**Esforço estimado:** 4-6 semanas para refatoração completa  
**ROI:** Alto - melhora significativa em qualidade e velocidade de desenvolvimento
