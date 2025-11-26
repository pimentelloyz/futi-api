# APP-create-league-by-standings

Objetivo: instruir um agente a implementar no app Flutter a feature de criação de liga e configuração da classificação (standings) com aplicação de formato, inicialização da tabela e exibição dos dados, incluindo controle de acesso na UI e integração completa com os endpoints do backend.

Fonte da verdade de contratos: `src/main/docs/openapi.ts` (OpenAPI 3.1). Confirme campos/paths antes de implementar. Autenticação via JWT Bearer.

---

## 1) Escopo da Feature

- Criar uma nova liga.
- Opcional: fazer upload de ícone e banner da liga.
- Aplicar um formato template à liga (cria fases automaticamente).
- Inicializar a classificação (standings) de uma fase.
- Exibir a classificação por fase (e, quando aplicável, por grupo).
- Recalcular classificação/Processar resultado de partida (opcional avançado).

---

## 2) RBAC e Autorização

- Todas as rotas relevantes exigem `Authorization: Bearer <token>`.
- Criar liga: ADMIN ou FAN (automaticamente recebe LEAGUE_MANAGER).
- Editar/deletar liga: ADMIN ou LEAGUE_MANAGER.
- Aplicar formato, inicializar/recalcular standings, processar resultados: ADMIN ou LEAGUE_MANAGER.
- Exibir standings: autenticado.
- Na UI, esconda/desabilite ações administrativas para usuários sem os papéis necessários.

---

## 3) Fluxo da Tela (Sugerido)

**Modo Onboarding (Guiado):**
1. Após criar liga, obter progresso: `GET /api/leagues/{leagueId}/setup-progress`
2. Exibir wizard/stepper com os 7 passos do setup
3. Destacar o `currentStep` e mostrar `nextAction` ao usuário
4. Executar ações conforme o usuário progride nos steps
5. Mostrar progresso visual (`completionPercentage`)
6. Quando `isSetupComplete: true`, permitir iniciar a liga

**Fluxo Manual (Avançado):**
1. Formulário "Criar Liga":
   - Campos: nome, slug, descrição (opcional), isPublic (bool), isActive (bool, default true), datas (opcional), upload de ícone/banner (opcional).
   - Ação: `POST /api/leagues` (JSON ou multipart). Se usar multipart, enviar `icon` e `banner` como arquivos.
2. Selecionar Formato e Aplicar:
   - Após criar liga, exibir seletor de formatos disponíveis (endpoints de formatos no OpenAPI).
   - Ação: `POST /api/leagues/{leagueId}/apply-format/{formatId}`.
3. Configurar Regras de Disciplina (Opcional):
   - Ação: `POST /api/leagues/{leagueId}/discipline-rules`
4. Cadastrar Times:
   - Ação: `POST /api/leagues/{leagueId}/teams`
5. Inicializar Standings:
   - Carregar as fases criadas pelo formato (a partir dos detalhes da liga ou de endpoint específico de fases do formato, se disponível na app).
   - Ação: `POST /api/phases/{phaseId}/standings/initialize` (opcional `groupId`).
6. Gerar Calendário:
   - Ação: `POST /api/leagues/{leagueId}/groups/{groupId}/fixtures`
7. Visualizar Standings:
   - Ação: `GET /api/phases/{phaseId}/standings` (opcional `groupId`). Renderizar tabela com posição, pontos, vitórias, empates, derrotas, gols pró/contra, saldo, etc.
8. Ações avançadas (opcional):
   - `POST /api/phases/{phaseId}/standings/recalculate`.
   - `POST /api/phases/{phaseId}/standings/process-match` para atualizar automaticamente a classificação com resultado de partida.

---

## 4) Endpoints e Contratos

Base URL dev: `http://localhost:3000`
Header comum: `Authorization: Bearer <jwt>`

### 4.1 Criar Liga

- Método/Path: `POST /api/leagues`
- Segurança: Bearer
- Content-Types suportados:
  - `application/json`
  - `multipart/form-data` (para upload de `icon` e `banner`)
- Corpo (JSON):

```json
{
  "name": "Copa Brasil Amateur",
  "slug": "copa-brasil-amateur",
  "description": "Liga aberta ao público",
  "isPublic": true,
  "isActive": true,
  "icon": "https://...", // opcional se JSON
  "banner": "https://..." // opcional se JSON
}
```

- Respostas:
  - 201: `{ "id": "league_123" }`
  - 400: parâmetros ausentes/invalidos
  - 409: slug já existente

### 4.2 Upload de Ícone e Banner (Opcional)

- `POST /api/leagues/{id}/icon` e `POST /api/leagues/{id}/banner`
- Content-Type: `multipart/form-data` com campo `file` (PNG/JPEG/WEBP, <=2MB)
- Respostas:
  - 200: `{ "iconUrl": "..." }` ou `{ "bannerUrl": "..." }`

### 4.3 Listar/Buscar Ligas (para seleção)

- `GET /api/leagues`
- Query: `q`, `name`, `slug`, `isActive`, `isPublic`, `page`, `pageSize`, `orderBy`, `order`
- 200: `{ items: [...], page, pageSize, total, hasNext }`

### 4.3.1 Obter Progresso de Setup da Liga

- `GET /api/leagues/{id}/setup-progress`
- Segurança: Bearer (ADMIN ou LEAGUE_MANAGER)
- Resposta 200:

```json
{
  "leagueId": "league_123",
  "leagueName": "Copa Brasil Amateur",
  "currentStep": 2,
  "totalSteps": 7,
  "completionPercentage": 28,
  "isSetupComplete": false,
  "canStartLeague": false,
  "steps": [
    {
      "step": 1,
      "name": "Liga Criada",
      "description": "Informações básicas da liga configuradas",
      "status": "completed",
      "isRequired": true,
      "completedAt": "2025-11-26T10:00:00Z"
    },
    {
      "step": 2,
      "name": "Formato Aplicado",
      "description": "Definir formato do campeonato (fases, grupos, mata-mata)",
      "status": "current",
      "isRequired": true,
      "actionRequired": "Aplicar um formato template à liga"
    },
    {
      "step": 3,
      "name": "Regras de Disciplina",
      "description": "Configurar cartões e suspensões (opcional)",
      "status": "blocked",
      "isRequired": false
    },
    {
      "step": 4,
      "name": "Times Cadastrados",
      "description": "Cadastrar pelo menos 16 times na liga",
      "status": "blocked",
      "isRequired": true
    },
    {
      "step": 5,
      "name": "Classificação Inicializada",
      "description": "Inicializar tabelas de classificação por fase",
      "status": "blocked",
      "isRequired": true
    },
    {
      "step": 6,
      "name": "Calendário de Jogos",
      "description": "Gerar calendário de partidas",
      "status": "blocked",
      "isRequired": true
    },
    {
      "step": 7,
      "name": "Liga Pronta",
      "description": "Liga configurada e pronta para iniciar",
      "status": "pending",
      "isRequired": true
    }
  ],
  "nextAction": {
    "step": 2,
    "title": "Formato Aplicado",
    "description": "Aplicar um formato template à liga",
    "endpoint": "POST /api/leagues/{leagueId}/apply-format/{formatId}"
  }
}
```

**Estados dos Steps:**
- `completed`: Passo concluído
- `current`: Passo atual (próximo a ser feito)
- `pending`: Passo pendente (aguardando passos anteriores)
- `blocked`: Passo bloqueado (depende de passos anteriores incompletos)

### 4.4 Aplicar Formato

Pré-requisito (obter `formatId`):

- Método/Path: `GET /api/formats`
- Query opcional: `templatesOnly` (boolean) — quando `true`, retorna apenas formatos template
- Resposta 200 (resumo): `Array<Format>` com campos `id`, `name`, `slug`, `type`, `description`, `isTemplate`, `phases[]`

```json
[
  {
    "id": "fmt_1",
    "name": "Fase de Grupos + Mata-mata",
    "slug": "grupos-mata",
    "type": "MIXED",
    "description": null,
    "isTemplate": true,
    "phases": [
      {
        "id": "ph_tmpl_1",
        "name": "Grupos",
        "order": 1,
        "type": "GROUP_STAGE",
        "teamsCount": 16,
        "groupsCount": 4,
        "hasHomeAway": false,
        "hasExtraTime": false,
        "hasPenalties": false,
        "advancingTeams": 8
      }
    ]
  }
]
```

- `POST /api/leagues/{leagueId}/apply-format/{formatId}`
- 200: Formato aplicado com sucesso
- 404: liga ou formato não encontrado
- 409: liga já possui formato

### 4.5 Standings: Obter Classificação

- `GET /api/phases/{phaseId}/standings`
- Query opcional: `groupId`
- 200: `Array<Standing>`

```json
[
  {
    "id": "st_1",
    "phaseId": "phase_1",
    "teamId": "team_1",
    "position": 1,
    "played": 3,
    "wins": 3,
    "draws": 0,
    "losses": 0,
    "goalsFor": 8,
    "goalsAgainst": 2,
    "goalDifference": 6,
    "points": 9,
    "team": { "id": "team_1", "name": "Time A", "icon": null }
  }
]
```

### 4.6 Standings: Inicializar

- `POST /api/phases/{phaseId}/standings/initialize`
- Body (opcional): `{ "groupId": "group_1" }`
- 201: classificação inicializada

### 4.7 Standings: Recalcular (Opcional)

- `POST /api/phases/{phaseId}/standings/recalculate`
- Body (opcional): `{ "groupId": "group_1" }`
- 200: posições recalculadas

### 4.8 Standings: Processar Resultado (Opcional)

- `POST /api/phases/{phaseId}/standings/process-match`
- Body:

```json
{
  "homeTeamId": "team_home",
  "awayTeamId": "team_away",
  "homeScore": 2,
  "awayScore": 1,
  "homeYellowCards": 1,
  "awayYellowCards": 2,
  "homeRedCards": 0,
  "awayRedCards": 0,
  "groupId": null
}
```

- 200: resultado processado

---

## 5) UI/UX e Componentes

- Tela 1: Formulário de criação de liga
  - Inputs: nome, slug, descrição, isPublic, isActive, datas; upload ícone/banner (opcional)
  - CTA: Criar Liga (ADMIN ou FAN - automaticamente torna-se LEAGUE_MANAGER da liga criada)
- Tela 2: Ações administrativas da liga
  - Seletor de Formato (lista de formatos existentes)
  - Botão "Aplicar Formato" (ADMIN/LEAGUE_MANAGER)
  - Lista de Fases geradas pelo formato
  - Para cada fase: Botão "Inicializar Classificação" e opcional "Recalcular"
- Tela 3: Visualização de standings
  - Seletor de Fase (e Grupo, se aplicável)
  - Tabela com: Posição, Time (com ícone), J, V, E, D, GP, GC, SG, Pts
- Estados: loading, vazio, erro; toasts/snackbars em sucesso/erro
- Controle de acesso:
  - Sem ADMIN/LEAGUE_MANAGER: esconder ou desabilitar botões de aplicar formato/inicializar/recalcular

---

## 6) Implementação Flutter (Sugerida)

- State management: Riverpod ou Bloc
- HTTP: Dio, com interceptor de Auth (Bearer) e retry simples
- Models: `freezed` + `json_serializable`
- Navegação: `go_router`

### 6.1 Cliente HTTP (Dio)

- BaseURL: `http://localhost:3000`
- Interceptor: adiciona `Authorization: Bearer <token>`; trata 401/403

### 6.2 Camadas

- Domain: entidades (`League`, `Standing`, `Phase`), usecases
- Data: repositories (implementação com Dio), DTOs e mapeadores
- Presentation: controllers (Riverpod/Bloc) e Widgets

### 6.3 Repositórios (Interfaces)

```dart
abstract class LeaguesRepository {
  Future<String> createLeague(CreateLeagueInput input); // retorna id
  Future<void> applyFormat(String leagueId, String formatId);
  Future<PagedLeagues> listLeagues({LeaguesQuery? query});
}

abstract class StandingsRepository {
  Future<List<Standing>> getStandings(String phaseId, {String? groupId});
  Future<void> initializeStandings(String phaseId, {String? groupId});
  Future<void> recalcStandings(String phaseId, {String? groupId});
  Future<void> processMatch(String phaseId, ProcessMatchInput input);
}
```

---

## 7) Tratamento de Erros e Estados

- 401: redirecionar para login/refresh token
- 403: exibir mensagem de permissão insuficiente
- 404: recursos não encontrados (liga/formato/fase)
- 409: conflito (ex.: slug de liga já usado)
- 500: mensagem genérica de erro + opção de tentar novamente

---

## 8) Testes (Sugeridos)

- Unit: mapeadores DTO↔domain; usecases; regras de visibilidade (RBAC) dos botões
- Integração (widget tests): submissão do formulário de criação; aplicação de formato; inicialização e render da tabela
- Mocks: `http_mock_adapter` (Dio) ou simulação de camadas de repository
- Cobrir estados loading/empty/error/success

---

## 9) Exemplos de Integração (Dio)

### 9.1 Criar Liga (JSON)

```dart
final res = await dio.post('/api/leagues', data: {
  'name': name,
  'slug': slug,
  'description': description,
  'isPublic': isPublic,
  'isActive': true,
});
final leagueId = res.data['id'] as String;
```

### 9.2 Aplicar Formato

```dart
await dio.post('/api/leagues/$leagueId/apply-format/$formatId');
```

### 9.3 Inicializar Standings

```dart
await dio.post('/api/phases/$phaseId/standings/initialize', data: {
  if (groupId != null) 'groupId': groupId,
});
```

### 9.4 Obter Standings

```dart
final res = await dio.get('/api/phases/$phaseId/standings', queryParameters: {
  if (groupId != null) 'groupId': groupId,
});
final items = (res.data as List).map((e) => Standing.fromJson(e)).toList();
```

---

## 10) Checklist de Aceite

- [ ] Usuário ADMIN ou FAN consegue criar liga e ver confirmação (201)
- [ ] Criador da liga recebe automaticamente o papel LEAGUE_MANAGER
- [ ] Usuário ADMIN/LEAGUE_MANAGER consegue aplicar formato à liga
- [ ] Usuário ADMIN/LEAGUE_MANAGER consegue inicializar standings por fase (e grupo, se houver)
- [ ] Tabela de standings renderiza conforme `GET /api/phases/{phaseId}/standings`
- [ ] Ações administrativas invisíveis/indisponíveis a quem não tem permissão
- [ ] Erros 401/403/404/409/500 tratados com feedback apropriado

> Observação: mantenha os tipos alinhados ao OpenAPI. Se o backend mudar, atualize os modelos/DTOs e os mapeadores correspondente.
