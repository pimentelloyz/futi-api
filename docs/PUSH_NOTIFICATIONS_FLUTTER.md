# 📱 Push Notifications - Flutter Integration Guide

## 🎯 Resumo

Sistema de notificações push para avisar quando um gol é marcado na partida.

---

## 📋 Backend - O que já está pronto

✅ **Endpoint para registrar token FCM**: `POST /api/users/push-tokens`
✅ **Sistema automático**: Quando um gol é registrado, todos os usuários interessados recebem notificação
✅ **Firebase Admin SDK**: Configurado e funcionando

---

## 🔧 Flutter - Passo a passo

### 1️⃣ Adicionar dependências no `pubspec.yaml`

```yaml
dependencies:
  firebase_messaging: ^14.7.9
  flutter_local_notifications: ^16.3.0
```

```bash
flutter pub get
```

### 2️⃣ Configurar Firebase Messaging no Flutter

Crie `lib/services/push_notification_service.dart`:

```dart
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class PushNotificationService {
  static final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;
  static final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();

  static const String _apiUrl = 'https://futi-api-777939995490.us-central1.run.app';

  /// Inicializar serviço de notificações
  static Future<void> initialize() async {
    // 1. Solicitar permissão
    NotificationSettings settings = await _firebaseMessaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      print('✅ Permissão de notificação concedida');

      // 2. Obter token FCM
      String? token = await _firebaseMessaging.getToken();
      if (token != null) {
        print('📱 FCM Token: $token');
        await _registerTokenWithBackend(token);
      }

      // 3. Configurar notificações locais
      await _setupLocalNotifications();

      // 4. Listener para quando o token for atualizado
      _firebaseMessaging.onTokenRefresh.listen((newToken) {
        print('🔄 Token atualizado: $newToken');
        _registerTokenWithBackend(newToken);
      });

      // 5. Listener para mensagens quando app está em foreground
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        print('📨 Mensagem recebida em foreground: ${message.notification?.title}');
        _showLocalNotification(message);
      });

      // 6. Listener para quando usuário toca na notificação
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        print('🔔 Notificação tocada: ${message.data}');
        _handleNotificationTap(message);
      });

      // 7. Verificar se app foi aberto por uma notificação
      RemoteMessage? initialMessage = await _firebaseMessaging.getInitialMessage();
      if (initialMessage != null) {
        print('🚀 App aberto por notificação: ${initialMessage.data}');
        _handleNotificationTap(initialMessage);
      }
    } else {
      print('❌ Permissão de notificação negada');
    }
  }

  /// Configurar canal de notificações locais (Android)
  static Future<void> _setupLocalNotifications() async {
    const AndroidInitializationSettings androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const DarwinInitializationSettings iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    const InitializationSettings settings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _localNotifications.initialize(
      settings,
      onDidReceiveNotificationResponse: (NotificationResponse response) {
        print('🔔 Notificação local tocada: ${response.payload}');
        // Navegar para tela da partida
      },
    );

    // Criar canal de notificações de gols (Android)
    const AndroidNotificationChannel goalsChannel = AndroidNotificationChannel(
      'goals', // ID do canal (mesmo do backend!)
      'Gols', // Nome
      description: 'Notificações de gols nas partidas',
      importance: Importance.high,
      sound: RawResourceAndroidNotificationSound('goal_sound'), // Som customizado (opcional)
    );

    await _localNotifications
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(goalsChannel);
  }

  /// Exibir notificação local quando app está aberto
  static Future<void> _showLocalNotification(RemoteMessage message) async {
    RemoteNotification? notification = message.notification;
    AndroidNotification? android = message.notification?.android;

    if (notification != null) {
      await _localNotifications.show(
        notification.hashCode,
        notification.title,
        notification.body,
        const NotificationDetails(
          android: AndroidNotificationDetails(
            'goals', // ID do canal
            'Gols',
            channelDescription: 'Notificações de gols nas partidas',
            importance: Importance.high,
            priority: Priority.high,
            icon: '@mipmap/ic_launcher',
          ),
          iOS: DarwinNotificationDetails(
            presentAlert: true,
            presentBadge: true,
            presentSound: true,
          ),
        ),
        payload: jsonEncode(message.data),
      );
    }
  }

  /// Registrar token no backend
  static Future<void> _registerTokenWithBackend(String token) async {
    try {
      // Obter token JWT do usuário autenticado
      final jwtToken = await _getJwtToken(); // Implemente isso no seu AuthService

      if (jwtToken == null) {
        print('⚠️ Usuário não autenticado, token não registrado');
        return;
      }

      final response = await http.post(
        Uri.parse('$_apiUrl/api/users/push-tokens'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $jwtToken',
        },
        body: jsonEncode({
          'token': token,
          'platform': Platform.isIOS ? 'ios' : 'android',
        }),
      );

      if (response.statusCode == 204 || response.statusCode == 200) {
        print('✅ Token registrado no backend');
      } else {
        print('❌ Erro ao registrar token: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Exceção ao registrar token: $e');
    }
  }

  /// Obter JWT token do usuário (implemente no seu AuthService)
  static Future<String?> _getJwtToken() async {
    // TODO: Buscar token do seu AuthService/SecureStorage
    // Exemplo:
    // return await AuthService.instance.getAccessToken();
    return null;
  }

  /// Lidar com toque na notificação
  static void _handleNotificationTap(RemoteMessage message) {
    final data = message.data;

    if (data['type'] == 'goal') {
      final matchId = data['matchId'];
      // TODO: Navegar para tela da partida
      // Navigator.pushNamed(context, '/match', arguments: matchId);
      print('🎯 Navegar para partida: $matchId');
    }
  }
}
```

### 3️⃣ Inicializar no `main.dart`

```dart
import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart';
import 'services/push_notification_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Inicializar Firebase
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  // Inicializar push notifications
  await PushNotificationService.initialize();

  runApp(MyApp());
}
```

### 4️⃣ Configurar Android

Edite `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET"/>
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS"/> <!-- Android 13+ -->

    <application ...>
        <!-- ... -->

        <!-- Ícone de notificação -->
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_icon"
            android:resource="@mipmap/ic_launcher" />

        <!-- Cor de notificação -->
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_color"
            android:resource="@color/colorPrimary" />

        <!-- Canal de notificação padrão -->
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_channel_id"
            android:value="goals" />
    </application>
</manifest>
```

### 5️⃣ Configurar iOS

Edite `ios/Runner/Info.plist`:

```xml
<key>UIBackgroundModes</key>
<array>
    <string>fetch</string>
    <string>remote-notification</string>
</array>
```

### 6️⃣ Testar notificações

#### Opção 1: Registrar um gol via API

```bash
curl -X POST https://futi-api-777939995490.us-central1.run.app/api/matches/MATCH_ID/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_JWT_TOKEN" \
  -d '{
    "type": "GOAL",
    "minute": 23,
    "teamId": "TEAM_ID",
    "playerId": "PLAYER_ID"
  }'
```

#### Opção 2: Enviar notificação de teste pelo Firebase Console

1. Acesse: https://console.firebase.google.com
2. Vá em **Cloud Messaging**
3. Clique em **Send your first message**
4. Configure a mensagem e envie

---

## 🎨 Customizações opcionais

### Som customizado (Android)

1. Adicione o arquivo de som em `android/app/src/main/res/raw/goal_sound.mp3`
2. Use `RawResourceAndroidNotificationSound('goal_sound')` no código

### Ícone customizado (Android)

1. Crie ícone em `android/app/src/main/res/drawable/ic_notification.png`
2. Use `icon: 'ic_notification'` no código

### Navegar para tela da partida ao tocar

```dart
static void _handleNotificationTap(RemoteMessage message) {
  final data = message.data;

  if (data['type'] == 'goal') {
    final matchId = data['matchId'];

    // Usando GetX
    Get.toNamed('/match/$matchId');

    // Ou usando Navigator
    // navigatorKey.currentState?.pushNamed('/match', arguments: matchId);
  }
}
```

---

## 🐛 Troubleshooting

### Token não está sendo registrado

- Verifique se o JWT está válido
- Confirme que o endpoint está correto
- Veja logs do backend: `gcloud run services logs tail futi-api --region=us-central1`

### Notificações não chegam no Android

- Certifique-se de que o `google-services.json` está atualizado
- Verifique se o canal `goals` foi criado
- Teste com notificação de teste do Firebase Console

### Notificações não chegam no iOS

- Verifique se o certificado APNs está configurado no Firebase
- Confirme que as permissões estão concedidas
- Teste em dispositivo real (não funciona no simulador)

---

## 📊 Métricas e logs

### Ver logs de notificações no backend

```bash
gcloud logging read "resource.type=cloud_run_revision AND textPayload:notification" \
  --limit=50 \
  --project=futi-dev-18acd
```

### Ver quantos tokens estão registrados

```sql
SELECT COUNT(*) FROM "UserPushToken";
```

---

## ✅ Checklist

- [ ] Firebase configurado no Flutter
- [ ] Dependências instaladas
- [ ] `PushNotificationService` criado
- [ ] Service inicializado no `main.dart`
- [ ] AndroidManifest.xml configurado
- [ ] Info.plist configurado (iOS)
- [ ] Testado registro de token
- [ ] Testado recebimento de notificação de gol
- [ ] Navegação ao tocar na notificação funcionando

---

## 🎯 Fluxo completo

1. **Usuário abre o app** → Token FCM é gerado
2. **Token é enviado** para `POST /api/users/push-tokens`
3. **Token é salvo** na tabela `UserPushToken`
4. **Gol é marcado** via `POST /api/matches/:id/events`
5. **Backend busca** todos os usuários interessados
6. **Backend envia** notificação para todos os tokens
7. **Usuário recebe** notificação "⚽ GOOOL! João Silva"
8. **Usuário toca** → App abre na tela da partida

---

Pronto! 🎉 Seu sistema de push notifications está completo!
