# Deploy no Google Cloud Run

Este guia descreve como publicar a futi-api no Google Cloud Run usando Docker.

## Pré-requisitos

- Projeto no Google Cloud com faturamento habilitado
- gcloud CLI autenticado: `gcloud auth login`
- APIs ativas: Cloud Run, Cloud Build, Artifact Registry (ou Container Registry)
- Banco MySQL acessível (Cloud SQL, PlanetScale, etc.)
- Service Account do Firebase Admin com credenciais (PROJECT_ID, CLIENT_EMAIL, PRIVATE_KEY)

## Variáveis de ambiente

- `DATABASE_URL`: mysql://user:pass@host:port/dbname
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY` (com quebras `\n` escapadas)
- `NODE_ENV=production`

## 1) Build e push da imagem

Substitua `PROJECT_ID` e `REGION` pelos seus.

```bash
# Configure o Artifact Registry (recomendado)
gcloud artifacts repositories create futi-docker --repository-format=docker --location=REGION --description="Docker repo"

# Configure o auth do Docker
gcloud auth configure-docker REGION-docker.pkg.dev

# Build da imagem
docker build -t REGION-docker.pkg.dev/PROJECT_ID/futi-docker/futi-api:latest .

# Push
docker push REGION-docker.pkg.dev/PROJECT_ID/futi-docker/futi-api:latest
```

Alternativa usando Cloud Build (sem Docker local):

```bash
gcloud builds submit --tag REGION-docker.pkg.dev/PROJECT_ID/futi-docker/futi-api:latest .
```

## 2) Deploy no Cloud Run

Usando gcloud:

```bash
gcloud run deploy futi-api \
  --image=REGION-docker.pkg.dev/PROJECT_ID/futi-docker/futi-api:latest \
  --region=REGION \
  --platform=managed \
  --allow-unauthenticated \
  --port=3000 \
  --set-env-vars=NODE_ENV=production,PORT=3000 \
  --set-env-vars=FIREBASE_PROJECT_ID=xxx,FIREBASE_CLIENT_EMAIL=xxx@xxx.iam.gserviceaccount.com \
  --set-env-vars=FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n" \
  --set-env-vars=DATABASE_URL="mysql://user:pass@host:3306/dbname"
```

Ou via manifesto `cloudrun.service.yaml` (ajuste a imagem e envs):

```bash
gcloud run services replace cloudrun.service.yaml --region=REGION
```

## 3) Migrações do Prisma (produção)

A imagem não executa migrações automaticamente. Rode-as separadamente:

- Opção A: Rode localmente apontando pro mesmo DB:

```bash
DATABASE_URL="mysql://user:pass@host:3306/dbname" npx prisma migrate deploy
```

- Opção B: Crie um Cloud Run Job temporário com uma imagem que inclua o CLI do Prisma e execute `prisma migrate deploy`.

> Dica: você pode manter `prisma` em devDependencies e usar uma imagem auxiliar (ex.: node:20-alpine) apenas para migrações.

## 4) CI/CD com GitHub Actions

Este repo inclui dois workflows:

- Deploy para Cloud Run: `.github/workflows/cloud-run-deploy.yml`
  - Dispara em push para `main` e manual (workflow_dispatch)
  - Faz build da imagem Docker (Dockerfile), push para Artifact Registry e `gcloud run deploy`
- Prisma Migrate (manual): `.github/workflows/prisma-migrate.yml`
  - Dispara manualmente; roda `prisma migrate status` (opcional) e `prisma migrate deploy`

Secrets necessários (Settings > Secrets and variables > Actions):

- `GCP_PROJECT_ID`: ID do projeto GCP
- `GCP_REGION`: região (ex.: `us-central1`)
- `GAR_REPOSITORY`: nome do repositório do Artifact Registry (ex.: `futi-docker`)
- `CLOUD_RUN_SERVICE`: nome do serviço (ex.: `futi-api`)
- `GCP_SA_KEY`: JSON da Service Account com permissões de Artifact Registry Writer, Cloud Run Admin e Service Account User
- `DATABASE_URL`: conexão MySQL de produção
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`: atenção às quebras de linha (usar `\n`)

Observações:

- O deploy define `NODE_ENV=production` e `PORT=3000` automaticamente.
- Migrações não são executadas no deploy; utilize o workflow de migrate ou rode localmente.

## 4) Verificação rápida

- Abra a URL do serviço (saída do deploy)
- Check de saúde: `GET /health`
- Swagger: `GET /api-docs`

## 5) Logs e diagnósticos

- `gcloud logs read --project=PROJECT_ID --region=REGION logs run.googleapis.com%2Fstdout`
- Use o Cloud Logging no Console para filtros por serviço (futi-api)

## 6) Notas

- Se usar Cloud SQL (MySQL), considere o conector do Cloud SQL para Cloud Run ou mantenha IP público com allowlist/SSL.
- Para Firebase Storage, as credenciais de service account configuradas devem bastar.
- PRIVATE_KEY: garanta que as quebras de linha estejam escapadas como `\\n`.
