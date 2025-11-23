# Prompt: Implementação de Gerenciamento de Ligas - Flutter App

## 📋 Contexto

Implementar funcionalidade completa para que gestores de liga (LEAGUE_MANAGER) possam visualizar e configurar suas ligas através do app Flutter. Quando o usuário logar e tiver permissão de LEAGUE_MANAGER em alguma liga, deve aparecer um banner informativo oferecendo acesso às configurações da liga.

## 🎯 Objetivos

1. **Banner de Boas-vindas**: Exibir banner quando gestor de liga logar
2. **Listagem de Ligas**: Mostrar ligas que o usuário gerencia
3. **Configurações da Liga**: Telas para editar configurações antes do início
4. **Validações**: Impedir alterações após liga iniciada

---

## 🔌 Endpoints da API Necessários

### 1. Listar Minhas Ligas como Gestor

```http
GET /api/leagues/me
Authorization: Bearer {token}
```

**Query Parameters:**
- `role` (opcional): Filtrar por role específico (ex: `LEAGUE_MANAGER`)

**Response 200:**
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "UEFA Champions League 2024/25",
      "slug": "champions-league-2024-25",
      "description": "A maior competição de clubes da Europa",
      "icon": "https://...",
      "banner": "https://...",
      "startAt": "2025-11-23T00:00:00Z",
      "endAt": "2026-05-31T00:00:00Z",
      "isActive": true,
      "isPublic": true,
      "myRole": "LEAGUE_MANAGER",
      "hasStarted": false,
      "teamsCount": 36,
      "matchesCount": 144,
      "format": {
        "id": "uuid",
        "name": "Champions League",
        "type": "LEAGUE_PHASE"
      }
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 1,
  "hasNext": false
}
```

### 2. Obter Detalhes e Configurações da Liga

```http
GET /api/leagues/{leagueId}/settings
Authorization: Bearer {token}
```

**Response 200:**
```json
{
  "league": {
    "id": "uuid",
    "name": "UEFA Champions League 2024/25",
    "slug": "champions-league-2024-25",
    "description": "A maior competição de clubes da Europa",
    "icon": "https://...",
    "banner": "https://...",
    "startAt": "2025-11-23T00:00:00Z",
    "endAt": "2026-05-31T00:00:00Z",
    "isActive": true,
    "isPublic": true,
    "hasStarted": false,
    "canEdit": true
  },
  "format": {
    "id": "uuid",
    "name": "Champions League",
    "slug": "champions-league",
    "type": "LEAGUE_PHASE"
  },
  "phases": [
    {
      "id": "uuid",
      "name": "Fase de Liga",
      "order": 1,
      "type": "LEAGUE",
      "status": "NOT_STARTED",
      "teamsCount": 36,
      "groupsCount": null,
      "teamsPerGroup": null,
      "hasHomeAway": false,
      "hasExtraTime": false,
      "hasPenalties": false,
      "advancingTeams": 24,
      "advancingFrom": "TOP_24"
    }
  ],
  "tiebreakRules": [
    {
      "id": "uuid",
      "phaseId": "uuid",
      "order": 1,
      "criterion": "POINTS",
      "criterionLabel": "Pontos"
    },
    {
      "id": "uuid",
      "phaseId": "uuid",
      "order": 2,
      "criterion": "GOAL_DIFFERENCE",
      "criterionLabel": "Saldo de Gols"
    },
    {
      "id": "uuid",
      "phaseId": "uuid",
      "order": 3,
      "criterion": "GOALS_FOR",
      "criterionLabel": "Gols Marcados"
    }
  ],
  "disciplineRule": {
    "id": "uuid",
    "yellowCardsForSuspension": 3,
    "yellowCardsAccumulation": true,
    "resetYellowsAfterPhaseOrder": null,
    "redCardMinimumGames": 1,
    "doubleYellowGames": 1
  },
  "teams": {
    "total": 36,
    "confirmed": 36,
    "pending": 0
  },
  "matches": {
    "total": 144,
    "scheduled": 144,
    "inProgress": 0,
    "finished": 0
  }
}
```

### 3. Atualizar Informações Básicas da Liga

```http
PATCH /api/leagues/{leagueId}
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "UEFA Champions League 2024/25",
  "description": "Descrição atualizada",
  "startAt": "2025-11-23T00:00:00Z",
  "endAt": "2026-05-31T00:00:00Z",
  "isActive": true,
  "isPublic": true
}
```

**Response 200:**
```json
{
  "id": "uuid",
  "name": "UEFA Champions League 2024/25",
  "slug": "champions-league-2024-25",
  "description": "Descrição atualizada",
  "startAt": "2025-11-23T00:00:00Z",
  "endAt": "2026-05-31T00:00:00Z",
  "isActive": true,
  "isPublic": true,
  "updatedAt": "2025-11-23T12:00:00Z"
}
```

### 4. Atualizar Fase da Liga

```http
PATCH /api/leagues/{leagueId}/phases/{phaseId}
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Fase de Liga",
  "teamsCount": 36,
  "groupsCount": null,
  "teamsPerGroup": null,
  "hasHomeAway": false,
  "hasExtraTime": false,
  "hasPenalties": false,
  "advancingTeams": 24,
  "advancingFrom": "TOP_24"
}
```

**Response 200:**
```json
{
  "id": "uuid",
  "name": "Fase de Liga",
  "order": 1,
  "type": "LEAGUE",
  "teamsCount": 36,
  "hasHomeAway": false,
  "updatedAt": "2025-11-23T12:00:00Z"
}
```

### 5. Atualizar Critérios de Desempate

```http
PUT /api/leagues/{leagueId}/phases/{phaseId}/tiebreak-rules
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "rules": [
    { "order": 1, "criterion": "POINTS" },
    { "order": 2, "criterion": "GOAL_DIFFERENCE" },
    { "order": 3, "criterion": "GOALS_FOR" },
    { "order": 4, "criterion": "HEAD_TO_HEAD_POINTS" },
    { "order": 5, "criterion": "WINS" }
  ]
}
```

**Response 200:**
```json
{
  "phaseId": "uuid",
  "rules": [
    {
      "id": "uuid",
      "order": 1,
      "criterion": "POINTS",
      "criterionLabel": "Pontos"
    },
    {
      "id": "uuid",
      "order": 2,
      "criterion": "GOAL_DIFFERENCE",
      "criterionLabel": "Saldo de Gols"
    }
  ],
  "updatedAt": "2025-11-23T12:00:00Z"
}
```

### 6. Atualizar Regras Disciplinares

```http
PATCH /api/leagues/{leagueId}/discipline-rules
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "yellowCardsForSuspension": 3,
  "yellowCardsAccumulation": true,
  "resetYellowsAfterPhaseOrder": 1,
  "redCardMinimumGames": 1,
  "doubleYellowGames": 1
}
```

**Response 200:**
```json
{
  "id": "uuid",
  "leagueId": "uuid",
  "yellowCardsForSuspension": 3,
  "yellowCardsAccumulation": true,
  "resetYellowsAfterPhaseOrder": 1,
  "redCardMinimumGames": 1,
  "doubleYellowGames": 1,
  "updatedAt": "2025-11-23T12:00:00Z"
}
```

### 7. Adicionar Grupo à Liga

```http
POST /api/leagues/{leagueId}/groups
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Grupo A",
  "phaseId": "uuid"
}
```

**Response 201:**
```json
{
  "id": "uuid",
  "leagueId": "uuid",
  "phaseId": "uuid",
  "name": "Grupo A",
  "createdAt": "2025-11-23T12:00:00Z"
}
```

### 8. Obter Critérios de Desempate Disponíveis

```http
GET /api/leagues/tiebreak-criteria
```

**Response 200:**
```json
{
  "criteria": [
    { "value": "POINTS", "label": "Pontos", "description": "Total de pontos conquistados" },
    { "value": "WINS", "label": "Vitórias", "description": "Número de vitórias" },
    { "value": "GOAL_DIFFERENCE", "label": "Saldo de Gols", "description": "Diferença entre gols marcados e sofridos" },
    { "value": "GOALS_FOR", "label": "Gols Marcados", "description": "Total de gols marcados" },
    { "value": "GOALS_AGAINST", "label": "Gols Sofridos", "description": "Total de gols sofridos" },
    { "value": "HEAD_TO_HEAD_POINTS", "label": "Confronto Direto (Pontos)", "description": "Pontos no confronto direto" },
    { "value": "HEAD_TO_HEAD_GOAL_DIFF", "label": "Confronto Direto (Saldo)", "description": "Saldo de gols no confronto direto" },
    { "value": "HEAD_TO_HEAD_GOALS_FOR", "label": "Confronto Direto (Gols Marcados)", "description": "Gols marcados no confronto direto" },
    { "value": "HEAD_TO_HEAD_GOALS_AWAY", "label": "Confronto Direto (Gols Fora)", "description": "Gols como visitante no confronto direto" },
    { "value": "AWAY_GOALS", "label": "Gols Fora", "description": "Gols marcados como visitante" },
    { "value": "WINS_AWAY", "label": "Vitórias Fora", "description": "Vitórias como visitante" },
    { "value": "FAIR_PLAY", "label": "Fair Play", "description": "Disciplina (menos cartões)" },
    { "value": "RED_CARDS", "label": "Cartões Vermelhos", "description": "Menos cartões vermelhos" },
    { "value": "YELLOW_CARDS", "label": "Cartões Amarelos", "description": "Menos cartões amarelos" },
    { "value": "DRAW", "label": "Sorteio", "description": "Decisão por sorteio" }
  ]
}
```

---

## 📱 Estrutura de Telas Flutter

### 1. **Home Screen com Banner**

Quando usuário tem role LEAGUE_MANAGER:

```dart
// Verificar se usuário é gestor de liga
Widget _buildLeagueManagerBanner(BuildContext context) {
  return FutureBuilder<MyLeaguesResponse>(
    future: _leagueService.getMyLeagues(role: 'LEAGUE_MANAGER'),
    builder: (context, snapshot) {
      if (!snapshot.hasData || snapshot.data!.items.isEmpty) {
        return SizedBox.shrink();
      }

      final leagues = snapshot.data!.items;
      final notStartedLeagues = leagues.where((l) => !l.hasStarted).toList();

      if (notStartedLeagues.isEmpty) {
        return SizedBox.shrink();
      }

      return Container(
        margin: EdgeInsets.all(16),
        padding: EdgeInsets.all(16),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [Colors.blue.shade600, Colors.blue.shade800],
          ),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.admin_panel_settings, color: Colors.white),
                SizedBox(width: 8),
                Text(
                  'Gestor de Liga',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            SizedBox(height: 8),
            Text(
              'Você gerencia ${notStartedLeagues.length} liga(s) que ainda não iniciaram.',
              style: TextStyle(color: Colors.white70),
            ),
            SizedBox(height: 12),
            ElevatedButton.icon(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => MyLeaguesManagerScreen(),
                  ),
                );
              },
              icon: Icon(Icons.settings),
              label: Text('Gerenciar Configurações'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: Colors.blue.shade800,
              ),
            ),
          ],
        ),
      );
    },
  );
}
```

### 2. **Tela: Minhas Ligas (Gestor)**

`my_leagues_manager_screen.dart`

```dart
class MyLeaguesManagerScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Minhas Ligas'),
        subtitle: Text('Como Gestor'),
      ),
      body: FutureBuilder<MyLeaguesResponse>(
        future: LeagueService().getMyLeagues(role: 'LEAGUE_MANAGER'),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return Center(child: Text('Erro ao carregar ligas'));
          }

          final leagues = snapshot.data!.items;

          return ListView.builder(
            itemCount: leagues.length,
            itemBuilder: (context, index) {
              final league = leagues[index];
              return LeagueManagerCard(
                league: league,
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => LeagueSettingsScreen(
                        leagueId: league.id,
                      ),
                    ),
                  );
                },
              );
            },
          );
        },
      ),
    );
  }
}
```

### 3. **Tela: Configurações da Liga**

`league_settings_screen.dart`

```dart
class LeagueSettingsScreen extends StatefulWidget {
  final String leagueId;

  const LeagueSettingsScreen({required this.leagueId});

  @override
  State<LeagueSettingsScreen> createState() => _LeagueSettingsScreenState();
}

class _LeagueSettingsScreenState extends State<LeagueSettingsScreen> {
  late Future<LeagueSettingsResponse> _settingsFuture;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  void _loadSettings() {
    _settingsFuture = LeagueService().getLeagueSettings(widget.leagueId);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Configurações da Liga'),
      ),
      body: FutureBuilder<LeagueSettingsResponse>(
        future: _settingsFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return Center(child: Text('Erro ao carregar configurações'));
          }

          final settings = snapshot.data!;

          // Se liga já iniciou, mostrar apenas visualização
          if (settings.league.hasStarted) {
            return _buildReadOnlyView(settings);
          }

          return _buildEditableView(settings);
        },
      ),
    );
  }

  Widget _buildEditableView(LeagueSettingsResponse settings) {
    return ListView(
      padding: EdgeInsets.all(16),
      children: [
        // Aviso de edição
        _buildEditWarning(),
        SizedBox(height: 16),

        // Informações básicas
        _buildBasicInfoCard(settings),
        SizedBox(height: 16),

        // Fases
        _buildPhasesCard(settings),
        SizedBox(height: 16),

        // Critérios de desempate
        _buildTiebreakCard(settings),
        SizedBox(height: 16),

        // Regras disciplinares
        _buildDisciplineCard(settings),
        SizedBox(height: 16),

        // Grupos (se aplicável)
        if (settings.phases.any((p) => p.type == 'GROUP_STAGE'))
          _buildGroupsCard(settings),
      ],
    );
  }

  Widget _buildEditWarning() {
    return Container(
      padding: EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.orange.shade50,
        border: Border.all(color: Colors.orange.shade300),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          Icon(Icons.info_outline, color: Colors.orange.shade700),
          SizedBox(width: 12),
          Expanded(
            child: Text(
              'As configurações podem ser alteradas até o início da liga.',
              style: TextStyle(color: Colors.orange.shade900),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBasicInfoCard(LeagueSettingsResponse settings) {
    return Card(
      child: ListTile(
        leading: Icon(Icons.info_outline),
        title: Text('Informações Básicas'),
        subtitle: Text(settings.league.name),
        trailing: Icon(Icons.chevron_right),
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => EditLeagueBasicInfoScreen(
                league: settings.league,
                onSaved: _loadSettings,
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildTiebreakCard(LeagueSettingsResponse settings) {
    return Card(
      child: ExpansionTile(
        leading: Icon(Icons.format_list_numbered),
        title: Text('Critérios de Desempate'),
        subtitle: Text('${settings.tiebreakRules.length} critérios configurados'),
        children: [
          ListView.builder(
            shrinkWrap: true,
            physics: NeverScrollableScrollPhysics(),
            itemCount: settings.tiebreakRules.length,
            itemBuilder: (context, index) {
              final rule = settings.tiebreakRules[index];
              return ListTile(
                leading: CircleAvatar(
                  child: Text('${rule.order}'),
                  radius: 16,
                ),
                title: Text(rule.criterionLabel),
                dense: true,
              );
            },
          ),
          Padding(
            padding: EdgeInsets.all(8),
            child: ElevatedButton.icon(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => EditTiebreakRulesScreen(
                      leagueId: widget.leagueId,
                      phaseId: settings.phases.first.id,
                      currentRules: settings.tiebreakRules,
                      onSaved: _loadSettings,
                    ),
                  ),
                );
              },
              icon: Icon(Icons.edit),
              label: Text('Editar Critérios'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDisciplineCard(LeagueSettingsResponse settings) {
    final discipline = settings.disciplineRule;
    
    return Card(
      child: ExpansionTile(
        leading: Icon(Icons.gavel),
        title: Text('Regras Disciplinares'),
        subtitle: Text('Cartões e suspensões'),
        children: [
          ListTile(
            title: Text('Amarelos para suspensão'),
            trailing: Text('${discipline.yellowCardsForSuspension}'),
            dense: true,
          ),
          ListTile(
            title: Text('Acumula amarelos'),
            trailing: Icon(
              discipline.yellowCardsAccumulation ? Icons.check : Icons.close,
            ),
            dense: true,
          ),
          ListTile(
            title: Text('Jogos por vermelho'),
            trailing: Text('${discipline.redCardMinimumGames}'),
            dense: true,
          ),
          ListTile(
            title: Text('Jogos por duplo amarelo'),
            trailing: Text('${discipline.doubleYellowGames}'),
            dense: true,
          ),
          Padding(
            padding: EdgeInsets.all(8),
            child: ElevatedButton.icon(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => EditDisciplineRulesScreen(
                      leagueId: widget.leagueId,
                      currentRules: discipline,
                      onSaved: _loadSettings,
                    ),
                  ),
                );
              },
              icon: Icon(Icons.edit),
              label: Text('Editar Regras'),
            ),
          ),
        ],
      ),
    );
  }
}
```

### 4. **Tela: Editar Critérios de Desempate**

`edit_tiebreak_rules_screen.dart`

```dart
class EditTiebreakRulesScreen extends StatefulWidget {
  final String leagueId;
  final String phaseId;
  final List<TiebreakRule> currentRules;
  final VoidCallback onSaved;

  const EditTiebreakRulesScreen({
    required this.leagueId,
    required this.phaseId,
    required this.currentRules,
    required this.onSaved,
  });

  @override
  State<EditTiebreakRulesScreen> createState() => _EditTiebreakRulesScreenState();
}

class _EditTiebreakRulesScreenState extends State<EditTiebreakRulesScreen> {
  late List<TiebreakRule> _rules;
  List<TiebreakCriterion> _availableCriteria = [];
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _rules = List.from(widget.currentRules);
    _loadAvailableCriteria();
  }

  Future<void> _loadAvailableCriteria() async {
    final response = await LeagueService().getTiebreakCriteria();
    setState(() {
      _availableCriteria = response.criteria;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Critérios de Desempate'),
        actions: [
          IconButton(
            icon: Icon(Icons.save),
            onPressed: _loading ? null : _saveRules,
          ),
        ],
      ),
      body: Column(
        children: [
          // Instruções
          Container(
            padding: EdgeInsets.all(16),
            color: Colors.blue.shade50,
            child: Row(
              children: [
                Icon(Icons.info_outline, color: Colors.blue.shade700),
                SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Arraste para reordenar os critérios. A ordem define a prioridade de desempate.',
                    style: TextStyle(color: Colors.blue.shade900),
                  ),
                ),
              ],
            ),
          ),

          // Lista reordenável
          Expanded(
            child: ReorderableListView.builder(
              padding: EdgeInsets.all(16),
              itemCount: _rules.length,
              onReorder: _onReorder,
              itemBuilder: (context, index) {
                final rule = _rules[index];
                final criterion = _availableCriteria.firstWhere(
                  (c) => c.value == rule.criterion,
                );

                return Card(
                  key: ValueKey(rule.id),
                  child: ListTile(
                    leading: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.drag_handle),
                        SizedBox(width: 8),
                        CircleAvatar(
                          child: Text('${index + 1}'),
                          radius: 16,
                        ),
                      ],
                    ),
                    title: Text(criterion.label),
                    subtitle: Text(criterion.description),
                    trailing: IconButton(
                      icon: Icon(Icons.delete, color: Colors.red),
                      onPressed: () => _removeRule(index),
                    ),
                  ),
                );
              },
            ),
          ),

          // Botão adicionar
          Padding(
            padding: EdgeInsets.all(16),
            child: ElevatedButton.icon(
              onPressed: _addRule,
              icon: Icon(Icons.add),
              label: Text('Adicionar Critério'),
              style: ElevatedButton.styleFrom(
                minimumSize: Size(double.infinity, 48),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _onReorder(int oldIndex, int newIndex) {
    setState(() {
      if (newIndex > oldIndex) newIndex--;
      final rule = _rules.removeAt(oldIndex);
      _rules.insert(newIndex, rule);
      // Atualizar ordem
      for (int i = 0; i < _rules.length; i++) {
        _rules[i] = _rules[i].copyWith(order: i + 1);
      }
    });
  }

  void _removeRule(int index) {
    setState(() {
      _rules.removeAt(index);
      // Atualizar ordem
      for (int i = 0; i < _rules.length; i++) {
        _rules[i] = _rules[i].copyWith(order: i + 1);
      }
    });
  }

  void _addRule() {
    // Mostrar dialog para selecionar critério
    showDialog(
      context: context,
      builder: (context) => SelectTiebreakCriterionDialog(
        availableCriteria: _availableCriteria,
        usedCriteria: _rules.map((r) => r.criterion).toList(),
        onSelected: (criterion) {
          setState(() {
            _rules.add(TiebreakRule(
              id: 'temp_${DateTime.now().millisecondsSinceEpoch}',
              phaseId: widget.phaseId,
              order: _rules.length + 1,
              criterion: criterion.value,
              criterionLabel: criterion.label,
            ));
          });
        },
      ),
    );
  }

  Future<void> _saveRules() async {
    setState(() => _loading = true);

    try {
      await LeagueService().updateTiebreakRules(
        widget.leagueId,
        widget.phaseId,
        _rules.map((r) => {
          'order': r.order,
          'criterion': r.criterion,
        }).toList(),
      );

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Critérios salvos com sucesso!')),
      );

      widget.onSaved();
      Navigator.pop(context);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Erro ao salvar: $e'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() => _loading = false);
    }
  }
}
```

### 5. **Tela: Editar Regras Disciplinares**

`edit_discipline_rules_screen.dart`

```dart
class EditDisciplineRulesScreen extends StatefulWidget {
  final String leagueId;
  final DisciplineRule currentRules;
  final VoidCallback onSaved;

  const EditDisciplineRulesScreen({
    required this.leagueId,
    required this.currentRules,
    required this.onSaved,
  });

  @override
  State<EditDisciplineRulesScreen> createState() => _EditDisciplineRulesScreenState();
}

class _EditDisciplineRulesScreenState extends State<EditDisciplineRulesScreen> {
  late int _yellowsForSuspension;
  late bool _accumulateYellows;
  late int? _resetYellowsAfterPhase;
  late int _redCardGames;
  late int _doubleYellowGames;
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _yellowsForSuspension = widget.currentRules.yellowCardsForSuspension;
    _accumulateYellows = widget.currentRules.yellowCardsAccumulation;
    _resetYellowsAfterPhase = widget.currentRules.resetYellowsAfterPhaseOrder;
    _redCardGames = widget.currentRules.redCardMinimumGames;
    _doubleYellowGames = widget.currentRules.doubleYellowGames;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Regras Disciplinares'),
        actions: [
          IconButton(
            icon: Icon(Icons.save),
            onPressed: _loading ? null : _saveRules,
          ),
        ],
      ),
      body: ListView(
        padding: EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Cartões Amarelos',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  SizedBox(height: 16),
                  
                  ListTile(
                    title: Text('Amarelos para suspensão'),
                    subtitle: Slider(
                      value: _yellowsForSuspension.toDouble(),
                      min: 2,
                      max: 5,
                      divisions: 3,
                      label: '$_yellowsForSuspension cartões',
                      onChanged: (value) {
                        setState(() => _yellowsForSuspension = value.toInt());
                      },
                    ),
                    trailing: Text(
                      '$_yellowsForSuspension',
                      style: Theme.of(context).textTheme.headlineSmall,
                    ),
                  ),

                  SwitchListTile(
                    title: Text('Acumular amarelos entre fases'),
                    subtitle: Text(
                      _accumulateYellows
                        ? 'Cartões amarelos acumulam durante toda a competição'
                        : 'Cartões amarelos são zerados entre fases',
                    ),
                    value: _accumulateYellows,
                    onChanged: (value) {
                      setState(() => _accumulateYellows = value);
                    },
                  ),
                ],
              ),
            ),
          ),

          SizedBox(height: 16),

          Card(
            child: Padding(
              padding: EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Cartões Vermelhos',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  SizedBox(height: 16),

                  ListTile(
                    title: Text('Jogos de suspensão por vermelho direto'),
                    subtitle: Slider(
                      value: _redCardGames.toDouble(),
                      min: 1,
                      max: 5,
                      divisions: 4,
                      label: '$_redCardGames jogo(s)',
                      onChanged: (value) {
                        setState(() => _redCardGames = value.toInt());
                      },
                    ),
                    trailing: Text(
                      '$_redCardGames',
                      style: Theme.of(context).textTheme.headlineSmall,
                    ),
                  ),

                  ListTile(
                    title: Text('Jogos de suspensão por duplo amarelo'),
                    subtitle: Slider(
                      value: _doubleYellowGames.toDouble(),
                      min: 1,
                      max: 3,
                      divisions: 2,
                      label: '$_doubleYellowGames jogo(s)',
                      onChanged: (value) {
                        setState(() => _doubleYellowGames = value.toInt());
                      },
                    ),
                    trailing: Text(
                      '$_doubleYellowGames',
                      style: Theme.of(context).textTheme.headlineSmall,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _saveRules() async {
    setState(() => _loading = true);

    try {
      await LeagueService().updateDisciplineRules(
        widget.leagueId,
        {
          'yellowCardsForSuspension': _yellowsForSuspension,
          'yellowCardsAccumulation': _accumulateYellows,
          'resetYellowsAfterPhaseOrder': _resetYellowsAfterPhase,
          'redCardMinimumGames': _redCardGames,
          'doubleYellowGames': _doubleYellowGames,
        },
      );

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Regras salvas com sucesso!')),
      );

      widget.onSaved();
      Navigator.pop(context);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Erro ao salvar: $e'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() => _loading = false);
    }
  }
}
```

---

## 🔧 Service Layer

`lib/services/league_service.dart`

```dart
class LeagueService {
  final ApiClient _api = ApiClient();

  Future<MyLeaguesResponse> getMyLeagues({String? role}) async {
    final response = await _api.get(
      '/leagues/me',
      queryParameters: role != null ? {'role': role} : null,
    );
    return MyLeaguesResponse.fromJson(response.data);
  }

  Future<LeagueSettingsResponse> getLeagueSettings(String leagueId) async {
    final response = await _api.get('/leagues/$leagueId/settings');
    return LeagueSettingsResponse.fromJson(response.data);
  }

  Future<void> updateLeague(String leagueId, Map<String, dynamic> data) async {
    await _api.patch('/leagues/$leagueId', data: data);
  }

  Future<void> updateTiebreakRules(
    String leagueId,
    String phaseId,
    List<Map<String, dynamic>> rules,
  ) async {
    await _api.put(
      '/leagues/$leagueId/phases/$phaseId/tiebreak-rules',
      data: {'rules': rules},
    );
  }

  Future<void> updateDisciplineRules(
    String leagueId,
    Map<String, dynamic> rules,
  ) async {
    await _api.patch('/leagues/$leagueId/discipline-rules', data: rules);
  }

  Future<TiebreakCriteriaResponse> getTiebreakCriteria() async {
    final response = await _api.get('/leagues/tiebreak-criteria');
    return TiebreakCriteriaResponse.fromJson(response.data);
  }
}
```

---

## ✅ Checklist de Implementação

### Backend (API)
- [ ] Criar endpoint `GET /api/leagues/{id}/settings`
- [ ] Criar endpoint `PUT /api/leagues/{id}/phases/{phaseId}/tiebreak-rules`
- [ ] Criar endpoint `PATCH /api/leagues/{id}/discipline-rules`
- [ ] Criar endpoint `GET /api/leagues/tiebreak-criteria`
- [ ] Adicionar validação: impedir alterações após liga iniciar
- [ ] Adicionar verificação de permissão LEAGUE_MANAGER

### Flutter App
- [ ] Criar modelo `LeagueSettingsResponse`
- [ ] Criar modelo `TiebreakRule` e `TiebreakCriterion`
- [ ] Criar modelo `DisciplineRule`
- [ ] Implementar `LeagueService`
- [ ] Adicionar banner de gestor na home
- [ ] Criar `MyLeaguesManagerScreen`
- [ ] Criar `LeagueSettingsScreen`
- [ ] Criar `EditTiebreakRulesScreen` com drag-and-drop
- [ ] Criar `EditDisciplineRulesScreen`
- [ ] Criar `EditLeagueBasicInfoScreen`
- [ ] Adicionar validações e feedback de erros
- [ ] Testes de integração

---

## 📝 Notas Importantes

1. **Validação de Edição**: Implementar validação no backend para impedir alterações após `hasStarted = true`
2. **Permissões**: Verificar que usuário tem role `LEAGUE_MANAGER` para a liga específica
3. **Feedback Visual**: Usar cores e ícones para diferenciar ligas ativas/inativas
4. **Persistência**: Salvar alterações imediatamente ou usar sistema de rascunho
5. **Histórico**: Considerar log de alterações para auditoria
