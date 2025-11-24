# 🔔 Push Notifications - API Reference

## 📡 Endpoints disponíveis

### 1. **Registrar token FCM**

```http
POST /api/users/me/push-tokens
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "token": "fcm_device_token_aqui",
  "platform": "ios"  // "ios" | "android" | "web"
}
```

**Respostas:**

- `204 No Content` - Token registrado com sucesso
- `400 Bad Request` - Dados inválidos
- `401 Unauthorized` - Token JWT inválido

---

### 2. **Deletar token específico**

```http
DELETE /api/users/me/push-tokens
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "token": "fcm_device_token_aqui"
}
```

**Respostas:**

- `204 No Content` - Token deletado com sucesso
- `404 Not Found` - Token não encontrado
- `401 Unauthorized` - Token JWT inválido

---

### 3. **Deletar todos os tokens**

```http
DELETE /api/users/me/push-tokens/all
Authorization: Bearer {JWT_TOKEN}
```

**Respostas:**

- `200 OK` - Tokens deletados
  ```json
  {
    "success": true,
    "tokensDeleted": 3
  }
  ```
- `401 Unauthorized` - Token JWT inválido

---

## 🧪 Exemplos de testes

### **1. Registrar token (cURL)**

```bash
curl -X POST https://futi-api-777939995490.us-central1.run.app/api/users/me/push-tokens \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "token": "fBZdYq_kTL2-P7hX8K...",
    "platform": "android"
  }'
```

### **2. Deletar token (cURL)**

```bash
curl -X DELETE https://futi-api-777939995490.us-central1.run.app/api/users/me/push-tokens \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "token": "fBZdYq_kTL2-P7hX8K..."
  }'
```

### **3. Deletar todos (cURL)**

```bash
curl -X DELETE https://futi-api-777939995490.us-central1.run.app/api/users/me/push-tokens/all \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 🔧 Implementação no Flutter

### **service/api_service.dart**

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

class ApiService {
  static const String baseUrl = 'https://futi-api-777939995490.us-central1.run.app';

  // Registrar token FCM
  static Future<bool> registerPushToken(String jwtToken, String fcmToken, String platform) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/users/me/push-tokens'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $jwtToken',
        },
        body: jsonEncode({
          'token': fcmToken,
          'platform': platform, // 'ios' ou 'android'
        }),
      );

      return response.statusCode == 204;
    } catch (e) {
      print('Erro ao registrar token: $e');
      return false;
    }
  }

  // Deletar token FCM
  static Future<bool> deletePushToken(String jwtToken, String fcmToken) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/api/users/me/push-tokens'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $jwtToken',
        },
        body: jsonEncode({
          'token': fcmToken,
        }),
      );

      return response.statusCode == 204;
    } catch (e) {
      print('Erro ao deletar token: $e');
      return false;
    }
  }

  // Deletar todos os tokens FCM
  static Future<bool> deleteAllPushTokens(String jwtToken) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/api/users/me/push-tokens/all'),
        headers: {
          'Authorization': 'Bearer $jwtToken',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        print('${data['tokensDeleted']} tokens deletados');
        return true;
      }
      return false;
    } catch (e) {
      print('Erro ao deletar tokens: $e');
      return false;
    }
  }
}
```

### **Uso no Flutter**

```dart
// No login
final jwtToken = await AuthService.login(email, password);
final fcmToken = await FirebaseMessaging.instance.getToken();

if (fcmToken != null) {
  final success = await ApiService.registerPushToken(
    jwtToken,
    fcmToken,
    Platform.isIOS ? 'ios' : 'android',
  );

  if (success) {
    print('✅ Token registrado com sucesso');
  }
}

// No logout
final fcmToken = await FirebaseMessaging.instance.getToken();
if (fcmToken != null) {
  await ApiService.deletePushToken(jwtToken, fcmToken);
}

// Ou deletar de todos os dispositivos
await ApiService.deleteAllPushTokens(jwtToken);
```

---

## 📊 Formato das notificações

### **Notificação de gol**

```json
{
  "notification": {
    "title": "⚽ GOOOL! Cristiano Ronaldo",
    "body": "Flamengo 2 x 1 Palmeiras • 78'"
  },
  "data": {
    "type": "goal",
    "matchId": "cm3w7...",
    "leagueId": "cm3w5...",
    "playerName": "Cristiano Ronaldo",
    "minute": "78"
  }
}
```

### **Notificação de início de partida**

```json
{
  "notification": {
    "title": "🏁 Partida começando!",
    "body": "Flamengo x Palmeiras • 20:00"
  },
  "data": {
    "type": "match_start",
    "matchId": "cm3w7...",
    "leagueId": "cm3w5..."
  }
}
```

### **Notificação de fim de partida**

```json
{
  "notification": {
    "title": "🏆 Partida finalizada!",
    "body": "Flamengo 3 x 1 Palmeiras"
  },
  "data": {
    "type": "match_end",
    "matchId": "cm3w7...",
    "leagueId": "cm3w5..."
  }
}
```

### **Notificação de cartão vermelho**

```json
{
  "notification": {
    "title": "🟥 Cartão vermelho!",
    "body": "Neymar Jr (Palmeiras) expulso aos 85'"
  },
  "data": {
    "type": "red_card",
    "matchId": "cm3w7...",
    "leagueId": "cm3w5...",
    "playerName": "Neymar Jr",
    "minute": "85"
  }
}
```

---

## 🎯 Tipos de notificação

| Tipo            | Campo `data.type` | Descrição                   |
| --------------- | ----------------- | --------------------------- |
| Gol             | `goal`            | Quando um gol é marcado     |
| Início          | `match_start`     | Quando uma partida começa   |
| Fim             | `match_end`       | Quando uma partida termina  |
| Cartão vermelho | `red_card`        | Quando um jogador é expulso |
| Customizada     | `custom`          | Notificação personalizada   |

---

## 🔐 Segurança

- ✅ Todos os endpoints exigem autenticação JWT
- ✅ Usuário só pode gerenciar seus próprios tokens
- ✅ Tokens inválidos são automaticamente removidos
- ✅ Constraint único `(userId, token)` impede duplicatas

---

## 🐛 Debug

### Ver logs de notificações no Cloud Run

```bash
gcloud logging read "resource.type=cloud_run_revision AND textPayload:notification" \
  --limit=50 \
  --project=futi-dev-18acd
```

### Verificar tokens no banco

```sql
-- Ver todos os tokens de um usuário
SELECT * FROM "UserPushToken" WHERE "userId" = 'seu_user_id';

-- Ver quantos tokens cada usuário tem
SELECT "userId", COUNT(*) as total_tokens
FROM "UserPushToken"
GROUP BY "userId"
ORDER BY total_tokens DESC;
```

---

## ⚡ Performance

- **Batch sending**: Até 500 tokens por batch do Firebase
- **Auto cleanup**: Tokens inválidos são removidos automaticamente
- **Non-blocking**: Envio de notificações não bloqueia resposta da API
- **Retry**: Firebase SDK possui retry automático

---

🚀 **Sistema pronto para produção!**
