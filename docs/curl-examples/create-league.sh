#!/bin/bash

# ==============================================================================
# Exemplo de CURL para criar uma liga
# ==============================================================================

# Substitua o token JWT pelo seu token válido
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2Mzk0ODc3NS0xN2NlLTQxNmUtOTY5My04M2RkZGY4ZjFhMTQiLCJ1aWQiOiJYVWhXR1BFSlJ5ZXEyVHB1WlE5S3I4MFNsekcyIiwiaWF0IjoxNzY1MTk2Mjk3LCJleHAiOjE3NjUxOTcxOTd9.Cp266fPc-_JfrdfCjEa1n1wJEFcGxrfuzBr8oWRhK2o"

# ==============================================================================
# OPÇÃO 1: Criar liga SEM imagens (JSON simples - RECOMENDADO PARA TESTES)
# ==============================================================================

curl -X POST http://localhost:3000/api/leagues \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "CTec League",
    "slug": "ctec-league",
    "matchFormat": "FUT7",
    "startAt": "2025-12-08T12:25:00.000Z",
    "endAt": "2026-03-08T12:25:00.000Z",
    "description": "Liga dos funcionarios do CTec",
    "isPublic": true
  }'

# ==============================================================================
# OPÇÃO 2: Criar liga COM imagens (multipart/form-data)
# ==============================================================================

# curl -X POST http://localhost:3000/api/leagues \
#   -H "Authorization: Bearer $TOKEN" \
#   -F "name=CTec League" \
#   -F "slug=ctec-league" \
#   -F "matchFormat=FUT7" \
#   -F "startAt=2025-12-08T12:25:00.000Z" \
#   -F "endAt=2026-03-08T12:25:00.000Z" \
#   -F "description=Liga dos funcionarios do CTec" \
#   -F "isPublic=true" \
#   -F "icon=@/caminho/para/sua/imagem-icon.jpg" \
#   -F "banner=@/caminho/para/sua/imagem-banner.jpg"

# ==============================================================================
# CAMPOS DISPONÍVEIS
# ==============================================================================
# Obrigatórios:
#   - name: Nome da liga
#   - slug: Identificador único (sem espaços, lowercase)
#
# Opcionais:
#   - matchFormat: "FUTSAL" | "FUT7" | "FUT11" (padrão: FUT11)
#   - startAt: Data de início (ISO 8601)
#   - endAt: Data de término (ISO 8601)
#   - description: Descrição da liga
#   - isPublic: true/false (padrão: true)
#   - icon: Arquivo de imagem (apenas em multipart)
#   - banner: Arquivo de imagem (apenas em multipart)
#
# ==============================================================================
# RESPOSTA ESPERADA (201 Created)
# ==============================================================================
# {
#   "id": "uuid-da-liga",
#   "name": "CTec League",
#   "slug": "ctec-league",
#   "matchFormat": "FUT7"
# }
#
# ==============================================================================
# ERROS POSSÍVEIS
# ==============================================================================
# 400 Bad Request: { "message": "name and slug are required" }
# 401 Unauthorized: { "message": "Unauthorized" }
# 409 Conflict: { "message": "slug already exists" }
# 415 Unsupported Media Type: { "error": "UNSUPPORTED_MEDIA_TYPE" }
# 500 Internal Server Error: { "error": "internal_error" }
