# API - Liga e Calendário de Jogos

Documentação dos endpoints para consultar detalhes de uma liga e seu calendário de partidas.

## 📋 Índice

- [Detalhes da Liga](#detalhes-da-liga)
- [Calendário de Jogos](#calendário-de-jogos)
- [Filtros Avançados](#filtros-avançados)
- [Exemplos Práticos](#exemplos-práticos)

---

## 🏆 Detalhes da Liga

Retorna as informações completas de uma liga específica.

### Endpoint

```
GET /api/leagues/:id
```

### Autenticação

⚠️ **Requer autenticação JWT** (mesmo para ligas públicas)

```bash
Authorization: Bearer {seu-token-jwt}
```

### Parâmetros

| Parâmetro | Tipo   | Descrição                              |
|-----------|--------|----------------------------------------|
| `id`      | string | ID ou slug da liga (path parameter)    |

### Exemplo de Requisição

```bash
curl -X GET http://localhost:3000/api/leagues/a87a0cc4-773d-4ebc-a724-5926525ab4da \
  -H "Authorization: Bearer seu-token-aqui"
```

Ou usando o slug:

```bash
curl -X GET http://localhost:3000/api/leagues/pelada-segundas-fut7 \
  -H "Authorization: Bearer seu-token-aqui"
```

### Resposta de Sucesso (200 OK)

```json
{
  "id": "a87a0cc4-773d-4ebc-a724-5926525ab4da",
  "name": "Pelada das Segundas - FUT7",
  "slug": "pelada-segundas-fut7",
  "description": "Pelada todas as segundas-feiras às 19h no campo do bairro",
  "icon": null,
  "banner": null,
  "startAt": "2025-01-06T22:00:00.000Z",
  "endAt": null,
  "isActive": true,
  "isPublic": false,
  "isOngoing": true,
  "matchFormat": "FUT7",
  "createdAt": "2025-12-10T16:36:22.161Z",
  "updatedAt": "2025-12-10T16:36:22.161Z"
}
```

### Campos da Resposta

| Campo          | Tipo     | Descrição                                        |
|----------------|----------|--------------------------------------------------|
| `id`           | string   | Identificador único da liga                      |
| `name`         | string   | Nome da liga                                     |
| `slug`         | string   | Slug único para URLs amigáveis                   |
| `description`  | string   | Descrição da liga                                |
| `icon`         | string?  | URL do ícone da liga                             |
| `banner`       | string?  | URL do banner da liga                            |
| `startAt`      | string   | Data de início (ISO 8601)                        |
| `endAt`        | string?  | Data de término (ISO 8601), null = sem prazo     |
| `isActive`     | boolean  | Liga está ativa                                  |
| `isPublic`     | boolean  | Liga é pública ou privada                        |
| `isOngoing`    | boolean  | Liga está em andamento (calculado)               |
| `matchFormat`  | string   | Formato das partidas (FUT7, FUT11, etc)          |
| `createdAt`    | string   | Data de criação                                  |
| `updatedAt`    | string   | Data da última atualização                       |

### Códigos de Resposta

| Código | Descrição                 |
|--------|---------------------------|
| 200    | Sucesso                   |
| 401    | Não autorizado            |
| 404    | Liga não encontrada       |

---

## 📅 Calendário de Jogos

Lista as partidas de uma liga com opções de filtros por data e status.

### Endpoint

```
GET /api/matches?leagueId=:id
```

### Autenticação

⚠️ **Requer autenticação JWT**

```bash
Authorization: Bearer {seu-token-jwt}
```

### Query Parameters

| Parâmetro  | Tipo   | Obrigatório | Descrição                                           |
|------------|--------|-------------|-----------------------------------------------------|
| `leagueId` | string | Sim         | ID da liga                                          |
| `from`     | string | Não         | Data inicial (ISO 8601 com timezone)                |
| `to`       | string | Não         | Data final (ISO 8601 com timezone)                  |
| `status`   | string | Não         | Status do jogo: SCHEDULED, IN_PROGRESS, FINISHED, CANCELED |
| `teamId`   | string | Não         | Filtrar por time específico                         |

### Exemplo 1: Todos os jogos da liga

```bash
curl -X GET "http://localhost:3000/api/matches?leagueId=a87a0cc4-773d-4ebc-a724-5926525ab4da" \
  -H "Authorization: Bearer seu-token-aqui"
```

### Resposta de Sucesso (200 OK)

```json
[
  {
    "id": "7b98f923-2ef6-4280-b799-4fcc922e8e2e",
    "scheduledAt": "2025-12-10T15:00:00.000Z",
    "venue": "Campo do Bairro",
    "status": "SCHEDULED",
    "homeScore": 0,
    "awayScore": 0,
    "createdAt": "2025-12-10T16:36:32.599Z",
    "updatedAt": "2025-12-10T16:36:32.599Z",
    "homeTeam": {
      "id": "d6a6b62d-a5f0-4881-8979-4dd3233bea44",
      "name": "Os Craques",
      "icon": null
    },
    "awayTeam": {
      "id": "d3baaa39-f6fc-440a-82c0-9aa683a43629",
      "name": "Os Artilheiros",
      "icon": null
    },
    "league": {
      "id": "a87a0cc4-773d-4ebc-a724-5926525ab4da",
      "name": "Pelada das Segundas - FUT7",
      "slug": "pelada-segundas-fut7"
    }
  },
  {
    "id": "fe0ec4ed-d602-4043-a497-098650d70e03",
    "scheduledAt": "2025-12-17T22:00:00.000Z",
    "venue": "Campo do Bairro",
    "status": "SCHEDULED",
    "homeScore": 0,
    "awayScore": 0,
    "createdAt": "2025-12-10T16:36:36.185Z",
    "updatedAt": "2025-12-10T16:36:36.185Z",
    "homeTeam": {
      "id": "d6a6b62d-a5f0-4881-8979-4dd3233bea44",
      "name": "Os Craques",
      "icon": null
    },
    "awayTeam": {
      "id": "d3baaa39-f6fc-440a-82c0-9aa683a43629",
      "name": "Os Artilheiros",
      "icon": null
    },
    "league": {
      "id": "a87a0cc4-773d-4ebc-a724-5926525ab4da",
      "name": "Pelada das Segundas - FUT7",
      "slug": "pelada-segundas-fut7"
    }
  }
]
```

### Campos da Resposta (Match)

| Campo         | Tipo    | Descrição                                    |
|---------------|---------|----------------------------------------------|
| `id`          | string  | ID único da partida                          |
| `scheduledAt` | string  | Data/hora agendada (ISO 8601)                |
| `venue`       | string? | Local da partida                             |
| `status`      | string  | Status: SCHEDULED, IN_PROGRESS, FINISHED, CANCELED |
| `homeScore`   | number  | Placar do time da casa                       |
| `awayScore`   | number  | Placar do time visitante                     |
| `homeTeam`    | object  | Dados do time da casa (id, name, icon)       |
| `awayTeam`    | object  | Dados do time visitante (id, name, icon)     |
| `league`      | object  | Dados da liga (id, name, slug)               |
| `createdAt`   | string  | Data de criação                              |
| `updatedAt`   | string  | Data da última atualização                   |

---

## 🔍 Filtros Avançados

### Exemplo 2: Jogos em um período específico

Buscar jogos de dezembro de 2025:

```bash
curl -X GET "http://localhost:3000/api/matches?leagueId=a87a0cc4-773d-4ebc-a724-5926525ab4da&from=2025-12-01T00:00:00.000Z&to=2025-12-31T23:59:59.999Z" \
  -H "Authorization: Bearer seu-token-aqui"
```

**Importante:** As datas devem estar no formato ISO 8601 com timezone (`.000Z` no final).

### Exemplo 3: Apenas jogos agendados

Filtrar partidas que ainda não foram iniciadas:

```bash
curl -X GET "http://localhost:3000/api/matches?leagueId=a87a0cc4-773d-4ebc-a724-5926525ab4da&status=SCHEDULED" \
  -H "Authorization: Bearer seu-token-aqui"
```

### Exemplo 4: Jogos finalizados

Buscar histórico de partidas:

```bash
curl -X GET "http://localhost:3000/api/matches?leagueId=a87a0cc4-773d-4ebc-a724-5926525ab4da&status=FINISHED" \
  -H "Authorization: Bearer seu-token-aqui"
```

### Exemplo 5: Jogos ao vivo

Partidas em andamento:

```bash
curl -X GET "http://localhost:3000/api/matches?leagueId=a87a0cc4-773d-4ebc-a724-5926525ab4da&status=IN_PROGRESS" \
  -H "Authorization: Bearer seu-token-aqui"
```

### Exemplo 6: Jogos de um time específico

Filtrar por time (retorna jogos onde o time é casa ou visitante):

```bash
curl -X GET "http://localhost:3000/api/matches?leagueId=a87a0cc4-773d-4ebc-a724-5926525ab4da&teamId=d6a6b62d-a5f0-4881-8979-4dd3233bea44" \
  -H "Authorization: Bearer seu-token-aqui"
```

### Exemplo 7: Combinando filtros

Jogos agendados de um time em dezembro:

```bash
curl -X GET "http://localhost:3000/api/matches?leagueId=a87a0cc4-773d-4ebc-a724-5926525ab4da&teamId=d6a6b62d-a5f0-4881-8979-4dd3233bea44&status=SCHEDULED&from=2025-12-01T00:00:00.000Z&to=2025-12-31T23:59:59.999Z" \
  -H "Authorization: Bearer seu-token-aqui"
```

---

## 💡 Exemplos Práticos

### Construir Calendário Mensal

```bash
# Janeiro 2025
curl -X GET "http://localhost:3000/api/matches?leagueId=a87a0cc4-773d-4ebc-a724-5926525ab4da&from=2025-01-01T00:00:00.000Z&to=2025-01-31T23:59:59.999Z" \
  -H "Authorization: Bearer seu-token-aqui" | jq '.'
```

### Próximos Jogos (próximos 7 dias)

```bash
# Calcular datas dinamicamente
FROM_DATE=$(date -u +"%Y-%m-%dT00:00:00.000Z")
TO_DATE=$(date -u -v+7d +"%Y-%m-%dT23:59:59.999Z")

curl -X GET "http://localhost:3000/api/matches?leagueId=a87a0cc4-773d-4ebc-a724-5926525ab4da&from=${FROM_DATE}&to=${TO_DATE}&status=SCHEDULED" \
  -H "Authorization: Bearer seu-token-aqui" | jq '.'
```

### Estatísticas: Contar Jogos por Status

```bash
# Agendados
curl -s -X GET "http://localhost:3000/api/matches?leagueId=a87a0cc4-773d-4ebc-a724-5926525ab4da&status=SCHEDULED" \
  -H "Authorization: Bearer seu-token-aqui" | jq 'length'

# Finalizados
curl -s -X GET "http://localhost:3000/api/matches?leagueId=a87a0cc4-773d-4ebc-a724-5926525ab4da&status=FINISHED" \
  -H "Authorization: Bearer seu-token-aqui" | jq 'length'
```

### Verificar se há jogo hoje

```bash
TODAY_START=$(date -u +"%Y-%m-%dT00:00:00.000Z")
TODAY_END=$(date -u +"%Y-%m-%dT23:59:59.999Z")

curl -s -X GET "http://localhost:3000/api/matches?leagueId=a87a0cc4-773d-4ebc-a724-5926525ab4da&from=${TODAY_START}&to=${TODAY_END}" \
  -H "Authorization: Bearer seu-token-aqui" | jq 'length'
```

---

## 🎯 Status dos Jogos

| Status        | Descrição                           |
|---------------|-------------------------------------|
| SCHEDULED     | Jogo agendado (ainda não começou)   |
| IN_PROGRESS   | Jogo em andamento                   |
| FINISHED      | Jogo finalizado                     |
| CANCELED      | Jogo cancelado                      |

---

## ⚠️ Observações Importantes

1. **Autenticação obrigatória**: Todos os endpoints requerem token JWT válido no header Authorization
2. **Formato de datas**: Use ISO 8601 com timezone (ex: `2025-12-31T23:59:59.999Z`)
3. **Timezone**: Todas as datas são retornadas em UTC (Z)
4. **Paginação**: Atualmente não há paginação implementada (retorna todos os resultados)
5. **Performance**: Para ligas com muitos jogos, sempre use filtros de data ou status

---

## 🔗 Endpoints Relacionados

- [GET /api/teams/:id/leagues](./API_TEAMS.md) - Listar ligas de um time
- [POST /api/matches/:id/events](./API_MATCHES.md) - Registrar eventos em partida
- [PATCH /api/matches/:id/status](./API_MATCHES.md) - Atualizar status da partida
- [GET /api/leagues/:id/teams](./API_LEAGUES.md) - Listar times da liga

---

## 📝 Notas para Desenvolvedores

### Conversão de Timezone

Para exibir datas no timezone local do usuário:

```javascript
// JavaScript/TypeScript
const match = { scheduledAt: "2025-12-17T22:00:00.000Z" };
const localDate = new Date(match.scheduledAt);
console.log(localDate.toLocaleString('pt-BR', { 
  timeZone: 'America/Sao_Paulo' 
}));
// Output: 17/12/2025 19:00:00
```

### Agrupar jogos por data

```javascript
// Agrupar matches por dia
const matchesByDate = matches.reduce((acc, match) => {
  const date = new Date(match.scheduledAt).toISOString().split('T')[0];
  if (!acc[date]) acc[date] = [];
  acc[date].push(match);
  return acc;
}, {});
```

---

## 🐛 Troubleshooting

### Erro 401 Unauthorized

```json
{ "error": "unauthorized" }
```

**Solução**: Verifique se o token JWT está presente e válido no header Authorization.

### Nenhum resultado retornado

**Possíveis causas**:
- `leagueId` incorreto
- Filtros muito restritivos
- Liga sem jogos cadastrados

**Solução**: Teste primeiro sem filtros para confirmar que a liga tem jogos.

### Data em formato inválido

```json
{ "error": "Invalid date format" }
```

**Solução**: Use formato ISO 8601 com timezone: `YYYY-MM-DDTHH:mm:ss.sssZ`

---

**Última atualização**: 11 de dezembro de 2025
