## Banco local (PostgreSQL)

Este projeto agora usa PostgreSQL. Para subir localmente:

```bash
npm run db:up
```

Isso sobe um container `postgres:16` com:

- Porta 5432
- DB principal: `futi`
- DB shadow: `futi_shadow` (criado pelo script de init)

Variáveis esperadas no `.env` (veja `.env.example`):

- `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/futi`
- `SHADOW_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/futi_shadow`

Para derrubar:

```bash
npm run db:down
```

## Prisma migrations

Após atualizar o schema, aplique as migrations:

Local (usando o banco Postgres do Docker):

```bash
npx prisma migrate dev --name <descricao>
```

Produção (GitHub Actions):

- Workflow manual: `.github/workflows/prisma-migrate.yml`.
- Em "Run workflow", garanta que o secret `DATABASE_URL` aponte para o Postgres de produção.
- O Prisma usará `directUrl` (se configurado) para migrar quando o `DATABASE_URL` usar PgBouncer.

Observações:

- Em produção, prefira `prisma migrate deploy` (não `migrate dev`).
- Para Supabase, use:
  - `DATABASE_URL`: conexão via PgBouncer (porta 6543) com `?pgbouncer=true`
  - `DIRECT_URL`: conexão direta (porta 5432) — usada pelo Prisma para migrations
  - No `schema.prisma`, `directUrl = env("DIRECT_URL")` já está configurado.
