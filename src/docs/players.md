# Jogadores

## Modelo

Player possui relação M:N com Team e relação 1:1 opcional com User.
Campos usuais: `id`, `name`, `position?`, `number?`, `isActive?`, `teamIds?`.

## Endpoints

### POST /api/players

Cria um jogador.

Auth: Bearer accessToken.

Body:

```json
{
  "name": "John Doe",
  "position": "GK",
  "number": 1,
  "isActive": true,
  "teamIds": ["team_1", "team_2"]
}
```

Resposta (201): `{ "id": "player_123" }`
Erros: 400, 401.

### GET /api/players/me

Obtém o Player associado ao usuário autenticado.

Auth: Bearer accessToken.

Resposta (200):

```json
{
  "id": "player_123",
  "name": "John Doe",
  "position": "GK",
  "number": 1,
  "isActive": true
}
```

Erros: 401, 404.

### POST /api/players/me

Cria (ou garante) o Player do usuário atual.

Auth: Bearer accessToken.

Body mínimo:

```json
{ "name": "John Doe", "teamIds": ["team_1"] }
```

Resposta (201): `{ "id": "player_123" }`
Erros: 400, 401.
