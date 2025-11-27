# Geração Automática de Grupos

## 🎯 Objetivo

Automatizar a criação de grupos quando o usuário seleciona um formato de liga (ex: Copa do Mundo), reduzindo de 8 chamadas manuais para 1 chamada automática.

---

## 📋 Como Funciona

### **Fluxo Anterior (Manual)**
```
1. Usuário cria liga com formato "Copa do Mundo"
2. Usuário chama POST /api/leagues/:id/groups 8 vezes:
   - Grupo A
   - Grupo B
   - Grupo C
   - ...
   - Grupo H
```
**Total: 8 chamadas manuais**

### **Fluxo Novo (Automático)**
```
1. Usuário cria liga com formato "Copa do Mundo"
2. Usuário chama POST /api/leagues/:id/generate-groups 1 vez
3. Sistema cria automaticamente os 8 grupos (A-H)
4. Usuário pode adicionar/remover grupos pelo front se necessário
```
**Total: 1 chamada automática** ✨

---

## 🚀 Endpoint

### **POST `/api/leagues/:leagueId/generate-groups`**

Gera grupos automaticamente baseado no formato da liga.

#### **Autenticação**
Requer: `LEAGUE_MANAGER` ou `ADMIN`

#### **Request Body**
```json
{
  "count": 8,              // Opcional: número de grupos (usa default do formato)
  "namingPattern": "LETTER" // "LETTER" (A,B,C...) ou "NUMBER" (1,2,3...)
}
```

#### **Response (201 Created)**
```json
{
  "leagueId": "uuid",
  "groups": [
    { "id": "uuid1", "name": "A" },
    { "id": "uuid2", "name": "B" },
    { "id": "uuid3", "name": "C" },
    { "id": "uuid4", "name": "D" },
    { "id": "uuid5", "name": "E" },
    { "id": "uuid6", "name": "F" },
    { "id": "uuid7", "name": "G" },
    { "id": "uuid8", "name": "H" }
  ],
  "message": "8 groups created successfully"
}
```

#### **Erros**
- `400` - `FORMAT_NOT_CONFIGURED`: Formato da liga não configurado
- `401` - `Unauthorized`: Usuário não autenticado
- `403` - `UNAUTHORIZED`: Usuário não tem permissão (precisa ser LEAGUE_MANAGER ou ADMIN)
- `404` - `LEAGUE_NOT_FOUND`: Liga não encontrada
- `409` - `GROUPS_ALREADY_EXIST`: Grupos já existem (deletar antes de gerar novos)

---

## 📊 Defaults por Formato

O sistema usa quantidades padrão baseadas no formato:

| Formato | Grupos Default | Pattern |
|---------|---------------|---------|
| Copa do Mundo | 8 | A, B, C, D, E, F, G, H |
| Champions League | 8 | A, B, C, D, E, F, G, H |
| Libertadores | 8 | A, B, C, D, E, F, G, H |
| Estadual | 4 | A, B, C, D |
| Rachão | 2 | A, B |
| Copa do Brasil | 0 | *(mata-mata direto)* |
| Brasileirão | 0 | *(pontos corridos)* |

> **Nota**: Se o formato não usa grupos, retorna `{ groups: [], message: "This format does not use groups" }`

---

## 🎨 Naming Patterns

### **LETTER** (Padrão)
```
A, B, C, D, E, F, G, H, I, J, K, L...
```
Ideal para: Copas internacionais, Champions, Libertadores

### **NUMBER**
```
Grupo 1, Grupo 2, Grupo 3, Grupo 4...
```
Ideal para: Campeonatos estaduais, regionais

---

## 💡 Exemplos de Uso

### **Exemplo 1: Copa do Mundo (Default)**
```bash
POST /api/leagues/liga-id-123/generate-groups
Content-Type: application/json
Authorization: Bearer <token>

{}  # Body vazio usa defaults do formato
```

**Resultado**: Cria 8 grupos (A-H)

---

### **Exemplo 2: Champions League (Custom Count)**
```bash
POST /api/leagues/liga-id-456/generate-groups
Content-Type: application/json
Authorization: Bearer <token>

{
  "count": 4,
  "namingPattern": "LETTER"
}
```

**Resultado**: Cria 4 grupos (A-D)

---

### **Exemplo 3: Estadual (Naming Pattern NUMBER)**
```bash
POST /api/leagues/liga-id-789/generate-groups
Content-Type: application/json
Authorization: Bearer <token>

{
  "namingPattern": "NUMBER"
}
```

**Resultado**: Cria 4 grupos (Grupo 1, Grupo 2, Grupo 3, Grupo 4)

---

## 🔄 Fluxo Completo no Front-end

### **1. Criação da Liga**
```typescript
// Usuário seleciona formato "Copa do Mundo" no formulário
const response = await fetch('/api/leagues', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'Copa FUT7 2026',
    slug: 'copa-fut7-2026',
    formatId: 'copa-do-mundo-format-id',
    matchFormat: 'FUT7',
    startAt: '2026-06-01',
    endAt: '2026-07-15'
  })
});

const league = await response.json();
```

### **2. Geração Automática de Grupos**
```typescript
// Chamada automática após criar a liga
const groupsResponse = await fetch(`/api/leagues/${league.id}/generate-groups`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
  // Body vazio = usa default do formato
});

const { groups } = await groupsResponse.json();
// groups = [{ id: "...", name: "A" }, { id: "...", name: "B" }, ...]
```

### **3. Exibir Grupos no UI**
```tsx
// Componente React
function GroupsList({ leagueId }) {
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    // Buscar grupos criados
    fetch(`/api/leagues/${leagueId}/groups`)
      .then(res => res.json())
      .then(data => setGroups(data));
  }, [leagueId]);

  return (
    <div>
      <h3>Grupos Criados Automaticamente ✨</h3>
      {groups.map(group => (
        <GroupCard key={group.id} group={group} />
      ))}
    </div>
  );
}
```

### **4. Permitir Edição (Adicionar/Remover)**
```tsx
// Adicionar grupo manualmente
async function addGroup() {
  await fetch(`/api/leagues/${leagueId}/groups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'I' })
  });
}

// Remover grupo
async function removeGroup(groupId) {
  await fetch(`/api/leagues/${leagueId}/groups/${groupId}`, {
    method: 'DELETE'
  });
}
```

---

## ✅ Validações

O sistema valida:

1. ✅ Liga existe
2. ✅ Usuário tem permissão (LEAGUE_MANAGER ou ADMIN)
3. ✅ Formato está configurado
4. ✅ Grupos não existem ainda
5. ✅ Naming pattern é válido ("LETTER" ou "NUMBER")
6. ✅ Count é maior que 0

---

## 📈 Benefícios

### **Economia de Tempo**
- **Antes**: 8 chamadas manuais para Copa do Mundo
- **Depois**: 1 chamada automática
- **Economia**: 87.5%

### **Menos Erros**
- Não precisa criar manualmente grupo por grupo
- Nomes consistentes (A, B, C... ou 1, 2, 3...)
- Ordem automática

### **Melhor UX**
- Usuário seleciona formato → Grupos aparecem automaticamente
- Pode ajustar depois se necessário
- Fluxo mais rápido e intuitivo

---

## 🔧 Testando

### **Script de Demonstração**
```bash
npx tsx scripts/demo-auto-generate-groups.ts
```

Este script:
1. Cria uma liga com formato Copa do Mundo
2. Gera automaticamente 8 grupos
3. Exibe os grupos criados
4. Limpa os dados de teste

### **Teste Manual via Insomnia/Postman**
```bash
# 1. Criar liga
POST http://localhost:3000/api/leagues
{
  "name": "Test League",
  "slug": "test-league",
  "formatId": "<copa-do-mundo-format-id>",
  "matchFormat": "FUT7"
}

# 2. Gerar grupos
POST http://localhost:3000/api/leagues/<league-id>/generate-groups
{}

# 3. Verificar grupos
GET http://localhost:3000/api/leagues/<league-id>/groups
```

---

## 📝 Roadmap de Melhorias

### **Fase 2**
- [ ] Distribuição automática de times nos grupos
- [ ] Sorteio com potes (seeding)
- [ ] Restrições (times do mesmo país em grupos diferentes)

### **Fase 3**
- [ ] Geração automática de chaveamento mata-mata
- [ ] Avanço automático de fases

---

## 🔗 Arquivos Relacionados

- **Controller**: `src/presentation/controllers/generate-groups-controller.ts`
- **Use Case**: `src/domain/usecases/generate-groups/generate-groups.usecase.ts`
- **Factory**: `src/main/factories/make-league-controllers.ts`
- **Routes**: `src/presentation/routes/leagues-router.ts`
- **Demo**: `scripts/demo-auto-generate-groups.ts`
- **Seed Formats**: `scripts/seed-formats-only.ts`
