import { z } from 'zod';

// POST /api/topics/subscribe
export const subscribeToTopicSchema = z.object({
  topic: z.string().min(1, 'Tópico é obrigatório'),
});

export type SubscribeToTopicInput = z.infer<typeof subscribeToTopicSchema>;

export interface SubscribeToTopicOutput {
  success: boolean;
}

// POST /api/topics/unsubscribe
export const unsubscribeFromTopicSchema = z.object({
  topic: z.string().min(1, 'Tópico é obrigatório'),
});

export type UnsubscribeFromTopicInput = z.infer<typeof unsubscribeFromTopicSchema>;

export interface UnsubscribeFromTopicOutput {
  success: boolean;
}

// POST /api/topics/send (admin only)
export const sendToTopicSchema = z.object({
  topic: z.string().min(1, 'Tópico é obrigatório'),
  title: z.string().min(1, 'Título é obrigatório'),
  body: z.string().min(1, 'Mensagem é obrigatória'),
  data: z.record(z.string(), z.string()).optional(),
  imageUrl: z.string().url({ message: 'URL inválida' }).optional(),
});

export type SendToTopicInput = z.infer<typeof sendToTopicSchema>;

export interface SendToTopicOutput {
  success: boolean;
}
