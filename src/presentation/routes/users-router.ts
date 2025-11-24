import { Router } from 'express';

import { InitUserController } from '../controllers/init-user-controller.js';
import { GetMyUserController } from '../controllers/get-my-user-controller.js';
import { jwtAuth } from '../middlewares/jwt-auth.js';
import { makeRegisterPushTokenController } from '../../main/factories/make-register-push-token-controller.js';
import {
  makeDeletePushTokenController,
  makeDeleteAllPushTokensController,
} from '../../main/factories/make-delete-push-token-controller.js';

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
  const controller = makeRegisterPushTokenController();
  const request: import('../protocols/http.js').HttpRequest & { user?: { id: string } } = {
    body: req.body,
  };
  request.user = req.user as { id: string } | undefined;
  const response = await controller.handle(request);
  if (response.statusCode === 204) return res.status(204).send();
  return res.status(response.statusCode).json(response.body);
});

// DELETE /api/users/me/push-tokens - deleta token específico do usuário
usersRouter.delete('/me/push-tokens', jwtAuth, async (req, res) => {
  const controller = makeDeletePushTokenController();
  return controller.handle(req, res);
});

// DELETE /api/users/me/push-tokens/all - deleta todos os tokens do usuário
usersRouter.delete('/me/push-tokens/all', jwtAuth, async (req, res) => {
  const controller = makeDeleteAllPushTokensController();
  return controller.handle(req, res);
});
