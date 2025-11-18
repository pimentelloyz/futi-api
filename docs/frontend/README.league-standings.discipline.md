# Prompt para Implementação do Frontend (Agente Externo)

## 1. Contexto do Projeto

Você irá implementar um frontend (SPA/SSR) em TypeScript para consumir a API existente (backend Node já pronto). A fonte da verdade dos contratos HTTP está em `src/main/docs/openapi.ts`. As principais áreas funcionais são:

- Formatos de Liga (League Formats)
- Regras Disciplinares (Discipline Rules)
- Classificação / Tabelas (League Standings)
  Além de demais endpoints já documentados no OpenAPI.

## 2. Objetivo Macro

Construir uma aplicação web modular, escalável e testável que permita:

- Gerenciar formatos (criar, listar, editar, aplicar a ligas, remover).
- Configurar e consultar regras disciplinares.
- Visualizar e manipular classificações (inicializar, processar resultados, recalcular, deletar).
- Integrar com autenticação JWT + controle de acesso por roles.
- Manter alta qualidade: Clean Architecture + SOLID + testes unitários robustos.

## 3. Requisitos Arquiteturais (Clean Architecture + SOLID)

Separar responsabilidades em camadas:

- domain: Entidades, value objects, regras de negócio puras (sem dependência de frameworks).
- application: Casos de uso (interactors), orquestram fluxo entre domain e portas.
- application/ports: Interfaces (Repository, AuthGateway, etc).
- infrastructure: Implementações concretas (HTTP client, mapeadores DTO <-> Domain, repositórios, persistência local, interceptors).
- presentation: Componentes React, páginas/rotas, hooks, view models, adapters para interação do usuário.
- tests: Mocks, stubs, testes por camada, configuração MSW (mock da API).

Princípios SOLID esperados:

- SRP: Cada classe/arquivo com foco único.
- OCP: Estender comportamento via novas implementações sem alterar código existente.
- LSP: Substituições de interfaces não quebram casos de uso.
- ISP: Interfaces finas (evitar “megarepositórios”).
- DIP: Casos de uso dependem de interfaces, não de implementações concretas.

## 4. Stack Recomendada

- Framework: Next.js (App Router) ou alternativa React SPA com roteamento.
- Linguagem: TypeScript estrito.
- State & Data: React Query para cache de requisições; Zustand opcional para estado global leve.
- Validação: Zod (forma e semântica dos DTOs).
- UI: TailwindCSS + componente de design system (Radix UI / Headless UI).
- Testes: Vitest + React Testing Library + MSW.
- Geração de Tipos: `openapi-typescript` contra `src/main/docs/openapi.ts`.

## 5. Controle de Acesso & Autenticação

- Autenticação via JWT (security scheme bearerAuth do OpenAPI).
- Roles presentes (deduzidas): ADMIN, LEAGUE_MANAGER e usuário autenticado padrão.
- Matriz de permissões (ajuste se o backend definir diferente):
  - Formats:
    - Listar / Visualizar: autenticado
    - Criar / Editar / Deletar: ADMIN
    - Aplicar formato a liga: ADMIN ou LEAGUE_MANAGER
  - Discipline Rules:
    - Visualizar: autenticado
    - Criar / Atualizar / Deletar: ADMIN ou LEAGUE_MANAGER
    - Verificar suspensão de jogador: autenticado
  - Standings:
    - Visualizar: autenticado
    - Inicializar / Processar partida / Recalcular / Deletar: ADMIN ou LEAGUE_MANAGER
- Implementar componentes:
  - `<AuthProvider />` armazenando token e claims (roles).
  - `<RequireAuth />` (protege rotas básicas).
  - `<RequireRole roles={['ADMIN']}>` (protege ações sensíveis).
- Redirecionar 401 → tela de login / refresh.
- Exibir 403 → página “Acesso negado”.

## 6. Geração & Uso dos Tipos OpenAPI

Comandos iniciais:

```bash
npx openapi-typescript src/main/docs/openapi.ts -o src/infrastructure/api/types.gen.ts
```

- Utilizar os tipos gerados para requests/responses.
- Criar mapeadores DomainMapper: converte DTO → Entidade de domínio (ex.: Format, PhaseConfig, DisciplineRule, Standing).

## 7. Endpoints Principais (Resumo Operacional)

(Detalhar conforme o OpenAPI real; campos podem ter variações.)

### League Formats

- GET `/api/formats?templatesOnly=true|false`
- GET `/api/formats/{id}`
- POST `/api/formats`
- PATCH `/api/formats/{id}`
- DELETE `/api/formats/{id}`
- POST `/api/leagues/{leagueId}/apply-format/{formatId}`

### Discipline Rules

- GET `/api/leagues/{leagueId}/discipline-rules`
- POST `/api/leagues/{leagueId}/discipline-rules`
- GET `/api/leagues/{leagueId}/players/{playerId}/suspension-check`
- (Se existir) POST `/api/leagues/{leagueId}/phases/{order}/reset-yellow-cards`

### Standings

- GET `/api/phases/{phaseId}/standings?groupId=...`
- POST `/api/phases/{phaseId}/standings/initialize`
- POST `/api/phases/{phaseId}/standings/process-match`
- POST `/api/phases/{phaseId}/standings/recalculate`
- DELETE `/api/phases/{phaseId}/standings`

Para cada endpoint:

- Criar função repository (ex.: `formatRepository.list(templatesOnly?: boolean)`).
- Caso de uso correspondente (ex.: `ListFormatsUseCase` → chama `formatRepository.list`).
- Hook React Query (ex.: `useFormats({ templatesOnly })`).
- Tela / componente com estado (carregando, vazio, erro, sucesso).
- Ações com toasts e invalidação de cache (queryClient.invalidateQueries).

## 8. Modelos (Domain)

### Format

```
Format {
  id: string
  name: string
  slug: string
  type: 'ROUND_ROBIN' | 'KNOCKOUT' | 'MIXED' | 'LEAGUE_PHASE' | 'CUSTOM'
  description?: string
  isTemplate: boolean
  phases: PhaseConfig[]
}
PhaseConfig {
  id: string
  name: string
  order: number
  type: 'GROUP_STAGE' | 'KNOCKOUT' | 'LEAGUE' | 'PLAYOFF'
  teamsCount?: number
  groupsCount?: number
  teamsPerGroup?: number
  hasHomeAway: boolean
  hasExtraTime: boolean
  hasPenalties: boolean
  hasAwayGoal: boolean
  advancingTeams?: number
  tiebreakRules: TiebreakRule[]
}
TiebreakRule {
  order: number
  criterion: 'POINTS' | 'WINS' | 'GOAL_DIFFERENCE' | 'GOALS_FOR' | 'HEAD_TO_HEAD_POINTS' | 'FAIR_PLAY' | 'DRAW'
}
```

### DisciplineRule

```
DisciplineRule {
  id: string
  leagueId: string
  yellowCardsForSuspension: number
  yellowCardsAccumulation: boolean
  resetYellowsAfterPhaseOrder?: number | null
  redCardMinimumGames: number
  doubleYellowGames: number
}
SuspensionCheck {
  playerId: string
  isSuspended: boolean
  reason?: string
  suspensionGames?: number
  yellowCardsCount?: number
}
```

### Standing

```
Standing {
  id: string
  phaseId: string
  teamId: string
  groupId?: string | null
  position?: number | null
  played: number
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
  team?: { id: string; name: string; icon?: string | null }
}
```

## 9. Fluxos Principais (Exemplos)

Fluxo criar formato:

- UI Form → Validação Zod → Caso de uso `CreateFormatUseCase` → Repository → POST → Invalida lista → Navega/Exibe toast.

Fluxo aplicar formato a liga:

- Botão "Aplicar" → Modal confirmação → Caso de uso `ApplyFormatToLeagueUseCase` → POST → Exibir toast sucesso → Opcional: redirecionar para fases da liga.

Fluxo processar partida:

- Form resultado → Caso de uso `ProcessMatchResultUseCase` → POST → Invalida standings → Recalcular automático? (opcional) → Toast.

## 10. Padrões de Implementação

- Arquivos pequenos, máximo ~300 linhas por caso de uso.
- Repositórios expõem apenas métodos necessários.
- Nomeclatura: `IFormatRepository` (interface), `HttpFormatRepository` (implementação).
- Hooks UI: `useFormatList`, `useFormatMutations`.
- Erros: Normalizar em um `AppError` (camada application). Mapeamento de status codes → mensagens legíveis.
- Logging de erro apenas em infraestrutura (não poluir domínio).

## 11. Tratamento de Erros & Respostas

- 400: Validar inputs antes (Zod). Mostrar campo específico.
- 401: Forçar logout/refresh token.
- 403: Mostrar “Sem permissão”.
- 404: “Recurso não encontrado”.
- 409: Mostrar conflito (ex.: slug existente).
- 500: “Erro interno” + ID de correlação se fornecido (opcional).

## 12. Testes (Cobertura)

Domain:

- Regras de validação (ex.: ordem de fases, critérios de tiebreak).

Application:

- Casos de uso com stubs/mocks (simular repositórios).

Infrastructure:

- Repositórios + ApiClient usando MSW (testar rotas, headers, erros).

Presentation:

- Componentes: render, estados (loading/error/sucesso), RBAC (botões ocultos).
- Hooks React Query: teste de cache/invalidação (ex.: após criar formato, lista refaz fetch).

Métricas alvo:

- 100% dos casos de uso cobertos.
- 80%+ statements em domain/application.
- Funções cruciais de repositórios testadas para todos status codes.

Exemplo de teste de caso de uso (pseudo):

```ts
it('deve criar formato válido', async () => {
  const repo = mockFormatRepo({ createReturns: formatoDTO });
  const useCase = new CreateFormatUseCase(repo);
  const result = await useCase.execute(inputValido);
  expect(result.id).toBeDefined();
  expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ slug: 'copa-do-brasil' }));
});
```

## 13. Estrutura de Pastas (Sugerida)

```
src/
  domain/
    entities/
    value-objects/
  application/
    use-cases/
    ports/
  infrastructure/
    api/
      ApiClient.ts
      types.gen.ts
    repositories/
    mappers/
    auth/
  presentation/
    components/
    pages/
    routes/
    hooks/
    providers/
  tests/
    domain/
    application/
    infrastructure/
    presentation/
    msw/
```

## 14. Convenções & Qualidade

- ESLint + Prettier (TS estrito).
- Commits sem quebrar build nem testes.
- Evitar `any`; só em mocks de teste quando inevitável.
- Usar `readonly` onde fizer sentido em entidades.
- Funções puras testáveis: sem efeitos colaterais fora da infraestrutura.

## 15. Performance & UX

- Cache agressivo em listas (React Query staleTime configurável).
- Paginação se lista > 50 itens.
- Suspense/loader em chamadas iniciais.
- Otimização de render: memorizar listas grandes.
- Acessibilidade: roles ARIA em tabelas e formulários.

## 16. Critérios de Aceite

- Todas as telas funcionais, integradas aos endpoints.
- RBAC funcionando com ocultação/disabled de ações.
- Mensagens de erro legíveis.
- Testes executando e passando (scripts: `test`).
- Tipos gerados a partir do OpenAPI sem divergência.
- Documentação rápida (README) explicando setup, scripts e estrutura.

## 17. Scripts Esperados (Frontend)

```bash
npm run dev        # desenvolvimento
npm run build      # build produção
npm run test       # testes unitários
npm run lint       # lint
npm run typecheck  # verificação de tipos
```

## 18. Entregáveis Finais

- Código fonte organizado por camadas.
- Testes com cobertura relatada.
- README com passos de instalação, geração de tipos, fluxo de deploy.
- Sem dados sensíveis hardcoded (tokens etc.).
- Facilmente extensível para novos endpoints.

## 19. Passos Iniciais Sugeridos

1. Gerar tipos via openapi.
2. Criar ApiClient + interceptors.
3. Implementar repositórios Format/Discipline/Standing.
4. Casos de uso principais (List/Create/Edit/Delete/Apply/Process/Initialize/Recalculate).
5. Hooks React Query para cada caso de uso.
6. Telas base navegáveis.
7. Adicionar RBAC e ajustes visuais.
8. Implementar testes por camada.
9. Ajustar documentação e refinamentos.

## 20. Observação

Qualquer divergência entre este resumo e `openapi.ts` deve ser resolvida priorizando `openapi.ts`. Atualize tipos e mapeadores se o contrato for alterado pelo backend.
