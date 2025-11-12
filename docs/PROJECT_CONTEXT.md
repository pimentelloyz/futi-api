# Contexto do Projeto (futi-api)

Este arquivo serve como memória persistente do projeto para retomada rápida do contexto.

## Plataforma de Deploy

- Alvo: Google Cloud Run (Docker + Node 20)
- Registro de Imagens: Artifact Registry
- Banco de Dados: PostgreSQL (Supabase/Cloud SQL)
- Firebase Admin: usado para Auth/Storage

## Artefatos de Deploy

- Dockerfile (multi-stage)
- .dockerignore
- cloudrun.service.yaml (manifesto base)
- README_DEPLOY_CLOUD_RUN.md (guia passo a passo)

## CI/CD

- Deploy automático (push na main) via `.github/workflows/cloud-run-deploy.yml`
  - Build Docker, push para Artifact Registry, `gcloud run deploy`
- Migração de banco manual via `.github/workflows/prisma-migrate.yml`
  - `prisma migrate status` (opcional) e `prisma migrate deploy`

## Secrets necessários (GitHub Actions)

- `GCP_PROJECT_ID`
- `GCP_REGION` (ex.: `us-central1`)
- `GAR_REPOSITORY` (ex.: `futi-docker`)
- `CLOUD_RUN_SERVICE` (ex.: `futi-api`)
- `GCP_SA_KEY` (JSON da Service Account com Artifact Registry Writer, Cloud Run Admin, Service Account User)
- `DATABASE_URL` (PostgreSQL de produção, ex.: Supabase pool)
- `DIRECT_URL` (PostgreSQL conexão direta p/ migrations)
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY` (com `\n` escapados)

## Variáveis de Ambiente (runtime)

- `DATABASE_URL`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `NODE_ENV=production`
- `PORT=3000` (injetada pelo Cloud Run)

## Endpoints úteis para smoke test

- `GET /health`
- `GET /api-docs`

## Padrões de Erros e Constantes

- `src/domain/constants.ts` centraliza ERROR_CODES, MATCH_STATUS, EVENT_TYPES, PUSH_PLATFORM
- Controllers/rotas usam ERROR_CODES padronizados

## Itens abertos (alto nível)

- Endpoint de summary de avaliações `GET /api/players/:id/evaluations/summary`
- Testes de upload de ícone (tipo/size/persistência)
- Evolução de SOLID/DI em outros controllers
