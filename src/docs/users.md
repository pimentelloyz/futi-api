# Usuário

## Modelo

Representa o usuário autenticado originado do Firebase.
Campos principais:

- `id`: interno
- `firebaseUid`
- `email` (opcional)
- `displayName` (opcional)
- `playerId` (opcional, relação 1:1 com Player)

## Endpoint

### GET /api/users/me

Retorna dados do usuário autenticado.

Headers:

```
Authorization: Bearer <accessToken>
```

Resposta (200):

```json
{
  "id": "user_123",
  "firebaseUid": "firebase-uid",
  "email": "user@example.com",
  "displayName": "User Name",
  "playerId": "player_456" // ou null
}
```

Erros:

- 401 Unauthorized (token ausente ou inválido)
- 404 User not found (situação incomum se consistência está mantida)
