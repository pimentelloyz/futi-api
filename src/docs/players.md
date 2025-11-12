# Jogadores

## Modelo

Player possui relação M:N com Team e relação 1:1 opcional com User.
Campos usuais: `id`, `name`, `position?`, `number?`, `isActive?`, `teamIds?`.

## Endpoints

### POST /api/players

Cria um jogador. Suporta JSON e multipart/form-data para envio de foto de perfil.

Auth: Bearer accessToken.

Body (JSON):

```json
{
  "name": "John Doe",
  "position": "GK",
  "number": 1,
  "isActive": true,
  "teamIds": ["team_1", "team_2"]
}
```

Multipart (campo `file` para foto; tipos: png/jpeg/webp; até 2MB):

```bash
curl -X POST http://localhost:3000/api/players \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Accept: application/json" \
  -F "name=John Doe" \
  -F "position=GK" \
  -F "number=1" \
  -F "teamIds=team_1,team_2" \
  -F "file=@/caminho/para/foto.jpg"
```

Resposta (201): `{ "id": "player_123" }`
Erros: 400, 401, 415 (tipo de arquivo não suportado).

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

Cria (ou garante) o Player do usuário atual. Suporta JSON e multipart/form-data (campo `file`).

Auth: Bearer accessToken.

Body mínimo (JSON):

```json
{ "name": "John Doe", "teamIds": ["team_1"] }
```

Multipart:

```bash
curl -X POST http://localhost:3000/api/players/me \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Accept: application/json" \
  -F "name=John Doe" \
  -F "teamIds=team_1" \
  -F "file=@/caminho/para/foto.jpg"
```

Resposta (201): `{ "id": "player_123" }`
Erros: 400, 401, 415.

### POST /api/players/{id}/photo

Faz upload de uma nova foto de perfil para o jogador existente.

Auth: Bearer accessToken.

Multipart:

```bash
curl -X POST http://localhost:3000/api/players/player_123/photo \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Accept: application/json" \
  -F "file=@/caminho/para/foto.jpg"
```

Resposta (200): `{ "photoUrl": "https://storage.googleapis.com/<bucket>/players/player_123/photo_<ts>.jpg" }`
Erros: 400, 401, 415, 500.
