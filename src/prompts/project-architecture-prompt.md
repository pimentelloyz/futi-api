# Prompt de Arquitetura do Projeto (futi-api)

Use este prompt como referência ao implementar novas features ou refatorações. Sempre consulte-o antes de propor mudanças grandes.

## Contexto do Projeto

- API Node.js + TypeScript (ESM, moduleResolution NodeNext)
- Express + camadas: domain / data / infra / presentation / main
- Prisma (MySQL) como ORM
- Autenticação: Firebase (idToken) → JWT interno (access) + Refresh Tokens com rotação
- Validação: Zod
- Documentação: OpenAPI em `/docs` (UI) e `/docs.json`
- Linting/format: ESLint (flat config) + Prettier + Husky + lint-staged
- Testes: Vitest + Supertest (unit e e2e)

## Arquitetura e Convenções

- `domain`: entidades e contratos puros
- `data`: use cases (regras de negócio) e protocolos de repositório
- `infra`: implementações (Prisma, Firebase, serviços de segurança)
- `presentation`: controllers, middlewares e protocolos HTTP tipados
- `main`: wiring de rotas, factories, server, env e OpenAPI

### Protocolos HTTP

- `HttpRequest` com `body`, `query`, `params`, `cookies`, `user?`
- `HttpResponse<T>` com `statusCode`, `body`, e opcional `setCookie`/`clearCookie`
- Cookies: `refreshToken` é HttpOnly, `sameSite` estrito em prod, `secure` em prod, `path: /api/auth`

### Autenticação

- Exchange: `/api/auth/firebase/exchange` → `accessToken` + `refreshToken` e cookie HttpOnly
- Refresh: `/api/auth/refresh` via body ou cookie → rotação de refresh
- Logout: `/api/auth/logout` e `/api/auth/logout-all`
- JWT middleware protege rotas de domínio (teams, players, matches, users/me)

### Estilo de Código

- Sem `any` (usar tipos explícitos ou generics)
- Imports organizados e consistentes
- Validação via Zod antes do uso de payloads
- Mensagens de erro enxutas e consistentes (ex.: `invalid_request`, `invalid_token`)

## Requisitos de Testes (sempre)

- Cada nova regra de negócio deve ter testes unitários (use cases/serviços)
- Controllers importantes devem ter ao menos 1 teste (feliz e erro)
- E2E para fluxos agregados (quando integra várias camadas/rotas)
- Cobrir casos de falha (ex.: validação Zod, auth ausente/expirada, status inválido)
- Mocks:
  - Firebase: `verifyIdToken` no `src/tests/setup.ts`
  - Repositórios Prisma: implementações em memória no setup
  - Env: mock de `getEnv` no setup para evitar validação real

## Passo a Passo para Nova Feature

1. Desenhar contrato: endpoints, payloads, status codes, side-effects; atualizar `openapi.ts`
2. Escrever testes primeiro:
   - Unitários para use cases
   - Opcional: E2E mínimo se envolver várias rotas/camadas
3. Implementar camadas:
   - `domain` (entidades/eventuais contratos)
   - `data` (use case + protocolos)
   - `infra` (repositórios/serviços concretos)
   - `presentation` (controller, validação Zod)
   - `main` (factory e rota)
4. Garantir tipagem forte (sem `any`), usar `HttpResponse` com `setCookie/clearCookie` quando necessário
5. Atualizar docs em `src/docs` e exemplos
6. Rodar lint, build e testes; ajustar até passar
7. Commitar com Conventional Commits (ex.: `feat(x): ...`, `fix(y): ...`)

## Dicas de Qualidade

- Evitar efeitos colaterais não essenciais em controllers
- Logar apenas o suficiente (evitar logs sensíveis)
- Manter validação próxima das bordas (controllers)
- Use cases puros e fáceis de testar

## Como me usar (assistente)

Quando pedir novas implementações, inclua: “Consulte o prompt em `src/prompts/project-architecture-prompt.md`”. Isso garante que o plano de trabalho respeite arquitetura, tipagem e testes obrigatórios.
