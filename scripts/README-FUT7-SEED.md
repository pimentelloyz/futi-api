# Script de Seed - Campeonato FUT7 2025

Este script cria um campeonato completo de FUT7 com toda a estrutura necessária.

## 📋 O que será criado

### 🏆 Liga
- **Nome:** Campeonato FUT7 2025
- **Formato:** FUT7 (7 jogadores por time)
- **Período:** Dezembro/2025 - Março/2026

### ⚽ Times (8 times)
1. Relâmpagos FC
2. Tigres United
3. Águias do Norte
4. Leões da Sul
5. Falcões FC
6. Tubarões SC
7. Panteras Negras
8. Dragões FC

### 👥 Jogadores
- **56 jogadores** no total
- **7 jogadores por time** (1 goleiro + 6 jogadores de linha)
- Posições variadas (GK, CAM, ST, etc.)

### 📊 Estrutura do Campeonato

#### Fase 1: Grupos (Dezembro/2025 - Janeiro/2026)
- **Grupo A:** Times 1, 2, 3, 4
- **Grupo B:** Times 5, 6, 7, 8
- **Sistema:** Todos contra todos em cada grupo
- **Partidas:** 6 jogos por grupo = **12 partidas**

#### Fase 2: Semifinais (Fevereiro/2026)
- **Semifinal 1:** 1º Grupo A vs 2º Grupo B
- **Semifinal 2:** 1º Grupo B vs 2º Grupo A
- **Partidas:** **2 partidas**

#### Fase 3: Final (Março/2026)
- **Final:** Vencedor Semi 1 vs Vencedor Semi 2
- **Partidas:** **1 partida**

### ⚖️ Regras de Disciplina
- 3 cartões amarelos = suspensão
- 1 cartão vermelho = 1 jogo de suspensão
- Acumulação de amarelos: ativa

## 🚀 Como Executar

### 1. Certifique-se de que o banco está configurado
```bash
npm run prisma:migrate
```

### 2. Execute o script de seed
```bash
npx tsx scripts/seed-fut7-championship.ts
```

### 3. Verificar no banco
```bash
npx prisma studio
```

## 🔑 Credenciais

Após executar o script, será criado um usuário admin:

- **Email:** `admin@fut7.com`
- **Role:** `LEAGUE_MANAGER` (da liga criada)
- **Firebase UID:** `admin-fut7-uid`

## 📅 Calendário de Partidas

### Fase de Grupos
- Início: 07/12/2025
- Uma partida por semana
- Total: 12 rodadas

### Semifinais
- Data: 08/02/2026

### Final
- Data: 15/03/2026

## 🎯 Próximos Passos

Após criar o campeonato, você pode:

1. **Gerar fixtures automaticamente:**
   ```bash
   POST /api/leagues/{leagueId}/generate-fixtures
   ```

2. **Visualizar times da liga:**
   ```bash
   GET /api/leagues/{leagueId}/teams
   ```

3. **Ver calendário de partidas:**
   ```bash
   GET /api/matches?leagueId={leagueId}
   ```

4. **Iniciar uma partida:**
   ```bash
   PATCH /api/matches/{matchId}/status
   Body: { "status": "IN_PROGRESS" }
   ```

5. **Registrar resultado:**
   ```bash
   POST /api/matches/{matchId}/result
   Body: { "homeScore": 3, "awayScore": 2 }
   ```

## 🗑️ Limpar Dados (Opcional)

Se quiser limpar e recriar:

```bash
# Deletar a liga (cascade deletará tudo relacionado)
npx prisma studio
# Ou via SQL:
# DELETE FROM "League" WHERE slug = 'campeonato-fut7-2025';
```

## 📝 Notas

- Os IDs dos times nas semifinais e final são placeholders
- Após a fase de grupos, será necessário atualizar as semifinais com os times classificados
- A classificação será atualizada automaticamente ao registrar resultados
- Use os endpoints da API para simular o campeonato completo

## 🐛 Troubleshooting

### Erro: "Unique constraint failed"
O script já tenta fazer `upsert`, mas se der erro:
```bash
# Limpe os dados primeiro
npm run prisma:studio
# Delete manualmente ou rode: npm run prisma:reset
```

### Erro: "Position not found"
Certifique-se de que as posições estão seedadas:
```bash
npm run prisma:db:seed
```
