# ✅ Push Notifications - OpenAPI Atualizado

## 🎯 Alterações Realizadas

### **1. Componente compartilhado criado**

📄 `src/main/docs/push-notifications-openapi.ts`

Contém:

- ✅ Schemas de request/response
- ✅ 4 endpoints documentados
- ✅ Exemplos e descrições completas

---

### **2. Arquivos OpenAPI atualizados** (9 arquivos)

Todos os níveis de acesso agora têm documentação de Push Notifications:

#### ✅ Geral

- `openapi.ts` - Documentação principal completa

#### ✅ Por Role

- `openapi-admin.ts` - Administradores
- `openapi-manager.ts` - Gerentes
- `openapi-player.ts` - Jogadores
- `openapi-fan.ts` - Torcedores
- `openapi-assistant.ts` - Assistentes
- `openapi-league-manager.ts` - Gerentes de Liga
- `openapi-match-manager.ts` - Gerentes de Partida
- `openapi-referee-commission.ts` - Comissão de Árbitros

---

### **3. Endpoints documentados**

#### 📱 **POST /api/users/me/push-tokens**

Registrar token FCM do dispositivo

**Request:**

```json
{
  "token": "fBZdYq_kTL2-P7hX8K9mN3pQ...",
  "platform": "android"
}
```

**Response:** `204 No Content`

---

#### 🗑️ **DELETE /api/users/me/push-tokens**

Deletar token FCM específico (logout)

**Request:**

```json
{
  "token": "fBZdYq_kTL2-P7hX8K9mN3pQ..."
}
```

**Response:** `204 No Content`

---

#### 🗑️ **DELETE /api/users/me/push-tokens/all**

Deletar todos os tokens (logout global)

**Response:**

```json
{
  "success": true,
  "tokensDeleted": 3
}
```

---

#### 📢 **POST /api/topics/subscribe**

Inscrever em tópico (liga, time, etc)

**Request:**

```json
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

#### 📢 **POST /api/topics/unsubscribe**

Desinscrever de tópico

**Request:**

```json
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

## 🔧 Estrutura dos componentes

### **Schemas adicionados:**

- `RegisterPushTokenRequest`
- `DeletePushTokenRequest`
- `DeleteAllPushTokensResponse`
- `SubscribeToTopicRequest`
- `UnsubscribeFromTopicRequest`
- `TopicActionResponse`

### **Tag adicionada:**

```typescript
{
  name: 'Push Notifications',
  description: 'Notificações push via FCM'
}
```

---

## 🚀 Como acessar a documentação

### **Swagger UI disponível em:**

1. **Geral (todas as roles)**

   ```
   http://localhost:3000/api-docs
   ```

2. **Por role específica**
   ```
   http://localhost:3000/api-docs/player
   http://localhost:3000/api-docs/admin
   http://localhost:3000/api-docs/manager
   http://localhost:3000/api-docs/fan
   http://localhost:3000/api-docs/assistant
   http://localhost:3000/api-docs/league-manager
   http://localhost:3000/api-docs/match-manager
   http://localhost:3000/api-docs/referee-commission
   ```

---

## ✅ Status

- ✅ Todos os arquivos atualizados
- ✅ Imports corrigidos (`.js` adicionado)
- ✅ Sem erros de compilação
- ✅ Push Notifications disponível para todas as roles
- ✅ Documentação completa com exemplos

---

## 🎯 Próximos passos

1. Testar endpoints via Swagger UI
2. Implementar no Flutter seguindo `FLUTTER_PUSH_NOTIFICATIONS_GUIDE.md`
3. Deploy da nova versão com documentação atualizada

🎉 **Documentação completa e pronta para uso!**
