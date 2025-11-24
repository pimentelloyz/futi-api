# 📢 Topics (Tópicos) - Push Notifications

## 🎯 O que são tópicos?

Tópicos são **canais de notificação** que permitem enviar mensagens para múltiplos usuários de uma vez, sem precisar gerenciar listas de tokens individualmente.

### **Quando usar tópicos?**

✅ **Use tópicos quando:**

- Enviar notificações para **todos os membros de uma liga**
- Notificar **todos os jogadores de um time**
- Avisar **todos os torcedores de um time específico**
- Alertar sobre **atualizações de uma partida em andamento**
- Broadcast de **anúncios gerais** para todos os usuários

❌ **NÃO use tópicos quando:**

- Enviar notificação para **um único usuário**
- Mensagens **personalizadas** (use tokens individuais)
- Notificações **privadas** ou sensíveis

---

## 📡 Endpoints disponíveis

### **1. Inscrever em tópico**

```http
POST /api/topics/subscribe
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "topic": "league_cm3w5xyz789"
}
```

**Response:**

```json
{
  "success": true
}
```

---

### **2. Desinscrever de tópico**

```http
POST /api/topics/unsubscribe
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "topic": "league_cm3w5xyz789"
}
```

**Response:**

```json
{
  "success": true
}
```

---

### **3. Enviar notificação para tópico** (admin)

```http
POST /api/topics/send
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "topic": "league_cm3w5xyz789",
  "title": "⚽ Rodada iniciada!",
  "body": "Confira os jogos de hoje",
  "data": {
    "type": "round_start",
    "leagueId": "cm3w5xyz789"
  },
  "imageUrl": "https://example.com/banner.jpg"
}
```

**Response:**

```json
{
  "success": true
}
```

---

## 🏷️ Nomenclatura de tópicos

### **Convenção:**

| Tipo    | Formato                     | Exemplo                  |
| ------- | --------------------------- | ------------------------ |
| Liga    | `league_{leagueId}`         | `league_cm3w5xyz789`     |
| Time    | `team_{teamId}`             | `team_cm3w7abc123`       |
| Partida | `match_{matchId}`           | `match_cm3w8def456`      |
| Torneio | `tournament_{tournamentId}` | `tournament_cm3w9ghi789` |

### **Helpers no código:**

```typescript
import { TopicService } from './services/topic.service';

// Gerar nome de tópico para liga
const topic = TopicService.getLeagueTopic('cm3w5xyz789');
// Resultado: "league_cm3w5xyz789"

// Gerar nome de tópico para time
const topic = TopicService.getTeamTopic('cm3w7abc123');
// Resultado: "team_cm3w7abc123"

// Gerar nome de tópico para partida
const topic = TopicService.getMatchTopic('cm3w8def456');
// Resultado: "match_cm3w8def456"
```

---

## 🔧 Uso programático

### **Inscrever usuário automaticamente**

```typescript
import { ManageTopicsUseCase } from './usecases/manage-topics/manage-topics.usecase';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const topicsUseCase = new ManageTopicsUseCase(prisma);

// Quando usuário entra em uma liga
await topicsUseCase.subscribeToLeague(userId, leagueId);

// Quando jogador entra em um time
await topicsUseCase.subscribeToTeam(userId, teamId);

// Quando usuário quer acompanhar uma partida ao vivo
await topicsUseCase.subscribeToMatch(userId, matchId);
```

### **Desinscrever usuário automaticamente**

```typescript
// Quando usuário sai da liga
await topicsUseCase.unsubscribeFromLeague(userId, leagueId);

// Quando jogador sai do time
await topicsUseCase.unsubscribeFromTeam(userId, teamId);
```

### **Enviar notificação para todos os inscritos**

```typescript
import { TopicService } from './services/topic.service';
import { FirebaseMessagingService } from './infra/services/firebase-messaging.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const messagingService = new FirebaseMessagingService();
const topicService = new TopicService(messagingService, prisma);

// Notificar todos os membros da liga
const leagueTopic = TopicService.getLeagueTopic('cm3w5xyz789');
await topicService.sendToTopic({
  topic: leagueTopic,
  title: '🏆 Nova temporada!',
  body: 'A temporada 2024 começou. Boa sorte!',
  data: {
    type: 'season_start',
    leagueId: 'cm3w5xyz789',
  },
});

// Notificar todos os torcedores do time
const teamTopic = TopicService.getTeamTopic('cm3w7abc123');
await topicService.sendToTopic({
  topic: teamTopic,
  title: '⚽ Próximo jogo!',
  body: 'Flamengo x Palmeiras - Sábado 20h',
  data: {
    type: 'next_match',
    teamId: 'cm3w7abc123',
    matchId: 'cm3w8def456',
  },
});
```

---

## 🎬 Casos de uso reais

### **1. Notificar nova rodada da liga**

```typescript
// Quando admin cria nova rodada
const leagueTopic = TopicService.getLeagueTopic(leagueId);

await topicService.sendToTopic({
  topic: leagueTopic,
  title: '⚽ Nova rodada!',
  body: 'Rodada 5 - 10 jogos agendados',
  data: {
    type: 'new_round',
    leagueId,
    roundNumber: '5',
  },
});
```

### **2. Avisar início de partida**

```typescript
// 15 minutos antes da partida
const matchTopic = TopicService.getMatchTopic(matchId);

await topicService.sendToTopic({
  topic: matchTopic,
  title: '🏁 Partida começando em breve!',
  body: 'Flamengo x Palmeiras - 15 minutos',
  data: {
    type: 'match_starting_soon',
    matchId,
    minutesUntilStart: '15',
  },
});
```

### **3. Broadcast de manutenção**

```typescript
// Notificar todos sobre manutenção
await topicService.sendToTopic({
  topic: 'all_users',
  title: '🔧 Manutenção programada',
  body: 'Sistema ficará offline das 02h às 04h',
  data: {
    type: 'maintenance',
    startTime: '2024-11-25T02:00:00Z',
    endTime: '2024-11-25T04:00:00Z',
  },
});
```

### **4. Resultado de partida importante**

```typescript
// Enviar para todos os torcedores dos 2 times
const homeTeamTopic = TopicService.getTeamTopic(homeTeamId);
const awayTeamTopic = TopicService.getTeamTopic(awayTeamId);

const notification = {
  title: '🏆 Fim de jogo!',
  body: 'Flamengo 3 x 1 Palmeiras',
  data: {
    type: 'match_ended',
    matchId,
    homeScore: '3',
    awayScore: '1',
  },
};

await topicService.sendToTopic({ topic: homeTeamTopic, ...notification });
await topicService.sendToTopic({ topic: awayTeamTopic, ...notification });
```

---

## 🔄 Integração automática

### **Hook: Usuário entra na liga**

```typescript
// src/presentation/controllers/leagues-controller.ts

// Após adicionar membro à liga
await topicsUseCase.subscribeToLeague(userId, leagueId);
```

### **Hook: Jogador entra no time**

```typescript
// src/presentation/controllers/teams-controller.ts

// Após adicionar jogador ao time
if (player.userId) {
  await topicsUseCase.subscribeToTeam(player.userId, teamId);
}
```

### **Hook: Usuário sai da liga**

```typescript
// Quando remove AccessMembership
await topicsUseCase.unsubscribeFromLeague(userId, leagueId);
```

---

## 📊 Comparação: Tópicos vs Tokens individuais

| Característica     | Tópicos                    | Tokens individuais           |
| ------------------ | -------------------------- | ---------------------------- |
| **Uso**            | Notificação em massa       | Notificação personalizada    |
| **Performance**    | ⚡ Muito rápido            | 🐢 Mais lento (batch)        |
| **Gerenciamento**  | 🎯 Simples (subscribe)     | 📝 Complexo (banco de dados) |
| **Personalização** | ❌ Mesma mensagem p/ todos | ✅ Mensagem personalizada    |
| **Escalabilidade** | ✅ Ilimitado               | ⚠️ Limitado (500 por batch)  |
| **Exemplo**        | Avisos da liga             | Gol do seu time              |

---

## 🧪 Testes

### **1. Inscrever em tópico (cURL)**

```bash
curl -X POST https://futi-api-777939995490.us-central1.run.app/api/topics/subscribe \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_JWT_TOKEN" \
  -d '{
    "topic": "league_cm3w5xyz789"
  }'
```

### **2. Enviar notificação para tópico (cURL)**

```bash
curl -X POST https://futi-api-777939995490.us-central1.run.app/api/topics/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_JWT_TOKEN" \
  -d '{
    "topic": "league_cm3w5xyz789",
    "title": "⚽ Rodada 5 disponível!",
    "body": "Confira os jogos desta semana",
    "data": {
      "type": "new_round",
      "leagueId": "cm3w5xyz789"
    }
  }'
```

---

## 🎯 Flutter - Implementação

### **Inscrever em tópico ao entrar na liga**

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

class TopicsService {
  static const String baseUrl = 'https://futi-api-777939995490.us-central1.run.app';

  // Inscrever em tópico
  static Future<bool> subscribeToTopic(String jwtToken, String topic) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/topics/subscribe'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $jwtToken',
        },
        body: jsonEncode({
          'topic': topic,
        }),
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Erro ao inscrever em tópico: $e');
      return false;
    }
  }

  // Desinscrever de tópico
  static Future<bool> unsubscribeFromTopic(String jwtToken, String topic) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/topics/unsubscribe'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $jwtToken',
        },
        body: jsonEncode({
          'topic': topic,
        }),
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Erro ao desinscrever de tópico: $e');
      return false;
    }
  }
}

// Uso
final jwtToken = await AuthService.getToken();
final leagueId = 'cm3w5xyz789';
final topic = 'league_$leagueId';

// Inscrever quando entra na liga
await TopicsService.subscribeToTopic(jwtToken, topic);

// Desinscrever quando sai da liga
await TopicsService.unsubscribeFromTopic(jwtToken, topic);
```

---

## 🔐 Segurança

- ✅ Todos os endpoints exigem autenticação JWT
- ✅ `/api/topics/send` deve ter verificação de admin (TODO)
- ✅ Tópicos são públicos - qualquer um pode se inscrever
- ⚠️ **NÃO** envie dados sensíveis via tópicos

---

## ⚡ Limites do Firebase

| Recurso                | Limite                      |
| ---------------------- | --------------------------- |
| Inscrições simultâneas | 1000 tokens por request     |
| Envios para tópico     | Sem limite de inscritos     |
| Nomenclatura           | `/topics/[a-zA-Z0-9-_.~%]+` |
| Tamanho da mensagem    | 4KB (incluindo payload)     |

---

## 🎉 Resumo

**Criado:**

- ✅ `TopicService` - Gerencia inscrições e envios
- ✅ `ManageTopicsUseCase` - Casos de uso de tópicos
- ✅ `SubscribeToTopicController` - POST /api/topics/subscribe
- ✅ `UnsubscribeFromTopicController` - POST /api/topics/unsubscribe
- ✅ `SendToTopicController` - POST /api/topics/send
- ✅ Métodos no `FirebaseMessagingService`
- ✅ Rotas registradas em `/api/topics`

**Pronto para usar!** 🚀
