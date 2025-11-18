# Guia de Integração: Times, Players, Ligas e Convites

Este documento orienta a criação das páginas e camadas (Clean Architecture + SOLID) para integrar os módulos de Times, Players, Ligas e Convites ao frontend.

Importante: sempre derive contratos e campos diretamente do `src/main/docs/openapi.ts` (fonte da verdade). Onde este guia citar endpoints, trate como referência — confirme os paths e payloads no OpenAPI.

---

## 1) Times (Teams)

### Casos de Uso

- Listar times
- Criar time
- Editar time
- Deletar time
- Visualizar detalhes

### Endpoints (OpenAPI)

- `GET /api/teams`: lista times (filtro `isActive`)
- `POST /api/teams`: cria time (JSON ou multipart)
- `PATCH /api/teams/{id}`: atualiza parcialmente
- `DELETE /api/teams/{id}`: soft delete (`isActive=false`)
- `POST /api/teams/{id}/icon`: upload de ícone (multipart)
- `GET /api/teams/{id}/players`: lista jogadores do time
- `POST /api/teams/{id}/players`: vincula jogador ao time

### RBAC

- Listar/visualizar: autenticado
- Criar/editar/deletar: ADMIN ou conforme regra da liga/organização (confirmar no OpenAPI/rotas)

### Repositório (Ports)

```ts
export interface ITeamRepository {
  list(params?: { page?: number; q?: string }): Promise<Team[]>;
  getById(id: string): Promise<Team | null>;
  create(input: CreateTeamInput): Promise<Team>;
  update(id: string, input: UpdateTeamInput): Promise<Team>;
  delete(id: string): Promise<void>;
}
```

### Infra/HTTP (Adapters)

- Implementar `HttpTeamRepository` usando `ApiClient` (bearer token e interceptors).
- Mapear DTO <-> Entidade `Team` (domain).

### UI/Páginas

- `/teams`: tabela com busca/paginação, ações (ver/editar/deletar/criar).
- `/teams/[id]`: detalhes e edição inline/separada.
- Formulários com Zod + React Hook Form; toasts e invalidação de cache pós-mutations.

### Testes

- Casos de uso (lista/cria/edita/deleta) com repositório mockado.
- Repositório com MSW: cobrir 200/400/401/403/404/409/500.
- Componentes: estados loading/empty/error/success; RBAC (botões escondidos).

---

## 2) Players

### Casos de Uso

- Listar jogadores
- Criar jogador
- Editar jogador
- Deletar jogador
- Associar jogador a time/ligas (se aplicável no contrato)

### Endpoints (OpenAPI)

- `POST /api/players`: cria jogador (JSON ou multipart)
- `GET /api/players/me`: obter meu perfil de jogador
- `PATCH /api/players/me`: atualizar meu perfil
- `POST /api/players/me`: criar meu perfil se ausente (idempotente)
- `GET /api/players/me/exists`: checa existência do perfil
- `POST /api/players/{id}/photo`: upload de foto do jogador
- `POST /api/players/me/skills`: upsert de habilidades
- `GET /api/players/me/graph`: métricas do gráfico
- `GET /api/players/me/team/overview`: visão geral do meu time
- `GET /api/players/me/evaluation/banner`: banner de avaliações pendentes (últimas 24h)
- `GET /api/players/me/evaluations/pending`: contexto de avaliações pendentes

### RBAC

- Listar/visualizar: autenticado
- Criar/editar/deletar: ADMIN ou LEAGUE_MANAGER (conforme contrato)

### Repositório (Ports)

```ts
export interface IPlayerRepository {
  list(params?: { page?: number; q?: string; teamId?: string }): Promise<Player[]>;
  getById(id: string): Promise<Player | null>;
  create(input: CreatePlayerInput): Promise<Player>;
  update(id: string, input: UpdatePlayerInput): Promise<Player>;
  delete(id: string): Promise<void>;
}
```

### Infra/HTTP

- `HttpPlayerRepository` com mapeadores DTO<->Domain.
- Endpoints de associação (ex.: `playersOnTeams`) se constarem no OpenAPI.

### UI/Páginas

- `/players`: tabela com busca por nome/time.
- `/players/[id]`: detalhes, histórico/estatísticas básicos (se houver), botões de ação.

### Testes

- Idem Teams (unit + MSW + UI states).

---

## 3) Ligas (Leagues)

### Casos de Uso

- Listar ligas
- Criar liga
- Editar liga
- Deletar liga
- Ver detalhes (times participantes, fases, formato aplicado)

### Endpoints (OpenAPI)

- `GET /api/leagues`: listar ligas (filtros/paginação)
- `POST /api/leagues`: criar liga (JSON ou multipart para ícone/banner)
- `GET /api/leagues/me`: listar ligas do usuário (resumo)
- `GET /api/leagues/me/{id}`: detalhes da liga que pertenço (com times/grupos)
- `PATCH /api/leagues/{id}`: atualização parcial
- `DELETE /api/leagues/{id}`: soft delete (isActive=false)
- `GET /api/leagues/{id}/teams`: listar times vinculados
- `POST /api/leagues/{id}/icon`: upload de ícone (multipart)
- `POST /api/leagues/{id}/banner`: upload de banner (multipart)

### RBAC

- Listar/visualizar: autenticado
- Criar/editar/deletar: ADMIN
- Aplicar formato: ADMIN ou LEAGUE_MANAGER

### Repositório (Ports)

```ts
export interface ILeagueRepository {
  list(params?: { page?: number; q?: string }): Promise<League[]>;
  getById(id: string): Promise<League | null>;
  create(input: CreateLeagueInput): Promise<League>;
  update(id: string, input: UpdateLeagueInput): Promise<League>;
  delete(id: string): Promise<void>;
}
```

### Infra/HTTP

- `HttpLeagueRepository` + mapeadores.

### UI/Páginas

- `/leagues`: lista + ações.
- `/leagues/[id]`: dashboard da liga (times, formato aplicado, regras disciplinares, fases, ações rápidas).
- Ação "Aplicar Formato" (se existir no backend atual) com modal (selecionar formato -> confirmar -> POST -> toast -> refetch).

### Testes

- Unit (casos de uso) + MSW (repos) + UI (guards de role e fluxos principais).

---

## 4) Convites (Invitations)

### Casos de Uso

- Listar convites de liga/time
- Enviar convite (para player/manager)
- Aceitar/Recusar convite
- Revogar convite

### Endpoints (OpenAPI)

- `POST /api/invites`: criar convite para time
- `GET /api/invites`: listar convites de time (`teamId` requerido)
- `POST /api/invites/accept`: aceitar convite (vincular jogador ao time)
- `DELETE /api/invites/{id}`: revogar convite (time)
- `POST /api/invites/league`: criar convite para liga
- `GET /api/invites/league`: listar convites de liga
- `DELETE /api/invites/league/{id}`: revogar convite de liga
- `POST /api/invites/league/accept`: aceitar convite de liga (vincular time à liga)

### RBAC

- Enviar/Revogar: ADMIN ou LEAGUE_MANAGER
- Aceitar/Recusar: usuário autenticado destinatário do convite
- Listar: autenticado (escopo pode filtrar por liga/time/usuário)

### Repositório (Ports)

```ts
export interface IInvitationRepository {
  list(params?: {
    leagueId?: string;
    teamId?: string;
    status?: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  }): Promise<Invitation[]>;
  send(input: SendInvitationInput): Promise<Invitation>;
  accept(invitationId: string): Promise<void>;
  decline(invitationId: string): Promise<void>;
  revoke(invitationId: string): Promise<void>;
}
```

### Infra/HTTP

- `HttpInvitationRepository` consumindo endpoints do OpenAPI (confirme paths exatos no arquivo `openapi.ts`).
- Garantir headers JWT e tratamento uniforme de erros.

### UI/Páginas

- `/invitations`: lista com filtros por liga/time/status.
- Ações por linha: Aceitar/Recusar (se destinatário), Revogar (se emissor com permissão).
- Compor com componentes de confirmação e toasts.

### Testes

- Casos de uso (envio/aceite/recusa/revogação) com mocks.
- MSW simulando respostas de erro (401/403/404/409) e sucesso.
- UI: estados e RBAC.

---

## Padrões Comuns às Quatro Áreas

### API Client

- Implementar um `ApiClient` com baseURL, injeção de `Authorization: Bearer <token>`, interceptors para 401/403/500.
- Retornar erros normalizados (`AppError`) com mensagem amigável.

### React Query

- Hooks por recurso: `useTeams`, `useCreateTeam`, `usePlayers`, `useLeagues`, `useInvitations`, etc.
- Invalidar queries após mutations.
- `staleTime` configurado para listas.

### Validação (Zod)

- Schemas de formulário e transformação de dados (ex.: trimming, defaults).
- Mostra de erros campo-a-campo.

### RBAC/Guards

- `RequireAuth` e `RequireRole([roles])` envolvendo páginas/ações.
- Desabilitar/ocultar botões sem permissão.

### Testes

- Unit por camada (domain/application/infrastructure/presentation).
- MSW para simular API nos testes de infra e UI.
- Cobertura mínima:
  - 100% casos de uso
  - 80%+ domain/application
  - Fluxos críticos de UI validados.

---

## Esqueleto de Código (Exemplos)

### Exemplo de Caso de Uso

```ts
export class ListTeamsUseCase {
  constructor(private readonly repo: ITeamRepository) {}
  async execute(params?: { page?: number; q?: string }) {
    return this.repo.list(params);
  }
}
```

### Exemplo de Hook com React Query

```ts
export function useTeams(params?: { page?: number; q?: string }) {
  return useQuery({
    queryKey: ['teams', params],
    queryFn: () => listTeamsUseCase.execute(params),
    staleTime: 60_000,
  });
}
```

### Exemplo de Repositório HTTP (trecho)

```ts
export class HttpTeamRepository implements ITeamRepository {
  constructor(private readonly api: ApiClient) {}
  async list(params?: { page?: number; q?: string }) {
    const res = await this.api.get('/api/teams', { params });
    return res.data.map(teamDtoToDomain);
  }
}
```

---

## Checklist de Entrega

- [ ] Páginas de Times, Players, Ligas e Convites implementadas
- [ ] RBAC aplicado nas páginas e ações
- [ ] Repositórios HTTP com tipos do OpenAPI
- [ ] Casos de uso com testes unitários
- [ ] UI testada com estados (loading/empty/error/success)
- [ ] MSW cobrindo cenários de erro das quatro áreas
- [ ] Documentação curta sobre como rodar, testar e gerar tipos

---

## Comandos Úteis

```bash
# gerar tipos a partir do OpenAPI	npx openapi-typescript src/main/docs/openapi.ts -o src/infrastructure/api/types.gen.ts

# testes
npm run test

# lint & typecheck
npm run lint
npm run typecheck
```

> Observação: endpoints e payloads devem ser confirmados com `src/main/docs/openapi.ts`. Em caso de mudanças no backend, regenere os tipos e ajuste os mapeadores e testes.
