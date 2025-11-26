# 📨 Fluxo de Convites de Liga - Guia de Implementação Flutter

## 📖 Visão Geral

Este documento descreve o fluxo completo de gerenciamento de convites para ligas no aplicativo futi. Após criar uma liga e selecionar o formato (ex: Libertadores), o próximo passo é convidar times para participar.

## 🎯 Contexto

**Persona 1 - Administrador da Liga (MANAGER/ADMIN)**

- Criou uma liga com formato específico (Libertadores, Copa do Brasil, etc)
- Precisa convidar times para completar a competição
- Gerencia códigos de convite

**Persona 2 - Manager de Time**

- Recebeu código de convite via compartilhamento
- Precisa vincular seu time à liga
- Aceita o convite em nome do time

---

## 🛠️ Endpoints Disponíveis

Todos os endpoints já estão implementados na API:

| Método   | Endpoint                            | Descrição                           | Autenticação |
| -------- | ----------------------------------- | ----------------------------------- | ------------ |
| `POST`   | `/api/invites/league`               | Criar convite de liga               | Bearer Token |
| `GET`    | `/api/invites/league?leagueId={id}` | Listar convites da liga             | Bearer Token |
| `DELETE` | `/api/invites/league/{id}`          | Revogar convite                     | Bearer Token |
| `POST`   | `/api/invites/league/accept`        | Aceitar convite (vincular time)     | Bearer Token |
| `GET`    | `/api/access/me`                    | Listar times que o usuário gerencia | Bearer Token |

---

## 📋 Implementação - Parte 1: Gerenciamento de Convites

### **Tela: "Gerenciar Convites da Liga"**

**Objetivo:** Permitir que administradores criem, listem e compartilhem convites para a liga.

#### Funcionalidades

##### 1️⃣ CRIAR CONVITE

**Interface:**

```
- Botão FAB (+) "Criar Novo Convite"
- Modal/Bottom Sheet com formulário:
  * Liga (pré-selecionada, readonly, exibir nome)
  * Número máximo de usos (campo numérico, padrão: 1)
  * Data de expiração (date picker, opcional)
  * Botões: Cancelar / Criar
```

**Requisição:**

```http
POST /api/invites/league
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "leagueId": "clxxx123",
  "maxUses": 3,
  "expiresAt": "2025-12-31T23:59:59Z"  // opcional
}
```

**Resposta 201:**

```json
{
  "id": "inv_abc123",
  "code": "LIGA2025XYZ",
  "leagueId": "clxxx123",
  "maxUses": 3,
  "uses": 0,
  "isActive": true,
  "expiresAt": "2025-12-31T23:59:59.000Z",
  "createdAt": "2025-11-19T10:30:00.000Z"
}
```

**Validações:**

- `leagueId` é obrigatório
- `maxUses` deve ser > 0 (se fornecido)
- `expiresAt` deve ser data futura (se fornecido)

---

##### 2️⃣ LISTAR CONVITES ATIVOS

**Interface:**

```
- Lista de cards com convites
- Cada card mostra:
  * Código do convite (fonte monoespaçada, destaque)
  * Progresso de usos: "2/5 usos"
  * Status: Badge verde "Ativo" ou cinza "Expirado"
  * Data de expiração (se houver)
  * Botões: [Compartilhar] [Revogar]
```

**Requisição:**

```http
GET /api/invites/league?leagueId=clxxx123
Authorization: Bearer {accessToken}
```

**Resposta 200:**

```json
{
  "items": [
    {
      "id": "inv_abc123",
      "code": "LIGA2025XYZ",
      "leagueId": "clxxx123",
      "createdBy": "user_456",
      "maxUses": 3,
      "uses": 2,
      "isActive": true,
      "expiresAt": "2025-12-31T23:59:59.000Z",
      "createdAt": "2025-11-19T10:30:00.000Z"
    }
  ]
}
```

**Lógica de exibição:**

- Ordenar por `createdAt` DESC (mais recentes primeiro)
- Filtrar apenas `isActive: true` (opcional)
- Mostrar badge "Expirado" se `expiresAt` < now

---

##### 3️⃣ COMPARTILHAR CONVITE

**Ação:** Botão "Compartilhar" ao lado de cada código

**Implementação Flutter:**

```dart
import 'package:share_plus/share_plus.dart';

Future<void> compartilharConvite(String codigo, String nomeLiga) async {
  final mensagem = '''
🏆 Você foi convidado para participar da liga $nomeLiga!

Use o código abaixo no app futi para entrar:
$codigo

Baixe o app: https://futi.app
''';

  await Share.share(mensagem, subject: 'Convite - Liga $nomeLiga');
}
```

**Canais de compartilhamento:**

- WhatsApp
- Telegram
- Email
- SMS
- Copiar código (clipboard)

---

##### 4️⃣ REVOGAR CONVITE

**Interface:**

```
- Botão vermelho "Revogar" em cada card
- Dialog de confirmação:
  "Tem certeza que deseja revogar este convite?
   Ele não poderá mais ser usado."
  [Cancelar] [Revogar]
```

**Requisição:**

```http
DELETE /api/invites/league/{id}
Authorization: Bearer {accessToken}
```

**Resposta 204:** (sem body)

**Feedback:**

- SnackBar: "Convite revogado com sucesso"
- Remover item da lista

---

#### Layout Sugerido

```
┌──────────────────────────────────────┐
│ ← Convites - Liga Libertadores 2025 │ AppBar
├──────────────────────────────────────┤
│                                      │
│  ┌────────────────────────────────┐ │
│  │ 🎟️  LIGA2025XYZ               │ │
│  │                                │ │
│  │ 2/5 usos  ●Ativo              │ │
│  │ Expira em: 31/12/2025         │ │
│  │                                │ │
│  │ [📤 Compartilhar] [🗑️ Revogar] │ │
│  └────────────────────────────────┘ │
│                                      │
│  ┌────────────────────────────────┐ │
│  │ 🎟️  COPA2025ABC               │ │
│  │                                │ │
│  │ 0/3 usos  ●Ativo              │ │
│  │ Sem expiração                  │ │
│  │                                │ │
│  │ [📤 Compartilhar] [🗑️ Revogar] │ │
│  └────────────────────────────────┘ │
│                                      │
│                              [+] FAB │
└──────────────────────────────────────┘
```

---

## 📋 Implementação - Parte 2: Aceitar Convite

### **Tela: "Aceitar Convite de Liga"**

**Objetivo:** Permitir que managers de times aceitem convites e vinculem seus times à liga.

#### Funcionalidades

##### 1️⃣ FORMULÁRIO DE ACEITE

**Interface:**

```
- Campo texto: "Código do Convite"
  * Placeholder: "Ex: LIGA2025XYZ"
  * Uppercase automático
  * Trim spaces
- Dropdown: "Selecionar Time"
  * Lista dos times que o usuário gerencia
  * Placeholder: "Escolha um time"
- Botão: "Entrar na Liga" (primary, full-width)
```

**Validações:**

- Código não pode estar vazio
- Time deve estar selecionado
- Habilitar botão apenas quando ambos preenchidos

---

##### 2️⃣ BUSCAR TIMES DO USUÁRIO

**Requisição:**

```http
GET /api/access/me
Authorization: Bearer {accessToken}
```

**Resposta 200:**

```json
{
  "memberships": [
    {
      "id": "mem_1",
      "userId": "user_456",
      "teamId": "team_abc",
      "role": "MANAGER",
      "team": {
        "id": "team_abc",
        "name": "FC Barcelona",
        "icon": "https://...",
        "isActive": true
      }
    },
    {
      "id": "mem_2",
      "userId": "user_456",
      "teamId": "team_xyz",
      "role": "PLAYER",
      "team": {
        "id": "team_xyz",
        "name": "Real Madrid",
        "icon": "https://...",
        "isActive": true
      }
    }
  ]
}
```

**Lógica de filtro:**

```dart
final timesGerenciados = memberships
    .where((m) => m.role == 'MANAGER' && m.team != null && m.team.isActive)
    .map((m) => m.team)
    .toList();
```

---

##### 3️⃣ ACEITAR CONVITE

**Requisição:**

```http
POST /api/invites/league/accept
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "code": "LIGA2025XYZ",
  "teamId": "team_abc"
}
```

**Resposta 200:**

```json
{
  "message": "Time vinculado com sucesso",
  "leagueId": "clxxx123"
}
```

**Fluxo após sucesso:**

1. Mostrar SnackBar: "Time vinculado à liga com sucesso! 🎉"
2. Navegar para tela de detalhes da liga
3. Limpar formulário (se voltar)

---

##### 4️⃣ TRATAMENTO DE ERROS

| Status | Mensagem ao Usuário                  | Ação                              |
| ------ | ------------------------------------ | --------------------------------- |
| 400    | "Código inválido ou expirado"        | Verificar código digitado         |
| 403    | "Você não é manager deste time"      | Selecionar outro time             |
| 404    | "Código não encontrado"              | Verificar se código está correto  |
| 409    | "Este time já está nesta liga"       | Informar que já está participando |
| 500    | "Erro ao processar. Tente novamente" | Retry                             |

**Implementação:**

```dart
try {
  final response = await api.aceitarConviteLiga(codigo, teamId);
  // Sucesso...
} on ApiException catch (e) {
  String mensagem;
  switch (e.statusCode) {
    case 400:
      mensagem = 'Código inválido ou expirado';
      break;
    case 403:
      mensagem = 'Você não é manager deste time';
      break;
    case 404:
      mensagem = 'Código não encontrado';
      break;
    case 409:
      mensagem = 'Este time já está nesta liga';
      break;
    default:
      mensagem = 'Erro ao processar. Tente novamente';
  }
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text(mensagem))
  );
}
```

---

#### Layout Sugerido

```
┌──────────────────────────────────────┐
│ ← Aceitar Convite de Liga           │ AppBar
├──────────────────────────────────────┤
│                                      │
│  🎟️ Código do Convite               │
│  ┌────────────────────────────────┐ │
│  │ LIGA2025XYZ                    │ │ TextField
│  └────────────────────────────────┘ │
│                                      │
│  ⚽ Selecionar Time                  │
│  ┌────────────────────────────────┐ │
│  │ FC Barcelona             ▼     │ │ Dropdown
│  └────────────────────────────────┘ │
│                                      │
│  ┌────────────────────────────────┐ │
│  │      Entrar na Liga            │ │ Button
│  └────────────────────────────────┘ │
│                                      │
│  ℹ️ Digite o código recebido e      │
│     selecione seu time para entrar  │
│     na competição                   │
│                                      │
└──────────────────────────────────────┘
```

---

## 📋 Implementação - Parte 3: Widget de Status

### **Widget: "StatusConvitesLiga"**

**Objetivo:** Exibir resumo de convites e times na tela de detalhes da liga (apenas para MANAGER/ADMIN).

#### Dados Necessários

**Requisições:**

```http
GET /api/invites/league?leagueId={id}
GET /api/leagues/{id}
```

**Calcular:**

- Total de convites ativos: `items.filter(i => i.isActive).length`
- Total de times na liga: `league.teams.length`
- Meta de times: baseado no formato (ex: Libertadores = 32 times)

---

#### Interface

```
┌────────────────────────────────────┐
│ 📨 Convites e Times                │
├────────────────────────────────────┤
│                                    │
│  🎟️  3 convites ativos            │
│  ⚽  12/32 times confirmados       │
│                                    │
│  ████████░░░░░░░░  37.5%          │ Progress Bar
│                                    │
│  [ Gerenciar Convites → ]         │
│                                    │
└────────────────────────────────────┘
```

**Indicadores visuais:**

- ✅ Verde: >= 100% dos times confirmados
- 🟡 Amarelo: 50-99% dos times confirmados
- 🔴 Vermelho: < 50% dos times confirmados
- ⚠️ Ícone de alerta se nenhum convite ativo

**Ação:** Tap no card → navega para tela "Gerenciar Convites da Liga"

---

## 🔐 Autenticação

Todos os endpoints requerem autenticação via Bearer Token:

```http
Authorization: Bearer {accessToken}
```

**Obter token:**

- Login via Firebase: `POST /api/auth/firebase/exchange`
- Refresh token: `POST /api/auth/refresh`

---

## 🎨 UI/UX Guidelines

### Estados de Loading

- **Lista de convites:** Skeleton loader com 3 cards
- **Criar convite:** Botão com CircularProgressIndicator
- **Aceitar convite:** Botão desabilitado + loading
- **Revogar convite:** Dialog com loading overlay

### Feedback Visual

- **Sucesso:** SnackBar verde com ícone ✓
- **Erro:** SnackBar vermelho com ícone ⚠️
- **Info:** SnackBar azul com ícone ℹ️

### Acessibilidade

- Labels descritivos em todos os campos
- Semantics para screen readers
- Contraste adequado (WCAG AA)
- Tamanho mínimo de toque: 44x44dp

---

## 🧪 Casos de Teste

### Cenário 1: Criar e Compartilhar Convite

1. ✅ Manager acessa "Gerenciar Convites"
2. ✅ Clica em FAB (+)
3. ✅ Preenche formulário (3 usos, expira em 7 dias)
4. ✅ Convite criado com sucesso
5. ✅ Clica em "Compartilhar"
6. ✅ Abre menu de compartilhamento do sistema

### Cenário 2: Aceitar Convite

1. ✅ Manager de time recebe código "LIGA2025XYZ"
2. ✅ Acessa "Aceitar Convite"
3. ✅ Digita código (convertido para uppercase)
4. ✅ Seleciona time "FC Barcelona"
5. ✅ Clica em "Entrar na Liga"
6. ✅ Time vinculado com sucesso
7. ✅ Navega para tela da liga

### Cenário 3: Convite Expirado

1. ✅ Manager tenta aceitar convite expirado
2. ✅ API retorna 400
3. ✅ SnackBar exibe "Código inválido ou expirado"
4. ✅ Foco volta para campo de código

### Cenário 4: Time Já na Liga

1. ✅ Manager tenta aceitar convite novamente
2. ✅ API retorna 409
3. ✅ SnackBar exibe "Este time já está nesta liga"
4. ✅ Botão "Ver Liga" aparece

---

## 📚 State Management

### Sugestão GetX

```dart
class ConvitesLigaController extends GetxController {
  final convites = <ConviteLiga>[].obs;
  final isLoading = false.obs;

  Future<void> buscarConvites(String leagueId) async {
    isLoading.value = true;
    try {
      final response = await api.listarConvitesLiga(leagueId);
      convites.value = response.items;
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> criarConvite({
    required String leagueId,
    required int maxUses,
    DateTime? expiresAt,
  }) async {
    // ...
  }

  Future<void> revogarConvite(String id) async {
    // ...
  }
}
```

---

## 🚀 Próximos Passos (Roadmap)

Após implementar o fluxo de convites, os próximos passos seriam:

1. **Configurar Grupos** (para formato Libertadores)
   - Distribuir times pelos grupos (A, B, C, etc)
   - `POST /api/leagues/{id}/groups`

2. **Gerar Calendário de Jogos**
   - Criar fixtures baseado no formato
   - `POST /api/leagues/{id}/generate-matches`

3. **Gerenciar Partidas**
   - Definir datas/horários/locais
   - `PATCH /api/matches/{id}`

4. **Iniciar Liga**
   - Mudar status para "EM_ANDAMENTO"
   - `PATCH /api/leagues/{id}`

---

## 📞 Suporte

- **Documentação API:** `http://localhost:3000/docs/all`
- **Docs Player App:** `http://localhost:3000/docs/player`
- **Repositório:** github.com/pimentelloyz/futi-api

---

**Versão:** 1.0.0  
**Última Atualização:** 19 de novembro de 2025
