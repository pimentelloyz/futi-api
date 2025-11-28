# Prompt: Criar Tela de Partidas Recorrentes (Flutter)

## 🎯 Objetivo

Criar uma tela no app Flutter para que técnicos/managers possam agendar peladas/partidas recorrentes automaticamente, evitando criar jogo por jogo manualmente.

---

## 📱 Especificação da Tela

### **Nome da Tela**: `CreateRecurringMatchScreen`

### **Rota**: `/matches/recurring/create`

### **Permissão**: Usuário deve ser MANAGER de pelo menos um dos times

---

## 🎨 Layout e UX

### **Header**
```
┌─────────────────────────────────────┐
│  ← Agendar Peladas                 │
└─────────────────────────────────────┘
```

### **Formulário (Scrollable)**

```
┌─────────────────────────────────────┐
│                                     │
│  🏟️ Times                           │
│  ┌───────────────────────────────┐ │
│  │ Time da Casa                  │ │
│  │ Meu Time ▼                    │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ Time Visitante                │ │
│  │ Selecione o adversário ▼      │ │
│  └───────────────────────────────┘ │
│                                     │
│  📍 Local (Opcional)                │
│  ┌───────────────────────────────┐ │
│  │ Ex: Quadra do Parque          │ │
│  └───────────────────────────────┘ │
│                                     │
│  📅 Padrão de Recorrência           │
│  ┌───────────────────────────────┐ │
│  │ ⚪ Semanal                     │ │
│  │ ⚪ Quinzenal                   │ │
│  │ ⚪ Mensal                      │ │
│  │ ⚪ Diário                      │ │
│  └───────────────────────────────┘ │
│                                     │
│  📆 Dias da Semana (se semanal)     │
│  ┌───────────────────────────────┐ │
│  │ [D] [S] [T] [Q] [Q] [S] [S]   │ │
│  │  ☐   ☑   ☐   ☑   ☐   ☐   ☐    │ │
│  └───────────────────────────────┘ │
│                                     │
│  📅 Data Inicial                    │
│  ┌───────────────────────────────┐ │
│  │ 02/12/2025              📅     │ │
│  └───────────────────────────────┘ │
│                                     │
│  🕐 Horário                         │
│  ┌───────────────────────────────┐ │
│  │ 19:00                    🕐    │ │
│  └───────────────────────────────┘ │
│                                     │
│  🔢 Número de Jogos ou Data Final   │
│  ┌─────────────────┬─────────────┐ │
│  │ ⚪ Nº de jogos  │ ⚪ Até data │ │
│  └─────────────────┴─────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ 10 jogos                      │ │
│  └───────────────────────────────┘ │
│                                     │
│  📊 Prévia                          │
│  ┌───────────────────────────────┐ │
│  │ ✅ Seg 02/12 às 19:00         │ │
│  │ ✅ Qui 05/12 às 19:00         │ │
│  │ ✅ Seg 09/12 às 19:00         │ │
│  │ ... e mais 7 partidas         │ │
│  │                               │ │
│  │ 📈 Total: 10 jogos            │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │   🎯 Criar 10 Peladas         │ │
│  └───────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

---

## 📋 Campos do Formulário

### 1. **Time da Casa** (Dropdown obrigatório)
- Lista dos times do usuário (onde ele é MANAGER)
- Pré-seleciona o primeiro time
- Ícone do time à esquerda

### 2. **Time Visitante** (Dropdown obrigatório)
- Buscar times disponíveis (pode ser endpoint `/api/teams`)
- Campo de busca/filtro
- Não pode ser o mesmo que o time da casa
- Ícone do time à esquerda

### 3. **Local** (TextField opcional)
- Placeholder: "Ex: Quadra do Parque"
- Ícone de localização
- Max 100 caracteres

### 4. **Padrão de Recorrência** (Radio obrigatório)
- **Semanal** (WEEKLY) - default
- **Quinzenal** (BIWEEKLY)
- **Mensal** (MONTHLY)
- **Diário** (DAILY)

### 5. **Dias da Semana** (Multi-select condicional)
- Aparece apenas se padrão = SEMANAL
- Botões toggle para cada dia: [D, S, T, Q, Q, S, S]
- Pelo menos 1 dia deve ser selecionado
- Ícones ou cores para dias selecionados

### 6. **Data Inicial** (DatePicker obrigatório)
- Não pode ser no passado
- Formato: DD/MM/YYYY
- Ícone de calendário

### 7. **Horário** (TimePicker obrigatório)
- Formato: HH:mm (24h)
- Default: 19:00
- Ícone de relógio

### 8. **Número de Jogos OU Data Final** (Radio + Campo)
- **Opção 1**: Número de jogos (NumberField)
  - Min: 1, Max: 52
  - Default: 10
- **Opção 2**: Até data (DatePicker)
  - Deve ser após data inicial
  - Calcula automaticamente quantos jogos serão criados

### 9. **Prévia** (Card informativo)
- Mostra as primeiras 3-5 datas calculadas
- Exibe total de jogos que serão criados
- Atualiza em tempo real conforme o usuário muda os campos
- Se > 3 partidas, mostra "... e mais X partidas"

### 10. **Botão Criar** (CTA)
- Texto: "🎯 Criar [N] Peladas"
- Desabilitado se formulário inválido
- Loading state durante criação
- Cor primária, destaque

---

## 🔧 Lógica e Validações

### **Validações Obrigatórias**

```dart
// 1. Times diferentes
if (homeTeamId == awayTeamId) {
  showError('Times devem ser diferentes');
}

// 2. Data inicial no futuro
if (startDate.isBefore(DateTime.now())) {
  showError('Data inicial deve ser no futuro');
}

// 3. Dias da semana (se semanal)
if (pattern == 'WEEKLY' && selectedDays.isEmpty) {
  showError('Selecione pelo menos um dia da semana');
}

// 4. Número de jogos válido
if (useOccurrences && occurrences < 1) {
  showError('Número de jogos deve ser maior que 0');
}

// 5. Data final válida
if (!useOccurrences && endDate.isBefore(startDate)) {
  showError('Data final deve ser após data inicial');
}
```

### **Cálculo da Prévia**

```dart
List<DateTime> calculatePreviewDates() {
  List<DateTime> dates = [];
  DateTime current = startDate;
  
  while (dates.length < min(occurrences ?? 52, 5)) {
    if (shouldIncludeDate(current)) {
      dates.add(DateTime(
        current.year,
        current.month,
        current.day,
        timeOfDay.hour,
        timeOfDay.minute,
      ));
    }
    current = getNextDate(current);
  }
  
  return dates;
}

bool shouldIncludeDate(DateTime date) {
  switch (pattern) {
    case 'WEEKLY':
      return selectedDays.contains(date.weekday);
    case 'BIWEEKLY':
      return weeksBetween(startDate, date) % 2 == 0 
          && date.weekday == startDate.weekday;
    case 'MONTHLY':
      return date.day == startDate.day;
    case 'DAILY':
      return true;
  }
}
```

---

## 🌐 Integração com API

### **Endpoint**: `POST /api/matches/recurring`

### **Request Body**:
```dart
final body = {
  'homeTeamId': selectedHomeTeam.id,
  'awayTeamId': selectedAwayTeam.id,
  'venue': venueController.text.isEmpty ? null : venueController.text,
  'startDate': startDate.toIso8601String().split('T')[0], // YYYY-MM-DD
  'pattern': pattern, // 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'DAILY'
  'time': '${timeOfDay.hour.toString().padLeft(2, '0')}:${timeOfDay.minute.toString().padLeft(2, '0')}',
  'daysOfWeek': pattern == 'WEEKLY' ? selectedDays : null, // [1, 3] = Seg, Qua
  'occurrences': useOccurrences ? occurrences : null,
  'endDate': !useOccurrences ? endDate.toIso8601String().split('T')[0] : null,
};
```

### **Response** (201):
```dart
{
  "matches": [
    {
      "id": "match-uuid",
      "scheduledAt": "2025-12-02T19:00:00Z",
      "homeTeamId": "...",
      "awayTeamId": "..."
    },
    // ... mais partidas
  ],
  "message": "10 matches created successfully"
}
```

### **Service Method**:
```dart
class MatchService {
  Future<RecurringMatchResult> createRecurringMatches({
    required String homeTeamId,
    required String awayTeamId,
    String? venue,
    required DateTime startDate,
    required String pattern,
    required TimeOfDay time,
    List<int>? daysOfWeek,
    int? occurrences,
    DateTime? endDate,
  }) async {
    final response = await _apiClient.post(
      '/matches/recurring',
      data: {
        'homeTeamId': homeTeamId,
        'awayTeamId': awayTeamId,
        'venue': venue,
        'startDate': startDate.toIso8601String().split('T')[0],
        'pattern': pattern,
        'time': '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}',
        'daysOfWeek': daysOfWeek,
        'occurrences': occurrences,
        'endDate': endDate?.toIso8601String().split('T')[0],
      },
    );
    
    return RecurringMatchResult.fromJson(response.data);
  }
}
```

---

## 🎨 Design System

### **Cores**
- Primary: `Theme.of(context).primaryColor`
- Success: `Colors.green[600]`
- Error: `Colors.red[600]`
- Background: `Colors.grey[50]`
- Card: `Colors.white`

### **Spacing**
- Padding geral: `16.0`
- Entre campos: `16.0`
- Dentro de cards: `12.0`

### **Tipografia**
- Título seção: `headline6` (18sp, bold)
- Label campo: `subtitle2` (14sp, medium)
- Texto campo: `bodyText1` (16sp)
- Preview: `bodyText2` (14sp)

### **Componentes**
- Dropdown: `DropdownButtonFormField`
- TextField: `TextFormField` com decoração
- DatePicker: `showDatePicker` + `TextFormField`
- TimePicker: `showTimePicker` + `TextFormField`
- Radio: `RadioListTile`
- Toggle dias: `ChoiceChip` ou `FilterChip`
- Botão: `ElevatedButton` full width

---

## 📱 Fluxo de Navegação

### **Entrada**:
```dart
// De qualquer tela (ex: Home, Minhas Partidas)
Navigator.push(
  context,
  MaterialPageRoute(
    builder: (context) => CreateRecurringMatchScreen(),
  ),
);
```

### **Sucesso**:
```dart
// Após criar com sucesso
showDialog(
  context: context,
  builder: (context) => AlertDialog(
    title: Text('✅ Peladas Agendadas!'),
    content: Text('${result.matches.length} jogos foram criados com sucesso.'),
    actions: [
      TextButton(
        onPressed: () {
          Navigator.pop(context); // Fecha dialog
          Navigator.pop(context); // Volta para tela anterior
        },
        child: Text('Ver Minhas Partidas'),
      ),
    ],
  ),
);
```

### **Erro**:
```dart
// Em caso de erro
ScaffoldMessenger.of(context).showSnackBar(
  SnackBar(
    content: Text('❌ Erro ao criar peladas: ${error.message}'),
    backgroundColor: Colors.red,
    action: SnackBarAction(
      label: 'Tentar Novamente',
      textColor: Colors.white,
      onPressed: () => _submitForm(),
    ),
  ),
);
```

---

## 🧪 Casos de Teste

### **Cenário 1**: Pelada toda segunda às 19h (10 jogos)
```dart
homeTeam: Meu Time
awayTeam: Time Adversário
venue: Quadra do Bairro
pattern: WEEKLY
daysOfWeek: [1] // Segunda
startDate: 2025-12-02
time: 19:00
occurrences: 10

Resultado esperado:
- 10 partidas criadas
- Todas às segundas-feiras às 19h
- Primeira: 02/12/2025
- Última: 03/02/2026
```

### **Cenário 2**: Rachão terça e quinta até fim do ano
```dart
pattern: WEEKLY
daysOfWeek: [2, 4] // Terça e Quinta
startDate: 2025-12-03
time: 20:00
endDate: 2025-12-31

Resultado esperado:
- 8 partidas (4 terças + 4 quintas)
- Todas às 20h
- Última partida: 31/12/2025 (quinta)
```

### **Cenário 3**: Amistoso mensal todo dia 15
```dart
pattern: MONTHLY
startDate: 2025-12-15
time: 15:00
occurrences: 6

Resultado esperado:
- 6 partidas (uma por mês)
- Todas no dia 15 às 15h
- Meses: dez/25, jan/26, fev/26, mar/26, abr/26, mai/26
```

---

## 💡 Dicas de Implementação

### **1. State Management**
Use um `StatefulWidget` ou provider/bloc para gerenciar:
- Formulário
- Validações
- Prévia calculada
- Loading state

### **2. Performance**
- Debounce no cálculo da prévia (300ms)
- Lazy loading na lista de times adversários

### **3. Acessibilidade**
- Labels em todos os campos
- Hints descritivos
- Feedback visual de erros

### **4. UX Melhorias**
- Auto-scroll para erros
- Confirmação antes de criar muitos jogos (>20)
- Opção "Criar e Voltar" ou "Criar e Adicionar Mais"

### **5. Persistência**
- Salvar rascunho no SharedPreferences
- Recuperar se usuário sair da tela

---

## 🚀 Entrega Esperada

### **Arquivos**:
```
lib/
  screens/
    recurring_match/
      create_recurring_match_screen.dart
      widgets/
        days_of_week_selector.dart
        match_preview_card.dart
        pattern_selector.dart
  models/
    recurring_match_request.dart
    recurring_match_result.dart
  services/
    match_service.dart (adicionar método)
```

### **Checklist**:
- [ ] Tela renderiza corretamente
- [ ] Todos os campos funcionam
- [ ] Validações implementadas
- [ ] Prévia calcula corretamente
- [ ] Integração com API funciona
- [ ] Loading states implementados
- [ ] Tratamento de erros
- [ ] Navegação funciona
- [ ] Design consistente com o app
- [ ] Testes unitários (opcional)

---

## 📚 Referências

- **Endpoint**: `POST /api/matches/recurring`
- **Documentação**: `/docs/FLUXO-JOGOS-AVULSOS.md`
- **Padrões**: DAILY, WEEKLY, BIWEEKLY, MONTHLY
- **Dias da semana**: 0=Domingo, 1=Segunda, ..., 6=Sábado

---

## 🎯 Objetivo Final

Permitir que técnicos criem peladas recorrentes de forma rápida e intuitiva, visualizando previamente todas as datas que serão geradas antes de confirmar.

**Benefício**: Ao invés de criar 10 jogos manualmente (10 formulários), o usuário cria todos em 1 formulário! 🚀
