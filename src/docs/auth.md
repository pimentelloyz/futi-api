# Autenticação e Sessões

## Visão Geral

Fluxo baseado em Firebase para identidade primária (`idToken`) e JWT interno para acesso às rotas protegidas. Refresh tokens persistidos em banco (hash + TTL + rotação) e enviados também via cookie HttpOnly.

## Endpoints

### POST /api/auth/firebase/exchange

Troca um `idToken` do Firebase por `accessToken` (JWT interno, curto prazo) e `refreshToken` (persistido e colocado em cookie HttpOnly).

Request body:

```json
{ "idToken": "<firebase-id-token>" }
```

Responses principais:

- 200: `{ accessToken, refreshToken }` + cookie `refreshToken`
- 400: `invalid_request`
- 401: `invalid_token`

### POST /api/auth/refresh

Gera novo par de tokens e rotaciona o refresh.

Aceita:

- Body: `{ "refreshToken": "..." }`
- OU cookie HttpOnly `refreshToken`.

Responses:

- 200: `{ accessToken, refreshToken }` + novo cookie
- 400: `invalid_request` (nenhum token válido fornecido)
- 401: `invalid_refresh`

### POST /api/auth/logout

Revoga apenas o refresh token atual (body ou cookie). Limpa cookie.

Responses:

- 200: `{ ok: true }`
- 400: `invalid_request` (token ausente)

### POST /api/auth/logout-all

Revoga todos os refresh tokens do usuário autenticado (usa `Authorization: Bearer <accessToken>`). Limpa cookie.

Responses:

- 200: `{ ok: true }`
- 401: `unauthorized`

## Cookies

Nome: `refreshToken`

- `httpOnly: true`
- `sameSite: strict` (produção) ou `lax` (dev)
- `secure: true` em produção
- `path: /api/auth`
- `maxAge: 30 dias (configurável via REFRESH_TOKEN_TTL_DAYS)`

## Segurança

- Access token contém `sub` = userId e `uid` = firebaseUid.
- Refresh token armazenado hashed (SHA-256) no banco, nunca em texto puro.
- Rotação: sempre que `/refresh` é chamado o antigo é revogado e um novo é emitido.

## Erros Comuns

| Código              | Causa                                     |
| ------------------- | ----------------------------------------- |
| 400 invalid_request | Body inválido ou ausência de refreshToken |
| 401 invalid_token   | idToken inválido na troca inicial         |
| 401 invalid_refresh | Refresh token inexistente ou revogado     |
