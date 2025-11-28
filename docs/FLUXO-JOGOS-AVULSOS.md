# 🏃‍♂️ Fluxo de Jogos Avulsos / Peladas

## 📋 Visão Geral

No app FUTI, **jogos avulsos** (peladas, rachas, amistosos) são partidas criadas **fora de ligas/campeonatos**. São partidas casuais entre times para treino, diversão ou avaliação de jogadores.

---

## 🎯 Características

### **Diferença: Jogo de Liga vs Jogo Avulso**

| Característica | Jogo de Liga | Jogo Avulso |
|----------------|--------------|-------------|
| **leagueId** | ✅ Obrigatório | ❌ `null` |
| **groupId** | Opcional | ❌ `null` |
| **Classificação** | ✅ Atualiza standings | ❌ Não afeta |
| **Regras** | ✅ Regras da liga | ⚙️ Regras customizáveis |
| **Criação** | Via LEAGUE_MANAGER | Via MANAGER de qualquer time |
| **Objetivo** | Competição oficial | Treino/Diversão |

---

## 🚀 Fluxo Completo de Pelada

### **1. Criar Partida Avulsa**

**Endpoint**: `POST /api/matches`

**Permissões**: `LEAGUE_MANAGER` ou `ADMIN`

**Body**:
```json
{
  "homeTeamId": "time-casa-id",
  "awayTeamId": "time-visitante-id",
  "scheduledAt": "2025-12-01T15:00:00Z",
  "venue": "Quadra do Parque", // Opcional
  "status": "SCHEDULED" // Opcional, default: SCHEDULED
}
```

**Response (201)**:
```json
{
  "id": "match-uuid"
}
```

> **Nota**: Se `leagueId` não for fornecido, a partida é criada como **jogo avulso**.

---

### **2. Configurar Permissão de Match Manager**

Para que os técnicos possam gerenciar a partida (escalação, placar, eventos), é necessário criar o `AccessMembership` com role `MATCH_MANAGER`.

**Endpoint**: `POST /api/access-memberships` (ou diretamente no banco)

**Body**:
```json
{
  "userId": "tecnico-id",
  "matchId": "match-uuid",
  "role": "MATCH_MANAGER"
}
```

> **Automação**: Idealmente, ao criar a partida, o sistema deveria automaticamente atribuir os managers dos times como `MATCH_MANAGER` da partida.

---

### **3. Definir Escalação**

**Endpoint**: `POST /api/matches/:matchId/lineup`

**Permissões**: `MANAGER` ou `ADMIN`

**Body**:
```json
{
  "teamId": "time-casa-id",
  "entries": [
    {
      "playerId": "jogador-1-id",
      "position": "FORWARD",
      "isStarter": true
    },
    {
      "playerId": "jogador-2-id",
      "position": "GOALKEEPER",
      "isStarter": true
    },
    {
      "playerId": "jogador-3-id",
      "position": "DEFENDER",
      "isStarter": false // Banco
    }
  ]
}
```

**Response (204)**: Sem conteúdo (sucesso)

---

### **4. Iniciar Partida**

**Endpoint**: `PATCH /api/matches/:matchId/status`

**Permissões**: `MATCH_MANAGER`, `LEAGUE_MANAGER` ou `ADMIN`

**Body**:
```json
{
  "status": "IN_PROGRESS"
}
```

**Response (200)**:
```json
{
  "id": "match-uuid",
  "status": "IN_PROGRESS"
}
```

---

### **5. Registrar Eventos Durante o Jogo**

**Endpoint**: `POST /api/matches/:matchId/events`

**Permissões**: `MATCH_MANAGER` ou `ADMIN`

#### **Gol**
```json
{
  "type": "GOAL",
  "teamId": "time-casa-id",
  "playerId": "jogador-1-id",
  "minute": 15,
  "description": "Gol de cobertura" // Opcional
}
```

#### **Cartão Amarelo**
```json
{
  "type": "YELLOW_CARD",
  "teamId": "time-visitante-id",
  "playerId": "jogador-5-id",
  "minute": 28,
  "description": "Falta dura"
}
```

#### **Cartão Vermelho**
```json
{
  "type": "RED_CARD",
  "teamId": "time-visitante-id",
  "playerId": "jogador-5-id",
  "minute": 30,
  "description": "Segunda amarelo"
}
```

#### **Falta**
```json
{
  "type": "FOUL",
  "teamId": "time-casa-id",
  "playerId": "jogador-2-id",
  "minute": 42
}
```

**Response (201)**:
```json
{
  "id": "event-uuid",
  "type": "GOAL",
  "minute": 15
}
```

---

### **6. Atualizar Placar**

**Endpoint**: `PATCH /api/matches/:matchId/score`

**Permissões**: `MATCH_MANAGER` ou `ADMIN`

**Body**:
```json
{
  "homeScore": 3,
  "awayScore": 2
}
```

> **Nota**: Idealmente, o placar deveria ser atualizado automaticamente ao registrar eventos de gol, mas atualmente é manual.

---

### **7. Finalizar Partida**

**Endpoint**: `PATCH /api/matches/:matchId/status`

**Permissões**: `MATCH_MANAGER`, `LEAGUE_MANAGER` ou `ADMIN`

**Body**:
```json
{
  "status": "FINISHED"
}
```

**Response (200)**:
```json
{
  "id": "match-uuid",
  "status": "FINISHED"
}
```

**Side-effect**: Ao finalizar, o sistema **automaticamente gera atribuições de avaliação** para jogadores avaliarem uns aos outros.

---

### **8. Avaliar Jogadores (Pós-jogo)**

Após a partida ser finalizada, jogadores podem avaliar seus colegas.

**Fluxo**:
1. Jogador acessa: `GET /api/players/me/evaluations/pending`
2. Sistema retorna partidas que ele precisa avaliar
3. Jogador submete avaliações via endpoint de avaliação

---

## 📊 Consultar Partidas Avulsos

### **Listar Partidas**

**Endpoint**: `GET /api/matches`

**Query Params**:
```bash
# Todas as partidas de um time
GET /api/matches?teamId=time-casa-id

# Partidas agendadas
GET /api/matches?status=SCHEDULED

# Partidas em um período
GET /api/matches?from=2025-12-01&to=2025-12-31

# Paginação
GET /api/matches?page=1&limit=10
```

**Response (200)**:
```json
{
  "items": [
    {
      "id": "match-uuid",
      "homeTeamId": "time-1",
      "awayTeamId": "time-2",
      "scheduledAt": "2025-12-01T15:00:00Z",
      "status": "SCHEDULED",
      "venue": "Quadra ABC",
      "homeScore": 0,
      "awayScore": 0,
      "leagueId": null // ← Jogo avulso
    }
  ],
  "page": 1,
  "limit": 10,
  "total": 1
}
```

---

### **Detalhes da Partida (Súmula Completa)**

**Endpoint**: `GET /api/matches/:matchId/summary`

**Response (200)**:
```json
{
  "match": {
    "id": "match-uuid",
    "homeTeam": { "id": "...", "name": "Time A", "icon": "..." },
    "awayTeam": { "id": "...", "name": "Time B", "icon": "..." },
    "scheduledAt": "2025-12-01T15:00:00Z",
    "status": "FINISHED",
    "venue": "Quadra ABC",
    "homeScore": 3,
    "awayScore": 2
  },
  "events": [
    {
      "id": "event-1",
      "type": "GOAL",
      "minute": 15,
      "player": { "name": "João Silva" },
      "team": { "name": "Time A" }
    },
    {
      "id": "event-2",
      "type": "YELLOW_CARD",
      "minute": 28,
      "player": { "name": "Pedro Santos" },
      "team": { "name": "Time B" }
    }
  ],
  "lineup": {
    "home": [
      {
        "player": { "name": "João Silva", "number": 10 },
        "position": "FORWARD",
        "isStarter": true
      }
    ],
    "away": [ ... ]
  }
}
```

---

## 🎨 Formato "Rachão" (Liga de Peladas)

Se quiser organizar várias peladas em formato de campeonato casual:

### **1. Criar Liga com Formato Rachão**

**Endpoint**: `POST /api/leagues`

**Body**:
```json
{
  "name": "Rachão da Galera",
  "slug": "rachao-galera-2025",
  "formatId": "<rachao-format-id>", // Use seed-formats-only.ts
  "matchFormat": "FUT7",
  "startAt": "2025-12-01",
  "endAt": "2025-12-31",
  "isPublic": true
}
```

### **2. Adicionar Times**

```bash
POST /api/leagues/:leagueId/teams
Body: { "teamId": "time-1-id" }
```

### **3. Criar Grupos (Opcional)**

Se quiser dividir em 2 grupos (A e B):

```bash
POST /api/leagues/:leagueId/generate-groups
Body: { "count": 2, "namingPattern": "LETTER" }
```

### **4. Distribuir Times nos Grupos**

```bash
POST /api/leagues/:leagueId/groups/:groupId/teams
Body: { "teamId": "time-1-id" }
```

### **5. Gerar Jogos Automaticamente**

```bash
POST /api/leagues/:leagueId/groups/:groupId/fixtures
Body: {
  "startDate": "2025-12-01",
  "matchesPerDay": 2
}
```

Isso cria **todos os jogos do grupo automaticamente** (todos contra todos).

---

## 🔄 Fluxo no Front-end (Exemplo)

### **Tela: "Criar Pelada"**

```typescript
async function criarPelada() {
  // 1. Criar partida
  const match = await createMatch({
    homeTeamId: selectedHomeTeam.id,
    awayTeamId: selectedAwayTeam.id,
    scheduledAt: selectedDate,
    venue: selectedVenue
  });

  // 2. Atribuir managers como MATCH_MANAGER
  await assignMatchManager(match.id, homeTeamManagerId);
  await assignMatchManager(match.id, awayTeamManagerId);

  // 3. Navegar para tela de escalação
  navigation.navigate('MatchLineup', { matchId: match.id });
}
```

### **Tela: "Escalação"**

```typescript
async function salvarEscalacao() {
  await setMatchLineup(matchId, {
    teamId: myTeam.id,
    entries: selectedPlayers.map(p => ({
      playerId: p.id,
      position: p.position,
      isStarter: p.isStarter
    }))
  });

  toast.success('Escalação definida!');
}
```

### **Tela: "Gerenciar Jogo" (Durante a partida)**

```typescript
// Iniciar jogo
await updateMatchStatus(matchId, 'IN_PROGRESS');

// Registrar gol
await createMatchEvent(matchId, {
  type: 'GOAL',
  teamId: homeTeam.id,
  playerId: scorerId,
  minute: currentMinute
});

// Atualizar placar
await updateMatchScore(matchId, {
  homeScore: homeScore + 1,
  awayScore: awayScore
});

// Finalizar jogo
await updateMatchStatus(matchId, 'FINISHED');
```

---

## 📱 Endpoints Resumo

| Ação | Endpoint | Método | Permissão |
|------|----------|--------|-----------|
| Criar pelada | `/api/matches` | POST | LEAGUE_MANAGER, ADMIN |
| **Criar recorrência** 🆕 | `/api/matches/recurring` | POST | MANAGER, LEAGUE_MANAGER, ADMIN |
| Listar partidas | `/api/matches` | GET | Autenticado |
| Ver súmula | `/api/matches/:id/summary` | GET | Autenticado |
| Definir escalação | `/api/matches/:id/lineup` | POST | MANAGER, ADMIN |
| Ver escalação | `/api/matches/:id/lineup` | GET | Autenticado |
| Iniciar jogo | `/api/matches/:id/status` | PATCH | MATCH_MANAGER, ADMIN |
| Registrar evento | `/api/matches/:id/events` | POST | MATCH_MANAGER, ADMIN |
| Atualizar placar | `/api/matches/:id/score` | PATCH | MATCH_MANAGER, ADMIN |
| Finalizar jogo | `/api/matches/:id/status` | PATCH | MATCH_MANAGER, ADMIN |

---

## 🔁 **NOVO: Criar Partidas Recorrentes** 

### **Endpoint**: `POST /api/matches/recurring`

**Permissões**: `MANAGER`, `LEAGUE_MANAGER` ou `ADMIN`

Cria múltiplas partidas automaticamente baseado em um padrão de recorrência.

### **Padrões Suportados**

| Padrão | Descrição | Exemplo |
|--------|-----------|---------|
| `DAILY` | Todos os dias | Treino diário |
| `WEEKLY` | Semanalmente | Pelada toda segunda |
| `BIWEEKLY` | Quinzenalmente | A cada 2 semanas |
| `MONTHLY` | Mensalmente | Amistoso todo dia 15 |

### **Exemplos de Uso**

#### **1. Pelada toda segunda às 19h (10 jogos)**
```json
POST /api/matches/recurring

{
  "homeTeamId": "time-1-id",
  "awayTeamId": "time-2-id",
  "venue": "Quadra do Parque",
  "startDate": "2025-12-02",
  "pattern": "WEEKLY",
  "daysOfWeek": [1],  // 0=Dom, 1=Seg, 2=Ter, ..., 6=Sáb
  "time": "19:00",
  "occurrences": 10
}
```

**Response (201)**:
```json
{
  "matches": [
    {
      "id": "match-1-id",
      "scheduledAt": "2025-12-02T19:00:00Z",
      "homeTeamId": "...",
      "awayTeamId": "..."
    },
    {
      "id": "match-2-id",
      "scheduledAt": "2025-12-09T19:00:00Z",
      "homeTeamId": "...",
      "awayTeamId": "..."
    }
    // ... 8 partidas restantes
  ],
  "message": "10 matches created successfully"
}
```

#### **2. Rachão terça e quinta às 20h (até fim do ano)**
```json
POST /api/matches/recurring

{
  "homeTeamId": "time-1-id",
  "awayTeamId": "time-2-id",
  "venue": "Arena Central",
  "startDate": "2025-12-03",
  "pattern": "WEEKLY",
  "daysOfWeek": [2, 4],  // Terça e Quinta
  "time": "20:00",
  "endDate": "2025-12-31"  // Até esta data
}
```

#### **3. Amistoso mensal todo dia 15 às 15h (6 meses)**
```json
POST /api/matches/recurring

{
  "homeTeamId": "time-1-id",
  "awayTeamId": "time-2-id",
  "venue": "Estádio Municipal",
  "startDate": "2025-12-15",
  "pattern": "MONTHLY",
  "time": "15:00",
  "occurrences": 6
}
```

#### **4. Treino diário às 18h (segunda a sexta)**
```json
POST /api/matches/recurring

{
  "homeTeamId": "time-1-id",
  "awayTeamId": "time-2-id",
  "venue": "CT do Clube",
  "startDate": "2025-12-02",
  "pattern": "WEEKLY",
  "daysOfWeek": [1, 2, 3, 4, 5],  // Seg-Sex
  "time": "18:00",
  "occurrences": 20  // 4 semanas
}
```

### **Parâmetros**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `homeTeamId` | string | ✅ | ID do time da casa |
| `awayTeamId` | string | ✅ | ID do time visitante |
| `startDate` | string (ISO) | ✅ | Data inicial (YYYY-MM-DD) |
| `pattern` | enum | ✅ | DAILY, WEEKLY, BIWEEKLY, MONTHLY |
| `time` | string | ✅ | Horário (HH:mm) ex: "19:00" |
| `venue` | string | ❌ | Local da partida |
| `occurrences` | number | ❌ | Número de jogos (default: até 1 ano) |
| `endDate` | string (ISO) | ❌ | Data final (alternativa a occurrences) |
| `daysOfWeek` | number[] | ❌ | Dias da semana (0-6) para WEEKLY |

### **Benefícios**

✅ **Auto-atribui MATCH_MANAGER** aos técnicos dos times
✅ **Cria todas as partidas de uma vez** (batch)
✅ **Flexível**: pode especificar dias da semana, quantidade ou data final
✅ **Economia massiva**: 10 jogos = 1 chamada vs 10 chamadas

### **No Front-end**

```typescript
async function criarPeladaRecorrente() {
  const response = await fetch('/api/matches/recurring', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      homeTeamId: myTeam.id,
      awayTeamId: opponentTeam.id,
      venue: 'Quadra do Bairro',
      startDate: '2025-12-02',
      pattern: 'WEEKLY',
      daysOfWeek: [1], // Segunda
      time: '19:00',
      occurrences: 10
    })
  });

  const { matches } = await response.json();
  
  toast.success(`${matches.length} peladas agendadas!`);
  navigation.navigate('MyMatches');
}
```

---

## 🔧 Melhorias Sugeridas

### **1. Auto-atribuir MATCH_MANAGER**
Ao criar partida, automaticamente atribuir managers dos times como `MATCH_MANAGER`:

```typescript
// No AddMatchUseCase
if (match.homeTeamId && match.awayTeamId) {
  // Buscar managers dos times
  const managers = await prisma.accessMembership.findMany({
    where: {
      OR: [
        { teamId: match.homeTeamId, role: 'MANAGER' },
        { teamId: match.awayTeamId, role: 'MANAGER' }
      ]
    }
  });

  // Atribuir como MATCH_MANAGER
  await prisma.accessMembership.createMany({
    data: managers.map(m => ({
      userId: m.userId,
      matchId: match.id,
      role: 'MATCH_MANAGER'
    }))
  });
}
```

### **2. Placar Automático**
Incrementar placar automaticamente ao registrar gol:

```typescript
// No MatchEventCreateController
if (event.type === 'GOAL') {
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  
  if (event.teamId === match.homeTeamId) {
    await prisma.match.update({
      where: { id: matchId },
      data: { homeScore: { increment: 1 } }
    });
  } else {
    await prisma.match.update({
      where: { id: matchId },
      data: { awayScore: { increment: 1 } }
    });
  }
}
```

### **3. Notificações Push**
- Notificar jogadores quando partida for criada
- Notificar quando escalação for definida
- Notificar quando jogo começar
- Notificar quando houver gol

---

## ✅ Estado Atual

**O que funciona**:
- ✅ Criar partidas avulsos (sem liga)
- ✅ **Criar partidas recorrentes** (pelada toda semana, etc) 🆕
- ✅ **Auto-atribuir MATCH_MANAGER** na recorrência 🆕
- ✅ Gerenciar escalação
- ✅ Registrar eventos (gols, cartões, faltas)
- ✅ Atualizar placar manualmente
- ✅ Finalizar partida
- ✅ Ver súmula completa
- ✅ Geração automática de avaliações pós-jogo

**O que precisa melhorar**:
- ⚠️ Auto-atribuir MATCH_MANAGER em partidas únicas (apenas recorrência tem)
- ⚠️ Placar automático ao registrar gol
- ⚠️ Notificações push para eventos da partida
- ⚠️ Validação de regras (ex: jogador não pode estar em 2 times na mesma partida)

---

## 🎯 Conclusão

O sistema já **suporta completamente jogos avulsos/peladas**! A partida é criada sem `leagueId`, e os técnicos podem gerenciar tudo normalmente (escalação, eventos, placar). A principal limitação atual é que **não atribui automaticamente MATCH_MANAGER**, precisando ser feito manualmente ou via backend.
