# PROMPT: Interface de Gerenciamento de Partida (Match Manager) - Flutter

## 📋 Contexto

Você é um agente especializado em Flutter. Sua tarefa é criar uma interface completa de gerenciamento de partida para usuários com a role **MATCH_MANAGER**. Esta interface permitirá que árbitros/mesários:

1. Visualizem dados da partida em tempo real
2. Registrem eventos (gols, cartões amarelos, cartões vermelhos)
3. Atualizem o placar
4. Iniciem e finalizem a partida
5. Visualizem a súmula completa ao final

---

## 🎯 Requisitos Funcionais

### Tela Principal - Gerenciamento da Partida

A interface deve ter:

1. **Header com informações da partida:**
   - Times (nome e placar)
   - Status da partida (badge colorido)
   - Liga/Competição
   - Horário agendado
   - Local (venue)

2. **Ações de Status:**
   - Botão para iniciar partida (quando SCHEDULED)
   - Botão para finalizar partida (quando IN_PROGRESS)

3. **Registro de Eventos (Formulário):**
   - Seletor de tipo de evento: GOAL, YELLOW_CARD, RED_CARD
   - Seletor de time (Home/Away)
   - Seletor de jogador (carregado da escalação)
   - Campo de minuto (número, 0-130)
   - Botão para registrar evento

4. **Timeline de Eventos:**
   - Lista cronológica de todos os eventos
   - Ícones visuais para cada tipo (⚽ gol, 🟨 cartão amarelo, 🟥 cartão vermelho)
   - Minuto, jogador e time de cada evento
   - Possibilidade de deletar eventos (com confirmação)

5. **Botão para ver Súmula Completa:**
   - Abre modal/tela com súmula detalhada
   - Escalações dos dois times
   - Todos os eventos organizados
   - Estatísticas da partida

---

## 🔌 Endpoints da API

Base URL: `https://futi-api-777939995490.us-central1.run.app`

Todos os endpoints requerem autenticação via Bearer Token no header:
```
Authorization: Bearer <seu_jwt_token>
```

### 1. Obter Detalhes da Partida

**Endpoint:** `GET /api/matches/{matchId}`

**Response 200:**
```json
{
  "id": "246fdddd-fc8c-4ba6-ad40-fefd26ca1251",
  "status": "IN_PROGRESS",
  "scheduledAt": "2025-11-25T12:13:36.000Z",
  "venue": "Anfield",
  "homeScore": 2,
  "awayScore": 1,
  "homeTeamId": "team-home-id",
  "awayTeamId": "team-away-id",
  "leagueId": "league-id",
  "createdAt": "2025-11-20T10:00:00.000Z",
  "updatedAt": "2025-11-25T12:30:00.000Z"
}
```

**Nota:** Para obter os nomes dos times, você precisará fazer requests adicionais para `/api/teams/{teamId}` ou usar o endpoint de súmula que já retorna tudo junto.

---

### 2. Obter Escalação da Partida

**Endpoint:** `GET /api/matches/{matchId}/lineup`

**Response 200:**
```json
{
  "home": [
    "player-id-1",
    "player-id-2",
    "player-id-3"
  ],
  "away": [
    "player-id-4",
    "player-id-5",
    "player-id-6"
  ]
}
```

**Nota:** Retorna apenas IDs. Para obter nomes dos jogadores, use o endpoint `/api/players/{playerId}` ou o endpoint de súmula.

---

### 3. Listar Eventos da Partida

**Endpoint:** `GET /api/matches/{matchId}/events`

**Query Parameters (opcionais):**
- `type`: Filtrar por tipo de evento (ex: `GOAL,YELLOW_CARD`)

**Response 200:**
```json
{
  "items": [
    {
      "id": "event-id-1",
      "matchId": "246fdddd-fc8c-4ba6-ad40-fefd26ca1251",
      "type": "GOAL",
      "minute": 23,
      "playerId": "player-id-1",
      "teamId": "team-home-id",
      "createdAt": "2025-11-25T12:23:00.000Z"
    },
    {
      "id": "event-id-2",
      "matchId": "246fdddd-fc8c-4ba6-ad40-fefd26ca1251",
      "type": "YELLOW_CARD",
      "minute": 45,
      "playerId": "player-id-4",
      "teamId": "team-away-id",
      "createdAt": "2025-11-25T12:45:00.000Z"
    }
  ]
}
```

**Tipos de eventos possíveis:**
- `GOAL` - Gol
- `YELLOW_CARD` - Cartão amarelo
- `RED_CARD` - Cartão vermelho
- `FOUL` - Falta
- `OWN_GOAL` - Gol contra

---

### 4. Registrar Evento na Partida

**Endpoint:** `POST /api/matches/{matchId}/events`

**Request Body:**
```json
{
  "type": "GOAL",
  "playerId": "player-id-1",
  "teamId": "team-home-id",
  "minute": 67
}
```

**Campos obrigatórios:**
- `type`: Tipo do evento (`GOAL`, `YELLOW_CARD`, `RED_CARD`, `FOUL`, `OWN_GOAL`)
- `playerId`: ID do jogador
- `teamId`: ID do time
- `minute`: Minuto do evento (0-130)

**Response 201:**
```json
{
  "id": "event-id-3",
  "matchId": "246fdddd-fc8c-4ba6-ad40-fefd26ca1251",
  "type": "GOAL",
  "minute": 67,
  "playerId": "player-id-1",
  "teamId": "team-home-id",
  "createdAt": "2025-11-25T13:07:00.000Z"
}
```

**Response 400:** Dados inválidos
**Response 403:** Sem permissão (não é MATCH_MANAGER desta partida)

---

### 5. Deletar Evento da Partida

**Endpoint:** `DELETE /api/matches/{matchId}/events/{eventId}`

**Response 200:**
```json
{
  "message": "Event deleted successfully"
}
```

**Response 403:** Sem permissão
**Response 404:** Evento não encontrado

---

### 6. Atualizar Placar da Partida

**Endpoint:** `PATCH /api/matches/{matchId}/score`

**Request Body:**
```json
{
  "homeScore": 3,
  "awayScore": 1
}
```

**Campos obrigatórios:**
- `homeScore`: Placar do time da casa (número)
- `awayScore`: Placar do time visitante (número)

**Response 200:**
```json
{
  "id": "246fdddd-fc8c-4ba6-ad40-fefd26ca1251",
  "homeScore": 3,
  "awayScore": 1
}
```

**Nota:** O placar também pode ser calculado automaticamente pelos eventos de GOL registrados. Este endpoint serve para correções manuais.

---

### 7. Atualizar Status da Partida

**Endpoint:** `PATCH /api/matches/{matchId}/status`

**Request Body:**
```json
{
  "status": "IN_PROGRESS"
}
```

**Status possíveis:**
- `SCHEDULED` - Agendada
- `IN_PROGRESS` - Em andamento
- `FINISHED` - Finalizada
- `CANCELLED` - Cancelada

**Response 200:**
```json
{
  "id": "246fdddd-fc8c-4ba6-ad40-fefd26ca1251",
  "status": "FINISHED"
}
```

**Transições válidas:**
- SCHEDULED → IN_PROGRESS (iniciar partida)
- IN_PROGRESS → FINISHED (finalizar partida)
- Qualquer → CANCELLED (cancelar partida)

---

### 8. Obter Súmula Completa da Partida

**Endpoint:** `GET /api/matches/{matchId}/summary`

Este é o endpoint **MAIS IMPORTANTE** pois retorna todos os dados de uma vez!

**Response 200:**
```json
{
  "match": {
    "id": "246fdddd-fc8c-4ba6-ad40-fefd26ca1251",
    "status": "IN_PROGRESS",
    "scheduledAt": "2025-11-25T12:13:36.000Z",
    "venue": "Anfield",
    "homeScore": 2,
    "awayScore": 1,
    "homeTeam": {
      "id": "team-home-id",
      "name": "Liverpool"
    },
    "awayTeam": {
      "id": "team-away-id",
      "name": "Real Madrid"
    },
    "league": {
      "id": "league-id",
      "name": "UEFA Champions League 2024/25"
    }
  },
  "lineup": {
    "home": [
      {
        "id": "lineup-entry-id-1",
        "isStarting": true,
        "player": {
          "id": "player-id-1",
          "name": "Mohamed Salah",
          "number": 11,
          "positionSlug": "forward"
        }
      },
      {
        "id": "lineup-entry-id-2",
        "isStarting": true,
        "player": {
          "id": "player-id-2",
          "name": "Virgil van Dijk",
          "number": 4,
          "positionSlug": "defender"
        }
      }
    ],
    "away": [
      {
        "id": "lineup-entry-id-3",
        "isStarting": true,
        "player": {
          "id": "player-id-4",
          "name": "Vinícius Júnior",
          "number": 7,
          "positionSlug": "forward"
        }
      }
    ]
  },
  "events": {
    "goals": [
      {
        "id": "event-id-1",
        "type": "GOAL",
        "minute": 23,
        "player": {
          "id": "player-id-1",
          "name": "Mohamed Salah",
          "number": 11
        },
        "team": {
          "id": "team-home-id",
          "name": "Liverpool"
        },
        "createdAt": "2025-11-25T12:23:00.000Z"
      }
    ],
    "yellowCards": [
      {
        "id": "event-id-2",
        "minute": 45,
        "player": {
          "id": "player-id-4",
          "name": "Vinícius Júnior",
          "number": 7
        },
        "team": {
          "id": "team-away-id",
          "name": "Real Madrid"
        },
        "createdAt": "2025-11-25T12:45:00.000Z"
      }
    ],
    "redCards": [],
    "fouls": [],
    "all": [
      // Array com todos os eventos ordenados por minuto
    ]
  },
  "statistics": {
    "totalEvents": 2,
    "totalGoals": 2,
    "totalYellowCards": 1,
    "totalRedCards": 0,
    "totalFouls": 0,
    "homeGoals": 2,
    "awayGoals": 0,
    "homeYellowCards": 0,
    "awayYellowCards": 1,
    "homeRedCards": 0,
    "awayRedCards": 0
  }
}
```

**Response 404:** Partida não encontrada

---

## 🎨 Requisitos de UI/UX

### Cores e Design
- Use Material Design 3 com tema personalizado
- Status badges:
  - SCHEDULED: Azul (#2196F3)
  - IN_PROGRESS: Verde (#4CAF50)
  - FINISHED: Cinza (#9E9E9E)
  - CANCELLED: Vermelho (#F44336)

### Ícones para Eventos
- ⚽ Gol: `Icons.sports_soccer`
- 🟨 Cartão Amarelo: `Icons.square` com cor amarela
- 🟥 Cartão Vermelho: `Icons.square` com cor vermelha
- 📋 Súmula: `Icons.description`
- ▶️ Iniciar: `Icons.play_arrow`
- ⏹️ Finalizar: `Icons.stop`

### Validações
- Não permitir registrar eventos se status não for IN_PROGRESS
- Minuto deve ser entre 0 e 130
- Confirmar antes de deletar evento
- Confirmar antes de finalizar partida
- Mostrar loading durante requisições
- Mostrar mensagens de erro amigáveis

### Responsividade
- Interface deve funcionar em tablets e celulares
- Timeline de eventos deve ser scrollável
- Formulário de eventos deve ser compacto e fácil de usar

---

## 📦 Estrutura de Código Sugerida

```
lib/
├── models/
│   ├── match.dart
│   ├── match_event.dart
│   ├── match_summary.dart
│   └── player.dart
├── services/
│   └── match_api_service.dart
├── providers/
│   └── match_provider.dart (ou use Bloc/Cubit)
└── screens/
    ├── match_management_screen.dart
    └── match_summary_modal.dart
```

---

## 🔧 Implementação

### Passos:

1. **Criar os modelos de dados** (`Match`, `MatchEvent`, `MatchSummary`, `Player`, etc.)
   - Usar `json_serializable` ou `freezed` para serialização

2. **Criar serviço de API** (`MatchApiService`)
   - Métodos para todos os 8 endpoints listados
   - Usar `dio` ou `http` package
   - Tratar erros (timeout, 401, 403, 404, 500)

3. **Criar gerenciamento de estado** (Provider, Bloc, Riverpod, etc.)
   - Estado da partida
   - Lista de eventos
   - Estado de loading/erro

4. **Criar tela principal** (`MatchManagementScreen`)
   - Header com informações da partida
   - Botões de ação (iniciar/finalizar)
   - Formulário de registro de eventos
   - Timeline de eventos

5. **Criar modal de súmula** (`MatchSummaryModal`)
   - Mostrar súmula completa
   - Organizar por seções (match info, lineup, events, statistics)

6. **Implementar funcionalidades:**
   - Polling ou WebSocket para atualização em tempo real (opcional)
   - Pull-to-refresh para recarregar dados
   - Confirmações para ações críticas
   - Feedback visual (snackbars, dialogs)

---

## 🧪 Casos de Teste

Certifique-se de testar:

1. ✅ Carregar dados da partida com sucesso
2. ✅ Iniciar partida (SCHEDULED → IN_PROGRESS)
3. ✅ Registrar gol
4. ✅ Registrar cartão amarelo
5. ✅ Registrar cartão vermelho
6. ✅ Deletar evento com confirmação
7. ✅ Atualizar placar manualmente
8. ✅ Finalizar partida (IN_PROGRESS → FINISHED)
9. ✅ Ver súmula completa
10. ✅ Tratamento de erros (sem internet, sem permissão, etc.)

---

## 📝 Notas Importantes

1. **Autenticação:** Certifique-se de que o token JWT está sendo enviado em todos os requests
2. **Permissões:** Apenas usuários com role MATCH_MANAGER podem gerenciar a partida específica
3. **Match ID:** Use o ID da partida atual: `246fdddd-fc8c-4ba6-ad40-fefd26ca1251` para testes
4. **Súmula:** Priorize usar o endpoint `/summary` para carregar dados iniciais - ele é mais eficiente
5. **Eventos em tempo real:** Considere implementar polling a cada 5-10 segundos ou usar WebSocket para atualizações
6. **Escalação:** Carregue a escalação no início para popular os seletores de jogador

---

## 🚀 Entregáveis Esperados

1. **Código completo do app Flutter**
2. **Modelos de dados** com serialização JSON
3. **Serviço de API** com todos os métodos
4. **Tela de gerenciamento** funcional
5. **Modal de súmula** completo
6. **Tratamento de erros** robusto
7. **README** com instruções de setup e uso

---

## 💡 Extras (Opcional)

Se tiver tempo, implemente:

- 🔔 Notificações push quando eventos são registrados (já implementado no backend)
- 📊 Gráficos de estatísticas da partida
- 🎥 Animações nas transições de status
- 🌙 Modo escuro
- 🌐 Internacionalização (i18n)
- 💾 Cache local dos dados
- 🔄 Sincronização offline → online

---

**Boa sorte! 🚀⚽**
