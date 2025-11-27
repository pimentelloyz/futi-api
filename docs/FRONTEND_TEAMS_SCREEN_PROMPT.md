# Prompt: Tela de Times Cadastrados e Convites

## Contexto
Criar uma tela no app mobile que exibe os times de uma liga, dividida em duas seções: times que já aceitaram o convite e convites pendentes.

## Requisitos

### Navegação
- Na home do app, ao clicar no card "Times Cadastrados", navegar para a tela de times da liga
- Passar o `leagueId` como parâmetro de navegação

### Layout da Tela

#### Header
- Título: "Times da Liga"
- Botão voltar (voltar para home)
- (Opcional) Botão "+" para convidar novo time (apenas para managers/admins)

#### Seção 1: Times Cadastrados
- Título: "Times Participantes" ou "Times Confirmados"
- Lista de cards com:
  - Logo/ícone do time
  - Nome do time
  - Número de jogadores (se disponível)
  - Badge de status: "Ativo" / "Inativo"
- Estado vazio: "Nenhum time cadastrado ainda"

#### Seção 2: Convites Pendentes
- Título: "Convites Enviados"
- Lista de cards com:
  - Nome do time convidado
  - Status: "Aguardando resposta"
  - Data do convite (formato relativo: "há 2 dias")
  - Botão de ações (3 pontos) para revogar convite (apenas managers/admins)
- Estado vazio: "Nenhum convite pendente"
- Exibir apenas se usuário for manager ou admin da liga

### Endpoints da API

#### 1. Listar Times Cadastrados
```
GET /api/leagues/{leagueId}/teams
```
**Headers:**
```json
{
  "Authorization": "Bearer {token}"
}
```

**Response 200:**
```json
{
  "items": [
    {
      "id": "team-uuid",
      "name": "Nome do Time",
      "isActive": true,
      "icon": "url-da-imagem",
      "playerCount": 15
    }
  ]
}
```

#### 2. Listar Convites Pendentes
```
GET /api/invites/league?leagueId={leagueId}
```
**Headers:**
```json
{
  "Authorization": "Bearer {token}"
}
```

**Response 200:**
```json
{
  "items": [
    {
      "id": "invite-uuid",
      "teamId": "team-uuid",
      "teamName": "Nome do Time",
      "status": "PENDING",
      "createdAt": "2025-11-24T10:00:00Z",
      "expiresAt": "2025-12-24T10:00:00Z"
    }
  ]
}
```

**Possíveis Status:**
- `PENDING`: Convite enviado, aguardando resposta
- `ACCEPTED`: Convite aceito (não deve aparecer aqui, vai para times cadastrados)
- `EXPIRED`: Convite expirado
- `REVOKED`: Convite revogado

### Lógica de Implementação

```typescript
// 1. Carregar dados ao abrir a tela
async function loadTeamsAndInvitations(leagueId: string) {
  try {
    setLoading(true);
    
    // Buscar times cadastrados (sempre visível)
    const teamsResponse = await api.get(`/leagues/${leagueId}/teams`);
    setAcceptedTeams(teamsResponse.data.items || []);
    
    // Buscar convites apenas se for manager/admin
    if (isLeagueManager || isAdmin) {
      const invitesResponse = await api.get(
        `/invites/league?leagueId=${leagueId}`
      );
      
      // Filtrar apenas convites pendentes
      const pending = invitesResponse.data.items.filter(
        (invite) => invite.status === 'PENDING'
      );
      setPendingInvitations(pending);
    }
  } catch (error) {
    showError('Erro ao carregar times');
  } finally {
    setLoading(false);
  }
}

// 2. Revogar convite (apenas managers/admins)
async function revokeInvitation(inviteId: string) {
  try {
    await api.delete(`/invites/league/${inviteId}`);
    // Recarregar lista
    await loadTeamsAndInvitations(leagueId);
    showSuccess('Convite revogado com sucesso');
  } catch (error) {
    showError('Erro ao revogar convite');
  }
}
```

### Estados da Tela

1. **Loading**: Skeleton loaders para cards
2. **Vazio (sem times)**: Ilustração + mensagem + botão CTA "Convidar Times"
3. **Somente times**: Lista de times sem seção de convites (usuário comum)
4. **Times + convites**: Ambas seções (manager/admin)
5. **Erro**: Mensagem de erro + botão "Tentar novamente"

### Funcionalidades Extras (Opcional)

- Pull to refresh para recarregar dados
- Busca/filtro de times por nome
- Ordenação (alfabética, mais recente, etc)
- Botão "Convidar Time" que abre modal/tela de convite
- Ação de "Remover time da liga" (apenas admin)
- Badge com contador de convites pendentes no header

### Permissões por Role

| Funcionalidade | PLAYER | LEAGUE_MANAGER | ADMIN |
|---------------|--------|----------------|-------|
| Ver times cadastrados | ✅ | ✅ | ✅ |
| Ver convites pendentes | ❌ | ✅ | ✅ |
| Convidar novo time | ❌ | ✅ | ✅ |
| Revogar convite | ❌ | ✅ | ✅ |
| Remover time da liga | ❌ | ❌ | ✅ |

### Tratamento de Erros

- **401 Unauthorized**: Redirecionar para login
- **403 Forbidden**: Exibir apenas times, ocultar convites
- **404 Not Found**: "Liga não encontrada"
- **500 Internal Error**: "Erro no servidor, tente novamente"

### Design System

- Usar componentes: Card, Avatar, Badge, Button, EmptyState
- Cores:
  - Status ativo: verde
  - Status inativo: cinza
  - Status pendente: amarelo/laranja
- Espaçamento: 16px entre cards, 24px entre seções
- Animações: fade in ao carregar, slide ao adicionar/remover

### Testes Sugeridos

- [ ] Carregar tela com times e convites
- [ ] Carregar tela sem times (estado vazio)
- [ ] Carregar tela sem convites pendentes
- [ ] Revogar convite com sucesso
- [ ] Erro ao carregar dados
- [ ] Pull to refresh
- [ ] Verificar permissões por role
