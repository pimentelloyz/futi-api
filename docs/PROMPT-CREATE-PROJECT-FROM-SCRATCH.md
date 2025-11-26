# PROMPT: Criar Projeto Node.js/TypeScript API com Clean Architecture

## 🎯 Objetivo

Criar do zero um projeto Node.js + TypeScript seguindo Clean Architecture, com todas as configurações de desenvolvimento, CI/CD, testes, linting e deploy configurados e funcionais.

---

## 📋 Especificações do Projeto

### Informações Básicas
- **Nome do projeto:** `{SEU_PROJETO}-api`
- **Descrição:** API Node.js + TypeScript com Express + Prisma + PostgreSQL/Supabase + Firebase Admin
- **Versão inicial:** 0.1.0
- **Licença:** MIT
- **Node.js:** v20+ (LTS)
- **Package Manager:** npm (com package-lock.json)

---

## 🏗️ Arquitetura e Estrutura

### Clean Architecture - Estrutura de Pastas

```
{SEU_PROJETO}-api/
├── .github/
│   └── workflows/
│       ├── cloud-run-deploy.yml          # CI/CD deploy Cloud Run
│       └── prisma-migrate.yml            # Migrations manuais
├── .husky/                               # Git hooks (Husky)
│   └── pre-commit                        # Lint-staged
├── docker/
│   └── local/
│       └── postgres/
│           └── init.sql                  # Script inicial Postgres local
├── docs/                                 # Documentação do projeto
├── prisma/
│   ├── schema.prisma                     # Schema Prisma
│   ├── migrations/                       # Migrations versionadas
│   └── seeds/                            # Scripts de seed
├── scripts/                              # Scripts utilitários
├── src/
│   ├── application/                      # Casos de uso da aplicação
│   ├── data/
│   │   └── protocols/                    # Interfaces de repositórios
│   ├── domain/
│   │   ├── constants.ts                  # Constantes (ERROR_CODES, etc)
│   │   ├── repositories/                 # Interfaces de domínio
│   │   └── usecases/                     # Use cases organizados por feature
│   │       └── {feature}/
│   │           ├── {feature}.dto.ts
│   │           ├── {feature}.usecase.ts
│   │           └── {feature}.usecase.test.ts
│   ├── infra/
│   │   ├── prisma/
│   │   │   ├── client.ts                 # Singleton Prisma Client
│   │   │   └── selects.ts                # Selects reutilizáveis
│   │   └── repositories/                 # Implementações Prisma
│   ├── main/
│   │   ├── docs/                         # OpenAPI/Swagger docs
│   │   ├── factories/                    # Dependency Injection factories
│   │   ├── app.ts                        # Express app setup
│   │   ├── server.ts                     # Entry point
│   │   └── setup-routes.ts               # Configuração de rotas
│   ├── presentation/
│   │   ├── controllers/                  # Controllers HTTP
│   │   ├── middlewares/                  # Middlewares Express
│   │   │   ├── jwt-auth.ts
│   │   │   ├── request-context.ts
│   │   │   └── audit-request.middleware.ts
│   │   ├── protocols/                    # Interfaces HTTP
│   │   └── routes/                       # Routers Express
│   ├── tests/                            # Testes E2E (Jest)
│   │   ├── setup.ts                      # Setup Vitest
│   │   ├── jest-setup.ts                 # Setup Jest
│   │   └── *.e2e.test.ts                 # Testes E2E
│   └── types/                            # TypeScript types globais
├── .dockerignore
├── .env.example                          # Exemplo de variáveis
├── .eslintrc.cjs                         # ESLint legacy config
├── .gitignore
├── .prettierrc.json
├── Dockerfile                            # Multi-stage build
├── README.md
├── docker-compose.yml                    # Postgres local
├── eslint.config.mjs                     # ESLint flat config (v9+)
├── jest.config.js                        # Jest config (E2E)
├── package.json
├── tsconfig.build.json                   # TypeScript build config
├── tsconfig.json                         # TypeScript dev config
└── vitest.config.ts                      # Vitest config (unit tests)
```

---

## 📦 Dependências

### package.json - Dependencies

```json
"dependencies": {
  "@prisma/client": "^6.19.0",
  "@types/jsonwebtoken": "^9.0.10",
  "@types/multer": "^2.0.0",
  "cookie-parser": "^1.4.7",
  "dotenv": "^17.2.3",
  "express": "^5.1.0",
  "firebase-admin": "^13.6.0",
  "jsonwebtoken": "^9.0.2",
  "multer": "^2.0.2",
  "swagger-ui-express": "^5.0.1",
  "zod": "^4.1.12"
}
```

### package.json - DevDependencies

```json
"devDependencies": {
  "@jest/globals": "^30.2.0",
  "@types/cookie-parser": "^1.4.10",
  "@types/express": "^5.0.5",
  "@types/jest": "^30.0.0",
  "@types/node": "^24.10.0",
  "@types/supertest": "^6.0.3",
  "@types/swagger-ui-express": "^4.1.8",
  "@typescript-eslint/eslint-plugin": "^8.46.3",
  "@typescript-eslint/parser": "^8.46.3",
  "eslint": "^9.39.1",
  "eslint-config-prettier": "^10.1.8",
  "eslint-import-resolver-typescript": "^3.10.1",
  "eslint-plugin-import": "^2.32.0",
  "husky": "^9.1.7",
  "jest": "^30.2.0",
  "lint-staged": "^16.2.6",
  "openapi-types": "^12.1.3",
  "prettier": "^3.6.2",
  "prisma": "^6.19.0",
  "supertest": "^7.1.4",
  "ts-jest": "^29.4.5",
  "tsx": "^4.20.6",
  "typescript": "^5.9.3",
  "typescript-eslint": "^8.46.3",
  "vitest": "^4.0.8"
}
```

### package.json - Scripts

```json
"scripts": {
  "dev": "tsx watch src/main/server.ts",
  "build": "tsc -p tsconfig.build.json --noEmitOnError false || true",
  "start": "node dist/main/server.js",
  "lint": "eslint src --ext .ts",
  "format": "prettier --write .",
  "prepare": "husky",
  "db:up": "docker compose up -d db",
  "db:down": "docker compose down",
  "prisma:generate": "prisma generate",
  "prisma:migrate": "prisma migrate dev --name init",
  "prisma:studio": "prisma studio",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "NODE_OPTIONS=--experimental-vm-modules jest --config jest.config.js",
  "test:e2e:watch": "NODE_OPTIONS=--experimental-vm-modules jest --config jest.config.js --watch"
}
```

### package.json - Lint-Staged

```json
"lint-staged": {
  "src/**/*.{ts,js}": [
    "eslint --fix",
    "prettier --write"
  ],
  "*{json,md}": [
    "prettier --write"
  ]
}
```

---

## ⚙️ Arquivos de Configuração

### tsconfig.build.json

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "rootDir": "src",
    "strict": false,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "sourceMap": true,
    "noImplicitAny": false,
    "strictNullChecks": false
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### tsconfig.json

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./tsconfig.build.json",
  "compilerOptions": {
    "noEmit": true
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts"],
  "exclude": ["node_modules", "dist"]
}
```

### eslint.config.mjs (Flat Config - ESLint v9+)

```javascript
// Flat config para ESLint v9+
import tseslint from 'typescript-eslint';
import eslintPluginImport from 'eslint-plugin-import';

export default [
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parser: tseslint.parser,
      sourceType: 'module',
      ecmaVersion: 'latest',
    },
    plugins: {
      import: eslintPluginImport,
    },
    settings: {
      'import/resolver': {
        typescript: {},
      },
    },
    rules: {
      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
        },
      ],
    },
    ignores: ['dist/**', 'node_modules/**', '.husky/**'],
  },
];
```

### .prettierrc.json

```json
{
  "printWidth": 100,
  "singleQuote": true,
  "trailingComma": "all",
  "semi": true
}
```

### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['src/tests/setup.ts'],
    include: ['src/**/*.test.ts'],
    globals: true,
    sequence: {
      concurrent: false,
    },
  },
});
```

### jest.config.js (E2E Tests)

```javascript
/** @type {import('jest').Config} */
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  testMatch: ['**/src/tests/**/*.e2e.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/tests/jest-setup.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/*.e2e.test.ts',
    '!src/tests/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 30000,
  maxWorkers: 1,
  verbose: true,
};
```

### .gitignore

```
node_modules/
dist/
.DS_Store
.env
.husky/
logs/
coverage/
```

### .dockerignore

```
node_modules
dist
.env
.env.*
!.env.example
.git
.github
.husky
logs
coverage
*.md
```

---

## 🐳 Docker

### docker-compose.yml (PostgreSQL Local)

```yaml
services:
  db:
    image: postgres:16
    container_name: {SEU_PROJETO}_postgres
    restart: unless-stopped
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_DB: ${POSTGRES_DB:-{SEU_PROJETO}}
    ports:
      - "5432:5432"
    volumes:
      - {SEU_PROJETO}_pg_data:/var/lib/postgresql/data
      - ./docker/local/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-{SEU_PROJETO}}"]
      interval: 10s
      timeout: 5s
      retries: 5
volumes:
  {SEU_PROJETO}_pg_data:
```

### Dockerfile (Multi-stage Build)

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig*.json ./
COPY src ./src
RUN npm run build

RUN npm prune --omit=dev
RUN npx prisma generate

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

ENV PORT=3000
EXPOSE 3000

CMD ["node", "dist/main/server.js"]
```

---

## 🗄️ Prisma

### prisma/schema.prisma (Base)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// Adicione seus modelos aqui
model User {
  id          String   @id @default(uuid())
  firebaseUid String   @unique @db.VarChar(128)
  email       String?  @unique @db.VarChar(191)
  displayName String?  @db.VarChar(191)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

## 🔐 Variáveis de Ambiente

### .env.example

```env
# Database (Supabase ou local)
# Pooling connection (PgBouncer)
DATABASE_URL="postgresql://USER:PASSWORD@HOST:6543/DB?pgbouncer=true"

# Direct connection (migrations)
DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/DB"

# Firebase Admin SDK
FIREBASE_PROJECT_ID=seu-projeto-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@seu-projeto.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nSUA_CHAVE_AQUI\n-----END PRIVATE KEY-----\n"

# JWT Secret (produção: guardar em secret manager)
JWT_SECRET=dev-secret-change-me-in-production

# Refresh Token TTL (dias)
REFRESH_TOKEN_TTL_DAYS=30

# Node Environment
NODE_ENV=development
PORT=3000
```

---

## 🐶 Husky - Git Hooks

### Configuração

```bash
npm run prepare
```

### .husky/pre-commit

```bash
npx lint-staged
```

**Nota:** O Husky será automaticamente configurado ao executar `npm install` graças ao script `"prepare": "husky"` no package.json.

---

## 🔄 CI/CD - GitHub Actions

### .github/workflows/cloud-run-deploy.yml

```yaml
name: Deploy to Cloud Run

on:
  push:
    branches: ["main"]
  workflow_dispatch: {}

concurrency:
  group: cloud-run-deploy
  cancel-in-progress: true

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write

    env:
      SERVICE_NAME: ${{ secrets.CLOUD_RUN_SERVICE }}
      REGION: ${{ secrets.GCP_REGION }}
      PROJECT_ID: ${{ secrets.GCP_PROJECT_ID }}
      REPOSITORY: ${{ secrets.GAR_REPOSITORY }}
      IMAGE: ${{ secrets.GCP_REGION }}-docker.pkg.dev/${{ secrets.GCP_PROJECT_ID }}/${{ secrets.GAR_REPOSITORY }}/{SEU_PROJETO}-api:${{ github.sha }}
      LATEST_IMAGE: ${{ secrets.GCP_REGION }}-docker.pkg.dev/${{ secrets.GCP_PROJECT_ID }}/${{ secrets.GAR_REPOSITORY }}/{SEU_PROJETO}-api:latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}

      - name: Setup gcloud
        uses: google-github-actions/setup-gcloud@v2
        with:
          project_id: ${{ env.PROJECT_ID }}

      - name: Configure Docker auth for Artifact Registry
        run: gcloud auth configure-docker ${{ env.REGION }}-docker.pkg.dev --quiet

      - name: Build Docker image
        run: |
          docker build -t "$IMAGE" -t "$LATEST_IMAGE" .

      - name: Push Docker image
        run: |
          docker push "$IMAGE"
          docker push "$LATEST_IMAGE"

      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy "$SERVICE_NAME" \
            --image="$IMAGE" \
            --region="$REGION" \
            --platform=managed \
            --allow-unauthenticated \
            --port=3000 \
            --set-env-vars=NODE_ENV=production,PORT=3000 \
            --set-env-vars=DATABASE_URL=${{ secrets.DATABASE_URL }} \
            --set-env-vars=DIRECT_URL=${{ secrets.DIRECT_URL }} \
            --set-env-vars=FIREBASE_PROJECT_ID=${{ secrets.FIREBASE_PROJECT_ID }} \
            --set-env-vars=FIREBASE_CLIENT_EMAIL=${{ secrets.FIREBASE_CLIENT_EMAIL }} \
            --set-env-vars=FIREBASE_PRIVATE_KEY="${{ secrets.FIREBASE_PRIVATE_KEY }}" \
            --set-env-vars=JWT_SECRET="${{ secrets.JWT_SECRET }}"
```

### .github/workflows/prisma-migrate.yml

```yaml
name: Prisma Migrate (deploy)

on:
  workflow_dispatch:
    inputs:
      migrateStatus:
        description: "Run prisma migrate status before deploy"
        required: false
        default: "true"

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Prisma migrate status
        if: ${{ inputs.migrateStatus == 'true' }}
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          DIRECT_URL: ${{ secrets.DIRECT_URL }}
        run: npx prisma migrate status

      - name: Prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          DIRECT_URL: ${{ secrets.DIRECT_URL }}
        run: npx prisma migrate deploy
```

### GitHub Secrets Necessários

Configure em **Settings > Secrets and variables > Actions**:

- `GCP_PROJECT_ID`: ID do projeto GCP
- `GCP_REGION`: Região (ex: `us-central1`)
- `GCP_SA_KEY`: JSON da Service Account com permissões
- `GAR_REPOSITORY`: Nome do repositório Artifact Registry (ex: `docker-repo`)
- `CLOUD_RUN_SERVICE`: Nome do serviço Cloud Run (ex: `{SEU_PROJETO}-api`)
- `DATABASE_URL`: Connection string PostgreSQL (pooling)
- `DIRECT_URL`: Connection string direta (migrations)
- `FIREBASE_PROJECT_ID`: ID do projeto Firebase
- `FIREBASE_CLIENT_EMAIL`: Email da service account Firebase
- `FIREBASE_PRIVATE_KEY`: Chave privada Firebase (com `\n` escapados)
- `JWT_SECRET`: Segredo para tokens JWT

---

## 📝 Código Base Essencial

### src/main/server.ts

```typescript
import 'dotenv/config';
import { app } from './app.js';

const port = Number(process.env.PORT) || 3000;
const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

app.listen(port, host, () => {
  console.log(`🚀 API listening on http://${host}:${port}`);
});
```

### src/main/app.ts

```typescript
import express from 'express';
import cookieParser from 'cookie-parser';
import { setupRoutes } from './setup-routes.js';

export function makeApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  
  // Health check
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  
  setupRoutes(app);
  return app;
}

export const app = makeApp();
```

### src/main/setup-routes.ts

```typescript
import { Express } from 'express';

export function setupRoutes(app: Express): void {
  app.get('/api/hello', (_req, res) => {
    res.json({ message: 'Hello from Clean Architecture API!' });
  });
}
```

### src/infra/prisma/client.ts

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

### src/domain/constants.ts

```typescript
export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  INVALID_REQUEST: 'INVALID_REQUEST',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;
```

### src/tests/setup.ts (Vitest)

```typescript
import { beforeAll, afterAll } from 'vitest';

beforeAll(() => {
  console.log('Vitest tests starting...');
});

afterAll(() => {
  console.log('Vitest tests finished.');
});
```

### src/tests/jest-setup.ts (Jest E2E)

```typescript
import { beforeAll, afterAll } from '@jest/globals';
import { prisma } from '../infra/prisma/client.js';

beforeAll(async () => {
  console.log('Jest E2E tests starting...');
});

afterAll(async () => {
  await prisma.$disconnect();
  console.log('Jest E2E tests finished.');
});
```

---

## 🚀 Instruções de Execução

### 1. Criar o Projeto

```bash
# Criar diretório
mkdir {SEU_PROJETO}-api
cd {SEU_PROJETO}-api

# Inicializar npm
npm init -y

# Criar estrutura de pastas
mkdir -p .github/workflows
mkdir -p docker/local/postgres
mkdir -p docs
mkdir -p prisma/migrations
mkdir -p scripts
mkdir -p src/{application,data/protocols,domain/{repositories,usecases},infra/{prisma,repositories},main/{docs,factories},presentation/{controllers,middlewares,protocols,routes},tests,types}

# Criar .husky
mkdir -p .husky
```

### 2. Instalar Dependências

```bash
# Instalar dependencies
npm install @prisma/client @types/jsonwebtoken @types/multer cookie-parser dotenv express firebase-admin jsonwebtoken multer swagger-ui-express zod

# Instalar devDependencies
npm install -D @jest/globals @types/cookie-parser @types/express @types/jest @types/node @types/supertest @types/swagger-ui-express @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint eslint-config-prettier eslint-import-resolver-typescript eslint-plugin-import husky jest lint-staged openapi-types prettier prisma supertest ts-jest tsx typescript typescript-eslint vitest
```

### 3. Configurar Husky

```bash
npm run prepare
echo "npx lint-staged" > .husky/pre-commit
chmod +x .husky/pre-commit
```

### 4. Criar Arquivos de Configuração

Crie todos os arquivos listados acima:
- package.json (com scripts, lint-staged)
- tsconfig.json, tsconfig.build.json
- eslint.config.mjs
- .prettierrc.json
- vitest.config.ts
- jest.config.js
- .gitignore
- .dockerignore
- .env.example
- docker-compose.yml
- Dockerfile
- Arquivos de código base (server.ts, app.ts, etc.)
- Workflows GitHub Actions

### 5. Configurar Prisma

```bash
# Criar schema.prisma base
npx prisma init

# Editar prisma/schema.prisma com o conteúdo fornecido

# Gerar client
npx prisma generate

# Criar primeira migration (após configurar DATABASE_URL)
npx prisma migrate dev --name init
```

### 6. Configurar Git

```bash
git init
git add .
git commit -m "feat: initial project setup with clean architecture"
```

### 7. Testar Local

```bash
# Subir banco PostgreSQL local
npm run db:up

# Rodar migrations
npm run prisma:migrate

# Rodar em modo dev
npm run dev

# Testar endpoint
curl http://localhost:3000/health
curl http://localhost:3000/api/hello

# Rodar testes unitários
npm test

# Rodar testes E2E
npm run test:e2e
```

### 8. Build e Deploy

```bash
# Build local
npm run build

# Testar build
npm start

# Deploy (após configurar secrets no GitHub)
git push origin main  # Trigger automático do workflow
```

---

## 🔧 Configurações de Serviços Externos

### Supabase (PostgreSQL)

1. Criar projeto no Supabase
2. Obter connection strings:
   - **Pooling (Transaction mode):** para `DATABASE_URL`
   - **Direct connection:** para `DIRECT_URL`
3. Configurar no `.env` e GitHub Secrets

### Firebase Admin

1. Acessar Firebase Console
2. Project Settings > Service Accounts
3. Generate new private key
4. Extrair: `project_id`, `client_email`, `private_key`
5. Configurar no `.env` e GitHub Secrets
   - **Importante:** Escapar `\n` na `FIREBASE_PRIVATE_KEY`

### Google Cloud (Deploy)

1. Criar projeto GCP
2. Habilitar APIs:
   - Cloud Run
   - Cloud Build
   - Artifact Registry
3. Criar Service Account com permissões:
   - Cloud Run Admin
   - Cloud Build Editor
   - Artifact Registry Writer
4. Criar repositório Artifact Registry:
   ```bash
   gcloud artifacts repositories create docker-repo \
     --repository-format=docker \
     --location=us-central1
   ```
5. Exportar JSON da Service Account para `GCP_SA_KEY`

---

## ✅ Checklist de Validação

Após criar o projeto, validar:

- [ ] `npm install` executa sem erros
- [ ] `npm run dev` sobe servidor em http://localhost:3000
- [ ] `npm run build` compila TypeScript sem erros
- [ ] `npm start` executa build corretamente
- [ ] `npm run lint` não retorna erros
- [ ] `npm run format` formata código
- [ ] `npm test` executa testes unitários (Vitest)
- [ ] `npm run test:e2e` executa testes E2E (Jest)
- [ ] `npm run db:up` sobe Postgres local
- [ ] `npx prisma studio` abre interface do banco
- [ ] Git hooks (pre-commit) funcionam ao commitar
- [ ] Endpoints `/health` e `/api/hello` respondem
- [ ] Docker build funciona: `docker build -t test .`
- [ ] Workflows GitHub Actions estão configurados
- [ ] Secrets GitHub configurados corretamente

---

## 📚 Padrões e Boas Práticas

### Clean Architecture

1. **Use Cases** isolados em `domain/usecases/{feature}/`
2. **Controllers** apenas lidam com HTTP em `presentation/controllers/`
3. **Repositories** implementações em `infra/repositories/`
4. **DTOs** para input/output de use cases
5. **Factories** para dependency injection em `main/factories/`

### Testes

1. **Unit Tests (Vitest):** Para use cases, com mocks
2. **E2E Tests (Jest):** Para rotas completas, com banco real
3. **Coverage:** Mínimo 80% para use cases críticos

### Commits

1. Usar Conventional Commits:
   - `feat:` - Nova feature
   - `fix:` - Correção de bug
   - `refactor:` - Refatoração
   - `test:` - Adicionar testes
   - `docs:` - Documentação
   - `chore:` - Manutenção

### Code Style

1. Prettier para formatação automática
2. ESLint para regras de qualidade
3. Import order automático
4. Single quotes, trailing commas

---

## 🎯 Resultado Esperado

Ao final, você terá um projeto **production-ready** com:

✅ Clean Architecture implementada  
✅ TypeScript configurado (strict mode opcional)  
✅ Express.js com rotas organizadas  
✅ Prisma ORM com PostgreSQL (Supabase)  
✅ Firebase Admin para autenticação  
✅ JWT para tokens  
✅ Swagger/OpenAPI documentação  
✅ Testes unitários (Vitest) e E2E (Jest)  
✅ Linting (ESLint) e formatação (Prettier)  
✅ Git hooks (Husky + lint-staged)  
✅ Docker local (Postgres) e produção (multi-stage)  
✅ CI/CD GitHub Actions (Cloud Run)  
✅ Migrations Prisma automatizadas  
✅ Health check endpoint  
✅ Request logging/audit  
✅ Error handling padronizado  

---

## 📖 Documentação Adicional

Após criar o projeto, documente em `README.md`:

- Como configurar variáveis de ambiente
- Como rodar testes
- Como fazer deploy
- Estrutura de pastas
- Convenções de código
- Guia de contribuição

---

## ⚠️ Notas Importantes

1. **Substituir `{SEU_PROJETO}`** em todos os lugares pelo nome real do projeto
2. **Mudar senhas e secrets** - Não usar valores de exemplo em produção
3. **Firebase Private Key** - Escapar `\n` corretamente ao configurar
4. **Supabase** - Usar connection pooling (porta 6543) para `DATABASE_URL`
5. **Migrations** - Sempre rodar migrations antes do deploy
6. **GitHub Secrets** - Configurar TODOS os secrets listados
7. **Service Account GCP** - Garantir permissões corretas
8. **Node.js** - Usar versão 20+ (LTS)

---

## 🆘 Troubleshooting

### Erro no Husky

```bash
rm -rf .husky
npm run prepare
chmod +x .husky/pre-commit
```

### Erro no Prisma

```bash
npx prisma generate
npx prisma migrate reset
npx prisma migrate dev
```

### Erro no ESLint (flat config)

Garantir que está usando ESLint 9+ e o arquivo é `eslint.config.mjs` (não `.eslintrc`).

### Erro no Docker Build

Verificar `.dockerignore` e que `dist/` está sendo gerado no build stage.

---

**FIM DO PROMPT** ✅

Execute este prompt em um agente AI e forneça o nome do seu projeto. O agente deve criar toda a estrutura, arquivos e configurações necessárias.
