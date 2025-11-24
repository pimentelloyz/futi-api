import { z } from 'zod';

// DELETE /api/users/push-tokens
export const deletePushTokenSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
});

export type DeletePushTokenInput = z.infer<typeof deletePushTokenSchema>;

export interface DeletePushTokenOutput {
  success: boolean;
}

// DELETE /api/users/push-tokens/all
export interface DeleteAllPushTokensOutput {
  success: boolean;
  tokensDeleted: number;
}
