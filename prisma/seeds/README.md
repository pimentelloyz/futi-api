# Seeds - Guia de Uso

## Visão Geral

Os seeds foram organizados de forma modular, permitindo executar cada seed individualmente ou todos juntos.

## Estrutura

```
prisma/
├── seed.ts                           # Orquestrador principal
└── seeds/
    ├── users.seed.ts                 # Usuários (sem dependências)
    ├── positions.seed.ts             # Posições (sem dependências)
    ├── teams.seed.ts                 # Times (depende de users)
    ├── players.seed.ts               # Jogadores (depende de positions, teams e users)
    ├── evaluation-forms.seed.ts      # Formulários de avaliação (sem dependências)
    ├── league-formats.seed.ts        # Formatos de liga (sem dependências)
    ├── large-leagues.seed.ts         # Ligas grandes (sem dependências)
    └── matches.seed.ts               # Partidas (depende de teams)
```

## Executar Todos os Seeds

Para executar todos os seeds na ordem correta, respeitando as dependências:

```bash
npm run prisma:seed
```

## Executar Seeds Individuais

### Seeds sem Dependências

Podem ser executados a qualquer momento:

```bash
npm run prisma:seed:users
npm run prisma:seed:positions
npm run prisma:seed:evaluation-forms
npm run prisma:seed:league-formats
npm run prisma:seed:large-leagues
```

### Seeds com Dependências

Requerem que outros seeds sejam executados primeiro:

```bash
# Teams (requer users)
npm run prisma:seed:teams

# Players (requer users, positions e teams)
npm run prisma:seed:players

# Matches (requer teams)
npm run prisma:seed:matches
```

## Ordem Recomendada para Execução Manual

Se você optar por executar os seeds individualmente, siga esta ordem:

1. `npm run prisma:seed:users`
2. `npm run prisma:seed:positions`
3. `npm run prisma:seed:teams`
4. `npm run prisma:seed:players`
5. `npm run prisma:seed:evaluation-forms`
6. `npm run prisma:seed:league-formats`
7. `npm run prisma:seed:large-leagues`
8. `npm run prisma:seed:matches`

## Variáveis de Ambiente

Os seeds utilizam as seguintes variáveis de ambiente (com valores padrão):

- `SEED_EMAIL`: Email do usuário admin (padrão: `andre.loyz@gmail.com`)
- `SEED_DISPLAY_NAME`: Nome do usuário admin (padrão: `André Pimentel`)
- `SEED_FIREBASE_UID`: UID do Firebase (padrão: `XUhWGPEJRyeq2TpuZQ9Kr80SlzG2`)
- `SEED_TEAM_NAME`: Nome do time principal (padrão: `Futi FC`)
- `SEED_TEAM_ICON`: Ícone do time (opcional)
- `DIRECT_URL` ou `DATABASE_URL`: URL de conexão com o banco

## Erros Comuns

### "Usuário admin não encontrado"

Execute `npm run prisma:seed:users` primeiro.

### "Time não encontrado"

Execute `npm run prisma:seed:teams` primeiro.

### "Posição não encontrada"

Execute `npm run prisma:seed:positions` primeiro.

## Notas

- Todos os seeds são idempotentes (podem ser executados múltiplas vezes sem duplicar dados)
- O orquestrador principal (`seed.ts`) executa todos os seeds na ordem correta
- Cada seed individual valida suas dependências antes de executar
- Seeds com dependências exibem mensagens claras se algo estiver faltando
