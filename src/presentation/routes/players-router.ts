import { Router } from 'express';

import { makeAddPlayerController } from '../../main/factories/make-add-player-controller.js';
import { GetMyPlayerController } from '../controllers/get-my-player-controller.js';
import { CreateMyPlayerController } from '../controllers/create-my-player-controller.js';
import { HttpRequest } from '../protocols/http.js';
import { jwtAuth } from '../middlewares/jwt-auth.js';

export const playersRouter = Router();

// Protege todas as rotas de players
playersRouter.use(jwtAuth);

playersRouter.post('/', async (req, res) => {
  const controller = makeAddPlayerController();
  const response = await controller.handle({ body: req.body });
  res.status(response.statusCode).json(response.body);
});

playersRouter.get('/me', async (req, res) => {
  const controller = new GetMyPlayerController();
  const request: HttpRequest & { user?: { id: string } } = {};
  request.user = req.user as { id: string } | undefined; // rely on express augmented type
  const response = await controller.handle(request);
  res.status(response.statusCode).json(response.body);
});

playersRouter.post('/me', async (req, res) => {
  const controller = new CreateMyPlayerController();
  const request: HttpRequest & { user?: { id: string } } = { body: req.body };
  request.user = req.user as { id: string } | undefined;
  const response = await controller.handle(request);
  res.status(response.statusCode).json(response.body);
});
