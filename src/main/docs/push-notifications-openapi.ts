/**
 * Componentes OpenAPI compartilhados para Push Notifications
 * Estes endpoints estão disponíveis para todos os níveis de acesso
 */

export const pushNotificationComponents = {
  schemas: {
    RegisterPushTokenRequest: {
      type: 'object',
      required: ['token', 'platform'],
      properties: {
        token: {
          type: 'string',
          description: 'Token FCM do dispositivo',
          example: 'fBZdYq_kTL2-P7hX8K9mN3pQ...',
        },
        platform: {
          type: 'string',
          enum: ['ios', 'android', 'web'],
          description: 'Plataforma do dispositivo',
          example: 'android',
        },
      },
    },
    DeletePushTokenRequest: {
      type: 'object',
      required: ['token'],
      properties: {
        token: {
          type: 'string',
          description: 'Token FCM a ser deletado',
          example: 'fBZdYq_kTL2-P7hX8K9mN3pQ...',
        },
      },
    },
    DeleteAllPushTokensResponse: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          example: true,
        },
        tokensDeleted: {
          type: 'number',
          description: 'Quantidade de tokens deletados',
          example: 3,
        },
      },
    },
    SubscribeToTopicRequest: {
      type: 'object',
      required: ['topic'],
      properties: {
        topic: {
          type: 'string',
          description: 'Nome do tópico (ex: league_{leagueId}, team_{teamId})',
          example: 'league_cm3w5xyz789',
        },
      },
    },
    UnsubscribeFromTopicRequest: {
      type: 'object',
      required: ['topic'],
      properties: {
        topic: {
          type: 'string',
          description: 'Nome do tópico',
          example: 'league_cm3w5xyz789',
        },
      },
    },
    TopicActionResponse: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          example: true,
        },
      },
    },
  },
};

export const pushNotificationPaths = {
  '/api/users/me/push-tokens': {
    post: {
      tags: ['Push Notifications'],
      summary: 'Registrar token FCM',
      description: 'Registra ou atualiza o token FCM do dispositivo atual',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/RegisterPushTokenRequest' },
          },
        },
      },
      responses: {
        204: {
          description: 'Token registrado com sucesso',
        },
        400: {
          description: 'Dados inválidos',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: { type: 'string', example: 'Dados inválidos' },
                  details: { type: 'array', items: { type: 'object' } },
                },
              },
            },
          },
        },
        401: {
          description: 'Não autorizado',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: { type: 'string', example: 'Não autorizado' },
                },
              },
            },
          },
        },
      },
    },
    delete: {
      tags: ['Push Notifications'],
      summary: 'Deletar token FCM específico',
      description: 'Remove um token FCM específico do usuário (útil no logout)',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/DeletePushTokenRequest' },
          },
        },
      },
      responses: {
        204: {
          description: 'Token deletado com sucesso',
        },
        404: {
          description: 'Token não encontrado',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: { type: 'string', example: 'Token não encontrado' },
                },
              },
            },
          },
        },
        401: {
          description: 'Não autorizado',
        },
      },
    },
  },
  '/api/users/me/push-tokens/all': {
    delete: {
      tags: ['Push Notifications'],
      summary: 'Deletar todos os tokens FCM',
      description: 'Remove todos os tokens FCM do usuário (logout de todos os dispositivos)',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Tokens deletados com sucesso',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/DeleteAllPushTokensResponse' },
            },
          },
        },
        401: {
          description: 'Não autorizado',
        },
      },
    },
  },
  '/api/topics/subscribe': {
    post: {
      tags: ['Push Notifications'],
      summary: 'Inscrever em tópico',
      description:
        'Inscreve o usuário em um tópico para receber notificações em massa (ex: liga, time)',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/SubscribeToTopicRequest' },
          },
        },
      },
      responses: {
        200: {
          description: 'Inscrito no tópico com sucesso',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TopicActionResponse' },
            },
          },
        },
        400: {
          description: 'Dados inválidos',
        },
        401: {
          description: 'Não autorizado',
        },
      },
    },
  },
  '/api/topics/unsubscribe': {
    post: {
      tags: ['Push Notifications'],
      summary: 'Desinscrever de tópico',
      description: 'Remove a inscrição do usuário de um tópico',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UnsubscribeFromTopicRequest' },
          },
        },
      },
      responses: {
        200: {
          description: 'Desinscrito do tópico com sucesso',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TopicActionResponse' },
            },
          },
        },
        400: {
          description: 'Dados inválidos',
        },
        401: {
          description: 'Não autorizado',
        },
      },
    },
  },
};
