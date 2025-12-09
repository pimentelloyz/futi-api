# Endpoint: Listar Ligas de um Time

## GET /api/teams/:id/leagues

Retorna todas as ligas que um time específico está participando.

### Autenticação
✅ Requer: `Authorization: Bearer {JWT_TOKEN}`

### Parâmetros de Rota
- `id` (string, obrigatório): ID do time

### Resposta de Sucesso (200 OK)

```json
[
  {
    "id": "ef2f17f5-8965-4a3e-8060-ffac99de532d",
    "name": "Copa Futi 2025",
    "slug": "copa-futi-2025",
    "icon": "https://storage.googleapis.com/...",
    "banner": "https://storage.googleapis.com/...",
    "description": "Campeonato anual de futebol",
    "isPublic": true
  },
  {
    "id": "a1b2c3d4-...",
    "name": "Liga Regional",
    "slug": "liga-regional",
    "icon": null,
    "banner": null,
    "description": null,
    "isPublic": false
  }
]
```

### Respostas de Erro

**400 Bad Request**
```json
{
  "message": "invalid team id"
}
```

**401 Unauthorized**
```json
{
  "error": "unauthorized"
}
```

**404 Not Found**
```json
{
  "message": "team not found"
}
```

### Exemplo de Uso

#### CURL
```bash
curl -X GET "http://localhost:3000/api/teams/{TEAM_ID}/leagues" \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

#### Flutter/Dart
```dart
final response = await dio.get(
  '/api/teams/$teamId/leagues',
  options: Options(
    headers: {'Authorization': 'Bearer $jwtToken'},
  ),
);

if (response.statusCode == 200) {
  final leagues = (response.data as List)
      .map((json) => League.fromJson(json))
      .toList();
  print('Time participa de ${leagues.length} ligas');
}
```

### Casos de Uso

1. **Verificar participação em liga específica**
   ```dart
   final leagues = await getTeamLeagues(teamId);
   final isInLeague = leagues.any((l) => l.id == leagueId);
   ```

2. **Listar todas as competições do time**
   ```dart
   final leagues = await getTeamLeagues(teamId);
   // Exibir lista de ligas na UI
   ```

3. **Filtrar ligas públicas/privadas**
   ```dart
   final leagues = await getTeamLeagues(teamId);
   final publicLeagues = leagues.where((l) => l.isPublic).toList();
   ```

### Notas Técnicas

- Retorna array vazio `[]` se o time não participa de nenhuma liga
- A ordem é alfabética por nome da liga
- Apenas ligas ativas são retornadas
- Endpoint não requer role específica, apenas autenticação JWT
