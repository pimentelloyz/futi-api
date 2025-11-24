# 🔔 Push Notifications - Guia de Implementação Flutter

## 📡 API Base URL

```
https://futi-api-777939995490.us-central1.run.app
```

---

## 🔐 Autenticação

Todos os endpoints requerem header de autenticação:

```
Authorization: Bearer {JWT_TOKEN}
```

---

## 1️⃣ REGISTRAR TOKEN FCM

### Endpoint

```
POST /api/users/me/push-tokens
```

### Request Headers

```
Content-Type: application/json
Authorization: Bearer {JWT_TOKEN}
```

### Request Body

```json
{
  "token": "fBZdYq_kTL2-P7hX8K9mN3pQ...",
  "platform": "android"
}
```

**Campos:**

- `token` (string, obrigatório): Token FCM do dispositivo
- `platform` (string, obrigatório): `"ios"`, `"android"` ou `"web"`

### Response

**Status: 204 No Content** (Sucesso)

**Status: 400 Bad Request** (Dados inválidos)

```json
{
  "error": "Dados inválidos",
  "details": [
    {
      "code": "invalid_type",
      "expected": "string",
      "received": "undefined",
      "path": ["token"],
      "message": "Required"
    }
  ]
}
```

**Status: 401 Unauthorized** (Token JWT inválido)

```json
{
  "error": "Não autorizado"
}
```

### Exemplo Flutter

```dart
Future<bool> registerPushToken(String jwtToken, String fcmToken, String platform) async {
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
}
```

---

## 2️⃣ DELETAR TOKEN FCM

### Endpoint

```
DELETE /api/users/me/push-tokens
```

### Request Headers

```
Content-Type: application/json
Authorization: Bearer {JWT_TOKEN}
```

### Request Body

```json
{
  "token": "fBZdYq_kTL2-P7hX8K9mN3pQ..."
}
```

**Campos:**

- `token` (string, obrigatório): Token FCM a ser deletado

### Response

**Status: 204 No Content** (Sucesso - token deletado)

**Status: 404 Not Found** (Token não encontrado)

```json
{
  "error": "Token não encontrado"
}
```

**Status: 401 Unauthorized** (Token JWT inválido)

```json
{
  "error": "Não autorizado"
}
```

### Exemplo Flutter

```dart
Future<bool> deletePushToken(String jwtToken, String fcmToken) async {
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
}
```

---

## 3️⃣ DELETAR TODOS OS TOKENS

### Endpoint

```
DELETE /api/users/me/push-tokens/all
```

### Request Headers

```
Authorization: Bearer {JWT_TOKEN}
```

### Request Body

Nenhum

### Response

**Status: 200 OK** (Sucesso)

```json
{
  "success": true,
  "tokensDeleted": 3
}
```

**Campos:**

- `success` (boolean): Sempre `true`
- `tokensDeleted` (number): Quantidade de tokens deletados

**Status: 401 Unauthorized** (Token JWT inválido)

```json
{
  "error": "Não autorizado"
}
```

### Exemplo Flutter

```dart
Future<int> deleteAllPushTokens(String jwtToken) async {
  final response = await http.delete(
    Uri.parse('$baseUrl/api/users/me/push-tokens/all'),
    headers: {
      'Authorization': 'Bearer $jwtToken',
    },
  );

  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    return data['tokensDeleted'] as int;
  }
  return 0;
}
```

---

## 4️⃣ INSCREVER EM TÓPICO

### Endpoint

```
POST /api/topics/subscribe
```

### Request Headers

```
Content-Type: application/json
Authorization: Bearer {JWT_TOKEN}
```

### Request Body

```json
{
  "topic": "league_cm3w5xyz789"
}
```

**Campos:**

- `topic` (string, obrigatório): Nome do tópico

**Exemplos de tópicos:**

- `league_{leagueId}` - Ex: `league_cm3w5xyz789`
- `team_{teamId}` - Ex: `team_cm3w7abc123`
- `match_{matchId}` - Ex: `match_cm3w8def456`

### Response

**Status: 200 OK** (Sucesso)

```json
{
  "success": true
}
```

**Status: 400 Bad Request** (Dados inválidos)

```json
{
  "error": "Dados inválidos",
  "details": [...]
}
```

**Status: 401 Unauthorized** (Token JWT inválido)

```json
{
  "error": "Não autorizado"
}
```

### Exemplo Flutter

```dart
Future<bool> subscribeToTopic(String jwtToken, String topic) async {
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

  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    return data['success'] as bool;
  }
  return false;
}

// Uso
await subscribeToTopic(jwtToken, 'league_$leagueId');
await subscribeToTopic(jwtToken, 'team_$teamId');
```

---

## 5️⃣ DESINSCREVER DE TÓPICO

### Endpoint

```
POST /api/topics/unsubscribe
```

### Request Headers

```
Content-Type: application/json
Authorization: Bearer {JWT_TOKEN}
```

### Request Body

```json
{
  "topic": "league_cm3w5xyz789"
}
```

**Campos:**

- `topic` (string, obrigatório): Nome do tópico

### Response

**Status: 200 OK** (Sucesso)

```json
{
  "success": true
}
```

**Status: 400 Bad Request** (Dados inválidos)

```json
{
  "error": "Dados inválidos",
  "details": [...]
}
```

**Status: 401 Unauthorized** (Token JWT inválido)

```json
{
  "error": "Não autorizado"
}
```

### Exemplo Flutter

```dart
Future<bool> unsubscribeFromTopic(String jwtToken, String topic) async {
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

  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    return data['success'] as bool;
  }
  return false;
}
```

---

## 📱 FORMATOS DE NOTIFICAÇÃO RECEBIDAS

### Notificação de Gol

```json
{
  "notification": {
    "title": "⚽ GOOOL! Cristiano Ronaldo",
    "body": "Flamengo 2 x 1 Palmeiras • 78'"
  },
  "data": {
    "type": "goal",
    "matchId": "cm3w7abc123",
    "leagueId": "cm3w5xyz789",
    "playerName": "Cristiano Ronaldo",
    "minute": "78"
  }
}
```

### Notificação de Início de Partida

```json
{
  "notification": {
    "title": "🏁 Partida começando!",
    "body": "Flamengo x Palmeiras • 20:00"
  },
  "data": {
    "type": "match_start",
    "matchId": "cm3w7abc123",
    "leagueId": "cm3w5xyz789"
  }
}
```

### Notificação de Fim de Partida

```json
{
  "notification": {
    "title": "🏆 Partida finalizada!",
    "body": "Flamengo 3 x 1 Palmeiras"
  },
  "data": {
    "type": "match_end",
    "matchId": "cm3w7abc123",
    "leagueId": "cm3w5xyz789"
  }
}
```

### Notificação de Cartão Vermelho

```json
{
  "notification": {
    "title": "🟥 Cartão vermelho!",
    "body": "Neymar Jr (Palmeiras) expulso aos 85'"
  },
  "data": {
    "type": "red_card",
    "matchId": "cm3w7abc123",
    "leagueId": "cm3w5xyz789",
    "playerName": "Neymar Jr",
    "minute": "85"
  }
}
```

---

## 🔧 IMPLEMENTAÇÃO COMPLETA NO FLUTTER

### 1. Service de API

```dart
// lib/services/push_notification_api_service.dart

import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:io';

class PushNotificationApiService {
  static const String baseUrl = 'https://futi-api-777939995490.us-central1.run.app';

  /// Registrar token FCM no backend
  static Future<bool> registerToken({
    required String jwtToken,
    required String fcmToken,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/users/me/push-tokens'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $jwtToken',
        },
        body: jsonEncode({
          'token': fcmToken,
          'platform': Platform.isIOS ? 'ios' : 'android',
        }),
      );

      return response.statusCode == 204;
    } catch (e) {
      print('❌ Erro ao registrar token: $e');
      return false;
    }
  }

  /// Deletar token FCM específico
  static Future<bool> deleteToken({
    required String jwtToken,
    required String fcmToken,
  }) async {
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
      print('❌ Erro ao deletar token: $e');
      return false;
    }
  }

  /// Deletar todos os tokens do usuário
  static Future<int> deleteAllTokens({
    required String jwtToken,
  }) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/api/users/me/push-tokens/all'),
        headers: {
          'Authorization': 'Bearer $jwtToken',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['tokensDeleted'] as int;
      }
      return 0;
    } catch (e) {
      print('❌ Erro ao deletar todos os tokens: $e');
      return 0;
    }
  }

  /// Inscrever em tópico
  static Future<bool> subscribeToTopic({
    required String jwtToken,
    required String topic,
  }) async {
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

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['success'] as bool;
      }
      return false;
    } catch (e) {
      print('❌ Erro ao inscrever em tópico: $e');
      return false;
    }
  }

  /// Desinscrever de tópico
  static Future<bool> unsubscribeFromTopic({
    required String jwtToken,
    required String topic,
  }) async {
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

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['success'] as bool;
      }
      return false;
    } catch (e) {
      print('❌ Erro ao desinscrever de tópico: $e');
      return false;
    }
  }

  /// Helpers para gerar nomes de tópicos
  static String getLeagueTopic(String leagueId) => 'league_$leagueId';
  static String getTeamTopic(String teamId) => 'team_$teamId';
  static String getMatchTopic(String matchId) => 'match_$matchId';
}
```

### 2. Uso no Login

```dart
// Após login bem-sucedido
final jwtToken = await AuthService.login(email, password);
final fcmToken = await FirebaseMessaging.instance.getToken();

if (fcmToken != null) {
  final success = await PushNotificationApiService.registerToken(
    jwtToken: jwtToken,
    fcmToken: fcmToken,
  );

  if (success) {
    print('✅ Token FCM registrado no backend');
  } else {
    print('⚠️ Falha ao registrar token FCM');
  }
}
```

### 3. Uso no Logout

```dart
// Ao fazer logout
final jwtToken = await AuthService.getToken();
final fcmToken = await FirebaseMessaging.instance.getToken();

if (fcmToken != null) {
  await PushNotificationApiService.deleteToken(
    jwtToken: jwtToken,
    fcmToken: fcmToken,
  );
}

// Ou deletar de todos os dispositivos
await PushNotificationApiService.deleteAllTokens(jwtToken: jwtToken);
```

### 4. Uso ao Entrar em Liga

```dart
// Quando usuário entra em uma liga
final jwtToken = await AuthService.getToken();
final leagueTopic = PushNotificationApiService.getLeagueTopic(leagueId);

await PushNotificationApiService.subscribeToTopic(
  jwtToken: jwtToken,
  topic: leagueTopic,
);
```

### 5. Uso ao Sair de Liga

```dart
// Quando usuário sai de uma liga
final jwtToken = await AuthService.getToken();
final leagueTopic = PushNotificationApiService.getLeagueTopic(leagueId);

await PushNotificationApiService.unsubscribeFromTopic(
  jwtToken: jwtToken,
  topic: leagueTopic,
);
```

### 6. Handler de Notificações

```dart
// lib/services/notification_handler.dart

class NotificationHandler {
  static void handleNotification(RemoteMessage message) {
    final type = message.data['type'];

    switch (type) {
      case 'goal':
        _handleGoalNotification(message);
        break;
      case 'match_start':
        _handleMatchStartNotification(message);
        break;
      case 'match_end':
        _handleMatchEndNotification(message);
        break;
      case 'red_card':
        _handleRedCardNotification(message);
        break;
      default:
        print('Tipo de notificação desconhecido: $type');
    }
  }

  static void _handleGoalNotification(RemoteMessage message) {
    final matchId = message.data['matchId'];
    final playerName = message.data['playerName'];

    // Navegar para tela da partida
    Get.toNamed('/match/$matchId');
  }

  static void _handleMatchStartNotification(RemoteMessage message) {
    final matchId = message.data['matchId'];

    // Navegar para tela da partida
    Get.toNamed('/match/$matchId');
  }

  static void _handleMatchEndNotification(RemoteMessage message) {
    final matchId = message.data['matchId'];

    // Navegar para tela da partida
    Get.toNamed('/match/$matchId');
  }

  static void _handleRedCardNotification(RemoteMessage message) {
    final matchId = message.data['matchId'];

    // Navegar para tela da partida
    Get.toNamed('/match/$matchId');
  }
}
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Adicionar `http` package no `pubspec.yaml`
- [ ] Criar `PushNotificationApiService`
- [ ] Registrar token no login
- [ ] Deletar token no logout
- [ ] Inscrever em tópicos ao entrar em liga/time
- [ ] Desinscrever de tópicos ao sair de liga/time
- [ ] Implementar handler de notificações
- [ ] Testar recebimento de notificações
- [ ] Testar navegação ao tocar na notificação

---

## 🐛 TROUBLESHOOTING

### Token não está sendo registrado

- Verificar se JWT está válido
- Confirmar que FCM token foi gerado
- Verificar resposta da API (status code)

### Notificações não chegam

- Confirmar que token foi registrado no backend
- Verificar se usuário está na liga/time
- Testar com Firebase Console

### Erro 401 Unauthorized

- JWT expirado - renovar token
- JWT inválido - fazer login novamente

---

🚀 **Pronto para implementar no Flutter!**
