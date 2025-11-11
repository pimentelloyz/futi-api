import { Router } from 'express';

import { GrantAccessController } from '../controllers/grant-access-controller.js';
import { RevokeAccessController } from '../controllers/revoke-access-controller.js';
import { ListMyAccessController } from '../controllers/list-my-access-controller.js';
import { jwtAuth } from '../middlewares/jwt-auth.js';
import { HttpRequest } from '../protocols/http.js';

export const accessRouter = Router();

// Todas as rotas de access exigem JWT
accessRouter.use(jwtAuth);

accessRouter.post('/grant', async (req, res) => {
  const controller = new GrantAccessController();
  const request: HttpRequest & { user?: { id: string } } = { body: req.body };
  request.user = req.user as { id: string } | undefined;
  const response = await controller.handle(request);
  res.status(response.statusCode).json(response.body);
});

accessRouter.post('/revoke', async (req, res) => {
  const controller = new RevokeAccessController();
  const request: HttpRequest & { user?: { id: string } } = { body: req.body };
  request.user = req.user as { id: string } | undefined;
  const response = await controller.handle(request);
  res.status(response.statusCode).json(response.body);
});

accessRouter.get('/me', async (req, res) => {
  const controller = new ListMyAccessController();
  const request: HttpRequest & { user?: { id: string } } = {};
  request.user = req.user as { id: string } | undefined;
  const response = await controller.handle(request);
  res.status(response.statusCode).json(response.body);
});
