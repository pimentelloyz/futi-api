# Prompt: Implementação da Tela de Critérios de Desempate (Flutter)

## Contexto
Você precisa implementar uma tela no app Flutter que permita ao gestor da liga visualizar e reordenar os critérios de desempate através de drag-and-drop. Esta funcionalidade faz parte do módulo de configuração de ligas.

## Objetivos
1. Listar os critérios de desempate atuais da liga/fase
2. Permitir reordenação via drag-and-drop
3. Mostrar todos os critérios disponíveis (mesmo os não utilizados)
4. Salvar a nova ordem no backend

## ⚠️ Erros Comuns

### ❌ ERRO: Endpoint Incorreto
**NÃO use:** `GET /api/leagues/tiebreak-criteria`

Este endpoint antigo não existe mais e retorna erro 400.

**✅ Use:** `GET /api/leagues/{leagueId}/tiebreak-rules`

O `leagueId` deve estar no **path** da URL, não como query parameter.

### ❌ ERRO 500: Internal Server Error no PUT

Se você receber erro 500 ao tentar atualizar a ordem dos critérios, verifique:

1. **Token JWT válido e não expirado**
   ```dart
   // Verifique a expiração antes de cada request
   if (tokenIsExpired()) {
     await refreshToken();
   }
   ```

2. **Servidor backend está rodando**
   - Verifique se `localhost:3000` está acessível
   - Teste o endpoint GET primeiro para confirmar conectividade

3. **Envie TODOS os critérios, não apenas os alterados**
   ```dart
   // ✅ Correto: enviar todos
   "rules": [
     {"id": "uuid-1", "order": 1},
     {"id": "uuid-2", "order": 2},
     {"id": "uuid-3", "order": 3}
   ]
   
   // ❌ Incorreto: enviar apenas os alterados
   "rules": [
     {"id": "uuid-1", "order": 2},
     {"id": "uuid-2", "order": 1}
   ]
   ```

4. **Verifique os logs do servidor backend**
   - O erro 500 geralmente indica um problema no servidor
   - Procure por mensagens de erro no console do Node.js

5. **IDs de critérios inválidos**
   - Certifique-se de que todos os IDs enviados existem no banco de dados
   - Use apenas os IDs retornados pelo GET `/api/leagues/:id/tiebreak-rules`

### ⚠️ Problema Resolvido: Unique Constraint

O backend foi corrigido para lidar com a constraint única `(configId, order)`. A atualização agora é feita em duas etapas dentro de uma transação para evitar conflitos temporários.

---

## Endpoints Disponíveis

### 1. GET `/api/leagues/:id/tiebreak-rules`
**Buscar critérios de desempate de uma liga**

**⚠️ ATENÇÃO**: A URL deve incluir o ID da liga no path, não é `/api/leagues/tiebreak-criteria`

```http
GET /api/leagues/{leagueId}/tiebreak-rules?phaseId={phaseId}
Authorization: Bearer {token}
```

**Exemplo:**
```http
GET /api/leagues/5a39aa3c-b47e-4c0e-a5f8-6370e59a744b/tiebreak-rules
Authorization: Bearer {token}
```

**Query Parameters:**
- `phaseId` (opcional): ID da fase específica. Se omitido, retorna da primeira fase

**Response 200:**
```json
{
  "rules": [
    {
      "id": "819ac357-9095-493e-aa38-0f5296a02edf",
      "order": 1,
      "criterion": "POINTS",
      "criterionLabel": "Pontos"
    },
    {
      "id": "049eb3b9-5dff-48a0-9bda-b68643afe648",
      "order": 2,
      "criterion": "GOAL_DIFFERENCE",
      "criterionLabel": "Saldo de Gols"
    },
    {
      "id": "9d9be9d8-61a8-47a5-b294-84931f33ebe1",
      "order": 3,
      "criterion": "GOALS_FOR",
      "criterionLabel": "Gols Marcados"
    }
  ],
  "availableCriteria": [
    {
      "value": "POINTS",
      "label": "Pontos"
    },
    {
      "value": "WINS",
      "label": "Vitórias"
    },
    {
      "value": "GOAL_DIFFERENCE",
      "label": "Saldo de Gols"
    },
    {
      "value": "GOALS_FOR",
      "label": "Gols Marcados"
    },
    {
      "value": "GOALS_AGAINST",
      "label": "Gols Sofridos"
    },
    {
      "value": "HEAD_TO_HEAD_POINTS",
      "label": "Confronto Direto (Pontos)"
    },
    {
      "value": "HEAD_TO_HEAD_GOAL_DIFF",
      "label": "Confronto Direto (Saldo)"
    },
    {
      "value": "HEAD_TO_HEAD_GOALS_FOR",
      "label": "Confronto Direto (Gols Marcados)"
    },
    {
      "value": "HEAD_TO_HEAD_GOALS_AWAY",
      "label": "Confronto Direto (Gols Fora)"
    },
    {
      "value": "AWAY_GOALS",
      "label": "Gols Fora"
    },
    {
      "value": "WINS_AWAY",
      "label": "Vitórias Fora"
    },
    {
      "value": "FAIR_PLAY",
      "label": "Fair Play"
    },
    {
      "value": "RED_CARDS",
      "label": "Cartões Vermelhos"
    },
    {
      "value": "YELLOW_CARDS",
      "label": "Cartões Amarelos"
    },
    {
      "value": "DRAW",
      "label": "Sorteio"
    },
    {
      "value": "UEFA_COEFFICIENT",
      "label": "Coeficiente UEFA"
    }
  ]
}
```

**Códigos de Erro:**
- `401`: Não autenticado
- `403`: Sem permissão para acessar esta liga
- `404`: Liga ou fase não encontrada

---

### 2. PUT `/api/leagues/:id/phases/:phaseId/tiebreak-rules`
**Atualizar ordem dos critérios de desempate**

```http
PUT /api/leagues/{leagueId}/phases/{phaseId}/tiebreak-rules
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "rules": [
    {
      "id": "049eb3b9-5dff-48a0-9bda-b68643afe648",
      "order": 1
    },
    {
      "id": "819ac357-9095-493e-aa38-0f5296a02edf",
      "order": 2
    },
    {
      "id": "9d9be9d8-61a8-47a5-b294-84931f33ebe1",
      "order": 3
    }
  ]
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Tiebreak rules order updated successfully"
}
```

**Códigos de Erro:**
- `400`: Dados inválidos (rules array vazio ou malformado)
- `401`: Não autenticado
- `403`: Sem permissão (requer LEAGUE_MANAGER ou ADMIN) ou liga já começou
- `404`: Liga, fase ou configuração não encontrada

---

## Estrutura de Dados (Models)

### TiebreakRule
```dart
class TiebreakRule {
  final String id;
  final int order;
  final String criterion;
  final String criterionLabel;

  TiebreakRule({
    required this.id,
    required this.order,
    required this.criterion,
    required this.criterionLabel,
  });

  factory TiebreakRule.fromJson(Map<String, dynamic> json) {
    return TiebreakRule(
      id: json['id'],
      order: json['order'],
      criterion: json['criterion'],
      criterionLabel: json['criterionLabel'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'order': order,
    };
  }
}
```

### TiebreakCriterion
```dart
class TiebreakCriterion {
  final String value;
  final String label;

  TiebreakCriterion({
    required this.value,
    required this.label,
  });

  factory TiebreakCriterion.fromJson(Map<String, dynamic> json) {
    return TiebreakCriterion(
      value: json['value'],
      label: json['label'],
    );
  }
}
```

### TiebreakRulesResponse
```dart
class TiebreakRulesResponse {
  final List<TiebreakRule> rules;
  final List<TiebreakCriterion> availableCriteria;

  TiebreakRulesResponse({
    required this.rules,
    required this.availableCriteria,
  });

  factory TiebreakRulesResponse.fromJson(Map<String, dynamic> json) {
    return TiebreakRulesResponse(
      rules: (json['rules'] as List)
          .map((rule) => TiebreakRule.fromJson(rule))
          .toList(),
      availableCriteria: (json['availableCriteria'] as List)
          .map((criterion) => TiebreakCriterion.fromJson(criterion))
          .toList(),
    );
  }
}
```

---

## Service Layer

### LeagueTiebreakService
```dart
import 'package:dio/dio.dart';

class LeagueTiebreakService {
  final Dio _dio;
  final String baseUrl = '/leagues';

  LeagueTiebreakService(this._dio);

  /// Buscar critérios de desempate de uma liga
  /// 
  /// IMPORTANTE: A URL correta é /leagues/{leagueId}/tiebreak-rules
  /// NÃO use /leagues/tiebreak-criteria (endpoint antigo removido)
  Future<TiebreakRulesResponse> getTiebreakRules(
    String leagueId, {
    String? phaseId,
  }) async {
    try {
      final queryParams = <String, dynamic>{};
      if (phaseId != null) {
        queryParams['phaseId'] = phaseId;
      }

      final response = await _dio.get(
        '$baseUrl/$leagueId/tiebreak-rules',
        queryParameters: queryParams,
      );
      
      print('✅ GET /leagues/$leagueId/tiebreak-rules - Success');

      return TiebreakRulesResponse.fromJson(response.data);
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        throw Exception('Liga ou fase não encontrada');
      }
      if (e.response?.statusCode == 403) {
        throw Exception('Você não tem permissão para acessar esta liga');
      }
      throw Exception('Erro ao buscar critérios de desempate');
    }
  }

  /// Atualizar ordem dos critérios de desempate
  Future<void> updateTiebreakRulesOrder(
    String leagueId,
    String phaseId,
    List<TiebreakRule> rules,
  ) async {
    try {
      await _dio.put(
        '$baseUrl/$leagueId/phases/$phaseId/tiebreak-rules',
        data: {
          'rules': rules.map((rule) => rule.toJson()).toList(),
        },
      );
    } on DioException catch (e) {
      if (e.response?.statusCode == 403) {
        final message = e.response?.data['message'];
        if (message?.contains('already started') == true) {
          throw Exception('Não é possível editar critérios após o início da liga');
        }
        throw Exception('Você não tem permissão para editar esta liga');
      }
      if (e.response?.statusCode == 404) {
        throw Exception('Liga ou fase não encontrada');
      }
      throw Exception('Erro ao atualizar ordem dos critérios');
    }
  }
}
```

---

## UI - Tela de Critérios de Desempate

### Estrutura da Tela
```dart
import 'package:flutter/material.dart';

class TiebreakRulesScreen extends StatefulWidget {
  final String leagueId;
  final String phaseName;
  final String phaseId;
  final bool canEdit;

  const TiebreakRulesScreen({
    Key? key,
    required this.leagueId,
    required this.phaseName,
    required this.phaseId,
    required this.canEdit,
  }) : super(key: key);

  @override
  State<TiebreakRulesScreen> createState() => _TiebreakRulesScreenState();
}

class _TiebreakRulesScreenState extends State<TiebreakRulesScreen> {
  final LeagueTiebreakService _service = LeagueTiebreakService(Dio());
  
  List<TiebreakRule> _rules = [];
  List<TiebreakCriterion> _availableCriteria = [];
  bool _isLoading = true;
  bool _hasChanges = false;

  @override
  void initState() {
    super.initState();
    _loadTiebreakRules();
  }

  Future<void> _loadTiebreakRules() async {
    setState(() => _isLoading = true);
    
    try {
      final response = await _service.getTiebreakRules(
        widget.leagueId,
        phaseId: widget.phaseId,
      );
      
      setState(() {
        _rules = response.rules;
        _availableCriteria = response.availableCriteria;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erro ao carregar critérios: $e')),
      );
    }
  }

  Future<void> _saveTiebreakRules() async {
    try {
      await _service.updateTiebreakRulesOrder(
        widget.leagueId,
        widget.phaseId,
        _rules,
      );
      
      setState(() => _hasChanges = false);
      
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Ordem dos critérios atualizada com sucesso!'),
          backgroundColor: Colors.green,
        ),
      );
      
      Navigator.pop(context, true); // Retorna true para indicar mudanças
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Erro ao salvar: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _onReorder(int oldIndex, int newIndex) {
    if (!widget.canEdit) return;
    
    setState(() {
      if (newIndex > oldIndex) {
        newIndex -= 1;
      }
      
      final item = _rules.removeAt(oldIndex);
      _rules.insert(newIndex, item);
      
      // Atualizar a ordem de todos os itens
      for (int i = 0; i < _rules.length; i++) {
        _rules[i] = TiebreakRule(
          id: _rules[i].id,
          order: i + 1,
          criterion: _rules[i].criterion,
          criterionLabel: _rules[i].criterionLabel,
        );
      }
      
      _hasChanges = true;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Critérios de Desempate'),
            Text(
              widget.phaseName,
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
        ),
        actions: [
          if (widget.canEdit && _hasChanges)
            TextButton(
              onPressed: _saveTiebreakRules,
              child: const Text('SALVAR'),
            ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                if (!widget.canEdit)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    color: Colors.orange.shade100,
                    child: Row(
                      children: [
                        Icon(Icons.lock, color: Colors.orange.shade800),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'Liga já iniciada. Não é possível editar os critérios.',
                            style: TextStyle(color: Colors.orange.shade800),
                          ),
                        ),
                      ],
                    ),
                  ),
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text(
                    'Arraste os critérios para reordenar a prioridade de desempate',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.grey.shade600,
                        ),
                  ),
                ),
                Expanded(
                  child: ReorderableListView.builder(
                    onReorder: _onReorder,
                    itemCount: _rules.length,
                    itemBuilder: (context, index) {
                      final rule = _rules[index];
                      return _buildTiebreakRuleCard(rule, index);
                    },
                  ),
                ),
              ],
            ),
    );
  }

  Widget _buildTiebreakRuleCard(TiebreakRule rule, int index) {
    return Card(
      key: ValueKey(rule.id),
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: Theme.of(context).primaryColor,
          child: Text(
            '${rule.order}º',
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        title: Text(
          rule.criterionLabel,
          style: const TextStyle(fontWeight: FontWeight.w500),
        ),
        subtitle: Text(
          'Critério de desempate nº ${rule.order}',
          style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
        ),
        trailing: widget.canEdit
            ? const Icon(Icons.drag_handle, color: Colors.grey)
            : null,
      ),
    );
  }
}
```

---

## Fluxo de Uso

### 1. **Navegação para a Tela**
Partir da tela de configurações da liga:

```dart
Navigator.push(
  context,
  MaterialPageRoute(
    builder: (context) => TiebreakRulesScreen(
      leagueId: league.id,
      phaseName: phase.name,
      phaseId: phase.id,
      canEdit: league.canEdit, // Da resposta do /settings
    ),
  ),
).then((hasChanges) {
  if (hasChanges == true) {
    // Recarregar dados da liga se necessário
    _loadLeagueSettings();
  }
});
```

### 2. **Reordenação (Drag and Drop)**
- Usuário arrasta um critério para nova posição
- A lista é reordenada visualmente
- Os números de ordem são recalculados automaticamente
- Flag `_hasChanges` é ativada
- Botão "SALVAR" aparece no AppBar

### 3. **Salvar Alterações**
- Ao clicar em "SALVAR", envia PUT com nova ordem
- Backend valida permissões e se liga não começou
- Em caso de sucesso, volta para tela anterior
- Em caso de erro, mostra mensagem apropriada

---

## Tratamento de Erros

### Erros Comuns e Mensagens

| Erro | Status | Mensagem para o Usuário |
|------|--------|-------------------------|
| Não autenticado | 401 | "Sessão expirada. Faça login novamente" |
| Sem permissão | 403 | "Você não tem permissão para editar esta liga" |
| Liga já começou | 403 | "Não é possível editar critérios após o início da liga" |
| Liga não encontrada | 404 | "Liga não encontrada" |
| Fase não encontrada | 404 | "Fase não encontrada" |
| Erro de rede | - | "Erro de conexão. Tente novamente" |

---

## Validações Frontend

### Antes de Salvar
```dart
Future<void> _saveTiebreakRules() async {
  // 1. Verificar se pode editar
  if (!widget.canEdit) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Liga já iniciada. Não é possível editar.'),
      ),
    );
    return;
  }

  // 2. Verificar se há mudanças
  if (!_hasChanges) {
    Navigator.pop(context);
    return;
  }

  // 3. Confirmar com o usuário
  final confirm = await showDialog<bool>(
    context: context,
    builder: (context) => AlertDialog(
      title: const Text('Confirmar Alterações'),
      content: const Text(
        'Deseja salvar a nova ordem dos critérios de desempate?',
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context, false),
          child: const Text('CANCELAR'),
        ),
        ElevatedButton(
          onPressed: () => Navigator.pop(context, true),
          child: const Text('SALVAR'),
        ),
      ],
    ),
  );

  if (confirm != true) return;

  // 4. Enviar para backend
  // ... código de envio
}
```

---

## Melhorias Opcionais

### 1. **Loading durante Save**
```dart
bool _isSaving = false;

Future<void> _saveTiebreakRules() async {
  setState(() => _isSaving = true);
  
  try {
    // ... código de save
  } finally {
    setState(() => _isSaving = false);
  }
}
```

### 2. **Undo/Redo**
```dart
List<List<TiebreakRule>> _history = [];
int _historyIndex = -1;

void _onReorder(int oldIndex, int newIndex) {
  // Salvar estado atual no histórico
  _history = _history.sublist(0, _historyIndex + 1);
  _history.add(List.from(_rules));
  _historyIndex++;
  
  // ... código de reordenação
}

void _undo() {
  if (_historyIndex > 0) {
    _historyIndex--;
    setState(() {
      _rules = List.from(_history[_historyIndex]);
    });
  }
}
```

### 3. **Animações**
```dart
AnimatedList(
  // Ou usar animated_reorderable_list package
)
```

### 4. **Busca de Critérios**
```dart
TextField(
  decoration: InputDecoration(
    hintText: 'Buscar critério...',
    prefixIcon: Icon(Icons.search),
  ),
  onChanged: (query) {
    setState(() {
      _filteredRules = _rules
          .where((rule) => rule.criterionLabel
              .toLowerCase()
              .contains(query.toLowerCase()))
          .toList();
    });
  },
)
```

---

## Checklist de Implementação

### Backend (✅ Completo)
- [x] Endpoint GET `/api/leagues/:id/tiebreak-rules`
- [x] Endpoint PUT `/api/leagues/:id/phases/:phaseId/tiebreak-rules`
- [x] Validação de permissões (LEAGUE_MANAGER/ADMIN)
- [x] Validação de liga não iniciada
- [x] Retornar critérios disponíveis

### Frontend (Pendente)
- [ ] Models: `TiebreakRule`, `TiebreakCriterion`, `TiebreakRulesResponse`
- [ ] Service: `LeagueTiebreakService`
- [ ] Screen: `TiebreakRulesScreen`
- [ ] Implementar drag-and-drop com `ReorderableListView`
- [ ] Tratamento de erros
- [ ] Loading states
- [ ] Validações antes de salvar
- [ ] Navegação da tela de settings
- [ ] Testes unitários
- [ ] Testes de integração

---

## Exemplo de Teste (opcional)

```dart
void main() {
  group('TiebreakRulesScreen', () {
    testWidgets('deve carregar e exibir critérios', (tester) async {
      // Mock do service
      final mockService = MockLeagueTiebreakService();
      when(mockService.getTiebreakRules(any, phaseId: any))
          .thenAnswer((_) async => mockResponse);

      await tester.pumpWidget(
        MaterialApp(
          home: TiebreakRulesScreen(
            leagueId: 'league-1',
            phaseName: 'Fase de Liga',
            phaseId: 'phase-1',
            canEdit: true,
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Pontos'), findsOneWidget);
      expect(find.text('1º'), findsOneWidget);
    });

    testWidgets('deve reordenar critérios via drag-and-drop', (tester) async {
      // ... teste de drag and drop
    });
  });
}
```

---

## Notas Importantes

1. **Permissões**: Apenas LEAGUE_MANAGER e ADMIN podem reordenar
2. **Bloqueio**: Não é possível editar após a liga começar
3. **Ordem**: A ordem começa em 1 (primeiro critério)
4. **IDs**: Use os IDs retornados pelo GET para o PUT
5. **Todos os critérios**: Envie TODOS os critérios no PUT, não apenas os alterados
6. **Feedback**: Sempre dê feedback visual ao usuário sobre o status da operação

---

## Packages Recomendados

```yaml
dependencies:
  flutter:
    sdk: flutter
  dio: ^5.4.0
  provider: ^6.1.1 # Para state management (opcional)
  
dev_dependencies:
  mockito: ^5.4.4 # Para testes
  flutter_test:
    sdk: flutter
```

---

Boa sorte com a implementação! 🚀
