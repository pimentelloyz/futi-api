# Partidas

## Modelo

Match contém times envolvidos, horários, status e placar.
Status enum: `SCHEDULED | IN_PROGRESS | FINISHED | CANCELED`.

Campos: `id`, `homeTeamId`, `awayTeamId`, `scheduledAt`, `status`, `homeScore`, `awayScore`.

## Endpoints

### POST /api/matches

Cria uma partida.
Body mínimo:

```json
{
  "homeTeamId": "team_1",
  "awayTeamId": "team_2",
  "scheduledAt": "2025-01-10T12:00:00.000Z"
}
```

Opcionalmente: `status`, `homeScore`, `awayScore`.
Resposta (201): `{ "id": "match_123" }`
Erros: 400, 401.

### GET /api/matches

Lista partidas com filtros e paginação.
Query params suportados:

- `status`
- `teamId`
- `from` / `to` (ISO date)
- `page` (>=1)
- `limit` (1..100)

Resposta (200):

```json
{
  "items": [{ "id": "match_123", "status": "SCHEDULED", "homeScore": 0, "awayScore": 0 }],
  "page": 1,
  "limit": 10,
  "total": 1
}
```

### PATCH /api/matches/{id}/score

Atualiza placar (requer ambos os campos).
Body:

```json
{ "homeScore": 2, "awayScore": 1 }
```

Resposta (200): `{ "id": "match_123" }`

### PATCH /api/matches/{id}/status

Atualiza status (valida transições).
Body:

```json
{ "status": "IN_PROGRESS" }
```

Resposta (200): `{ "id": "match_123", "status": "IN_PROGRESS" }`
