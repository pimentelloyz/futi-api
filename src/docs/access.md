# Controle de Acesso

## Papéis

- ADMIN: acesso global; pode conceder e revogar papéis.
- MANAGER: gerencia um time (inclui remover jogadores).
- ASSISTANT: auxilia o manager; não remove jogadores.
- PLAYER: jogador vinculado a um time.

## Modelo

`AccessMembership` liga `User` a um `Team` (exceto ADMIN global) com um `role`.

Campos:

- `userId`
- `teamId?` (nulo para ADMIN global)
- `role` (enum)
- `createdAt`

## Endpoints

Todos protegidos com JWT interno.

### POST /api/access/grant

Concede papel.
Body:

```json
{ "userId": "user_123", "role": "MANAGER", "teamId": "team_1" }
```

Regras:

- ADMIN não pode ter `teamId`.
- MANAGER/ASSISTANT/PLAYER exigem `teamId`.
- Apenas ADMIN autenticado pode conceder.

Resposta (200): `{ membership: { id, userId, teamId, role } }`

### POST /api/access/revoke

Revoga papel.
Body:

```json
{ "userId": "user_123", "role": "ASSISTANT", "teamId": "team_1" }
```

Mesmas regras de validação do grant.
Resposta (200): `{ ok: true }`

### GET /api/access/me

Lista memberships do usuário autenticado.
Resposta (200):

```json
{ "memberships": [{ "id": "acc_1", "userId": "user_123", "teamId": "team_1", "role": "MANAGER" }] }
```

## Regras de Permissão (Resumo)

| Ação            | ADMIN | MANAGER | ASSISTANT | PLAYER |
| --------------- | :---: | :-----: | :-------: | :----: |
| Conceder/Revoke |  ✔   |   ✖    |    ✖     |   ✖   |
| Gerir time      |  ✔   |   ✔    |    ✖     |   ✖   |
| Assistir gestão |  ✔   |   ✔    |    ✔     |   ✖   |
| Remover jogador |  ✔   |   ✔    |    ✖     |   ✖   |
| Ver time        |  ✔   |   ✔    |    ✔     |   ✔   |

## Erros Comuns

| Código              | Causa                                 |
| ------------------- | ------------------------------------- |
| 401 unauthorized    | JWT ausente/ inválido                 |
| 403 forbidden       | Usuário não é ADMIN para grant/revoke |
| 400 invalid_request | Body inválido (Zod)                   |
| 400 admin_is_global | ADMIN não pode ter teamId             |
| 400 team_required   | Papel específico de time sem teamId   |
