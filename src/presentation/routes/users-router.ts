import { Router } from 'express';

import { InitUserController } from '../controllers/init-user-controller.js';
import { GetMyUserController } from '../controllers/get-my-user-controller.js';
import { jwtAuth } from '../middlewares/jwt-auth.js';
import { RegisterPushTokenController } from '../controllers/register-push-token-controller.js';

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
  const controller = new RegisterPushTokenController();
  const request: import('../protocols/http.js').HttpRequest & { user?: { id: string } } = {
    body: req.body,
  };
  request.user = req.user as { id: string } | undefined;
  const response = await controller.handle(request);
  if (response.statusCode === 204) return res.status(204).send();
  return res.status(response.statusCode).json(response.body);
});
