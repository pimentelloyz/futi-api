# Times

## Modelo

Team básico com `name`, `icon?`, `description?`, `isActive?`.

## Endpoints

### POST /api/teams

Cria um time. Todas as rotas de Times são protegidas por JWT interno.

Auth: Bearer accessToken.

Body:

```json
{
  "name": "Team A",
  "icon": "https://.../logo.png",
  "description": "Time da galera",
  "isActive": true
}
```

Resposta (201): `{ "id": "team_123" }`
Erros: 400, 401, 500.
