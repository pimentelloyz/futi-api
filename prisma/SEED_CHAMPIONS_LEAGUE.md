# Seed Champions League 2024/25

Este seed cria uma liga completa da UEFA Champions League com o novo formato (fase de liga única).

## O que é criado

- **19 posições de jogadores** (GK, CB, LB, RB, CDM, CM, CAM, ST, LW, RW, etc.)
- **36 times europeus** dos principais campeonatos (Inglaterra, Espanha, Alemanha, Itália, França, Portugal, Holanda e outros)
- **1 liga** - UEFA Champions League 2024/25
- **1 fase** - Fase de Liga (36 times, liga única)
- **144 jogos** distribuídos em 8 rodadas
- **Tabela de classificação** inicial para todos os times
- **Permissões de acesso** para o usuário configurado (MASTER, LEAGUE_MANAGER, MANAGER)

## Calendário de Jogos

- **Rodada 1**: 23/11/2025 às 20:00
- **Rodada 2**: 26/11/2025 às 20:00
- **Rodada 3**: 30/11/2025 às 17:00
- **Rodada 4**: 10/12/2025 às 20:00
- **Rodada 5**: 21/01/2026 às 20:00
- **Rodada 6**: 25/01/2026 às 17:00
- **Rodada 7**: 28/01/2026 às 20:00
- **Rodada 8**: 29/01/2026 às 20:00 (todos simultâneos - rodada final)

Cada time joga 8 partidas na fase de liga (4 em casa, 4 fora).

## Times Incluídos

### Inglaterra (4)
- Manchester City (Campeão Inglês)
- Arsenal
- Liverpool
- Aston Villa

### Espanha (4)
- Real Madrid (Campeão Europeu)
- Barcelona
- Atlético de Madrid
- Girona

### Alemanha (5)
- Bayern de Munique
- Borussia Dortmund
- RB Leipzig
- Bayer Leverkusen (Campeão Alemão)
- Stuttgart

### Itália (5)
- Inter de Milão (Campeão Italiano)
- Milan
- Juventus
- Atalanta
- Bologna

### França (4)
- Paris Saint-Germain
- Monaco
- Brest
- Lille

### Portugal (3)
- Sporting
- Benfica
- Porto

### Holanda (2)
- PSV Eindhoven
- Feyenoord

### Outros Países (9)
- Celtic (Escócia)
- Club Brugge (Bélgica)
- Shakhtar Donetsk (Ucrânia)
- RB Salzburg (Áustria)
- Young Boys (Suíça)
- Estrela Vermelha (Sérvia)
- Sparta Praga (República Tcheca)
- Dínamo Zagreb (Croácia)
- Slovan Bratislava (Eslováquia)

## Como Executar

### Usando NPX (Recomendado)

```bash
npx tsx prisma/seed-champions-league.ts
```

### Usando Node (Compilado)

```bash
# Primeiro compile o TypeScript
npm run build

# Execute o seed
node dist/prisma/seed-champions-league.js
```

## Variáveis de Ambiente Necessárias

Certifique-se de ter as seguintes variáveis no seu `.env`:

```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..." # Opcional, mas recomendado
```

## Comportamento do Seed

- **Times existentes**: Se um time com o mesmo nome já existir, ele será reutilizado
- **Liga existente**: Se a liga já existir, será atualizada
- **Jogos existentes**: Jogos da liga serão **deletados e recriados** para evitar duplicatas
- **Classificação**: Será criada/atualizada com valores zerados para todos os times
- **Permissões**: Configura automaticamente o usuário `a46be27d-b30a-4e15-8ab6-cf287b2e99cd` com:
  - **MASTER** - Acesso global ao sistema
  - **LEAGUE_MANAGER** - Gestor da Champions League
  - **MANAGER** - Técnico do Manchester City

## Formato da Champions League

O seed implementa o **novo formato da Champions League** (2024+):

- **Fase de Liga Única**: 36 times em uma única tabela
- **8 jogos por time**: 4 em casa, 4 fora
- **Top 24 avançam**: 
  - Top 8 direto para oitavas
  - 9º-24º disputam playoffs
- **Critérios de desempate**:
  1. Pontos
  2. Saldo de gols
  3. Gols marcados
  4. Gols fora
  5. Vitórias
  6. Vitórias fora

## Estrutura Criada no Banco

```
League (champions-league-2024-25)
├── LeagueFormat (champions-league)
│   └── LeaguePhaseConfig (Fase de Liga + regras)
├── LeagueTeam (36 vinculações time-liga)
├── LeaguePhase (Fase de Liga ativa)
├── LeagueStanding (36 registros de classificação)
└── Match (144 jogos agendados)
```

## Próximos Passos

Após executar o seed, você pode:

1. **Visualizar a liga** através da API
2. **Iniciar partidas** e registrar resultados
3. **Atualizar classificação** conforme os jogos acontecem
4. **Criar fases eliminatórias** (playoffs, oitavas, etc.)

## Troubleshooting

### Erro de conexão com banco

Verifique se o PostgreSQL está rodando e se as variáveis de ambiente estão corretas.

### Erro de duplicação de chave

Execute novamente - o seed é idempotente e vai limpar jogos existentes da liga.

### Timeout durante execução

Use `DIRECT_URL` ao invés de `DATABASE_URL` para evitar issues com connection poolers como PgBouncer.

## Desenvolvimento

Para modificar o seed:

1. Edite `prisma/seed-champions-league.ts`
2. Execute novamente com `npx tsx prisma/seed-champions-league.ts`
3. Verifique os logs de saída para confirmar sucesso
