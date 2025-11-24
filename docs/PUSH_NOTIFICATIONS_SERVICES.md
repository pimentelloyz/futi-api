# 🔔 Push Notification Services - Guia de Uso

## 📦 Serviços criados

### 1. **PushTokenService**

Gerencia tokens FCM no banco de dados.

### 2. **NotificationService**

Envia notificações usando Firebase Cloud Messaging.

---

## 🎯 Casos de uso

### ✅ **Registrar token FCM**

```bash
# Endpoint: POST /api/users/me/push-tokens
curl -X POST https://futi-api-777939995490.us-central1.run.app/api/users/me/push-tokens \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_JWT_TOKEN" \
  -d '{
    "token": "fcm_device_token_aqui",
    "platform": "ios"
  }'

# Response: 204 No Content
```

**Comportamento:**

- Se o token já existir para esse usuário: atualiza timestamp
- Se for um token novo: cria registro no banco
- Constraint único: `(userId, token)` - impede duplicatas

---

### ❌ **Deletar token específico (logout)**

```bash
# Endpoint: DELETE /api/users/me/push-tokens
curl -X DELETE https://futi-api-777939995490.us-central1.run.app/api/users/me/push-tokens \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_JWT_TOKEN" \
  -d '{
    "token": "fcm_device_token_aqui"
  }'

# Response: 204 No Content (se encontrou e deletou)
# Response: 404 Not Found (se não encontrou)
```

**Quando usar:**

- Usuário faz logout em um dispositivo específico
- App deseja parar de receber notificações

---

### 🗑️ **Deletar todos os tokens (logout global)**

```bash
# Endpoint: DELETE /api/users/me/push-tokens/all
curl -X DELETE https://futi-api-777939995490.us-central1.run.app/api/users/me/push-tokens/all \
  -H "Authorization: Bearer SEU_JWT_TOKEN"

# Response: 200 OK
{
  "success": true,
  "tokensDeleted": 3
}
```

**Quando usar:**

- Usuário faz "sair de todos os dispositivos"
- Usuário deleta a conta
- Reset de segurança

---

## 🔧 Uso programático dos serviços

### **PushTokenService**

```typescript
import { PrismaClient } from '@prisma/client';
import { PushTokenService } from './domain/services/push-token.service';

const prisma = new PrismaClient();
const pushTokenService = new PushTokenService(prisma);

// Salvar token
await pushTokenService.saveToken({
  userId: 'user123',
  token: 'fcm_token_here',
  platform: 'android',
});

// Deletar token
await pushTokenService.deleteToken({
  userId: 'user123',
  token: 'fcm_token_here',
});

// Buscar tokens de um usuário
const tokens = await pushTokenService.getUserTokens('user123');
// ['token1', 'token2', 'token3']

// Buscar tokens de múltiplos usuários (para envio em batch)
const tokensMap = await pushTokenService.getTokensForUsers(['user1', 'user2', 'user3']);
// Map { 'user1' => ['token1'], 'user2' => ['token2', 'token3'], ... }

// Deletar tokens inválidos (retornados pelo Firebase)
await pushTokenService.deleteInvalidTokens(['token1', 'token2']);

// Limpar tokens antigos (cron job - 90 dias por padrão)
const deleted = await pushTokenService.cleanupOldTokens(90);
console.log(`${deleted} tokens antigos deletados`);
```

---

### **NotificationService**

```typescript
import { PrismaClient } from '@prisma/client';
import { NotificationService, PushTokenService } from './domain/services';
import { FirebaseMessagingService } from './infra/services/firebase-messaging.service';

const prisma = new PrismaClient();
const messagingService = new FirebaseMessagingService();
const pushTokenService = new PushTokenService(prisma);
const notificationService = new NotificationService(messagingService, pushTokenService);

// 1. Enviar notificação para um único usuário
const result = await notificationService.sendToUser({
  userId: 'user123',
  title: 'Bem-vindo!',
  body: 'Sua conta foi criada com sucesso',
  data: {
    type: 'welcome',
    userId: 'user123',
  },
});
console.log(`✅ ${result.successCount} enviadas, ❌ ${result.failureCount} falharam`);

// 2. Enviar notificação para múltiplos usuários
await notificationService.sendToUsers({
  userIds: ['user1', 'user2', 'user3'],
  title: 'Nova temporada começou!',
  body: 'Veja os próximos jogos',
  data: {
    type: 'season_start',
    seasonId: 'season123',
  },
});

// 3. Notificação de gol (com formato específico)
await notificationService.sendGoalNotification({
  userIds: ['user1', 'user2', 'user3'],
  playerName: 'Cristiano Ronaldo',
  homeTeam: 'Flamengo',
  awayTeam: 'Palmeiras',
  homeScore: 2,
  awayScore: 1,
  minute: 78,
  matchId: 'match123',
  leagueId: 'league123',
});
// Título: "⚽ GOOOL! Cristiano Ronaldo"
// Body: "Flamengo 2 x 1 Palmeiras • 78'"

// 4. Notificação de início de partida
await notificationService.sendMatchStartNotification({
  userIds: ['user1', 'user2'],
  homeTeam: 'Flamengo',
  awayTeam: 'Palmeiras',
  matchId: 'match123',
  leagueId: 'league123',
  scheduledTime: new Date('2024-11-24T20:00:00Z'),
});
// Título: "🏁 Partida começando!"
// Body: "Flamengo x Palmeiras • 20:00"

// 5. Notificação de fim de partida
await notificationService.sendMatchEndNotification({
  userIds: ['user1', 'user2'],
  homeTeam: 'Flamengo',
  awayTeam: 'Palmeiras',
  homeScore: 3,
  awayScore: 1,
  matchId: 'match123',
  leagueId: 'league123',
});
// Título: "🏆 Partida finalizada!"
// Body: "Flamengo 3 x 1 Palmeiras"

// 6. Notificação de cartão vermelho
await notificationService.sendRedCardNotification({
  userIds: ['user1', 'user2'],
  playerName: 'Neymar Jr',
  teamName: 'Palmeiras',
  minute: 85,
  matchId: 'match123',
  leagueId: 'league123',
});
// Título: "🟥 Cartão vermelho!"
// Body: "Neymar Jr (Palmeiras) expulso aos 85'"

// 7. Notificação personalizada
await notificationService.sendCustomNotification({
  userIds: ['user1', 'user2'],
  title: 'Convite para torneio',
  body: 'Você foi convidado para o Campeonato 2024',
  type: 'tournament_invite',
  data: {
    tournamentId: 'tournament123',
    invitedBy: 'user999',
  },
});
```

---

## 🧹 Limpeza automática de tokens

### Cron job para limpar tokens antigos

```typescript
// src/jobs/cleanup-tokens.job.ts
import { PrismaClient } from '@prisma/client';
import { PushTokenService } from '../domain/services/push-token.service';

const prisma = new PrismaClient();
const pushTokenService = new PushTokenService(prisma);

async function cleanupOldTokens() {
  console.log('🧹 Iniciando limpeza de tokens antigos...');

  const deleted = await pushTokenService.cleanupOldTokens(90); // 90 dias

  console.log(`✅ ${deleted} tokens antigos deletados`);
}

// Executar a cada 24 horas
setInterval(cleanupOldTokens, 24 * 60 * 60 * 1000);
```

**Adicionar no `package.json`:**

```json
{
  "scripts": {
    "cleanup-tokens": "tsx src/jobs/cleanup-tokens.job.ts"
  }
}
```

---

## 📊 Queries úteis

### Ver todos os tokens de um usuário

```sql
SELECT * FROM "UserPushToken" WHERE "userId" = 'user123';
```

### Contar tokens por plataforma

```sql
SELECT platform, COUNT(*) as total
FROM "UserPushToken"
GROUP BY platform;
```

### Ver tokens mais antigos

```sql
SELECT "userId", token, platform, "createdAt"
FROM "UserPushToken"
ORDER BY "createdAt" ASC
LIMIT 10;
```

### Verificar tokens de um usuário específico

```sql
SELECT u.email, pt.token, pt.platform, pt."createdAt"
FROM "UserPushToken" pt
JOIN "User" u ON u.id = pt."userId"
WHERE u.email = 'user@example.com';
```

---

## 🔥 Integração com eventos da partida

### Automático: Gol é registrado

Já implementado no `MatchEventCreateController`:

```typescript
// src/presentation/controllers/match-events-controller.ts

// Quando um GOAL é criado:
if (created.type === 'GOAL') {
  // Busca dados da partida e jogador
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  const player = await prisma.player.findUnique({ where: { id: created.playerId } });

  // Envia notificação automaticamente
  await notifyGoalUseCase.execute({
    matchId,
    teamId: created.teamId,
    playerName: player.name,
    homeTeam: match.homeTeam.name,
    awayTeam: match.awayTeam.name,
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    minute: created.minute,
  });
}
```

**Funcionamento:**

1. Frontend cria evento: `POST /api/matches/:id/events` com `type: "GOAL"`
2. Backend registra o gol no banco
3. Backend detecta que é um GOAL
4. Backend busca usuários interessados (membros da liga + jogadores do time)
5. Backend envia notificação para todos os dispositivos
6. Tokens inválidos são automaticamente removidos

---

## 🎯 Fluxo completo de notificação

```
┌─────────────┐
│ Flutter App │
└──────┬──────┘
       │ 1. FCM Token gerado
       ▼
┌──────────────────────────────┐
│ POST /api/users/me/push-tokens│
└──────┬───────────────────────┘
       │ 2. Token salvo no banco
       ▼
┌────────────────┐
│ UserPushToken  │
│ userId, token  │
└────────────────┘

       ... tempo passa ...

┌─────────────────┐
│ Gol é marcado!  │
└──────┬──────────┘
       │ 3. POST /api/matches/:id/events
       ▼
┌──────────────────────────┐
│ MatchEventCreateController│
└──────┬───────────────────┘
       │ 4. Detecta GOAL
       ▼
┌─────────────────┐
│ NotifyGoalUseCase│
└──────┬──────────┘
       │ 5. Busca usuários interessados
       ▼
┌─────────────────────┐
│ NotificationService  │
└──────┬──────────────┘
       │ 6. Envia para FCM
       ▼
┌──────────────────────────┐
│ Firebase Cloud Messaging │
└──────┬───────────────────┘
       │ 7. Push para dispositivos
       ▼
┌─────────────┐
│ 📱📱📱📱📱  │ Notificações recebidas!
└─────────────┘
```

---

## ✅ Checklist de implementação

Backend:

- [x] PushTokenService criado
- [x] NotificationService criado
- [x] RegisterPushTokenController (já existia)
- [x] DeletePushTokenController criado
- [x] DeleteAllPushTokensController criado
- [x] Rotas adicionadas em users-router.ts
- [x] Integração automática com eventos GOAL
- [x] Limpeza automática de tokens inválidos

Flutter (pendente):

- [ ] Adicionar firebase_messaging no pubspec.yaml
- [ ] Criar PushNotificationService
- [ ] Registrar token no backend via POST /api/users/me/push-tokens
- [ ] Deletar token no logout via DELETE /api/users/me/push-tokens
- [ ] Configurar AndroidManifest.xml
- [ ] Configurar Info.plist (iOS)
- [ ] Testar recebimento de notificações

---

🎉 **Sistema completo de push notifications pronto para uso!**
