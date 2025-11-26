# PROMPT: Implementar Wizard de Setup de Liga no Flutter

## Contexto

Você é um desenvolvedor Flutter especializado. Precisa implementar um **wizard/onboarding guiado** para configuração de ligas no app Futi. O backend já fornece um endpoint que rastreia o progresso do setup em 7 etapas.

---

## Objetivo

Criar uma feature completa de **League Setup Wizard** que:
1. Guia o usuário pelos 7 passos de configuração da liga
2. Mostra progresso visual (stepper/progress bar)
3. Executa ações automaticamente conforme o usuário avança
4. Valida cada etapa antes de permitir avançar
5. Salva o progresso e permite retomar de onde parou

---

## Arquitetura e Stack

- **State Management**: Riverpod (ou Bloc, sua escolha)
- **HTTP Client**: Dio com interceptor de autenticação
- **Models**: `freezed` + `json_serializable`
- **Navegação**: `go_router`
- **UI**: Material Design 3 com stepper responsivo

---

## Endpoint Principal

### `GET /api/leagues/{leagueId}/setup-progress`

**Headers:**
```
Authorization: Bearer <JWT>
```

**Resposta 200:**
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
      "description": "Definir formato do campeonato",
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

**Status dos Steps:**
- `completed` ✅ - Passo concluído
- `current` 🔄 - Passo atual (próximo a fazer)
- `pending` ⏳ - Aguardando passos anteriores
- `blocked` 🚫 - Bloqueado por dependências

---

## Os 7 Steps do Setup

### Step 1: Liga Criada ✅
- **Ação**: Já concluído (liga foi criada via `POST /api/leagues`)
- **Status**: Sempre `completed`

### Step 2: Formato Aplicado 🏆
- **Descrição**: Escolher formato do campeonato (Copa do Brasil, Libertadores, Champions, etc.)
- **Endpoint**: `GET /api/formats?templatesOnly=true` (listar formatos disponíveis)
- **Ação**: `POST /api/leagues/{leagueId}/apply-format/{formatId}`
- **UI**: Lista de cards com formatos template, cada um mostrando:
  - Nome do formato
  - Tipo (GROUP_STAGE, KNOCKOUT, MIXED)
  - Número de fases
  - Descrição
- **Validação**: Usuário deve selecionar um formato antes de avançar

### Step 3: Regras de Disciplina 📋 (Opcional)
- **Descrição**: Configurar cartões amarelos/vermelhos e suspensões
- **Endpoint**: `POST /api/leagues/{leagueId}/discipline-rules`
- **Body exemplo:**
```json
{
  "yellowCardsForSuspension": 3,
  "yellowCardsAccumulation": true,
  "resetYellowsAfterPhaseOrder": 2,
  "redCardMinimumGames": 1,
  "doubleYellowGames": 1
}
```
- **UI**: Formulário com campos:
  - Cartões amarelos para suspensão (número)
  - Acumular cartões entre fases (bool)
  - Resetar cartões após fase X (número ou null)
  - Jogos mínimos por cartão vermelho direto
  - Jogos por duplo amarelo
- **Ação**: Botão "Configurar Agora" ou "Pular (usar padrão)"

### Step 4: Times Cadastrados 👥
- **Descrição**: Adicionar times à liga (mínimo necessário varia por formato)
- **Endpoint**: `POST /api/leagues/{leagueId}/teams`
- **Body exemplo:**
```json
{
  "teamId": "team_abc123"
}
```
- **UI**: 
  - Mostrar progresso: "3 de 16 times cadastrados"
  - Botão "+ Adicionar Time"
  - Lista de times já adicionados
  - Buscar times disponíveis (autocomplete)
- **Validação**: Mínimo de times alcançado (informado em `actionRequired`)

### Step 5: Classificação Inicializada 📊
- **Descrição**: Inicializar tabelas de standings para cada fase
- **Endpoint**: `POST /api/phases/{phaseId}/standings/initialize`
- **Body (opcional):** `{ "groupId": "group_1" }`
- **UI**:
  - Listar fases da liga
  - Para cada fase: "Inicializar Classificação"
  - Se fase tem grupos: repetir para cada grupo
  - Mostrar confirmação visual quando concluído
- **Validação**: Todas as fases devem ter standings inicializados

### Step 6: Calendário de Jogos 📅
- **Descrição**: Gerar calendário de partidas
- **Endpoint**: `POST /api/leagues/{leagueId}/groups/{groupId}/fixtures`
- **Body exemplo:**
```json
{
  "startDate": "2025-12-01T10:00:00Z",
  "matchIntervalDays": 7,
  "matchesPerRound": 4
}
```
- **UI**:
  - Seletor de data inicial
  - Intervalo entre rodadas (dias)
  - Partidas por rodada
  - Botão "Gerar Calendário"
  - Preview do calendário gerado
- **Validação**: Pelo menos 1 partida criada

### Step 7: Liga Pronta 🎯
- **Descrição**: Setup completo, liga pronta para iniciar
- **Status**: `completed` quando `isSetupComplete: true`
- **UI**:
  - Tela de congratulações
  - Resumo da liga configurada
  - Botão "Iniciar Liga" (ativa a liga)
  - Botão "Ver Dashboard da Liga"

---

## Estrutura de Arquivos Sugerida

```
lib/
├── features/
│   └── league_setup/
│       ├── data/
│       │   ├── models/
│       │   │   ├── league_setup_progress.dart (freezed model)
│       │   │   ├── league_setup_step.dart (freezed model)
│       │   │   └── league_format.dart (freezed model)
│       │   └── repositories/
│       │       └── league_setup_repository.dart (impl com Dio)
│       ├── domain/
│       │   ├── entities/
│       │   │   └── setup_progress.dart
│       │   └── repositories/
│       │       └── i_league_setup_repository.dart (interface)
│       └── presentation/
│           ├── controllers/
│           │   └── league_setup_controller.dart (Riverpod/Bloc)
│           ├── pages/
│           │   └── league_setup_wizard_page.dart
│           └── widgets/
│               ├── setup_stepper.dart
│               ├── step_format_selection.dart
│               ├── step_discipline_rules.dart
│               ├── step_add_teams.dart
│               ├── step_initialize_standings.dart
│               ├── step_generate_fixtures.dart
│               └── step_completion.dart
```

---

## Models (Freezed)

### `league_setup_progress.dart`
```dart
import 'package:freezed_annotation/freezed_annotation.dart';

part 'league_setup_progress.freezed.dart';
part 'league_setup_progress.g.dart';

@freezed
class LeagueSetupProgress with _$LeagueSetupProgress {
  const factory LeagueSetupProgress({
    required String leagueId,
    required String leagueName,
    required int currentStep,
    required int totalSteps,
    required int completionPercentage,
    required bool isSetupComplete,
    required bool canStartLeague,
    required List<LeagueSetupStep> steps,
    NextAction? nextAction,
  }) = _LeagueSetupProgress;

  factory LeagueSetupProgress.fromJson(Map<String, dynamic> json) =>
      _$LeagueSetupProgressFromJson(json);
}

@freezed
class LeagueSetupStep with _$LeagueSetupStep {
  const factory LeagueSetupStep({
    required int step,
    required String name,
    required String description,
    required StepStatus status,
    required bool isRequired,
    String? actionRequired,
    DateTime? completedAt,
  }) = _LeagueSetupStep;

  factory LeagueSetupStep.fromJson(Map<String, dynamic> json) =>
      _$LeagueSetupStepFromJson(json);
}

@freezed
class NextAction with _$NextAction {
  const factory NextAction({
    required int step,
    required String title,
    required String description,
    String? endpoint,
  }) = _NextAction;

  factory NextAction.fromJson(Map<String, dynamic> json) =>
      _$NextActionFromJson(json);
}

enum StepStatus {
  @JsonValue('completed')
  completed,
  @JsonValue('current')
  current,
  @JsonValue('pending')
  pending,
  @JsonValue('blocked')
  blocked,
}
```

---

## Repository (Interface)

```dart
abstract class ILeagueSetupRepository {
  Future<LeagueSetupProgress> getSetupProgress(String leagueId);
  Future<List<LeagueFormat>> getAvailableFormats({bool templatesOnly = true});
  Future<void> applyFormat(String leagueId, String formatId);
  Future<void> configureDisciplineRules(String leagueId, DisciplineRulesInput input);
  Future<void> addTeamToLeague(String leagueId, String teamId);
  Future<void> initializeStandings(String phaseId, {String? groupId});
  Future<void> generateFixtures(String leagueId, String groupId, FixturesInput input);
}
```

---

## UI - Tela Principal (Wizard)

### `league_setup_wizard_page.dart`

**Layout:**
```
┌─────────────────────────────────────┐
│ AppBar: "Configurar Liga"          │
│   [X Fechar]                  [?]   │
├─────────────────────────────────────┤
│                                     │
│  Progress Bar: ████████░░░░ 57%    │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ Stepper Vertical:             │ │
│  │                               │ │
│  │ ✅ 1. Liga Criada             │ │
│  │ ✅ 2. Formato Aplicado        │ │
│  │ 🔄 3. Times (5/16)            │ │ <- currentStep
│  │ 🚫 4. Classificação           │ │
│  │ 🚫 5. Calendário              │ │
│  │ ⏳ 6. Liga Pronta             │ │
│  │                               │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ [Conteúdo do Step Atual]     │ │
│  │                               │ │
│  │  Widget específico do step    │ │
│  │                               │ │
│  └───────────────────────────────┘ │
│                                     │
│  [Voltar]              [Próximo]   │
│                                     │
└─────────────────────────────────────┘
```

**Comportamento:**
- Ao abrir, buscar `GET /api/leagues/{id}/setup-progress`
- Renderizar stepper com estado de cada step
- Exibir widget específico do `currentStep`
- Botão "Próximo" desabilitado até validação passar
- Permitir navegar para steps anteriores (completed)
- Não permitir pular steps (blocked/pending)
- Auto-refresh do progresso após cada ação
- Loading states durante chamadas API
- Error handling com Snackbars

---

## Controller (Riverpod)

```dart
@riverpod
class LeagueSetupController extends _$LeagueSetupController {
  @override
  Future<LeagueSetupProgress> build(String leagueId) async {
    return _fetchProgress();
  }

  Future<LeagueSetupProgress> _fetchProgress() async {
    final repo = ref.read(leagueSetupRepositoryProvider);
    return await repo.getSetupProgress(leagueId);
  }

  Future<void> refreshProgress() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => _fetchProgress());
  }

  Future<void> applyFormat(String formatId) async {
    final repo = ref.read(leagueSetupRepositoryProvider);
    await repo.applyFormat(leagueId, formatId);
    await refreshProgress();
  }

  Future<void> addTeam(String teamId) async {
    final repo = ref.read(leagueSetupRepositoryProvider);
    await repo.addTeamToLeague(leagueId, teamId);
    await refreshProgress();
  }

  // ... outros métodos para cada step
}
```

---

## Tratamento de Erros

### Erros HTTP:
- **401 Unauthorized**: Redirecionar para login
- **403 Forbidden**: "Você não tem permissão para gerenciar esta liga"
- **404 Not Found**: "Liga não encontrada"
- **409 Conflict**: Mensagem específica (ex: "Liga já possui formato")
- **500 Server Error**: "Erro no servidor, tente novamente"

### UI de Erro:
- Snackbar para erros temporários
- Dialog para erros críticos com opção de retry
- Indicador visual no step que falhou

---

## Validações Client-Side

1. **Step 2 (Formato)**: Formato selecionado !== null
2. **Step 3 (Disciplina)**: Valores numéricos >= 0
3. **Step 4 (Times)**: Mínimo de times alcançado
4. **Step 5 (Standings)**: Todas fases inicializadas
5. **Step 6 (Calendário)**: Data inicial >= hoje, intervaloDias > 0

---

## Extras (Opcional)

### Persistência Local:
- Cachear `LeagueSetupProgress` com SharedPreferences/Hive
- Permitir trabalhar offline nos steps já carregados
- Sync quando voltar online

### Animações:
- Transição suave entre steps
- Animação de check ✅ ao completar step
- Progress bar animada

### Acessibilidade:
- Semantic labels em todos os widgets
- Suporte a screen readers
- Navegação por teclado (web/desktop)

### Testes:
- Unit tests: models, repositories, controllers
- Widget tests: cada step widget isoladamente
- Integration tests: fluxo completo do wizard

---

## Checklist de Aceite

- [ ] Wizard exibe os 7 steps corretamente
- [ ] Status de cada step reflete o backend (`completed`, `current`, etc.)
- [ ] Progress bar mostra porcentagem correta
- [ ] Step 2: Lista formatos e aplica corretamente
- [ ] Step 3: Configuração de disciplina funcional (ou skip)
- [ ] Step 4: Adicionar times atualiza progresso
- [ ] Step 5: Inicializa standings por fase/grupo
- [ ] Step 6: Gera calendário com parâmetros
- [ ] Step 7: Tela de conclusão com resumo
- [ ] Navegação entre steps funciona corretamente
- [ ] Erros HTTP tratados com feedback visual
- [ ] Loading states durante chamadas API
- [ ] Refresh automático após cada ação
- [ ] Wizard pode ser fechado e retomado
- [ ] Responsive: funciona em mobile e tablet

---

## Observações Finais

- **BaseURL**: `http://localhost:3000` (dev) ou usar variável de ambiente
- **Autenticação**: Sempre enviar `Authorization: Bearer <token>` via Dio interceptor
- **Fonte da Verdade**: OpenAPI em `src/main/docs/openapi.ts` do backend
- **Consistência**: Manter alinhamento com modelos do backend
- **UX**: Guiar o usuário de forma clara, sem sobrecarga de informações

Boa implementação! 🚀
