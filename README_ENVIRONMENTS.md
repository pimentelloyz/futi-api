## Prisma migrations

Após atualizar o schema (ex.: coluna `photo` no modelo `Player`), aplique as migrations:

Local (MySQL apontado por `DATABASE_URL`):

```bash
npx prisma migrate deploy
```

Produção (Cloud Run via GitHub Actions):

- Existe um workflow manual `.github/workflows/prisma-migrate.yml`.
- No GitHub, acione "Run workflow" e forneça o ambiente/branch conforme necessário.
- O workflow usa o secret `DATABASE_URL` para aplicar `prisma migrate deploy`.

Observações:

- Certifique-se de que `DATABASE_URL` e `SHADOW_DATABASE_URL` estejam corretos.
- Para gerar SQL localmente (opcional): `npx prisma migrate dev --name <nome>` (não usar em produção diretamente).
