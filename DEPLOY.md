# 🚀 Guia de Deploy - Google Cloud Run + Supabase + Hostinger

## 📋 Pré-requisitos

- ✅ Projeto configurado no Google Cloud Platform
- ✅ Domínio registrado na Hostinger
- ✅ Banco de dados Supabase configurado
- ✅ Conta Firebase para autenticação
- ✅ Google Cloud CLI instalado (`gcloud`)
- ✅ Docker instalado localmente

---

## 🔧 1. Configuração do Google Cloud

### 1.1. Instalar Google Cloud CLI (se ainda não tiver)

```bash
# macOS
brew install --cask google-cloud-sdk

# Ou baixe de: https://cloud.google.com/sdk/docs/install
```

### 1.2. Fazer login e configurar projeto

```bash
# Login no Google Cloud
gcloud auth login

# Configurar projeto (substitua PROJECT_ID pelo seu)
gcloud config set project PROJECT_ID

# Listar projetos disponíveis
gcloud projects list

# Habilitar serviços necessários
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable artifactregistry.googleapis.com
```

---

## 🔐 2. Configurar Secrets no Google Cloud

É **CRÍTICO** não expor variáveis sensíveis. Vamos usar o Secret Manager:

### 2.1. Criar secrets para variáveis sensíveis

```bash
# DATABASE_URL do Supabase (connection pooling)
echo -n "postgresql://postgres.skmzcuaucldsxedlialy:4RxtOW3WYIK555Nr@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true" | \
  gcloud secrets create DATABASE_URL --data-file=-

# DIRECT_URL do Supabase (para migrations)
echo -n "postgresql://postgres.skmzcuaucldsxedlialy:4RxtOW3WYIK555Nr@aws-0-us-west-2.pooler.supabase.com:5432/postgres" | \
  gcloud secrets create DIRECT_URL --data-file=-

# JWT_SECRET
echo -n "dev-secret-change-me" | \
  gcloud secrets create JWT_SECRET --data-file=-

# Firebase Project ID
echo -n "futi-dev-18acd" | \
  gcloud secrets create FIREBASE_PROJECT_ID --data-file=-

# Firebase Client Email
echo -n "firebase-adminsdk-fbsvc@futi-dev-18acd.iam.gserviceaccount.com" | \
  gcloud secrets create FIREBASE_CLIENT_EMAIL --data-file=-

# Firebase Storage Bucket
echo -n "futi-dev-18acd.firebasestorage.app" | \
  gcloud secrets create FIREBASE_STORAGE_BUCKET --data-file=-

# Firebase Private Key (importante: preservar \n)
cat <<'EOF' | gcloud secrets create FIREBASE_PRIVATE_KEY --data-file=-
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC1Y5Ii01QTWTUc
HJx2vsik23jRkYtHPPUK6KpOuUomPCZS8HvPzLcjkzdfBmee4gJ7Jyjo5JmZkyMV
FXL8wG2QGijBmXlJ0AvjG9crJk3tsJczUGML4DpYjoQUeJwrPW776A20twMcCtGC
afvjcPScjKm87ZP6TSdUk5t3t1IObLO4CG+rFtCvLzecjH8ZmK/3hdb/hwKFmVD7
YJ20WPGWwOKZjjQ8yFB7BDrha7fZOOOh9PVSPZv8lD636PdDaJ7TSUCVNhdk4OtF
sCyLG9holrSiwoJnvjGI3qW8AP1br92kyX9E4bpRCqUaqBRCzrKkEvP7WqYmq20X
Xf+MqMrtAgMBAAECggEADRQHDRpCGVwI+4Qnlts2IcbOPQP6sBH51AXHA8KR0VRs
afX7Y1XuDXNXnnMahQbkKWd/KF2VIpDMioBfqFAihi2QqzbK2zLULJWNC8go/b6K
BFHjNk++PTTXWpeAoRB+oEyQsmswnvS7uuSz2+gAxwnQUjYqAXXPJGa5IqZV1QLL
iNrBTHQoE81PHOTOHqcrbFSFyiHSwu41EsfTaTwZAZyFscRy6Tr7K1dyNjgzjq7G
o4kiC88V6USqQYc6ad8wIHpPhwZELRTd/JT7HTgVgqR0qXz+qllX7pONQrj4cReM
ntBwYk4Y3cjW5yaQcFeLYdDo/nR0EaZmRo5XUm/FGQKBgQD3w5QLJ6Ly3F98E4LN
7cufL0yiIUK5WwtC7m5lOYBRMwdP0ZBXpQv0cH7wFdgzQAiMloVtKsmGVfc/WuSA
LE0yORLn8dw+YU9OGHQVHgmLrTJh514TotmhsHx0TH801C74hbxpS7gSY1tTy7Oj
Kb0xEAPkRORmfVzMbREMSWWk9QKBgQC7ayeFSvZBYEKiExzJ6zFbTXmMfb6HSyTi
Lm7bqGUil7u5T/7M1L61R799K77DaM3iCFG+XINBeXPcv08Y4nEJnKrMqsjOEJwN
iuiYFe44DRsx3PXEjaiq4kkJZb4ZvL8XnyZEdR7rbQfD1tUmUz3rT/g1frdzDmO/
Q52BKheTGQKBgQCLjOQouEWGhutdJlwpgwOKgIioVRWQ8x/Prh4N86o7kgNPSNkF
FJg8MNS+g39HtoxaKzmxuETT3j2puJc1Pj6oyA7HB6omlIanlQxlDIsR2hajoD6T
zsjH0nD2zFNlvRFLt3/cyuI9sSqycuyWPR8rsDqQ6uC+fWO0XMYaZojStQKBgEBK
LJ9jrH+WlqTkK370R9ULCYPw6nechkV0KiD9bdvk8sdJspzu6ZBj0UMNy31aqS09
L1U+hOPj1qPFmEtv+diTPl/Awes19WIL4WeyNipSDJ8ZLdFDyrT7tJQdq41GmsJu
nIDlMDsQBpbeTfW8nkPnBbzL///e0sacWh4hoz6ZAoGAMOQ+vc7UnraHb40vTsVd
Z1WUm5rZO8Al0o1pgW/uA/stzBfxIQ0Nv5JKOIpMlAz8R6LynrIFp6c6wB5WfTSH
rXhvUlvTqZuM61i51JzP8/7xJDYnDHgEAmFbafnhnKC/cFxbf7sFC63a+6jwqCrm
rXmNawOk0FF+w6wISBqYwKk=
-----END PRIVATE KEY-----
EOF

# Verificar secrets criados
gcloud secrets list
```

### 2.2. Dar permissão para Cloud Run acessar secrets

```bash
# Obter o service account do Cloud Run
PROJECT_ID=$(gcloud config get-value project)
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

# Dar permissão para cada secret
for SECRET in DATABASE_URL DIRECT_URL JWT_SECRET FIREBASE_PROJECT_ID FIREBASE_CLIENT_EMAIL FIREBASE_PRIVATE_KEY FIREBASE_STORAGE_BUCKET; do
  gcloud secrets add-iam-policy-binding $SECRET \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/secretmanager.secretAccessor"
done
```

---

## 🐳 3. Build e Push da Imagem Docker

### 3.1. Criar repositório no Artifact Registry

```bash
# Criar repositório (escolha uma região próxima, ex: us-central1, southamerica-east1)
REGION="us-central1"
gcloud artifacts repositories create futi-api \
  --repository-format=docker \
  --location=$REGION \
  --description="Futi API Docker images"

# Configurar Docker para autenticar
gcloud auth configure-docker ${REGION}-docker.pkg.dev
```

### 3.2. Build e Push da imagem

```bash
# Definir variáveis
PROJECT_ID=$(gcloud config get-value project)
REGION="us-central1"
IMAGE_NAME="futi-api"
IMAGE_TAG="latest"
IMAGE_URL="${REGION}-docker.pkg.dev/${PROJECT_ID}/futi-api/${IMAGE_NAME}:${IMAGE_TAG}"

# Build da imagem localmente (testa se Dockerfile está OK)
docker build -t $IMAGE_URL .

# Push para Artifact Registry
docker push $IMAGE_URL
```

**Ou use Cloud Build (recomendado para CI/CD):**

```bash
gcloud builds submit --tag $IMAGE_URL
```

---

## 🚀 4. Deploy no Cloud Run

### 4.1. Deploy inicial

```bash
PROJECT_ID=$(gcloud config get-value project)
REGION="us-central1"
IMAGE_URL="${REGION}-docker.pkg.dev/${PROJECT_ID}/futi-api/futi-api:latest"

gcloud run deploy futi-api \
  --image=$IMAGE_URL \
  --platform=managed \
  --region=$REGION \
  --allow-unauthenticated \
  --port=3000 \
  --memory=1Gi \
  --cpu=1 \
  --timeout=300 \
  --max-instances=10 \
  --min-instances=0 \
  --set-env-vars="NODE_ENV=production,PORT=3000,REFRESH_TOKEN_TTL_DAYS=30" \
  --set-secrets="DATABASE_URL=DATABASE_URL:latest,DIRECT_URL=DIRECT_URL:latest,JWT_SECRET=JWT_SECRET:latest,FIREBASE_PROJECT_ID=FIREBASE_PROJECT_ID:latest,FIREBASE_CLIENT_EMAIL=FIREBASE_CLIENT_EMAIL:latest,FIREBASE_PRIVATE_KEY=FIREBASE_PRIVATE_KEY:latest,FIREBASE_STORAGE_BUCKET=FIREBASE_STORAGE_BUCKET:latest"
```

### 4.2. Verificar deploy

```bash
# Obter URL do serviço
gcloud run services describe futi-api --region=$REGION --format="value(status.url)"

# Testar endpoint
curl $(gcloud run services describe futi-api --region=$REGION --format="value(status.url)")/health
```

---

## 🌐 5. Configurar Domínio Customizado

### 5.1. No Google Cloud - Mapear domínio

```bash
# Adicionar domínio customizado ao Cloud Run
gcloud run domain-mappings create \
  --service=futi-api \
  --domain=api.seudominio.com \
  --region=$REGION
```

O comando acima vai retornar algo como:

```
Please add the following DNS records to your domain:
  api.seudominio.com -> CNAME -> ghs.googlehosted.com
```

### 5.2. Na Hostinger - Configurar DNS

1. **Acesse o painel da Hostinger**: https://hpanel.hostinger.com
2. **Vá em "Domínios" → Seu domínio → "DNS/Nameservers"**
3. **Adicione um registro CNAME**:
   - **Tipo**: CNAME
   - **Nome**: `api` (para api.seudominio.com)
   - **Aponta para**: `ghs.googlehosted.com`
   - **TTL**: 14400 (ou padrão)

4. **Se quiser usar o domínio raiz (seudominio.com) em vez de subdomínio**:
   - Não é possível usar CNAME no domínio raiz
   - Opções:
     - **Opção A**: Use um subdomínio (api.seudominio.com) - **RECOMENDADO**
     - **Opção B**: Use Cloud Load Balancer com IP estático (mais complexo e caro)

### 5.3. Aguardar propagação DNS

```bash
# Verificar DNS (pode levar de 5 minutos a 48 horas)
nslookup api.seudominio.com

# Ou use
dig api.seudominio.com

# Quando estiver propagado, teste:
curl https://api.seudominio.com/health
```

---

## 🔄 6. CI/CD Automático (Opcional mas Recomendado)

### 6.1. Criar arquivo de CI/CD

Crie `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloud Run

on:
  push:
    branches:
      - main

env:
  PROJECT_ID: ${{ secrets.GCP_PROJECT_ID }}
  REGION: us-central1
  SERVICE_NAME: futi-api

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    permissions:
      contents: read
      id-token: write
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
      
      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2
      
      - name: Configure Docker
        run: gcloud auth configure-docker ${{ env.REGION }}-docker.pkg.dev
      
      - name: Build and Push Docker image
        run: |
          IMAGE_URL="${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/futi-api/${{ env.SERVICE_NAME }}:${{ github.sha }}"
          docker build -t $IMAGE_URL .
          docker push $IMAGE_URL
          echo "IMAGE_URL=$IMAGE_URL" >> $GITHUB_ENV
      
      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy ${{ env.SERVICE_NAME }} \
            --image=${{ env.IMAGE_URL }} \
            --platform=managed \
            --region=${{ env.REGION }} \
            --allow-unauthenticated \
            --port=3000 \
            --memory=1Gi \
            --cpu=1 \
            --timeout=300 \
            --max-instances=10 \
            --min-instances=0 \
            --set-env-vars="NODE_ENV=production,PORT=3000" \
            --set-secrets="DATABASE_URL=DATABASE_URL:latest,DIRECT_URL=DIRECT_URL:latest,JWT_SECRET=JWT_SECRET:latest,FIREBASE_PROJECT_ID=FIREBASE_PROJECT_ID:latest,FIREBASE_CLIENT_EMAIL=FIREBASE_CLIENT_EMAIL:latest,FIREBASE_PRIVATE_KEY=FIREBASE_PRIVATE_KEY:latest,FIREBASE_STORAGE_BUCKET=FIREBASE_STORAGE_BUCKET:latest"
```

### 6.2. Configurar secrets no GitHub

1. Vá em **Settings → Secrets and variables → Actions**
2. Adicione:
   - `GCP_PROJECT_ID`: Seu ID do projeto
   - `GCP_SA_KEY`: JSON da service account (crie uma com permissões de Cloud Run Admin e Storage Admin)

Para criar a service account:

```bash
# Criar service account
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions Deploy"

# Dar permissões
PROJECT_ID=$(gcloud config get-value project)
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# Criar chave JSON
gcloud iam service-accounts keys create key.json \
  --iam-account=github-actions@${PROJECT_ID}.iam.gserviceaccount.com

# Copie o conteúdo de key.json para o secret GCP_SA_KEY no GitHub
cat key.json
```

---

## 🗄️ 7. Migrations do Prisma em Produção

**IMPORTANTE**: Cloud Run é stateless, então não rode migrations no container.

### Opção A: Rodar migrations localmente antes do deploy

```bash
# Configure as variáveis de ambiente
export DATABASE_URL="postgresql://..."
export DIRECT_URL="postgresql://..."

# Rode as migrations
npx prisma migrate deploy
```

### Opção B: Criar um Cloud Build trigger para migrations

Crie `cloudbuild-migration.yaml`:

```yaml
steps:
  - name: 'node:20-alpine'
    entrypoint: 'sh'
    args:
      - '-c'
      - |
        npm ci
        npx prisma migrate deploy
    secretEnv: ['DATABASE_URL', 'DIRECT_URL']

availableSecrets:
  secretManager:
    - versionName: projects/$PROJECT_ID/secrets/DATABASE_URL/versions/latest
      env: 'DATABASE_URL'
    - versionName: projects/$PROJECT_ID/secrets/DIRECT_URL/versions/latest
      env: 'DIRECT_URL'
```

Execute manualmente quando necessário:

```bash
gcloud builds submit --config=cloudbuild-migration.yaml
```

---

## 📊 8. Monitoramento e Logs

### 8.1. Ver logs

```bash
# Logs em tempo real
gcloud run services logs tail futi-api --region=$REGION

# Logs no Console
# https://console.cloud.google.com/logs
```

### 8.2. Monitorar performance

```bash
# Ver métricas
gcloud run services describe futi-api --region=$REGION

# Console de monitoramento
# https://console.cloud.google.com/run
```

### 8.3. Configurar alertas (opcional)

Configure alertas para:
- CPU usage > 80%
- Memory usage > 80%
- Request latency > 1s
- Error rate > 5%

---

## 💰 9. Otimização de Custos

### 9.1. Configurar escalonamento

```bash
# Reduzir custos: min-instances=0 (cold start pode ser lento)
# Melhor performance: min-instances=1 (sem cold start, mas custa mais)

gcloud run services update futi-api \
  --region=$REGION \
  --min-instances=0 \
  --max-instances=5
```

### 9.2. Configurar CPU allocation

```bash
# CPU sempre alocada (melhor para alta carga)
gcloud run services update futi-api \
  --region=$REGION \
  --cpu-boost

# CPU alocada apenas durante requests (economiza $$$)
gcloud run services update futi-api \
  --region=$REGION \
  --no-cpu-throttling
```

---

## 🔒 10. Segurança

### 10.1. CORS (já configurado no código, mas verifique)

Adicione em `src/main/server.ts`:

```typescript
app.use(cors({
  origin: [
    'https://seuapp.com',
    'https://www.seuapp.com',
    /\.seudominio\.com$/  // Aceita subdomínios
  ],
  credentials: true
}));
```

### 10.2. Rate limiting (recomendado)

Instale:

```bash
npm install express-rate-limit
```

Configure em `src/main/server.ts`:

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por IP
  message: 'Too many requests from this IP'
});

app.use('/api/', limiter);
```

### 10.3. Helmet (segurança HTTP headers)

```bash
npm install helmet
```

```typescript
import helmet from 'helmet';
app.use(helmet());
```

---

## 🧪 11. Testando o Deploy

### 11.1. Endpoints para testar

```bash
# Health check
curl https://api.seudominio.com/health

# Listar ligas (requer autenticação)
curl -H "Authorization: Bearer SEU_JWT_TOKEN" \
  https://api.seudominio.com/api/leagues/me?page=1&pageSize=20

# Verificar CORS
curl -H "Origin: https://seuapp.com" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Authorization" \
  -X OPTIONS \
  https://api.seudominio.com/api/leagues/me -v
```

### 11.2. Verificar secrets

```bash
# SSH no container (debug apenas)
gcloud run services proxy futi-api --region=$REGION
```

---

## 🚨 12. Troubleshooting

### Problema: Container não inicia

```bash
# Ver logs detalhados
gcloud run services logs read futi-api --region=$REGION --limit=50

# Causas comuns:
# 1. Porta errada (deve ser $PORT ou 3000)
# 2. Secrets não carregados
# 3. Prisma não gerado
```

### Problema: Cold start muito lento

```bash
# Solução: manter 1 instância sempre ativa (custa mais)
gcloud run services update futi-api \
  --region=$REGION \
  --min-instances=1
```

### Problema: Timeout nas migrations

- **NÃO rode migrations no container**
- Use Cloud Build ou rode localmente

### Problema: DNS não propaga

```bash
# Verificar configuração
dig api.seudominio.com

# Se CNAME não aparecer, verifique:
# 1. Se digitou corretamente na Hostinger
# 2. Se TTL passou (pode demorar até 48h)
# 3. Tente outro registro DNS público: 8.8.8.8
```

---

## 📝 13. Comandos Úteis

```bash
# Listar serviços
gcloud run services list

# Descrever serviço
gcloud run services describe futi-api --region=$REGION

# Atualizar variáveis de ambiente
gcloud run services update futi-api \
  --region=$REGION \
  --set-env-vars="NEW_VAR=value"

# Rollback para versão anterior
gcloud run services update-traffic futi-api \
  --region=$REGION \
  --to-revisions=PREVIOUS_REVISION=100

# Deletar serviço
gcloud run services delete futi-api --region=$REGION
```

---

## 📚 14. Recursos Adicionais

- **Cloud Run Docs**: https://cloud.google.com/run/docs
- **Supabase Docs**: https://supabase.com/docs
- **Prisma Deploy**: https://www.prisma.io/docs/guides/deployment
- **Hostinger DNS**: https://support.hostinger.com/en/articles/1583227-how-to-manage-dns-records

---

## ✅ Checklist Final

- [ ] Secrets criados no Secret Manager
- [ ] Imagem Docker buildada e pushed
- [ ] Deploy no Cloud Run funcionando
- [ ] DNS configurado na Hostinger (CNAME)
- [ ] Domínio customizado mapeado
- [ ] Migrations executadas
- [ ] CORS configurado corretamente
- [ ] Rate limiting ativo
- [ ] Logs e monitoramento configurados
- [ ] CI/CD pipeline ativo (opcional)
- [ ] Health check funcionando
- [ ] Endpoints testados com JWT

---

## 🎯 Resumo do Fluxo

1. **Google Cloud**: Criar secrets → Build imagem → Deploy Cloud Run
2. **Hostinger**: Adicionar CNAME apontando para `ghs.googlehosted.com`
3. **Google Cloud**: Mapear domínio customizado
4. **Aguardar DNS propagar** (5min - 48h)
5. **Testar**: `curl https://api.seudominio.com/health`
6. **Pronto!** 🎉

---

Se precisar de ajuda em algum passo específico, me avise! 🚀
