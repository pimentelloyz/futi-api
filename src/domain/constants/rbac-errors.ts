export const RBAC_ERRORS = {
  // 401 - Não autenticado
  UNAUTHORIZED: {
    code: 'UNAUTHORIZED',
    message: 'Você precisa estar autenticado para acessar este recurso',
    statusCode: 401,
  },

  // 403 - Sem permissão
  FORBIDDEN: {
    code: 'FORBIDDEN',
    message: 'Você não tem permissão para acessar este recurso',
    statusCode: 403,
  },

  // 403 - Role insuficiente
  INSUFFICIENT_ROLE: {
    code: 'INSUFFICIENT_ROLE',
    message: 'Sua função atual não permite esta ação',
    statusCode: 403,
  },

  // 403 - Fora do contexto
  WRONG_CONTEXT: {
    code: 'WRONG_CONTEXT',
    message: 'Você não tem permissão neste contexto (time/liga)',
    statusCode: 403,
  },

  // 403 - Somente leitura
  READ_ONLY_ROLE: {
    code: 'READ_ONLY_ROLE',
    message: 'Sua função permite apenas visualização',
    statusCode: 403,
    hint: 'Contate um MANAGER ou ADMIN para realizar esta ação',
  },

  // 404 - Recurso não encontrado
  RESOURCE_NOT_FOUND: {
    code: 'RESOURCE_NOT_FOUND',
    message: 'Recurso não encontrado ou você não tem acesso',
    statusCode: 404,
  },

  // 400 - Contexto inválido
  INVALID_CONTEXT: {
    code: 'INVALID_CONTEXT',
    message: 'Contexto inválido: especifique teamId ou leagueId',
    statusCode: 400,
  },
} as const;

export type RBACErrorCode = keyof typeof RBAC_ERRORS;
