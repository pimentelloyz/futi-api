# Fluxo de Configuração de Liga e Calendário

## Visão Geral

Após criar uma liga, é necessário seguir alguns passos para que o calendário de partidas fique disponível para os técnicos e jogadores. O processo varia de acordo com o formato da liga.

## Status Atual - Seed FUT7

O script `seed-fut7-championship.ts` já cria uma liga **completa e funcional** com:

✅ **Liga configurada** (Campeonato FUT7 2025)
✅ **Times adicionados** (8 times)
✅ **Grupos criados** (Grupo A e Grupo B)
✅ **Times distribuídos** (4 times em cada grupo)
✅ **Fases criadas** (Fase de Grupos, Semifinais, Final)
✅ **Partidas geradas** (15 partidas com datas agendadas)
✅ **Classificação inicializada** (Standings para todos os times)
✅ **Regras de disciplina** (3 amarelos = suspensão)

**Ou seja, o calendário já está disponível!** Os técnicos podem acessar as partidas através dos endpoints.

## Endpoints Disponíveis para Técnicos

### 1. Listar Partidas da Liga
```http
GET /api/matches?leagueId={leagueId}
Authorization: Bearer {jwt_token}
```

Retorna todas as partidas da liga, incluindo:
- Data e horário (`scheduledAt`)
- Times mandante e visitante
- Grupo (se aplicável)
- Status da partida (SCHEDULED, IN_PROGRESS, FINISHED, etc.)

### 2. Ver Detalhes da Liga
```http
GET /api/leagues/{leagueId}
Authorization: Bearer {jwt_token}
```

Retorna informações da liga:
- Nome, descrição, formato
- Datas de início e fim
- Times participantes
- Grupos
- Fases

### 3. Ver Times da Liga
```http
GET /api/leagues/{leagueId}/teams
Authorization: Bearer {jwt_token}
```

Lista todos os times inscritos na liga.

### 4. Ver Classificação
```http
GET /api/leagues/{leagueId}/standings
Authorization: Bearer {jwt_token}
```

Retorna a tabela de classificação com:
- Posição
- Pontos
- Jogos, vitórias, empates, derrotas
- Gols marcados e sofridos
- Saldo de gols

## Fluxo Manual (quando criar liga do zero)

Se você criar uma liga manualmente pelo endpoint `POST /api/leagues`, será necessário:

### Para formato MIXED (Grupos + Mata-mata)

1. **Criar a liga**
   ```http
   POST /api/leagues
   Body: { name, slug, description, matchFormat, formatId, startAt, endAt }
   ```

2. **Adicionar times à liga**
   ```http
   POST /api/leagues/{leagueId}/teams
   Body: { teamId }
   ```

3. **Criar grupos**
   ```http
   POST /api/leagues/{leagueId}/groups
   Body: { name: "Grupo A" }
   ```

4. **Adicionar times aos grupos**
   ```http
   POST /api/leagues/{leagueId}/groups/{groupId}/teams
   Body: { teamId }
   ```

5. **Criar fases**
   ```http
   POST /api/leagues/{leagueId}/phases
   Body: { name, order, type, startDate, endDate }
   ```

6. **Gerar confrontos do grupo** ⚠️ **ESTE É O PASSO CRUCIAL**
   ```http
   POST /api/leagues/{leagueId}/groups/{groupId}/fixtures
   Authorization: Bearer {jwt_token}
   Roles: LEAGUE_MANAGER ou ADMIN
   ```

   Este endpoint gera automaticamente todas as partidas do grupo (todos contra todos).

7. **Criar partidas do mata-mata manualmente**
   ```http
   POST /api/matches
   Body: { homeTeamId, awayTeamId, leagueId, scheduledAt, groupId? }
   ```

### Para formato ROUND_ROBIN (Pontos corridos)

1. Criar liga
2. Adicionar times
3. Gerar todas as partidas (ida e volta)
   - Pode ser feito manualmente via `POST /api/matches`
   - Ou através de um endpoint de geração de fixtures

### Para formato KNOCKOUT (Mata-mata)

1. Criar liga
2. Adicionar times
3. Criar fases (Oitavas, Quartas, Semi, Final)
4. Criar partidas manualmente para cada confronto

## Verificação do Status de Configuração

Use o endpoint de status para verificar o progresso:

```http
GET /api/leagues/{leagueId}/config-status
Authorization: Bearer {jwt_token}
Roles: LEAGUE_MANAGER ou ADMIN
```

Este endpoint retorna uma lista de passos (`steps`) com o status de cada um:
- ✅ `completed: true` - Passo concluído
- ❌ `completed: false` - Passo pendente
- `required: true/false` - Se o passo é obrigatório

Exemplo de resposta:
```json
{
  "steps": [
    {
      "id": "add_teams",
      "title": "Adicionar times",
      "description": "8 times adicionados",
      "completed": true,
      "required": true,
      "order": 1
    },
    {
      "id": "generate_group_matches",
      "title": "Gerar jogos da fase de grupos",
      "description": "Criar partidas de ida e volta dentro de cada grupo",
      "completed": true,
      "required": true,
      "order": 12
    },
    // ... outros passos
  ]
}
```

## Permissões Necessárias

Para gerar calendário e gerenciar a liga:
- **LEAGUE_MANAGER**: Pode gerenciar a liga específica
- **ADMIN**: Pode gerenciar qualquer liga

Para visualizar calendário e times:
- Qualquer usuário autenticado (com JWT válido)
- Alguns endpoints podem exigir que o usuário seja membro de um time da liga

## Exemplo Prático - Campeonato FUT7

No nosso seed, já fizemos tudo automaticamente:

```typescript
// 1. Liga criada ✅
const league = await prisma.league.create({...});

// 2. Times adicionados ✅
await prisma.leagueTeam.create({...});

// 3. Grupos criados ✅
const groupA = await prisma.leagueGroup.create({...});
const groupB = await prisma.leagueGroup.create({...});

// 4. Times distribuídos ✅
await prisma.leagueGroupTeam.create({...});

// 5. Fases criadas ✅
const groupPhase = await prisma.leaguePhase.create({...});
const semiPhase = await prisma.leaguePhase.create({...});
const finalPhase = await prisma.leaguePhase.create({...});

// 6. Partidas geradas ✅
await prisma.match.create({
  homeTeamId: teams[i].id,
  awayTeamId: teams[j].id,
  leagueId: league.id,
  groupId: groupA.id,
  scheduledAt: new Date(...),
  status: 'SCHEDULED',
});
```

**Resultado**: O calendário já está completo e acessível! 🎉

## Próximos Passos para Técnicos

Após o calendário estar disponível, os técnicos podem:

1. ✅ **Visualizar calendário completo** (`GET /api/matches?leagueId=...`)
2. ✅ **Ver detalhes de cada partida** (`GET /api/matches/{matchId}`)
3. ✅ **Acompanhar classificação** (`GET /api/leagues/{leagueId}/standings`)
4. ⏳ **Escalar jogadores** para as partidas (quando implementado)
5. ⏳ **Atualizar resultados** durante/após as partidas (MATCH_MANAGER role)
6. ⏳ **Registrar eventos** (gols, cartões, substituições)

## Comandos Úteis

```bash
# Ver o campeonato criado
npx tsx scripts/view-fut7-championship.ts

# Criar novo campeonato FUT7
npx tsx scripts/seed-fut7-championship.ts

# Listar formatos disponíveis
npx tsx scripts/list-formats.ts
```

## Resumo

✅ **No seed atual**: O calendário JÁ ESTÁ PRONTO e disponível para os técnicos.

❗ **Para ligas criadas manualmente**: É necessário usar o endpoint `POST /api/leagues/:id/groups/:groupId/fixtures` para gerar os confrontos da fase de grupos.

🔑 **Endpoint principal**: 
- `POST /api/leagues/{leagueId}/groups/{groupId}/fixtures` - Gera automaticamente todas as partidas do grupo
- Requer role: `LEAGUE_MANAGER` ou `ADMIN`
