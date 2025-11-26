# Guia RBAC para Frontend

## 📋 Visão Geral

Este guia demonstra como integrar o sistema de controle de acesso (RBAC) no frontend da aplicação Futi.

## 🔐 Roles Disponíveis

| Role                   | Valor                | Descrição                          | Escopo  |
| ---------------------- | -------------------- | ---------------------------------- | ------- |
| **FAN**                | `FAN`                | Torcedor (padrão)                  | Global  |
| **PLAYER**             | `PLAYER`             | Jogador                            | Time    |
| **ASSISTANT**          | `ASSISTANT`          | Assistente técnico (read-only)     | Time    |
| **MANAGER**            | `MANAGER`            | Treinador                          | Time    |
| **MATCH_MANAGER**      | `MATCH_MANAGER`      | Gerente de partida                 | Partida |
| **REFEREE_COMMISSION** | `REFEREE_COMMISSION` | Comissão de arbitragem (read-only) | Liga    |
| **LEAGUE_MANAGER**     | `LEAGUE_MANAGER`     | Gerente de liga                    | Liga    |
| **ADMIN**              | `ADMIN`              | Administrador                      | Global  |

## 📡 Endpoint de Autenticação

### GET `/api/access/me`

Retorna informações do usuário autenticado e suas roles.

**Headers:**

```
Authorization: Bearer <JWT_TOKEN>
```

**Resposta de Sucesso (200):**

```json
{
  "user": {
    "id": "user123",
    "email": "usuario@exemplo.com",
    "displayName": "João Silva"
  },
  "memberships": [
    {
      "id": "membership123",
      "role": "MANAGER",
      "teamId": "team456",
      "team": {
        "id": "team456",
        "name": "Time A"
      },
      "leagueId": null,
      "league": null
    }
  ],
  "defaultRole": null // "FAN" se não tiver memberships
}
```

**Quando não tem memberships:**

```json
{
  "user": { ... },
  "memberships": [],
  "defaultRole": "FAN"
}
```

## 🚀 Exemplos de Integração

### 1. React Hook Personalizado

```typescript
// hooks/useRBAC.ts
import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  displayName: string;
}

interface Membership {
  id: string;
  role: string;
  teamId?: string;
  leagueId?: string;
  matchId?: string;
  team?: { id: string; name: string };
  league?: { id: string; name: string };
}

interface RBACData {
  user: User | null;
  memberships: Membership[];
  defaultRole: string | null;
  isLoading: boolean;
  error: string | null;
}

export function useRBAC() {
  const [data, setData] = useState<RBACData>({
    user: null,
    memberships: [],
    defaultRole: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    fetchRBAC();
  }, []);

  async function fetchRBAC() {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/access/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch RBAC data');
      }

      const result = await response.json();
      setData({
        user: result.user,
        memberships: result.memberships,
        defaultRole: result.defaultRole,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setData((prev) => ({
        ...prev,
        isLoading: false,
        error: (error as Error).message,
      }));
    }
  }

  // Helper: Verificar se usuário tem uma role específica
  function hasRole(role: string, context?: { teamId?: string; leagueId?: string }): boolean {
    // ADMIN sempre tem acesso
    if (data.memberships.some((m) => m.role === 'ADMIN')) {
      return true;
    }

    // FAN é o padrão se não tem memberships
    if (role === 'FAN' && data.defaultRole === 'FAN') {
      return true;
    }

    // Verifica memberships com contexto
    return data.memberships.some((membership) => {
      if (membership.role !== role) return false;

      // Se context fornecido, valida
      if (context?.teamId && membership.teamId !== context.teamId) return false;
      if (context?.leagueId && membership.leagueId !== context.leagueId) return false;

      return true;
    });
  }

  // Helper: Verificar se usuário pode modificar (não é read-only)
  function canWrite(): boolean {
    const readOnlyRoles = ['ASSISTANT', 'REFEREE_COMMISSION', 'FAN'];

    // Se tem alguma role que não é read-only, pode escrever
    return data.memberships.some((m) => !readOnlyRoles.includes(m.role));
  }

  // Helper: Obter role de maior prioridade
  function getHighestRole(): string {
    const hierarchy: Record<string, number> = {
      FAN: 0,
      PLAYER: 10,
      ASSISTANT: 20,
      MANAGER: 30,
      MATCH_MANAGER: 35,
      REFEREE_COMMISSION: 40,
      LEAGUE_MANAGER: 50,
      ADMIN: 100,
    };

    if (data.memberships.length === 0) {
      return data.defaultRole || 'FAN';
    }

    return data.memberships.reduce((highest, current) => {
      const currentPriority = hierarchy[current.role] || 0;
      const highestPriority = hierarchy[highest] || 0;
      return currentPriority > highestPriority ? current.role : highest;
    }, 'FAN');
  }

  return {
    ...data,
    hasRole,
    canWrite,
    getHighestRole,
    refetch: fetchRBAC,
  };
}
```

### 2. Componente de Proteção de Rota

```tsx
// components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useRBAC } from '../hooks/useRBAC';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole: string;
  context?: { teamId?: string; leagueId?: string };
  fallback?: string;
}

export function ProtectedRoute({
  children,
  requiredRole,
  context,
  fallback = '/unauthorized',
}: ProtectedRouteProps) {
  const { hasRole, isLoading } = useRBAC();

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  if (!hasRole(requiredRole, context)) {
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
}

// Uso:
<Route
  path="/teams/:teamId/edit"
  element={
    <ProtectedRoute requiredRole="MANAGER">
      <TeamEditPage />
    </ProtectedRoute>
  }
/>;
```

### 3. Renderização Condicional com Roles

```tsx
// components/TeamManagement.tsx
import { useRBAC } from '../hooks/useRBAC';

export function TeamManagement({ teamId }: { teamId: string }) {
  const { hasRole, canWrite } = useRBAC();

  const isManager = hasRole('MANAGER', { teamId });
  const isAssistant = hasRole('ASSISTANT', { teamId });
  const isPlayer = hasRole('PLAYER', { teamId });

  return (
    <div>
      <h1>Gerenciamento do Time</h1>

      {/* Todos podem ver */}
      <TeamInfo teamId={teamId} />

      {/* Apenas MANAGER e ADMIN podem editar */}
      {isManager && canWrite() && <button onClick={handleEdit}>Editar Time</button>}

      {/* ASSISTANT pode ver mas não editar */}
      {isAssistant && <div className="read-only-badge">Modo Visualização (Assistente)</div>}

      {/* PLAYER vê informações limitadas */}
      {isPlayer && !isManager && !isAssistant && <PlayerLimitedView />}
    </div>
  );
}
```

### 4. Tratamento de Erros RBAC

```typescript
// utils/api.ts
export async function apiRequest(url: string, options: RequestInit = {}): Promise<any> {
  const token = localStorage.getItem('authToken');

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();

    // Tratamento específico de erros RBAC
    if (response.status === 403) {
      switch (error.error) {
        case 'INSUFFICIENT_ROLE':
          throw new Error('Você não tem permissão para esta ação');
        case 'READ_ONLY_ROLE':
          throw new Error('Seu perfil é somente leitura');
        case 'WRONG_CONTEXT':
          throw new Error('Você não tem acesso a este recurso');
        default:
          throw new Error('Acesso negado');
      }
    }

    throw new Error(error.message || 'Erro na requisição');
  }

  return response.json();
}
```

### 5. Exemplo Completo de CRUD

```tsx
// pages/LeagueManagementPage.tsx
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useRBAC } from '../hooks/useRBAC';
import { apiRequest } from '../utils/api';

export function LeagueManagementPage() {
  const { leagueId } = useParams();
  const { hasRole, canWrite } = useRBAC();
  const [error, setError] = useState<string | null>(null);

  const isLeagueManager = hasRole('LEAGUE_MANAGER', { leagueId });
  const isAdmin = hasRole('ADMIN');
  const canManage = isLeagueManager || isAdmin;

  async function handleUpdateLeague(data: any) {
    try {
      await apiRequest(`/api/leagues/${leagueId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      alert('Liga atualizada com sucesso!');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleAddTeam(teamId: string) {
    try {
      await apiRequest(`/api/leagues/${leagueId}/teams`, {
        method: 'POST',
        body: JSON.stringify({ teamId }),
      });
      alert('Time adicionado à liga!');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  if (!canManage) {
    return (
      <div className="alert alert-warning">Você não tem permissão para gerenciar esta liga.</div>
    );
  }

  return (
    <div>
      <h1>Gerenciar Liga</h1>

      {error && <div className="alert alert-danger">{error}</div>}

      {canWrite() && (
        <>
          <LeagueEditForm onSubmit={handleUpdateLeague} />
          <AddTeamForm onSubmit={handleAddTeam} />
        </>
      )}

      {!canWrite() && <div className="read-only-message">Você está em modo visualização</div>}
    </div>
  );
}
```

## 📊 Códigos de Erro RBAC

| Código              | Status | Descrição                          |
| ------------------- | ------ | ---------------------------------- |
| `UNAUTHORIZED`      | 401    | Token inválido ou expirado         |
| `FORBIDDEN`         | 403    | Acesso negado                      |
| `INSUFFICIENT_ROLE` | 403    | Role insuficiente para ação        |
| `WRONG_CONTEXT`     | 403    | Sem acesso ao contexto (time/liga) |
| `READ_ONLY_ROLE`    | 403    | Role é somente leitura             |
| `INVALID_CONTEXT`   | 400    | Contexto inválido na requisição    |

## 🎨 UI/UX Recomendações

### 1. Indicadores Visuais de Role

```tsx
function RoleBadge({ role }: { role: string }) {
  const colors = {
    ADMIN: 'red',
    LEAGUE_MANAGER: 'purple',
    MANAGER: 'blue',
    ASSISTANT: 'gray',
    PLAYER: 'green',
    MATCH_MANAGER: 'orange',
    REFEREE_COMMISSION: 'yellow',
    FAN: 'lightgray',
  };

  return <span className={`badge badge-${colors[role]}`}>{role}</span>;
}
```

### 2. Desabilitar Botões ao Invés de Ocultar

```tsx
<button
  onClick={handleEdit}
  disabled={!canWrite()}
  title={!canWrite() ? 'Você não tem permissão para editar' : ''}
>
  Editar
</button>
```

### 3. Mensagens Contextuais

```tsx
{
  !hasRole('MANAGER', { teamId }) && (
    <div className="info-message">
      💡 Apenas treinadores podem editar informações do time. Entre em contato com o administrador
      para solicitar acesso.
    </div>
  );
}
```

## 🔄 Fluxos Comuns

### Fluxo 1: Usuário sem Role (FAN)

```
1. Usuário faz login
2. GET /api/access/me → { defaultRole: "FAN", memberships: [] }
3. Frontend mostra apenas conteúdo público
4. Botão "Solicitar Acesso" visível
```

### Fluxo 2: Jogador Acessando Time

```
1. GET /api/access/me → membership com role=PLAYER, teamId=X
2. Frontend permite visualizar /teams/X/players
3. Bloqueia edição de informações do time
4. Permite ver próprias estatísticas
```

### Fluxo 3: Manager Editando Time

```
1. GET /api/access/me → membership com role=MANAGER, teamId=X
2. Verifica hasRole('MANAGER', { teamId: X }) = true
3. PATCH /api/teams/X → Sucesso
4. Tenta PATCH /api/teams/Y → 403 WRONG_CONTEXT
```

### Fluxo 4: Assistente (Read-Only)

```
1. GET /api/access/me → membership com role=ASSISTANT
2. canWrite() → false
3. Frontend desabilita todos os botões de edição
4. Mostra badge "Modo Visualização"
```

## 📞 Suporte

Para dúvidas sobre RBAC:

- Consulte `RBAC.md` para documentação completa
- Consulte `RBAC_IMPLEMENTATION.md` para detalhes técnicos

## ✅ Checklist de Implementação

- [ ] Implementar `useRBAC` hook
- [ ] Criar componente `ProtectedRoute`
- [ ] Adicionar tratamento de erros RBAC
- [ ] Implementar indicadores visuais de role
- [ ] Testar todos os fluxos de permissão
- [ ] Adicionar mensagens contextuais
- [ ] Implementar "Solicitar Acesso" para FANs
- [ ] Documentar casos de uso específicos
