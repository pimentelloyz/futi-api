# Criação de Grupos e Chaves - Formato Copa do Mundo

## Visão Geral

Para ligas estilo **Copa do Mundo** (formato MIXED), o processo envolve duas etapas principais:
1. **Fase de Grupos** - Todos contra todos em cada grupo
2. **Fase Eliminatória (Mata-mata)** - Oitavas, Quartas, Semifinais e Final

## 📋 Fluxo Completo - Copa do Mundo

### 1️⃣ Criar a Liga
```http
POST /api/leagues
Authorization: Bearer {jwt_token}
Role: ADMIN ou FAN (com upgrade para LEAGUE_MANAGER)

Body:
{
  "name": "Copa do Mundo 2026",
  "slug": "copa-mundo-2026",
  "description": "Campeonato mundial com 32 times",
  "matchFormat": "FUT11",
  "formatId": "{id-do-formato-copa-do-mundo}",
  "startAt": "2026-06-01T00:00:00Z",
  "endAt": "2026-07-15T00:00:00Z",
  "isPublic": true
}
```

### 2️⃣ Adicionar Times à Liga (32 times)
```http
POST /api/leagues/{leagueId}/teams
Authorization: Bearer {jwt_token}
Role: LEAGUE_MANAGER ou ADMIN

Body:
{
  "teamId": "{team-id}"
}
```

Repetir para os 32 times.

### 3️⃣ Criar Grupos (A, B, C, D, E, F, G, H)

#### Criar cada grupo individualmente:
```http
POST /api/leagues/{leagueId}/groups
Authorization: Bearer {jwt_token}
Role: LEAGUE_MANAGER ou ADMIN

Body:
{
  "name": "Grupo A"
}
```

Repetir para criar 8 grupos (A até H).

**Script auxiliar para criar grupos automaticamente:**
```typescript
const grupos = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
for (const letra of grupos) {
  await prisma.leagueGroup.create({
    data: {
      leagueId: league.id,
      name: `Grupo ${letra}`,
    },
  });
}
```

### 4️⃣ Distribuir Times nos Grupos (4 times por grupo)

Existem duas abordagens:

#### A) Manual (via API):
```http
POST /api/leagues/{leagueId}/groups/{groupId}/teams
Authorization: Bearer {jwt_token}
Role: LEAGUE_MANAGER ou ADMIN

Body:
{
  "teamId": "{team-id}"
}
```

#### B) Por Potes/Seeding (Script):
```typescript
// Exemplo: Copa do Mundo - 4 potes de 8 times cada
const pote1 = [team1, team2, team3, team4, team5, team6, team7, team8]; // Cabeças de chave
const pote2 = [team9, team10, ...]; // 8 times pote 2
const pote3 = [...]; // 8 times pote 3
const pote4 = [...]; // 8 times pote 4

const grupos = [groupA, groupB, groupC, groupD, groupE, groupF, groupG, groupH];

// Distribuir pote 1 (1 por grupo)
for (let i = 0; i < 8; i++) {
  await prisma.leagueGroupTeam.create({
    data: {
      groupId: grupos[i].id,
      teamId: pote1[i].id,
    },
  });
}

// Sortear e distribuir pote 2
const pote2Shuffled = shuffleArray(pote2);
for (let i = 0; i < 8; i++) {
  await prisma.leagueGroupTeam.create({
    data: {
      groupId: grupos[i].id,
      teamId: pote2Shuffled[i].id,
    },
  });
}

// Repetir para potes 3 e 4...
```

### 5️⃣ Criar Fase de Grupos
```http
POST /api/leagues/{leagueId}/phases
Authorization: Bearer {jwt_token}
Role: LEAGUE_MANAGER ou ADMIN

Body:
{
  "name": "Fase de Grupos",
  "order": 1,
  "type": "GROUP_STAGE",
  "startDate": "2026-06-01",
  "endDate": "2026-06-20",
  "hasHomeAway": false,
  "hasExtraTime": false,
  "hasPenalties": false
}
```

### 6️⃣ Gerar Partidas da Fase de Grupos

Para cada grupo, gerar todas as partidas (todos contra todos):

```http
POST /api/leagues/{leagueId}/groups/{groupId}/fixtures
Authorization: Bearer {jwt_token}
Role: LEAGUE_MANAGER ou ADMIN
```

Este endpoint gera automaticamente:
- Grupo com 4 times = 6 partidas (combinações de todos contra todos)
- Exemplo Grupo A: A1 vs A2, A1 vs A3, A1 vs A4, A2 vs A3, A2 vs A4, A3 vs A4

**Repetir para os 8 grupos = 48 partidas no total**

### 7️⃣ Criar Fases Eliminatórias

#### Oitavas de Final
```http
POST /api/leagues/{leagueId}/phases
Body:
{
  "name": "Oitavas de Final",
  "order": 2,
  "type": "KNOCKOUT",
  "startDate": "2026-06-24",
  "endDate": "2026-06-28",
  "hasHomeAway": false,
  "hasExtraTime": true,
  "hasPenalties": true
}
```

#### Quartas de Final
```http
POST /api/leagues/{leagueId}/phases
Body:
{
  "name": "Quartas de Final",
  "order": 3,
  "type": "KNOCKOUT",
  "startDate": "2026-07-01",
  "endDate": "2026-07-04"
}
```

#### Semifinais
```http
POST /api/leagues/{leagueId}/phases
Body:
{
  "name": "Semifinais",
  "order": 4,
  "type": "KNOCKOUT",
  "startDate": "2026-07-07",
  "endDate": "2026-07-08"
}
```

#### Disputa de 3º Lugar
```http
POST /api/leagues/{leagueId}/phases
Body:
{
  "name": "Disputa de 3º Lugar",
  "order": 5,
  "type": "KNOCKOUT",
  "startDate": "2026-07-14"
}
```

#### Final
```http
POST /api/leagues/{leagueId}/phases
Body:
{
  "name": "Final",
  "order": 6,
  "type": "KNOCKOUT",
  "startDate": "2026-07-15"
}
```

### 8️⃣ Definir Chaveamento das Oitavas

O chaveamento segue a regra da Copa do Mundo:
- 1º Grupo A vs 2º Grupo B
- 1º Grupo C vs 2º Grupo D
- 1º Grupo E vs 2º Grupo F
- 1º Grupo G vs 2º Grupo H
- 1º Grupo B vs 2º Grupo A
- 1º Grupo D vs 2º Grupo C
- 1º Grupo F vs 2º Grupo E
- 1º Grupo H vs 2º Grupo G

**Atualmente isso precisa ser feito manualmente ou via script após o término da fase de grupos.**

#### Script de exemplo para criar oitavas (após definir classificados):
```typescript
const oitavas = [
  { home: '1º_A', away: '2º_B', date: '2026-06-24T15:00:00Z' },
  { home: '1º_C', away: '2º_D', date: '2026-06-24T19:00:00Z' },
  { home: '1º_E', away: '2º_F', date: '2026-06-25T15:00:00Z' },
  { home: '1º_G', away: '2º_H', date: '2026-06-25T19:00:00Z' },
  { home: '1º_B', away: '2º_A', date: '2026-06-26T15:00:00Z' },
  { home: '1º_D', away: '2º_C', date: '2026-06-26T19:00:00Z' },
  { home: '1º_F', away: '2º_E', date: '2026-06-27T15:00:00Z' },
  { home: '1º_H', away: '2º_G', date: '2026-06-27T19:00:00Z' },
];

// Buscar times classificados
const grupoA = await prisma.leagueStanding.findMany({
  where: { groupId: groupA.id },
  orderBy: [{ points: 'desc' }, { goalDifference: 'desc' }],
  take: 2,
});

const primeiro_A = grupoA[0].teamId;
const segundo_A = grupoA[1].teamId;
// ... repetir para todos os grupos

// Criar partidas das oitavas
for (const oitava of oitavas) {
  await prisma.match.create({
    data: {
      leagueId: league.id,
      homeTeamId: primeiro_A, // substituir pelo time real
      awayTeamId: segundo_B,  // substituir pelo time real
      scheduledAt: new Date(oitava.date),
      status: 'SCHEDULED',
    },
  });
}
```

### 9️⃣ Criar Partidas das Quartas, Semifinais e Final

As partidas subsequentes são criadas com "placeholders" e atualizadas conforme os vencedores vão sendo definidos.

```http
POST /api/matches
Body:
{
  "leagueId": "{league-id}",
  "homeTeamId": "{vencedor-oitava-1}",
  "awayTeamId": "{vencedor-oitava-2}",
  "scheduledAt": "2026-07-01T15:00:00Z",
  "status": "SCHEDULED"
}
```

## 🔄 Fluxo Automático vs Manual

### ❌ **Atualmente NÃO Implementado** (TODO):
- Sorteio automático de times nos grupos
- Geração automática de chaveamento das oitavas baseado nos classificados
- Atualização automática das partidas do mata-mata com os vencedores

### ✅ **Atualmente Implementado**:
- Criar grupos manualmente via API
- Adicionar times aos grupos manualmente
- Gerar partidas da fase de grupos automaticamente (todos contra todos)
- Criar fases eliminatórias manualmente
- Criar partidas do mata-mata manualmente

## 📊 Resumo - Etapas Copa do Mundo

| Etapa | Endpoint | Tipo | Quantidade |
|-------|----------|------|------------|
| 1. Criar liga | `POST /api/leagues` | Manual | 1 |
| 2. Adicionar times | `POST /api/leagues/{id}/teams` | Manual | 32x |
| 3. Criar grupos | `POST /api/leagues/{id}/groups` | Manual | 8x |
| 4. Distribuir times | `POST /api/leagues/{id}/groups/{gId}/teams` | Manual | 32x |
| 5. Criar fase de grupos | `POST /api/leagues/{id}/phases` | Manual | 1 |
| 6. Gerar jogos grupos | `POST /api/leagues/{id}/groups/{gId}/fixtures` | **Automático** | 8x (48 jogos) |
| 7. Criar fases mata-mata | `POST /api/leagues/{id}/phases` | Manual | 5x |
| 8. Definir chaveamento | Script/Manual | Manual | 16 jogos |
| 9. Criar finais | `POST /api/matches` | Manual | 8 jogos |

**Total de Partidas**: 48 (grupos) + 16 (oitavas) + 8 (quartas) + 4 (semi+3º) + 1 (final) = **77 jogos**

## 🎯 Exemplo Prático - Script Completo

Veja o arquivo `scripts/seed-fut7-championship.ts` como referência. Para Copa do Mundo, seria algo assim:

```typescript
// 1. Criar liga
const league = await prisma.league.create({
  data: {
    name: 'Copa do Mundo 2026',
    slug: 'copa-mundo-2026',
    matchFormat: 'FUT11',
    // ... outros campos
  },
});

// 2. Criar 8 grupos
const grupos = [];
for (const letra of ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']) {
  const grupo = await prisma.leagueGroup.create({
    data: { leagueId: league.id, name: `Grupo ${letra}` },
  });
  grupos.push(grupo);
}

// 3. Distribuir times (exemplo simplificado)
for (let i = 0; i < 32; i++) {
  const grupoIndex = i % 8; // 0-7
  await prisma.leagueGroupTeam.create({
    data: {
      groupId: grupos[grupoIndex].id,
      teamId: times[i].id,
    },
  });
}

// 4. Criar fase de grupos
const faseGrupos = await prisma.leaguePhase.create({
  data: {
    leagueId: league.id,
    name: 'Fase de Grupos',
    order: 1,
    type: 'GROUP_STAGE',
  },
});

// 5. Gerar partidas de cada grupo (todos contra todos)
for (const grupo of grupos) {
  const timesDoGrupo = await prisma.leagueGroupTeam.findMany({
    where: { groupId: grupo.id },
  });
  
  // Gerar combinações todos contra todos
  for (let i = 0; i < 4; i++) {
    for (let j = i + 1; j < 4; j++) {
      await prisma.match.create({
        data: {
          leagueId: league.id,
          groupId: grupo.id,
          homeTeamId: timesDoGrupo[i].teamId,
          awayTeamId: timesDoGrupo[j].teamId,
          scheduledAt: new Date(/* calcular data */),
          status: 'SCHEDULED',
        },
      });
    }
  }
}

// 6. Criar fases mata-mata
const faseOitavas = await prisma.leaguePhase.create({
  data: {
    leagueId: league.id,
    name: 'Oitavas de Final',
    order: 2,
    type: 'KNOCKOUT',
  },
});

// ... criar quartas, semi, final

// 7. Criar partidas das oitavas (com placeholders inicialmente)
// Após fase de grupos terminar, atualizar com os times reais
```

## 🔮 Melhorias Futuras (TODO)

1. **Endpoint de sorteio automático**: `POST /api/leagues/{id}/draw-groups`
2. **Geração automática de chaveamento**: Após fase de grupos, criar oitavas automaticamente
3. **Webhook/trigger**: Quando uma partida termina, criar automaticamente a próxima fase
4. **Template de chaveamento**: Configurar regras de avanço (1ºA vs 2ºB, etc.)
5. **Visualização de bracket**: UI para mostrar chaveamento em árvore

## 📚 Referências

- Script de exemplo: `scripts/seed-fut7-championship.ts`
- Controller de status: `league-config-status-controller.ts`
- Endpoint de fixtures: `POST /api/leagues/:id/groups/:groupId/fixtures`
- Formatos disponíveis: `GET /api/formats?templatesOnly=true`
