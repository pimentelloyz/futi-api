# Testes

## Estratégia

- Unitários: validam serviços e use cases críticos (ex.: hashing de refresh token, rotação de tokens).
- E2E: exercitam fluxo completo de autenticação e rotas principais via `supertest`.
- Mocks isolam Firebase e Prisma para acelerar execução e evitar dependência externa.

## Arquivos Principais

- `src/infra/security/refresh-token-service.test.ts`: teste unitário de hashing.
- `src/tests/auth.e2e.test.ts`: cenários básicos de autenticação e erros.
- `src/tests/auth.full.e2e.test.ts`: fluxo completo exchange → refresh → logout → logout-all.
- `src/tests/setup.ts`: mocks globais (Firebase, env, repositórios, prisma client).
- `vitest.config.ts`: configuração incluindo setup file.

## Convenções

- Sempre cobrir regras de negócio novas com testes unitários.
- E2E para fluxos agregados importantes.
- Uso de `safeParse` (Zod) e validações deve ter pelo menos um teste de falha.

## Mocks

- Firebase: `verifyIdToken` retorna UID determinístico.
- Repositórios: implementações em memória para persistência simples.
- Env: valores substituídos para evitar falhas de validação durante testes.

## Comandos (opcional)

```
npm test
```
