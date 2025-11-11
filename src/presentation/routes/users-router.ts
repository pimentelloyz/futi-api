import { Router } from 'express';

import { InitUserController } from '../controllers/init-user-controller.js';
import { GetMyUserController } from '../controllers/get-my-user-controller.js';
import { jwtAuth } from '../middlewares/jwt-auth.js';
import { prisma } from '../../infra/prisma/client.js';

export const usersRouter = Router();

// POST /api/users/init - cria/assegura usuário a partir de idToken (e opcionalmente PLAYER)
usersRouter.post('/init', async (req, res) => {
  const controller = new InitUserController();
  const response = await controller.handle({ body: req.body });
  res.status(response.statusCode).json(response.body);
});

// GET /api/users/me - retorna perfil do usuário atual
usersRouter.get('/me', jwtAuth, async (req, res) => {
  const controller = new GetMyUserController();
  const request: import('../protocols/http.js').HttpRequest & { user?: { id: string } } = {};
  request.user = req.user as { id: string } | undefined;
  const response = await controller.handle(request);
  res.status(response.statusCode).json(response.body);
});

// POST /api/users/me/push-tokens - registra token de push do usuário atual
usersRouter.post('/me/push-tokens', jwtAuth, async (req, res) => {
  const meUser = req.user as { id: string } | undefined;
  if (!meUser) return res.status(401).json({ error: 'unauthorized' });
  const { token, platform } = (req.body || {}) as { token?: string; platform?: string };
  if (!token || typeof token !== 'string') return res.status(400).json({ error: 'invalid_token' });
  try {
    await prisma.userPushToken.upsert({
      where: { userId_token: { userId: meUser.id, token } },
      update: { platform: platform ?? null },
      create: { userId: meUser.id, token, platform: platform ?? null },
    });
    return res.status(204).send();
  } catch (e) {
    console.error('[user_push_token_error]', (e as Error).message);
    return res.status(500).json({ error: 'internal_error' });
  }
});
